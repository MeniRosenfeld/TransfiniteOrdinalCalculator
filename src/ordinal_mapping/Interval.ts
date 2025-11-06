import { NumericValue } from './NumericValue.js';

/**
 * Represents a closed interval [lower, upper] over a numeric type T.
 * 
 * Type Parameter:
 * - T: The numeric type for the interval bounds (must extend NumericValue<T>)
 * 
 * Intervals support:
 * - Type-safe arithmetic operations (add, subtract, multiply, divide)
 * - Containment and intersection operations
 * - Special handling for infinite intervals and division by zero
 * 
 * Key Properties:
 * - Closed intervals: [lower, upper] includes both endpoints
 * - Empty intervals: represented as [+∞, -∞] (lower > upper)
 * - Infinite intervals: when lower or upper is infinite
 * - Division by zero: interval containing zero produces (-∞, +∞)
 * 
 * Examples:
 * ```typescript
 * // Double intervals for fast computation
 * const d1 = Interval.fromBounds(DoubleNumericValue.fromNumber(1), DoubleNumericValue.fromNumber(3));
 * const d2 = Interval.fromBounds(DoubleNumericValue.fromNumber(2), DoubleNumericValue.fromNumber(4));
 * const sum = d1.add(d2); // [3, 7]
 * 
 * // Rational intervals for exact computation
 * const r1 = Interval.fromBounds(RationalNumericValue.fromIntegers(1, 3), RationalNumericValue.fromIntegers(1, 2));
 * const r2 = Interval.fromBounds(RationalNumericValue.fromIntegers(1, 6), RationalNumericValue.fromIntegers(1, 4));
 * const product = r1.multiply(r2); // exact rational interval
 * ```
 */
export class Interval<T extends NumericValue<T>> {
  private readonly _lower: T;
  private readonly _upper: T;

  /**
   * Creates an interval [lower, upper].
   * 
   * @param lower - The lower bound (inclusive)
   * @param upper - The upper bound (inclusive)
   * 
   * Note: If lower > upper, the interval is empty.
   * Empty intervals are represented canonically as [+∞, -∞].
   */
  constructor(lower: T, upper: T) {
    // Normalize empty intervals to canonical form [+∞, -∞]
    if (lower.greaterThan(upper)) {
      // Create infinity values by dividing ONE by ZERO
      // This works for both Double (native Infinity) and Rational (zero-denominator)
      const ctor = lower.constructor as any;
      const one = ctor.ONE as T;
      const zero = ctor.ZERO as T;
      this._lower = one.divide(zero); // +∞
      this._upper = zero.subtract(one.divide(zero)); // -∞
    } else {
      this._lower = lower;
      this._upper = upper;
    }
  }

  /**
   * Gets the lower bound of the interval.
   */
  get lower(): T {
    return this._lower;
  }

  /**
   * Gets the upper bound of the interval.
   */
  get upper(): T {
    return this._upper;
  }

  /**
   * Checks if the interval is empty.
   * An interval is empty if lower > upper.
   */
  isEmpty(): boolean {
    return this._lower.greaterThan(this._upper);
  }

  /**
   * Checks if the interval is infinite.
   * An interval is infinite if either bound is infinite.
   */
  isInfinite(): boolean {
    // Check if lower or upper is infinite
    // For Double: use isPositiveInfinity/isNegativeInfinity if available
    // For Rational: compare with infinity values
    const ctor = this._lower.constructor as any;
    const one = ctor.ONE as T;
    const zero = ctor.ZERO as T;
    const posInf = one.divide(zero);
    const negInf = posInf.negate();

    return this._lower.equals(negInf) || this._upper.equals(posInf);
  }

  /**
   * Checks if the interval is a single point [x, x].
   */
  isSingleton(): boolean {
    return this._lower.equals(this._upper);
  }

  /**
   * Checks if a value is contained in the interval.
   * 
   * @param value - The value to check
   * @returns true if lower <= value <= upper
   */
  contains(value: T): boolean {
    if (this.isEmpty()) {
      return false;
    }
    return !value.lessThan(this._lower) && !value.greaterThan(this._upper);
  }

