import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grokAccessToken, parseExpiry, pickSession, sessionPath, sessionStillValid } from './grokSession';

describe('sesiunea Grok', () => {
  it('citește expirarea scrisă cu nanosecunde', () => {
    expect(parseExpiry('2026-10-14T19:55:45.271663900Z')).toBe(Date.parse('2026-10-14T19:55:45.271Z'));
  });

  it('alege sesiunea care expiră mai târziu și ignoră o înregistrare fără token', () => {
    const picked = pickSession({
      empty: { key: '   ', expires_at: '2026-10-14T20:00:00.000Z' },
      early: { key: 'early-token', expires_at: '2026-10-14T12:00:00.000Z', refresh_token: 'r1', oidc_client_id: 'c1' },
      late: { key: 'late-token', expires_at: '2026-10-14T19:55:45.271663900Z', refresh_token: 'r2', oidc_client_id: 'c2' },
    });
    expect(picked?.key).toBe('late-token');
    expect(picked?.refreshToken).toBe('r2');
    expect(picked?.clientId).toBe('c2');
    expect(sessionStillValid(picked!, Date.parse('2026-10-14T19:50:00.000Z'))).toBe(true);
    expect(sessionStillValid(picked!, Date.parse('2026-10-14T19:55:00.000Z'))).toBe(false);
  });

  it('găsește auth.json în dosarul Grok', () => {
    expect(sessionPath({ GROK_HOME: 'D:\\cont' }, 'C:\\Users\\cineva')).toBe(join('D:\\cont', 'auth.json'));
    expect(sessionPath({}, 'C:\\Users\\cineva')).toBe(join('C:\\Users\\cineva', '.grok', 'auth.json'));
  });

  it('refuză un fișier lipsă și reîmprospătează un token expirat', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'notariat-session-'));
    const file = join(dir, 'auth.json');
    await expect(grokAccessToken(file)).resolves.toBe('');

    writeFileSync(
      file,
      JSON.stringify({
        account: {
          key: 'old-token',
          refresh_token: 'refresh-1',
          oidc_client_id: 'client-1',
          expires_at: '2020-01-01T00:00:00.000Z',
          email: 'pastrat@exemplu',
        },
      }),
    );
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://auth.x.ai/oauth2/token');
      const body = String(init?.body);
      expect(body).toContain('grant_type=refresh_token');
      expect(body).toContain('refresh_token=refresh-1');
      expect(body).toContain('client_id=client-1');
      return new Response(JSON.stringify({ access_token: 'new-token', refresh_token: 'refresh-2', expires_in: 120 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;
    try {
      await expect(grokAccessToken(file)).resolves.toBe('new-token');
    } finally {
      globalThis.fetch = original;
    }
    const saved = JSON.parse(readFileSync(file, 'utf8')) as { account: { key: string; refresh_token: string; email: string } };
    expect(saved.account.key).toBe('new-token');
    expect(saved.account.refresh_token).toBe('refresh-2');
    expect(saved.account.email).toBe('pastrat@exemplu');
  });
});
