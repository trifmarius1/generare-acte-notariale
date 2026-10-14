import { describe, expect, it } from 'vitest';
import { Fraction } from './fraction';
import { computeSuccession, type HeirInput, type SuccessionInput } from './succession';

function heir(partial: HeirInput): HeirInput {
  return partial;
}

function base(heirs: HeirInput[], assets: SuccessionInput['assets'] = []): SuccessionInput {
  return {
    deceasedName: 'Pop Andrei',
    deathOn: '2026-01-15',
    finalizedOn: '2026-06-01',
    lastDomicile: 'Cluj-Napoca',
    heirs,
    assets,
    debts: [],
    legacies: [],
    spouseHasAnotherHome: true,
  };
}

function shareOf(result: ReturnType<typeof computeSuccession>, id: string): string {
  return result.heirs.find((heir) => heir.id === id)?.share.toString() ?? 'missing';
}

describe('succesiunea legală', () => {
  it('împarte soțul și un copil cu 1/4 și 3/4', () => {
    const result = computeSuccession(
      base([
        heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
      ]),
    );
    expect(shareOf(result, 's')).toBe('1/4');
    expect(shareOf(result, 'c')).toBe('3/4');
    expect(result.sharesBalanced).toBe(true);
    expect(result.totalReserve.eq(new Fraction(1, 2))).toBe(true);
    expect(result.disposable.eq(new Fraction(1, 2))).toBe(true);
    expect(result.checks.every((check) => check.ok)).toBe(true);
  });

  it('împarte doi copii în mod egal după cota soțului', () => {
    const result = computeSuccession(
      base([
        heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c1', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Maria', kind: 'descendant', status: 'accepts', degree: 1 }),
      ]),
    );
    expect(shareOf(result, 's')).toBe('1/4');
    expect(shareOf(result, 'c1')).toBe('3/8');
    expect(shareOf(result, 'c2')).toBe('3/8');
    expect(result.totalReserve.eq(new Fraction(1, 2))).toBe(true);
  });

  it('reprezintă copilul predecedat pe tulpină și nu reprezintă pe cel care renunță', () => {
    const represented = computeSuccession(
      base([
        heir({ id: 'c1', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Maria', kind: 'descendant', status: 'predeceased', degree: 1 }),
        heir({ id: 'c3', name: 'Vasile', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'g1', name: 'N1', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
        heir({ id: 'g2', name: 'N2', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ]),
    );
    expect(shareOf(represented, 'c1')).toBe('1/3');
    expect(shareOf(represented, 'c3')).toBe('1/3');
    expect(shareOf(represented, 'g1')).toBe('1/6');
    expect(shareOf(represented, 'g2')).toBe('1/6');

    const renounced = computeSuccession(
      base([
        heir({ id: 'c1', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Maria', kind: 'descendant', status: 'renounces', degree: 1 }),
        heir({ id: 'g', name: 'N', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ]),
    );
    expect(shareOf(renounced, 'c1')).toBe('1/1');
    expect(renounced.heirs.some((heir) => heir.id === 'g')).toBe(false);
  });

  it('aduce nepoții pe capete când toți copiii au renunțat', () => {
    const result = computeSuccession(
      base([
        heir({ id: 'c1', name: 'Ion', kind: 'descendant', status: 'renounces', degree: 1 }),
        heir({ id: 'c2', name: 'Maria', kind: 'descendant', status: 'renounces', degree: 1 }),
        heir({ id: 'g1', name: 'N1', kind: 'descendant', status: 'accepts', degree: 2 }),
        heir({ id: 'g2', name: 'N2', kind: 'descendant', status: 'accepts', degree: 2 }),
        heir({ id: 'g3', name: 'N3', kind: 'descendant', status: 'accepts', degree: 2 }),
        heir({ id: 'g4', name: 'N4', kind: 'descendant', status: 'accepts', degree: 2 }),
      ]),
    );
    for (const id of ['g1', 'g2', 'g3', 'g4']) expect(shareOf(result, id)).toBe('1/4');
  });

  it('împarte clasa a II-a cu soț, ambii părinți și doi frați buni', () => {
    const result = computeSuccession(
      base([
        heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'm', name: 'Mama', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'f', name: 'Tata', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'b1', name: 'Frate', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
        heir({ id: 'b2', name: 'Soră', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
      ]),
    );
    expect(shareOf(result, 's')).toBe('1/3');
    expect(shareOf(result, 'm')).toBe('1/6');
    expect(shareOf(result, 'f')).toBe('1/6');
    expect(shareOf(result, 'b1')).toBe('1/6');
    expect(shareOf(result, 'b2')).toBe('1/6');
    expect(result.relativeClass).toBe(2);
  });

  it('dă părintelui unic un sfert din clasa a II-a, nu jumătate', () => {
    const result = computeSuccession(
      base([
        heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'm', name: 'Mama', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'b1', name: 'Frate', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
        heir({ id: 'b2', name: 'Soră', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
      ]),
    );
    expect(shareOf(result, 's')).toBe('1/3');
    expect(shareOf(result, 'm')).toBe('1/6');
    expect(shareOf(result, 'b1')).toBe('1/4');
    expect(shareOf(result, 'b2')).toBe('1/4');
  });

  it('împarte frații pe linii maternă și paternă', () => {
    const result = computeSuccession(
      base([
        heir({ id: 'full', name: 'Bun', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
        heir({ id: 'half', name: 'Consangvin', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'maternal' }),
      ]),
    );
    expect(shareOf(result, 'full')).toBe('3/4');
    expect(shareOf(result, 'half')).toBe('1/4');
  });

  it('înlătură părintele când există un descendent', () => {
    const result = computeSuccession(
      base([
        heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'p', name: 'Tata', kind: 'parent', status: 'accepts', degree: 1 }),
      ]),
    );
    expect(result.relativeClass).toBe(1);
    expect(shareOf(result, 's')).toBe('1/4');
    expect(shareOf(result, 'c')).toBe('3/4');
    expect(result.heirs.some((heir) => heir.id === 'p')).toBe(false);
  });

  it('separă jumătatea de comunitate înainte de cote', () => {
    const result = computeSuccession(
      base(
        [
          heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
          heir({ id: 'c', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
        ],
        [{ id: 'apt', label: 'Apartament', category: 'imobil', regime: 'comun', value: 400_000 }],
      ),
    );
    expect(result.grossEstate).toBe(200_000);
    expect(result.spouseRetainedCommunity).toBe(200_000);
    expect(result.heirs.find((heir) => heir.id === 's')?.estateValue).toBe(50_000);
    expect(result.heirs.find((heir) => heir.id === 'c')?.estateValue).toBe(150_000);
    expect(result.moneyBalanced).toBe(true);
  });

  it('lasă întreaga moștenire soțului singur și semnalează vacanța', () => {
    const alone = computeSuccession(
      base([heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 })]),
    );
    expect(shareOf(alone, 's')).toBe('1/1');
    expect(alone.vacant).toBe(false);

    const vacant = computeSuccession(base([]));
    expect(vacant.vacant).toBe(true);
    expect(vacant.sharesBalanced).toBe(true);
  });

  it('semnalează depășirea cotității disponibile', () => {
    const result = computeSuccession({
      ...base([
        heir({ id: 's', name: 'Ana', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Ion', kind: 'descendant', status: 'accepts', degree: 1 }),
      ]),
      legacies: [{ id: 'l', beneficiary: 'Prieten', numerator: 3, denominator: 4, reservedHeir: false }],
    });
    expect(result.legacyExcess.eq(new Fraction(1, 4))).toBe(true);
    expect(result.checks.find((check) => check.label.startsWith('Liberalitățile'))?.ok).toBe(false);
  });
});
