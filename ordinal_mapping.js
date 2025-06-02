// ordinal_mapping.js

// NEW: FParams class to hold scale factors and precomputed values
class FParams {
    constructor(scaleAdd, scaleMult, scaleExp, scaleTet) {
        // Store raw scale factors
        this.scaleAdd = scaleAdd;
        this.scaleMult = scaleMult;
        this.scaleExp = scaleExp;
        this.scaleTet = scaleTet;

        // Initialize precomputed values array (size 9 for indices 0-8)
        this.precomputed = new Array(11);
        this.precomputed[0] = null; // Index 0 is intentionally unused

        // Expression 1: scaleMult * (1 + scaleExp)
        this.precomputed[1] = this.scaleMult * (1 + this.scaleExp);

        // Expression 2: 1 + scaleMult
        this.precomputed[2] = 1 + this.scaleMult;

        // Expression 3: 1 + scaleMult + scaleMult * scaleExp
        // Uses precomputed[1]: 1 + this.precomputed[1]
        this.precomputed[3] = 1 + this.precomputed[1];

        // Expression 4: (1 + scaleTet) * scaleMult * (1 + scaleExp)
        // Uses precomputed[1]: (1 + this.scaleTet) * this.precomputed[1]
        this.precomputed[4] = (1 + this.scaleTet) * this.precomputed[1];

        // Expression 5: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)
        // Uses precomputed[4]: 1 + this.precomputed[4]
        this.precomputed[5] = 1 + this.precomputed[4];

        // Expression 6: (1 + (1 + scaleExp) * scaleMult * (1 + scaleTet))^2
        // Uses precomputed[5]: Math.pow(this.precomputed[5], 2)
        this.precomputed[6] = Math.pow(this.precomputed[5], 2);

        // Expression 7: (-1 + (1 + scaleExp) * scaleMult * (-1 + scaleTet^2))
        // Uses precomputed[1]: this.precomputed[1] * (Math.pow(this.scaleTet, 2) - 1) - 1
        this.precomputed[7] = this.precomputed[1] * (Math.pow(this.scaleTet, 2) - 1) - 1;

        // Expression 8: 1 + (1 + scaleExp) * scaleMult * (1 + scaleTet)^2
        // Uses precomputed[1]: 1 + this.precomputed[1] * Math.pow(1 + this.scaleTet, 2)
        this.precomputed[8] = 1 + this.precomputed[1] * Math.pow(1 + this.scaleTet, 2);

        this.precomputed[9] = this.precomputed[6] + this.precomputed[7] * this.precomputed[8];

        this.precomputed[10] = 1 + 99*this.precomputed[4]/(99+this.scaleTet);
    }
}

// Default parameters for f and fInverse - now an instance of FParams
const OLD_F_PARAMS = new FParams(1, 1, 1, 1);
const DEFAULT_F_PARAMS = new FParams(3, 3, 3, 3);

console.log("[Debug] In ordinal_mapping.js, typeof WTowerOrdinal:", typeof WTowerOrdinal, "WTowerOrdinal itself:", WTowerOrdinal);
const memo = new Map();

// Ordinal Representation Conventions:
// - Finite ordinal n: JavaScript BigInt n (e.g., 0n, 1n, 2n, ...)
// - ω^k: { type: 'pow', k: k_rep } where k_rep is an ordinal representation for k.
// - ω^β * c + δ: { type: 'sum', beta: beta_rep, c: c_int, delta: delta_rep }
//   - beta_rep: ordinal representation for β.
//   - c_int: JavaScript number for c (c >= 1). This 'c' is the coefficient from the CNF term.
//   - delta_rep: ordinal representation for δ (use ORDINAL_ZERO if no remainder).
//   - It is assumed that δ < ω^β.
// - ε₀: The string "E0_TYPE"

const ORDINAL_ZERO = 0n;
const ORDINAL_ONE = 1n;

