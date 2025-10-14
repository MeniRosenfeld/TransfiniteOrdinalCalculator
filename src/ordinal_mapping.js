// ordinal_mapping.js

import { DoubleFloatContext, RationalContext } from './operations/NumericContexts.js';

// NEW: FParams class to hold scale factors and precomputed values
export class FParams {
    constructor(ctx, scaleAdd, scaleMult, scaleExp, scaleTet, scaleEpsilon) {
        // Store raw scale factors
        this.ctx = ctx;
        this.scaleAdd = ctx.fromInt(scaleAdd);
        this.scaleMult = ctx.fromInt(scaleMult);
        this.scaleExp = ctx.fromInt(scaleExp);
        this.scaleTet = ctx.fromInt(scaleTet);
        this.scaleEpsilon = ctx.fromInt(scaleEpsilon);

        // Initialize precomputed values array (size 9 for indices 0-8)
        this.precomputed = new Array(11);
        this.precomputed[0] = null; // Index 0 is intentionally unused

        // Expression 1: scaleMult * (1 + scaleExp)
        this.precomputed[1] = ctx.multiply(this.scaleMult, ctx.add(ctx.ONE, this.scaleExp));

        // Expression 2: 1 + scaleMult
        this.precomputed[2] = ctx.add(ctx.ONE, this.scaleMult);

        // Expression 3: 1 + scaleMult + scaleMult * scaleExp
        // Uses precomputed[1]: 1 + this.precomputed[1]
        this.precomputed[3] = ctx.add(ctx.ONE, this.precomputed[1]);

        // Expression 4: (1 + scaleTet) * scaleMult * (1 + scaleExp)
        // Uses precomputed[1]: (1 + this.scaleTet) * this.precomputed[1]
        this.precomputed[4] = ctx.multiply(ctx.add(ctx.ONE, this.scaleTet), this.precomputed[1]);

        // Expression 5: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)
        // Uses precomputed[4]: 1 + this.precomputed[4]
        this.precomputed[5] = ctx.add(ctx.ONE, this.precomputed[4]);

        // Expression 6: (1 + (1 + scaleExp) * scaleMult * (1 + scaleTet))^2
        // Uses precomputed[5]: Math.pow(this.precomputed[5], 2)
        this.precomputed[6] = ctx.square(this.precomputed[5]);

        // Expression 7: (-1 + (1 + scaleExp) * scaleMult * (-1 + scaleTet^2))
        // Uses precomputed[1]: this.precomputed[1] * (this.scaleTet^2 - 1) - 1
        const tetSq = ctx.square(this.scaleTet);
        const tetSqMinus1 = ctx.subtract(tetSq, ctx.ONE);
        this.precomputed[7] = ctx.subtract(ctx.multiply(this.precomputed[1], tetSqMinus1), ctx.ONE);

        // Expression 8: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)^2
        // Uses precomputed[1]: 1 + this.precomputed[1] * (1 + this.scaleTet)^2
        const onePlusTet = ctx.add(ctx.ONE, this.scaleTet);
        const onePlusTetSq = ctx.square(onePlusTet);
        this.precomputed[8] = ctx.add(ctx.ONE, ctx.multiply(this.precomputed[1], onePlusTetSq));

        const ninetyNine = ctx.fromInt(99);
        this.precomputed[9] = ctx.add(this.precomputed[6], ctx.multiply(this.precomputed[7], this.precomputed[8]));
        this.precomputed[10] = ctx.add(ctx.ONE, ctx.divide(ctx.multiply(ninetyNine, this.precomputed[4]), ctx.add(ninetyNine, this.scaleTet)));
    }
}

// Default parameters for f and fInverse - now an instance of FParams
export var OLD_F_PARAMS = new FParams(DoubleFloatContext, 1, 1, 1, 1, 3);
export var DEFAULT_F_PARAMS = new FParams(DoubleFloatContext, 3, 3, 3, 3, 3);

const memo = new Map();

