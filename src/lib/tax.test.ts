import { describe, expect, it } from 'vitest';
import { successionTax, transferTax } from './tax';
import { leiInWords } from './money';

describe('impozitul pe transfer și pe succesiune', () => {
  it('aplică 3% până la 3 ani inclusiv și 1% după', () => {
    const early = transferTax({
      declaredValue: 250_000,
      gridValue: 200_000,
      acquiredOn: '2024-10-14',
      transferredOn: '2026-10-14',
      exemption: 'none',
    });
    expect(early.rate).toBe(0.03);
    expect(early.tax).toBe(7500);

    const later = transferTax({
      declaredValue: 250_000,
      gridValue: 0,
      acquiredOn: '2023-10-14',
      transferredOn: '2026-10-15',
      exemption: 'none',
    });
    expect(later.rate).toBe(0.01);
    expect(later.tax).toBe(2500);
  });

  it('nu coboară baza sub grila notarială', () => {
    const result = transferTax({
      declaredValue: 180_000,
      gridValue: 220_000,
      acquiredOn: '2020-01-01',
      transferredOn: '2026-10-14',
      exemption: 'none',
    });
    expect(result.base).toBe(220_000);
    expect(result.tax).toBe(2200);
  });

  it('scutește donația între rude și impozitează succesiunea întârziată', () => {
    const gift = transferTax({
      declaredValue: 300_000,
      gridValue: 300_000,
      acquiredOn: '2020-01-01',
      transferredOn: '2026-10-14',
      exemption: 'donatie-rude',
    });
    expect(gift.tax).toBe(0);
    expect(gift.exempt).toBe(true);

    const onTime = successionTax({ deathOn: '2024-10-14', finalizedOn: '2026-10-14', netImmovable: 300_000 });
    expect(onTime.due).toBe(false);

    const late = successionTax({ deathOn: '2024-10-13', finalizedOn: '2026-10-14', netImmovable: 300_000 });
    expect(late.due).toBe(true);
    expect(late.tax).toBe(3000);
  });

  it('spune sumele în cuvinte pentru draftul de act', () => {
    expect(leiInWords(1)).toBe('un leu');
    expect(leiInWords(21)).toBe('douăzeci și unu de lei');
    expect(leiInWords(250_000)).toBe('două sute cincizeci de mii de lei');
    expect(leiInWords(250_000.5)).toBe('două sute cincizeci de mii de lei și cincizeci de bani');
  });
});
