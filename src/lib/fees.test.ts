import { describe, expect, it } from 'vitest';
import { feeImobil, feeSchimb, feeSuccesiune, withVat } from './fees';

describe('onorarii minimale OMJ 177/C/2024', () => {
  it('aplică minimul de 230 lei sub pragul procentual', () => {
    expect(feeImobil(10_000).onorariu).toBe(230);
    expect(feeImobil(20_000).onorariu).toBe(440);
  });

  it('continuă tranșele de imobile fără salt', () => {
    expect(feeImobil(20_001).onorariu).toBe(440);
    expect(feeImobil(30_000).onorariu).toBe(629.98);
    expect(feeImobil(100_000).onorariu).toBe(1729.99);
    expect(feeImobil(600_001).onorariu).toBe(6405);
  });

  it('majorează schimbul cu 35%', () => {
    expect(feeSchimb(20_000).onorariu).toBe(594);
  });

  it('calculează succesiunea pe anexa nr. 3', () => {
    expect(feeSuccesiune(5_000).onorariu).toBe(240);
    expect(feeSuccesiune(10_000).onorariu).toBe(270);
    expect(feeSuccesiune(100_000).onorariu).toBe(1502.49);
    expect(feeSuccesiune(100_000).arhivare).toBe(45);
  });

  it('adaugă TVA 21% numai la cerere și nu o amestecă în impozit', () => {
    expect(withVat(1000, false)).toEqual({ net: 1000, vat: 0, total: 1000 });
    expect(withVat(1000, true)).toEqual({ net: 1000, vat: 210, total: 1210 });
  });
});
