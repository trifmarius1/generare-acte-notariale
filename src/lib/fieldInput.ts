import type { MessageKey } from '@/i18n';
import { amount } from '@/modules/document';

export type EntryKind = 'digits' | 'letters' | 'money' | 'name' | 'code' | 'place' | 'share' | 'measure' | 'phrase' | 'free';

const MONEY_PREFIX =
  /^(?:\d{0,15}|\d{1,3}(?:\.\d{3}){0,4}(?:,\d{0,2})?|\d{1,3}(?:\.\d{3}){0,4}\.|\d{1,15},\d{0,2}|\d{1,15}\.\d{0,2})$/;

/** Which characters a field may keep. Checkbox `pret` never reaches this: callers pass type. */
export function entryKind(key: string): EntryKind {
  const k = key.toLowerCase();
  if (k.endsWith('ciserie')) return 'letters';
  if (k.includes('cnp') || k.endsWith('cinr') || k === 'degree' || k === 'numerator' || k === 'denominator') return 'digits';
  if (
    k === 'pret' ||
    k === 'grila' ||
    k === 'avans' ||
    k === 'declared' ||
    k === 'grid' ||
    k === 'purchasegrid' ||
    k === 'salegrid' ||
    k === 'estate' ||
    k === 'value' ||
    k === 'amount' ||
    k.includes('pret') ||
    k.includes('suma') ||
    k === 'valoare'
  ) {
    return 'money';
  }
  if (
    k === 'domdefunct' ||
    k.includes('domicil') ||
    k.includes('adres') ||
    k.includes('judet') ||
    k === 'uat' ||
    k === 'locact' ||
    k === 'circumscription' ||
    k === 'oras' ||
    k === 'localitate'
  ) {
    return 'place';
  }
  if (
    k.endsWith('nume') ||
    k.endsWith('name') ||
    k.includes('prenume') ||
    k === 'defunct' ||
    k === 'executor' ||
    k === 'beneficiary'
  ) {
    return 'name';
  }
  if (k === 'cf' || k === 'license' || k === 'cadastral' || k.includes('cadastr') || k.endsWith('ci')) return 'code';
  if (k === 'vcota' || k.endsWith('cota')) return 'share';
  if (k === 'suprafata' || k.includes('suprafata') || k === 'area') return 'measure';
  if (
    k.endsWith('stare') ||
    k === 'durata' ||
    k === 'calitate' ||
    k === 'efect' ||
    k === 'label' ||
    k === 'title' ||
    k === 'chamber' ||
    k === 'search'
  ) {
    return 'phrase';
  }
  return 'free';
}

function digitLimit(key: string): number {
  const k = key.toLowerCase();
  if (k.includes('cnp')) return 13;
  if (k.endsWith('cinr')) return 6;
  if (k === 'degree') return 2;
  return 4;
}

function keepSeries(value: string): string {
  return value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
}

function keepMoney(value: string): string {
  const raw = value.replace(/[^\d.,]/g, '');
  let out = '';
  for (const ch of raw) {
    const next = out + ch;
    let digits = 0;
    for (const item of next) if (item >= '0' && item <= '9') digits += 1;
    if (digits > 15) continue;
    if (MONEY_PREFIX.test(next)) out = next;
  }
  return out;
}

function keepName(value: string): string {
  return value
    .replace(/[^\p{L}\p{M}\s'’\-.,()]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .slice(0, 180);
}

function keepCode(value: string): string {
  return value.replace(/[^\p{L}\p{M}\d\s./\-]/gu, '').slice(0, 64);
}

function keepPlace(value: string): string {
  return value.replace(/[^\p{L}\p{M}\d\s,.\-/()'’]/gu, '').slice(0, 240);
}

function keepShare(value: string): string {
  return value.replace(/[^\d/\s]/g, '').replace(/[ \t]{2,}/g, ' ').slice(0, 24);
}

function keepMeasure(value: string): string {
  return value.replace(/[^\p{L}\p{M}\d\s,./\-²³]/gu, '').slice(0, 48);
}

function keepPhrase(value: string): string {
  return value.replace(/[^\p{L}\p{M}\d\s,.\-/()'’„”":;]/gu, '').slice(0, 400);
}

export function keepEntry(key: string, value: string): string {
  switch (entryKind(key)) {
    case 'digits':
      return value.replace(/\D/g, '').slice(0, digitLimit(key));
    case 'letters':
      return keepSeries(value);
    case 'money':
      return keepMoney(value);
    case 'name':
      return keepName(value);
    case 'code':
      return keepCode(value);
    case 'place':
      return keepPlace(value);
    case 'share':
      return keepShare(value);
    case 'measure':
      return keepMeasure(value);
    case 'phrase':
      return keepPhrase(value);
    default:
      return value;
  }
}

/** Text fields are filtered. Dates, lists, checkboxes and free paragraphs stay as typed. */
export function keepForField(field: { key: string; type: string }, value: string): string {
  if (field.type !== 'text') return value;
  return keepEntry(field.key, value);
}

export function hintForKey(key: string): MessageKey | null {
  const kind = entryKind(key);
  if (kind === 'letters') return 'hintSeries';
  if (kind === 'digits') {
    const k = key.toLowerCase();
    if (k.includes('cnp')) return 'hintCnp';
    if (k.endsWith('cinr')) return 'hintIdNo';
    return 'hintDigits';
  }
  if (kind === 'money') return 'hintMoney';
  if (kind === 'name') return 'hintName';
  if (kind === 'code') return 'hintCode';
  if (kind === 'place') return 'hintPlace';
  if (kind === 'share') return 'hintShare';
  if (kind === 'measure') return 'hintMeasure';
  if (kind === 'phrase') return 'hintPhrase';
  return null;
}

export function moneyToNumber(raw: string): number {
  const kept = keepEntry('amount', raw);
  return amount({ amount: kept }, 'amount') ?? 0;
}
