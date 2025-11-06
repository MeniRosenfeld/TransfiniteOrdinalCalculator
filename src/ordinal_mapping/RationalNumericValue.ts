/**
 * RationalNumericValue.ts
 * 
 * Exact rational number arithmetic using BigInt.
 * Supports arbitrary precision with automatic normalization to lowest terms.
 * 
 * Features:
 * - Exact arithmetic (no rounding errors)
 * - Arbitrary precision via BigInt
 * - Zero-denominator infinity representation
 * - Automatic GCD normalization
 * - Always in canonical form (denominator positive, reduced)
 */

import { NumericValue } from './NumericValue.js';

/**
 * Rational number with exact BigInt arithmetic
 * 
 * Represents a rational number as numerator/denominator pair.
 * All operations maintain exact precision without rounding.
 * 
 * Infinity Representation:
 * - Positive infinity: numerator > 0, denominator = 0
 * - Negative infinity: numerator < 0, denominator = 0
 * - Not a number: numerator = 0, denominator = 0 (avoided in practice)
 * 
 * Canonical Form:
 * - Denominator is always positive (sign in numerator)
 * - Fraction reduced to lowest terms (GCD = 1)
 * - Zero represented as 0/1
 * 
 * @example
 * const oneThird = RationalNumericValue.fromIntegers(1, 3);
 * const twoThirds = oneThird.add(oneThird); // Exact: 2/3
 * const one = twoThirds.add(oneThird);      // Exact: 1/1
 */
export class RationalNumericValue extends NumericValue<RationalNumericValue> {
    private readonly _numerator: bigint;
    private readonly _denominator: bigint;
    
    /**
     * Construct a rational number
     * 
     * @param numerator - Numerator (any BigInt)
     * @param denominator - Denominator (any non-zero BigInt)
     * 
     * Note: Automatically normalizes to canonical form:
     * - Reduces to lowest terms via GCD
     * - Ensures denominator is positive
     * - For infinity: denominator = 0, numerator = sign
     */
    constructor(numerator: bigint, denominator: bigint = 1n) {
        super();
        
        // Special case: infinity (zero denominator)
        if (denominator === 0n) {
            // Normalize infinity sign
            if (numerator > 0n) {
                this._numerator = 1n;
            } else if (numerator < 0n) {
                this._numerator = -1n;
            } else {
                // 0/0 - treat as NaN-like, but use positive infinity
                // In practice, this should be avoided
                this._numerator = 1n;
            }
            this._denominator = 0n;
            return;
        }
        
        // Special case: zero
        if (numerator === 0n) {
            this._numerator = 0n;
            this._denominator = 1n;
            return;
        }
        
        // Normalize: reduce to lowest terms
        const gcd = this._gcd(numerator, denominator);
        let num = numerator / gcd;
        let den = denominator / gcd;
        
        // Ensure denominator is positive (move sign to numerator)
        if (den < 0n) {
            num = -num;
            den = -den;
        }
        
        this._numerator = num;
        this._denominator = den;
    }
    
    /**
     * Get the numerator
     * For internal use and testing
     */
    get numerator(): bigint {
        return this._numerator;
    }
    
    /**
     * Get the denominator
     * For internal use and testing
     */
    get denominator(): bigint {
        return this._denominator;
    }
    
    // ============================================================
    // Type Identifier
    // ============================================================
    
    getType(): string {
        return 'rational';
    }
    
    // ============================================================
    // Constants
    // ============================================================
    
    static readonly ZERO = new RationalNumericValue(0n, 1n);
    static readonly ONE = new RationalNumericValue(1n, 1n);
    static readonly TWO = new RationalNumericValue(2n, 1n);
    static readonly POSITIVE_INFINITY = new RationalNumericValue(1n, 0n);
    static readonly NEGATIVE_INFINITY = new RationalNumericValue(-1n, 0n);
    
    // Additional useful constants
    static readonly ONE_HALF = new RationalNumericValue(1n, 2n);
    static readonly ONE_THIRD = new RationalNumericValue(1n, 3n);
    static readonly MINUS_ONE = new RationalNumericValue(-1n, 1n);
    
