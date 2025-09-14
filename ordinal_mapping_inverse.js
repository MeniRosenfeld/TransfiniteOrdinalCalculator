// ordinal_mapping_inverse.js

// Remove ES6 import since we're using script tags
// import { f, fFinite, addOneToOrdinal, ORDINAL_ZERO, ORDINAL_ONE } from './ordinal_mapping.js';

function findFiniteOrdinal(ctx, x, threshold, scale) {
    if (ctx.compare(x, threshold) < 0) { // x is approximately 0
        return 0n; // Return BigInt zero
    }

    const one = ctx.ONE;
    const oneMinusX = ctx.subtract(one, x);

    // Check if x is very close to 1
    if (ctx.compare(x, ctx.fromInt(1.0 - 1e-15)) >= 0) {
        if (ctx.compare(oneMinusX, ctx.ZERO) <= 0) {
            console.warn(`findFiniteOrdinal called with x=${ctx.toNumber(x)} >= 1. Returning a very large BigInt.`);
            return BigInt(Number.MAX_SAFE_INTEGER);
        }
        let n_float = ctx.divide(x, oneMinusX);
        if (ctx.isNaN(n_float)) n_float = ctx.ZERO;
        return BigInt(Math.floor(ctx.toNumber(n_float)));
    }

    let n_calculated = ctx.divide(ctx.multiply(scale, x), oneMinusX);
    if (ctx.isNaN(n_calculated)) n_calculated = ctx.ZERO;

    const n_floor = BigInt(Math.floor(ctx.toNumber(n_calculated)));

    const n_plus_1 = n_floor + 1n;
    const f_n_plus_1 = fFinite(ctx, ctx.fromInt(n_plus_1), scale);

    if (ctx.compare(f_n_plus_1, ctx.add(x, threshold)) < 0) {
        return n_plus_1;
    } else {
        return n_floor;
    }
}

function findCoefficientHigher(x, k, params, threshold) {
    const ctx = params.ctx;
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k) }, params);

    const fOmegaKPlus1_minus_fOmegaK = ctx.subtract(fOmegaKPlus1, fOmegaK);

    if (ctx.compare(x, ctx.add(fOmegaK, threshold)) < 0 || ctx.compare(x, ctx.subtract(fOmegaKPlus1, threshold)) > 0) {
        return 1n;
    }

    let target_f_m_minus_1 = ctx.divide(ctx.subtract(x, fOmegaK), fOmegaKPlus1_minus_fOmegaK);

    let m_minus_1_approx = ctx.divide(
        ctx.multiply(params.scaleMult, target_f_m_minus_1),
        ctx.subtract(ctx.ONE, target_f_m_minus_1)
    );
    if (ctx.isNaN(m_minus_1_approx)) m_minus_1_approx = ctx.ZERO;

    const m = BigInt(Math.floor(ctx.toNumber(m_minus_1_approx))) + 1n;

    // Rounding check
    const m_plus_1 = m + 1n;
    const f_m = fFinite(ctx, ctx.fromInt(m), params.scaleMult);
    const f_omega_k_times_m_plus_1 = ctx.add(fOmegaK, ctx.multiply(fOmegaKPlus1_minus_fOmegaK, f_m));

    if (ctx.compare(f_omega_k_times_m_plus_1, ctx.add(x, threshold)) < 0) {
        return m_plus_1;
    } else {
        return m;
    }
}