  /**
   * Checks if this interval contains another interval.
   * 
   * @param other - The interval to check
   * @returns true if other is a subset of this interval
   */
  containsInterval(other: Interval<T>): boolean {
    if (this.isEmpty()) {
      return other.isEmpty();
    }
    if (other.isEmpty()) {
      return true;
    }
    return this.contains(other._lower) && this.contains(other._upper);
  }

  /**
   * Computes the width (upper - lower) of the interval.
   * Returns 0 for empty intervals.
   */
  width(): T {
    if (this.isEmpty()) {
      const ctor = this._lower.constructor as any;
      return ctor.ZERO as T;
    }
    return this._upper.subtract(this._lower);
  }

  /**
   * Computes the midpoint ((lower + upper) / 2) of the interval.
   * Returns 0 for empty intervals.
   */
  midpoint(): T {
    if (this.isEmpty()) {
      const ctor = this._lower.constructor as any;
      return ctor.ZERO as T;
    }
    const sum = this._lower.add(this._upper);
    const ctor = this._lower.constructor as any;
    const two = ctor.TWO as T;
    return sum.divide(two);
  }

  /**
   * Adds two intervals: [a, b] + [c, d] = [a+c, b+d]
   * 
   * @param other - The interval to add
   * @returns The sum interval
   */
  add(other: Interval<T>): Interval<T> {
    if (this.isEmpty() || other.isEmpty()) {
      return Interval.empty(this._lower);
    }
    const newLower = this._lower.add(other._lower);
    const newUpper = this._upper.add(other._upper);
    return new Interval(newLower, newUpper);
  }

  /**
   * Subtracts two intervals: [a, b] - [c, d] = [a-d, b-c]
   * 
   * @param other - The interval to subtract
   * @returns The difference interval
   */
  subtract(other: Interval<T>): Interval<T> {
    if (this.isEmpty() || other.isEmpty()) {
      return Interval.empty(this._lower);
    }
    const newLower = this._lower.subtract(other._upper);
    const newUpper = this._upper.subtract(other._lower);
    return new Interval(newLower, newUpper);
  }

  /**
   * Multiplies two intervals: [a, b] * [c, d]
   * Result is [min(ac, ad, bc, bd), max(ac, ad, bc, bd)]
   * 
   * @param other - The interval to multiply
   * @returns The product interval
   */
  multiply(other: Interval<T>): Interval<T> {
    if (this.isEmpty() || other.isEmpty()) {
      return Interval.empty(this._lower);
    }

    // Compute all four corner products
    const ac = this._lower.multiply(other._lower);
    const ad = this._lower.multiply(other._upper);
    const bc = this._upper.multiply(other._lower);
    const bd = this._upper.multiply(other._upper);

    // Find min and max
    let min = ac;
    let max = ac;

    if (ad.lessThan(min)) min = ad;
    if (ad.greaterThan(max)) max = ad;

    if (bc.lessThan(min)) min = bc;
    if (bc.greaterThan(max)) max = bc;

    if (bd.lessThan(min)) min = bd;
    if (bd.greaterThan(max)) max = bd;

    return new Interval(min, max);
  }

  /**
   * Divides two intervals: [a, b] / [c, d]
   * 
   * Special cases:
   * - If [c, d] contains zero, result is (-∞, +∞)
   * - Otherwise: [a, b] / [c, d] = [a, b] * [1/d, 1/c]
   * 
   * @param other - The interval to divide by
   * @returns The quotient interval
   */
  divide(other: Interval<T>): Interval<T> {
    if (this.isEmpty() || other.isEmpty()) {
      return Interval.empty(this._lower);
    }

    const ctor = this._lower.constructor as any;
    const zero = ctor.ZERO as T;

    // Check if other contains zero
    if (other.contains(zero)) {
      // Division by interval containing zero -> infinite interval
      return Interval.infinite(this._lower);
    }

    // Compute reciprocal interval: [c, d] -> [1/d, 1/c]
    // Note: We need to reverse the order because 1/x is decreasing for x > 0
    // and increasing for x < 0
    const one = ctor.ONE as T;

    // Handle sign changes carefully
    const recipLower = one.divide(other._upper);
    const recipUpper = one.divide(other._lower);
    const reciprocal = new Interval(recipLower, recipUpper);

    // Multiply by reciprocal
    return this.multiply(reciprocal);
  }