    // ============================================================
    // Comparison Operations
    // ============================================================
    
    /**
     * Compare with another RationalNumericValue
     * 
     * @param other - Value to compare with
     * @returns -1 if this < other, 0 if equal, 1 if this > other
     * 
     * Handles infinity correctly:
     * - +∞ > all finite values
     * - -∞ < all finite values
     * - +∞ = +∞, -∞ = -∞
     */
    compare(other: RationalNumericValue): number {
        // Handle infinity cases
        const thisInf = this._denominator === 0n;
        const otherInf = other._denominator === 0n;
        
        if (thisInf && otherInf) {
            // Both infinite - compare signs
            if (this._numerator > 0n && other._numerator < 0n) return 1;
            if (this._numerator < 0n && other._numerator > 0n) return -1;
            return 0; // Both same infinity
        }
        
        if (thisInf) {
            // This is infinite, other is finite
            return this._numerator > 0n ? 1 : -1;
        }
        
        if (otherInf) {
            // Other is infinite, this is finite
            return other._numerator > 0n ? -1 : 1;
        }
        
        // Both finite: compare a/b with c/d
        // a/b < c/d  ⟺  a*d < b*c  (since denominators are positive)
        const left = this._numerator * other._denominator;
        const right = other._numerator * this._denominator;
        
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
    }
    
    // ============================================================
    // Arithmetic Operations
    // ============================================================
    
    /**
     * Add another rational number
     * 
     * @param other - Value to add
     * @returns Sum as RationalNumericValue
     * 
     * Formula: a/b + c/d = (a*d + b*c) / (b*d)
     * Handles infinity: ∞ + anything = ∞
     */
    add(other: RationalNumericValue): RationalNumericValue {
        // Handle infinity cases
        if (this._denominator === 0n) return this.clone();
        if (other._denominator === 0n) return other.clone();
        
        // Both finite: a/b + c/d = (a*d + b*c) / (b*d)
        const num = this._numerator * other._denominator + 
                    this._denominator * other._numerator;
        const den = this._denominator * other._denominator;
        
        return new RationalNumericValue(num, den);
    }
    
    /**
     * Subtract another rational number
     * 
     * @param other - Value to subtract
     * @returns Difference as RationalNumericValue
     */
    subtract(other: RationalNumericValue): RationalNumericValue {
        return this.add(other.negate());
    }
    
    /**
     * Multiply by another rational number
     * 
     * @param other - Value to multiply by
     * @returns Product as RationalNumericValue
     * 
     * Formula: (a/b) * (c/d) = (a*c) / (b*d)
     * Handles infinity: ∞ * non-zero = ∞ (with appropriate sign)
     */
    multiply(other: RationalNumericValue): RationalNumericValue {
        // Handle infinity cases
        if (this._denominator === 0n || other._denominator === 0n) {
            // At least one operand is infinite
            
            // Check for 0 * ∞ (should be handled carefully)
            if (this._numerator === 0n || other._numerator === 0n) {
                // 0 * ∞ = 0 (we choose this convention)
                return RationalNumericValue.ZERO;
            }
            
            // Determine sign of infinity
            const sign = (this._numerator > 0n) === (other._numerator > 0n) ? 1n : -1n;
            return new RationalNumericValue(sign, 0n);
        }
        
        // Both finite: (a/b) * (c/d) = (a*c) / (b*d)
        return new RationalNumericValue(
            this._numerator * other._numerator,
            this._denominator * other._denominator
        );
    }
    
