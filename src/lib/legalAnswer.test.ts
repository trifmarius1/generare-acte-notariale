import { describe, expect, it } from 'vitest';
import {
  SEARCH_PASS_DOMAINS,
  answerLegalQuestion,
  citationUrls,
  officialUrl,
  outputText,
  pageConfirms,
  parseFindings,
} from './legalAnswer';

const QUOTE = 'Vanzarea este contractul prin care vanzatorul stramuta cumparatorului proprietatea unui bun.';
const PAGE = `<html><body><p>Art. 1650. ${QUOTE}</p></body></html>`;
const PAGE_URL = 'https://legislatie.just.ro/Public/DetaliiDocument/109884';

function findingJson(extra = ''): string {
  return JSON.stringify({
    findings: [
      {
        act: 'Codul civil',
        article: '1650',
        alineat: '(1)',
        status: 'in-force',
        quote: QUOTE,
        url: PAGE_URL,
        solution: 'La vânzare, art. 1650 cere strămutarea proprietății.',
      },
    ],
  }) + extra;
}

describe('official search limits', () => {
  it('keeps each pass inside five official domains and repeats the gazette', () => {
    for (const pass of [1, 2] as const) {
      const domains = SEARCH_PASS_DOMAINS[pass];
      expect(domains).toHaveLength(5);
      expect(new Set(domains).size).toBe(5);
      expect(domains).toContain('legislatie.just.ro');
      expect(domains).toContain('monitoruloficial.ro');
    }
    expect(SEARCH_PASS_DOMAINS[2]).toContain('anaf.ro');
    expect(SEARCH_PASS_DOMAINS[2]).toContain('iccj.ro');
  });

  it('accepts only official https pages', () => {
    expect(officialUrl('https://legislatie.just.ro/Public/DetaliiDocument/109884')?.hostname).toBe('legislatie.just.ro');
    expect(officialUrl('http://www.monitoruloficial.ro/')).not.toBeNull();
    expect(officialUrl('https://example.com/lege')).toBeNull();
    expect(officialUrl('https://user:pass@legislatie.just.ro/a')).toBeNull();
  });
});

describe('citation extraction', () => {
  it('reads tool citations and ignores a url that exists only in the answer text', () => {
    const urls = citationUrls({
      citations: ['https://legislatie.just.ro/Public/DetaliiDocument/1'],
      output: [
        {
          type: 'web_search_call',
          action: { sources: [{ url: 'https://monitoruloficial.ro/act' }] },
        },
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: 'Vezi https://evil.example/fake',
              annotations: [{ type: 'url_citation', url: 'https://www.anaf.ro/anaf/internet/' }],
            },
          ],
        },
      ],
    });
    expect(urls).toContain('https://legislatie.just.ro/Public/DetaliiDocument/1');
    expect(urls).toContain('https://monitoruloficial.ro/act');
    expect(urls).toContain('https://www.anaf.ro/anaf/internet/');
    expect(urls.some((url) => url.includes('evil.example'))).toBe(false);
  });

  it('reads the message when the top-level text is missing or blank', () => {
    const payload = {
      output_text: '',
      output: [{ type: 'message', content: [{ type: 'output_text', text: '{"findings":[]}' }] }],
    };
    expect(outputText(payload)).toBe('{"findings":[]}');
    expect(outputText({ output_text: 'direct' })).toBe('direct');
  });
});

describe('finding parser', () => {
  it('keeps the article when the official page writes a thousands dot', () => {
    const text = JSON.stringify({
      findings: [
        {
          act: 'Codul civil',
          article: '1.650',
          alineat: '(1)',
          status: 'in-force',
          quote: QUOTE,
          url: PAGE_URL,
          solution: '',
        },
      ],
    });
    expect(parseFindings(text)[0]?.article).toBe('1650');
    expect(parseFindings(text.replace('1.650', 'art. 1650^1'))[0]?.article).toBe('1650^1');
    expect(parseFindings(text.replace('1.650', '16.50'))).toHaveLength(0);
  });
});

describe('page confirmation', () => {
  it('matches a contiguous quote and a decoded diacritic', () => {
    expect(pageConfirms(PAGE, QUOTE)?.abrogated).toBe(false);
    const encoded = '<p>Art. 1650. Vanzarea este contractul prin care vanzatorul str&#259;mut&#259; cumparatorului proprietatea unui bun.</p>';
    expect(pageConfirms(encoded, QUOTE.replace('stramuta', 'strămută'))?.abrogated).toBe(false);
  });

  it('marks abrogated only beside the quote and rejects a shortened quote', () => {
    const abrogated = `<p>Art. 12. (abrogat) ${QUOTE}</p>`;
    expect(pageConfirms(abrogated, QUOTE)?.abrogated).toBe(true);
    expect(pageConfirms(PAGE, 'Vanzarea este contractul…')).toBeNull();
    expect(pageConfirms(PAGE, 'Acest fragment nu apare deloc pe pagina oficiala deschisa acum.')).toBeNull();
  });

  it('parses fenced json and drops an unofficial url', () => {
    const parsed = parseFindings(`note\n\`\`\`json\n${findingJson()}\n\`\`\``);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.article).toBe('1650');
    const foreign = parseFindings(findingJson().replace(PAGE_URL, 'https://example.com/cod'));
    expect(foreign).toHaveLength(0);
  });
});

