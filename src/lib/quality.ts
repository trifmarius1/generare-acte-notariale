import { checkCnp } from './cnp';
import { knowledge } from '@/data/knowledge';
import type { ActTemplate } from '@/domain/types';

export interface QualityIssue {
  level: 'error' | 'warn' | 'info';
  message: string;
}

const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const BARE_WORDS: [RegExp, string][] = [
  [/\bmostenitor(?:ul|ii|ilor)?\b/i, 'moștenitor'],
  [/\bvanzator(?:ul|ului)?\b/i, 'vânzător'],
  [/\bcumparator(?:ul|ului)?\b/i, 'cumpărător'],
  [/\bsotul\b/i, 'soțul'],
  [/\bsotia\b/i, 'soția'],
];

export function reviewText(text: string, template?: ActTemplate, values?: Record<string, string>): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (text.includes('[●]') || text.includes('……')) {
    issues.push({ level: 'warn', message: 'Proiectul mai are câmpuri necompletate. Ele sunt marcate cu …… sau [●].' });
  }
  if (text.length > 400 && !DIACRITICS.test(text)) {
    issues.push({
      level: 'warn',
      message: 'Textul nu conține diacritice. Actele notariale se redactează cu ă, â, î, ș și ț.',
    });
  }
  for (const [pattern, suggestion] of BARE_WORDS) {
    if (pattern.test(text)) issues.push({ level: 'warn', message: `Grafie fără diacritice. Forma cerută: „${suggestion}”.` });
  }
  if (/\s{2,}/.test(text)) {
    issues.push({ level: 'info', message: 'Există spații duble. Alinierea finală se face în original.' });
  }
  if (template) {
    for (const marker of template.markers) {
      if (!marker.pattern.test(text)) {
        issues.push({ level: 'error', message: `Lipsește elementul de structură: ${marker.label}.` });
      }
    }
    for (const field of template.fields) {
      if (!field.required) continue;
      const value = values?.[field.key]?.trim();
      if (!value) issues.push({ level: 'error', message: `Câmp obligatoriu necompletat: ${field.label.ro}.` });
      if (field.key.toLowerCase().includes('cnp') && value) {
        const cnp = checkCnp(value);
        if (!cnp.valid) issues.push({ level: 'error', message: `${field.label.ro}: ${cnp.message}` });
      }
    }
  } else {
    for (const match of text.match(/\b[1-8]\d{12}\b/g) ?? []) {
      const cnp = checkCnp(match);
      if (!cnp.valid) issues.push({ level: 'warn', message: `CNP ${match}: ${cnp.message}` });
    }
  }
  if (!issues.length) {
    issues.push({
      level: 'info',
      message: template
        ? 'Structura cerută de model este prezentă. Rămâne verificarea profesională a fondului.'
        : 'Nu am găsit câmpuri goale, CNP invalid sau lipsă de diacritice. Fondul rămâne la notar.',
    });
  }
  return issues;
}

export interface LawHit {
  citation: string;
  title: string;
  url: string;
  known: boolean;
}

export function matchLaws(text: string): LawHit[] {
  const hits: LawHit[] = [];
  const seen = new Set<string>();
  const articles = text.matchAll(/art(?:icolul|\.)\s*(\d{3,4})/gi);
  for (const match of articles) {
    const article = match[1];
    if (seen.has(article)) continue;
    seen.add(article);
    const entry = knowledge.find((item) => item.citation.includes(article) || item.body.includes(`art. ${article}`) || item.body.includes(`art. ${article}`));
    const loose = entry ?? knowledge.find((item) => item.body.includes(article) || item.citation.includes(article));
    hits.push({
      citation: `art. ${article}`,
      title: loose ? loose.title.ro : 'Articol necunoscut în baza locală',
      url: loose?.url ?? 'https://legislatie.just.ro',
      known: Boolean(loose),
    });
  }
  return hits.slice(0, 12);
}

/** Titlul exact pus de generator, pe linie proprie. Un act încărcat cu alt titlu rămâne pe markeri. */
const TITLE_LINE: Record<string, RegExp> = {
  'vanzare-imobil': /^CONTRACT DE VÂNZARE$/m,
  'donatie-imobil': /^CONTRACT DE DONAȚIE$/m,
  procura: /^PROCURĂ$/m,
  antecontract: /^PROMISIUNE BILATERALĂ DE VÂNZARE-CUMPĂRARE$/m,
  intretinere: /^CONTRACT DE ÎNTREȚINERE$/m,
  conventie: /^CONVENȚIE MATRIMONIALĂ$/m,
  testament: /^TESTAMENT$/m,
  acceptare: /^DECLARAȚIE DE ACCEPTARE A MOȘTENIRII$/m,
  renuntare: /^DECLARAȚIE DE RENUNȚARE LA MOȘTENIRE$/m,
};

export function detectTemplate(text: string, catalog: ActTemplate[]): { template: ActTemplate; score: number } | null {
  const normalized = text.toLowerCase();
  let best: { template: ActTemplate; score: number } | null = null;
  for (const template of catalog) {
    let score = 0;
    for (const marker of template.markers) {
      if (marker.pattern.test(normalized) || marker.pattern.test(text)) score += 1;
    }
    if (TITLE_LINE[template.id]?.test(text)) score += 8;
    if (template.id === 'vanzare-imobil' && /v[âa]nzare/.test(normalized) && !/promisiune bilateral|antecontract/.test(normalized)) score += 1;
    if (template.id === 'donatie-imobil' && /dona[țt]/.test(normalized) && !/nu este dona[țt]/.test(normalized)) score += 1;
    if (template.id === 'antecontract' && /promisiun|antecontract/.test(normalized)) score += 4;
    if (template.id === 'renuntare' && /renun[țt]are la mo[șs]tenire|declar că renun[țt]\b/.test(normalized)) score += 2;
    if (template.id === 'testament' && /testament/.test(normalized)) score += 2;
    if (!best || score > best.score) best = { template, score };
  }
  if (!best || best.score < 2) return null;
  return best;
}