    /**
     * Divide by another rational number
     * 
     * @param other - Divisor
     * @returns Quotient as RationalNumericValue
     * 
     * Formula: (a/b) / (c/d) = (a*d) / (b*c)
     * 
     * Special cases:
     * - n / 0 = ±∞ (sign determined by n)
     * - n / ∞ = 0
     * - ∞ / n = ∞ (sign determined)
     * - ∞ / ∞ = undefined (we return 0 as fallback)
     */
    divide(other: RationalNumericValue): RationalNumericValue {
        // Division by infinity -> 0
        if (other._denominator === 0n) {
            return RationalNumericValue.ZERO;
        }
        
        // Division by zero -> infinity (with appropriate sign)
        if (other._numerator === 0n) {
            if (this._numerator === 0n) {
                // 0/0 -> treat as 0 (could be NaN, but we avoid it)
                return RationalNumericValue.ZERO;
            }
            const sign = this._numerator > 0n ? 1n : -1n;
            return new RationalNumericValue(sign, 0n);
        }
        
        // This is infinity, other is finite non-zero -> infinity
        if (this._denominator === 0n) {
            const sign = (this._numerator > 0n) === (other._numerator > 0n) ? 1n : -1n;
            return new RationalNumericValue(sign, 0n);
        }
        
        // Both finite, other non-zero: (a/b) / (c/d) = (a*d) / (b*c)
        return new RationalNumericValue(
            this._numerator * other._denominator,
            this._denominator * other._numerator
        );
    }
    
    /**
     * Negate this rational number
     * 
     * @returns Negated value
     */
    negate(): RationalNumericValue {
        return new RationalNumericValue(-this._numerator, this._denominator);
    }
    
    /**
     * Absolute value
     * 
     * @returns Absolute value
     */
    abs(): RationalNumericValue {
        if (this._numerator >= 0n) return this.clone();
        return this.negate();
    }
    
    // ============================================================
    // Additional Rational-Specific Operations
    // ============================================================
    
    /**
     * Get the reciprocal (1 / this)
     * 
     * @returns Reciprocal as RationalNumericValue
     */
    reciprocal(): RationalNumericValue {
        if (this._numerator === 0n) {
            // 1/0 = infinity
            return RationalNumericValue.POSITIVE_INFINITY;
        }
        if (this._denominator === 0n) {
            // 1/∞ = 0
            return RationalNumericValue.ZERO;
        }
        // 1/(a/b) = b/a
        return new RationalNumericValue(this._denominator, this._numerator);
    }
    
    /**
     * Check if this is a proper fraction (|numerator| < |denominator|)
     * 
     * @returns true if proper fraction (absolute value < 1)
     */
    isProperFraction(): boolean {
        if (this._denominator === 0n) return false;
        const absNum = this._numerator < 0n ? -this._numerator : this._numerator;
        return absNum < this._denominator;
    }
    
    /**
     * Get the integer part (floor for positive, ceiling for negative)
     * 
     * @returns Integer part as RationalNumericValue
     */
    integerPart(): RationalNumericValue {
        if (this._denominator === 0n) return this.clone();
        const quotient = this._numerator / this._denominator;
        return new RationalNumericValue(quotient, 1n);
    }
    
    /**
     * Get the fractional part (always positive, < 1)
     * 
     * @returns Fractional part as RationalNumericValue
     */
    fractionalPart(): RationalNumericValue {
        if (this._denominator === 0n) return RationalNumericValue.ZERO;
        const remainder = this._numerator % this._denominator;
        // Ensure positive remainder
        const posRemainder = remainder < 0n ? remainder + this._denominator : remainder;
        return new RationalNumericValue(posRemainder, this._denominator);
    }
    
    // ============================================================
    // Infinity/Special Value Checks
    // ============================================================
    
    /**
     * Check if this value is infinite (positive or negative)
     * 
     * @returns true if infinite
     */
    isInfinite(): boolean {
        return this._denominator === 0n;
    }
    
    /**
     * Check if this value is positive infinity
     * 
     * @returns true if +∞
     */
    isPositiveInfinity(): boolean {
        return this._denominator === 0n && this._numerator > 0n;
    }
    
    /**
     * Check if this value is negative infinity
     * 
     * @returns true if -∞
     */
    isNegativeInfinity(): boolean {
        return this._denominator === 0n && this._numerator < 0n;
    }
    
    /**
     * Check if this is an integer (denominator = 1)
     * 
     * @returns true if integer
     */
    isInteger(): boolean {
        return this._denominator === 1n;
    }
    
    // ============================================================
    // Conversion Operations
    // ============================================================
    
    /**
     * Convert to JavaScript number (may lose precision)
     * 
     * @returns Numeric approximation
     */
    toNumber(): number {
        if (this._denominator === 0n) {
            return this._numerator > 0n ? Infinity : -Infinity;
        }
        return Number(this._numerator) / Number(this._denominator);
    }
    
