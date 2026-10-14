function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Exact rational used for succession quotas. Denominator stays positive. */
export class Fraction {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      throw new Error('Fracția succesorală acceptă doar întregi.');
    }
    if (d === 0) throw new Error('Împărțire la zero.');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static zero(): Fraction {
    return new Fraction(0, 1);
  }

  static one(): Fraction {
    return new Fraction(1, 1);
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.n * other.n, this.d * other.d);
  }

  div(other: Fraction): Fraction {
    return new Fraction(this.n * other.d, this.d * other.n);
  }

  eq(other: Fraction): boolean {
    return this.n === other.n && this.d === other.d;
  }

  isZero(): boolean {
    return this.n === 0;
  }

  isOne(): boolean {
    return this.n === this.d;
  }

  gt(other: Fraction): boolean {
    return this.n * other.d > other.n * this.d;
  }

  toNumber(): number {
    return this.n / this.d;
  }

  toString(): string {
    return `${this.n}/${this.d}`;
  }
}

export function sumFractions(items: Fraction[]): Fraction {
  return items.reduce((acc, item) => acc.add(item), Fraction.zero());
}
