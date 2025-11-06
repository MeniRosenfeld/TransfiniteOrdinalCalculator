/**
 * DoubleNumericValue.ts
 * 
 * IEEE 754 double-precision floating-point numeric value.
 * Uses JavaScript's native number type with built-in infinity support.
 * 
 * Features:
 * - Fast arithmetic operations
 * - ~15 decimal digits of precision
 * - Native Infinity and -Infinity support
 * - Range: ±5e-324 to ±1.7976931348623157e+308
 */

import { NumericValue } from './NumericValue.js';

/**
 * Double-precision floating-point numeric value
 * 
 * Wraps JavaScript number with NumericValue interface.
 * All operations are type-safe - only accepts other DoubleNumericValue instances.
 * 
 * Infinity Handling:
 * - Division by zero returns Infinity or -Infinity
 * - Infinity + Infinity = Infinity (same sign)
 * - Infinity * number = Infinity (with appropriate sign)
 * - Operations with NaN propagate NaN
 * 
 * @example
 * const a = DoubleNumericValue.fromNumber(5.5);
 * const b = DoubleNumericValue.fromNumber(2.0);
 * const sum = a.add(b); // 7.5
 * const inf = a.divide(DoubleNumericValue.ZERO); // Infinity
 */
export class DoubleNumericValue extends NumericValue<DoubleNumericValue> {
    private readonly _value: number;
    
    /**
     * Construct a double numeric value
     * 
     * @param value - JavaScript number (may be Infinity, -Infinity, or NaN)
     */
    constructor(value: number) {
        super();
        this._value = value;
    }
    
    /**
     * Get the underlying JavaScript number
     * Exposed for internal use only
     * 
     * @returns The raw number value
     */
    get value(): number {
        return this._value;
    }
    
    // ============================================================
    // Type Identifier
    // ============================================================
    
    getType(): string {
        return 'double';
    }
    
    // ============================================================
    // Constants
    // ============================================================
    
    static readonly ZERO = new DoubleNumericValue(0);
    static readonly ONE = new DoubleNumericValue(1);
    static readonly TWO = new DoubleNumericValue(2);
    static readonly POSITIVE_INFINITY = new DoubleNumericValue(Infinity);
    static readonly NEGATIVE_INFINITY = new DoubleNumericValue(-Infinity);
    static readonly NaN = new DoubleNumericValue(NaN);
    
    // ============================================================
    // Comparison Operations
    // ============================================================
    
    /**
     * Compare with another DoubleNumericValue
     * 
     * @param other - Value to compare with
     * @returns -1 if this < other, 0 if equal, 1 if this > other
     * 
     * Note: NaN comparisons always return false for equality,
     * but we implement compare to return consistent ordering for sorting
     */
    compare(other: DoubleNumericValue): number {
        const a = this._value;
        const b = other._value;
        
        // Handle NaN: treat as "greater than everything" for consistent ordering
        if (isNaN(a) && isNaN(b)) return 0;
        if (isNaN(a)) return 1;
        if (isNaN(b)) return -1;
        
        // Normal comparison
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
    
    // ============================================================
    // Arithmetic Operations
    // ============================================================
    
    /**
     * Add another DoubleNumericValue
     * 
     * @param other - Value to add
     * @returns Sum as DoubleNumericValue
     */
    add(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value + other._value);
    }
    
