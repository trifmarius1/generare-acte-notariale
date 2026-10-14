const UNITS = ['', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă'];
const TEENS = [
  'zece',
  'unsprezece',
  'doisprezece',
  'treisprezece',
  'paisprezece',
  'cincisprezece',
  'șaisprezece',
  'șaptesprezece',
  'optsprezece',
  'nouăsprezece',
];
const TENS = ['', '', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'];

function under100(n: number, feminine: boolean): string {
  if (n < 10) {
    if (feminine && n === 1) return 'una';
    if (feminine && n === 2) return 'două';
    return UNITS[n];
  }
  if (n < 20) {
    if (feminine && n === 12) return 'douăsprezece';
    return TEENS[n - 10];
  }
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (!unit) return TENS[ten];
  const unitWord = feminine && unit === 2 ? 'două' : UNITS[unit];
  return `${TENS[ten]} și ${unitWord}`;
}

function under1000(n: number, feminine = false): string {
  if (n < 100) return under100(n, feminine);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = hundreds === 1 ? 'o sută' : hundreds === 2 ? 'două sute' : `${UNITS[hundreds]} sute`;
  return rest ? `${head} ${under100(rest, feminine)}` : head;
}

function counted(n: number, one: string, many: string): string {
  if (n === 1) return one;
  const link = needsDe(n) ? ' de ' : ' ';
  return `${under1000(n, true)}${link}${many}`;
}

function integerWords(n: number): string {
  if (n === 0) return 'zero';
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;
  const parts: string[] = [];
  if (billions) parts.push(counted(billions, 'un miliard', 'miliarde'));
  if (millions) parts.push(counted(millions, 'un milion', 'milioane'));
  if (thousands) parts.push(counted(thousands, 'o mie', 'mii'));
  if (rest) parts.push(under1000(rest));
  return parts.join(' ');
}

/** "de" after 20, 30, … and after hundreds/thousands that are not followed by 1–19. */
function needsDe(n: number): boolean {
  if (n < 20) return false;
  const mod100 = n % 100;
  if (mod100 === 0) return true;
  return mod100 >= 20;
}

/**
 * Amount in lei, as used in a draft notarial act.
 * 250000.5 → "două sute cincizeci de mii de lei și cincizeci de bani"
 */
export function leiInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '';
  const rounded = Math.round(amount * 100);
  const lei = Math.floor(rounded / 100);
  const bani = rounded % 100;
  let text = 'zero lei';
  if (lei === 1) text = 'un leu';
  else if (lei > 1) text = `${integerWords(lei)}${needsDe(lei) ? ' de ' : ' '}lei`;
  if (bani) {
    const banNoun = bani === 1 ? 'ban' : 'bani';
    const banLink = needsDe(bani) ? ' de ' : ' ';
    text += ` și ${integerWords(bani)}${banLink}${banNoun}`;
  }
  return text;
}

export function formatLei(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return (
    new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded) + ' lei'
  );
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

const MONTHS = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

export function formatRomanianDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

/** True when `later` is strictly after `earlier` plus `years` calendar years. */
export function isAfterYears(earlierIso: string, laterIso: string, years: number): boolean {
  const earlier = parseIso(earlierIso);
  const later = parseIso(laterIso);
  if (!earlier || !later) return false;
  const limit = new Date(Date.UTC(earlier.y + years, earlier.m - 1, earlier.d));
  const laterDate = new Date(Date.UTC(later.y, later.m - 1, later.d));
  return laterDate.getTime() > limit.getTime();
}

export function daysBetween(earlierIso: string, laterIso: string): number | null {
  const earlier = parseIso(earlierIso);
  const later = parseIso(laterIso);
  if (!earlier || !later) return null;
  const a = Date.UTC(earlier.y, earlier.m - 1, earlier.d);
  const b = Date.UTC(later.y, later.m - 1, later.d);
  return Math.round((b - a) / 86_400_000);
}

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}
