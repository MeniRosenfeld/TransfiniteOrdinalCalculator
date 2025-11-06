import { NumericValue } from './NumericValue.js';
import { FParams } from './FParams.js';

/**
 * Ordinal Representation Format for fTyped<T>
 * 
 * This is the same format used by the existing f() function in ordinal_mapping.js
 * to maintain compatibility with the Ordinal class hierarchy.
 * 
 * - Finite ordinal n: JavaScript BigInt n (e.g., 0n, 1n, 2n, ...)
 * - ω^k: { type: 'pow', k: k_rep } where k_rep is an ordinal representation for k
 * - ω^β * c + δ: { type: 'sum', beta: beta_rep, c: c_int, delta: delta_rep }
 *   - beta_rep: ordinal representation for β
 *   - c_int: JavaScript BigInt for c (c >= 1n), coefficient from CNF term
 *   - delta_rep: ordinal representation for δ (use 0n if no remainder)
 *   - Invariant: δ < ω^β
 * - ε_k: { type: 'epsilon', index: k_rep } where k_rep is an ordinal representation for k
 * - ω↑↑h: { type: 'w_tower', height: h } where h is a JavaScript BigInt >= 1n
 */

export type OrdinalRepresentation =
  | bigint
  | { type: 'pow'; k: OrdinalRepresentation }
  | { type: 'sum'; beta: OrdinalRepresentation; c: bigint; delta: OrdinalRepresentation }
  | { type: 'epsilon'; index: OrdinalRepresentation }
  | { type: 'w_tower'; height: bigint }
  | 'E0_TYPE';  // Legacy format for ε₀

export const ORDINAL_ZERO = 0n;
export const ORDINAL_ONE = 1n;

/**
 * Checks if an ordinal representation is a finite ordinal (BigInt).
 */
export function isFiniteOrdinal(ordinalRep: OrdinalRepresentation): ordinalRep is bigint {
  return typeof ordinalRep === 'bigint';
}

/**
 * Maps a finite ordinal n to a real number using the formula: n / (n + scale)
 * 
 * This gives a value in [0, 1) that approaches 1 as n → ∞.
 * 
 * @param params - The FParams containing the numeric context
 * @param n - The finite ordinal value (as BigInt)
 * @param scale - The scaling parameter (as NumericValue<T>)
 * @returns n / (n + scale) as NumericValue<T>
 */
export function fFiniteTyped<T extends NumericValue<T>>(
  params: FParams<T>,
  n: bigint,
  scale: T
): T {
  return scale.divideFiniteByFinitePlusThis(n, scale);
}

/**
 * Adds one to an ordinal representation.
 * 
 * This is used in the recursive formula for f(ω^β * c + δ).
 * 
 * @param betaOrdRep - The ordinal representation
 * @returns The representation of betaOrdRep + 1
 */
export function addOneToOrdinal(betaOrdRep: OrdinalRepresentation): OrdinalRepresentation {
  if (isFiniteOrdinal(betaOrdRep)) {
    return betaOrdRep + 1n;
  }

  if (typeof betaOrdRep === 'string' && betaOrdRep === 'E0_TYPE') {
    // ε₀ + 1 = ε₀ * 1 + 1
    return { type: 'sum', beta: betaOrdRep, c: 1n, delta: ORDINAL_ONE };
  }

  const { type, ...args } = betaOrdRep as any;

  if (type === 'pow') {
    const kExpRep = args.k;
    if (kExpRep === ORDINAL_ZERO) {
      // β = ω^0 = 1, so β + 1 = 2
      return 2n;
    }
    // ω^k + 1 = ω^k * 1 + 1
    return { type: 'sum', beta: kExpRep, c: 1n, delta: ORDINAL_ONE };
  } else if (type === 'sum') {
    const { beta: bExpRep, c: cCoeffInt, delta: dRemRep } = args;
    // ω^β * c + δ + 1 = ω^β * c + (δ + 1)
    return { type: 'sum', beta: bExpRep, c: cCoeffInt, delta: addOneToOrdinal(dRemRep) };
  } else if (type === 'w_tower') {
    // ω↑↑h + 1 = (ω↑↑h) * 1 + 1
    return { type: 'sum', beta: betaOrdRep, c: 1n, delta: ORDINAL_ONE };
  } else if (type === 'epsilon') {
    // ε_k + 1 = ε_k * 1 + 1
    return { type: 'sum', beta: betaOrdRep, c: 1n, delta: ORDINAL_ONE };
  } else {
    throw new TypeError(`Unknown ordinal object type for addOneToOrdinal: ${type}`);
  }
}

