import { describe, it, expect } from 'vitest';
import { Interval } from '../Interval.js';
import { DoubleNumericValue } from '../DoubleNumericValue.js';
import { RationalNumericValue } from '../RationalNumericValue.js';

describe('Interval with DoubleNumericValue', () => {
  describe('Construction and Factory Methods', () => {
    it('should create interval from bounds', () => {
      const lower = DoubleNumericValue.fromNumber(1);
      const upper = DoubleNumericValue.fromNumber(3);
      const interval = new Interval(lower, upper);
      
      expect(interval.lower.equals(lower)).toBe(true);
      expect(interval.upper.equals(upper)).toBe(true);
    });

    it('should create singleton interval', () => {
      const value = DoubleNumericValue.fromNumber(2);
      const interval = Interval.singleton(value);
      
      expect(interval.isSingleton()).toBe(true);
      expect(interval.lower.equals(value)).toBe(true);
      expect(interval.upper.equals(value)).toBe(true);
    });

    it('should create empty interval when lower > upper', () => {
      const lower = DoubleNumericValue.fromNumber(5);
      const upper = DoubleNumericValue.fromNumber(2);
      const interval = new Interval(lower, upper);
      
      expect(interval.isEmpty()).toBe(true);
    });

    it('should create empty interval via factory', () => {
      const proto = DoubleNumericValue.ZERO;
      const interval = Interval.empty(proto);
      
      expect(interval.isEmpty()).toBe(true);
    });

    it('should create infinite interval', () => {
      const proto = DoubleNumericValue.ZERO;
      const interval = Interval.infinite(proto);
      
      expect(interval.isInfinite()).toBe(true);
      expect(interval.lower.equals(DoubleNumericValue.NEGATIVE_INFINITY)).toBe(true);
      expect(interval.upper.equals(DoubleNumericValue.POSITIVE_INFINITY)).toBe(true);
    });

    it('should create zero interval', () => {
      const proto = DoubleNumericValue.ZERO;
      const interval = Interval.zero(proto);
      
      expect(interval.isSingleton()).toBe(true);
      expect(interval.lower.equals(DoubleNumericValue.ZERO)).toBe(true);
    });

    it('should create one interval', () => {
      const proto = DoubleNumericValue.ZERO;
      const interval = Interval.one(proto);
      
      expect(interval.isSingleton()).toBe(true);
      expect(interval.lower.equals(DoubleNumericValue.ONE)).toBe(true);
    });

    it('should create symmetric interval', () => {
      const radius = DoubleNumericValue.fromNumber(3);
      const interval = Interval.symmetric(radius);
      
      expect(interval.lower.toNumber()).toBe(-3);
      expect(interval.upper.toNumber()).toBe(3);
    });

    it('should throw error for negative radius in symmetric', () => {
      const radius = DoubleNumericValue.fromNumber(-1);
      expect(() => Interval.symmetric(radius)).toThrow("Radius must be non-negative");
    });

    it('should create centered interval', () => {
      const center = DoubleNumericValue.fromNumber(5);
      const radius = DoubleNumericValue.fromNumber(2);
      const interval = Interval.centered(center, radius);
      
      expect(interval.lower.toNumber()).toBe(3);
      expect(interval.upper.toNumber()).toBe(7);
    });

    it('should throw error for negative radius in centered', () => {
      const center = DoubleNumericValue.fromNumber(5);
      const radius = DoubleNumericValue.fromNumber(-1);
      expect(() => Interval.centered(center, radius)).toThrow("Radius must be non-negative");
    });
  });

  describe('Properties and Predicates', () => {
    it('should check if interval is empty', () => {
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      const nonEmpty = new Interval(DoubleNumericValue.ZERO, DoubleNumericValue.ONE);
      
      expect(empty.isEmpty()).toBe(true);
      expect(nonEmpty.isEmpty()).toBe(false);
    });

    it('should check if interval is singleton', () => {
      const singleton = Interval.singleton(DoubleNumericValue.fromNumber(5));
      const nonSingleton = new Interval(DoubleNumericValue.ZERO, DoubleNumericValue.ONE);
      
      expect(singleton.isSingleton()).toBe(true);
      expect(nonSingleton.isSingleton()).toBe(false);
    });

    it('should check if interval is infinite', () => {
      const infinite = Interval.infinite(DoubleNumericValue.ZERO);
      const finite = new Interval(DoubleNumericValue.ZERO, DoubleNumericValue.ONE);
      
      expect(infinite.isInfinite()).toBe(true);
      expect(finite.isInfinite()).toBe(false);
    });

    it('should compute width', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(7));
      const width = interval.width();
      
      expect(width.toNumber()).toBe(5);
    });

    it('should compute midpoint', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(8));
      const midpoint = interval.midpoint();
      
      expect(midpoint.toNumber()).toBe(5);
    });

    it('should return zero width for empty interval', () => {
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      const width = empty.width();
      
      expect(width.toNumber()).toBe(0);
    });

    it('should return zero midpoint for empty interval', () => {
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      const midpoint = empty.midpoint();
      
      expect(midpoint.toNumber()).toBe(0);
    });
  });

  describe('Containment', () => {
    it('should check if value is contained', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      
      expect(interval.contains(DoubleNumericValue.fromNumber(3))).toBe(true);
      expect(interval.contains(DoubleNumericValue.fromNumber(1))).toBe(true);
      expect(interval.contains(DoubleNumericValue.fromNumber(5))).toBe(true);
      expect(interval.contains(DoubleNumericValue.fromNumber(0))).toBe(false);
      expect(interval.contains(DoubleNumericValue.fromNumber(6))).toBe(false);
    });

    it('should check if interval contains another interval', () => {
      const outer = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(10));
      const inner = new Interval(DoubleNumericValue.fromNumber(3), DoubleNumericValue.fromNumber(7));
      const overlapping = new Interval(DoubleNumericValue.fromNumber(5), DoubleNumericValue.fromNumber(15));
      
      expect(outer.containsInterval(inner)).toBe(true);
      expect(outer.containsInterval(overlapping)).toBe(false);
    });

    it('should not contain values when empty', () => {
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      
      expect(empty.contains(DoubleNumericValue.ZERO)).toBe(false);
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add intervals', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(3));
      const i2 = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(4));
      const sum = i1.add(i2);
      
      expect(sum.lower.toNumber()).toBe(3);
      expect(sum.upper.toNumber()).toBe(7);
    });

    it('should subtract intervals', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(5), DoubleNumericValue.fromNumber(8));
      const i2 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(3));
      const diff = i1.subtract(i2);
      
      expect(diff.lower.toNumber()).toBe(2);
      expect(diff.upper.toNumber()).toBe(7);
    });

    it('should multiply intervals with all positive values', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(3));
      const i2 = new Interval(DoubleNumericValue.fromNumber(4), DoubleNumericValue.fromNumber(5));
      const product = i1.multiply(i2);
      
      expect(product.lower.toNumber()).toBe(8);
      expect(product.upper.toNumber()).toBe(15);
    });

    it('should multiply intervals with mixed signs', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(-2), DoubleNumericValue.fromNumber(3));
      const i2 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(4));
      const product = i1.multiply(i2);
      
      expect(product.lower.toNumber()).toBe(-8);
      expect(product.upper.toNumber()).toBe(12);
    });

    it('should multiply intervals with all negative values', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(-3), DoubleNumericValue.fromNumber(-1));
      const i2 = new Interval(DoubleNumericValue.fromNumber(-5), DoubleNumericValue.fromNumber(-2));
      const product = i1.multiply(i2);
      
      expect(product.lower.toNumber()).toBe(2);
      expect(product.upper.toNumber()).toBe(15);
    });

    it('should divide intervals', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(6), DoubleNumericValue.fromNumber(12));
      const i2 = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(3));
      const quotient = i1.divide(i2);
      
      expect(quotient.lower.toNumber()).toBe(2);
      expect(quotient.upper.toNumber()).toBe(6);
    });

    it('should return infinite interval when dividing by interval containing zero', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const i2 = new Interval(DoubleNumericValue.fromNumber(-1), DoubleNumericValue.fromNumber(2));
      const quotient = i1.divide(i2);
      
      expect(quotient.isInfinite()).toBe(true);
    });

    it('should return empty when adding with empty interval', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      
      expect(interval.add(empty).isEmpty()).toBe(true);
      expect(empty.add(interval).isEmpty()).toBe(true);
    });
  });

  describe('Set Operations', () => {
    it('should compute intersection', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const i2 = new Interval(DoubleNumericValue.fromNumber(3), DoubleNumericValue.fromNumber(7));
      const intersection = i1.intersect(i2);
      
      expect(intersection.lower.toNumber()).toBe(3);
      expect(intersection.upper.toNumber()).toBe(5);
    });

    it('should return empty intersection for non-overlapping intervals', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(3));
      const i2 = new Interval(DoubleNumericValue.fromNumber(5), DoubleNumericValue.fromNumber(7));
      const intersection = i1.intersect(i2);
      
      expect(intersection.isEmpty()).toBe(true);
    });

    it('should compute union (hull)', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(3));
      const i2 = new Interval(DoubleNumericValue.fromNumber(5), DoubleNumericValue.fromNumber(7));
      const union = i1.union(i2);
      
      expect(union.lower.toNumber()).toBe(1);
      expect(union.upper.toNumber()).toBe(7);
    });

    it('should handle union with empty interval', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      
      expect(interval.union(empty).equals(interval)).toBe(true);
      expect(empty.union(interval).equals(interval)).toBe(true);
    });
  });

  describe('Unary Operations', () => {
    it('should negate interval', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(5));
      const negated = interval.negate();
      
      expect(negated.lower.toNumber()).toBe(-5);
      expect(negated.upper.toNumber()).toBe(-2);
    });

    it('should compute absolute value for positive interval', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(5));
      const abs = interval.abs();
      
      expect(abs.lower.toNumber()).toBe(2);
      expect(abs.upper.toNumber()).toBe(5);
    });

    it('should compute absolute value for negative interval', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(-5), DoubleNumericValue.fromNumber(-2));
      const abs = interval.abs();
      
      expect(abs.lower.toNumber()).toBe(2);
      expect(abs.upper.toNumber()).toBe(5);
    });

    it('should compute absolute value for interval containing zero', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(-3), DoubleNumericValue.fromNumber(5));
      const abs = interval.abs();
      
      expect(abs.lower.toNumber()).toBe(0);
      expect(abs.upper.toNumber()).toBe(5);
    });
  });

  describe('Equality and String Representation', () => {
    it('should check equality', () => {
      const i1 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const i2 = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const i3 = new Interval(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(5));
      
      expect(i1.equals(i2)).toBe(true);
      expect(i1.equals(i3)).toBe(false);
    });

    it('should consider empty intervals equal', () => {
      const e1 = Interval.empty(DoubleNumericValue.ZERO);
      const e2 = new Interval(DoubleNumericValue.fromNumber(5), DoubleNumericValue.fromNumber(2));
      
      expect(e1.equals(e2)).toBe(true);
    });

    it('should convert to string', () => {
      const interval = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const str = interval.toString();
      
      expect(str).toBe('[1, 5]');
    });

    it('should show empty interval in string', () => {
      const empty = Interval.empty(DoubleNumericValue.ZERO);
      const str = empty.toString();
      
      expect(str).toBe('[empty]');
    });
  });

  describe('Cloning', () => {
    it('should clone interval', () => {
      const original = new Interval(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(5));
      const cloned = original.clone();
      
      expect(cloned.equals(original)).toBe(true);
      expect(cloned).not.toBe(original);
    });
  });
});

