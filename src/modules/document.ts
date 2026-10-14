import type { ActDocument, ActSection, LegalCitation, OfficeProfile } from '@/domain/types';
import { leiInWords, formatRomanianDate } from '@/lib/money';

export const BLANK = '……';

export function field(values: Record<string, string>, key: string, fallback = BLANK): string {
  const value = values[key]?.trim();
  return value || fallback;
}

export function on(values: Record<string, string>, key: string): boolean {
  const value = values[key]?.trim().toLowerCase();
  return value === 'da' || value === 'true' || value === 'yes' || value === '1';
}

export function amount(values: Record<string, string>, key: string): number | null {
  const raw = values[key]?.trim();
  if (!raw) return null;
  let normalized = raw.replace(/\s/g, '');
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function moneyClause(values: Record<string, string>, key: string): string {
  const value = amount(values, key);
  if (value === null) return BLANK;
  const formatted = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `${formatted} lei (${leiInWords(value)})`;
}

export function dateClause(values: Record<string, string>, key: string): string {
  const raw = values[key]?.trim();
  if (!raw) return BLANK;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? formatRomanianDate(raw) : raw;
}

export function partyBlock(role: string, name: string, cnp: string, idDoc: string, domicile: string, civil: string): string {
  return `${role}: ${name}, identificat/identificată cu ${idDoc}, CNP ${cnp}, domiciliat/domiciliată în ${domicile}, stare civilă: ${civil}.`;
}

/** Cartea de identitate din două câmpuri. Jumătatea lipsă rămâne ……. Un proiect vechi, cu un singur câmp, se tipărește neschimbat. */
export function identityClause(values: Record<string, string>, prefix: string): string {
  const series = values[`${prefix}CiSerie`]?.trim();
  const number = values[`${prefix}CiNr`]?.trim();
  if (series || number) return `C.I. seria ${series || BLANK} nr. ${number || BLANK}`;
  const legacy = values[`${prefix}Ci`]?.trim();
  return legacy || BLANK;
}

/** Citește seria și numărul din „CI seria CJ nr. 100001”. Parantezele goale [___] nu devin valori. */
export function splitIdentityText(raw: string): { series?: string; number?: string } {
  const cleaned = raw.replace(/\[[^\]]*\]/g, ' ');
  const series = cleaned.match(/seria\s+([A-Za-z]{1,2})(?=\s+nr\b)/i)?.[1]?.toUpperCase();
  const number = cleaned.match(/\bnr\.?\s*(\d{1,8})\b/i)?.[1]?.slice(0, 6);
  return {
    series: series || undefined,
    number: number || undefined,
  };
}

/** La redeschiderea unui proiect salvat, mută câmpul unic în serie și număr dacă noile câmpuri sunt goale. */
export function splitStoredIdentity(values: Record<string, string>): Record<string, string> {
  const next = { ...values };
  for (const key of Object.keys(values)) {
    if (!key.endsWith('Ci')) continue;
    const prefix = key.slice(0, -2);
    const seriesKey = `${prefix}CiSerie`;
    const numberKey = `${prefix}CiNr`;
    if (next[seriesKey]?.trim() || next[numberKey]?.trim()) continue;
    const parsed = splitIdentityText(values[key] ?? '');
    if (parsed.series) next[seriesKey] = parsed.series;
    if (parsed.number) next[numberKey] = parsed.number;
  }
  return next;
}

export function officeHeader(office: OfficeProfile): string[] {
  return [
    'ROMÂNIA',
    'UNIUNEA NAȚIONALĂ A NOTARILOR PUBLICI DIN ROMÂNIA',
    office.chamber.trim() || 'Camera Notarilor Publici [●]',
    `BIROUL NOTARULUI PUBLIC ${office.notaryName.trim() || '[numele și prenumele notarului]'}`,
    `Sediul: ${office.address.trim() || '[adresa biroului]'}`,
    `Licența de funcționare nr. ${office.license.trim() || '[●]'}`,
    office.circumscription.trim() ? `Circumscripția: ${office.circumscription.trim()}` : '',
  ].filter(Boolean);
}

const DRAFT_BANNER = [
  'PROIECT DE LUCRU — NU ESTE ÎNSCRIS AUTENTIC',
  'Document de asistență, generat local. Nu ține loc de consimțământ, nu are dată certă și nu se înscrie în cartea funciară. Notarul instrumentator verifică identitatea, capacitatea, consimțământul, proba dreptului și forma consolidată a legii în ziua actului.',
];

export function buildDocument(input: {
  title: string;
  kind: string;
  office: OfficeProfile;
  intro: string[];
  sections: ActSection[];
  closing: string[];
  citations: LegalCitation[];
}): ActDocument {
  const banner = [...officeHeader(input.office), '', ...DRAFT_BANNER];
  const lines = [
    ...banner,
    '',
    input.title,
    '',
    ...input.intro,
    ...input.sections.flatMap((section) => ['', section.heading, ...section.paragraphs]),
    '',
    ...input.closing,
    '',
    'Temeiuri reținute în proiect (se confruntă cu forma consolidată oficială):',
    ...input.citations.map((citation) => `- ${citation.label}. ${citation.note} ${citation.url}`),
  ];
  return {
    title: input.title,
    kind: input.kind,
    banner,
    sections: [{ heading: '', paragraphs: input.intro }, ...input.sections],
    closing: input.closing,
    citations: input.citations,
    plainText: lines.join('\n'),
  };
}