/**
 * Converts an Ordinal class instance (CNFOrdinal, EpsilonNaughtOrdinal, or WTowerOrdinal)
 * to the format expected by the f() function in ordinal_mapping.js.
 * Assumes CNFOrdinal, EpsilonNaughtOrdinal, WTowerOrdinal classes are globally available.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal | WTowerOrdinal} ordInstance - An instance of an Ordinal class.
 * @returns {object|BigInt|string} The representation for f(). String for E0_TYPE.
 */
function convertOrdinalInstanceToFFormat(ordInstance) {
    if (!ordInstance || !ordInstance.constructor || !ordInstance.constructor.name) {
        console.error("[ConvertInternal] ordInstance is null, undefined, or has no constructor/name:", ordInstance);
        return ORDINAL_ZERO; 
    }

    console.log("[ConvertInternal] ordInstance.constructor.name is:", ordInstance.constructor.name);

    // Check by constructor name (less robust, but good for debugging this specific issue)
    if (ordInstance.constructor.name === 'WTowerOrdinal') {
        console.log("[ConvertInternal] Matched WTowerOrdinal via constructor.name.");
        return { type: 'w_tower', height: ordInstance.height }; 
    }
    
    if (ordInstance.constructor.name === 'EpsilonNaughtOrdinal') {
        console.log("[ConvertInternal] Matched EpsilonNaughtOrdinal via constructor.name.");
        return "E0_TYPE";
    }
    
    if (ordInstance.constructor.name === 'CNFOrdinal') {
        console.log("[ConvertInternal] Matched CNFOrdinal via constructor.name.");
        if (ordInstance.isZero()) {
            return ORDINAL_ZERO;
        }
        if (ordInstance.isFinite()) {
            return ordInstance.getFinitePart();
        }
        const terms = ordInstance.terms;
        if (terms.length === 1 && terms[0].coefficient === 1n && !terms[0].exponent.isZero()) {
            const k_rep_for_f = convertOrdinalInstanceToFFormat(terms[0].exponent);
            return { type: 'pow', k: k_rep_for_f };
        }
        const firstTerm = terms[0];
        const beta_rep_for_f = convertOrdinalInstanceToFFormat(firstTerm.exponent);
        const c_from_ordinal = firstTerm.coefficient;
        let c_num_for_f = Number(c_from_ordinal);
        if (c_from_ordinal > BigInt(Number.MAX_SAFE_INTEGER) || c_from_ordinal < BigInt(Number.MIN_SAFE_INTEGER)) {
            if (Number.isFinite(c_num_for_f)) {
                 console.warn(`Coefficient ${c_from_ordinal.toString()} was outside JS Number safe integer range for f() mapping. Converted to ${c_num_for_f}.`);
            } else {
                 console.warn(`Coefficient ${c_from_ordinal.toString()} converted to ${c_num_for_f} for f() mapping.`);
            }
        }
        let delta_rep_for_f;
        if (terms.length === 1) {
            delta_rep_for_f = ORDINAL_ZERO;
        } else {
            const remainderTracer = ordInstance._tracer; 
            const remainderTerms = terms.slice(1).map(t => ({
                exponent: t.exponent.clone(remainderTracer), 
                coefficient: t.coefficient
            }));
            const remainderOrdinal = new CNFOrdinal(remainderTerms, remainderTracer);
            delta_rep_for_f = convertOrdinalInstanceToFFormat(remainderOrdinal);
        }
        return { type: 'sum', beta: beta_rep_for_f, c: c_num_for_f, delta: delta_rep_for_f };
    }

    console.error("[ConvertInternalFinal] Did not match any known constructor name. ordInstance.constructor.name was:", ordInstance.constructor.name, "Instance:", ordInstance);
    return ORDINAL_ZERO; 
}

function isFiniteOrdinal(ordinalRep) {
    return typeof ordinalRep === 'bigint';
}

function fFinite(nBigInt, scale=1) {
    if (typeof nBigInt !== 'bigint' || nBigInt < 0n) {
        throw new Error(`fFinite called with non-BigInt or negative: ${nBigInt}`);
    }
    if (nBigInt === ORDINAL_ZERO) {
        return 0.0;
    }
    // Convert BigInt to Number for floating point division.
    // For very large nBigInt, n/(n+1) approaches 1.
    // Number(nBigInt) might lose precision if nBigInt > Number.MAX_SAFE_INTEGER,
    // but the ratio will still be very close to 1.
    const n_num = Number(nBigInt);
    return n_num / (n_num + scale);
}