function findRemainderHigher(x, k, m, params, threshold) {
    const ctx = params.ctx;
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k) }, params);
    const fOmegaKM = ctx.add(fOmegaK, ctx.multiply(ctx.subtract(fOmegaKPlus1, fOmegaK), fFinite(ctx, ctx.fromInt(BigInt(Math.max(0, m - 1))), params.scaleMult)));
    const fOmegaKMPlus1 = ctx.add(fOmegaK, ctx.multiply(ctx.subtract(fOmegaKPlus1, fOmegaK), fFinite(ctx, ctx.fromInt(BigInt(m)), params.scaleMult)));


    if (ctx.compare(x, ctx.add(fOmegaKM, threshold)) <= 0 || ctx.compare(x, ctx.subtract(fOmegaKMPlus1, threshold)) >= 0) {
        return 0n;
    }

    const denominator = ctx.subtract(fOmegaKMPlus1, fOmegaKM);

    let fr = ctx.divide(ctx.multiply(ctx.subtract(x, fOmegaKM), fOmegaK), denominator);
    if (ctx.isNaN(fr) || ctx.compare(fr, fOmegaK) >= 0) fr = ctx.ZERO;
    fr = ctx.max(fr, ctx.ZERO);

    if (ctx.compare(fr, threshold) < 0) {
        return 0n;
    } else {
        rAmplification = ctx.divide(fOmegaK, denominator);

        const result = fInverse(fr, params, ctx.multiply(threshold, rAmplification));
        if (result === "E0_TYPE") {
            console.warn(`findRemainderHigher: fInverse returned E0_TYPE for fr=${fr}. This shouldn't be allowed. Returning 0n.`);
            console.warn(`x=${ctx.toNumber(x)}. m=${m}. k=${convertFFormatToOrdinalInstance(k).toString()}.`);
            return 0n;
        } else {
            return result;
        }
    }
}

/// finds finite J such that x ~ w^j
function findJ(x, params, threshold) {
    const ctx = params.ctx;

    // Proximity check for critical points
    if (ctx.compare(ctx.abs(ctx.subtract(x, ctx.ONE)), threshold) < 0) return 1n;

    let j_approx = ctx.divide(ctx.multiply(params.scaleExp, ctx.subtract(x, ctx.ONE)), ctx.subtract(params.precomputed[3], x));
    if (ctx.isNaN(j_approx) || ctx.compare(j_approx, ctx.ZERO) < 0) j_approx = ctx.ZERO;

    const calcJ = ctx.floor(j_approx) + 1n;

    const f_j_plus_1_check = ctx.add(ctx.ONE, ctx.divide(
        ctx.multiply(params.precomputed[1], ctx.fromInt(calcJ)),
        ctx.add(params.scaleExp, ctx.fromInt(calcJ))
    ));

    if (ctx.compare(f_j_plus_1_check, ctx.add(x, threshold)) < 0) {
        return calcJ + 1n;
    } else {
        return calcJ;
    }
}

function getValueFOmegaJM(j_base, m_coeff, params) {
    const ctx = params.ctx;
    if (m_coeff === 0) return ctx.ZERO;
    const j_base_num = ctx.fromInt(j_base);
    const j_base_minus_1_num = ctx.fromInt(j_base - 1n);

    const fOmegaJBase = ctx.add(ctx.ONE, ctx.divide(ctx.multiply(params.precomputed[1], j_base_minus_1_num), ctx.add(params.scaleExp, j_base_minus_1_num)));
    const fOmegaJBasePlus1 = ctx.add(ctx.ONE, ctx.divide(ctx.multiply(params.precomputed[1], j_base_num), ctx.add(params.scaleExp, j_base_num)));

    const f_m_minus_1 = fFinite(ctx, ctx.fromInt(BigInt(Math.max(0, m_coeff - 1))), params.scaleMult);
    return ctx.add(fOmegaJBase, ctx.multiply(ctx.subtract(fOmegaJBasePlus1, fOmegaJBase), f_m_minus_1));
}

