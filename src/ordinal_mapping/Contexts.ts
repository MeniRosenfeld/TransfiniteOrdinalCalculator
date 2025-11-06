import { NumericContext } from './NumericContext.js';
import { DoubleNumericValue } from './DoubleNumericValue.js';
import { RationalNumericValue } from './RationalNumericValue.js';

/**
 * DoubleContext provides a convenient factory for working with DoubleNumericValue.
 * 
 * This context uses IEEE 754 double-precision floating-point arithmetic,
 * providing fast computation with approximately 15-17 decimal digits of precision.
 * 
 * Usage Example:
 * ```typescript
 * const ctx = new DoubleContext();
 * 
 * // Create values
 * const x = ctx.fromNumber(3.14159);
 * const y = ctx.parse("2.71828");
 * 
 * // Use constants
 * const zero = ctx.ZERO;
 * const inf = ctx.POSITIVE_INFINITY;
 * 
 * // Create intervals
 * const interval = ctx.interval(x, y);
 * const centered = ctx.centeredInterval(x, ctx.fromNumber(0.1));
 * 
 * // Utility methods
 * const values = ctx.fromNumbers([1.0, 2.0, 3.0]);
 * const sum = ctx.sum(values);
 * ```
 */
export class DoubleContext extends NumericContext<DoubleNumericValue> {
  // Constants
  readonly ZERO = DoubleNumericValue.ZERO;
  readonly ONE = DoubleNumericValue.ONE;
  readonly TWO = DoubleNumericValue.TWO;
  readonly POSITIVE_INFINITY = DoubleNumericValue.POSITIVE_INFINITY;
  readonly NEGATIVE_INFINITY = DoubleNumericValue.NEGATIVE_INFINITY;

  /**
   * Creates a DoubleNumericValue from a JavaScript number.
   * 
   * @param value - The number to convert
   * @returns A DoubleNumericValue
   */
  fromNumber(value: number): DoubleNumericValue {
    return DoubleNumericValue.fromNumber(value);
  }



  /**
   * Creates a DoubleNumericValue from a BigInt.
   * May lose precision for very large BigInts.
   * 
   * @param value - The BigInt to convert
   * @returns A DoubleNumericValue
   */
  fromBigInt(value: bigint): DoubleNumericValue {
    return DoubleNumericValue.fromBigInt(value);
  }

  /**
   * Parses a string to a DoubleNumericValue.
   * Returns undefined if parsing fails.
   * 
   * @param str - The string to parse (e.g., "3.14", "1e-5", "Infinity")
   * @returns A DoubleNumericValue, or undefined if invalid
   */
  parse(str: string): DoubleNumericValue | undefined {
    return DoubleNumericValue.parse(str) ?? undefined;
  }

  /**
   * Parses a string to a DoubleNumericValue.
   * Throws an error if parsing fails.
   * 
   * @param str - The string to parse
   * @returns A DoubleNumericValue
   * @throws Error if the string is invalid
   */
  parseOrThrow(str: string): DoubleNumericValue {
    return DoubleNumericValue.parseOrThrow(str);
  }

  /**
   * Gets the NaN (Not a Number) value.
   * 
   * @returns DoubleNumericValue representing NaN
   */
  get NaN(): DoubleNumericValue {
    return DoubleNumericValue.NaN;
  }
}

/**
 * RationalContext provides a convenient factory for working with RationalNumericValue.
 * 
 * This context uses exact BigInt-based rational arithmetic,
 * providing unlimited precision for rational number operations.
 * 
 * Usage Example:
 * ```typescript
 * const ctx = new RationalContext();
 * 
 * // Create exact fractions
 * const oneThird = ctx.fromIntegers(1, 3);
 * const oneHalf = ctx.fromIntegers(1, 2);
 * 
 * // Exact arithmetic
 * const sum = oneThird.add(oneThird).add(oneThird);
 * // sum equals exactly RationalNumericValue.ONE
 * 
 * // Create from approximate doubles (may lose precision)
 * const approx = ctx.fromNumber(0.333333);
 * 
 * // Use constants
 * const zero = ctx.ZERO;
 * const inf = ctx.POSITIVE_INFINITY;  // 1/0
 * 
 * // Create intervals
 * const interval = ctx.interval(oneThird, oneHalf);
 * ```
 */