// Ordinal Representation Conventions:
// - Finite ordinal n: JavaScript BigInt n (e.g., 0n, 1n, 2n, ...)
// - ω^k: { type: 'pow', k: k_rep } where k_rep is an ordinal representation for k.
// - ω^β * c + δ: { type: 'sum', beta: beta_rep, c: c_int, delta: delta_rep }
//   - beta_rep: ordinal representation for β.
//   - c_int: JavaScript number for c (c >= 1). This 'c' is the coefficient from the CNF term.
//   - delta_rep: ordinal representation for δ (use ORDINAL_ZERO if no remainder).
//   - It is assumed that δ < ω^β.
// - ε_k: { type: 'epsilon', index: k_rep } where k_rep is an ordinal representation for k.

export const ORDINAL_ZERO = 0n;
export const ORDINAL_ONE = 1n;

/**
 * Converts an Ordinal class instance (CNFOrdinal, EpsilonOrdinal, or WTowerOrdinal)
 * to the format expected by the f() function in ordinal_mapping.js.
 * Assumes CNFOrdinal, EpsilonOrdinal, WTowerOrdinal classes are globally available.
 * @param {CNFOrdinal | EpsilonOrdinal | WTowerOrdinal} ordInstance - An instance of an Ordinal class.
 * @returns {object|BigInt|string} The representation for f().
 */
export function convertOrdinalInstanceToFFormat(ordInstance) {
    if (!ordInstance || typeof ordInstance.toFFormat !== 'function') {
        console.error("[ConvertInternal] ordInstance missing toFFormat():", ordInstance);
        return ORDINAL_ZERO;
    }
    try {
        return ordInstance.toFFormat();
    } catch (e) {
        console.error("[ConvertInternal] toFFormat() threw:", e);
        return ORDINAL_ZERO;
    }
}

export function isFiniteOrdinal(ordinalRep) {
    return typeof ordinalRep === 'bigint';
}

export function fFinite(ctx, n, scale) {
    return ctx.divide(n, ctx.add(n, scale));
}

export function addOneToOrdinal(betaOrdRep) {
    if (isFiniteOrdinal(betaOrdRep)) {
        return betaOrdRep + 1n; // BigInt addition
    }

    const { type, ...args } = betaOrdRep;
    if (type === 'pow') {
        const kExpRep = args.k;
        if (kExpRep === ORDINAL_ZERO) { // beta = ω^0 = 1n. So beta+1 = 2n.
            return 2n;
        }
        // General case: ω^k_exp + 1 is represented as ω^k_exp * 1 + 1n
        return { type: 'sum', beta: kExpRep, c: 1, delta: ORDINAL_ONE }; // c is Number, delta is BigInt
    } else if (type === 'sum') {
        const { beta: bExpRep, c: cCoeffInt, delta: dRemRep } = args;
        return { type: 'sum', beta: bExpRep, c: cCoeffInt, delta: addOneToOrdinal(dRemRep) };
    } else if (type === 'w_tower') { // NEW CASE
        // For beta = ω^^h, beta + 1 is represented as (ω^^h)*1 + 1
        return { type: 'sum', beta: betaOrdRep, c: 1, delta: ORDINAL_ONE };
    } else if (type === 'epsilon') { // NEW CASE for e_k + 1
        return { type: 'sum', beta: betaOrdRep, c: 1, delta: ORDINAL_ONE };
    } else {
        throw new TypeError(`Unknown ordinal object type for addOneToOrdinal: ${type} in ${JSON.stringify(betaOrdRep, bigIntReplacer)}`);
    }
}

// Custom replacer for JSON.stringify to handle BigInt
function bigIntReplacer(key, value) {
    if (typeof value === 'bigint') {
        return value.toString() + 'n'; // e.g., 123n becomes "123n"
    }
    // Ensure E0_TYPE which is a string is preserved as is by JSON.stringify for memoKey
    if (value === "E0_TYPE") {
        return "E0_TYPE";
    }
    return value;
}