function findM(x, j_base, params, threshold) {
    const ctx = params.ctx;
    const j_base_num = ctx.fromInt(j_base);
    const j_base_minus_1_num = ctx.fromInt(j_base - 1n);

    const A = ctx.add(ctx.ONE, ctx.divide(ctx.multiply(params.precomputed[1], j_base_minus_1_num), ctx.add(params.scaleExp, j_base_minus_1_num)));
    const B = ctx.add(ctx.ONE, ctx.divide(ctx.multiply(params.precomputed[1], j_base_num), ctx.add(params.scaleExp, j_base_num)));

    if (ctx.compare(ctx.subtract(x, A), threshold) < 0 || ctx.compare(x, ctx.subtract(B, threshold)) >= 0) {
        return 1n;
    }

    let target_f_m_minus_1 = ctx.divide(ctx.subtract(x, A), ctx.subtract(B, A));
    if (ctx.isNaN(target_f_m_minus_1)) target_f_m_minus_1 = ctx.ZERO;
    target_f_m_minus_1 = ctx.max(ctx.ZERO, ctx.min(target_f_m_minus_1, ctx.ONE));

    let m_approx = ctx.divide(ctx.multiply(params.scaleMult, target_f_m_minus_1), ctx.subtract(ctx.ONE, target_f_m_minus_1));
    if (ctx.isNaN(m_approx) || ctx.compare(m_approx, ctx.ZERO) < 0) m_approx = ctx.ZERO;
    const calcM = ctx.floor(m_approx) + 1n;

    const f_m_check = fFinite(ctx, ctx.fromInt(calcM), params.scaleMult);

    if (ctx.compare(f_m_check, ctx.add(target_f_m_minus_1, threshold)) < 0) {
        return calcM + 1n;
    } else {
        return calcM;
    }
}

function findOmegaPowerOrdinal(x, params, threshold, depth) {
    const ctx = params.ctx;
    const j = findJ(x, params, threshold);
    if (j === 0n) {
        return findFiniteOrdinal(ctx, x, threshold, params.scaleAdd);
    }

    const m = findM(x, j, params, threshold);

    const fOmegaJ_val = ctx.add(ctx.ONE, ctx.divide(ctx.multiply(params.precomputed[1], ctx.fromInt(j - 1n)), ctx.add(params.scaleExp, ctx.fromInt(j - 1n))));
    const fOmegaJM_val = getValueFOmegaJM(j, Number(m), params);
    const fOmegaJMPlus1_val = getValueFOmegaJM(j, Number(m) + 1, params);

    let fk;
    const x_minus_fOmegaJM = ctx.subtract(x, fOmegaJM_val);

    let ratio = ctx.divide(x_minus_fOmegaJM, ctx.subtract(fOmegaJMPlus1_val, fOmegaJM_val));
    if (ctx.isNaN(ratio) || ctx.compare(x, ctx.add(fOmegaJM_val, threshold)) < 0 || ctx.compare(x, ctx.subtract(fOmegaJMPlus1_val, threshold)) > 0) ratio = ctx.ZERO;
    fk = ctx.multiply(ratio, fOmegaJ_val);


    //if (fk_num > ctx.toNumber(params.precomputed[5])) fk = params.precomputed[5];

    let k_rem_ordinal_representation;
    //if (ctx.compare(fk, threshold) < 0) {
    //    k_rem_ordinal_representation = 0n;
    //} else {
    const denom = ctx.subtract(fOmegaJMPlus1_val, fOmegaJM_val);
    if (ctx.isZero(denom)) {
        k_rem_ordinal_representation = 0n;
    } else {
        const kAmplificationFactor = ctx.divide(fOmegaJ_val, denom);
        k_rem_ordinal_representation = fInverse(fk, params, ctx.multiply(threshold, kAmplificationFactor), depth + 1);
    }
    //}

    if (m === 1n && k_rem_ordinal_representation === 0n) {
        return { type: 'pow', k: j };
    } else {
        return {
            type: 'sum',
            beta: j,
            c: Number(m),
            delta: k_rem_ordinal_representation
        };
    }
}

function findHigherPowerOrdinal(x, params, threshold, depth) {
    const ctx = params.ctx;
    const fk = ctx.divide(ctx.subtract(ctx.multiply(params.precomputed[8], x), params.precomputed[6]), ctx.add(x, params.precomputed[7]));
    const kAmplification = ctx.divide(ctx.square(ctx.subtract(params.precomputed[8], fk)), params.precomputed[9]);
    const k = fInverse(fk, params, ctx.multiply(threshold, kAmplification), depth + 1);

    if (k === "E0_TYPE" || k.type == 'epsilon') {
        return k;
    }

    const m = findCoefficientHigher(x, k, params, threshold);
    const r = findRemainderHigher(x, k, Number(m), params, threshold);

    if (r instanceof Error) {
        console.warn(`findHigherPowerOrdinal: Remainder calculation failed for x=${ctx.toNumber(x)}, k=${typeof k === 'object' ? generateOrdinalMemoKey(k) : k}, m=${m}. Error: ${r.message}`);
        return {
            type: 'sum',
            beta: k,
            c: Number(m),
            delta: 0n // Fallback delta
        };
    }

    return {
        type: 'sum',
        beta: k,
        c: Number(m),
        delta: r
    };
}

