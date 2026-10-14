/** Două căutări oficiale, apoi fragmentul se recitesc pe pagina deschisă. */

export const SEARCH_PASS_DOMAINS = {
  1: ['legislatie.just.ro', 'monitoruloficial.ro', 'cdep.ro', 'senat.ro', 'just.ro'],
  2: ['legislatie.just.ro', 'monitoruloficial.ro', 'anaf.ro', 'iccj.ro', 'onrc.ro'],
} as const;

const OFFICIAL_HOSTS = new Set([
  'legislatie.just.ro',
  'monitoruloficial.ro',
  'just.ro',
  'anaf.ro',
  'static.anaf.ro',
  'iccj.ro',
  'scj.ro',
  'cdep.ro',
  'senat.ro',
  'onrc.ro',
  'portal.just.ro',
]);

export type LawStatus = 'in-force' | 'abrogated' | 'amended' | 'unknown';

export interface LegalFindingView {
  act: string;
  article: string;
  alineat: string;
  status: LawStatus;
  quote: string;
  url: string;
  solution: string;
  seenTwice: boolean;
}

export interface LegalSuccess {
  ok: true;
  answer: string;
  findings: LegalFindingView[];
  sources: string[];
  dropped: number;
  monitorReadable: boolean;
  monitorCited: boolean;
  pass1Opened: number;
  pass2Opened: number;
}

export interface LegalFailure {
  ok: false;
  error: 'upstream' | 'unconfirmed';
}

interface RawFinding {
  act: string;
  article: string;
  alineat: string;
  status: LawStatus;
  quote: string;
  url: string;
  solution: string;
}

export interface SearchHit {
  text: string;
  citations: string[];
}

export interface LegalDeps {
  search(pass: 1 | 2, input: string): Promise<SearchHit>;
  readPage(url: string): Promise<string | null>;
}

const STATUSES = new Set<LawStatus>(['in-force', 'abrogated', 'amended', 'unknown']);

export function officialUrl(value: string): URL | null {
  const trimmed = value.trim().replace(/[),.;]+$/, '');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === 'http:') {
    try {
      url = new URL(trimmed.replace(/^http:/i, 'https:'));
    } catch {
      return null;
    }
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  if (!OFFICIAL_HOSTS.has(host)) return null;
  url.hash = '';
  return url;
}

export function sameOfficialPage(left: URL, right: URL): boolean {
  const host = (value: string) => value.toLowerCase().replace(/^www\./, '');
  const path = (value: string) => value.replace(/\/+$/, '') || '/';
  return host(left.hostname) === host(right.hostname) && path(left.pathname) === path(right.pathname);
}

export function citationUrls(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const urls: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === 'string') urls.push(value);
  };
  if (Array.isArray(root.citations)) root.citations.forEach(push);
  const output = Array.isArray(root.output) ? root.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const action = record.action;
    if (action && typeof action === 'object') {
      const sources = (action as Record<string, unknown>).sources;
      if (Array.isArray(sources)) {
        for (const source of sources) {
          if (source && typeof source === 'object') push((source as Record<string, unknown>).url);
        }
      }
    }
    const content = Array.isArray(record.content) ? record.content : [];
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const annotations = (block as Record<string, unknown>).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const note of annotations) {
        if (note && typeof note === 'object') push((note as Record<string, unknown>).url);
      }
    }
  }
  return urls;
}

export function outputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const root = payload as Record<string, unknown>;
  if (typeof root.output_text === 'string' && root.output_text.trim()) return root.output_text;
  const parts: string[] = [];
  const output = Array.isArray(root.output) ? root.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const record = block as Record<string, unknown>;
      if (record.type === 'output_text' && typeof record.text === 'string') parts.push(record.text);
    }
  }
  return parts.join('\n');
}

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** În Monitor și pe legislatie.just.ro articolul apare „1.650”, nu „1650”. */
function canonicalArticle(value: string): string {
  const stripped = value.replace(/^(?:articolul|art\.?)\s*/i, '').replace(/\s+/g, '');
  const match = /^(\d{1,3}(?:\.\d{3})+|\d{1,4})(?:\^(\d{1,2}))?$/.exec(stripped);
  if (!match) return '';
  const digits = match[1].replace(/\./g, '');
  if (digits.length < 1 || digits.length > 4) return '';
  return match[2] ? `${digits}^${match[2]}` : digits;
}

