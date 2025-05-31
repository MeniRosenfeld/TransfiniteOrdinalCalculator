// ordinal_mapping.js

var DEFAULT_F_PARAMS = {
    u_add: 1.0,    // Scale for f(n) for standalone finite ordinals
    u_mul: 1.0,    // Scale for f(c) where c is a coefficient (e.g. in w^k*c)
    u_exp: 1.0,    // Placeholder, effectively not used if f(w^j) formula is reverted
    u_tet: 1.0     // Placeholder, effectively not used if f(w^^h) formula is reverted
};

// console.log("[Debug] In ordinal_mapping.js, typeof WTowerOrdinal:", typeof WTowerOrdinal, "WTowerOrdinal itself:", WTowerOrdinal); // Kept for now
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

function fFinite(nBigInt, u_val) {
    if (typeof nBigInt !== 'bigint' || nBigInt < 0n) {
        throw new Error(`fFinite called with non-BigInt or negative: ${nBigInt}`);
    }
    if (typeof u_val !== 'number' || u_val <= 0) {
        // Default u_val to 1.0 if it's invalid, with a warning.
        // This makes fFinite more robust if params aren't perfectly threaded yet.
        console.warn(`fFinite received invalid u_val: ${u_val}. Defaulting to 1.0.`);
        u_val = 1.0;
    }
    if (nBigInt === ORDINAL_ZERO) {
        return 0.0;
    }
    const n_num = Number(nBigInt);
    return n_num / (n_num + u_val); // Use u_val
}

