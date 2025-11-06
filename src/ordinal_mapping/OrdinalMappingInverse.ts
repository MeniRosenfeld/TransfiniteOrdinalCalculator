/**
 * @file OrdinalMappingInverse.ts
 * @description Type-safe inverse ordinal mapping function using interval arithmetic.
 *
 * This is the TypeScript reimplementation of ordinal_mapping_inverse.js, replacing
 * threshold-based approximation with rigorous interval arithmetic.
 *
 * Key differences from JavaScript version:
 * - Uses Interval<T> instead of threshold parameter for bounds
 * - Full type safety with NumericValue<T> abstraction
 * - BigInt for ordinal structure (c, height), NumericValue<T> for mapped values
 * - Precomputed values in FParams for efficiency
 */

import { NumericValue } from "./NumericValue";
import { NumericContext } from "./NumericContext";
import { FParams } from "./FParams";
import { Interval } from "./Interval";
import { fTyped, addOneToOrdinal, fFiniteTyped } from "./OrdinalMapping";
import { DoubleNumericValue } from "./DoubleNumericValue";

/**
 * Ordinal representation format returned by fInverse.
 * Matches the format from ordinal_mapping_inverse.js.
 */
export type OrdinalRepresentation =
    | bigint // Finite ordinal
    | { type: "pow"; k: OrdinalRepresentation } // ω^k
    | {
        type: "sum";
        beta: OrdinalRepresentation;
        c: bigint;
        delta: OrdinalRepresentation;
    } // ω^β * c + δ
    | { type: "w_tower"; height: bigint } // ω↑↑n (w_tower)
    | { type: "epsilon"; index: bigint }; // ε_n (currently only ε₀ supported)

/**
 * Helper function to stringify OrdinalRepresentation for logging (handles BigInt).
 */
function stringifyOrdinal(ord: OrdinalRepresentation): string {
    if (typeof ord === 'bigint') {
        return ord.toString();
    }
    if (ord.type === 'pow') {
        return `{type:"pow", k:${stringifyOrdinal(ord.k)}}`;
    }
    if (ord.type === 'sum') {
        return `{type:"sum", beta:${stringifyOrdinal(ord.beta)}, c:${ord.c}, delta:${stringifyOrdinal(ord.delta)}}`;
    }
    if (ord.type === 'w_tower') {
        return `{type:"w_tower", height:${ord.height}}`;
    }
    if (ord.type === 'epsilon') {
        return `{type:"epsilon", index:${ord.index}}`;
    }
    return 'unknown';
}

/**
 * Find omega tower height h such that f(ω↑↑h) = x exactly.
 * Uses the formula h = (param4 + (scaleTet - 1)*(x - 1))/(param5 - x)
 * The value returned can be fractional; caller should round down if needed.
 *
 * @param x - Target f value
 * @param params - Function parameters
 * @return Height h as NumericValue<T>
 *
 * Note: This function assumes x is in the valid range for w-tower ordinals.
 */
function findRawWTowerHeightTyped<T extends NumericValue<T>>(
    x: T,
    params: FParams<T>
): NumericValue<T> {
    const denominator = params.precomputed[5]!.subtract(x);
    let computed_height = params.precomputed[4]!.add(
        params.scaleTet
            .subtract(params.ctx.ONE)
            .multiply(x.subtract(params.ctx.ONE))
    ).divide(denominator);
    return computed_height;
}

/**
 * Find finite ordinal n such that f(n) = x exactly.
 * Uses the formula: n ≈ (scale * x) / (1 - x)
 * The value returned can be fractional; caller should round down if needed.
 *
 * @param ctx - Numeric context for type T
 * @param x - Target f value
 * @param scale - Scale parameter (scaleAdd from FParams)
 * @return Value n as NumericValue<T>
 *
 * Note: This function assumes x is in the valid range for finite ordinals.
 */
function findRawFiniteOrdinalTyped<T extends NumericValue<T>>(
    ctx: NumericContext<T>,
    x: T,
    scale: T
): NumericValue<T> {
    return scale.multiply(x).divide(ctx.ONE.subtract(x));
}

/**
 * Find finite ordinal n such that f(n) ≈ x.
 * Uses the formula: n ≈ (scale * x) / (1 - x)
 *
 * This is the interval-based version of findFiniteOrdinal from the JavaScript implementation.
 *
 * @param ctx - Numeric context for type T
 * @param x - Interval containing the target value
 * @param scale - Scale parameter (scaleAdd from FParams)
 * @returns Finite ordinal as bigint
 */