export function parseFindings(text: string): RawFinding[] {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { findings?: unknown }).findings)) return [];
  const list = (parsed as { findings: unknown[] }).findings;
  const findings: RawFinding[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const status = STATUSES.has(record.status as LawStatus) ? (record.status as LawStatus) : 'unknown';
    const article = canonicalArticle(clean(record.article, 16));
    if (!article) continue;
    const quote = clean(record.quote, 320);
    if (quote.length < 40 || quote.includes('...') || quote.includes('…')) continue;
    const url = officialUrl(clean(record.url, 400));
    if (!url) continue;
    findings.push({
      act: clean(record.act, 160),
      article,
      alineat: clean(record.alineat, 40),
      status,
      quote,
      url: url.toString(),
      solution: clean(record.solution, 400),
    });
    if (findings.length === 6) break;
  }
  return findings;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, digits: string) => {
      const code = Number(digits);
      return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&[a-z]+;/gi, ' ');
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[„”"«»']/g, '')
    .replace(/[ăâ]/g, 'a')
    .replace(/î/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function extractArticleText(html: string, article: string): string {
  const digits = article.replace(/\^.*$/, '');
  if (!/^\d{1,4}$/.test(digits)) return '';
  const dotted = digits.length > 3 ? `${digits.slice(0, -3)}.${digits.slice(-3)}` : digits;
  const forms = dotted === digits ? [digits] : [dotted.replace(/\./g, '\\.'), digits];
  const visible = html.replace(/<span\b[^>]*display:\s*none[^>]*>[^<]*<\/span>/gi, ' ');
  const text = htmlToText(visible).replace(/\s+/g, ' ').trim();
  const head = new RegExp(`(?:Articolul|Art\\.)\\s+(?:${forms.join('|')})(?!\\d)`, 'gi');
  for (const found of text.matchAll(head)) {
    const rest = text.slice((found.index ?? 0) + found[0].length);
    const next = rest.search(/\bArticolul\s+\d/i);
    if (next >= 0 && next < 40) continue;
    const body = (next > 0 ? rest.slice(0, next) : rest).replace(/\s+/g, ' ').trim().slice(0, 500).trim();
    if (body.length < 40 || body.includes('...') || body.includes('…')) continue;
    return body;
  }
  return '';
}

export function pageConfirms(html: string, quote: string): { abrogated: boolean } | null {
  const page = fold(htmlToText(html));
  const needle = fold(quote);
  if (needle.length < 40) return null;
  const at = page.indexOf(needle);
  if (at < 0) return null;
  const window = page.slice(Math.max(0, at - 500), at + needle.length + 200);
  return { abrogated: window.includes('abrogat') };
}

function askedArticles(question: string): string[] {
  const found: string[] = [];
  for (const match of question.matchAll(/\bart(?:icolul|\.)?\s*(\d{1,3}(?:\.\d{3})+|\d{1,4})\b/gi)) {
    const article = canonicalArticle(match[1] ?? '');
    if (article && !found.includes(article)) found.push(article);
  }
  return found.slice(0, 2);
}

function pageTitle(html: string): string {
  const match = /<title[^>]*>([^<]{1,200})/i.exec(html);
  return match ? clean(htmlToText(match[1]), 160) : '';
}

function articleMentions(text: string): string[] {
  return [...text.matchAll(/\bart(?:icolul|\.)?\s*(\d{1,4})/gi)].map((match) => match[1] ?? '');
}

function solutionFor(solution: string, article: string): string {
  if (!solution) return '';
  const mentioned = articleMentions(solution);
  if (mentioned.some((number) => number !== article)) return '';
  return solution;
}

function statusLabel(status: LawStatus): string {
  if (status === 'in-force') return 'În vigoare pe fragmentul recitit.';
  if (status === 'abrogated') return 'Abrogat: cuvântul apare lângă fragmentul recitit.';
  if (status === 'amended') return 'Modificat. Fragmentul recitit este cel de pe pagină.';
  return 'Starea de abrogare nu este scrisă lângă fragment.';
}

function compose(input: {
  findings: LegalFindingView[];
  dropped: number;
  monitorReadable: boolean;
  monitorCited: boolean;
}): string {
  const lines = [
    'Întrebarea a fost căutată de două ori înainte de acest text. Prima căutare a deschis pagini de pe legislatie.just.ro, Monitorul Oficial, Camera Deputaților și Senat. A doua căutare a reluat legislatie.just.ro și Monitorul Oficial, apoi ANAF, Înalta Curte de Casație și Justiție și ONRC.',
    'Rămân numai fragmentele găsite, fără întrerupere, în pagina oficială recitită după a doua căutare.',
  ];
  if (!input.monitorReadable) {
    lines.push(
      input.monitorCited
        ? 'O adresă a Monitorului Oficial a apărut la căutare, dar textul ei nu a putut fi recitit aici. Numărul Monitorului nu este completat din memorie.'
        : 'Monitorul Oficial nu a deschis textul acestui răspuns. Numărul Monitorului nu este completat din memorie.',
    );
  }
  if (input.dropped > 0) {
    lines.push(
      `${input.dropped} propuneri nu au rămas, pentru că fragmentul nu se află pe pagina oficială deschisă.`,
    );
  }
  if (input.findings.length === 0) {
    lines.push('Niciun articol nu a rămas. Pentru această întrebare nu există un fragment confirmat pe o pagină deschisă.');
  }
  for (const finding of input.findings) {
    const alineat = finding.alineat ? `, alin. ${finding.alineat}` : '';
    const twice = finding.seenTwice
      ? 'Aceeași pagină a fost deschisă și la prima căutare.'
      : 'Pagina a fost deschisă la a doua căutare.';
    const parts = [
      `${finding.act || 'Actul deschis'}, art. ${finding.article}${alineat}. ${statusLabel(finding.status)} ${twice}`,
      `Fragment: „${finding.quote}”`,
    ];
    if (finding.solution) parts.push(`Aplicare la act: ${finding.solution}`);
    parts.push(finding.url);
    lines.push(parts.join(' '));
  }
  lines.push('Aplicarea la actul din fața notarului rămâne la notar. Acest text este informare, nu înscris autentic.');
  return lines.join('\n');
}

function officialList(values: string[]): URL[] {
  const urls: URL[] = [];
  for (const value of values) {
    const url = officialUrl(value);
    if (!url) continue;
    if (urls.some((item) => sameOfficialPage(item, url))) continue;
    urls.push(url);
  }
  return urls;
}

function isMonitor(url: string): boolean {
  return officialUrl(url)?.hostname.replace(/^www\./, '') === 'monitoruloficial.ro';
}

export async function answerLegalQuestion(question: string, deps: LegalDeps): Promise<LegalSuccess | LegalFailure> {
  let first: SearchHit;
  try {
    first = await deps.search(1, `Întrebare de drept românesc. Deschide articolul și alineatul care răspund, inclusiv dacă textul este abrogat. Deschide cel mult două pagini, apoi oprește căutarea.\n\n${question}`);
  } catch {
    return { ok: false, error: 'upstream' };
  }
  let second: SearchHit;
  try {
    second = await deps.search(
      2,
      [
        `Întrebare: ${question}`,
        'Notele de mai jos vin din prima căutare și pot fi greșite. Caută din nou. Deschide cel mult două pagini, apoi oprește căutarea. Păstrează un element numai dacă în această a doua căutare deschizi pagina și copiezi fragmentul de acolo.',
        first.text.slice(0, 8000),
      ].join('\n\n'),
    );
  } catch {
    return { ok: false, error: 'upstream' };
  }

  const pass1 = officialList(first.citations);
  const pass2 = officialList(second.citations);
  const proposed = parseFindings(second.text);
  const findings: LegalFindingView[] = [];
  const pages = new Map<string, string | null>();

  for (const raw of proposed) {
    const url = officialUrl(raw.url);
    if (!url || !pass2.some((item) => sameOfficialPage(item, url))) continue;
    const key = `${url.hostname}${url.pathname}`;
    if (!pages.has(key)) {
      try {
        pages.set(key, await deps.readPage(url.toString()));
      } catch {
        pages.set(key, null);
      }
    }
    const html = pages.get(key);
    if (!html) continue;
    const confirmed = pageConfirms(html, raw.quote);
    if (!confirmed) continue;
    const status: LawStatus = confirmed.abrogated ? 'abrogated' : raw.status === 'abrogated' ? 'unknown' : raw.status;
    findings.push({
      act: raw.act,
      article: raw.article,
      alineat: raw.alineat,
      status,
      quote: raw.quote,
      url: url.toString(),
      solution: solutionFor(raw.solution, raw.article),
      seenTwice: pass1.some((item) => sameOfficialPage(item, url)),
    });
  }

  if (findings.length === 0) {
    const wanted = askedArticles(question);
    const opened = [
      ...pass2,
      ...pass1.filter((url) => !pass2.some((item) => sameOfficialPage(item, url))),
    ].filter((url) => url.hostname.replace(/^www\./, '') === 'legislatie.just.ro' && /detaliidocument/i.test(url.pathname));
    for (const article of wanted) {
      for (const url of opened.slice(0, 3)) {
        const key = `${url.hostname}${url.pathname}`;
        if (!pages.has(key)) {
          try {
            pages.set(key, await deps.readPage(url.toString()));
          } catch {
            pages.set(key, null);
          }
        }
        const html = pages.get(key);
        if (!html) continue;
        const quote = extractArticleText(html, article);
        if (!quote) continue;
        const probe = pageConfirms(html, quote.slice(0, 120));
        findings.push({
          act: pageTitle(html),
          article,
          alineat: '',
          status: probe == null ? 'unknown' : probe.abrogated ? 'abrogated' : 'in-force',
          quote,
          url: url.toString(),
          solution: '',
          seenTwice: pass1.some((item) => sameOfficialPage(item, url)),
        });
        break;
      }
    }
  }

  const sources = [...pass1, ...pass2].map((url) => url.toString());
  const uniqueSources = sources.filter((url, index) => sources.indexOf(url) === index);
  const monitorCited = uniqueSources.some(isMonitor);
  const monitorReadable = findings.some((finding) => isMonitor(finding.url));
  return {
    ok: true,
    answer: compose({ findings, dropped: Math.max(0, proposed.length - findings.length), monitorReadable, monitorCited }),
    findings,
    sources: uniqueSources,
    dropped: Math.max(0, proposed.length - findings.length),
    monitorReadable,
    monitorCited,
    pass1Opened: pass1.length,
    pass2Opened: pass2.length,
  };
}

export const SEARCH_RULES = [
  'Ești un verificator de texte legislative românești. Folosești numai instrumentul de căutare web.',
  'Nu răspunzi din memorie și nu completezi un articol, un alineat, o abrogare sau un număr de Monitor Oficial pe care nu l-ai deschis.',
  'Cauți în orice lege română cerută: civil, procedură civilă, penal, procedură penală, fiscal, procedura fiscală, societăți, Legea nr. 36/1995 și celelalte acte, inclusiv pentru contracte și acte notariale.',
  'Pentru fiecare temei copiezi un fragment continuu, exact cum apare pe pagină, între 40 și 280 de caractere, fără prescurtări.',
  'Răspunsul tău este un singur obiect JSON, fără alt text: {"findings":[{"act":"","article":"","alineat":"","status":"in-force","quote":"","url":"","solution":""}]}.',
  'status este in-force, abrogated, amended sau unknown. solution este o singură frază și nu citează alt articol.',
  'Dacă nu ai deschis pagina, findings este o listă goală.',
].join(' ');
