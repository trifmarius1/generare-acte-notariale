import { Fraction } from './fraction';

const ORDINAL_FEMININE: Record<number, [string, string]> = {
  2: ['jumătate', 'jumătăți'],
  3: ['treime', 'treimi'],
  4: ['pătrime', 'pătrimi'],
  5: ['cincime', 'cincimi'],
  6: ['șesime', 'șesimi'],
  7: ['șeptime', 'șeptimi'],
  8: ['optime', 'optimi'],
  9: ['nouime', 'nouimi'],
  10: ['zecime', 'zecimi'],
  12: ['doisprezecime', 'doisprezecimi'],
  16: ['șaisprezecime', 'șaisprezecimi'],
  18: ['optsprezecime', 'optsprezecimi'],
  24: ['douăzeci și patru', 'douăzeci și patru'],
};

const CARDINAL: Record<number, string> = {
  1: 'o',
  2: 'două',
  3: 'trei',
  4: 'patru',
  5: 'cinci',
  6: 'șase',
  7: 'șapte',
  8: 'opt',
  9: 'nouă',
  10: 'zece',
  11: 'unsprezece',
  12: 'douăsprezece',
};

/** „o pătrime”, „trei optimi”. Pentru numitori neuzuali rămâne fracția cifrică. */
export function fractionInWords(fraction: Fraction): string {
  if (fraction.isZero()) return 'zero';
  if (fraction.isOne()) return 'întreaga moștenire';
  const pair = ORDINAL_FEMININE[fraction.d];
  if (!pair || fraction.n < 1) return fraction.toString();
  if (fraction.n === 1) {
    const article = fraction.d === 2 ? 'o' : 'o';
    return `${article} ${pair[0]}`;
  }
  const count = CARDINAL[fraction.n] ?? String(fraction.n);
  return `${count} ${pair[1]}`;
}

export function quoteShare(fraction: Fraction): string {
  return `${fractionInWords(fraction)} (${fraction.toString()})`;
}
