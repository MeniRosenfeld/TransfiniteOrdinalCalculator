// ordinal_calculator.js

// This file assumes all other Ordinal class files are loaded/defined before it:
// - ordinal_types.js (Ordinal class, OperationTracer)
// - ordinal_comparison.js (Ordinal.prototype.compareTo)
// - ordinal_auxiliary_ops.js (Ordinal.prototype.exponentPredecessor, Ordinal.prototype.divideByOmega)
// - ordinal_addition.js (Ordinal.prototype.add)
// - ordinal_multiplication.js (Ordinal.prototype.multiply)
// - ordinal_exponentiation.js (Ordinal.prototype.power)
// - ordinal_parser.js (OrdinalParser class)

const DEFAULT_OPERATION_BUDGET = 1000000; // Default limit for operations

/**
 * Parses an ordinal expression string, calculates its Cantor Normal Form,
 * and returns its string representation.
 *
 * @param {string} expressionString The string to parse (e.g., "(w+1)*w^2").
 * @param {number} [maxOperations=DEFAULT_OPERATION_BUDGET] The maximum number of
 *        internal operations allowed before halting with an error.
 * @returns {string} The CNF string of the result, or an error message string.
 */
function calculateOrdinalCNF(expressionString, maxOperations = DEFAULT_OPERATION_BUDGET) {
    if (typeof expressionString !== 'string') {
        return { error: "Error: Input expression must be a string." };
    }
    if (typeof maxOperations !== 'number' || maxOperations <= 0) {
        return { error: `Error: maxOperations must be a positive number. Got ${maxOperations}` };
    }

    const tracer = new OperationTracer(maxOperations);

    try {
        const parser = new OrdinalParser(expressionString, tracer);
        const ordinalResult = parser.parse();
        return {
            cnfString: ordinalResult.toStringCNF(),
            ordinalObject: ordinalResult 
        };
    } catch (e) {
        // Catch errors from parser, arithmetic operations, or budget exceeded
        if (e.message.startsWith("Operation budget exceeded")) {
            return { error: `Error: Computation too complex (budget of ${tracer.getBudget()} operations exceeded at ${tracer.getCount()}).` };
        }
        return { error: `Error: ${e.message}` };
    }
}

// Example Usage (can be commented out or moved to a test file)
/*
function testOrdinalCalc(label, input, expected) {
    console.log(`Test: ${label}`);
    console.log(`Input: "${input}"`);
    const output = calculateOrdinalCNF(input, 100000); // Using a smaller budget for tests
    console.log(`Output: "${output}"`);
    if (output === expected) {
        console.log("Status: PASSED");
    } else {
        console.error(`Status: FAILED. Expected: "${expected}"`);
    }
    console.log("---");
}

// Basic Tests
testOrdinalCalc("Zero", "0", "0");
testOrdinalCalc("Simple Finite", "1+2*3", "7");
testOrdinalCalc("Omega", "w", "w");
testOrdinalCalc("Omega Plus Finite", "w+5", "w+5");
testOrdinalCalc("Finite Plus Omega", "5+w", "w");
testOrdinalCalc("Omega Plus Omega", "w+w", "w*2");

// Multiplication Tests
testOrdinalCalc("Omega Times Finite", "w*3", "w*3");
testOrdinalCalc("Finite Times Omega", "3*w", "w");
testOrdinalCalc("Omega Times Omega", "w*w", "w^2"); // Default w^2 string representation
testOrdinalCalc("(w+1)*2", "(w+1)*2", "w*2+1");
testOrdinalCalc("(w+1)*(w+1)", "(w+1)*(w+1)", "w^2+w+1");

// Exponentiation Tests
testOrdinalCalc("Finite to Omega", "2^w", "w");
testOrdinalCalc("Omega to Finite", "w^3", "w^3"); // ((w)^3)
testOrdinalCalc("Omega to Omega", "w^w", "w^(w)");
testOrdinalCalc("(w+1)^2", "(w+1)^2", "w^2+w+1");
testOrdinalCalc("2^(w+1)", "2^(w+1)", "w*2");
testOrdinalCalc("w^(w+1)", "w^(w+1)", "w^(w+1)"); // Already CNF, power rule simplifies
testOrdinalCalc("(w^2)^w", "(w^2)^w", "w^(w)");   // w^(2*w) = w^w
testOrdinalCalc("(w^w)^2", "(w^w)^2", "w^(w)*2"); // w^(w*2)

// Complex and Precedence
testOrdinalCalc("Complex 1", "(w^2+w*3+5)*w + (w+1)", "w^3+w+1");
// (w^2+w*3+5)*w = (w^2)*w = w^3 (approx, accurate needs (w^2)*w + (w*3)*w + 5*w)
// (w^2+w*3+5)*w = (w^2)*w (limit part of left dominates) = w^3
// So: w^3 + (w+1) = w^3+w+1. This seems correct under the rules.

testOrdinalCalc("Deep Exponent", "2^(w^2)", "w^(w)"); // 2^(w*w) = w^w. No, this is 2^(w^2) = w^(w). Hmm, rule k^(w*xi) = w^xi.
                                                      // k^(w^alpha) = w^(w^(alpha-1)) if alpha is successor?
                                                      // More standard: k^(w^A) = w^(w^(A-1)) if A is successor.
                                                      // k^(lambda) = w^(lambda/w). So 2^(w^2) = w^(w^2 / w) = w^w.
                                                      // My previous `2^(w*2)` was `w^2`. `2^(w*N) = w^N`.
                                                      // So `2^(w^2)`: Here `w^2` is `w*w`. So N=w. Result `w^w`.

testOrdinalCalc("Zero Power", " (w+5)^0 ", "1");
testOrdinalCalc("Power of Zero", " 0^(w+1) ", "0");
testOrdinalCalc("Power of One", " 1^w ", "1");

// Test for budget (might need adjustment based on actual op counts)
// testOrdinalCalc("Budget Test", "w^w^w", "Error: Computation too complex (budget of 100000 operations exceeded).");
// The exact error message might vary based on how many ops w^w^w takes.
*/

// Export if in a module system
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = { calculateOrdinalCNF, Ordinal, OperationTracer, OrdinalParser }; // Export core classes too if needed
// }

// ordinal_calculator.js