// NEW: Custom function to generate a canonical string key for memoization
function generateOrdinalMemoKey(val) {
    const type = typeof val;
    if (type === 'bigint') return val.toString() + 'n';
    if (val === null) return 'null'; // Important to handle null explicitly
    if (val === "E0_TYPE") return '"E0_TYPE"'; // Ensure it's treated as a unique string value

    if (type === 'string') {
        // Basic JSON-like string escaping for consistency.
        // Handles quotes, backslashes, and common control characters.
        return '"' + val.replace(/[\\\"\b\f\n\r\t]/g, function (match) {
            switch (match) {
                case '\\': return '\\\\';
                case '"': return '\\"';
                case '\b': return '\\b';
                case '\f': return '\\f';
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                default: return match;
            }
        }) + '"';
    }
    if (type === 'number' || type === 'boolean') return String(val);

    if (type === 'object') {
        // Ordinal representations are expected to be plain objects.
        // No arrays expected directly in the f-format objects themselves (values might be, but handled by recursion).
        if (Array.isArray(val)) { // Should not be top-level for alphaRep, but robust for general values
            let arrayResult = '[';
            for (let i = 0; i < val.length; i++) {
                arrayResult += generateOrdinalMemoKey(val[i]);
                if (i < val.length - 1) arrayResult += ',';
            }
            arrayResult += ']';
            return arrayResult;
        }

        const keys = Object.keys(val).sort(); // Canonical order is crucial for memo keys
        let objectResult = '{';
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            // Keys in our f-format are simple strings, so direct stringification is okay for the key part
            objectResult += '"' + key + '":' + generateOrdinalMemoKey(val[key]);
            if (i < keys.length - 1) objectResult += ',';
        }
        objectResult += '}';
        return objectResult;
    }
    // Should not happen for valid ordinal representations used as keys
    console.error("[generateOrdinalMemoKey] Unsupported type for memo key generation:", type, val);
    throw new Error(`Unsupported type for memo key generation: ${type}`);
}

function f_omega_k_less_than_e0(kRep, params) {
    const ctx = params.ctx;
    const fKRep = f(kRep, params);
    const denominator = ctx.subtract(params.precomputed[8], fKRep);
    let result = ctx.divide(ctx.add(params.precomputed[6], ctx.multiply(fKRep, params.precomputed[7])), denominator);
    return result;
}

