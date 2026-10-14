import { roundMoney } from './money';

/**
 * Onorarii minimale.
 * Sursă: Ordinul ministrului justiției nr. 177/C/2024, publicat în M. Of. nr. 70/26.01.2024,
 * completat prin Ordinul nr. 2864/C/2024 (M. Of. nr. 19/13.01.2025).
 * Consolidare consultată: forma publică de pe legislatie.just.ro și textul reprodus al anexelor,
 * verificată la 14 octombrie 2026.
 * Onorariul afișat este cel MINIMAL. Notarul poate conveni un onorariu mai mare.
 * TVA nu este inclusă: se aplică doar dacă notarul este înregistrat în scopuri de TVA (cota standard 21% din 1 august 2025).
 */

export interface FeeResult {
  onorariu: number;
  arhivare: number;
  baza: number;
  explicatie: string;
  sursa: string;
}

interface Bracket {
  upTo: number | null;
  base: number;
  rate: number;
  excessOver: number;
  minimum?: number;
}

const IMOBILE: Bracket[] = [
  { upTo: 20_000, base: 0, rate: 0.022, excessOver: 0, minimum: 230 },
  { upTo: 35_000, base: 440, rate: 0.019, excessOver: 20_001 },
  { upTo: 65_000, base: 725, rate: 0.016, excessOver: 35_001 },
  { upTo: 100_000, base: 1_205, rate: 0.015, excessOver: 65_001 },
  { upTo: 200_000, base: 1_705, rate: 0.011, excessOver: 100_001 },
  { upTo: 600_000, base: 2_805, rate: 0.009, excessOver: 200_001 },
  { upTo: null, base: 6_405, rate: 0.006, excessOver: 600_001 },
];

const SUCCESIUNE: Bracket[] = [
  { upTo: 20_000, base: 0, rate: 0.027, excessOver: 0, minimum: 240 },
  { upTo: 35_000, base: 540, rate: 0.019, excessOver: 20_001 },
  { upTo: 65_000, base: 725, rate: 0.016, excessOver: 35_001 },
  { upTo: null, base: 1_205, rate: 0.0085, excessOver: 65_001 },
];

function applyBrackets(value: number, brackets: Bracket[]): number {
  const amount = Math.max(0, value);
  const bracket =
    brackets.find((item) => item.upTo === null || amount <= item.upTo) ?? brackets[brackets.length - 1];
  const raw = bracket.base + bracket.rate * Math.max(0, amount - bracket.excessOver);
  return roundMoney(Math.max(raw, bracket.minimum ?? 0));
}

const SURSA_IMOBIL =
  'OMJ nr. 177/C/2024, anexa nr. 2 pct. I — acte translative și constituire de drepturi reale asupra imobilelor. Arhivare: 45 lei (termen de păstrare permanent).';

const SURSA_SUCCESIUNE =
  'OMJ nr. 177/C/2024, anexa nr. 3 — procedura succesorală. Arhivare: 45 lei (dosar cu termen de păstrare permanent).';

export function feeImobil(value: number): FeeResult {
  return {
    onorariu: applyBrackets(value, IMOBILE),
    arhivare: 45,
    baza: Math.max(0, value),
    explicatie:
      'Onorariu minimal gradual pentru autentificarea actului translativ sau constitutiv de drepturi reale asupra unui imobil, la valoarea declarată, dar nu sub valoarea din studiul de piață al camerei, când norma o impune.',
    sursa: SURSA_IMOBIL,
  };
}

/** Schimbul: grila de la pct. I, la valoarea cea mai mare, majorată cu 35% (anexa nr. 2 pct. II). */
export function feeSchimb(higherValue: number): FeeResult {
  const base = feeImobil(higherValue);
  return {
    ...base,
    onorariu: roundMoney(base.onorariu * 1.35),
    explicatie:
      'Pentru schimbul de imobile, onorariul minimal de la anexa nr. 2 pct. I, calculat la valoarea cea mai mare, se majorează cu 35% (pct. II).',
    sursa: 'OMJ nr. 177/C/2024, anexa nr. 2 pct. I și II.',
  };
}

export function feeSuccesiune(estateValue: number): FeeResult {
  return {
    onorariu: applyBrackets(estateValue, SUCCESIUNE),
    arhivare: 45,
    baza: Math.max(0, estateValue),
    explicatie:
      'Onorariu minimal pentru procedura succesorală, raportat la valoarea masei succesorale. Nu include impozitul prevăzut de Codul fiscal și nici tarifele de publicitate imobiliară.',
    sursa: SURSA_SUCCESIUNE,
  };
}

export interface FixedFee {
  id: string;
  label: string;
  onorariu: number;
  arhivare: number;
  sursa: string;
}

/** Sume determinate, anexa nr. 1. Arhivarea actelor din anexa nr. 1: 20 lei pentru păstrare permanentă. */
export const FIXED_FEES: FixedFee[] = [
  {
    id: 'procura-reprezentare',
    label: 'Procură de reprezentare (înstrăinare, succesiune, bancă, instanță, societăți și alte mandate de același fel)',
    onorariu: 100,
    arhivare: 20,
    sursa: 'Anexa nr. 1 pct. 5.1 și art. 11 alin. (5) din norme. Suma nu depinde de numărul mandanților sau al mandatarilor.',
  },
  {
    id: 'procura-pensie',
    label: 'Procură pentru încasarea pensiei, a ajutorului social, a alocației sau a altor drepturi din legi de protecție',
    onorariu: 8,
    arhivare: 20,
    sursa: 'Anexa nr. 1 pct. 5.2. Reducerile din anexa nr. 5 pot coborî onorariul; nu se cumulează mai multe reduceri.',
  },
  {
    id: 'ong-constituire',
    label: 'Act constitutiv al unei persoane juridice fără scop lucrativ',
    onorariu: 150,
    arhivare: 20,
    sursa: 'Anexa nr. 1 pct. 1.1.',
  },
  {
    id: 'societate-numerar-minim',
    label: 'Act constitutiv de societate, aport în bani la minimul legal, fără aport în natură',
    onorariu: 300,
    arhivare: 20,
    sursa: 'Anexa nr. 1 pct. 2.1. Aportul în natură sau peste minim se calculează pe grilă valorică.',
  },
  {
    id: 'revocare-testament',
    label: 'Declarație de revocare a testamentului',
    onorariu: 50,
    arhivare: 20,
    sursa: 'Anexa nr. 1, autentificarea declarației de revocare de testament.',
  },
];

export function withVat(net: number, vatPayer: boolean, rate = 0.21): { net: number; vat: number; total: number } {
  const vat = vatPayer ? roundMoney(net * rate) : 0;
  return { net: roundMoney(net), vat, total: roundMoney(net + vat) };
}