function addOneToOrdinal(betaOrdRep) {
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

function f(alphaRep, params=DEFAULT_F_PARAMS) {
    // Handle E0_TYPE first
    if (alphaRep === "E0_TYPE") {
        return params.precomputed[5]; // Value for f(ε₀) is determined by params
    }

    if (typeof alphaRep !== 'bigint' && (typeof alphaRep !== 'object' || alphaRep === null || !alphaRep.type)) {
        // Use bigIntReplacer here for error message readability if JSON.stringify is used for it
        throw new TypeError(`Invalid ordinal representation type: ${typeof alphaRep} for ${alphaRep === null ? 'null' : (typeof alphaRep === 'object' ? JSON.stringify(alphaRep, bigIntReplacer) : alphaRep )}`);
    }

    // Use the new custom key generation function
    const ordinalKeyPart = generateOrdinalMemoKey(alphaRep);
    
    // Create a stable string representation of the relevant parts of the params object
    const paramsKeyPart = `params:${params.scaleAdd}-${params.scaleMult}-${params.scaleExp}-${params.scaleTet}`;
    
    const memoKey = `${ordinalKeyPart}|${paramsKeyPart}`;

    if (memo.has(memoKey)) {
        return memo.get(memoKey);
    }

    let result = 0.0;

    if (isFiniteOrdinal(alphaRep)) { // Rule 1: α is finite n (BigInt)
        result = fFinite(alphaRep, params.scaleAdd);
    } else {
        const { type, ...args } = alphaRep;

        if (type === 'w_tower') { // New Rule: α is ω↑↑n
            const height = args.height;
            if (typeof height !== 'number' || height < 1 || !Number.isInteger(height)){
                throw new Error(`Invalid height for w_tower in f(): ${height}`);
            }
            result = 1+params.precomputed[4]*fFinite(BigInt(height-1),params.scaleTet);
        } else if (type === 'pow') { // α = ω^k_rep
            const kRep = args.k;
            if (isFiniteOrdinal(kRep)) { // Rule 2a: k_rep is a finite ordinal j (BigInt) >= 0n
                const jBigInt = kRep;
                if (jBigInt === ORDINAL_ZERO) { // k_rep is 0n. α = ω^0 = 1n.
                    result = f(ORDINAL_ONE, params); // f(1n)
                } else { // k_rep is finite j (BigInt) >= 1n. f(ω^j) = 1 + 2f(j-1) = (3j-2)/j.
                    const j_num = Number(jBigInt); // Convert BigInt to Number for formula
                    result = 1 + params.precomputed[1]*fFinite(jBigInt-1n,params.scaleExp);
                }
            } else { // Rule 2b: k_rep >= ω (k_rep is an object representation)
                const fKRep = f(kRep, params);
                const denominator = params.precomputed[8] - fKRep;
                if (Math.abs(denominator) < 1e-9) {
                    throw new Error(`Division by near-zero in f(ω^k): f(k)=${fKRep} for k=${JSON.stringify(kRep, bigIntReplacer)}`);
                }
                result = (params.precomputed[6] + fKRep * params.precomputed[7]) / denominator;
            }
        } else if (type === 'sum') { // Rule 3: α = ω^beta_rep * cNum + delta_rep
            const { beta: betaRep, c: cNum, delta: deltaRep } = args; // cNum is Number(original_BigInt_coeff)

            // Validate cNum: it should be a positive number (possibly Infinity if original BigInt was huge)
            // The Ordinal class ensures coefficients are positive BigInts for its terms.
            // convertOrdinalInstanceToFFormat converts this to Number for cNum.
            if (typeof cNum !== 'number' || !(Number.isFinite(cNum) || cNum === Infinity) || (cNum <= 0 && cNum !== Infinity) ) {
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
                f_c_minus_1_val = 1.0; // As c -> infinity, f(c-1) -> 1.0
                f_c_val = 1.0;         // As c -> infinity, f(c) -> 1.0
            } else {
                // cNum is finite and positive.
                // Convert to BigInt for fFinite. Use Math.floor in case cNum has decimals (though it shouldn't from Number(BigInt)).
                const cMinus1BigInt = BigInt(Math.max(0, Math.floor(cNum - 1.0)));
                const cBigInt = BigInt(Math.floor(cNum)); // cNum should be >= 1 here based on prior checks for typical cases

                f_c_minus_1_val = fFinite(cMinus1BigInt,params.scaleMult);
                f_c_val = fFinite(cBigInt,params.scaleMult);
            }
            
            const fOmegaBetaTimesC = fOmegaBeta +
                (fOmegaBetaPlus1 - fOmegaBeta) * f_c_minus_1_val;

            if (deltaRep === ORDINAL_ZERO) { // delta is 0n
                result = fOmegaBetaTimesC;
            } else { 
                const fOmegaBetaTimesCPlus1Coeff = fOmegaBeta +
                    (fOmegaBetaPlus1 - fOmegaBeta) * f_c_val;

                const fDeltaRep = f(deltaRep, params);

                if (Math.abs(fOmegaBeta) < 1e-9) { // fOmegaBeta is f(ω^beta)
                    throw new Error(`f(ω^beta_rep) is near-zero (${fOmegaBeta}) for beta_rep=${JSON.stringify(betaRep, bigIntReplacer)}, in denominator. Alpha was ${JSON.stringify(alphaRep, bigIntReplacer)}`);
                }

                result = fOmegaBetaTimesC +
                    (fOmegaBetaTimesCPlus1Coeff - fOmegaBetaTimesC) *
                    fDeltaRep / fOmegaBeta;
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

    console.log(`f(0) = ${f(ORDINAL_ZERO, testParams)}`); 
    console.log(`f(1) = ${f(ORDINAL_ONE, testParams)}`); 
    console.log(`f(2) = ${f(2n, testParams)}`); 

    console.log(`f(ε₀) = ${f("E0_TYPE", testParams)}`); 

    console.log(`f(ω^0) = ${f({ type: 'pow', k: ORDINAL_ZERO }, testParams)}`); 

    const omegaRep = { type: 'pow', k: ORDINAL_ONE };
    console.log(`f(ω) = ${f(omegaRep, testParams)}`); 

    const omegaSqRep = { type: 'pow', k: 2n };
    console.log(`f(ω^2) = ${f(omegaSqRep, testParams)}`); 

    const omegaCbRep = { type: 'pow', k: 3n };
    console.log(`f(ω^3) = ${f(omegaCbRep, testParams)}`); 

    const omegaOmegaRep = { type: 'pow', k: omegaRep };
    console.log(`f(ω^ω) = ${f(omegaOmegaRep, testParams)}`); 

    const omegaOmegaOmegaRep = { type: 'pow', k: omegaOmegaRep };
    console.log(`f(ω^ω^ω) = ${f(omegaOmegaOmegaRep, testParams)}`); 

    const omegaTimes2Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω*2) = ${f(omegaTimes2Rep, testParams)}`); 

    const omegaTimes3Rep = { type: 'sum', beta: ORDINAL_ONE, c: 3, delta: ORDINAL_ZERO };
    console.log(`f(ω*3) = ${f(omegaTimes3Rep, testParams)}`); 

    const omegaTimes2Plus1Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ONE };
    console.log(`f(ω*2+1) = ${f(omegaTimes2Plus1Rep, testParams)}`); 

    const omegaSqTimes2Rep = { type: 'sum', beta: 2n, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω^2*2) = ${f(omegaSqTimes2Rep, testParams)}`); 

    const omegaSqPlusOmegaRep = { type: 'sum', beta: 2n, c: 1, delta: omegaRep };
    console.log(`f(ω^2+ω) = ${f(omegaSqPlusOmegaRep, testParams)}`); 

    console.log("Test cases finished.");
}