    /**
     * Convert to BigInt by flooring
     * 
     * @returns Floor of this value as BigInt
     * @throws Error if value is infinite
     */
    toBigInt(): bigint {
        if (this._denominator === 0n) {
            throw new Error(`Cannot convert ${this.toString()} to BigInt`);
        }
        // Floor division: a/b floored
        // For positive: just use integer division
        // For negative: need to adjust if there's a remainder
        const quotient = this._numerator / this._denominator;
        const remainder = this._numerator % this._denominator;
        
        // If negative and there's a remainder, floor down by 1
        if (this._numerator < 0n && remainder !== 0n) {
            return quotient - 1n;
        }
        return quotient;
    }
    
    /**
     * Convert to string representation
     * 
     * @returns String in form "a/b", "a" (if integer), or "±∞" (if infinite)
     */
    toString(): string {
        if (this._denominator === 0n) {
            return this._numerator > 0n ? '+∞' : '-∞';
        }
        if (this._denominator === 1n) {
            return this._numerator.toString();
        }
        return `${this._numerator}/${this._denominator}`;
    }
    
    /**
     * Convert to decimal string with specified precision
     * 
     * @param decimals - Number of decimal places
     * @returns Decimal string approximation
     */
    toDecimalString(decimals: number = 10): string {
        if (this._denominator === 0n) {
            return this.toString();
        }
        
        // Compute decimal expansion
        const isNegative = this._numerator < 0n;
        const absNum = isNegative ? -this._numerator : this._numerator;
        
        const intPart = absNum / this._denominator;
        let remainder = absNum % this._denominator;
        
        let result = (isNegative ? '-' : '') + intPart.toString();
        
        if (decimals > 0 && remainder !== 0n) {
            result += '.';
            for (let i = 0; i < decimals; i++) {
                remainder *= 10n;
                const digit = remainder / this._denominator;
                result += digit.toString();
                remainder = remainder % this._denominator;
                if (remainder === 0n) break;
            }
        }
        
        return result;
    }
    
    /**
     * Clone this value
     * 
     * @returns New RationalNumericValue with same value
     */
    clone(): RationalNumericValue {
        // No normalization needed - already in canonical form
        return new RationalNumericValue(this._numerator, this._denominator);
    }
    
    // ============================================================
    // Private Helper Methods
    // ============================================================
    
    /**
     * Compute greatest common divisor using Euclidean algorithm
     * 
     * @param a - First number
     * @param b - Second number
     * @returns GCD of |a| and |b|
     */
    private _gcd(a: bigint, b: bigint): bigint {
        // Work with absolute values
        a = a < 0n ? -a : a;
        b = b < 0n ? -b : b;
        
        // Euclidean algorithm
        while (b !== 0n) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        
        return a;
    }
    
    // ============================================================
    // Factory Methods
    // ============================================================
    
    /**
     * Create RationalNumericValue from JavaScript integers
     * 
     * @param num - Numerator (JavaScript number)
     * @param den - Denominator (JavaScript number, default 1)
     * @returns New RationalNumericValue
     * @throws Error if inputs are not integers
     */
    static fromIntegers(num: number, den: number = 1): RationalNumericValue {
        if (!Number.isInteger(num) || !Number.isInteger(den)) {
            throw new Error('fromIntegers requires integer arguments');
        }
        return new RationalNumericValue(BigInt(num), BigInt(den));
    }
    
    /**
     * Create RationalNumericValue from BigInts
     * 
     * @param num - Numerator (BigInt)
     * @param den - Denominator (BigInt, default 1n)
     * @returns New RationalNumericValue
     */
    static fromBigInts(num: bigint, den: bigint = 1n): RationalNumericValue {
        return new RationalNumericValue(num, den);
    }

    /**
     * Create RationalNumericValue from BigInt (denominator 1)
     * 
     * @param num - Numerator (BigInt)
     * @returns New RationalNumericValue
     */
    static fromBigInt(num: bigint): RationalNumericValue {
        return new RationalNumericValue(num, 1n);
    }
    
