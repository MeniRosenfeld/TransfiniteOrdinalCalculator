/**
 * NumericValue.ts
 * 
 * Abstract base class for numeric value types with self-referential generic.
 * Ensures type safety: operations only accept same-type operands.
 * 
 * Generic parameter T is the concrete type (e.g., DoubleNumericValue)
 * This enables compile-time enforcement of type consistency.
 */

/**
 * Abstract base class for numeric values with type-safe operations
 * 
 * @template T - The concrete numeric type (must extend NumericValue<T>)
 * 
 * Design:
 * - All arithmetic operations return type T (same as operands)
 * - Comparison methods take type T as parameter
 * - Subclasses must implement all abstract methods
 * - Static constants (ZERO, ONE, etc.) are overridden by subclasses
 * 
 * Type Safety:
 * - DoubleNumericValue.add() only accepts another DoubleNumericValue
 * - RationalNumericValue.add() only accepts another RationalNumericValue
 * - Mixing types requires explicit conversion (not implemented automatically)
 */
export abstract class NumericValue<T extends NumericValue<T>> {
    /**
     * Get the type identifier for this numeric value
     * Used for runtime type checking and debugging
     * 
     * @returns Type identifier string (e.g., "double", "rational")
     */
    abstract getType(): string;

    // ============================================================
    // Factory Methods (Abstract - must be implemented)
    // ============================================================

    // ============================================================
    // Constants (Subclasses should override with concrete types)
    // ============================================================
    // Note: These are declared as any to avoid TypeScript static property
    // inheritance issues. Subclasses will override with proper types.

    /**
     * Zero value - must be overridden by subclasses
     * TypeScript will enforce correct type at compile time
     */
    static readonly ZERO: any;

    /**
     * One value - must be overridden by subclasses
     */
    static readonly ONE: any;

    /**
     * Two value - must be overridden by subclasses
     */
    static readonly TWO: any;

    /**
     * Positive infinity - must be overridden by subclasses
     */
    static readonly POSITIVE_INFINITY: any;

    /**
     * Negative infinity - must be overridden by subclasses
     */
    static readonly NEGATIVE_INFINITY: any;

    // ============================================================
    // Comparison Operations (Abstract - must be implemented)
    // ============================================================

    /**
     * Compare this value with another
     * 
     * @param other - Value to compare with (must be same type T)
     * @returns -1 if this < other, 0 if equal, 1 if this > other
     * 
     * Contract:
     * - compare(a, b) must return opposite sign of compare(b, a)
     * - compare(a, a) must return 0
     * - Transitive: if compare(a,b)<0 and compare(b,c)<0 then compare(a,c)<0
     */
    abstract compare(other: T): number;

    // ============================================================
    // Arithmetic Operations (Abstract - must be implemented)
    // ============================================================

    /**
     * Add another value
     * 
     * @param other - Value to add (must be same type T)
     * @returns Sum as type T
     */
    abstract add(other: T): T;

    /**
     * Subtract another value
     * 
     * @param other - Value to subtract (must be same type T)
     * @returns Difference as type T
     */
    abstract subtract(other: T): T;

    /**
     * Multiply by another value
     * 
     * @param other - Value to multiply by (must be same type T)
     * @returns Product as type T
     */
    abstract multiply(other: T): T;

    /**
     * Divide by another value
     * 
     * @param other - Divisor (must be same type T)
     * @returns Quotient as type T
     * 
     * Note: Division by zero should return appropriate infinity value
     */
    abstract divide(other: T): T;

    /**
     * Negate this value
     * 
     * @returns Negated value as type T
     */
    abstract negate(): T;

    /**
     * Absolute value
     * 
     * @returns Absolute value as type T
     */
    abstract abs(): T;

    // ============================================================
    // Conversion Operations (Abstract)
    // ============================================================

    /**
     * Convert to JavaScript number
     * May lose precision for large values
     * 
     * @returns Numeric approximation as JavaScript number
     */
    abstract toNumber(): number;

    /**
     * Convert to BigInt by flooring
     * Used for converting numeric values to ordinal coefficients
     * 
     * @returns Floor of this value as BigInt
     */
    abstract toBigInt(): bigint;

    /**
     * Convert to string representation
     * 
     * @returns String representation for display/debugging
     */
    abstract toString(): string;

    /**
     * Create a deep copy of this value
     * 
     * @returns New instance with same value
     */
    abstract clone(): T;

    // ============================================================
    // Derived Comparison Methods (Concrete - implemented via compare)
    // ============================================================

    /**
     * Test equality
     * 
     * @param other - Value to compare with
     * @returns true if values are equal
     */
    equals(other: T): boolean {
        return this.compare(other) === 0;
    }

