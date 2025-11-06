import { NumericValue } from './NumericValue.js';
import { Interval } from './Interval.js';

/**
 * NumericContext provides a convenient factory and constant access pattern
 * for working with a specific numeric type T.
 * 
 * This abstract class defines the interface for creating numeric values and intervals,
 * accessing common constants, and performing type-specific operations.
 * 
 * Concrete implementations provide type-specific factory methods for:
 * - Creating values from various input types (numbers, strings, BigInts)
 * - Accessing standard constants (ZERO, ONE, TWO, etc.)
 * - Creating intervals with various patterns (empty, infinite, centered, etc.)
 * 
 * Usage Example:
 * ```typescript
 * const ctx = new DoubleContext();
 * const x = ctx.fromNumber(3.14);
 * const y = ctx.fromNumber(2.71);
 * const sum = x.add(y);
 * const interval = ctx.interval(x, y);
 * ```
 * 
 * Benefits:
 * - Eliminates need to reference concrete types directly
 * - Provides consistent API across numeric types
 * - Simplifies switching between Double and Rational arithmetic
 * - Reduces boilerplate in client code
 */
export abstract class NumericContext<T extends NumericValue<T>> {
  // ============================================================================
  // Abstract Constants - Must be implemented by concrete contexts
  // ============================================================================

  /**
   * The zero value (0).
   */
  abstract readonly ZERO: T;

  /**
   * The one value (1).
   */
  abstract readonly ONE: T;

  /**
   * The two value (2).
   */
  abstract readonly TWO: T;

  /**
   * Positive infinity (+∞).
   */
  abstract readonly POSITIVE_INFINITY: T;

  /**
   * Negative infinity (-∞).
   */
  abstract readonly NEGATIVE_INFINITY: T;

  // ============================================================================
  // Abstract Factory Methods - Must be implemented by concrete contexts
  // ============================================================================

  /**
   * Creates a numeric value from a JavaScript number.
   * 
   * @param value - The number to convert
   * @returns A numeric value of type T
   * 
   * Note: For rationals, this may be approximate due to floating-point representation.
   */
  abstract fromNumber(value: number): T;

    /**
   * Creates a numeric value from a BigInt.
   * 
   * @param value - The BigInt to convert
   * @returns A numeric value of type T
   * 
   */
  abstract fromBigInt(value: BigInt): T;

  /**
   * Creates a numeric value from a string representation.
   * Returns undefined if parsing fails.
   * 
   * @param str - The string to parse
   * @returns A numeric value of type T, or undefined if invalid
   */
  abstract parse(str: string): T | undefined;

  /**
   * Creates a numeric value from a string representation.
   * Throws an error if parsing fails.
   * 
   * @param str - The string to parse
   * @returns A numeric value of type T
   * @throws Error if the string is invalid
   */
  abstract parseOrThrow(str: string): T;

  // ============================================================================
  // Concrete Interval Factory Methods
  // ============================================================================

  /**
   * Creates an interval [lower, upper].
   * 
   * @param lower - The lower bound
   * @param upper - The upper bound
   * @returns An interval [lower, upper]
   */
  interval(lower: T, upper: T): Interval<T> {
    return new Interval(lower, upper);
  }

  /**
   * Creates a singleton interval [value, value].
   * 
   * @param value - The single point value
   * @returns A singleton interval
   */
  singleton(value: T): Interval<T> {
    return Interval.singleton(value);
  }

  /**
   * Creates an empty interval.
   * 
   * @returns An empty interval [+∞, -∞]
   */
  emptyInterval(): Interval<T> {
    return Interval.empty(this.ZERO);
  }

  /**
   * Creates an infinite interval (-∞, +∞).
   * 
   * @returns An infinite interval
   */
  infiniteInterval(): Interval<T> {
    return Interval.infinite(this.ZERO);
  }

  /**
   * Creates a zero interval [0, 0].
   * 
   * @returns A zero interval
   */
  zeroInterval(): Interval<T> {
    return Interval.zero(this.ZERO);
  }