function findFiniteOrdinalTyped<T extends NumericValue<T>>(
    ctx: NumericContext<T>,
    x: Interval<T>,
    scale: T,
    params: FParams<T>
): bigint {
    // Formula: n = (scale * x) / (1 - x)
    // For intervals, we check if simple values are contained

    const one = ctx.ONE;
    const zero = ctx.ZERO;

    let lower_n: bigint = findRawFiniteOrdinalTyped(
        ctx,
        x.lower,
        scale
    ).toBigInt();
    if (lower_n < 0n) {
        return 0n;
    }

    let upper_n: bigint = findRawFiniteOrdinalTyped(
        ctx,
        x.upper,
        scale
    ).toBigInt();
    if (lower_n == upper_n) {
        return lower_n;
    } else {
        return lower_n + 1n;
    }
}

/**
 * Find finite ordinal j such that f(w^j) = x exactly.
 * Uses the formula: j = 1 + (scaleExp * (x - 1)) / (precomputed[3] - x)
 * The value returned can be fractional; caller should round down if needed.
 *
 * @param x - Target f value
 * @param params - Function parameters
 * @return Value j as NumericValue<T>
 *
 * Note: This function assumes x is in the valid range for w^j ordinals.
 */
function findRawJTyped<T extends NumericValue<T>>(
    x: T,
    params: FParams<T>
): NumericValue<T> {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const scale = params.scaleExp;
    const numerator = scale.multiply(x.subtract(one));
    const denominator = params.precomputed[3]!.subtract(x);
    return one.add(numerator.divide(denominator));
}

/**
 * Find exponent j such that f(ω^j) ≈ x.
 * Uses the formula: j ≈ (scaleExp * (x - 1)) / (precomputed[3] - x)
 *
 * This is the interval-based version of findJ from the JavaScript implementation.
 *
 * @param x - Interval containing the target value
 * @param params - Function parameters including precomputed values
 * @returns Exponent j as bigint
 */
function findJTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    params: FParams<T>
): bigint {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const zero = ctx.ZERO;

    // Check if f(ω) = 1 is in the interval
    if (x.contains(one)) {
        return 1n;
    }

    let lower_j: bigint = findRawJTyped(x.lower, params).toBigInt();
    let upper_j: bigint = findRawJTyped(x.upper, params).toBigInt();
    if (lower_j == upper_j) {
        return lower_j;
    } else {
        return lower_j + 1n;
    }
}

/**
 * Compute f(ω^j * m) for given j and m.
 * Helper function for findM and findOmegaPowerOrdinal.
 *
 * @param j - Exponent j as bigint
 * @param m - Coefficient m as bigint
 * @param params - Function parameters
 * @returns f(ω^j * m) value
 */
function getValueFOmegaJMTyped<T extends NumericValue<T>>(
    j: bigint,
    m: bigint,
    params: FParams<T>
): T {
    const ctx = params.ctx;
    const one = ctx.ONE;

    const j_minus_1_val = ctx.fromBigInt(j - 1n);
    const j_val = ctx.fromBigInt(j);

    // f(ω^j) = 1 + (precomputed[1] * (j-1)) / (scaleExp + (j-1))
    const fOmegaJBase = one.add(
        params.precomputed[1]!.multiply(j_minus_1_val).divide(
            params.scaleExp.add(j_minus_1_val)
        )
    );

    // f(ω^(j+1)) = 1 + (precomputed[1] * j) / (scaleExp + j)
    const fOmegaJBasePlus1 = one.add(
        params.precomputed[1]!.multiply(j_val).divide(params.scaleExp.add(j_val))
    );

    if (m <= 0n) {
        throw new Error("Coefficient m must be positive");
    }

    // f(m-1) = (m-1) / ((m-1) + scaleMult) where m-1 is finite
    const f_m_minus_1 = params.scaleMult.divideFiniteByFinitePlusThis(
        m - 1n,
        params.scaleMult
    );

    // f(ω^j * m) = f(ω^j) + (f(ω^(j+1)) - f(ω^j)) * f(m-1)
    return fOmegaJBase.add(
        fOmegaJBasePlus1.subtract(fOmegaJBase).multiply(f_m_minus_1)
    );
}

/**
 * Find coefficient m such that f(ω^j * m) ≈ x.
 *
 * This is the interval-based version of findM from the JavaScript implementation.
 *
 * @param x - Interval containing the target value
 * @param j_base - Exponent j as bigint
 * @param params - Function parameters
 * @returns Coefficient m as bigint
 */
function findMTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    j_base: bigint,
    params: FParams<T>
): bigint {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const zero = ctx.ZERO;

    const j_base_val = ctx.fromBigInt(j_base);
    const j_base_minus_1_val = ctx.fromBigInt(j_base - 1n);

    // A = f(ω^j)
    const A = one.add(
        params.precomputed[1]!.multiply(j_base_minus_1_val).divide(
            params.scaleExp.add(j_base_minus_1_val)
        )
    );

    // B = f(ω^(j+1))
    const B = one.add(
        params.precomputed[1]!.multiply(j_base_val).divide(
            params.scaleExp.add(j_base_val)
        )
    );

    if (A.equals(B)) {
        return 1n;
    }

    // Interpolate to find target f(m-1)
    let target_f_m_minus_1_lower = x.lower.subtract(A).divide(B.subtract(A));
    let target_f_m_minus_1_upper = x.upper.subtract(A).divide(B.subtract(A));

    // Invert f(m-1) = (m-1) / ((m-1) + scaleMult) to get m.
    // m = 1 + scaleMult * f(m-1) / (1 - f(m-1))
    if (target_f_m_minus_1_lower.isOne()) {
        return 1n;
    }
    let m_lower = one
        .add(
            params.scaleMult
                .multiply(target_f_m_minus_1_lower)
                .divide(one.subtract(target_f_m_minus_1_lower))
        )
        .toBigInt();
    if (m_lower < 1n) { return 1n; }
    if (target_f_m_minus_1_upper.isOne()) {
        return m_lower + 1n;
    }

    let m_upper = one
        .add(
            params.scaleMult
                .multiply(target_f_m_minus_1_upper)
                .divide(one.subtract(target_f_m_minus_1_upper))
        )
        .toBigInt();

    if (m_lower == m_upper) {
        return m_lower;
    } else {
        return m_lower + 1n;
    }
}

/**
 * Find coefficient m for higher power ordinals (k > ω).
 * This is for the case where x ∈ [f(ω^ω), f(ε₀)).
 *
 * Uses the same algorithm as findM but for more complex exponents.
 *
 * @param x - Interval containing the target value
 * @param k - Exponent as OrdinalRepresentation
 * @param params - Function parameters
 * @returns Coefficient m as bigint
 */
function findCoefficientHigherTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    k: OrdinalRepresentation,
    params: FParams<T>
): bigint {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const zero = ctx.ZERO;

    // Compute f(ω^k) and f(ω^(k+1))
    const fOmegaK = fTyped({ type: "pow", k: k }, params);
    const fOmegaKPlus1 = fTyped({ type: "pow", k: addOneToOrdinal(k) }, params);
    const fOmegaKPlus1_minus_fOmegaK = fOmegaKPlus1.subtract(fOmegaK);

    if (fOmegaKPlus1_minus_fOmegaK.isZero()) {
        return 1n;
    }

    // Interpolate to find target f(m-1)
    let target_f_m_minus_1_lower = x.lower
        .subtract(fOmegaK)
        .divide(fOmegaKPlus1_minus_fOmegaK);
    let target_f_m_minus_1_upper = x.upper
        .subtract(fOmegaK)
        .divide(fOmegaKPlus1_minus_fOmegaK);

    // Invert f(m-1) = (m-1) / ((m-1) + scaleMult) to get m.
    // m = 1 + scaleMult * f(m-1) / (1 - f(m-1))
    if (target_f_m_minus_1_lower.isOne()) {
        return 1n;
    }
    let m_lower = one
        .add(
            params.scaleMult
                .multiply(target_f_m_minus_1_lower)
                .divide(one.subtract(target_f_m_minus_1_lower))
        )
        .toBigInt();
    if (m_lower < 1n) { return 1n; }
    if (target_f_m_minus_1_upper.isOne()) {
        return m_lower + 1n;
    }

    let m_upper = one
        .add(
            params.scaleMult
                .multiply(target_f_m_minus_1_upper)
                .divide(one.subtract(target_f_m_minus_1_upper))
        )
        .toBigInt();

    if (m_lower == m_upper) {
        return m_lower;
    } else {
        return m_lower + 1n;
    }
}

/**
 * Find remainder δ for higher power ordinals.
 * Given x ≈ f(ω^k * m + δ), find δ recursively.
 *
 * Uses the formula: δ is found by inverting the scaled remainder
 * fr = (x - f(ω^k * m)) * f(ω^k) / (f(ω^k * (m+1)) - f(ω^k * m))
 *
 * @param x - Interval containing the target value
 * @param k - Exponent as OrdinalRepresentation
 * @param m - Coefficient as bigint
 * @param params - Function parameters
 * @returns Remainder δ as OrdinalRepresentation
 */
function findRemainderHigherTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    k: OrdinalRepresentation,
    m: bigint,
    params: FParams<T>
): OrdinalRepresentation {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const zero = ctx.ZERO;

    // Compute f(ω^k) and f(ω^(k+1))
    const fOmegaK = fTyped({ type: "pow", k: k }, params);
    const fOmegaKPlus1 = fTyped({ type: "pow", k: addOneToOrdinal(k) }, params);

    const fOmegaKPlus1_minus_fOmegaK = fOmegaKPlus1.subtract(fOmegaK);

    // Compute f(ω^k * m) and f(ω^k * (m+1))
    const f_m_minus_1 = params.scaleMult.divideFiniteByFinitePlusThis(
        m - 1n,
        params.scaleMult
    );
    const fOmegaKM = fOmegaK.add(
        fOmegaKPlus1_minus_fOmegaK.multiply(f_m_minus_1)
    );

    const f_m = params.scaleMult.divideFiniteByFinitePlusThis(
        m,
        params.scaleMult
    );
    const fOmegaKMPlus1 = fOmegaK.add(fOmegaKPlus1_minus_fOmegaK.multiply(f_m));

    const denominator = fOmegaKMPlus1.subtract(fOmegaKM);

    if (denominator.isZero()) {
        return 0n;
    }

    // Compute scaled remainder: fr = (x - f(ω^k * m)) * f(ω^k) / (f(ω^k * (m+1)) - f(ω^k * m))
    let fr = x
        .subtractScalar(fOmegaKM)
        .multiplyScalar(fOmegaK)
        .divideScalar(denominator);

    // Safety checks
    if (fr.upper.compare(fOmegaK) >= 0 || fr.lower.compare(zero) <= 0) {
        return 0n;
    }

    return fInverseTyped(fr, params);
}

/**
 * Find ordinal representation for x in the omega power range [1, 3).
 * This covers f(ω) to f(ω^ω).
 *
 * @param x - Interval containing the target value
 * @param params - Function parameters
 * @param depth - Recursion depth for tracking
 * @returns Ordinal representation
 */
function findOmegaPowerOrdinalTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    params: FParams<T>
): OrdinalRepresentation {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const zero = ctx.ZERO;

    const j = findJTyped(x, params);

    if (j === 0n) {
        return findFiniteOrdinalTyped(ctx, x, params.scaleAdd, params);
    }

    const m = findMTyped(x, j, params);

    const j_minus_1_val = ctx.fromBigInt(j - 1n);

    // f(w^j) = 1 + param1*(j-1)/(scaleExp+j-1)
    const fOmegaJ_val = one.add(
        params.precomputed[1]!.multiply(j_minus_1_val).divide(
            params.scaleExp.add(j_minus_1_val)
        )
    );

    const fOmegaJM_val = getValueFOmegaJMTyped(j, m, params);
    const fOmegaJMPlus1_val = getValueFOmegaJMTyped(j, m + 1n, params);

    // If interval exactly contains f(ω^j * m), return that ordinal
    if (x.contains(fOmegaJM_val) && m === 1n) {
        return { type: "pow", k: j };
    } else if (x.contains(fOmegaJM_val)) {
        return { type: "sum", beta: j, c: m, delta: 0n };
    }

    const x_minus_fOmegaJM = x.subtractScalar(fOmegaJM_val);
    // Interpolation ratio = (x - f(ω^j * m)) / (f(ω^j * (m+1)) - f(ω^j * m))
    let ratio = x_minus_fOmegaJM.divideScalar(
        fOmegaJMPlus1_val.subtract(fOmegaJM_val)
    );
    const fr = ratio.multiplyScalar(fOmegaJ_val);

    let rem_ordinal_representation: OrdinalRepresentation;
    const denom = fOmegaJMPlus1_val.subtract(fOmegaJM_val);

    if (denom.isZero() || fr.contains(zero) || fr.upper.compare(fOmegaJ_val) >= 0) {
        rem_ordinal_representation = 0n;
    } else {
        rem_ordinal_representation = fInverseTyped(fr, params);
    }

    if (m === 1n && rem_ordinal_representation === 0n) {
        return { type: "pow", k: j };
    } else {
        return {
            type: "sum",
            beta: j,
            c: m,
            delta: rem_ordinal_representation,
        };
    }
}
/**
 * Find ordinal representation for x in the higher power range using iterative calculation.
 * This avoids deep recursion for very large ordinals by iteratively computing tower heights.
 * 
 * For x in the range [precomputed[11], precomputed[10]), we iteratively compute:
 * - Start with fk = initial formula result
 * - While fk is still in the high range, compute the next level: fk_next using the formula
 * - Count the number of iterations (tower_height)
 * - When fk falls below the threshold, compute k = fInverse(fk) recursively
 * - Build result as ω^(ω^(ω^(...^k))) with tower_height levels
 *
 * @param x - Interval containing the target value
 * @param params - Function parameters
 * @returns Ordinal representation
 */
function findHigherPowerOrdinalIterativeTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    params: FParams<T>
): OrdinalRepresentation {
    const ctx = params.ctx;
    const one = ctx.ONE;

    let fk = x;
    let tower_height = 0n;

    // Iteratively compute f(k) where result = ω^k, reducing the value each iteration
    // Keep applying the formula while fk is in the high range
    // We need to ensure the UPPER bound is below the threshold to avoid recursion back into this function
    while (fk.upper.compare(params.precomputed[11]!) >= 0) {

        if (fk.lower.compare(params.precomputed[1]!) < 0) {
            throw new Error(`Error in iterative calculation at step ${tower_height}: fk.lower (${fk.lower.toNumber()}) < precomputed[1] (${params.precomputed[1]!.toNumber()})`);
        }

        tower_height++;

        // Apply formula: fk_next = (p8 * fk - p6) / (fk + p7)
        // This is a rational function of the form (a*x + b) / (x + c) where:
        // a = p8, b = -p6, c = p7
        // We use applyRationalFunction to correctly handle the dependency between
        // the two occurrences of fk in the numerator and denominator
        const p8 = params.precomputed[8]!;
        const p6 = params.precomputed[6]!;
        const p7 = params.precomputed[7]!;

        const fk_new = fk.applyRationalFunction(p8, p6.negate(), p7);

        fk = fk_new;
    }

    // Now fk is below the threshold, compute it recursively
    let k: OrdinalRepresentation = fInverseTyped(fk, params);

    // Build the tower: ω^(ω^(ω^(...^k)))
    for (let i = 0n; i < tower_height; i++) {
        k = { type: "pow", k: k };
    }

    return k;
}

/**
 * Find ordinal representation for x in the higher power range [f(ω^ω), f(ε₀)).
 *
 * @param x - Interval containing the target value
 * @param params - Function parameters
 * @returns Ordinal representation
 */
function findHigherPowerOrdinalTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    params: FParams<T>
): OrdinalRepresentation {
    const ctx = params.ctx;
    const one = ctx.ONE;

    // Formula for finding k: fk = (p8 * x - p6) / (x + p7)
    // This is a rational function of the form (a*y + b) / (y + c) where:
    // a = p8, b = -p6, c = p7
    // Use applyRationalFunction to correctly handle dependency
    const fk = x.applyRationalFunction(
        params.precomputed[8]!,     // a = p8
        params.precomputed[6]!.negate(),  // b = -p6
        params.precomputed[7]!      // c = p7
    );

    if (fk.contains(params.precomputed[5]!)) {
        console.log(`[findHigherPower] fk contains f(ε₀), returning epsilon`);
        return { type: "epsilon", index: 0n };
    }

    // Recursively find k
    const k = fInverseTyped(fk, params);
    if (k === 0n) { return 0n; }

    const m = findCoefficientHigherTyped(x, k, params);
    const r = findRemainderHigherTyped(x, k, m, params);

    return {
        type: "sum",
        beta: k,
        c: m,
        delta: r,
    };
}

/**
 * Type-safe inverse ordinal mapping function using interval arithmetic.
 *
 * Given a value x (as an interval), finds the ordinal α such that f(α) ≈ x.
 *
 * This is the main fInverse function, reimplemented from JavaScript with:
 * - Interval arithmetic instead of threshold-based approximation
 * - Full type safety with NumericValue<T>
 * - BigInt for ordinal structure (coefficients, heights)
 *
 * @param x - Interval containing the target value. Partial overlap with [0, f(ε₀)] is allowed.
 * @param params - Function parameters with precomputed values
 * @returns Ordinal representation
 * @throws Error if the entire interval is outside the valid range [0, f(ε₀)]
 */