    /**
     * Subtract another DoubleNumericValue
     * 
     * @param other - Value to subtract
     * @returns Difference as DoubleNumericValue
     */
    subtract(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value - other._value);
    }
    
    /**
     * Multiply by another DoubleNumericValue
     * 
     * @param other - Value to multiply by
     * @returns Product as DoubleNumericValue
     */
    multiply(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value * other._value);
    }
    
    /**
     * Divide by another DoubleNumericValue
     * 
     * @param other - Divisor
     * @returns Quotient as DoubleNumericValue
     * 
     * Note: Division by zero returns Infinity or -Infinity
     * 0/0 returns NaN
     */
    divide(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value / other._value);
    }
    
    /**
     * Negate this value
     * 
     * @returns Negated value
     */
    negate(): DoubleNumericValue {
        return new DoubleNumericValue(-this._value);
    }
    
    /**
     * Absolute value
     * 
     * @returns Absolute value
     */
    abs(): DoubleNumericValue {
        return new DoubleNumericValue(Math.abs(this._value));
    }
    
    // ============================================================
    // Additional Math Operations
    // ============================================================
    
    /**
     * Square root
     * 
     * @returns Square root as DoubleNumericValue
     * Note: Returns NaN for negative numbers
     */
    sqrt(): DoubleNumericValue {
        return new DoubleNumericValue(Math.sqrt(this._value));
    }
    
    /**
     * Natural logarithm
     * 
     * @returns ln(this) as DoubleNumericValue
     */
    ln(): DoubleNumericValue {
        return new DoubleNumericValue(Math.log(this._value));
    }
    
    /**
     * Exponential (e^this)
     * 
     * @returns e^this as DoubleNumericValue
     */
    exp(): DoubleNumericValue {
        return new DoubleNumericValue(Math.exp(this._value));
    }
    
    /**
     * Floor (round down to integer)
     * 
     * @returns Largest integer <= this
     */
    floor(): DoubleNumericValue {
        return new DoubleNumericValue(Math.floor(this._value));
    }
    
    /**
     * Ceiling (round up to integer)
     * 
     * @returns Smallest integer >= this
     */
    ceil(): DoubleNumericValue {
        return new DoubleNumericValue(Math.ceil(this._value));
    }
    
    /**
     * Round to nearest integer
     * 
     * @returns Nearest integer
     */
    round(): DoubleNumericValue {
        return new DoubleNumericValue(Math.round(this._value));
    }
    
    // ============================================================
    // Infinity/Special Value Checks
    // ============================================================
    
    /**
     * Check if this value is infinite (positive or negative)
     * 
     * @returns true if this is +Infinity or -Infinity
     */
    isInfinite(): boolean {
        return !isFinite(this._value) && !isNaN(this._value);
    }
    
    /**
     * Check if this value is positive infinity
     * 
     * @returns true if this is +Infinity
     */
    isPositiveInfinity(): boolean {
        return this._value === Infinity;
    }
    
    /**
     * Check if this value is negative infinity
     * 
     * @returns true if this is -Infinity
     */
    isNegativeInfinity(): boolean {
        return this._value === -Infinity;
    }
    
    /**
     * Check if this value is NaN (Not a Number)
     * 
     * @returns true if this is NaN
     */
    isNaN(): boolean {
        return isNaN(this._value);
    }
    
    /**
     * Check if this value is finite (not infinite, not NaN)
     * 
     * @returns true if this is a finite number
     */
    isFinite(): boolean {
        return isFinite(this._value);
    }
    
    /**
     * Check if this value is an integer
     * 
     * @returns true if this is an integer value
     */
    isInteger(): boolean {
        return Number.isInteger(this._value);
    }
    
    // ============================================================
    // Conversion Operations
    // ============================================================
    
    /**
     * Convert to JavaScript number
     * 
     * @returns The underlying number value
     */
    toNumber(): number {
        return this._value;
    }
    
    /**
     * Convert to BigInt by flooring
     * 
     * @returns Floor of this value as BigInt
     * @throws Error if value is Infinity, -Infinity, or NaN
     */
    toBigInt(): bigint {
        if (!isFinite(this._value)) {
            throw new Error(`Cannot convert ${this._value} to BigInt`);
        }
        return BigInt(Math.floor(this._value));
    }
    
    /**
     * Convert to string representation
     * 
     * @returns String representation
     */
    toString(): string {
        if (this._value === Infinity) return '+∞';
        if (this._value === -Infinity) return '-∞';
        if (isNaN(this._value)) return 'NaN';
        return this._value.toString();
    }
    
    /**
     * Convert to fixed-precision string
     * 
     * @param decimals - Number of decimal places
     * @returns String with fixed decimal places
     */
    toFixed(decimals: number): string {
        if (!isFinite(this._value)) return this.toString();
        return this._value.toFixed(decimals);
    }
    
    /**
     * Convert to exponential notation
     * 
     * @param decimals - Number of decimal places
     * @returns String in exponential notation
     */
    toExponential(decimals?: number): string {
        if (!isFinite(this._value)) return this.toString();
        return this._value.toExponential(decimals);
    }
    
    /**
     * Clone this value
     * 
     * @returns New DoubleNumericValue with same value
     */
    clone(): DoubleNumericValue {
        return new DoubleNumericValue(this._value);
    }
    
    // ============================================================
    // Factory Methods
    // ============================================================
    
    /**
     * Create DoubleNumericValue from JavaScript number
     * 
     * @param n - JavaScript number
     * @returns New DoubleNumericValue
     */
    static fromNumber(n: number): DoubleNumericValue {
        return new DoubleNumericValue(n);
    }
    
       /**
     * Create DoubleNumericValue from BigInt
     * May lose precision for very large values
     * 
     * @param n - BigInt value
     * @returns New DoubleNumericValue
     */
    static fromBigInt(n: bigint): DoubleNumericValue {
        return new DoubleNumericValue(Number(n));
    }
    
    /**
     * Parse from string
     * 
     * @param s - String representation
     * @returns New DoubleNumericValue or null if invalid
     */
    static parse(s: string): DoubleNumericValue | null {
        // Handle special strings
        if (s === '+∞' || s === 'Infinity' || s === '+Infinity') {
            return DoubleNumericValue.POSITIVE_INFINITY;
        }
        if (s === '-∞' || s === '-Infinity') {
            return DoubleNumericValue.NEGATIVE_INFINITY;
        }
        if (s === 'NaN') {
            return DoubleNumericValue.NaN;
        }
        
        const n = parseFloat(s);
        if (isNaN(n)) return null;
        return new DoubleNumericValue(n);
    }
    
    /**
     * Create from string, throw on error
     * 
     * @param s - String representation
     * @returns New DoubleNumericValue
     * @throws Error if string is invalid
     */
    static parseOrThrow(s: string): DoubleNumericValue {
        const result = DoubleNumericValue.parse(s);
        if (result === null) {
            throw new Error(`Invalid double numeric value: "${s}"`);
        }
        return result;
    }
    
    /**
     * Compute n / (n + x) for BigInt n and this value as x
     * 
     * This efficiently computes the mapping formula for finite ordinals
     * by converting the BigInt to a double and using standard arithmetic.
     * 
     * @param n - The finite ordinal (as BigInt)
     * @param x - The scale parameter (this value)
     * @returns n / (n + x) as DoubleNumericValue
     */
    divideFiniteByFinitePlusThis(n: bigint, x: DoubleNumericValue): DoubleNumericValue {
        // Convert BigInt to number (may lose precision for very large n)
        const nDouble = Number(n);
        const xDouble = x._value;
        
        // Compute n / (n + x)
        return new DoubleNumericValue(nDouble / (nDouble + xDouble));
    }
}