export function f(alphaRep, params) {
    const ctx = params.ctx;
    // Handle Epsilon type now
    if (typeof alphaRep === 'object' && alphaRep !== null && alphaRep.type === 'epsilon') {
        const indexRep = alphaRep.index;

        // Base case: f(e_0) is a precomputed value.
        if (indexRep === ORDINAL_ZERO) {
            return params.precomputed[5];
        }

        // Any other epsilon index is currently unsupported.
        throw new Error(`Mapping for epsilon ordinals with index > 0 is not supported yet. Index was: ${indexRep}`);
    }

    // Check for old "E0_TYPE" for backward compatibility if needed, but it should be deprecated.
    if (alphaRep === "E0_TYPE") {
        return params.precomputed[5];
    }

    if (typeof alphaRep !== 'bigint' && (typeof alphaRep !== 'object' || alphaRep === null || !alphaRep.type)) {
        // Use bigIntReplacer here for error message readability if JSON.stringify is used for it
        throw new TypeError(`Invalid ordinal representation type: ${typeof alphaRep} for ${alphaRep === null ? 'null' : (typeof alphaRep === 'object' ? JSON.stringify(alphaRep, bigIntReplacer) : alphaRep)}`);
    }

    // Use the new custom key generation function
    const ordinalKeyPart = generateOrdinalMemoKey(alphaRep);

    // Create a stable string representation of the relevant parts of the params object
    const paramsKeyPart = `params:${ctx.toNumber(params.scaleAdd)}-${ctx.toNumber(params.scaleMult)}-${ctx.toNumber(params.scaleExp)}-${ctx.toNumber(params.scaleTet)}-${ctx.toNumber(params.scaleEpsilon)}`;

    const memoKey = `${ordinalKeyPart}|${paramsKeyPart}`;

    if (memo.has(memoKey)) {
        return memo.get(memoKey);
    }

    let result;

    if (isFiniteOrdinal(alphaRep)) { // Rule 1: α is finite n (BigInt)
        result = fFinite(ctx, ctx.fromInt(alphaRep), params.scaleAdd);
    } else {
        const { type, ...args } = alphaRep;

        if (type === 'w_tower') { // New Rule: α is ω↑↑n
            const height = args.height;
            if (typeof height !== 'number' || height < 1 || !Number.isInteger(height)) {
                throw new Error(`Invalid height for w_tower in f(): ${height}`);
            }
            result = ctx.add(ctx.ONE, ctx.multiply(params.precomputed[4], fFinite(ctx, ctx.fromInt(BigInt(height - 1)), params.scaleTet)));
        } else if (type === 'pow') { // α = ω^k_rep
            const kRep = args.k;
            if (isFiniteOrdinal(kRep)) { // Rule 2a: k_rep is a finite ordinal j (BigInt) >= 0n
                const jBigInt = kRep;
                if (jBigInt === ORDINAL_ZERO) { // k_rep is 0n. α = ω^0 = 1n.
                    result = f(ORDINAL_ONE, params); // f(1n)
                } else { // k_rep is finite j (BigInt) >= 1n. f(ω^j) = 1 + 2f(j-1) = (3j-2)/j.
                    result = ctx.add(ctx.ONE, ctx.multiply(params.precomputed[1], fFinite(ctx, ctx.fromInt(jBigInt - 1n), params.scaleExp)));
                }
            } else { // Rule 2b: k_rep >= ω (k_rep is an object representation)
                if (kRep.type === 'epsilon') {
                    return f(kRep, params); // ω^ε_k = ε_k
                }
                // For the current scope (≤ ε₀), treat other k as < ε₀
                return f_omega_k_less_than_e0(kRep, params);
            }
        } else if (type === 'sum') { // Rule 3: α = ω^beta_rep * cNum + delta_rep
            const { beta: betaRep, c: cNum, delta: deltaRep } = args; // cNum is Number(original_BigInt_coeff)

            // Validate cNum: it should be a positive number (possibly Infinity if original BigInt was huge)
            // The Ordinal class ensures coefficients are positive BigInts for its terms.
            // convertOrdinalInstanceToFFormat converts this to Number for cNum.
            if (typeof cNum !== 'number' || !(Number.isFinite(cNum) || cNum === Infinity) || (cNum <= 0 && cNum !== Infinity)) {
                throw new Error(`Mapping 'sum' type received cNum=${cNum}, which is not a positive finite number or positive Infinity as expected from a positive coefficient.`);
            }
            if (Number.isFinite(cNum) && cNum < 1) {
                // This should ideally not happen if the original coefficient was a positive BigInt.
                // If Number(positive_BigInt) became < 1 (e.g. 0), it's an issue.
                console.warn(`Mapping 'sum' received cNum=${cNum} < 1. The mapping formula assumes c >= 1 for ω^β*c.`);
                // For robustness, if it's < 1 but finite, the formula below will use Math.max(0, floor(cNum-1))
            }


            const termOmegaBeta = { type: 'pow', k: betaRep };
            const betaPlus1Rep = addOneToOrdinal(betaRep); // betaOrdRep from args
            const termOmegaBetaPlus1 = { type: 'pow', k: betaPlus1Rep };

            const fOmegaBeta = f(termOmegaBeta, params);
            const fOmegaBetaPlus1 = f(termOmegaBetaPlus1, params);

            let f_c_minus_1_val;
            let f_c_val;

            if (cNum === Infinity) { // Original BigInt coefficient was too large for Number
                f_c_minus_1_val = ctx.ONE; // As c -> infinity, f(c-1) -> 1.0
                f_c_val = ctx.ONE;         // As c -> infinity, f(c) -> 1.0
            } else {
                // cNum is finite and positive.
                // Convert to BigInt for fFinite. Use Math.floor in case cNum has decimals (though it shouldn't from Number(BigInt)).
                const cMinus1BigInt = BigInt(Math.max(0, Math.floor(cNum - 1.0)));
                const cBigInt = BigInt(Math.floor(cNum)); // cNum should be >= 1 here based on prior checks for typical cases

                f_c_minus_1_val = fFinite(ctx, ctx.fromInt(cMinus1BigInt), params.scaleMult);
                f_c_val = fFinite(ctx, ctx.fromInt(cBigInt), params.scaleMult);
            }

            const fOmegaBetaTimesC = ctx.add(fOmegaBeta,
                ctx.multiply(ctx.subtract(fOmegaBetaPlus1, fOmegaBeta), f_c_minus_1_val));

            if (deltaRep === ORDINAL_ZERO) { // delta is 0n
                result = fOmegaBetaTimesC;
            } else {
                const fOmegaBetaTimesCPlus1Coeff = ctx.add(fOmegaBeta,
                    ctx.multiply(ctx.subtract(fOmegaBetaPlus1, fOmegaBeta), f_c_val));

                const fDeltaRep = f(deltaRep, params);

                let divisionRatio = ctx.divide(fDeltaRep, fOmegaBeta);
                if (ctx.isNaN(divisionRatio)) {
                    divisionRatio = ctx.ZERO; // Fallback for 0/0
                }
                divisionRatio = ctx.max(ctx.ZERO, ctx.min(divisionRatio, ctx.ONE));

                result = ctx.add(fOmegaBetaTimesC,
                    ctx.multiply(ctx.subtract(fOmegaBetaTimesCPlus1Coeff, fOmegaBetaTimesC), divisionRatio));
            }
        } else {
            throw new TypeError(`Unknown ordinal object type in f: ${type}`);
        }
    }

    memo.set(memoKey, result);
    return result;
}