/**
 * Helper function for computing f(ω^k) when k < ε₀.
 * 
 * Uses the formula:
 * f(ω^k) = (p6 + f(k) * p7) / (p8 - f(k))
 * 
 * where p6, p7, p8 are precomputed values from FParams.
 */
function f_omega_k_less_than_e0<T extends NumericValue<T>>(
  kRep: OrdinalRepresentation,
  params: FParams<T>,
  memo: Map<string, T>
): T {
  const fKRep = fTypedInternal(kRep, params, memo);

  // Use precomputed values from FParams
  const p6 = params.precomputed[6]!;
  const p7 = params.precomputed[7]!;
  const p8 = params.precomputed[8]!;

  const numerator = p6.add(fKRep.multiply(p7));
  const denominator = p8.subtract(fKRep);

  return numerator.divide(denominator);
}

/**
 * Internal implementation of fTyped with memoization.
 * 
 * This is separated from the public fTyped to allow passing the memo map
 * through recursive calls.
 */
function fTypedInternal<T extends NumericValue<T>>(
  alphaRep: OrdinalRepresentation,
  params: FParams<T>,
  memo: Map<string, T>
): T {
  const ctx = params.ctx;
  // Generate memo key
  const memoKey = generateMemoKey(alphaRep, params);

  if (memo.has(memoKey)) {
    return memo.get(memoKey)!;
  }

  let result: T;

  // Handle epsilon type
  if (typeof alphaRep === 'object' && alphaRep !== null && 'type' in alphaRep && alphaRep.type === 'epsilon') {
    const indexRep = alphaRep.index;

    // Base case: f(ε₀) = precomputed[5] = 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)
    if (indexRep === ORDINAL_ZERO) {
      result = params.precomputed[5]!;
    } else {
      throw new Error(`Mapping for epsilon ordinals with index > 0 is not supported yet. Index was: ${indexRep}`);
    }
  }
  // Handle legacy E0_TYPE
  else if (alphaRep === 'E0_TYPE') {
    result = params.precomputed[5]!;
  }
  // Handle finite ordinals
  else if (isFiniteOrdinal(alphaRep)) {
    // alphaRep is already a BigInt
    result = fFiniteTyped(params, alphaRep, params.scaleAdd);
  }
  // Handle structured ordinals
  else if (typeof alphaRep === 'object' && alphaRep !== null && 'type' in alphaRep) {
    const { type, ...args } = alphaRep as any;

    if (type === 'w_tower') {
      // α = ω↑↑height
      const height = args.height;
      if (typeof height !== 'bigint' || height < 1n) {
        throw new Error(`Invalid height for w_tower in fTyped(): ${typeof height === 'bigint' ? height.toString() : String(height)} (type: ${typeof height})`);
      }

      // f(ω↑↑h) = 1 + precomputed[4] * fFinite(h - 1, scaleTet)
      // where precomputed[4] = (1 + scaleTet) * scaleMult * (1 + scaleExp)
      const heightMinus1 = height - 1n;
      const fHeightMinus1 = fFiniteTyped(params, heightMinus1, params.scaleTet);

      result = ctx.ONE.add(params.precomputed[4]!.multiply(fHeightMinus1));
    }
    else if (type === 'pow') {
      // α = ω^k
      const kRep = args.k;

      if (isFiniteOrdinal(kRep)) {
        const jBigInt = kRep;

        if (jBigInt === ORDINAL_ZERO) {
          // ω^0 = 1
          result = fTypedInternal(ORDINAL_ONE, params, memo);
        } else {
          // f(ω^j) = 1 + precomputed[1] * fFinite(j - 1, scaleExp)
          // where precomputed[1] = scaleMult * (1 + scaleExp)
          const jMinus1 = jBigInt - 1n;
          const fJMinus1 = fFiniteTyped(params, jMinus1, params.scaleExp);

          result = ctx.ONE.add(params.precomputed[1]!.multiply(fJMinus1));
        }
      } else {
        // k >= ω
        if (typeof kRep === 'object' && kRep !== null && 'type' in kRep && kRep.type === 'epsilon') {
          // ω^ε_k = ε_k
          result = fTypedInternal(kRep, params, memo);
        } else {
          // k < ε₀ (in our scope)
          result = f_omega_k_less_than_e0(kRep, params, memo);
        }
      }
    }
    else if (type === 'sum') {
      // α = ω^β * c + δ
      const { beta: betaRep, c: cNum, delta: deltaRep } = args;

      // Validate coefficient
      if (typeof cNum !== 'bigint' || cNum <= 0n) {
        throw new Error(`Invalid coefficient c=${cNum} in sum type (must be positive BigInt)`);
      }

      // Compute f(ω^β), f(ω^(β+1))
      const termOmegaBeta = { type: 'pow' as const, k: betaRep };
      const betaPlus1Rep = addOneToOrdinal(betaRep);
      const termOmegaBetaPlus1 = { type: 'pow' as const, k: betaPlus1Rep };

      const fOmegaBeta = fTypedInternal(termOmegaBeta, params, memo);
      const fOmegaBetaPlus1 = fTypedInternal(termOmegaBetaPlus1, params, memo);

      // Compute f(c-1) and f(c)
      let f_c_minus_1_val: T;
      let f_c_val: T;

      const cMinus1 = cNum > 0n ? cNum - 1n : 0n;
      const c = cNum;

      f_c_minus_1_val = fFiniteTyped(params, cMinus1, params.scaleMult);
      f_c_val = fFiniteTyped(params, c, params.scaleMult);

      // Compute f(ω^β * c)
      const fOmegaBetaTimesC = fOmegaBeta.add(
        fOmegaBetaPlus1.subtract(fOmegaBeta).multiply(f_c_minus_1_val)
      );

      if (deltaRep === ORDINAL_ZERO) {
        result = fOmegaBetaTimesC;
      } else {
        // Compute f(ω^β * (c+1))
        const fOmegaBetaTimesCPlus1 = fOmegaBeta.add(
          fOmegaBetaPlus1.subtract(fOmegaBeta).multiply(f_c_val)
        );

        // Compute f(δ)
        const fDeltaRep = fTypedInternal(deltaRep, params, memo);

        // Compute interpolation ratio: f(δ) / f(ω^β)
        let divisionRatio: T;
        try {
          divisionRatio = fDeltaRep.divide(fOmegaBeta);
        } catch {
          divisionRatio = ctx.ZERO;  // Handle 0/0
        }

        // Clamp ratio to [0, 1]
        const zero = ctx.ZERO;
        const one = ctx.ONE;
        if (divisionRatio.lessThan(zero)) {
          divisionRatio = zero;
        } else if (divisionRatio.greaterThan(one)) {
          divisionRatio = one;
        }

        // Linear interpolation between f(ω^β * c) and f(ω^β * (c+1))
        result = fOmegaBetaTimesC.add(
          fOmegaBetaTimesCPlus1.subtract(fOmegaBetaTimesC).multiply(divisionRatio)
        );
      }
    } else {
      throw new TypeError(`Unknown ordinal object type in fTyped: ${type}`);
    }
  } else {
    throw new TypeError(`Invalid ordinal representation type: ${typeof alphaRep}`);
  }

  memo.set(memoKey, result);
  return result;
}