  // ============================================================================
  // Scalar Arithmetic Operations (Interval op NumericValue)
  // ============================================================================

  /**
   * Adds a scalar to this interval: [a, b] + c = [a+c, b+c]
   * 
   * @param scalar - The scalar value to add
   * @returns The shifted interval
   */
  addScalar(scalar: T): Interval<T> {
    if (this.isEmpty()) {
      return Interval.empty(this._lower);
    }
    const newLower = this._lower.add(scalar);
    const newUpper = this._upper.add(scalar);
    return new Interval(newLower, newUpper);
  }

  /**
   * Subtracts a scalar from this interval: [a, b] - c = [a-c, b-c]
   * 
   * @param scalar - The scalar value to subtract
   * @returns The shifted interval
   */
  subtractScalar(scalar: T): Interval<T> {
    if (this.isEmpty()) {
      return Interval.empty(this._lower);
    }
    const newLower = this._lower.subtract(scalar);
    const newUpper = this._upper.subtract(scalar);
    return new Interval(newLower, newUpper);
  }

  /**
   * Multiplies this interval by a scalar: [a, b] * c
   * 
   * Cases:
   * - If c > 0: [a, b] * c = [a*c, b*c]
   * - If c < 0: [a, b] * c = [b*c, a*c] (reversed)
   * - If c = 0: [a, b] * c = [0, 0]
   * 
   * @param scalar - The scalar value to multiply by
   * @returns The scaled interval
   */
  multiplyScalar(scalar: T): Interval<T> {
    if (this.isEmpty()) {
      return Interval.empty(this._lower);
    }

    const ctor = this._lower.constructor as any;
    const zero = ctor.ZERO as T;

    // If scalar is zero, result is [0, 0]
    if (scalar.equals(zero)) {
      return new Interval(zero, zero);
    }

    const lowerProduct = this._lower.multiply(scalar);
    const upperProduct = this._upper.multiply(scalar);

    // If scalar is positive, preserve order
    // If scalar is negative, reverse order
    if (scalar.greaterThan(zero)) {
      return new Interval(lowerProduct, upperProduct);
    } else {
      return new Interval(upperProduct, lowerProduct);
    }
  }

  /**
   * Divides this interval by a scalar: [a, b] / c
   * 
   * Cases:
   * - If c > 0: [a, b] / c = [a/c, b/c]
   * - If c < 0: [a, b] / c = [b/c, a/c] (reversed)
   * - If c = 0: throws error or returns infinite interval
   * 
   * @param scalar - The scalar value to divide by
   * @returns The scaled interval
   * @throws Error if scalar is zero
   */
  divideScalar(scalar: T): Interval<T> {
    if (this.isEmpty()) {
      return Interval.empty(this._lower);
    }

    const ctor = this._lower.constructor as any;
    const zero = ctor.ZERO as T;

    // If scalar is zero, return infinite interval
    if (scalar.equals(zero)) {
      return Interval.infinite(this._lower);
    }

    const lowerQuotient = this._lower.divide(scalar);
    const upperQuotient = this._upper.divide(scalar);

    // If scalar is positive, preserve order
    // If scalar is negative, reverse order
    if (scalar.greaterThan(zero)) {
      return new Interval(lowerQuotient, upperQuotient);
    } else {
      return new Interval(upperQuotient, lowerQuotient);
    }
  }

  /**
   * Computes the intersection of two intervals.
   * 
   * @param other - The interval to intersect with
   * @returns The intersection interval (may be empty)
   */
  intersect(other: Interval<T>): Interval<T> {
    if (this.isEmpty() || other.isEmpty()) {
      return Interval.empty(this._lower);
    }

    // Intersection: [max(a, c), min(b, d)]
    const newLower = this._lower.greaterThan(other._lower) ? this._lower : other._lower;
    const newUpper = this._upper.lessThan(other._upper) ? this._upper : other._upper;

    return new Interval(newLower, newUpper);
  }

  /**
   * Computes the union (hull) of two intervals.
   * Returns the smallest interval containing both intervals.
   * 
   * @param other - The interval to union with
   * @returns The union interval
   */
  union(other: Interval<T>): Interval<T> {
    if (this.isEmpty()) {
      return other;
    }
    if (other.isEmpty()) {
      return this;
    }