  /**
   * Creates a one interval [1, 1].
   * 
   * @returns A one interval
   */
  oneInterval(): Interval<T> {
    return Interval.one(this.ZERO);
  }

  /**
   * Creates a symmetric interval around zero: [-radius, +radius].
   * 
   * @param radius - The radius (must be non-negative)
   * @returns A symmetric interval
   * @throws Error if radius is negative
   */
  symmetricInterval(radius: T): Interval<T> {
    return Interval.symmetric(radius);
  }

  /**
   * Creates an interval centered at a point with given radius: [center - radius, center + radius].
   * 
   * @param center - The center point
   * @param radius - The radius (must be non-negative)
   * @returns A centered interval
   * @throws Error if radius is negative
   */
  centeredInterval(center: T, radius: T): Interval<T> {
    return Interval.centered(center, radius);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Creates an array of numeric values from an array of numbers.
   * 
   * @param values - Array of numbers
   * @returns Array of numeric values of type T
   */
  fromNumbers(values: number[]): T[] {
    return values.map(v => this.fromNumber(v));
  }

  /**
   * Converts an array of numeric values to an array of numbers.
   * 
   * @param values - Array of numeric values
   * @returns Array of numbers
   */
  toNumbers(values: T[]): number[] {
    return values.map(v => v.toNumber());
  }

  /**
   * Gets the minimum of two values.
   * 
   * @param a - First value
   * @param b - Second value
   * @returns The smaller value
   */
  min(a: T, b: T): T {
    return a.lessThan(b) ? a : b;
  }

  /**
   * Gets the maximum of two values.
   * 
   * @param a - First value
   * @param b - Second value
   * @returns The larger value
   */
  max(a: T, b: T): T {
    return a.greaterThan(b) ? a : b;
  }

  /**
   * Clamps a value to a range [min, max].
   * 
   * @param value - The value to clamp
   * @param min - The minimum bound
   * @param max - The maximum bound
   * @returns The clamped value
   */
  clamp(value: T, min: T, max: T): T {
    if (value.lessThan(min)) return min;
    if (value.greaterThan(max)) return max;
    return value;
  }

  /**
   * Computes the sum of an array of values.
   * 
   * @param values - Array of values to sum
   * @returns The sum, or ZERO if array is empty
   */
  sum(values: T[]): T {
    if (values.length === 0) return this.ZERO;
    return values.reduce((acc, val) => acc.add(val));
  }

  /**
   * Computes the product of an array of values.
   * 
   * @param values - Array of values to multiply
   * @returns The product, or ONE if array is empty
   */
  product(values: T[]): T {
    if (values.length === 0) return this.ONE;
    return values.reduce((acc, val) => acc.multiply(val));
  }

  /**
   * Creates a range of values [start, start+step, start+2*step, ..., end].
   * 
   * @param start - The starting value
   * @param end - The ending value (inclusive)
   * @param step - The step size
   * @returns Array of values in the range
   */
  range(start: T, end: T, step: T): T[] {
    const result: T[] = [];
    let current = start;
    
    if (step.isZero()) {
      throw new Error("Step cannot be zero");
    }

    const isIncreasing = step.greaterThan(this.ZERO);
    
    while (isIncreasing ? !current.greaterThan(end) : !current.lessThan(end)) {
      result.push(current);
      current = current.add(step);
    }
    
    return result;
  }

  /**
   * Linear interpolation between two values: a + t * (b - a).
   * 
   * @param a - Start value
   * @param b - End value
   * @param t - Interpolation parameter (0 = a, 1 = b)
   * @returns Interpolated value
   */
  lerp(a: T, b: T, t: T): T {
    // a + t * (b - a) = a * (1 - t) + b * t
    const oneMinusT = this.ONE.subtract(t);
    return a.multiply(oneMinusT).add(b.multiply(t));
  }
}