    /**
     * Create RationalNumericValue from JavaScript number (approximate)
     * Converts decimal to fraction with specified denominator limit
     * 
     * @param value - JavaScript number to convert
     * @param maxDenominator - Maximum denominator (default 1000000)
     * @returns Approximate RationalNumericValue
     */
    static fromNumber(value: number, maxDenominator: number = 1000000): RationalNumericValue {
        if (!isFinite(value)) {
            return value > 0 
                ? RationalNumericValue.POSITIVE_INFINITY 
                : RationalNumericValue.NEGATIVE_INFINITY;
        }
        
        if (Number.isInteger(value)) {
            return RationalNumericValue.fromIntegers(value, 1);
        }
        
        // Use continued fractions algorithm for best rational approximation
        const sign = value < 0 ? -1 : 1;
        value = Math.abs(value);
        
        let h1 = 1, h2 = 0;
        let k1 = 0, k2 = 1;
        let b = value;
        
        do {
            const a = Math.floor(b);
            let aux = h1;
            h1 = a * h1 + h2;
            h2 = aux;
            aux = k1;
            k1 = a * k1 + k2;
            k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(value - h1 / k1) > 1e-8 && k1 <= maxDenominator && b !== Infinity);
        
        return new RationalNumericValue(BigInt(sign * h1), BigInt(k1));
    }
    
    /**
     * Parse from string
     * Accepts formats: "a/b", "a", "±∞", "Infinity"
     * 
     * @param s - String representation
     * @returns New RationalNumericValue or null if invalid
     */
    static parse(s: string): RationalNumericValue | null {
        s = s.trim();
        
        // Handle infinity
        if (s === '+∞' || s === 'Infinity' || s === '+Infinity') {
            return RationalNumericValue.POSITIVE_INFINITY;
        }
        if (s === '-∞' || s === '-Infinity') {
            return RationalNumericValue.NEGATIVE_INFINITY;
        }
        
        // Check for fraction format
        if (s.includes('/')) {
            const parts = s.split('/');
            if (parts.length !== 2) return null;
            
            try {
                const num = BigInt(parts[0].trim());
                const den = BigInt(parts[1].trim());
                return new RationalNumericValue(num, den);
            } catch {
                return null;
            }
        }
        
        // Try parsing as integer
        try {
            const num = BigInt(s);
            return new RationalNumericValue(num, 1n);
        } catch {
            // Try parsing as decimal
            const value = parseFloat(s);
            if (isNaN(value)) return null;
            return RationalNumericValue.fromNumber(value);
        }
    }
    
    /**
     * Parse from string, throw on error
     * 
     * @param s - String representation
     * @returns New RationalNumericValue
     * @throws Error if string is invalid
     */
    static parseOrThrow(s: string): RationalNumericValue {
        const result = RationalNumericValue.parse(s);
        if (result === null) {
            throw new Error(`Invalid rational numeric value: "${s}"`);
        }
        return result;
    }
    
    /**
     * Compute n / (n + x) for BigInt n and this value as x
     * 
     * This computes the exact rational result for the finite ordinal mapping formula.
     * Uses pure BigInt arithmetic to maintain exactness.
     * 
     * Formula: n / (n + x) where x = num/den
     * Result: (n * den) / (n * den + num)
     * 
     * @param n - The finite ordinal (as BigInt)
     * @param x - The scale parameter (this value)
     * @returns n / (n + x) as RationalNumericValue (exact)
     */
    divideFiniteByFinitePlusThis(n: bigint, x: RationalNumericValue): RationalNumericValue {
        // Handle special cases
        if (x._denominator === 0n) {
            // x is infinity: n / (n + ∞) = 0
            return RationalNumericValue.ZERO;
        }
        
        // n / (n + x) where x = num/den
        // = n / (n + num/den)
        // = n / ((n*den + num)/den)
        // = (n * den) / (n*den + num)
        
        const num = x._numerator;
        const den = x._denominator;
        
        const resultNumerator = n * den;
        const resultDenominator = n * den + num;
        
        return new RationalNumericValue(resultNumerator, resultDenominator);
    }
}