function fInverse(x, params = DEFAULT_F_PARAMS, threshold = 1e-14, depth = 0) {
    const ctx = params.ctx;

    if (ctx.compare(x, ctx.fromInt(-ctx.toNumber(threshold))) < 0 || ctx.compare(x, ctx.add(params.precomputed[5], threshold)) > 0) {
        const upperBound = ctx.toNumber(params.precomputed[5]);
        throw new Error(`Input value ${ctx.toNumber(x)} is outside the valid range [0,${upperBound}]`);
    }

    // Handle specific values and ranges
    if (ctx.compare(ctx.abs(x), threshold) < 0) return 0n;

    // Check for specific points using the high-precision threshold first
    if (ctx.compare(ctx.abs(ctx.subtract(x, params.precomputed[5])), threshold) < 0) return { type: 'epsilon', index: 0n }; // Epsilon_0
    if (ctx.compare(ctx.abs(ctx.subtract(x, ctx.ONE)), threshold) < 0) return { type: 'pow', k: 1n };  // f(ω) = 1
    if (ctx.compare(ctx.abs(ctx.subtract(x, params.precomputed[3])), threshold) < 0) return { type: 'pow', k: { type: 'pow', k: 1n } }; // f(ω^ω) = 3


    // Now check for ranges
    if (ctx.compare(x, params.precomputed[10]) > 0 && ctx.compare(x, params.precomputed[5]) < 0) { // WTower range
        const denominator = ctx.subtract(params.precomputed[5], x);
        let height_approx = ctx.divide(ctx.add(params.precomputed[4], ctx.multiply(ctx.subtract(params.scaleTet, ctx.ONE), ctx.subtract(x, ctx.ONE))), denominator);
        if (ctx.isNaN(height_approx)) height_approx = ctx.ZERO;
        const height = Number(ctx.floor(height_approx));

        if (height >= 1) {
            const next_x = ctx.add(x, threshold);
            const next_denom = ctx.subtract(params.precomputed[5], next_x);
            let nextHeight_approx = ctx.divide(ctx.add(params.precomputed[4], ctx.multiply(ctx.subtract(params.scaleTet, ctx.ONE), ctx.subtract(next_x, ctx.ONE))), next_denom);
            if (ctx.isNaN(nextHeight_approx)) nextHeight_approx = ctx.ZERO;
            const nextHeight_num = ctx.toNumber(nextHeight_approx);

            if (nextHeight_num > height + 1) {
                return { type: 'w_tower', height: (height + 1) };
            } else {
                return { type: 'w_tower', height: height };
            }
        } else {
            console.warn(`fInverse: Calculated w_tower height is < 1 (height=${height}, x=${ctx.toNumber(x)}). Fallback might be needed or check x range.`);
            return "E0_TYPE";
        }
    }


    if (ctx.compare(x, ctx.ONE) < 0) {
        return findFiniteOrdinal(ctx, x, threshold, params.scaleAdd);
    } else if (ctx.compare(x, params.precomputed[3]) < 0) { // Covers (1, 3) - f(ω) to f(ω^ω)
        return findOmegaPowerOrdinal(x, params, threshold, depth);
    } else { // Covers [3, 5) - f(ω^ω) up to (but not including) f(ε₀)
        return findHigherPowerOrdinal(x, params, threshold, depth);
    }
}