// To use this in a browser or Node.js, you might export it:
// For Node.js:
// module.exports = { f, ORDINAL_ZERO, ORDINAL_ONE };
// For ES6 modules in browser/Node.js:
// export { f, ORDINAL_ZERO, ORDINAL_ONE };

// Test cases (can be run in Node.js or a browser console if the file is loaded)
if (typeof require !== 'undefined' && require.main === module) { // Basic check if running as main script in Node.js
    console.log("Running test cases for ordinal_mapping.f (JavaScript)...");

    // Use OLD_F_PARAMS for these original test cases to match expected values.
    const testParams = OLD_F_PARAMS;
    const ctx = testParams.ctx;

    console.log(`f(0) = ${ctx.toNumber(f(ORDINAL_ZERO, testParams))}`);
    console.log(`f(1) = ${ctx.toNumber(f(ORDINAL_ONE, testParams))}`);
    console.log(`f(2) = ${ctx.toNumber(f(2n, testParams))}`);

    const epsilon0Rep = { type: 'epsilon', index: ORDINAL_ZERO };
    console.log(`f(ε₀) = ${ctx.toNumber(f(epsilon0Rep, testParams))}`);

    console.log(`f(ω^0) = ${ctx.toNumber(f({ type: 'pow', k: ORDINAL_ZERO }, testParams))}`);

    const omegaRep = { type: 'pow', k: ORDINAL_ONE };
    console.log(`f(ω) = ${ctx.toNumber(f(omegaRep, testParams))}`);

    const omegaSqRep = { type: 'pow', k: 2n };
    console.log(`f(ω^2) = ${ctx.toNumber(f(omegaSqRep, testParams))}`);

    const omegaCbRep = { type: 'pow', k: 3n };
    console.log(`f(ω^3) = ${ctx.toNumber(f(omegaCbRep, testParams))}`);

    const omegaOmegaRep = { type: 'pow', k: omegaRep };
    console.log(`f(ω^ω) = ${ctx.toNumber(f(omegaOmegaRep, testParams))}`);

    const omegaOmegaOmegaRep = { type: 'pow', k: omegaOmegaRep };
    console.log(`f(ω^ω^ω) = ${ctx.toNumber(f(omegaOmegaOmegaRep, testParams))}`);

    const omegaTimes2Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω*2) = ${ctx.toNumber(f(omegaTimes2Rep, testParams))}`);

    const omegaTimes3Rep = { type: 'sum', beta: ORDINAL_ONE, c: 3, delta: ORDINAL_ZERO };
    console.log(`f(ω*3) = ${ctx.toNumber(f(omegaTimes3Rep, testParams))}`);

    const omegaTimes2Plus1Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ONE };
    console.log(`f(ω*2+1) = ${ctx.toNumber(f(omegaTimes2Plus1Rep, testParams))}`);

    const omegaSqTimes2Rep = { type: 'sum', beta: 2n, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω^2*2) = ${ctx.toNumber(f(omegaSqTimes2Rep, testParams))}`);

    const omegaSqPlusOmegaRep = { type: 'sum', beta: 2n, c: 1, delta: omegaRep };
    console.log(`f(ω^2+ω) = ${ctx.toNumber(f(omegaSqPlusOmegaRep, testParams))}`);

    console.log("Test cases finished.");
}