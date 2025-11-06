/**
 * NumericValue.test.ts
 * 
 * Comprehensive test suite for DoubleNumericValue implementation.
 * Tests arithmetic, comparison, infinity handling, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { DoubleNumericValue } from '../DoubleNumericValue.js';

describe('DoubleNumericValue', () => {
    // ============================================================
    // Construction and Constants
    // ============================================================

    describe('construction and constants', () => {
        it('should create value from number', () => {
            const v = DoubleNumericValue.fromNumber(5.5);
            expect(v.toNumber()).toBe(5.5);
        });

        it('should have correct constants', () => {
            expect(DoubleNumericValue.ZERO.toNumber()).toBe(0);
            expect(DoubleNumericValue.ONE.toNumber()).toBe(1);
            expect(DoubleNumericValue.TWO.toNumber()).toBe(2);
            expect(DoubleNumericValue.POSITIVE_INFINITY.toNumber()).toBe(Infinity);
            expect(DoubleNumericValue.NEGATIVE_INFINITY.toNumber()).toBe(-Infinity);
        });

        it('should create from integer', () => {
            const v = DoubleNumericValue.fromNumber(42);
            expect(v.toNumber()).toBe(42);
        });

        it('should create from BigInt', () => {
            const v = DoubleNumericValue.fromBigInt(12345n);
            expect(v.toNumber()).toBe(12345);
        });

        it('should have correct type identifier', () => {
            const v = DoubleNumericValue.fromNumber(5);
            expect(v.getType()).toBe('double');
        });
    });

    // ============================================================
    // Comparison Operations
    // ============================================================

    describe('comparison operations', () => {
        it('should compare equal values', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const b = DoubleNumericValue.fromNumber(5);
            expect(a.compare(b)).toBe(0);
            expect(a.equals(b)).toBe(true);
        });

        it('should compare less than', () => {
            const a = DoubleNumericValue.fromNumber(3);
            const b = DoubleNumericValue.fromNumber(5);
            expect(a.compare(b)).toBe(-1);
            expect(a.lessThan(b)).toBe(true);
            expect(a.lessThanOrEqual(b)).toBe(true);
        });

        it('should compare greater than', () => {
            const a = DoubleNumericValue.fromNumber(7);
            const b = DoubleNumericValue.fromNumber(3);
            expect(a.compare(b)).toBe(1);
            expect(a.greaterThan(b)).toBe(true);
            expect(a.greaterThanOrEqual(b)).toBe(true);
        });

        it('should handle negative numbers in comparison', () => {
            const a = DoubleNumericValue.fromNumber(-5);
            const b = DoubleNumericValue.fromNumber(3);
            expect(a.lessThan(b)).toBe(true);

            const c = DoubleNumericValue.fromNumber(-2);
            const d = DoubleNumericValue.fromNumber(-7);
            expect(c.greaterThan(d)).toBe(true);
        });

        it('should compare with infinity', () => {
            const finite = DoubleNumericValue.fromNumber(1000000);
            const posInf = DoubleNumericValue.POSITIVE_INFINITY;
            const negInf = DoubleNumericValue.NEGATIVE_INFINITY;

            expect(finite.lessThan(posInf)).toBe(true);
            expect(finite.greaterThan(negInf)).toBe(true);
            expect(posInf.greaterThan(finite)).toBe(true);
            expect(negInf.lessThan(finite)).toBe(true);
        });
    });

    // ============================================================
    // Arithmetic Operations
    // ============================================================

    describe('arithmetic operations', () => {
        it('should add two positive values', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const b = DoubleNumericValue.fromNumber(3);
            const sum = a.add(b);
            expect(sum.toNumber()).toBe(8);
        });

        it('should add positive and negative', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const b = DoubleNumericValue.fromNumber(-3);
            const sum = a.add(b);
            expect(sum.toNumber()).toBe(2);
        });

        it('should subtract values', () => {
            const a = DoubleNumericValue.fromNumber(10);
            const b = DoubleNumericValue.fromNumber(3);
            const diff = a.subtract(b);
            expect(diff.toNumber()).toBe(7);
        });

        it('should multiply values', () => {
            const a = DoubleNumericValue.fromNumber(4);
            const b = DoubleNumericValue.fromNumber(3.5);
            const product = a.multiply(b);
            expect(product.toNumber()).toBe(14);
        });

        it('should divide values', () => {
            const a = DoubleNumericValue.fromNumber(10);
            const b = DoubleNumericValue.fromNumber(4);
            const quotient = a.divide(b);
            expect(quotient.toNumber()).toBe(2.5);
        });

        it('should negate values', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const neg = a.negate();
            expect(neg.toNumber()).toBe(-5);

            const b = DoubleNumericValue.fromNumber(-3);
            const negB = b.negate();
            expect(negB.toNumber()).toBe(3);
        });

        it('should compute absolute value', () => {
            const a = DoubleNumericValue.fromNumber(-7);
            const abs = a.abs();
            expect(abs.toNumber()).toBe(7);

            const b = DoubleNumericValue.fromNumber(3);
            const absB = b.abs();
            expect(absB.toNumber()).toBe(3);
        });

        it('should square values', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const squared = a.square();
            expect(squared.toNumber()).toBe(25);
        });

        it('should cube values', () => {
            const a = DoubleNumericValue.fromNumber(3);
            const cubed = a.cube();
            expect(cubed.toNumber()).toBe(27);
        });

        it('should raise to integer power', () => {
            const a = DoubleNumericValue.fromNumber(2);
            expect(a.power(0).toNumber()).toBe(1);
            expect(a.power(1).toNumber()).toBe(2);
            expect(a.power(2).toNumber()).toBe(4);
            expect(a.power(3).toNumber()).toBe(8);
            expect(a.power(10).toNumber()).toBe(1024);
        });

        it('should throw on negative power', () => {
            const a = DoubleNumericValue.fromNumber(2);
            expect(() => a.power(-1)).toThrow();
        });

        it('should throw on non-integer power', () => {
            const a = DoubleNumericValue.fromNumber(2);
            expect(() => a.power(2.5)).toThrow();
        });
    });

    // ============================================================
    // Additional Math Operations
    // ============================================================

    describe('additional math operations', () => {
        it('should compute square root', () => {
            const a = DoubleNumericValue.fromNumber(9);
            const sqrt = a.sqrt();
            expect(sqrt.toNumber()).toBe(3);
        });

        it('should compute natural log', () => {
            const a = DoubleNumericValue.fromNumber(Math.E);
            const ln = a.ln();
            expect(ln.toNumber()).toBeCloseTo(1);
        });

        it('should compute exponential', () => {
            const a = DoubleNumericValue.fromNumber(1);
            const exp = a.exp();
            expect(exp.toNumber()).toBeCloseTo(Math.E);
        });

        it('should compute floor', () => {
            const a = DoubleNumericValue.fromNumber(3.7);
            const floor = a.floor();
            expect(floor.toNumber()).toBe(3);

            const b = DoubleNumericValue.fromNumber(-2.3);
            const floorB = b.floor();
            expect(floorB.toNumber()).toBe(-3);
        });

        it('should compute ceiling', () => {
            const a = DoubleNumericValue.fromNumber(3.2);
            const ceil = a.ceil();
            expect(ceil.toNumber()).toBe(4);

            const b = DoubleNumericValue.fromNumber(-2.7);
            const ceilB = b.ceil();
            expect(ceilB.toNumber()).toBe(-2);
        });

        it('should round values', () => {
            const a = DoubleNumericValue.fromNumber(3.4);
            expect(a.round().toNumber()).toBe(3);

            const b = DoubleNumericValue.fromNumber(3.6);
            expect(b.round().toNumber()).toBe(4);
        });
    });

    // ============================================================
    // Infinity Handling
    // ============================================================

    describe('infinity handling', () => {
        it('should detect infinite values', () => {
            const posInf = DoubleNumericValue.POSITIVE_INFINITY;
            const negInf = DoubleNumericValue.NEGATIVE_INFINITY;
            const finite = DoubleNumericValue.fromNumber(42);

            expect(posInf.isInfinite()).toBe(true);
            expect(negInf.isInfinite()).toBe(true);
            expect(finite.isInfinite()).toBe(false);

            expect(posInf.isPositiveInfinity()).toBe(true);
            expect(negInf.isNegativeInfinity()).toBe(true);
            expect(finite.isPositiveInfinity()).toBe(false);
        });

        it('should handle division by zero', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const zero = DoubleNumericValue.ZERO;

            const result = a.divide(zero);
            expect(result.isPositiveInfinity()).toBe(true);

            const b = DoubleNumericValue.fromNumber(-5);
            const resultNeg = b.divide(zero);
            expect(resultNeg.isNegativeInfinity()).toBe(true);
        });

        it('should handle 0/0 as NaN', () => {
            const zero = DoubleNumericValue.ZERO;
            const result = zero.divide(zero);
            expect(result.isNaN()).toBe(true);
        });

        it('should add infinity correctly', () => {
            const posInf = DoubleNumericValue.POSITIVE_INFINITY;
            const finite = DoubleNumericValue.fromNumber(1000);

            const result = posInf.add(finite);
            expect(result.isPositiveInfinity()).toBe(true);
        });

        it('should multiply infinity correctly', () => {
            const posInf = DoubleNumericValue.POSITIVE_INFINITY;
            const two = DoubleNumericValue.TWO;

            const result = posInf.multiply(two);
            expect(result.isPositiveInfinity()).toBe(true);

            const negTwo = DoubleNumericValue.fromNumber(-2);
            const resultNeg = posInf.multiply(negTwo);
            expect(resultNeg.isNegativeInfinity()).toBe(true);
        });

        it('should handle infinity - infinity as NaN', () => {
            const posInf = DoubleNumericValue.POSITIVE_INFINITY;
            const result = posInf.subtract(posInf);
            expect(result.isNaN()).toBe(true);
        });
    });

    // ============================================================
    // Predicates and Utilities
    // ============================================================

    describe('predicates and utilities', () => {
        it('should detect zero', () => {
            const zero = DoubleNumericValue.ZERO;
            const nonZero = DoubleNumericValue.fromNumber(5);

            expect(zero.isZero()).toBe(true);
            expect(nonZero.isZero()).toBe(false);
        });

        it('should detect one', () => {
            const one = DoubleNumericValue.ONE;
            const other = DoubleNumericValue.fromNumber(5);

            expect(one.isOne()).toBe(true);
            expect(other.isOne()).toBe(false);
        });

        it('should detect positive values', () => {
            const pos = DoubleNumericValue.fromNumber(5);
            const zero = DoubleNumericValue.ZERO;
            const neg = DoubleNumericValue.fromNumber(-5);

            expect(pos.isPositive()).toBe(true);
            expect(zero.isPositive()).toBe(false);
            expect(neg.isPositive()).toBe(false);
        });

        it('should detect negative values', () => {
            const neg = DoubleNumericValue.fromNumber(-5);
            const zero = DoubleNumericValue.ZERO;
            const pos = DoubleNumericValue.fromNumber(5);

            expect(neg.isNegative()).toBe(true);
            expect(zero.isNegative()).toBe(false);
            expect(pos.isNegative()).toBe(false);
        });

        it('should compute sign', () => {
            const pos = DoubleNumericValue.fromNumber(5);
            const neg = DoubleNumericValue.fromNumber(-5);
            const zero = DoubleNumericValue.ZERO;

            expect(pos.sign()).toBe(1);
            expect(neg.sign()).toBe(-1);
            expect(zero.sign()).toBe(0);
        });

        it('should detect finite values', () => {
            const finite = DoubleNumericValue.fromNumber(42);
            const inf = DoubleNumericValue.POSITIVE_INFINITY;
            const nan = DoubleNumericValue.NaN;

            expect(finite.isFinite()).toBe(true);
            expect(inf.isFinite()).toBe(false);
            expect(nan.isFinite()).toBe(false);
        });

        it('should detect integers', () => {
            const int = DoubleNumericValue.fromNumber(5);
            const nonInt = DoubleNumericValue.fromNumber(5.5);

            expect(int.isInteger()).toBe(true);
            expect(nonInt.isInteger()).toBe(false);
        });
    });

    // ============================================================
    // Conversion and String Operations
    // ============================================================

    describe('conversion and string operations', () => {
        it('should convert to string', () => {
            const a = DoubleNumericValue.fromNumber(5.5);
            expect(a.toString()).toBe('5.5');
        });

        it('should format infinity strings', () => {
            expect(DoubleNumericValue.POSITIVE_INFINITY.toString()).toBe('+∞');
            expect(DoubleNumericValue.NEGATIVE_INFINITY.toString()).toBe('-∞');
        });

        it('should format NaN string', () => {
            expect(DoubleNumericValue.NaN.toString()).toBe('NaN');
        });

        it('should format with fixed decimals', () => {
            const a = DoubleNumericValue.fromNumber(3.14159);
            expect(a.toFixed(2)).toBe('3.14');
        });

        it('should format in exponential notation', () => {
            const a = DoubleNumericValue.fromNumber(1234.5);
            const exp = a.toExponential(2);
            expect(exp).toMatch(/1\.23e\+3/i);
        });

        it('should clone values', () => {
            const a = DoubleNumericValue.fromNumber(5.5);
            const clone = a.clone();
            expect(clone.toNumber()).toBe(5.5);
            expect(clone).not.toBe(a); // Different instances
        });

        it('should parse from string', () => {
            const a = DoubleNumericValue.parse('3.14');
            expect(a?.toNumber()).toBe(3.14);

            const inf = DoubleNumericValue.parse('+∞');
            expect(inf?.isPositiveInfinity()).toBe(true);

            const negInf = DoubleNumericValue.parse('-∞');
            expect(negInf?.isNegativeInfinity()).toBe(true);

            const nan = DoubleNumericValue.parse('NaN');
            expect(nan?.isNaN()).toBe(true);
        });

        it('should return null for invalid parse', () => {
            const invalid = DoubleNumericValue.parse('not a number');
            expect(invalid).toBeNull();
        });

        it('should throw on parseOrThrow with invalid string', () => {
            expect(() => DoubleNumericValue.parseOrThrow('invalid')).toThrow();
        });
    });

    // ============================================================
    // Type Safety (Compile-time checks)
    // ============================================================

    describe('type safety', () => {
        it('should only accept same type in operations', () => {
            const a = DoubleNumericValue.fromNumber(5);
            const b = DoubleNumericValue.fromNumber(3);

            // These compile because both are DoubleNumericValue
            const sum = a.add(b);
            const diff = a.subtract(b);
            const prod = a.multiply(b);
            const quot = a.divide(b);

            expect(sum.toNumber()).toBe(8);
            expect(diff.toNumber()).toBe(2);
            expect(prod.toNumber()).toBe(15);
            expect(quot.toNumber()).toBeCloseTo(1.667, 2);
        });
    });

    // ============================================================
    // Edge Cases
    // ============================================================

    describe('edge cases', () => {
        it('should handle very large numbers', () => {
            const large = DoubleNumericValue.fromNumber(1e308);
            expect(large.isFinite()).toBe(true);

            const tooLarge = DoubleNumericValue.fromNumber(1e309);
            expect(tooLarge.isPositiveInfinity()).toBe(true);
        });

        it('should handle very small numbers', () => {
            const small = DoubleNumericValue.fromNumber(1e-323);
            expect(small.isFinite()).toBe(true);
            expect(small.greaterThan(DoubleNumericValue.ZERO)).toBe(true);
        });

        it('should handle zero variations', () => {
            const posZero = DoubleNumericValue.fromNumber(0);
            const negZero = DoubleNumericValue.fromNumber(-0);

            // JavaScript treats +0 and -0 as equal
            expect(posZero.equals(negZero)).toBe(true);
        });

        it('should handle precision limits', () => {
            // IEEE 754 has ~15 decimal digits of precision
            // Numbers this close may round to the same value
            const a = DoubleNumericValue.fromNumber(1.0000000000000001);
            const b = DoubleNumericValue.fromNumber(1.0);

            // This difference is too small - they are equal in IEEE 754
            const diff = a.subtract(b);
            // Should be either 0 or a very small positive number
            expect(diff.toNumber()).toBeGreaterThanOrEqual(0);
            expect(diff.toNumber()).toBeLessThan(1e-10);

            // But larger differences are preserved
            const c = DoubleNumericValue.fromNumber(1.000000001);
            const d = DoubleNumericValue.fromNumber(1.0);
            const diff2 = c.subtract(d);
            expect(diff2.toNumber()).toBeGreaterThan(0);
        });
    });
});