describe('Interval with RationalNumericValue', () => {
  describe('Construction and Basic Operations', () => {
    it('should create interval from rational bounds', () => {
      const lower = RationalNumericValue.fromIntegers(1, 3);
      const upper = RationalNumericValue.fromIntegers(2, 3);
      const interval = new Interval(lower, upper);
      
      expect(interval.lower.equals(lower)).toBe(true);
      expect(interval.upper.equals(upper)).toBe(true);
    });

    it('should create singleton rational interval', () => {
      const value = RationalNumericValue.fromIntegers(3, 4);
      const interval = Interval.singleton(value);
      
      expect(interval.isSingleton()).toBe(true);
    });

    it('should handle exact arithmetic in addition', () => {
      // [1/3, 1/2] + [1/6, 1/4] = [1/2, 3/4]
      const i1 = new Interval(
        RationalNumericValue.fromIntegers(1, 3),
        RationalNumericValue.fromIntegers(1, 2)
      );
      const i2 = new Interval(
        RationalNumericValue.fromIntegers(1, 6),
        RationalNumericValue.fromIntegers(1, 4)
      );
      const sum = i1.add(i2);
      
      expect(sum.lower.equals(RationalNumericValue.fromIntegers(1, 2))).toBe(true);
      expect(sum.upper.equals(RationalNumericValue.fromIntegers(3, 4))).toBe(true);
    });

    it('should handle exact arithmetic in subtraction', () => {
      // [1/2, 3/4] - [1/6, 1/4] = [1/4, 7/12]
      const i1 = new Interval(
        RationalNumericValue.fromIntegers(1, 2),
        RationalNumericValue.fromIntegers(3, 4)
      );
      const i2 = new Interval(
        RationalNumericValue.fromIntegers(1, 6),
        RationalNumericValue.fromIntegers(1, 4)
      );
      const diff = i1.subtract(i2);
      
      expect(diff.lower.equals(RationalNumericValue.fromIntegers(1, 4))).toBe(true);
      // 3/4 - 1/6 = 9/12 - 2/12 = 7/12
      expect(diff.upper.equals(RationalNumericValue.fromIntegers(7, 12))).toBe(true);
    });

    it('should handle exact arithmetic in multiplication', () => {
      // [1/2, 2/3] * [3/4, 5/6] = [3/8, 10/18] = [3/8, 5/9]
      const i1 = new Interval(
        RationalNumericValue.fromIntegers(1, 2),
        RationalNumericValue.fromIntegers(2, 3)
      );
      const i2 = new Interval(
        RationalNumericValue.fromIntegers(3, 4),
        RationalNumericValue.fromIntegers(5, 6)
      );
      const product = i1.multiply(i2);
      
      expect(product.lower.equals(RationalNumericValue.fromIntegers(3, 8))).toBe(true);
      expect(product.upper.equals(RationalNumericValue.fromIntegers(5, 9))).toBe(true);
    });

    it('should handle exact arithmetic in division', () => {
      // [1/2, 2/3] / [3/4, 5/6] = [1/2, 2/3] * [6/5, 4/3]
      const i1 = new Interval(
        RationalNumericValue.fromIntegers(1, 2),
        RationalNumericValue.fromIntegers(2, 3)
      );
      const i2 = new Interval(
        RationalNumericValue.fromIntegers(3, 4),
        RationalNumericValue.fromIntegers(5, 6)
      );
      const quotient = i1.divide(i2);
      
      // 1/2 * 6/5 = 6/10 = 3/5
      expect(quotient.lower.equals(RationalNumericValue.fromIntegers(3, 5))).toBe(true);
      // 2/3 * 4/3 = 8/9
      expect(quotient.upper.equals(RationalNumericValue.fromIntegers(8, 9))).toBe(true);
    });
  });

  describe('Exact Precision Tests', () => {
    it('should maintain exact precision through multiple operations', () => {
      // Start with [1/3, 1/3]
      const third = RationalNumericValue.fromIntegers(1, 3);
      const interval = Interval.singleton(third);
      
      // Add it three times: 1/3 + 1/3 + 1/3 = 1
      const result = interval.add(interval).add(interval);
      
      // Should be exactly [1, 1]
      expect(result.lower.equals(RationalNumericValue.ONE)).toBe(true);
      expect(result.upper.equals(RationalNumericValue.ONE)).toBe(true);
    });

    it('should handle very small rational intervals exactly', () => {
      // [1/1000, 1/999]
      const interval = new Interval(
        RationalNumericValue.fromIntegers(1, 1000),
        RationalNumericValue.fromIntegers(1, 999)
      );
      
      // Multiply by 1000: [1/1000 * 1000, 1/999 * 1000] = [1, 1000/999]
      const thousand = Interval.singleton(RationalNumericValue.fromIntegers(1000, 1));
      const scaled = interval.multiply(thousand);
      
      expect(scaled.lower.equals(RationalNumericValue.ONE)).toBe(true);
      expect(scaled.upper.equals(RationalNumericValue.fromIntegers(1000, 999))).toBe(true);
    });
  });

  describe('Infinity Handling with Rationals', () => {
    it('should create infinite rational interval', () => {
      const proto = RationalNumericValue.ZERO;
      const interval = Interval.infinite(proto);
      
      expect(interval.isInfinite()).toBe(true);
    });

    it('should handle division by zero-containing interval', () => {
      const i1 = new Interval(
        RationalNumericValue.fromIntegers(1, 1),
        RationalNumericValue.fromIntegers(2, 1)
      );
      const i2 = new Interval(
        RationalNumericValue.fromIntegers(-1, 1),
        RationalNumericValue.fromIntegers(1, 1)
      );
      const quotient = i1.divide(i2);
      
      expect(quotient.isInfinite()).toBe(true);
    });
  });

  describe('Comparison with Double Intervals', () => {
    it('should produce same bounds as double intervals for simple cases', () => {
      // Create identical intervals with both types
      const doubleInterval = new Interval(
        DoubleNumericValue.fromNumber(0.5),
        DoubleNumericValue.fromNumber(1.5)
      );
      const rationalInterval = new Interval(
        RationalNumericValue.fromIntegers(1, 2),
        RationalNumericValue.fromIntegers(3, 2)
      );
      
      // Compare midpoints
      const doubleMid = doubleInterval.midpoint().toNumber();
      const rationalMid = rationalInterval.midpoint().toNumber();
      
      expect(Math.abs(doubleMid - rationalMid)).toBeLessThan(1e-10);
    });

    it('should demonstrate superior precision of rationals', () => {
      // 1/3 cannot be represented exactly as a double
      const doubleThird = DoubleNumericValue.fromNumber(1/3);
      const rationalThird = RationalNumericValue.fromIntegers(1, 3);
      
      // Triple them
      const doubleTripled = Interval.singleton(doubleThird)
        .add(Interval.singleton(doubleThird))
        .add(Interval.singleton(doubleThird));
      
      const rationalTripled = Interval.singleton(rationalThird)
        .add(Interval.singleton(rationalThird))
        .add(Interval.singleton(rationalThird));
      
      // Rational should be exactly 1
      expect(rationalTripled.lower.equals(RationalNumericValue.ONE)).toBe(true);
      
      // Double has exact representation in this case due to compiler optimization
      // but rationals are always exact - test with a more complex case
      // Use 1/7 which has no exact double representation
      const doubleSeventh = DoubleNumericValue.fromNumber(1/7);
      const rationalSeventh = RationalNumericValue.fromIntegers(1, 7);
      
      // Multiply by 7
      let doubleResult = Interval.singleton(doubleSeventh);
      let rationalResult = Interval.singleton(rationalSeventh);
      for (let i = 0; i < 6; i++) {
        doubleResult = doubleResult.add(Interval.singleton(doubleSeventh));
        rationalResult = rationalResult.add(Interval.singleton(rationalSeventh));
      }
      
      // Rational should be exactly 1
      expect(rationalResult.lower.equals(RationalNumericValue.ONE)).toBe(true);
      
      // Double will have some error
      const doubleError = Math.abs(doubleResult.lower.toNumber() - 1.0);
      expect(doubleError).toBeGreaterThan(0);
      expect(doubleError).toBeLessThan(1e-14); // Should be small but non-zero
    });
  });

  describe('Factory Methods with Rationals', () => {
    it('should create symmetric rational interval', () => {
      const radius = RationalNumericValue.fromIntegers(5, 2);
      const interval = Interval.symmetric(radius);
      
      expect(interval.lower.equals(RationalNumericValue.fromIntegers(-5, 2))).toBe(true);
      expect(interval.upper.equals(RationalNumericValue.fromIntegers(5, 2))).toBe(true);
    });

    it('should create centered rational interval', () => {
      const center = RationalNumericValue.fromIntegers(7, 2);
      const radius = RationalNumericValue.fromIntegers(3, 2);
      const interval = Interval.centered(center, radius);
      
      // 7/2 - 3/2 = 4/2 = 2
      expect(interval.lower.equals(RationalNumericValue.fromIntegers(2, 1))).toBe(true);
      // 7/2 + 3/2 = 10/2 = 5
      expect(interval.upper.equals(RationalNumericValue.fromIntegers(5, 1))).toBe(true);
    });
  });
});

describe('Interval Type Safety', () => {
  it('should maintain type safety - cannot mix Double and Rational intervals', () => {
    const doubleInterval = new Interval(DoubleNumericValue.ZERO, DoubleNumericValue.ONE);
    const rationalInterval = new Interval(RationalNumericValue.ZERO, RationalNumericValue.ONE);
    
    // TypeScript should prevent this at compile time, but we can verify runtime types
    expect(doubleInterval.lower).toBeInstanceOf(DoubleNumericValue);
    expect(rationalInterval.lower).toBeInstanceOf(RationalNumericValue);
  });
});
