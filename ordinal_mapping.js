// ordinal_mapping.js

const memo = new Map();

// Ordinal Representation Conventions:
// - Finite ordinal n: JavaScript number n (e.g., 0, 1, 2, ...)
// - ω^k: { type: 'pow', k: k_rep } where k_rep is an ordinal representation for k.
// - ω^β * c + δ: { type: 'sum', beta: beta_rep, c: c_int, delta: delta_rep }
//   - beta_rep: ordinal representation for β.
//   - c_int: JavaScript number for c (c >= 1).
//   - delta_rep: ordinal representation for δ (use ORDINAL_ZERO if no remainder).
//   - It is assumed that δ < ω^β.

const ORDINAL_ZERO = 0;
const ORDINAL_ONE = 1;

function isFiniteOrdinal(ordinalRep) {
    return typeof ordinalRep === 'number';
}

function fFinite(nInt) {
    if (typeof nInt !== 'number' || nInt < 0) {
        throw new Error(`fFinite called with non-number or negative: ${nInt}`);
    }
    if (nInt === ORDINAL_ZERO) {
        return 0.0;
    }
    return nInt / (nInt + 1.0);
}

function addOneToOrdinal(betaOrdRep) {
    if (isFiniteOrdinal(betaOrdRep)) {
        return betaOrdRep + 1;
    }

    const { type, ...args } = betaOrdRep;
    if (type === 'pow') {
        const kExpRep = args.k;
        if (kExpRep === ORDINAL_ZERO) { // beta = ω^0 = 1. So beta+1 = 2.
            return 2;
        }
        // General case: ω^k_exp + 1 is represented as ω^k_exp * 1 + 1
        return { type: 'sum', beta: kExpRep, c: 1, delta: ORDINAL_ONE };
    } else if (type === 'sum') {
        const { beta: bExpRep, c: cCoeffInt, delta: dRemRep } = args;
        return { type: 'sum', beta: bExpRep, c: cCoeffInt, delta: addOneToOrdinal(dRemRep) };
    } else {
        throw new TypeError(`Unknown ordinal object type for addOneToOrdinal: ${type} in ${JSON.stringify(betaOrdRep)}`);
    }
}

function f(alphaRep) {
    if (typeof alphaRep !== 'number' && (typeof alphaRep !== 'object' || alphaRep === null || !alphaRep.type)) {
        throw new TypeError(`Invalid ordinal representation type: ${typeof alphaRep} for ${JSON.stringify(alphaRep)}`);
    }

    // For Map, object identity matters for keys unless we serialize.
    // Let's assume distinct object representations for distinct ordinals if they are not primitive.
    // For complex structures, a robust serialization to string for memo_key might be better,
    // but for now, we'll rely on Map handling object references.
    // If canonical object representations are always used, this is fine.
    if (memo.has(alphaRep)) {
        return memo.get(alphaRep);
    }

    let result = 0.0;

    if (isFiniteOrdinal(alphaRep)) { // Rule 1: α is finite n
        result = fFinite(alphaRep);
    } else {
        const { type, ...args } = alphaRep;

        if (type === 'pow') { // α = ω^k_rep
            const kRep = args.k;
            if (isFiniteOrdinal(kRep)) { // Rule 2a: k_rep is a finite ordinal j >= 0
                const jInt = kRep;
                if (jInt === ORDINAL_ZERO) { // k_rep is 0. α = ω^0 = 1.
                    result = f(ORDINAL_ONE);
                } else { // k_rep is finite j >= 1. f(ω^j) = 1 + 2f(j-1) = (3j-2)/j.
                    result = (3.0 * jInt - 2.0) / jInt;
                }
            } else { // Rule 2b: k_rep >= ω (k_rep is an object representation)
                const fKRep = f(kRep);
                const denominator = 9.0 - fKRep;
                if (Math.abs(denominator) < 1e-9) {
                    throw new Error(`Division by near-zero in f(ω^k): f(k)=${fKRep} for k=${JSON.stringify(kRep)}`);
                }
                result = (25.0 - fKRep) / denominator;
            }
        } else if (type === 'sum') { // Rule 3: α = ω^beta_rep * c_int + delta_rep
            const { beta: betaRep, c: cInt, delta: deltaRep } = args;

            if (typeof cInt !== 'number' || cInt < 1 || !Number.isInteger(cInt)) {
                throw new Error(`Coefficient cInt must be an integer >= 1: ${cInt}`);
            }

            const termOmegaBeta = { type: 'pow', k: betaRep };
            const betaPlus1Rep = addOneToOrdinal(betaRep);
            const termOmegaBetaPlus1 = { type: 'pow', k: betaPlus1Rep };

            const fOmegaBeta = f(termOmegaBeta);
            const fOmegaBetaPlus1 = f(termOmegaBetaPlus1);

            if (cInt - 1 < 0) {
                throw new Error(`cInt-1 is negative for cInt=${cInt}`);
            }
            const fCMinus1 = fFinite(cInt - 1);

            const fOmegaBetaTimesC = fOmegaBeta +
                (fOmegaBetaPlus1 - fOmegaBeta) * fCMinus1;

            if (deltaRep === ORDINAL_ZERO) { // α = ω^beta_rep * c_int
                result = fOmegaBetaTimesC;
            } else { // α = ω^beta_rep * c_int + delta_rep, where delta_rep > 0
                const fCInt = fFinite(cInt); // This is for f((c+1)-1)
                const fOmegaBetaTimesCPlus1Coeff = fOmegaBeta +
                    (fOmegaBetaPlus1 - fOmegaBeta) * fCInt;

                const fDeltaRep = f(deltaRep);

                if (Math.abs(fOmegaBeta) < 1e-9) {
                    throw new Error(`f(ω^beta_rep) is near-zero (${fOmegaBeta}) for beta_rep=${JSON.stringify(betaRep)}, in denominator.`);
                }

                result = fOmegaBetaTimesC +
                    (fOmegaBetaTimesCPlus1Coeff - fOmegaBetaTimesC) *
                    fDeltaRep / fOmegaBeta;
            }
        } else {
            throw new TypeError(`Unknown ordinal object type in f: ${type}`);
        }
    }

    memo.set(alphaRep, result);
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
    console.log(`f(2) = ${f(2)}`); // Expected: 2/3 = 0.666...

    console.log(`f(ω^0) = ${f({ type: 'pow', k: ORDINAL_ZERO })}`); // Expected: 0.5 (f(1))

    const omegaRep = { type: 'pow', k: ORDINAL_ONE };
    console.log(`f(ω) = ${f(omegaRep)}`); // Expected: 1.0

    const omegaSqRep = { type: 'pow', k: 2 };
    console.log(`f(ω^2) = ${f(omegaSqRep)}`); // Expected: 2.0

    const omegaCbRep = { type: 'pow', k: 3 };
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

    const omegaSqTimes2Rep = { type: 'sum', beta: 2, c: 2, delta: ORDINAL_ZERO };
    console.log(`f(ω^2*2) = ${f(omegaSqTimes2Rep)}`); // Expected: 13/6 = 2.1666...

    const omegaSqPlusOmegaRep = { type: 'sum', beta: 2, c: 1, delta: omegaRep };
    console.log(`f(ω^2+ω) = ${f(omegaSqPlusOmegaRep)}`); // Expected: 25/12 = 2.08333...

    console.log("Test cases finished.");
}