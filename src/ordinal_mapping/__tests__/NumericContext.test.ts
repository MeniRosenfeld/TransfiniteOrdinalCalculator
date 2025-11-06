import { describe, it, expect } from 'vitest';
import { DoubleContext, RationalContext } from '../Contexts.js';
import { DoubleNumericValue } from '../DoubleNumericValue.js';
import { RationalNumericValue } from '../RationalNumericValue.js';

describe('DoubleContext', () => {
  const ctx = new DoubleContext();

  describe('Constants', () => {
    it('should provide ZERO constant', () => {
      expect(ctx.ZERO.toNumber()).toBe(0);
      expect(ctx.ZERO).toBe(DoubleNumericValue.ZERO);
    });

    it('should provide ONE constant', () => {
      expect(ctx.ONE.toNumber()).toBe(1);
      expect(ctx.ONE).toBe(DoubleNumericValue.ONE);
    });

    it('should provide TWO constant', () => {
      expect(ctx.TWO.toNumber()).toBe(2);
      expect(ctx.TWO).toBe(DoubleNumericValue.TWO);
    });

    it('should provide POSITIVE_INFINITY constant', () => {
      expect(ctx.POSITIVE_INFINITY.toNumber()).toBe(Infinity);
      expect(ctx.POSITIVE_INFINITY).toBe(DoubleNumericValue.POSITIVE_INFINITY);
    });

    it('should provide NEGATIVE_INFINITY constant', () => {
      expect(ctx.NEGATIVE_INFINITY.toNumber()).toBe(-Infinity);
      expect(ctx.NEGATIVE_INFINITY).toBe(DoubleNumericValue.NEGATIVE_INFINITY);
    });

    it('should provide NaN constant', () => {
      expect(isNaN(ctx.NaN.toNumber())).toBe(true);
    });
  });

  describe('Factory Methods', () => {
    it('should create value from number', () => {
      const value = ctx.fromNumber(3.14);
      expect(value.toNumber()).toBe(3.14);
    });

    it('should create value from integer', () => {
      const value = ctx.fromNumber(42);
      expect(value.toNumber()).toBe(42);
    });

    it('should create value from BigInt', () => {
      const value = ctx.fromBigInt(123456789n);
      expect(value.toNumber()).toBe(123456789);
    });

    it('should parse valid string', () => {
      const value = ctx.parse("2.71828");
      expect(value).toBeDefined();
      expect(value!.toNumber()).toBeCloseTo(2.71828);
    });

    it('should return undefined for invalid string', () => {
      const value = ctx.parse("not a number");
      expect(value).toBeUndefined();
    });

    it('should parseOrThrow valid string', () => {
      const value = ctx.parseOrThrow("1.414");
      expect(value.toNumber()).toBeCloseTo(1.414);
    });

    it('should throw for invalid string in parseOrThrow', () => {
      expect(() => ctx.parseOrThrow("invalid")).toThrow();
    });
  });

  describe('Interval Factory Methods', () => {
    it('should create interval from bounds', () => {
      const interval = ctx.interval(ctx.fromNumber(1), ctx.fromNumber(5));
      expect(interval.lower.toNumber()).toBe(1);
      expect(interval.upper.toNumber()).toBe(5);
    });

    it('should create singleton interval', () => {
      const interval = ctx.singleton(ctx.fromNumber(3));
      expect(interval.isSingleton()).toBe(true);
      expect(interval.lower.toNumber()).toBe(3);
    });

    it('should create empty interval', () => {
      const interval = ctx.emptyInterval();
      expect(interval.isEmpty()).toBe(true);
    });

    it('should create infinite interval', () => {
      const interval = ctx.infiniteInterval();
      expect(interval.isInfinite()).toBe(true);
    });

    it('should create zero interval', () => {
      const interval = ctx.zeroInterval();
      expect(interval.lower.equals(ctx.ZERO)).toBe(true);
      expect(interval.upper.equals(ctx.ZERO)).toBe(true);
    });

    it('should create one interval', () => {
      const interval = ctx.oneInterval();
      expect(interval.lower.equals(ctx.ONE)).toBe(true);
      expect(interval.upper.equals(ctx.ONE)).toBe(true);
    });

    it('should create symmetric interval', () => {
      const interval = ctx.symmetricInterval(ctx.fromNumber(5));
      expect(interval.lower.toNumber()).toBe(-5);
      expect(interval.upper.toNumber()).toBe(5);
    });

    it('should create centered interval', () => {
      const interval = ctx.centeredInterval(ctx.fromNumber(10), ctx.fromNumber(2));
      expect(interval.lower.toNumber()).toBe(8);
      expect(interval.upper.toNumber()).toBe(12);
    });
  });

  describe('Utility Methods', () => {
    it('should convert array of numbers to values', () => {
      const values = ctx.fromNumbers([1, 2, 3]);
      expect(values.length).toBe(3);
      expect(values[0].toNumber()).toBe(1);
      expect(values[2].toNumber()).toBe(3);
    });

    it('should convert array of values to numbers', () => {
      const values = ctx.fromNumbers([1.1, 2.2, 3.3]);
      const numbers = ctx.toNumbers(values);
      expect(numbers).toEqual([1.1, 2.2, 3.3]);
    });

    it('should compute min', () => {
      const a = ctx.fromNumber(5);
      const b = ctx.fromNumber(3);
      const result = ctx.min(a, b);
      expect(result.toNumber()).toBe(3);
    });

    it('should compute max', () => {
      const a = ctx.fromNumber(5);
      const b = ctx.fromNumber(3);
      const result = ctx.max(a, b);
      expect(result.toNumber()).toBe(5);
    });

    it('should clamp value to range', () => {
      const value = ctx.fromNumber(10);
      const min = ctx.fromNumber(2);
      const max = ctx.fromNumber(8);
      const result = ctx.clamp(value, min, max);
      expect(result.toNumber()).toBe(8);
    });

    it('should not clamp value within range', () => {
      const value = ctx.fromNumber(5);
      const min = ctx.fromNumber(2);
      const max = ctx.fromNumber(8);
      const result = ctx.clamp(value, min, max);
      expect(result.toNumber()).toBe(5);
    });

    it('should compute sum of values', () => {
      const values = ctx.fromNumbers([1, 2, 3, 4]);
      const sum = ctx.sum(values);
      expect(sum.toNumber()).toBe(10);
    });

    it('should return ZERO for empty sum', () => {
      const sum = ctx.sum([]);
      expect(sum.equals(ctx.ZERO)).toBe(true);
    });

    it('should compute product of values', () => {
      const values = ctx.fromNumbers([2, 3, 4]);
      const product = ctx.product(values);
      expect(product.toNumber()).toBe(24);
    });

    it('should return ONE for empty product', () => {
      const product = ctx.product([]);
      expect(product.equals(ctx.ONE)).toBe(true);
    });

    it('should create range of values', () => {
      const range = ctx.range(ctx.fromNumber(1), ctx.fromNumber(5), ctx.fromNumber(1));
      expect(range.length).toBe(5);
      expect(range[0].toNumber()).toBe(1);
      expect(range[4].toNumber()).toBe(5);
    });

    it('should create range with fractional step', () => {
      const range = ctx.range(ctx.fromNumber(0), ctx.fromNumber(1), ctx.fromNumber(0.25));
      expect(range.length).toBe(5);
      expect(range[0].toNumber()).toBe(0);
      expect(range[4].toNumber()).toBe(1);
    });

    it('should throw for zero step in range', () => {
      expect(() => ctx.range(ctx.ONE, ctx.TWO, ctx.ZERO)).toThrow("Step cannot be zero");
    });

    it('should perform linear interpolation', () => {
      const a = ctx.fromNumber(0);
      const b = ctx.fromNumber(10);
      const t = ctx.fromNumber(0.5);
      const result = ctx.lerp(a, b, t);
      expect(result.toNumber()).toBe(5);
    });
  });
});

