import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';
import {
  SEARCH_PASS_DOMAINS,
  SEARCH_RULES,
  answerLegalQuestion,
  citationUrls,
  officialUrl,
  outputText,
} from '../lib/legalAnswer';
import { grokAccessToken } from './grokSession';

const ENDPOINT = 'https://api.x.ai/v1/responses';
const MODEL = 'grok-4.7';

let busy = false;
let envLoaded = false;

function envKey(): string {
  const current = process.env.XAI_API_KEY?.trim() ?? '';
  if (current) return current;
  if (!envLoaded) {
    envLoaded = true;
    const loader = process as unknown as { loadEnvFile?: (path?: string) => void };
    try {
      loader.loadEnvFile?.();
    } catch {
      // Fișierul .env poate lipsi.
    }
  }
  const afterFile = process.env.XAI_API_KEY?.trim() ?? '';
  if (afterFile) return afterFile;
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return loadEnv(mode, process.cwd(), '').XAI_API_KEY?.trim() ?? '';
}

async function credential(): Promise<{ token: string; source: 'key' | 'session' | 'none' }> {
  const key = envKey();
  if (key) return { token: key, source: 'key' };
  try {
    const session = await grokAccessToken();
    if (session) return { token: session, source: 'session' };
  } catch {
    // Contul Grok lipsește sau nu a putut fi reîmprospătat.
  }
  return { token: '', source: 'none' };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('too-long'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function searchPass(pass: 1 | 2, input: string, key: string) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      // grok-4.7 gândește „high” dacă nu se spune altfel și trece de timpul de așteptare.
      // Fragmentul rămâne numai după recitirea paginii oficiale.
      reasoning: { effort: 'low' },
      input: [
        {
          role: 'user',
          content: `${SEARCH_RULES}\n\n${input}`,
        },
      ],
      tools: [
        {
          type: 'web_search',
          filters: { allowed_domains: [...SEARCH_PASS_DOMAINS[pass]] },
        },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (response.status === 401) throw new Error('unauthorized');
  if (!response.ok) {
    console.error(`[legal-agent] http ${response.status}`);
    throw new Error('upstream');
  }
  const payload: unknown = await response.json();
  return { text: outputText(payload), citations: citationUrls(payload) };
}

async function readOfficialPage(target: string): Promise<string | null> {
  let current = officialUrl(target);
  if (!current) return null;
  for (let hop = 0; hop < 3; hop += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'ActeNotariale/0.1 (verificare text legal)',
      },
      signal: AbortSignal.timeout(25_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      current = officialUrl(new URL(location, current).toString());
      if (!current) return null;
      continue;
    }
    if (!response.ok) return null;
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > 8_000_000) return null;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 8_000_000) return null;
    return new TextDecoder('utf-8').decode(buffer);
  }
  return null;
}

async function handle(req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) {
  const path = (req.url ?? '').split('?')[0];
  if (path !== '/api/lege') {
    next();
    return;
  }
  if (req.method === 'GET') {
    const cred = await credential();
    send(res, 200, { configured: cred.token.length > 0, source: cred.source });
    return;
  }
  if (req.method !== 'POST') {
    send(res, 405, { ok: false, error: 'method' });
    return;
  }
  const cred = await credential();
  if (!cred.token) {
    send(res, 503, { ok: false, error: 'unconfigured' });
    return;
  }
  if (busy) {
    send(res, 429, { ok: false, error: 'busy' });
    return;
  }
  let raw = '';
  try {
    raw = await readBody(req, 16_000);
  } catch {
    send(res, 413, { ok: false, error: 'too-long' });
    return;
  }
  let question = '';
  try {
    const body = JSON.parse(raw) as { question?: unknown };
    question = typeof body.question === 'string' ? body.question.trim() : '';
  } catch {
    send(res, 400, { ok: false, error: 'empty' });
    return;
  }
  if (question.length < 8) {
    send(res, 400, { ok: false, error: 'empty' });
    return;
  }
  if (question.length > 4000) {
    send(res, 413, { ok: false, error: 'too-long' });
    return;
  }
  busy = true;
  let token = cred.token;
  let refreshed = false;
  const askOnce = () => answerLegalQuestion(question, {
    search: async (pass, input) => {
      try {
        return await searchPass(pass, input, token);
      } catch (error) {
        if (refreshed || cred.source !== 'session' || !(error instanceof Error) || error.message !== 'unauthorized') throw error;
        refreshed = true;
        const next = await grokAccessToken(undefined, true);
        if (!next) throw error;
        token = next;
        return searchPass(pass, input, token);
      }
    },
    readPage: readOfficialPage,
  });
  try {
    let reply = await askOnce();
    if (reply.ok && reply.findings.length === 0) {
      try {
        const again = await askOnce();
        if (again.ok && again.findings.length > 0) reply = again;
      } catch (error) {
        const name = error instanceof Error ? error.name : 'Error';
        console.error(`[legal-agent] retry ${name}`);
      }
    }
    send(res, reply.ok ? 200 : 502, reply);
  } catch (error) {
    const name = error instanceof Error ? error.name : 'Error';
    console.error(`[legal-agent] ${name}`);
    send(res, 502, { ok: false, error: 'upstream' });
  } finally {
    busy = false;
  }
}

export function legalAgent(): Plugin {
  return {
    name: 'legal-agent',
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}