describe('answerLegalQuestion', () => {
  it('searches twice and keeps a quote only after the official page contains it', async () => {
    const calls: number[] = [];
    const reads: string[] = [];
    const reply = await answerLegalQuestion('Ce este vânzarea în Codul civil?', {
      search: async (pass) => {
        calls.push(pass);
        return {
          text: pass === 2 ? findingJson() : '{"findings":[]}',
          citations: [PAGE_URL, 'https://blog.example/nota'],
        };
      },
      readPage: async (url) => {
        reads.push(url);
        return PAGE;
      },
    });
    expect(calls).toEqual([1, 2]);
    expect(reads).toEqual([PAGE_URL]);
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.findings).toHaveLength(1);
    expect(reply.findings[0]?.seenTwice).toBe(true);
    expect(reply.findings[0]?.solution).toContain('art. 1650');
    expect(reply.answer).toContain('Fragment:');
    expect(reply.sources.some((url) => url.includes('example'))).toBe(false);
  });

  it('drops a solution that cites an article outside the confirmed one', async () => {
    const reply = await answerLegalQuestion('Întrebare despre vânzare și un alt articol.', {
      search: async (pass) => ({
        text: pass === 2 ? findingJson().replace('art. 1650', 'art. 1650 și art. 9999') : '{}',
        citations: [PAGE_URL],
      }),
      readPage: async () => PAGE,
    });
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.findings[0]?.solution).toBe('');
  });

  it('does not keep a url that the second search did not open', async () => {
    let reads = 0;
    const reply = await answerLegalQuestion('Întrebare fără pagină deschisă la a doua căutare.', {
      search: async (pass) => ({
        text: pass === 2 ? findingJson() : '{}',
        citations: pass === 1 ? [PAGE_URL] : ['https://www.anaf.ro/'],
      }),
      readPage: async () => {
        reads += 1;
        return PAGE;
      },
    });
    expect(reads).toBe(0);
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.findings).toHaveLength(0);
    expect(reply.answer).toContain('Niciun articol nu a rămas');
  });

  it('copies the named article from the official page when the model sends no quote', async () => {
    const html = `<title>Codul civil</title>
      <span>Articolul 1649</span> <span>Articolul 1650</span> <span>Articolul 1651</span>
      <span>Articolul 1649</span><span class="S_ART_BDY">Textul articolului anterior este suficient de lung pentru a nu fi luat drept răspuns.</span>
      <span>Articolul 1650</span><span class="S_ART_BDY"><span class="S_PAR">Noţiunea</span><span class="S_LIT_BDY">(1) Vânzarea este contractul prin care vânzătorul transmite proprietatea unui bun în schimbul unui preţ.</span><span class="S_LIT_SHORT" style="display: none"> ... </span><span class="S_LIT_BDY">(2) Poate fi transmis şi un dezmembrământ al dreptului de proprietate.</span></span>
      <span>Articolul 1651</span><span>Următorul articol nu intră în citat şi este doar un marcaj.</span>`;
    const reply = await answerLegalQuestion('Ce prevede articolul 1.650 din Codul civil despre vânzare?', {
      search: async () => ({ text: '{"findings":[]}', citations: [PAGE_URL] }),
      readPage: async () => html,
    });
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.findings).toHaveLength(1);
    expect(reply.findings[0]?.article).toBe('1650');
    expect(reply.findings[0]?.quote).toContain('Vânzarea este contractul');
    expect(reply.findings[0]?.quote).toContain('(2)');
    expect(reply.findings[0]?.quote).not.toContain('1651');
    expect(reply.findings[0]?.quote.includes('...')).toBe(false);
    expect(reply.findings[0]?.status).toBe('in-force');
    expect(reply.findings[0]?.act).toBe('Codul civil');
  });

  it('does not open an article the question did not name', async () => {
    let reads = 0;
    const reply = await answerLegalQuestion('Ce este vânzarea, fără număr de articol?', {
      search: async () => ({ text: '{"findings":[]}', citations: [PAGE_URL] }),
      readPage: async () => {
        reads += 1;
        return '<span>Articolul 1650</span><span>Vânzarea este contractul prin care vânzătorul transmite proprietatea unui bun în schimbul unui preţ convenit.</span>';
      },
    });
    expect(reads).toBe(0);
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.findings).toHaveLength(0);
  });

  it('stops when the first search fails and does not read a page', async () => {
    let second = 0;
    let reads = 0;
    const reply = await answerLegalQuestion('Întrebare care nu ajunge la a doua căutare.', {
      search: async (pass) => {
        if (pass === 1) throw new Error('down');
        second += 1;
        return { text: findingJson(), citations: [PAGE_URL] };
      },
      readPage: async () => {
        reads += 1;
        return PAGE;
      },
    });
    expect(reply).toEqual({ ok: false, error: 'upstream' });
    expect(second).toBe(0);
    expect(reads).toBe(0);
  });

  it('overrides a claimed in-force status when the page says abrogated', async () => {
    const reply = await answerLegalQuestion('Este articolul încă în vigoare?', {
      search: async (pass) => ({
        text: pass === 2 ? findingJson() : '{}',
        citations: [PAGE_URL],
      }),
      readPage: async () => `<p>(abrogat) Art. 1650. ${QUOTE}</p>`,
    });
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.findings[0]?.status).toBe('abrogated');
    expect(reply.answer).toContain('Abrogat');
  });
});