describe('RationalContext', () => {
  const ctx = new RationalContext();

  describe('Constants', () => {
    it('should provide ZERO constant', () => {
      expect(ctx.ZERO.toNumber()).toBe(0);
      expect(ctx.ZERO).toBe(RationalNumericValue.ZERO);
    });

    it('should provide ONE constant', () => {
      expect(ctx.ONE.toNumber()).toBe(1);
      expect(ctx.ONE).toBe(RationalNumericValue.ONE);
    });

    it('should provide TWO constant', () => {
      expect(ctx.TWO.toNumber()).toBe(2);
      expect(ctx.TWO).toBe(RationalNumericValue.TWO);
    });

    it('should provide POSITIVE_INFINITY constant', () => {
      expect(ctx.POSITIVE_INFINITY.equals(RationalNumericValue.POSITIVE_INFINITY)).toBe(true);
    });

    it('should provide NEGATIVE_INFINITY constant', () => {
      expect(ctx.NEGATIVE_INFINITY.equals(RationalNumericValue.NEGATIVE_INFINITY)).toBe(true);
    });
  });

  describe('Factory Methods', () => {
    it('should create value from number', () => {
      const value = ctx.fromNumber(0.5);
      expect(value.toNumber()).toBeCloseTo(0.5);
    });

    it('should create value from integers', () => {
      const value = ctx.fromIntegers(1, 3);
      expect(value.toNumber()).toBeCloseTo(1/3);
    });

    it('should create value from BigInts', () => {
      const value = ctx.fromBigInts(123n, 456n);
      expect(value.equals(RationalNumericValue.fromBigInts(123n, 456n))).toBe(true);
    });

    it('should create value from integer', () => {
      const value = ctx.fromInteger(42);
      expect(value.toNumber()).toBe(42);
    });

    it('should create value from BigInt', () => {
      const value = ctx.fromBigInt(999n);
      expect(value.toNumber()).toBe(999);
    });

    it('should parse integer string', () => {
      const value = ctx.parse("42");
      expect(value).toBeDefined();
      expect(value!.toNumber()).toBe(42);
    });

    it('should parse fraction string', () => {
      const value = ctx.parse("3/4");
      expect(value).toBeDefined();
      expect(value!.toNumber()).toBe(0.75);
    });

    it('should return undefined for invalid string', () => {
      const value = ctx.parse("not a fraction");
      expect(value).toBeUndefined();
    });

    it('should parseOrThrow valid fraction', () => {
      const value = ctx.parseOrThrow("2/3");
      expect(value.toNumber()).toBeCloseTo(2/3);
    });

    it('should throw for invalid string in parseOrThrow', () => {
      expect(() => ctx.parseOrThrow("invalid")).toThrow();
    });
  });

  describe('Interval Factory Methods', () => {
    it('should create interval from rational bounds', () => {
      const lower = ctx.fromIntegers(1, 3);
      const upper = ctx.fromIntegers(2, 3);
      const interval = ctx.interval(lower, upper);
      
      expect(interval.lower.equals(lower)).toBe(true);
      expect(interval.upper.equals(upper)).toBe(true);
    });

    it('should create singleton interval', () => {
      const value = ctx.fromIntegers(3, 4);
      const interval = ctx.singleton(value);
      
      expect(interval.isSingleton()).toBe(true);
      expect(interval.lower.equals(value)).toBe(true);
    });

    it('should create empty interval', () => {
      const interval = ctx.emptyInterval();
      expect(interval.isEmpty()).toBe(true);
    });

    it('should create infinite interval', () => {
      const interval = ctx.infiniteInterval();
      expect(interval.isInfinite()).toBe(true);
    });
  });

  describe('Utility Methods with Exact Arithmetic', () => {
    it('should compute exact sum', () => {
      const third = ctx.fromIntegers(1, 3);
      const values = [third, third, third];
      const sum = ctx.sum(values);
      
      // Should be exactly 1
      expect(sum.equals(ctx.ONE)).toBe(true);
    });

    it('should compute exact product', () => {
      const half = ctx.fromIntegers(1, 2);
      const third = ctx.fromIntegers(1, 3);
      const values = [half, third];
      const product = ctx.product(values);
      
      // Should be exactly 1/6
      expect(product.equals(ctx.fromIntegers(1, 6))).toBe(true);
    });

    it('should perform exact linear interpolation', () => {
      const a = ctx.fromIntegers(0, 1);
      const b = ctx.fromIntegers(1, 1);
      const t = ctx.fromIntegers(1, 2);
      const result = ctx.lerp(a, b, t);
      
      // Should be exactly 1/2
      expect(result.equals(ctx.fromIntegers(1, 2))).toBe(true);
    });

    it('should create exact range', () => {
      const start = ctx.fromIntegers(0, 1);
      const end = ctx.fromIntegers(1, 1);
      const step = ctx.fromIntegers(1, 4);
      const range = ctx.range(start, end, step);
      
      expect(range.length).toBe(5);
      expect(range[0].equals(ctx.fromIntegers(0, 1))).toBe(true);
      expect(range[1].equals(ctx.fromIntegers(1, 4))).toBe(true);
      expect(range[2].equals(ctx.fromIntegers(1, 2))).toBe(true);
      expect(range[3].equals(ctx.fromIntegers(3, 4))).toBe(true);
      expect(range[4].equals(ctx.fromIntegers(1, 1))).toBe(true);
    });
  });

  describe('Comparison with DoubleContext', () => {
    it('should produce same results for simple operations', () => {
      const doubleCtx = new DoubleContext();
      const rationalCtx = new RationalContext();
      
      const doubleSum = doubleCtx.sum(doubleCtx.fromNumbers([1, 2, 3]));
      const rationalSum = rationalCtx.sum([
        rationalCtx.fromInteger(1),
        rationalCtx.fromInteger(2),
        rationalCtx.fromInteger(3)
      ]);
      
      expect(Math.abs(doubleSum.toNumber() - rationalSum.toNumber())).toBeLessThan(1e-10);
    });

    it('should demonstrate exact vs approximate for 1/3', () => {
      const doubleCtx = new DoubleContext();
      const rationalCtx = new RationalContext();
      
      // Double: approximate
      const doubleThird = doubleCtx.fromNumber(1/3);
      const doubleTripled = doubleThird.add(doubleThird).add(doubleThird);
      
      // Rational: exact
      const rationalThird = rationalCtx.fromIntegers(1, 3);
      const rationalTripled = rationalThird.add(rationalThird).add(rationalThird);
      
      // Rational should be exactly 1
      expect(rationalTripled.equals(rationalCtx.ONE)).toBe(true);
      
      // Double will be close but not exact (due to representation)
      const doubleError = Math.abs(doubleTripled.toNumber() - 1.0);
      expect(doubleError).toBeLessThan(1e-10);
    });
  });
});

describe('Context Type Safety', () => {
  it('should maintain type safety between contexts', () => {
    const doubleCtx = new DoubleContext();
    const rationalCtx = new RationalContext();
    
    const doubleValue = doubleCtx.fromNumber(1.5);
    const rationalValue = rationalCtx.fromIntegers(3, 2);
    
    // TypeScript ensures these are different types
    expect(doubleValue).toBeInstanceOf(DoubleNumericValue);
    expect(rationalValue).toBeInstanceOf(RationalNumericValue);
  });
});
