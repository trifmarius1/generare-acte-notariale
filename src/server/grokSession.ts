import { readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TOKEN_URL = 'https://auth.x.ai/oauth2/token';
const SKEW_MS = 60_000;

interface StoredSession {
  key: string;
  refreshToken: string;
  clientId: string;
  expiresAt: number;
  recordKey: string;
}

export function sessionPath(env: NodeJS.ProcessEnv = process.env, home = homedir()): string {
  const root = env.GROK_HOME?.trim() || join(home, '.grok');
  return join(root, 'auth.json');
}

/** Grok scrie fracțiuni mai lungi decât milisecundele. `Date.parse` nu le acceptă pe toate. */
export function parseExpiry(value: string): number {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(value.trim());
  if (!match) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const fraction = (match[2] ?? '0').slice(0, 3).padEnd(3, '0');
  const parsed = Date.parse(`${match[1]}.${fraction}Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function pickSession(raw: unknown): StoredSession | null {
  if (!raw || typeof raw !== 'object') return null;
  let best: StoredSession | null = null;
  for (const [recordKey, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as Record<string, unknown>;
    const key = typeof entry.key === 'string' ? entry.key.trim() : '';
    if (!key) continue;
    const expiresAt = typeof entry.expires_at === 'string' ? parseExpiry(entry.expires_at) : 0;
    const candidate: StoredSession = {
      key,
      refreshToken: typeof entry.refresh_token === 'string' ? entry.refresh_token : '',
      clientId: typeof entry.oidc_client_id === 'string' ? entry.oidc_client_id : '',
      expiresAt,
      recordKey,
    };
    if (!best || candidate.expiresAt > best.expiresAt) best = candidate;
  }
  return best;
}

export function sessionStillValid(session: StoredSession, now = Date.now()): boolean {
  return session.expiresAt > now + SKEW_MS;
}

function readRaw(file: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writeRaw(file: string, raw: Record<string, unknown>) {
  const temporary = `${file}.notariat-tmp`;
  writeFileSync(temporary, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  const backup = `${file}.notariat-bak`;
  try {
    renameSync(file, backup);
  } catch {
    unlinkSync(temporary);
    throw new Error('auth-busy');
  }
  try {
    renameSync(temporary, file);
  } catch (error) {
    try {
      renameSync(backup, file);
    } catch {
      // Copia de rezervă rămâne lângă fișierul original.
    }
    throw error;
  }
  try {
    unlinkSync(backup);
  } catch {
    // Rezerva se poate șterge la următoarea reîmprospătare.
  }
}

async function refresh(file: string, raw: Record<string, unknown>, session: StoredSession): Promise<string> {
  if (!session.refreshToken || !session.clientId) return '';
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: session.clientId,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return '';
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') return '';
  const body = payload as Record<string, unknown>;
  const access = typeof body.access_token === 'string' ? body.access_token.trim() : '';
  if (!access) return '';
  const refreshToken = typeof body.refresh_token === 'string' && body.refresh_token.trim() ? body.refresh_token.trim() : session.refreshToken;
  const expiresIn = Number(body.expires_in);
  const lifetime = Number.isFinite(expiresIn) && expiresIn > 30 ? expiresIn : 3600;
  const current = raw[session.recordKey];
  if (!current || typeof current !== 'object') return access;
  raw[session.recordKey] = {
    ...(current as Record<string, unknown>),
    key: access,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + lifetime * 1000).toISOString(),
  };
  try {
    writeRaw(file, raw);
  } catch {
    // Tokenul nou rămâne doar pentru cererea aceasta dacă fișierul este blocat.
  }
  return access;
}

let pending: Promise<string> | null = null;

/** Tokenul sesiunii Grok, citit doar pe server. Nu se copiază în program și nu ajunge în browser. */
export function grokAccessToken(file = sessionPath(), forceRefresh = false): Promise<string> {
  if (pending && !forceRefresh) return pending;
  const run = load(file, forceRefresh).finally(() => {
    if (pending === run) pending = null;
  });
  pending = run;
  return run;
}

async function load(file: string, forceRefresh: boolean): Promise<string> {
  const raw = readRaw(file);
  if (!raw) return '';
  const session = pickSession(raw);
  if (!session) return '';
  if (!forceRefresh && sessionStillValid(session)) return session.key;
  try {
    return await refresh(file, raw, session);
  } catch {
    return '';
  }
}
