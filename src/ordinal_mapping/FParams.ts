import { NumericValue } from './NumericValue.js';
import { NumericContext } from './NumericContext.js';

/**
 * FParams<T> represents type-safe parameters for the ordinal mapping function f().
 * 
 * This matches the original FParams class from ordinal_mapping.js but with type safety.
 * It includes precomputed optimization values that are computed once during construction.
 * 
 * Parameter Names (matching original):
 * - scaleAdd: Scale for finite ordinals (addition)
 * - scaleMult: Scale for omega (multiplication)
 * - scaleExp: Scale for exponentiation (ω^k)
 * - scaleTet: Scale for tetration/towers (ω↑↑n)
 * - scaleEpsilon: Scale for epsilon numbers (currently unused in formulas)
 * 
 * Usage Example:
 * ```typescript
 * // With doubles (fast, approximate)
 * const doubleCtx = new DoubleContext();
 * const doubleParams = new FParams(
 *   doubleCtx,
 *   doubleCtx.fromNumber(3),  // scaleAdd
 *   doubleCtx.fromNumber(3),  // scaleMult
 *   doubleCtx.fromNumber(3),  // scaleExp
 *   doubleCtx.fromNumber(3),  // scaleTet
 *   doubleCtx.fromNumber(3)   // scaleEpsilon
 * );
 * 
 * // With rationals (exact, slower)
 * const rationalCtx = new RationalContext();
 * const rationalParams = new FParams(
 *   rationalCtx,
 *   rationalCtx.fromNumber(3),
 *   rationalCtx.fromNumber(3),
 *   rationalCtx.fromNumber(3),
 *   rationalCtx.fromNumber(3),
 *   rationalCtx.fromNumber(3)
 * );
 * 
 * // Access parameters and precomputed values
 * const scale = params.scaleAdd;
 * const precomp5 = params.precomputed[5]; // f(ε_0)
 * ```
 * 
 * Validation Rules:
 * - All scales must be positive (> 0)
 * - All scales must be finite (no infinities)
 */
export class FParams<T extends NumericValue<T>> {
  /**
   * Numeric context for creating and manipulating values of type T.
   */
  readonly ctx: NumericContext<T>;

  /**
   * Scale parameter for finite ordinals (addition).
   * Used in: f(n) = n / (n + scaleAdd)
   */
  readonly scaleAdd: T;

  /**
   * Scale parameter for omega (multiplication).
   * Used in: f(ω^j) = 1 + scaleMult * (1 + scaleExp) * f(j-1)
   */
  readonly scaleMult: T;

  /**
   * Scale parameter for exponentiation.
   * Used in: f(ω^j) for finite j, and f(ω^k) for infinite k
   */
  readonly scaleExp: T;

  /**
   * Scale parameter for tetration (towers).
   * Used in: f(ω↑↑h) = 1 + (1 + scaleTet) * scaleMult * (1 + scaleExp) * f(h-1)
   */
  readonly scaleTet: T;

  /**
   * Scale parameter for epsilon numbers.
   * Currently stored but not used in formulas (reserved for future use).
   */
  readonly scaleEpsilon: T;

  /**
   * Precomputed optimization values.
   * These are computed once during construction to avoid repeated calculations.
   * 
   * - precomputed[1]: scaleMult * (1 + scaleExp)
   * - precomputed[2]: 1 + scaleMult
   * - precomputed[3]: 1 + scaleMult + scaleMult * scaleExp
   * - precomputed[4]: (1 + scaleTet) * scaleMult * (1 + scaleExp)
   * - precomputed[5]: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet) = f(ε_0)
   * - precomputed[6]: precomputed[5]^2
   * - precomputed[7]: -1 + (1 + scaleExp) * scaleMult * (-1 + scaleTet^2)
   * - precomputed[8]: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)^2
   * - precomputed[9]: precomputed[6] + precomputed[7] * precomputed[8]
   * - precomputed[10]: 1 + (99 * precomputed[4]) / (99 + scaleTet)
   * - precomputed[11]: 1 + (39 * precomputed[4]) / (39 + scaleTet) = threshold for iterative fInverse
   */
  readonly precomputed: (T | null)[];

