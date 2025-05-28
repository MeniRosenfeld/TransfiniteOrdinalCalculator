// ordinal_mapping.js

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

function fFinite(nBigInt) {
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
    return n_num / (n_num + 1.0);
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

function f(alphaRep) {
    // Handle E0_TYPE first
    if (alphaRep === "E0_TYPE") {
        // No memoization for E0_TYPE as it's a simple constant return.
        // Or, if memoization is desired:
        // if (memo.has("E0_TYPE")) return memo.get("E0_TYPE");
        // const e0_val = 5.0;
        // memo.set("E0_TYPE", e0_val);
        // return e0_val;
        return 5.0; // f(ε₀) = 5.0
    }

    if (typeof alphaRep !== 'bigint' && (typeof alphaRep !== 'object' || alphaRep === null || !alphaRep.type)) {
        throw new TypeError(`Invalid ordinal representation type: ${typeof alphaRep} for ${JSON.stringify(alphaRep, bigIntReplacer)}`);
    }

    // For Map, object identity matters for keys unless we serialize.
    // A robust serialization to string for memo_key might be better for complex structures,
    // especially if BigInts are involved in keys. For now, primitives (BigInt) are fine.
    // Objects are by reference.
    const memoKey = typeof alphaRep === 'object' ? JSON.stringify(alphaRep, bigIntReplacer) : alphaRep;
    if (memo.has(memoKey)) {
        return memo.get(memoKey);
    }

    let result = 0.0;

    if (isFiniteOrdinal(alphaRep)) { // Rule 1: α is finite n (BigInt)
        result = fFinite(alphaRep);
    } else {
        const { type, ...args } = alphaRep;

        if (type === 'w_tower') { // New Rule: α is ω↑↑n
            const height = args.height;
            if (typeof height !== 'number' || height < 1 || !Number.isInteger(height)){
                throw new Error(`Invalid height for w_tower in f(): ${height}`);
            }
            if (height === 1) { // ω↑↑1 = ω
                result = f({ type: 'pow', k: ORDINAL_ONE }); // f(ω)
            } else {
                result = 5.0 - (4.0 / height);
            }
        } else if (type === 'pow') { // α = ω^k_rep
            const kRep = args.k;
            if (isFiniteOrdinal(kRep)) { // Rule 2a: k_rep is a finite ordinal j (BigInt) >= 0n
                const jBigInt = kRep;
                if (jBigInt === ORDINAL_ZERO) { // k_rep is 0n. α = ω^0 = 1n.
                    result = f(ORDINAL_ONE); // f(1n)
                } else { // k_rep is finite j (BigInt) >= 1n. f(ω^j) = 1 + 2f(j-1) = (3j-2)/j.
                    const j_num = Number(jBigInt); // Convert BigInt to Number for formula
                    result = (3.0 * j_num - 2.0) / j_num;
                }
            } else { // Rule 2b: k_rep >= ω (k_rep is an object representation)
                const fKRep = f(kRep);
                const denominator = 9.0 - fKRep;
                if (Math.abs(denominator) < 1e-9) {
                    throw new Error(`Division by near-zero in f(ω^k): f(k)=${fKRep} for k=${JSON.stringify(kRep, bigIntReplacer)}`);
                }
                result = (25.0 - fKRep) / denominator;
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

            const fOmegaBeta = f(termOmegaBeta);
            const fOmegaBetaPlus1 = f(termOmegaBetaPlus1);

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

                f_c_minus_1_val = fFinite(cMinus1BigInt);
                f_c_val = fFinite(cBigInt);
            }
            
            const fOmegaBetaTimesC = fOmegaBeta +
                (fOmegaBetaPlus1 - fOmegaBeta) * f_c_minus_1_val;

            if (deltaRep === ORDINAL_ZERO) { // delta is 0n
                result = fOmegaBetaTimesC;
            } else { 
                const fOmegaBetaTimesCPlus1Coeff = fOmegaBeta +
                    (fOmegaBetaPlus1 - fOmegaBeta) * f_c_val;

                const fDeltaRep = f(deltaRep);

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

    console.log(`f(0) = ${f(ORDINAL_ZERO)}`); // Expected: 0.0
    console.log(`f(1) = ${f(ORDINAL_ONE)}`); // Expected: 0.5
    console.log(`f(2) = ${f(2n)}`); // Expected: 2/3 = 0.666...

    console.log(`f(ε₀) = ${f("E0_TYPE")}`); // Expected: 5.0

    console.log(`f(ω^0) = ${f({ type: 'pow', k: ORDINAL_ZERO })}`); // Expected: 0.5 (f(1))

    const omegaRep = { type: 'pow', k: ORDINAL_ONE };
    console.log(`f(ω) = ${f(omegaRep)}`); // Expected: 1.0

    const omegaSqRep = { type: 'pow', k: 2n };
    console.log(`f(ω^2) = ${f(omegaSqRep)}`); // Expected: 2.0

    const omegaCbRep = { type: 'pow', k: 3n };
    console.log(`f(ω^3) = ${f(omegaCbRep)}`); // Expected: (3*3-2)/3 = 7/3 = 2.333...

    const omegaOmegaRep = { type: 'pow', k: omegaRep };
    console.log(`f(ω^ω) = ${f(omegaOmegaRep)}`); // Expected: 3.0

    const omegaOmegaOmegaRep = { type: 'pow', k: omegaOmegaRep };
    console.log(`f(ω^ω^ω) = ${f(omegaOmegaOmegaRep)}`); // Expected: 11/3 = 3.666...

    const omegaTimes2Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω*2) = ${f(omegaTimes2Rep)}`); // Expected: 1.5

    const omegaTimes3Rep = { type: 'sum', beta: ORDINAL_ONE, c: 3, delta: ORDINAL_ZERO };
    console.log(`f(ω*3) = ${f(omegaTimes3Rep)}`); // Expected: 5/3 = 1.666...

    const omegaTimes2Plus1Rep = { type: 'sum', beta: ORDINAL_ONE, c: 2, delta: ORDINAL_ONE };
    console.log(`f(ω*2+1) = ${f(omegaTimes2Plus1Rep)}`); // Expected: 19/12 = 1.58333...

    const omegaSqTimes2Rep = { type: 'sum', beta: 2n, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω^2*2) = ${f(omegaSqTimes2Rep)}`); // Expected: 13/6 = 2.1666...

    const omegaSqPlusOmegaRep = { type: 'sum', beta: 2n, c: 1, delta: omegaRep };
    console.log(`f(ω^2+ω) = ${f(omegaSqPlusOmegaRep)}`); // Expected: 25/12 = 2.08333...

    console.log("Test cases finished.");
}