// Helper function to convert f() format to ordinal instance
function convertFFormatToOrdinalInstance(ord_representation, tracer) {
    // Handles:
    // - BigInt n (finite)
    // - "E0_TYPE"
    // - { type: 'pow', k: k_rep }  (for ω^k_rep)
    // - { type: 'sum', beta: exponent_beta_rep, c: c_num, delta: delta_rep } (for ω^exponent_beta_rep * c_num + delta_rep)
    // - { type: 'w_tower', height: n } (NEW)
    // - { type: 'epsilon', index: k_rep } (NEW)

    // Ensure tracer is provided, create a default if not (though script.js should provide one)
    const effectiveTracer = tracer || new OperationTracer(100000); // Default budget if no tracer given

    if (typeof ord_representation === 'bigint') {
        return new CNFOrdinal(ord_representation, effectiveTracer); // Pass tracer
    }

    if (ord_representation === "E0_TYPE") { // Legacy fallback
        return new EpsilonZero(effectiveTracer);
    }

    if (typeof ord_representation === 'object' && ord_representation !== null) {
        if (ord_representation.type === 'epsilon') {
            // New architecture currently only supports ε₀ as a dedicated type
            const index_rep = ord_representation.index;
            if (typeof index_rep === 'bigint' && index_rep === 0n) {
                return new EpsilonZero(effectiveTracer);
            }
            // If index is represented as an object equal to 0, accept too
            if (typeof index_rep === 'object' && index_rep !== null) {
                const idxConv = convertFFormatToOrdinalInstance(index_rep, effectiveTracer);
                if (idxConv instanceof CNFOrdinal && idxConv.isFinite() && idxConv.getFiniteBigInt() === 0n) {
                    return new EpsilonZero(effectiveTracer);
                }
            }
            throw new Error("Only epsilon-zero (e_0) is supported by the current architecture");
        }

        if (ord_representation.type === 'w_tower') { // NEW case for w_tower
            if (typeof ord_representation.height !== 'number' || ord_representation.height < 1 || !Number.isInteger(ord_representation.height)) {
                console.error("Invalid height for w_tower in convertFFormatToOrdinalInstance:", ord_representation.height);
                return new CNFOrdinal(0n, effectiveTracer); // Fallback to 0
            }
            return new WTowerOrdinal(ord_representation.height, effectiveTracer);
        }

        if (ord_representation.type === 'pow') {
            const exponent_k_object = convertFFormatToOrdinalInstance(ord_representation.k, effectiveTracer); // Pass tracer

            if (exponent_k_object instanceof CNFOrdinal && exponent_k_object.isZero()) {
                return new CNFOrdinal(1n, effectiveTracer);
            }
            return new CNFOrdinal([{
                exponent: exponent_k_object,
                coefficient: 1n
            }], effectiveTracer); // Pass tracer
        }

        if (ord_representation.type === 'sum') {
            const exponent_beta_representation = ord_representation.beta;
            const coefficient_c_js_number = ord_representation.c;
            const delta_representation = ord_representation.delta;

            if (typeof coefficient_c_js_number !== 'number' || !Number.isFinite(coefficient_c_js_number) || coefficient_c_js_number < 0) {
                console.error("convertFFormatToOrdinalInstance 'sum': coefficient c is invalid:", coefficient_c_js_number);
                return convertFFormatToOrdinalInstance(delta_representation, effectiveTracer); // Pass tracer
            }
            if (coefficient_c_js_number === 0) {
                return convertFFormatToOrdinalInstance(delta_representation, effectiveTracer); // Pass tracer
            }
            const coefficient_c_bigint = BigInt(Math.max(1, Math.floor(coefficient_c_js_number)));

            const exponent_beta_object = convertFFormatToOrdinalInstance(exponent_beta_representation, effectiveTracer); // Pass tracer
            const delta_object = convertFFormatToOrdinalInstance(delta_representation, effectiveTracer); // Pass tracer

            let main_term_ordinal_object;
            let is_exponent_beta_zero = false;
            if (exponent_beta_object instanceof CNFOrdinal && exponent_beta_object.isZero()) {
                is_exponent_beta_zero = true;
            }

            if (is_exponent_beta_zero) {
                main_term_ordinal_object = new CNFOrdinal(coefficient_c_bigint, effectiveTracer); // Pass tracer
            } else {
                main_term_ordinal_object = new CNFOrdinal([{
                    exponent: exponent_beta_object,
                    coefficient: coefficient_c_bigint
                }], effectiveTracer); // Pass tracer
            }
            return main_term_ordinal_object.add(delta_object); // add should also handle tracers internally
        }
    }
    console.error("Unknown ordinal format in convertFFormatToOrdinalInstance:", ord_representation);
    // Ensure a tracer is passed if an error leads to CNFOrdinal(0n) or similar fallback
    return new CNFOrdinal(0n, effectiveTracer); // Modified fallback to include tracer
}