    // Union: [min(a, c), max(b, d)]
    const newLower = this._lower.lessThan(other._lower) ? this._lower : other._lower;
    const newUpper = this._upper.greaterThan(other._upper) ? this._upper : other._upper;

    return new Interval(newLower, newUpper);
  }

  /**
   * Negates the interval: -[a, b] = [-b, -a]
   * 
   * @returns The negated interval
   */
  negate(): Interval<T> {
    if (this.isEmpty()) {
      return Interval.empty(this._lower);
    }
    return new Interval(this._upper.negate(), this._lower.negate());
  }

  /**
   * Computes the absolute value interval: |[a, b]|
   * 
   * Cases:
   * - If 0 ∉ [a, b]: |[a, b]| = [|a|, |b|] or [|b|, |a|]
   * - If 0 ∈ [a, b]: |[a, b]| = [0, max(|a|, |b|)]
   * 
   * @returns The absolute value interval
   */
  abs(): Interval<T> {
    if (this.isEmpty()) {
      return Interval.empty(this._lower);
    }

    const ctor = this._lower.constructor as any;
    const zero = ctor.ZERO as T;

    // If interval contains zero
    if (this.contains(zero)) {
      const absLower = this._lower.abs();
      const absUpper = this._upper.abs();
      const maxAbs = absLower.greaterThan(absUpper) ? absLower : absUpper;
      return new Interval(zero, maxAbs);
    }

    // If interval doesn't contain zero
    const absLower = this._lower.abs();
    const absUpper = this._upper.abs();

    // If both bounds negative: reverse order
    if (this._upper.lessThan(zero)) {
      return new Interval(absUpper, absLower);
    }

    // Both bounds positive: preserve order
    return new Interval(absLower, absUpper);
  }

  /**
   * Checks if two intervals are equal.
   * 
   * @param other - The interval to compare with
   * @returns true if both bounds are equal
   */
  equals(other: Interval<T>): boolean {
    // Two empty intervals are equal
    if (this.isEmpty() && other.isEmpty()) {
      return true;
    }
    if (this.isEmpty() || other.isEmpty()) {
      return false;
    }
    return this._lower.equals(other._lower) && this._upper.equals(other._upper);
  }

  /**
   * Converts the interval to a string representation.
   * 
   * @returns String in format "[lower, upper]"
   */
  toString(): string {
    if (this.isEmpty()) {
      return "[empty]";
    }
    return `[${this._lower.toString()}, ${this._upper.toString()}]`;
  }