  /**
   * Creates a new FParams instance with the given scale parameters.
   * Precomputes optimization values during construction.
   * 
   * @param ctx - The numeric context for type T
   * @param scaleAdd - Scale for finite ordinals
   * @param scaleMult - Scale for omega
   * @param scaleExp - Scale for exponentiation
   * @param scaleTet - Scale for tetration
   * @param scaleEpsilon - Scale for epsilon numbers
   */
  constructor(
    ctx: NumericContext<T>,
    scaleAdd: T,
    scaleMult: T,
    scaleExp: T,
    scaleTet: T,
    scaleEpsilon: T
  ) {
    this.ctx = ctx;
    this.scaleAdd = scaleAdd;
    this.scaleMult = scaleMult;
    this.scaleExp = scaleExp;
    this.scaleTet = scaleTet;
    this.scaleEpsilon = scaleEpsilon;

    // Initialize precomputed values array (index 0 is intentionally unused)
    this.precomputed = new Array(12);
    this.precomputed[0] = null;

    const ONE = ctx.ONE;

    // Expression 1: scaleMult * (1 + scaleExp)
    // Legacy (scale=1): 1 * (1 + 1) = 2
    // Default (scale=3): 3 * (1 + 3) = 12
    this.precomputed[1] = scaleMult.multiply(ONE.add(scaleExp));

    // Expression 2: 1 + scaleMult
    // Legacy (scale=1): 1 + 1 = 2
    // Default (scale=3): 1 + 3 = 4
    this.precomputed[2] = ONE.add(scaleMult);

    // Expression 3: 1 + scaleMult + scaleMult * scaleExp
    // Uses precomputed[1]: 1 + this.precomputed[1]
    // Legacy (scale=1): 1 + 2 = 3
    // Default (scale=3): 1 + 12 = 13
    this.precomputed[3] = ONE.add(this.precomputed[1]!);

    // Expression 4: (1 + scaleTet) * scaleMult * (1 + scaleExp)
    // Uses precomputed[1]: (1 + this.scaleTet) * this.precomputed[1]
    // Legacy (scale=1): (1 + 1) * 2 = 4
    // Default (scale=3): (1 + 3) * 12 = 48
    this.precomputed[4] = ONE.add(scaleTet).multiply(this.precomputed[1]!);

    // Expression 5: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)
    // Uses precomputed[4]: 1 + this.precomputed[4]
    // This is f(ε_0)
    // Legacy (scale=1): 1 + 4 = 5
    // Default (scale=3): 1 + 48 = 49
    this.precomputed[5] = ONE.add(this.precomputed[4]!);

    // Expression 6: (1 + (1 + scaleExp) * scaleMult * (1 + scaleTet))^2
    // Uses precomputed[5]: precomputed[5]^2
    // Legacy (scale=1): 5^2 = 25
    // Default (scale=3): 49^2 = 2401
    this.precomputed[6] = this.precomputed[5]!.square();

    // Expression 7: -1 + (1 + scaleExp) * scaleMult * (-1 + scaleTet^2)
    // Uses precomputed[1]: this.precomputed[1] * (this.scaleTet^2 - 1) - 1
    // Legacy (scale=1): 2 * (1 - 1) - 1 = -1
    // Default (scale=3): 12 * (9 - 1) - 1 = 95
    const tetSq = scaleTet.square();
    const tetSqMinus1 = tetSq.subtract(ONE);
    this.precomputed[7] = this.precomputed[1]!.multiply(tetSqMinus1).subtract(ONE);

    // Expression 8: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)^2
    // Uses precomputed[1]: 1 + this.precomputed[1] * (1 + this.scaleTet)^2
    // Legacy (scale=1): 1 + 2 * (1 + 1)^2 = 1 + 2 * 4 = 9
    // Default (scale=3): 1 + 12 * (1 + 3)^2 = 1 + 12 * 16 = 193
    const onePlusTet = ONE.add(scaleTet);
    const onePlusTetSq = onePlusTet.square();
    this.precomputed[8] = ONE.add(this.precomputed[1]!.multiply(onePlusTetSq));

    // Expression 9: precomputed[6] + precomputed[7] * precomputed[8]
    // Legacy (scale=1): 25 + (-1) * 9 = 16
    // Default (scale=3): 2401 + 95 * 193 = 20736
    this.precomputed[9] = this.precomputed[6]!.add(
      this.precomputed[7]!.multiply(this.precomputed[8]!)
    );

    // Expression 10: 1 + (99 * precomputed[4]) / (99 + scaleTet)
    // Legacy (scale=1): 1 + (99 * 4) / (99 + 1) = 1 + 396/100 = 4.96
    // Default (scale=3): 1 + (99 * 48) / (99 + 3) = 1 + 4752/102 = 47.588235...
    const ninetyNine = ctx.fromNumber(99);
    this.precomputed[10] = ONE.add(
      ninetyNine.multiply(this.precomputed[4]!).divide(ninetyNine.add(scaleTet))
    );

    // Expression 11: Threshold for iterative fInverse calculation
    // 1 + (39 * precomputed[4]) / (39 + scaleTet)
    // For values above this (and below w-tower range), use iterative calculation
    // Legacy (scale=1): 1 + (39 * 4) / (39 + 1) = 1 + 156/40 = 4.9
    // Default (scale=3): 1 + (39 * 48) / (39 + 3) = 1 + 1872/42 = 45.571428...
    const thirtyNine = ctx.fromNumber(39);
    this.precomputed[11] = ONE.add(
      thirtyNine.multiply(this.precomputed[4]!).divide(thirtyNine.add(scaleTet))
    );
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validates that all scale parameters satisfy the requirements:
   * - All scales must be positive (> 0)
   * - All scales must be finite
   * 
   * @returns true if all validation checks pass
   */
  validate(): boolean {
    const ZERO = this.ctx.ZERO;
    const scales = [
      this.scaleAdd,
      this.scaleMult,
      this.scaleExp,
      this.scaleTet,
      this.scaleEpsilon
    ];

    // Check all scales are positive and finite
    for (const scale of scales) {
      if (!scale.greaterThan(ZERO)) {
        return false;
      }
      // Check finiteness by converting to number
      const num = scale.toNumber();
      if (!Number.isFinite(num)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates the parameters and throws an error if invalid.
   * 
   * @throws Error if validation fails
   */
  validateOrThrow(): void {
    if (!this.validate()) {
      throw new Error("Invalid FParams: all scales must be positive and finite");
    }
  }

  // ============================================================================
  // Conversion
  // ============================================================================

  /**
   * Converts all scale parameters to JavaScript numbers.
   * May lose precision for rationals.
   * 
   * @returns Object with numeric scale values
   */
  toNumbers(): {
    scaleAdd: number;
    scaleMult: number;
    scaleExp: number;
    scaleTet: number;
    scaleEpsilon: number;
  } {
    return {
      scaleAdd: this.scaleAdd.toNumber(),
      scaleMult: this.scaleMult.toNumber(),
      scaleExp: this.scaleExp.toNumber(),
      scaleTet: this.scaleTet.toNumber(),
      scaleEpsilon: this.scaleEpsilon.toNumber()
    };
  }

  /**
   * Converts parameters to a string representation.
   * 
   * @returns String in format "FParams(scaleAdd=..., scaleMult=..., ...)"
   */
  toString(): string {
    return `FParams(scaleAdd=${this.scaleAdd.toString()}, scaleMult=${this.scaleMult.toString()}, ` +
      `scaleExp=${this.scaleExp.toString()}, scaleTet=${this.scaleTet.toString()}, ` +
      `scaleEpsilon=${this.scaleEpsilon.toString()})`;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if two FParams are equal (all scales equal).
   * 
   * @param other - The FParams to compare with
   * @returns true if all scales are equal
   */
  equals(other: FParams<T>): boolean {
    return (
      this.scaleAdd.equals(other.scaleAdd) &&
      this.scaleMult.equals(other.scaleMult) &&
      this.scaleExp.equals(other.scaleExp) &&
      this.scaleTet.equals(other.scaleTet) &&
      this.scaleEpsilon.equals(other.scaleEpsilon)
    );
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Creates default FParams with all scales set to 3 (matching original DEFAULT_F_PARAMS).
   * This is the standard default used throughout the calculator.
   * 
   * @param ctx - The numeric context for type T
   * @returns FParams with all scales = 3
   */
  static default<T extends NumericValue<T>>(ctx: NumericContext<T>): FParams<T> {
    const three = ctx.fromNumber(3);
    return new FParams(ctx, three, three, three, three, three);
  }

  /**
   * Creates FParams with all scales equal to a given value.
   * 
   * @param ctx - The numeric context for type T
   * @param scale - The uniform scale value
   * @returns FParams with all scales set to the given value
   */
  static uniform<T extends NumericValue<T>>(ctx: NumericContext<T>, scale: T): FParams<T> {
    return new FParams(ctx, scale, scale, scale, scale, scale);
  }

  /**
   * Creates FParams with geometric progression of scales.
   * 
   * @param ctx - The numeric context for type T
   * @param base - The base value (e.g., 1)
   * @param ratio - The ratio between scales (e.g., 10)
   * @returns FParams with scales: base, base*ratio, base*ratio^2, base*ratio^3, base*ratio^4
   */
  static geometric<T extends NumericValue<T>>(
    ctx: NumericContext<T>,
    base: T,
    ratio: T
  ): FParams<T> {
    return new FParams(
      ctx,
      base,                                          // scaleAdd = base
      base.multiply(ratio),                          // scaleMult = base * ratio
      base.multiply(ratio.square()),                 // scaleExp = base * ratio^2
      base.multiply(ratio.square().multiply(ratio)), // scaleTet = base * ratio^3
      base.multiply(ratio.square().square())         // scaleEpsilon = base * ratio^4
    );
  }

  /**
   * Creates FParams with custom scale values.
   * 
   * @param ctx - The numeric context for type T
   * @param scaleAdd - Scale for finite ordinals
   * @param scaleMult - Scale for omega
   * @param scaleExp - Scale for exponentiation
   * @param scaleTet - Scale for tetration
   * @param scaleEpsilon - Scale for epsilon numbers
   * @returns FParams with the specified scales
   */
  static custom<T extends NumericValue<T>>(
    ctx: NumericContext<T>,
    scaleAdd: T,
    scaleMult: T,
    scaleExp: T,
    scaleTet: T,
    scaleEpsilon: T
  ): FParams<T> {
    return new FParams(ctx, scaleAdd, scaleMult, scaleExp, scaleTet, scaleEpsilon);
  }
}