function DisplayfInverse(x, params = DEFAULT_F_PARAMS, threshold = 1e-14, depth = 0) {
    const result = fInverse(x, params, threshold, depth);
    const ordinal = convertFFormatToOrdinalInstance(result);
    const CNFString = ordinal.toString();
    return CNFString;
}

// Test cases
function runTests() {
    console.log("Running test cases for ordinal_mapping_inverse.fInverse (JavaScript)...");

    let testCount = 0;
    let completedTests = 0;

    function runTest(input, description) {
        testCount++;
        try {
            const result = fInverse(input);
            // Convert f() format to ordinal instance for display
            let displayResult = result;
            if (typeof result === 'object' && result !== null && result.type) {
                displayResult = convertFFormatToOrdinalInstance(result);
            } else if (result === "E0_TYPE") {
                displayResult = EpsilonOrdinal.E_ZEROStatic().clone();
            } else if (typeof result === 'bigint') {
                displayResult = new CNFOrdinal(result);
            }
            console.log(`fInverse(${description})`, displayResult);
            completedTests++;
        } catch (e) {
            console.log(`fInverse(${description})`, `Error: ${e.message}`);
            completedTests++;
        }
    }

    // Test finite ordinals
    runTest(0, "0");
    runTest(0.5, "0.5");
    runTest(2 / 3, "0.666...");

    // Test ω and its multiples
    runTest(1, "1");
    runTest(1.5, "1.5");
    runTest(5 / 3, "1.666...");

    // Test ω^2 and its multiples
    runTest(2, "2");
    runTest(13 / 6, "2.166...");

    // Test ω^ω
    runTest(3, "3");

    // Test higher powers
    runTest(11 / 3, "3.666...");

    // Test ε₀
    runTest(5, "5");

    // Test threshold behavior
    runTest(0.99999999999999, "0.99999999999999");
    runTest(1.00000000000001, "1.00000000000001");

    // Test error cases
    try {
        fInverse(-0.1);
        console.log("Error test: fInverse(-0.1)", "Should have thrown for negative input");
        testCount++;
        completedTests++;
    } catch (e) {
        console.log("Error test: fInverse(-0.1)", "Correctly caught negative input error");
        testCount++;
        completedTests++;
    }

    try {
        fInverse(5.1);
        console.log("Error test: fInverse(5.1)", "Should have thrown for input > 5");
        testCount++;
        completedTests++;
    } catch (e) {
        console.log("Error test: fInverse(5.1)", "Correctly caught input > 5 error");
        testCount++;
        completedTests++;
    }

    // Add a summary
    console.log("Test Summary", `Completed ${completedTests} of ${testCount} tests`);
    console.log("Test cases finished.");
}

// Run tests if this file is being run directly
if (typeof window === 'undefined' && typeof require !== 'undefined' && require.main === module) {
    // Node.js environment
    runTests();
} else if (typeof window !== 'undefined' && window.location.pathname.endsWith('ordinal_mapping_inverse.js')) {
    // Browser environment, only if this file is loaded directly
    runTests();
}

// Remove ES6 export and replace with global variable
// export { fInverse, runTests };
window.fInverse = fInverse;
window.runTests = runTests;
window.convertFFormatToOrdinalInstance = convertFFormatToOrdinalInstance; // Expose globally 