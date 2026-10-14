import { isAfterYears, roundMoney } from './money';

/**
 * Impozit pe transferul proprietăților imobiliare din patrimoniul personal.
 * Codul fiscal (Legea nr. 227/2015), art. 111, astfel cum a fost modificat prin OG nr. 16/2022:
 * 3% dacă deținerea este de până la 3 ani inclusiv, 1% dacă deținerea este mai mare de 3 ani.
 * Baza nu coboară sub valoarea minimă din studiul de piață al camerei notarilor.
 * Scutirea de 450.000 lei a fost eliminată de la 1 ianuarie 2023.
 * Verificat la 14 octombrie 2026. Cotele nu au fost modificate de pachetul fiscal privind TVA din 2025–2026.
 */

export type TransferExemption =
  | 'none'
  | 'donatie-rude'
  | 'reconstituire'
  | 'desfiintare-retroactiva'
  | 'dare-in-plata'
  | 'posesie-carte-funciara';

export interface TransferTaxInput {
  declaredValue: number;
  gridValue: number;
  acquiredOn: string;
  transferredOn: string;
  exemption: TransferExemption;
  /** Teren agricol extravilan cumpărat și revândut înainte de 8 ani, când Legea nr. 17/2014 impune impozitul special. */
  law17Special?: { purchaseGrid: number; saleGrid: number };
}

export interface TransferTaxResult {
  base: number;
  rate: number;
  tax: number;
  holding: 'sub-3-ani' | 'peste-3-ani' | 'necunoscut';
  exempt: boolean;
  exemptionNote: string;
  specialTax80: number | null;
  notes: string[];
}

const EXEMPTION_NOTES: Record<TransferExemption, string> = {
  none: '',
  'donatie-rude':
    'Art. 111 alin. (2) din Codul fiscal: nu se datorează impozit la dobândirea prin donație între soți sau între rude și afini până la gradul III inclusiv. O vânzare ulterioară nu moștenește scutirea.',
  reconstituire:
    'Art. 111 alin. (2): nu se datorează impozit când terenurile și construcțiile sunt dobândite prin reconstituirea dreptului de proprietate în temeiul legilor speciale.',
  'desfiintare-retroactiva':
    'Art. 111 alin. (2): nu se datorează impozit când actul de transfer este desființat cu efect retroactiv.',
  'dare-in-plata':
    'Art. 111 alin. (2): o singură operațiune de dare în plată a unui imobil, în scopul rambursării creditului, în condițiile normelor metodologice.',
  'posesie-carte-funciara':
    'Art. 111 alin. (2): notarea posesiei și intabularea ulterioară în condițiile art. 13 și 41 din Legea nr. 7/1996.',
};

export function transferTax(input: TransferTaxInput): TransferTaxResult {
  const declared = Math.max(0, input.declaredValue);
  const grid = Math.max(0, input.gridValue);
  const base = Math.max(declared, grid);
  const notes: string[] = [
    'Impozitul se calculează la valoarea din act, dar nu sub valoarea minimă din studiul de piață. Nu se scade creditul, comisionul sau prețul de cumpărare.',
    'Persoanele juridice nu datorează acest impozit. Operațiunile repetate de cumpărare și revânzare pot fi activitate economică, inclusiv din perspectiva TVA.',
  ];

  if (input.exemption !== 'none') {
    return {
      base,
      rate: 0,
      tax: 0,
      holding: holdingOf(input.acquiredOn, input.transferredOn),
      exempt: true,
      exemptionNote: EXEMPTION_NOTES[input.exemption],
      specialTax80: special80(input),
      notes,
    };
  }

  const holding = holdingOf(input.acquiredOn, input.transferredOn);
  if (holding === 'necunoscut') {
    notes.push('Completați data dobândirii și data actului. La exact 3 ani se aplică încă 3% („până la 3 ani inclusiv”).');
  }
  const rate = holding === 'peste-3-ani' ? 0.01 : 0.03;
  notes.push(
    holding === 'peste-3-ani'
      ? 'Deținere mai mare de 3 ani: 1% (art. 111 alin. (1) lit. b).'
      : 'Deținere de până la 3 ani inclusiv, sau perioadă neprecizată: 3% (art. 111 alin. (1) lit. a).',
  );
  if (grid > declared && grid > 0) {
    notes.push('Valoarea din grilă este mai mare decât prețul declarat. Baza de calcul este valoarea din grilă.');
  }

  return {
    base,
    rate,
    tax: roundMoney(base * rate),
    holding,
    exempt: false,
    exemptionNote: '',
    specialTax80: special80(input),
    notes,
  };
}

function holdingOf(acquiredOn: string, transferredOn: string): TransferTaxResult['holding'] {
  if (!acquiredOn || !transferredOn) return 'necunoscut';
  return isAfterYears(acquiredOn, transferredOn, 3) ? 'peste-3-ani' : 'sub-3-ani';
}

function special80(input: TransferTaxInput): number | null {
  if (!input.law17Special) return null;
  const gain = input.law17Special.saleGrid - input.law17Special.purchaseGrid;
  if (gain <= 0) return 0;
  return roundMoney(gain * 0.8);
}

export interface SuccessionTaxInput {
  deathOn: string;
  finalizedOn: string;
  netImmovable: number;
}

export interface SuccessionTaxResult {
  due: boolean;
  tax: number;
  note: string;
}

/**
 * Art. 111 alin. (3) Cod fiscal: transmisiunea prin moștenire nu se impozitează dacă succesiunea
 * este dezbătută și finalizată în 2 ani de la deces. După acest termen, impozitul este 1%
 * asupra valorii imobilelor (activul net imobiliar, potrivit normelor metodologice).
 * Legea nr. 170/2026 a scutit doar succesiunile finalizate până la 30 septembrie 2026 inclusiv,
 * dacă termenul de 2 ani se împlinea între 14 iulie și 30 septembrie 2026. De la 1 octombrie 2026
 * se aplică din nou regula de 2 ani.
 */
export function successionTax(input: SuccessionTaxInput): SuccessionTaxResult {
  const base = Math.max(0, input.netImmovable);
  if (!input.deathOn || !input.finalizedOn) {
    return {
      due: false,
      tax: 0,
      note: 'Completați data decesului și data finalizării. Termenul de scutire este de 2 ani de la deces și se socotește până la finalizare, nu până la deschiderea dosarului.',
    };
  }
  const late = isAfterYears(input.deathOn, input.finalizedOn, 2);
  if (!late) {
    return {
      due: false,
      tax: 0,
      note: 'Succesiunea este finalizată în termen de 2 ani de la deces. Art. 111 alin. (3) din Codul fiscal: nu se datorează impozitul de 1%.',
    };
  }
  if (input.finalizedOn <= '2026-09-30' && input.deathOn >= '2024-07-14' && input.deathOn <= '2024-09-30') {
    return {
      due: false,
      tax: 0,
      note: 'Legea nr. 170/2026: scutire punctuală pentru succesiunile finalizate până la 30 septembrie 2026, al căror termen de 2 ani se împlinea între 14 iulie și 30 septembrie 2026. Nu se mai aplică finalizărilor de după 30 septembrie 2026.',
    };
  }
  return {
    due: true,
    tax: roundMoney(base * 0.01),
    note: 'Succesiunea este finalizată după 2 ani de la deces. Impozit 1% asupra activului net imobiliar. Bunurile mobile nu intră în această bază. Scutirea temporară din Legea nr. 170/2026 a încetat la 1 octombrie 2026.',
  };
}