export class RationalContext extends NumericContext<RationalNumericValue> {
  // Constants
  readonly ZERO = RationalNumericValue.ZERO;
  readonly ONE = RationalNumericValue.ONE;
  readonly TWO = RationalNumericValue.TWO;
  readonly POSITIVE_INFINITY = RationalNumericValue.POSITIVE_INFINITY;
  readonly NEGATIVE_INFINITY = RationalNumericValue.NEGATIVE_INFINITY;

  /**
   * Creates a RationalNumericValue from a JavaScript number.
   * 
   * Note: This conversion may be approximate due to the limitations
   * of floating-point representation. For exact fractions, use fromIntegers.
   * 
   * @param value - The number to convert
   * @returns A RationalNumericValue (approximate)
   */
  fromNumber(value: number): RationalNumericValue {
    return RationalNumericValue.fromNumber(value);
  }

  /**
   * Creates a RationalNumericValue from a BigInt.
   * May lose precision for very large BigInts.
   * 
   * @param value - The BigInt to convert
   * @returns A RationalNumericValue
   */
  fromBigInt(value: bigint): RationalNumericValue {
    return RationalNumericValue.fromBigInt(value);
  }

  /**
   * Creates a RationalNumericValue from integer numerator and denominator.
   * 
   * This is the preferred method for exact rational creation.
   * The fraction is automatically reduced to lowest terms.
   * 
   * @param numerator - The numerator (JavaScript number, converted to BigInt)
   * @param denominator - The denominator (JavaScript number, converted to BigInt)
   * @returns A RationalNumericValue in canonical form
   * @throws Error if denominator is zero (unless creating infinity)
   */
  fromIntegers(numerator: number, denominator: number): RationalNumericValue {
    return RationalNumericValue.fromIntegers(numerator, denominator);
  }

  /**
   * Creates a RationalNumericValue from BigInt numerator and denominator.
   * 
   * This method provides full precision for large integers.
   * The fraction is automatically reduced to lowest terms.
   * 
   * @param numerator - The numerator (BigInt)
   * @param denominator - The denominator (BigInt)
   * @returns A RationalNumericValue in canonical form
   */
  fromBigInts(numerator: bigint, denominator: bigint): RationalNumericValue {
    return RationalNumericValue.fromBigInts(numerator, denominator);
  }

  /**
   * Creates a RationalNumericValue from an integer.
   * 
   * @param value - The integer value
   * @returns A RationalNumericValue with denominator 1
   */
  fromInteger(value: number): RationalNumericValue {
    return RationalNumericValue.fromIntegers(value, 1);
  }

  /**
   * Parses a string to a RationalNumericValue.
   * Returns undefined if parsing fails.
   * 
   * Supported formats:
   * - "123" (integer)
   * - "123/456" (fraction)
   * - "3.14159" (decimal, converted to rational)
   * - "Infinity", "-Infinity" (zero-denominator rationals)
   * 
   * @param str - The string to parse
   * @returns A RationalNumericValue, or undefined if invalid
   */
  parse(str: string): RationalNumericValue | undefined {
    return RationalNumericValue.parse(str) ?? undefined;
  }

  /**
   * Parses a string to a RationalNumericValue.
   * Throws an error if parsing fails.
   * 
   * @param str - The string to parse
   * @returns A RationalNumericValue
   * @throws Error if the string is invalid
   */
  parseOrThrow(str: string): RationalNumericValue {
    return RationalNumericValue.parseOrThrow(str);
  }
}
