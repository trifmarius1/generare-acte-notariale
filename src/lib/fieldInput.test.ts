import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { amount, identityClause, splitIdentityText, splitStoredIdentity } from '@/modules/document';
import { entryKind, hintForKey, keepEntry, keepForField } from '@/lib/fieldInput';

describe('keepEntry', () => {
  it('keeps only digits in a CNP and stops at 13', () => {
    expect(keepEntry('vCnp', ' 19601011234567xx ')).toBe('1960101123456');
    expect(keepEntry('cnp', '123')).toBe('123');
    expect(entryKind('tCnp')).toBe('digits');
  });

  it('keeps a kinship degree as at most two digits', () => {
    expect(keepEntry('degree', '2e+')).toBe('2');
    expect(keepEntry('degree', '123')).toBe('12');
    expect(keepEntry('numerator', '1/4')).toBe('14');
  });

  it('keeps Romanian and plain money and drops letters', () => {
    expect(keepEntry('pret', '250.000,50 lei')).toBe('250.000,50');
    expect(keepEntry('grila', 'abc')).toBe('');
    expect(keepEntry('avans', '1.500')).toBe('1.500');
    expect(keepEntry('amount', '250000.50')).toBe('250000.50');
    expect(amount({ amount: keepEntry('amount', '250.000,50 lei') }, 'amount')).toBe(250000.5);
  });

  it('does not turn the procura price checkbox into a sum', () => {
    expect(keepForField({ key: 'pret', type: 'checkbox' }, 'da')).toBe('da');
    expect(keepForField({ key: 'pret', type: 'text' }, '100 lei')).toBe('100');
  });

  it('keeps hyphenated names, diacritics and the sample parentheses', () => {
    expect(keepEntry('vNume', 'TRIF MARIUS-COSMIN și TRIF COANA-ADELINA 12')).toBe(
      'TRIF MARIUS-COSMIN și TRIF COANA-ADELINA ',
    );
    expect(keepEntry('deceasedName', 'Pop Andrei (exemplu)')).toBe('Pop Andrei (exemplu)');
    expect(keepEntry('executor', 'O’Connor')).toBe('O’Connor');
    expect(keepEntry('notaryName', 'Ion  Popescu!!')).toBe('Ion Popescu');
  });

  it('keeps cadastral codes and addresses', () => {
    expect(keepEntry('cadastral', '[______]-C1-U12')).toBe('-C1-U12');
    expect(keepEntry('cadastral', '12345-C1-U12')).toBe('12345-C1-U12');
    expect(keepEntry('license', '12/2020')).toBe('12/2020');
    expect(keepEntry('vDomiciliu', 'Mun. Cluj-Napoca, str. Aurel Vlaicu nr. 58')).toBe(
      'Mun. Cluj-Napoca, str. Aurel Vlaicu nr. 58',
    );
    expect(keepEntry('domDefunct', 'Cluj-Napoca (exemplu)')).toBe('Cluj-Napoca (exemplu)');
  });

  it('keeps only letters in the identity series and only digits in the number', () => {
    expect(entryKind('vCiSerie')).toBe('letters');
    expect(entryKind('mCiNr')).toBe('digits');
    expect(keepEntry('vCiSerie', 'kx12')).toBe('KX');
    expect(keepEntry('cCiSerie', 'CJș!')).toBe('CJ');
    expect(keepEntry('tCiSerie', '12')).toBe('');
    expect(keepEntry('vCiNr', '12ab3456789')).toBe('123456');
    expect(keepEntry('cCiNr', 'ab65432199')).toBe('654321');
    expect(hintForKey('vCiSerie')).toBe('hintSeries');
    expect(hintForKey('vCiNr')).toBe('hintIdNo');
    expect(identityClause({ vCiSerie: 'KX', vCiNr: '123456' }, 'v')).toBe('C.I. seria KX nr. 123456');
    expect(identityClause({ vCiSerie: 'KX' }, 'v')).toBe('C.I. seria KX nr. ……');
    expect(identityClause({ vCi: 'CI seria CJ nr 100001' }, 'v')).toBe('CI seria CJ nr 100001');
    expect(identityClause({}, 'v')).toBe('……');
    expect(splitIdentityText('C.I. seria [___] nr. [______]')).toEqual({ series: undefined, number: undefined });
    expect(splitStoredIdentity({ vCi: 'CI seria CJ nr 100001', vNume: 'Pop' })).toMatchObject({
      vCiSerie: 'CJ',
      vCiNr: '100001',
      vNume: 'Pop',
    });
    expect(splitStoredIdentity({ vCiSerie: 'MM', vCi: 'CI seria CJ nr 100001' }).vCiNr).toBeUndefined();
  });

  it('keeps a share, an area and a short civil-status phrase', () => {
    expect(keepEntry('vCota', '1/2 camere')).toBe('1/2 ');
    expect(keepEntry('suprafata', '65,20 mp')).toBe('65,20 mp');
    expect(keepEntry('vStare', 'căsătorit(ă)')).toBe('căsătorit(ă)');
  });

  it('leaves property descriptions and pasted deeds unchanged', () => {
    const deed = 'Imobilul din Str. Aurel Vlaicu nr. 58, art. 2386.';
    expect(keepForField({ key: 'imobil', type: 'textarea' }, deed)).toBe(deed);
    expect(keepEntry('observatii', deed)).toBe(deed);
  });

  it('filters a long paste without getting slow', () => {
    const dirty = 'Ion123 Popescu!!! șță '.repeat(40);
    const start = performance.now();
    for (let i = 0; i < 2000; i += 1) keepEntry('vNume', dirty);
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('button chrome', () => {
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../index.css'), 'utf8');

  it('does not squeeze seal buttons into the logo circle', () => {
    expect(css).not.toContain('font-weight: 650');
    expect(css).not.toMatch(/\.seal\s*\{[^}]*width:\s*36px/);
    expect(css).toContain('white-space: nowrap');
    expect(css).toContain('inline-flex');
    expect(css).toContain('flex: 0 0 auto');
    expect(css).toContain('.btn-row .h2');
    expect(css).toContain('Outfit');
  });
});