  /**
   * Creates a deep copy of the interval.
   * 
   * @returns A new interval with cloned bounds
   */
  clone(): Interval<T> {
    return new Interval(this._lower.clone(), this._upper.clone());
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Creates a singleton interval [value, value].
   * 
   * @param value - The single point value
   * @returns A singleton interval
   */
  static singleton<T extends NumericValue<T>>(value: T): Interval<T> {
    return new Interval(value, value);
  }

  /**
   * Creates an interval [lower, upper].
   * 
   * @param lower - The lower bound
   * @param upper - The upper bound
   * @returns The interval [lower, upper]
   */
  static fromBounds<T extends NumericValue<T>>(lower: T, upper: T): Interval<T> {
    return new Interval(lower, upper);
  }

  /**
   * Creates an empty interval.
   * 
   * @param prototype - A prototype value of type T (used to access static constants)
   * @returns An empty interval [+∞, -∞]
   */
  static empty<T extends NumericValue<T>>(prototype: T): Interval<T> {
    const ctor = prototype.constructor as any;
    const one = ctor.ONE as T;
    const zero = ctor.ZERO as T;
    const posInf = one.divide(zero);
    const negInf = posInf.negate();
    return new Interval(posInf, negInf);
  }

  /**
   * Creates an infinite interval (-∞, +∞).
   * 
   * @param prototype - A prototype value of type T (used to access static constants)
   * @returns An infinite interval
   */
  static infinite<T extends NumericValue<T>>(prototype: T): Interval<T> {
    const ctor = prototype.constructor as any;
    const one = ctor.ONE as T;
    const zero = ctor.ZERO as T;
    const posInf = one.divide(zero);
    const negInf = posInf.negate();
    return new Interval(negInf, posInf);
  }

  /**
   * Creates an interval [0, 0].
   * 
   * @param prototype - A prototype value of type T (used to access static constants)
   * @returns A zero interval
   */
  static zero<T extends NumericValue<T>>(prototype: T): Interval<T> {
    const ctor = prototype.constructor as any;
    const zero = ctor.ZERO as T;
    return new Interval(zero, zero);
  }

  /**
   * Creates an interval [1, 1].
   * 
   * @param prototype - A prototype value of type T (used to access static constants)
   * @returns A one interval
   */
  static one<T extends NumericValue<T>>(prototype: T): Interval<T> {
    const ctor = prototype.constructor as any;
    const one = ctor.ONE as T;
    return new Interval(one, one);
  }

  /**
   * Creates a symmetric interval around zero: [-radius, +radius].
   * 
   * @param radius - The radius (must be non-negative)
   * @returns A symmetric interval
   * @throws Error if radius is negative
   */
  static symmetric<T extends NumericValue<T>>(radius: T): Interval<T> {
    const ctor = radius.constructor as any;
    const zero = ctor.ZERO as T;
    if (radius.lessThan(zero)) {
      throw new Error("Radius must be non-negative");
    }
    return new Interval(radius.negate(), radius);
  }

  /**
   * Creates an interval centered at a point with given radius: [center - radius, center + radius].
   * 
   * @param center - The center point
   * @param radius - The radius (must be non-negative)
   * @returns A centered interval
   * @throws Error if radius is negative
   */
  static centered<T extends NumericValue<T>>(center: T, radius: T): Interval<T> {
    const ctor = radius.constructor as any;
    const zero = ctor.ZERO as T;
    if (radius.lessThan(zero)) {
      throw new Error("Radius must be non-negative");
    }
    const lower = center.subtract(radius);
    const upper = center.add(radius);
    return new Interval(lower, upper);
  }

  /**
   * Applies a rational function of the form (a*x + b) / (x + c) to this interval.
   * This correctly handles the dependency where x appears in both numerator and denominator.
   * 
   * For the interval [x_lower, x_upper], we evaluate the function at the endpoints
   * and possibly at the critical point (vertical asymptote at x = -c).
   * 
   * The function f(x) = (a*x + b) / (x + c) can be rewritten as:
   * f(x) = a + (b - a*c) / (x + c)
   * 
   * So it has:
   * - Horizontal asymptote at y = a
   * - Vertical asymptote at x = -c
   * - Monotonic on each side of the asymptote
   * 
   * @param a - Coefficient of x in numerator
   * @param b - Constant term in numerator  
   * @param c - Constant term in denominator
   * @returns Result interval of applying (a*x + b)/(x + c) to this interval
   */
  applyRationalFunction(a: T, b: T, c: T): Interval<T> {
    const ctor = this._lower.constructor as any;
    const zero = ctor.ZERO as T;
    const one = ctor.ONE as T;

    // Handle empty interval
    if (this.isEmpty()) {
      return this;
    }

    // Compute the critical point: x = -c (vertical asymptote)
    const criticalPoint = c.negate();

    // Check if the asymptote is within our interval
    const asymptoteInInterval =
      this._lower.lessThanOrEqual(criticalPoint) &&
      criticalPoint.lessThanOrEqual(this._upper);

    if (asymptoteInInterval) {
      // Interval crosses the asymptote, result is entire real line
      const posInf = one.divide(zero);
      const negInf = posInf.negate();
      return new Interval(negInf, posInf);
    }

    // Evaluate at endpoints
    // f(x_lower) = (a * x_lower + b) / (x_lower + c)
    const numerator_lower = a.multiply(this._lower).add(b);
    const denominator_lower = this._lower.add(c);
    const f_lower = numerator_lower.divide(denominator_lower);

    // f(x_upper) = (a * x_upper + b) / (x_upper + c)
    const numerator_upper = a.multiply(this._upper).add(b);
    const denominator_upper = this._upper.add(c);
    const f_upper = numerator_upper.divide(denominator_upper);

    // The function is monotonic on our interval (no asymptote crossed)
    // Determine the bounds
    const result_lower = f_lower.lessThan(f_upper) ? f_lower : f_upper;
    const result_upper = f_lower.lessThan(f_upper) ? f_upper : f_lower;

    return new Interval(result_lower, result_upper);
  }
}
