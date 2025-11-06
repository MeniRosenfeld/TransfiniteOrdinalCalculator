/**
 * RationalNumericValue.test.ts
 * 
 * Comprehensive test suite for RationalNumericValue implementation.
 * Tests exact arithmetic, infinity handling, normalization, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { RationalNumericValue } from '../RationalNumericValue.js';
import { DoubleNumericValue } from '../DoubleNumericValue.js';

describe('RationalNumericValue', () => {
    // ============================================================
    // Construction and Constants
    // ============================================================
    
    describe('construction and constants', () => {
        it('should create from integers', () => {
            const r = RationalNumericValue.fromIntegers(3, 4);
            expect(r.numerator).toBe(3n);
            expect(r.denominator).toBe(4n);
        });
        
        it('should create from BigInts', () => {
            const r = RationalNumericValue.fromBigInts(5n, 7n);
            expect(r.numerator).toBe(5n);
            expect(r.denominator).toBe(7n);
        });
        
        it('should have correct constants', () => {
            expect(RationalNumericValue.ZERO.toNumber()).toBe(0);
            expect(RationalNumericValue.ONE.toNumber()).toBe(1);
            expect(RationalNumericValue.TWO.toNumber()).toBe(2);
            expect(RationalNumericValue.ONE_HALF.toString()).toBe('1/2');
            expect(RationalNumericValue.ONE_THIRD.toString()).toBe('1/3');
        });
        
        it('should normalize to lowest terms', () => {
            const r = RationalNumericValue.fromIntegers(6, 9);
            expect(r.numerator).toBe(2n);
            expect(r.denominator).toBe(3n);
        });
        
        it('should make denominator positive', () => {
            const r = RationalNumericValue.fromIntegers(3, -4);
            expect(r.numerator).toBe(-3n);
            expect(r.denominator).toBe(4n);
        });
        
        it('should throw when creating from non-integers with fromIntegers', () => {
            expect(() => RationalNumericValue.fromIntegers(3.5, 2)).toThrow();
        });
        
        it('should have correct type identifier', () => {
            const r = RationalNumericValue.ONE;
            expect(r.getType()).toBe('rational');
        });
    });
    
    // ============================================================
    // Normalization and Canonical Form
    // ============================================================
    
    describe('normalization', () => {
        it('should reduce fractions to lowest terms', () => {
            const tests = [
                { num: 2, den: 4, expected: '1/2' },
                { num: 15, den: 25, expected: '3/5' },
                { num: 100, den: 150, expected: '2/3' },
                { num: 7, den: 14, expected: '1/2' },
            ];
            
            for (const test of tests) {
                const r = RationalNumericValue.fromIntegers(test.num, test.den);
                expect(r.toString()).toBe(test.expected);
            }
        });
        
        it('should handle zero correctly', () => {
            const r1 = RationalNumericValue.fromIntegers(0, 5);
            expect(r1.numerator).toBe(0n);
            expect(r1.denominator).toBe(1n);
            expect(r1.toString()).toBe('0');
        });
        
        it('should normalize integer as denominator 1', () => {
            const r = RationalNumericValue.fromIntegers(42, 1);
            expect(r.denominator).toBe(1n);
            expect(r.toString()).toBe('42');
        });
        
        it('should handle large GCD correctly', () => {
            const r = RationalNumericValue.fromIntegers(123456, 234567);
            // GCD(123456, 234567) = 3
            expect(r.numerator).toBe(41152n);
            expect(r.denominator).toBe(78189n);
        });
    });
    
    // ============================================================
    // Comparison Operations
    // ============================================================
    
    describe('comparison operations', () => {
        it('should compare equal fractions', () => {
            const a = RationalNumericValue.fromIntegers(1, 2);
            const b = RationalNumericValue.fromIntegers(2, 4);
            expect(a.equals(b)).toBe(true);
            expect(a.compare(b)).toBe(0);
        });
        
        it('should compare less than', () => {
            const a = RationalNumericValue.fromIntegers(1, 3);
            const b = RationalNumericValue.fromIntegers(1, 2);
            expect(a.lessThan(b)).toBe(true);
            expect(a.compare(b)).toBe(-1);
        });
        
        it('should compare greater than', () => {
            const a = RationalNumericValue.fromIntegers(2, 3);
            const b = RationalNumericValue.fromIntegers(1, 2);
            expect(a.greaterThan(b)).toBe(true);
            expect(a.compare(b)).toBe(1);
        });
        
        it('should compare negative fractions', () => {
            const a = RationalNumericValue.fromIntegers(-1, 2);
            const b = RationalNumericValue.fromIntegers(1, 2);
            expect(a.lessThan(b)).toBe(true);
            
            const c = RationalNumericValue.fromIntegers(-1, 3);
            const d = RationalNumericValue.fromIntegers(-1, 2);
            expect(c.greaterThan(d)).toBe(true); // -1/3 > -1/2
        });
        
        it('should compare with infinity', () => {
            const finite = RationalNumericValue.fromIntegers(1000000, 1);
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            const negInf = RationalNumericValue.NEGATIVE_INFINITY;
            
            expect(finite.lessThan(posInf)).toBe(true);
            expect(finite.greaterThan(negInf)).toBe(true);
            expect(posInf.equals(posInf)).toBe(true);
            expect(negInf.equals(negInf)).toBe(true);
        });
    });
    
    // ============================================================
    // Exact Arithmetic
    // ============================================================
    
    describe('exact arithmetic', () => {
        it('should add fractions exactly', () => {
            const a = RationalNumericValue.fromIntegers(1, 3);
            const b = RationalNumericValue.fromIntegers(1, 6);
            const sum = a.add(b);
            expect(sum.toString()).toBe('1/2');
        });
        
        it('should add to get whole number', () => {
            const a = RationalNumericValue.fromIntegers(1, 3);
            const b = RationalNumericValue.fromIntegers(2, 3);
            const sum = a.add(b);
            expect(sum.toString()).toBe('1');
            expect(sum.isOne()).toBe(true);
        });
        
        it('should subtract fractions exactly', () => {
            const a = RationalNumericValue.fromIntegers(5, 6);
            const b = RationalNumericValue.fromIntegers(1, 3);
            const diff = a.subtract(b);
            expect(diff.toString()).toBe('1/2');
        });
        
        it('should multiply fractions exactly', () => {
            const a = RationalNumericValue.fromIntegers(2, 3);
            const b = RationalNumericValue.fromIntegers(3, 4);
            const product = a.multiply(b);
            expect(product.toString()).toBe('1/2');
        });
        
        it('should divide fractions exactly', () => {
            const a = RationalNumericValue.fromIntegers(2, 3);
            const b = RationalNumericValue.fromIntegers(3, 4);
            const quotient = a.divide(b);
            expect(quotient.toString()).toBe('8/9');
        });
        
        it('should handle repeated addition without error accumulation', () => {
            let sum = RationalNumericValue.ZERO;
            const oneThird = RationalNumericValue.ONE_THIRD;
            
            // Add 1/3 three times
            sum = sum.add(oneThird);
            sum = sum.add(oneThird);
            sum = sum.add(oneThird);
            
            // Should be exactly 1, not 0.9999...
            expect(sum.equals(RationalNumericValue.ONE)).toBe(true);
            expect(sum.toString()).toBe('1');
        });
    });
    
    // ============================================================
    // Exact vs Double Comparison
    // ============================================================
    
    describe('exact arithmetic vs doubles', () => {
        it('should maintain exact precision where doubles fail', () => {
            // Double arithmetic: 0.1 + 0.2 != 0.3 (floating point error)
            const d1 = DoubleNumericValue.fromNumber(0.1);
            const d2 = DoubleNumericValue.fromNumber(0.2);
            const dSum = d1.add(d2);
            expect(dSum.toNumber()).not.toBe(0.3); // Famous floating point issue
            
            // Rational arithmetic: 1/10 + 2/10 = 3/10 exactly
            const r1 = RationalNumericValue.fromIntegers(1, 10);
            const r2 = RationalNumericValue.fromIntegers(2, 10);
            const rSum = r1.add(r2);
            expect(rSum.toString()).toBe('3/10');
            expect(rSum.toNumber()).toBe(0.3); // Exact
        });
        
        it('should handle repeated operations without error', () => {
            // Double: repeatedly add 0.1, accumulates error
            let dSum = DoubleNumericValue.ZERO;
            for (let i = 0; i < 10; i++) {
                dSum = dSum.add(DoubleNumericValue.fromNumber(0.1));
            }
            // Will be close to 1.0 but not exactly
            expect(Math.abs(dSum.toNumber() - 1.0)).toBeGreaterThan(0);
            
            // Rational: repeatedly add 1/10, stays exact
            let rSum = RationalNumericValue.ZERO;
            const oneTenth = RationalNumericValue.fromIntegers(1, 10);
            for (let i = 0; i < 10; i++) {
                rSum = rSum.add(oneTenth);
            }
            expect(rSum.equals(RationalNumericValue.ONE)).toBe(true);
        });
    });
    
    // ============================================================
    // Infinity Handling
    // ============================================================
    
    describe('infinity handling', () => {
        it('should detect infinite values', () => {
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            const negInf = RationalNumericValue.NEGATIVE_INFINITY;
            const finite = RationalNumericValue.fromIntegers(42, 1);
            
            expect(posInf.isInfinite()).toBe(true);
            expect(negInf.isInfinite()).toBe(true);
            expect(finite.isInfinite()).toBe(false);
            
            expect(posInf.isPositiveInfinity()).toBe(true);
            expect(negInf.isNegativeInfinity()).toBe(true);
        });
        
        it('should handle division by zero', () => {
            const a = RationalNumericValue.fromIntegers(5, 1);
            const zero = RationalNumericValue.ZERO;
            
            const result = a.divide(zero);
            expect(result.isPositiveInfinity()).toBe(true);
            
            const b = RationalNumericValue.fromIntegers(-5, 1);
            const resultNeg = b.divide(zero);
            expect(resultNeg.isNegativeInfinity()).toBe(true);
        });
        
        it('should handle 0/0 as zero (convention)', () => {
            const zero = RationalNumericValue.ZERO;
            const result = zero.divide(zero);
            expect(result.isZero()).toBe(true);
        });
        
        it('should handle infinity in addition', () => {
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            const finite = RationalNumericValue.fromIntegers(1000, 1);
            
            const result = posInf.add(finite);
            expect(result.isPositiveInfinity()).toBe(true);
        });
        
        it('should handle infinity in multiplication', () => {
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            const two = RationalNumericValue.TWO;
            
            const result = posInf.multiply(two);
            expect(result.isPositiveInfinity()).toBe(true);
            
            const negTwo = RationalNumericValue.fromIntegers(-2, 1);
            const resultNeg = posInf.multiply(negTwo);
            expect(resultNeg.isNegativeInfinity()).toBe(true);
        });
        
        it('should handle division by infinity', () => {
            const finite = RationalNumericValue.fromIntegers(100, 1);
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            
            const result = finite.divide(posInf);
            expect(result.isZero()).toBe(true);
        });
        
        it('should handle infinity divided by finite', () => {
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            const two = RationalNumericValue.TWO;
            
            const result = posInf.divide(two);
            expect(result.isPositiveInfinity()).toBe(true);
        });
        
        it('should handle 0 * infinity as 0', () => {
            const zero = RationalNumericValue.ZERO;
            const posInf = RationalNumericValue.POSITIVE_INFINITY;
            
            const result = zero.multiply(posInf);
            expect(result.isZero()).toBe(true);
        });
    });
    
    // ============================================================
    // Unary Operations
    // ============================================================
    
    describe('unary operations', () => {
        it('should negate values correctly', () => {
            const a = RationalNumericValue.fromIntegers(3, 4);
            const neg = a.negate();
            expect(neg.toString()).toBe('-3/4');
            
            const negNeg = neg.negate();
            expect(negNeg.equals(a)).toBe(true);
        });
        
        it('should compute absolute value', () => {
            const a = RationalNumericValue.fromIntegers(-3, 4);
            const abs = a.abs();
            expect(abs.toString()).toBe('3/4');
            
            const b = RationalNumericValue.fromIntegers(3, 4);
            const absB = b.abs();
            expect(absB.equals(b)).toBe(true);
        });
        
        it('should compute reciprocal', () => {
            const a = RationalNumericValue.fromIntegers(3, 4);
            const recip = a.reciprocal();
            expect(recip.toString()).toBe('4/3');
            
            // Double reciprocal
            const recipRecip = recip.reciprocal();
            expect(recipRecip.equals(a)).toBe(true);
        });
        
        it('should handle reciprocal of zero as infinity', () => {
            const zero = RationalNumericValue.ZERO;
            const recip = zero.reciprocal();
            expect(recip.isPositiveInfinity()).toBe(true);
        });
        
        it('should handle reciprocal of infinity as zero', () => {
            const inf = RationalNumericValue.POSITIVE_INFINITY;
            const recip = inf.reciprocal();
            expect(recip.isZero()).toBe(true);
        });
    });
    
    // ============================================================
    // Rational-Specific Operations
    // ============================================================
    
    describe('rational-specific operations', () => {
        it('should identify proper fractions', () => {
            const proper = RationalNumericValue.fromIntegers(3, 4);
            expect(proper.isProperFraction()).toBe(true);
            
            const improper = RationalNumericValue.fromIntegers(5, 4);
            expect(improper.isProperFraction()).toBe(false);
            
            const integer = RationalNumericValue.fromIntegers(3, 1);
            expect(integer.isProperFraction()).toBe(false);
        });
        
        it('should extract integer part', () => {
            const r = RationalNumericValue.fromIntegers(11, 4); // 2.75
            const intPart = r.integerPart();
            expect(intPart.toString()).toBe('2');
        });
        
        it('should extract fractional part', () => {
            const r = RationalNumericValue.fromIntegers(11, 4); // 2.75
            const fracPart = r.fractionalPart();
            expect(fracPart.toString()).toBe('3/4');
        });
        
        it('should identify integers', () => {
            const integer = RationalNumericValue.fromIntegers(5, 1);
            expect(integer.isInteger()).toBe(true);
            
            const fraction = RationalNumericValue.fromIntegers(5, 2);
            expect(fraction.isInteger()).toBe(false);
        });
    });
    
    // ============================================================
    // Power Operations
    // ============================================================
    
    describe('power operations', () => {
        it('should square fractions', () => {
            const a = RationalNumericValue.fromIntegers(2, 3);
            const squared = a.square();
            expect(squared.toString()).toBe('4/9');
        });
        
        it('should cube fractions', () => {
            const a = RationalNumericValue.fromIntegers(2, 3);
            const cubed = a.cube();
            expect(cubed.toString()).toBe('8/27');
        });
        
        it('should raise to integer power', () => {
            const a = RationalNumericValue.fromIntegers(2, 3);
            expect(a.power(0).equals(RationalNumericValue.ONE)).toBe(true);
            expect(a.power(1).equals(a)).toBe(true);
            expect(a.power(2).toString()).toBe('4/9');
            expect(a.power(3).toString()).toBe('8/27');
        });
    });
    
    // ============================================================
    // Predicates and Utilities
    // ============================================================
    
    describe('predicates and utilities', () => {
        it('should detect zero', () => {
            const zero = RationalNumericValue.ZERO;
            const nonZero = RationalNumericValue.ONE_HALF;
            
            expect(zero.isZero()).toBe(true);
            expect(nonZero.isZero()).toBe(false);
        });
        
        it('should detect one', () => {
            const one = RationalNumericValue.ONE;
            const other = RationalNumericValue.ONE_HALF;
            
            expect(one.isOne()).toBe(true);
            expect(other.isOne()).toBe(false);
        });
        
        it('should detect positive values', () => {
            const pos = RationalNumericValue.fromIntegers(3, 4);
            const zero = RationalNumericValue.ZERO;
            const neg = RationalNumericValue.fromIntegers(-3, 4);
            
            expect(pos.isPositive()).toBe(true);
            expect(zero.isPositive()).toBe(false);
            expect(neg.isPositive()).toBe(false);
        });
        
        it('should detect negative values', () => {
            const neg = RationalNumericValue.fromIntegers(-3, 4);
            const zero = RationalNumericValue.ZERO;
            const pos = RationalNumericValue.fromIntegers(3, 4);
            
            expect(neg.isNegative()).toBe(true);
            expect(zero.isNegative()).toBe(false);
            expect(pos.isNegative()).toBe(false);
        });
        
        it('should compute sign', () => {
            const pos = RationalNumericValue.fromIntegers(3, 4);
            const neg = RationalNumericValue.fromIntegers(-3, 4);
            const zero = RationalNumericValue.ZERO;
            
            expect(pos.sign()).toBe(1);
            expect(neg.sign()).toBe(-1);
            expect(zero.sign()).toBe(0);
        });
    });
    
    // ============================================================
    // Conversion and String Operations
    // ============================================================
    
    describe('conversion and string operations', () => {
        it('should convert to number', () => {
            const r = RationalNumericValue.fromIntegers(3, 4);
            expect(r.toNumber()).toBe(0.75);
        });
        
        it('should convert to string', () => {
            const r = RationalNumericValue.fromIntegers(3, 4);
            expect(r.toString()).toBe('3/4');
        });
        
        it('should format integers without denominator', () => {
            const r = RationalNumericValue.fromIntegers(5, 1);
            expect(r.toString()).toBe('5');
        });
        
        it('should format infinity strings', () => {
            expect(RationalNumericValue.POSITIVE_INFINITY.toString()).toBe('+∞');
            expect(RationalNumericValue.NEGATIVE_INFINITY.toString()).toBe('-∞');
        });
        
        it('should convert to decimal string', () => {
            const r = RationalNumericValue.fromIntegers(1, 3);
            const decimal = r.toDecimalString(10);
            expect(decimal).toBe('0.3333333333');
            
            const half = RationalNumericValue.ONE_HALF;
            expect(half.toDecimalString(5)).toBe('0.5');
        });
        
        it('should clone values', () => {
            const a = RationalNumericValue.fromIntegers(3, 4);
            const clone = a.clone();
            expect(clone.equals(a)).toBe(true);
            expect(clone).not.toBe(a); // Different instances
        });
        
        it('should parse from string', () => {
            const r1 = RationalNumericValue.parse('3/4');
            expect(r1?.toString()).toBe('3/4');
            
            const r2 = RationalNumericValue.parse('42');
            expect(r2?.toString()).toBe('42');
            
            const inf = RationalNumericValue.parse('+∞');
            expect(inf?.isPositiveInfinity()).toBe(true);
        });
        
        it('should return null for invalid parse', () => {
            const invalid = RationalNumericValue.parse('not/a/number');
            expect(invalid).toBeNull();
        });
        
        it('should throw on parseOrThrow with invalid string', () => {
            expect(() => RationalNumericValue.parseOrThrow('invalid')).toThrow();
        });
    });
    
    // ============================================================
    // Type Safety
    // ============================================================
    
    describe('type safety', () => {
        it('should only accept same type in operations', () => {
            const a = RationalNumericValue.fromIntegers(1, 2);
            const b = RationalNumericValue.fromIntegers(1, 3);
            
            // These compile because both are RationalNumericValue
            const sum = a.add(b);
            const diff = a.subtract(b);
            const prod = a.multiply(b);
            const quot = a.divide(b);
            
            expect(sum.toString()).toBe('5/6');
            expect(diff.toString()).toBe('1/6');
            expect(prod.toString()).toBe('1/6');
            expect(quot.toString()).toBe('3/2');
        });
    });
    
    // ============================================================
    // Edge Cases and Large Numbers
    // ============================================================
    
    describe('edge cases and large numbers', () => {
        it('should handle very large numerators and denominators', () => {
            const large = RationalNumericValue.fromBigInts(
                123456789012345678901234567890n,
                987654321098765432109876543210n
            );
            expect(large.numerator).toBeDefined();
            expect(large.denominator).toBeDefined();
        });
        
        it('should handle operations with large numbers', () => {
            const a = RationalNumericValue.fromBigInts(10n ** 20n, 1n);
            const b = RationalNumericValue.fromBigInts(10n ** 20n, 1n);
            const sum = a.add(b);
            expect(sum.numerator).toBe(2n * 10n ** 20n);
        });
        
        it('should normalize large fractions', () => {
            // Both divisible by 999
            const a = RationalNumericValue.fromBigInts(
                123456n * 999n,
                234567n * 999n
            );
            // Should be reduced - but 123456 and 234567 share a common factor too!
            // GCD(123456, 234567) = 3, so result is 41152/78189
            expect(a.numerator).toBe(41152n);
            expect(a.denominator).toBe(78189n);
            
            // Verify it equals the original unreduced fraction
            const original = RationalNumericValue.fromBigInts(
                123456n * 999n,
                234567n * 999n
            );
            expect(a.equals(original)).toBe(true);
        });
        
        it('should handle conversion from approximate decimals', () => {
            const r = RationalNumericValue.fromNumber(0.333333);
            // Should approximate to nearby simple fraction
            expect(r.toNumber()).toBeCloseTo(0.333333, 5);
        });
    });
});