/**
 * Generates a canonical string key for memoization.
 * 
 * This creates a stable string representation of the ordinal and parameters
 * for use as a Map key.
 */
function generateMemoKey<T extends NumericValue<T>>(
  alphaRep: OrdinalRepresentation,
  params: FParams<T>
): string {
  const ordinalPart = JSON.stringify(alphaRep, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    return value;
  });

  // Use parameter values for the key (matching original implementation)
  const nums = params.toNumbers();
  const paramsPart = `${nums.scaleAdd}-${nums.scaleMult}-${nums.scaleExp}-${nums.scaleTet}-${nums.scaleEpsilon}`;

  return `${ordinalPart}|${paramsPart}`;
}

/**
 * Maps an ordinal α < ζ₀ to a numeric value using type-safe arithmetic.
 * 
 * This is the typed version of the f() function from ordinal_mapping.js.
 * It works with any NumericValue<T> type, allowing both fast double-precision
 * and exact rational arithmetic.
 * 
 * The mapping is strictly increasing and continuous, with f(0) = 0 and
 * f(ε₀) depending on the scale parameters.
 * 
 * The numeric context is embedded in the FParams object, so you don't need
 * to pass it separately.
 * 
 * @param alphaRep - The ordinal representation
 * @param params - The scale parameters (includes numeric context)
 * @returns The numeric value f(α) of type T
 * 
 * @example
 * ```typescript
 * // With doubles (fast, approximate)
 * const doubleCtx = new DoubleContext();
 * const doubleParams = FParams.default(doubleCtx);  // All scales = 3
 * const result = fTyped(5n, doubleParams);
 * 
 * // With rationals (exact, slower)
 * const rationalCtx = new RationalContext();
 * const rationalParams = FParams.default(rationalCtx);
 * const exactResult = fTyped(5n, rationalParams);
 * ```
 */
export function fTyped<T extends NumericValue<T>>(
  alphaRep: OrdinalRepresentation,
  params: FParams<T>
): T {
  // Validate parameters
  params.validateOrThrow();

  // Create fresh memo for this call
  const memo = new Map<string, T>();

  return fTypedInternal(alphaRep, params, memo);
}