export function fInverseTyped<T extends NumericValue<T>>(
    x: Interval<T>,
    params: FParams<T>
): OrdinalRepresentation {
    const ctx = params.ctx;
    const one = ctx.ONE;
    const zero = ctx.ZERO;

    // Validate range: reject only if the ENTIRE interval is outside [0, f(ε₀)]
    // Allow partial overlap - we'll clamp to valid values
    const maxValue = params.precomputed[5]!;

    // Reject if entire interval is below 0
    if (x.upper.compare(zero) < 0) {
        throw new Error(
            `Input interval ${x} is entirely below the valid range [0, ${maxValue.toNumber()}]`
        );
    }

    // Reject if entire interval is above f(ε₀)
    if (x.lower.compare(maxValue) > 0) {
        throw new Error(
            `Input interval ${x} is entirely above the valid range [0, ${maxValue.toNumber()}]`
        );
    }

    // Check if 0 is in the interval (f(0) = 0)
    if (x.contains(zero) || x.isEmpty()) {
        return 0n;
    }

    // Check if ω value is in interval: f(ω) = 1
    if (x.contains(one)) {
        return { type: "pow", k: 1n };
    }

    // Check if ω^ω value is in interval: f(ω^ω) = precomputed[3]
    if (x.contains(params.precomputed[3]!)) {
        return { type: "pow", k: { type: "pow", k: 1n } };
    }

    // Check if ε₀ value is in interval: f(ε₀) = precomputed[5]
    if (x.contains(params.precomputed[5]!)) {
        return { type: "epsilon", index: 0n };
    }

    // W-tower range: (precomputed[10], precomputed[5])
    // This is for very large ordinals approaching ε₀
    if (x.upper.compare(params.precomputed[10]!) > 0) {
        let lower_height: bigint = findRawWTowerHeightTyped(
            x.lower,
            params
        ).toBigInt();
        let upper_height: bigint = findRawWTowerHeightTyped(
            x.upper,
            params
        ).toBigInt();
        if (lower_height == upper_height) {
            return { type: "w_tower", height: lower_height };
        } else {
            return { type: "w_tower", height: lower_height + 1n };
        }
    }

    let returnordinal: OrdinalRepresentation;

    // Route to appropriate handler based on range
    if (x.upper.compare(one) < 0) {
        // [0, 1): finite ordinals
        returnordinal = findFiniteOrdinalTyped(ctx, x, params.scaleAdd, params);
    } else if (x.upper.compare(params.precomputed[3]!) < 0) {
        // [1, f(ω^ω)): omega power ordinals (ω to ω^ω)
        returnordinal = findOmegaPowerOrdinalTyped(x, params);
    } else if (x.upper.compare(params.precomputed[11]!) < 0) {
        // [f(ω^ω), precomputed[11]): regular higher power ordinals
        returnordinal = findHigherPowerOrdinalTyped(x, params);
    } else {
        // [precomputed[11], f(ε₀)): higher power ordinals
        // Note: Iterative calculation was added to avoid deep recursion, but after fixing
        // the coefficient calculation bug, it's no longer strictly needed.
        // Keeping the iterative function for potential future use.
        returnordinal = findHigherPowerOrdinalIterativeTyped(x, params);
    }
    //console.log(`fInverseTyped: x is: ${x.lower.toNumber()} to ${x.upper.toNumber()}`);
    //console.log(`fInverseTyped: returning ordinal: ${stringifyOrdinal(returnordinal)}`);
    return returnordinal;
}

/**
 * Backwards-compatible wrapper for fInverseTyped.
 *
 * @param x - Single numeric value
 * @param params - Function parameters
 * @param threshold - Threshold for interval width (default 1e-13)
 * @returns Ordinal representation
 * @throws Error if x is outside the valid range [0, f(ε₀)]
 */
export function fInverseWrapper(
    x: number,
    params: FParams<DoubleNumericValue>,
    threshold: number = 1e-14
): OrdinalRepresentation {
    // Check if the point itself is outside the valid range
    const maxValue = params.precomputed[5]!.toNumber();

    if (x < 0) {
        throw new Error(`Input value ${x} is outside the valid range [0,${maxValue}]`);
    }

    if (x > maxValue) {
        throw new Error(`Input value ${x} is outside the valid range [0,${maxValue}]`);
    }

    const minX: DoubleNumericValue = DoubleNumericValue.fromNumber(x - threshold);
    const maxX: DoubleNumericValue = DoubleNumericValue.fromNumber(x + threshold);
    const pointInterval = new Interval(minX, maxX);
    return fInverseTyped(pointInterval, params);
}