function addOneToOrdinal(betaOrdRep, params = DEFAULT_F_PARAMS) {
    if (isFiniteOrdinal(betaOrdRep)) {
        return betaOrdRep + 1n;
    }
    const { type, ...args } = betaOrdRep;
    if (type === 'pow') {
        const kExpRep = args.k;
        if (kExpRep === ORDINAL_ZERO) {
            return 2n;
        }
        return { type: 'sum', beta: kExpRep, c: 1, delta: ORDINAL_ONE };
    } else if (type === 'sum') {
        const { beta: bExpRep, c: cCoeffInt, delta: dRemRep } = args;
        return { type: 'sum', beta: bExpRep, c: cCoeffInt, delta: addOneToOrdinal(dRemRep, params) }; // Pass params
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

function f(alphaRep, params = DEFAULT_F_PARAMS) {
    const memoKeyObj = { data: alphaRep, p: params };
    const memoKey = JSON.stringify(memoKeyObj, bigIntReplacer);
    if (memo.has(memoKey)) {
        return memo.get(memoKey);
    }

    let result;

    if (alphaRep === "E0_TYPE") { // Reverted to original formula
        result = 5.0;
    } else if (isFiniteOrdinal(alphaRep)) {
        result = fFinite(alphaRep, params.u_add); // Uses params.u_add
    } else if (typeof alphaRep === 'object' && alphaRep !== null && alphaRep.type) {
        const { type, ...args } = alphaRep;

        if (type === 'w_tower') { // Reverted to original formula (u_tet not used)
            const height = args.height;
            if (typeof height !== 'number' || height < 1 || !Number.isInteger(height)){
                throw new Error(`Invalid height for w_tower in f(): ${height}`);
            }
            if (height === 1) { 
                result = f({ type: 'pow', k: ORDINAL_ONE }, params); // f(w)
            } else {
                result = 5.0 - (4.0 / height); // Original formula
            }
        } else if (type === 'pow') { 
            const kRep = args.k;
            if (isFiniteOrdinal(kRep)) { 
                const jBigInt = kRep;
                if (jBigInt === ORDINAL_ZERO) { 
                    result = fFinite(ORDINAL_ONE, params.u_add); // f(1) using u_add
                } else { 
                    const j_num = Number(jBigInt);
                    result = (3.0 * j_num - 2.0) / j_num; // Original formula (u_exp not used)
                }
            } else { // k is infinite
                const fKRep = f(kRep, params); 
                const denominator = 9.0 - fKRep;
                if (Math.abs(denominator) < 1e-9) {
                     // Fallback if denominator is zero, use f(e_0) based on current params
                    console.warn(`f(w^k) infinite k: Denominator near zero. f(k)=${fKRep}. Params: ${JSON.stringify(params)}.`);
                    result = 1 + params.u_mul * (1 + params.u_exp) * (1 + params.u_tet); // Parameterized f(e_0)
                } else {
                    result = (25.0 - fKRep) / denominator; // Original formula
                }
            }
        } else if (type === 'sum') { 
            const { beta: betaRep, c: cNum, delta: deltaRep } = args; 
            if (typeof cNum !== 'number' || !(Number.isFinite(cNum) || cNum === Infinity) || (cNum <= 0 && cNum !== Infinity) ) {
                 throw new Error(`Mapping 'sum' type received cNum=${cNum}, invalid.`);
            }

            const fOmegaBeta = f({ type: 'pow', k: betaRep }, params); 
            const betaPlus1Rep = addOneToOrdinal(betaRep, params); 
            const fOmegaBetaPlus1 = f({ type: 'pow', k: betaPlus1Rep }, params); 

            let f_c_minus_1_val, f_c_val;
            if (cNum === Infinity) { 
                f_c_minus_1_val = 1.0;
                f_c_val = 1.0;    
            } else {
                const cMinus1BigInt = BigInt(Math.max(0, Math.floor(cNum - 1.0)));
                const cBigInt = BigInt(Math.floor(cNum));
                f_c_minus_1_val = fFinite(cMinus1BigInt, params.u_mul); // Use u_mul for coefficients
                f_c_val = fFinite(cBigInt, params.u_mul);           // Use u_mul for coefficients
            }
            
            const fOmegaBetaTimesC = fOmegaBeta + (fOmegaBetaPlus1 - fOmegaBeta) * f_c_minus_1_val;

            if (deltaRep === ORDINAL_ZERO) { 
                result = fOmegaBetaTimesC;
            } else { 
                const fOmegaBetaTimesCPlus1Coeff = fOmegaBeta + (fOmegaBetaPlus1 - fOmegaBeta) * f_c_val;
                const fDeltaRep = f(deltaRep, params); 
                if (Math.abs(fOmegaBeta) < 1e-9) { 
                    throw new Error(`f(ω^beta_rep) is near-zero (${fOmegaBeta}). Denominator error.`);
                }
                result = fOmegaBetaTimesC + (fOmegaBetaTimesCPlus1Coeff - fOmegaBetaTimesC) * fDeltaRep / fOmegaBeta;
            }
        } else {
            throw new TypeError(`Unknown ordinal f-format type in f: ${type} for ${JSON.stringify(alphaRep)}`);
        }
    } else {
        throw new TypeError(`Invalid alphaRep in f: ${JSON.stringify(alphaRep)}`);
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

    console.log(`f(0) = ${f(ORDINAL_ZERO, DEFAULT_F_PARAMS)}`); // Expected: 0.0
    console.log(`f(1) = ${f(ORDINAL_ONE, DEFAULT_F_PARAMS)}`); // Expected: 0.5
    console.log(`f(2) = ${f(2n, DEFAULT_F_PARAMS)}`); // Expected: 2/3 = 0.666...

    console.log(`f(ε₀) = ${f("E0_TYPE", DEFAULT_F_PARAMS)}`); // Expected: 5.0

    console.log(`f(ω^0) = ${f({ type: 'pow', k: ORDINAL_ZERO }, DEFAULT_F_PARAMS)}`); // Expected: 0.5 (f(1))

    const omegaRep = { type: 'pow', k: ORDINAL_ONE };
    console.log(`f(ω) = ${f(omegaRep, DEFAULT_F_PARAMS)}`); // Expected: 1.0

    const omegaSqRep = { type: 'pow', k: 2n };
    console.log(`f(ω^2) = ${f(omegaSqRep, DEFAULT_F_PARAMS)}`); // Expected: 2.0

    const omegaCbRep = { type: 'pow', k: 3n };
    console.log(`f(ω^3) = ${f(omegaCbRep, DEFAULT_F_PARAMS)}`); // Expected: (3*3-2)/3 = 7/3 = 2.333...

    const omegaOmegaRep = { type: 'pow', k: omegaRep };
    console.log(`f(ω^ω) = ${f(omegaOmegaRep, DEFAULT_F_PARAMS)}`); // Expected: 3.0

    const omegaOmegaOmegaRep = { type: 'pow', k: omegaOmegaRep };
    console.log(`f(ω^ω^ω) = ${f(omegaOmegaOmegaRep, DEFAULT_F_PARAMS)}`); // Expected: 11/3 = 3.666...

    const omegaTimes2Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω*2) = ${f(omegaTimes2Rep, DEFAULT_F_PARAMS)}`); // Expected: 1.5

    const omegaTimes3Rep = { type: 'sum', beta: ORDINAL_ONE, c: 3, delta: ORDINAL_ZERO };
    console.log(`f(ω*3) = ${f(omegaTimes3Rep, DEFAULT_F_PARAMS)}`); // Expected: 5/3 = 1.666...

    const omegaTimes2Plus1Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ONE };
    console.log(`f(ω*2+1) = ${f(omegaTimes2Plus1Rep, DEFAULT_F_PARAMS)}`); // Expected: 19/12 = 1.58333...

    const omegaSqTimes2Rep = { type: 'sum', beta: 2n, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω^2*2) = ${f(omegaSqTimes2Rep, DEFAULT_F_PARAMS)}`); // Expected: 13/6 = 2.1666...

    const omegaSqPlusOmegaRep = { type: 'sum', beta: 2n, c: 1, delta: omegaRep };
    console.log(`f(ω^2+ω) = ${f(omegaSqPlusOmegaRep, DEFAULT_F_PARAMS)}`); // Expected: 25/12 = 2.08333...

    console.log("Test cases finished.");
}