    /**
     * Test if this value is less than another
     * 
     * @param other - Value to compare with
     * @returns true if this < other
     */
    lessThan(other: T): boolean {
        return this.compare(other) < 0;
    }

    /**
     * Test if this value is less than or equal to another
     * 
     * @param other - Value to compare with
     * @returns true if this <= other
     */
    lessThanOrEqual(other: T): boolean {
        return this.compare(other) <= 0;
    }

    /**
     * Test if this value is greater than another
     * 
     * @param other - Value to compare with
     * @returns true if this > other
     */
    greaterThan(other: T): boolean {
        return this.compare(other) > 0;
    }

    /**
     * Test if this value is greater than or equal to another
     * 
     * @param other - Value to compare with
     * @returns true if this >= other
     */
    greaterThanOrEqual(other: T): boolean {
        return this.compare(other) >= 0;
    }

    // ============================================================
    // Derived Arithmetic Methods (Concrete)
    // ============================================================

    /**
     * Square this value (multiply by itself)
     * 
     * @returns this * this as type T
     */
    square(): T {
        // Cast to T for type safety (this is always of type T at runtime)
        return this.multiply(this as unknown as T);
    }

    /**
     * Cube this value (multiply by itself twice)
     * 
     * @returns this * this * this as type T
     */
    cube(): T {
        const squared = this.square();
        return squared.multiply(this as unknown as T);
    }

    /**
     * Raise to integer power
     * Uses exponentiation by squaring for efficiency
     * 
     * @param n - Exponent (must be non-negative integer)
     * @returns this^n as type T
     * @throws Error if n is negative
     */
    power(n: number): T {
        if (n < 0) {
            throw new Error('power() requires non-negative exponent');
        }
        if (!Number.isInteger(n)) {
            throw new Error('power() requires integer exponent');
        }

        if (n === 0) {
            // Any value to the power 0 is 1
            return (this.constructor as any).ONE as T;
        }
        if (n === 1) {
            return this as unknown as T;
        }
        if (n === 2) {
            return this.square();
        }

        // Exponentiation by squaring
        let result = (this.constructor as any).ONE as T;
        let base = this as unknown as T;
        let exp = n;

        while (exp > 0) {
            if (exp % 2 === 1) {
                result = result.multiply(base);
            }
            base = base.multiply(base);
            exp = Math.floor(exp / 2);
        }

        return result;
    }

    /**
     * Check if this value is zero
     * 
     * @returns true if this equals the ZERO constant
     */
    isZero(): boolean {
        const zero = (this.constructor as any).ZERO as T;
        return this.equals(zero);
    }

    /**
     * Check if this value is one
     * 
     * @returns true if this equals the ONE constant
     */
    isOne(): boolean {
        const one = (this.constructor as any).ONE as T;
        return this.equals(one);
    }

    /**
     * Check if this value is positive (> 0)
     * 
     * @returns true if this > 0
     */
    isPositive(): boolean {
        const zero = (this.constructor as any).ZERO as T;
        return this.greaterThan(zero);
    }

    /**
     * Check if this value is negative (< 0)
     * 
     * @returns true if this < 0
     */
    isNegative(): boolean {
        const zero = (this.constructor as any).ZERO as T;
        return this.lessThan(zero);
    }

    /**
     * Get the sign of this value
     * 
     * @returns -1 if negative, 0 if zero, 1 if positive
     */
    sign(): number {
        if (this.isZero()) return 0;
        if (this.isPositive()) return 1;
        return -1;
    }

    /**
     * Compute n / (n + x) for BigInt n and numeric value x
     * 
     * This is a key operation for mapping finite ordinals to the interval [0, 1).
     * The implementation handles the conversion from integer arithmetic (BigInt)
     * to the real numeric domain (type T) appropriately for each numeric type.
     * 
     * Formula: n / (n + x)
     * 
     * @param n - The integer numerator/offset (as BigInt)
     * @param x - The scale parameter (as type T)
     * @returns n / (n + x) as type T
     * 
     * Mathematical properties:
     * - When n = 0: result is 0
     * - As n → ∞: result → 1
     * - Result is always in [0, 1) for positive x
     * 
     * @example
     * ```typescript
     * // For DoubleNumericValue
     * const ctx = new DoubleContext();
     * const scale = ctx.fromNumber(3);
     * const result = scale.divideFiniteByFinitePlusThis(5n); // 5 / (5 + 3) = 5/8
     * ```
     */
    abstract divideFiniteByFinitePlusThis(n: bigint, x: T): T;
}
