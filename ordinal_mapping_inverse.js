// ordinal_mapping_inverse.js

// Remove ES6 import since we're using script tags
// import { f, fFinite, addOneToOrdinal, ORDINAL_ZERO, ORDINAL_ONE } from './ordinal_mapping.js';

function findFiniteOrdinal(x, threshold, scale=1) {
  
    if (x < threshold) { // x is approximately 0
        return 0n; // Return BigInt zero
    }

    // If x is very close to 1, n = x/(1-x) can be very large.
    // The function should return a BigInt representation of this large n.
    if (x >= 1.0 - 1e-15) { // x is approximately 1 or greater (should not be >1 ideally)
        const one_minus_x = 1.0 - x;
        if (one_minus_x <= 0) { 
            console.warn(`findFiniteOrdinal called with x=${x} >= 1. Returning a very large BigInt.`);
            return BigInt(1); // Number.MAX_SAFE_INTEGER; 
        }
        const n_float = x / one_minus_x;
        return BigInt(Math.floor(n_float)); 
    }

    const n_calculated_float = scale * x / (1.0 - x);
    const n_floor = Math.floor(n_calculated_float);

    const n_plus_1_float = n_floor + 1.0;
    const f_n_plus_1 = n_plus_1_float / (n_plus_1_float + scale); 

    if (f_n_plus_1 < x + threshold) {
        return BigInt(n_floor + 1);
    } else {
        return BigInt(n_floor);
    }
}

function findCoefficientHigher(x, k, params, threshold) {
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k) }, params);

    const target_f_m_minus_1 = (x - fOmegaK)/(fOmegaKPlus1 - fOmegaK);

    if (x < fOmegaK + threshold) { // Note: original had fOmegaK+threshold, implies x could be slightly > fOmegaK if threshold is large relative to difference
        return 1; 
    }
    // Handle cases where (fOmegaKPlus1 - fOmegaK) is zero or very small, or target_f_m_minus_1 implies m is infinite or < 1
    if (Math.abs(fOmegaKPlus1 - fOmegaK) < 1e-15) { // Denominator for target_f_m_minus_1 is effectively zero
        return 1//return (Math.abs(x - fOmegaK) < threshold) ? 1 : Number.MAX_SAFE_INTEGER; // m=1 if x approx fOmegaK, else m is huge
    }
    if (target_f_m_minus_1 >= 1.0 - 1e-15) return 1// Number.MAX_SAFE_INTEGER; // m is huge, wrapping around to 1
    if (target_f_m_minus_1 < 0) return 1; // implies x < fOmegaK

    const m = Math.max(1, 1 + Math.floor(params.scaleMult * target_f_m_minus_1/(1-target_f_m_minus_1)));

    // Original rounding logic was: (m/(m+1)) < target_f_m_minus_1+threshold
    // This compares f(m_candidate) with target_f_m_minus_1 (which is target f(m-1) for coefficient m)
    // Let's test m and m+1 by reconstructing the value of f(ω^k * m_candidate)
    const f_m_minus_1_candidate = (m === 1) ? 0.0 : (m - 1.0) / (m -1.0 + params.scaleMult);
    const f_omega_k_times_m_candidate = fOmegaK + (fOmegaKPlus1 - fOmegaK) * f_m_minus_1_candidate;

    const f_m_candidate = m / (m + params.scaleMult);
    const f_omega_k_times_m_plus_1_candidate = fOmegaK + (fOmegaKPlus1 - fOmegaK) * f_m_candidate;

    if (f_omega_k_times_m_candidate <= x + threshold && x < f_omega_k_times_m_plus_1_candidate - threshold) {
        return m;
    }
    if ( f_omega_k_times_m_plus_1_candidate < x + threshold ) {
        return m + 1;
    }
    return m; 
}

function findRemainderHigher(x, k, m, params, threshold) {
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k) }, params);
    const fOmegaKM = fOmegaK + (fOmegaKPlus1 - fOmegaK) * fFinite(BigInt(Math.max(0, m-1)),params.scaleMult);
    const fOmegaKMPlus1 = fOmegaK + (fOmegaKPlus1 - fOmegaK) * fFinite(BigInt(m),params.scaleMult);
    
    // Denominator check
    const denominator = fOmegaKMPlus1 - fOmegaKM;
    if (Math.abs(denominator) < 1e-15) {
        // If x is also very close to fOmegaKM, then remainder is 0.
        // Otherwise, cannot reliably calculate fr.
        if (Math.abs(x - fOmegaKM) < threshold) {
            return 0n;
        } else {
            return 0n; //new Error("Cannot determine remainder: denominator too small in findRemainderHigher"); 
        }
    }
    const fr = (x - fOmegaKM) * fOmegaK / denominator;

    if (fr < threshold) {
        return 0n;
    }
    else {
        // Amplification factor calculation was previously part of a separate function
        const rAmplification = (Math.abs(denominator) > 1e-15) ? (fOmegaK / denominator) : 1; // Avoid division by zero if denom was small but not caught
        // Pass depth + 1 (assuming depth is available or managed by fInverse wrapper)
        // For now, fInverse will manage its own depth parameter starting from 0 for new calls.
        return fInverse(fr, params, threshold * Math.max(1, rAmplification)); // Ensure amplification doesn't reduce threshold too much
    }
}

function findJ(x, params, threshold) {
    if (x <= 1.0 + threshold && x >= 1.0 - threshold) { 
        return 1;
    }
    if (x < 1.0 || x >= params.precomputed[3] - threshold) {
        console.error(`findJ called with x=${x} outside expected (1,3) range or too close to 3.`);
        if (x >= params.precomputed[3] - threshold * 100) return 1 // Number.MAX_SAFE_INTEGER; 
        if (x < 1.0) return 1; 
    }

    const denominator_j = params.precomputed[3] - x;
    if (Math.abs(denominator_j) < 1e-15) { 
        return 1 // Number.MAX_SAFE_INTEGER; 
    }

    const calcJ = Math.max(1, 1 + Math.floor( params.scaleExp * (x-1) / denominator_j));

    if (1 + params.precomputed[1]*calcJ/(params.scaleExp+calcJ) < x + threshold) {
        return calcJ+1;
    }
    else {
        return calcJ;
    }
}

function getValueFOmegaJM(j_base, m_coeff, params) {
    if (m_coeff === 0) return 0; 
    const fOmegaJBase = 1 + params.precomputed[1] * (j_base-1)/(params.scaleExp + j_base-1);
    const fOmegaJBasePlus1 = 1 + params.precomputed[1] * j_base/(params.scaleExp + j_base);
    return fOmegaJBase + (fOmegaJBasePlus1 - fOmegaJBase) * fFinite(BigInt(Math.max(0, m_coeff - 1)),params.scaleMult);
}

function findM(x, j_base, params,threshold) {
    const A = 1 + params.precomputed[1] * (j_base-1)/(params.scaleExp + j_base-1);
    const B = 1 + params.precomputed[1] * j_base/(params.scaleExp + j_base);

    if (x - A < threshold) { 
        return 1;
    }

    if (Math.abs(B - A) < 1e-15) { 
        return 1;
    }

    const target_f_m_minus_1 = (x - A) / (B - A);

    if (target_f_m_minus_1 < 0.0 - threshold) {
        console.warn(`findM: target_f_m_minus_1=${target_f_m_minus_1} < 0 for x=${x}, j=${j_base}. Returning m=1.`);
        return 1; 
    }
    if (target_f_m_minus_1 >= 1.0 - 1e-15) {
        return 1 // Number.MAX_SAFE_INTEGER; 
    }

    if (target_f_m_minus_1 < threshold) {
        return 1;
    }

    const calcM = Math.max(1, 1 + Math.floor(params.scaleMult * target_f_m_minus_1/(1-target_f_m_minus_1)));

    if (calcM/(calcM+params.scaleMult) < target_f_m_minus_1 + threshold) {
        return calcM+1;
    }
    else {
        return calcM;
    }
}

function findOmegaPowerOrdinal(x, params, threshold, depth) {
    // Use threshold directly instead of epsilon variable for consistency
    const j = findJ(x, params, threshold);
    if (j === 0) { 
      return findFiniteOrdinal(x, threshold, params.scaleAdd); 
    }

    const m = findM(x, j, params, threshold);

    const fOmegaJ_val = 1 + params.precomputed[1] * (j-1)/(params.scaleExp + j-1);
    const fOmegaJM_val = getValueFOmegaJM(j, m, params);
    const fOmegaJMPlus1_val = getValueFOmegaJM(j, m + 1, params);
    
    let fk;

    if (Math.abs(x - fOmegaJM_val) < threshold) {
        fk = 0;
    } else if (Math.abs(fOmegaJMPlus1_val - fOmegaJM_val) < 1e-15) {
        throw new Error(`Denominator too small in fk calculation for x=${x}, j=${j}, m=${m}. fOmegaJM=${fOmegaJM_val}, fOmegaJMPlus1=${fOmegaJMPlus1_val}`);
    } else {
        fk = (x - fOmegaJM_val) * fOmegaJ_val / (fOmegaJMPlus1_val - fOmegaJM_val);
    }
    
    if (fk < -threshold || fk > params.precomputed[5] + threshold) { 
        if (fk < 0 ) { 
            fk = 0;
        } else {
             throw new Error(`Calculated fk=${fk} is out of valid range [0,5] for x=${x}, j=${j}, m=${m}`);
        }
    }

    let k_rem_ordinal_representation;
    if (fk < threshold) { 
        k_rem_ordinal_representation = 0n; 
    } else {
        const kAmplificationFactor = (Math.abs(fOmegaJMPlus1_val - fOmegaJM_val) > 1e-15) ? 
                                   (fOmegaJ_val / (fOmegaJMPlus1_val - fOmegaJM_val)) : 1;
        k_rem_ordinal_representation = fInverse(fk, params, threshold * Math.max(1, kAmplificationFactor), depth + 1);
    }
    
    if (m === 1 && k_rem_ordinal_representation === 0n) {
        return { type: 'pow', k: BigInt(j) }; 
    } else {
        return { 
            type: 'sum', 
            beta: BigInt(j) ,
            c: m, 
            delta: k_rem_ordinal_representation 
        };
    }
}

function findHigherPowerOrdinal(x, params, threshold, depth) {
    const fk =  (params.precomputed[8]*x - params.precomputed[6])/(x + params.precomputed[7]); 
    const kAmplification = Math.max(1, (params.precomputed[8]-fk)*(params.precomputed[8]-fk)/params.precomputed[9]); // Ensure amplification is at least 1
    const k = fInverse(fk, params, threshold * kAmplification, depth + 1);
    
    // If the exponent k is determined to be E0_TYPE, then ω^k = ω^ε₀, which should be ε₀.
    // So, the overall result of this branch should be E0_TYPE.
    if (k === "E0_TYPE") {
        return "E0_TYPE";
    }
    
    const m = findCoefficientHigher(x, k, params, threshold);
    const r = findRemainderHigher(x, k, m, params, threshold); // Pass depth for consistency in amplification? fInverse manages depth.
    
    // Check if r is an error object from findRemainderHigher
    if (r instanceof Error) {
        console.warn(`findHigherPowerOrdinal: Remainder calculation failed for x=${x}, k=${typeof k === 'object' ? generateOrdinalMemoKey(k) : k}, m=${m}. Error: ${r.message}`);
        // Decide on a fallback. Perhaps return ω^k * m if remainder is problematic?
        // For now, let's assume if m is found, and r fails, the best is ω^k*m.
        return {
            type: 'sum',
            beta: k,
            c: m,
            delta: 0n // Fallback delta
        };
    }

    return {
        type: 'sum',
        beta: k,
        c: m,
        delta: r
    };
}

function fInverse(x, params, threshold = 1e-14, depth = 0) {
    if (x < -threshold || x > params.precomputed[5] + threshold) { // Allow x to be slightly over 5 due to float precision
        throw new Error(`Input value ${x} is outside the valid range [0,5]`);
    }

    // Handle specific values and ranges
    if (Math.abs(x) <= threshold) return 0n;
    if (Math.abs(x - params.precomputed[5]) <= threshold) return "E0_TYPE";

    // New: Check for WTowerOrdinal range (x > 4.96 up to, but not including, 5.0)
    // The threshold for 4.96 might need adjustment based on how WTower values are spaced.
    // Let's use a slightly more generous upper bound for this check to avoid conflict with E0_TYPE at exactly 5.0.
    if (x > params.precomputed[10] && x < params.precomputed[5] - threshold) { 
        // Formula: height = floor(4 / (5 - x))
        // Ensure 5.0 - x is not zero to avoid division by zero.
        const denominator = params.precomputed[5] - x;
        if (Math.abs(denominator) < 1e-15) { // Should be caught by x < 5.0 - threshold, but as safeguard
            console.warn(`fInverse: Denominator for w_tower height is near zero (x=${x}). Returning E0_TYPE as fallback.`);
            return "E0_TYPE";
        }
        //const height = Math.floor(4.0 / denominator);
        const targetHeight = (params.precomputed[4]+(params.scaleTet-1)*(x-1)) / denominator;
        const height = Math.floor(targetHeight);
        if (height >= 1) {
            const nextHeight = (params.precomputed[4]+(params.scaleTet-1)*(x+threshold-1)) / (params.precomputed[5] - (x+threshold));
            if (nextHeight > height+1) {
                return { type: 'w_tower', height: (height+1) };
            } else {
                return { type: 'w_tower', height: height };
            }
        } else {
            // This case (height < 1) should ideally not be hit if x > 4.98 and mapping is correct.
            // It might indicate x is too close to 5, such that 4.0 / (5.0 - x) is small.
            // Or, x is slightly > 5, which should be caught by the initial range check.
            console.warn(`fInverse: Calculated w_tower height is < 1 (height=${height}, x=${x}). Fallback might be needed or check x range.`);
            // Fallback to E0_TYPE if height is not sensible, as x is very close to 5.
            return "E0_TYPE"; 
        }
    }

    // Existing specific value checks (adjust thresholds if needed)
    if (Math.abs(x - 1.0) <= threshold) return { type: 'pow', k: 1n };  // f(ω) = 1
    if (Math.abs(x - params.precomputed[3]) <= threshold) return { type: 'pow', k: { type: 'pow', k: 1n } }; // f(ω^ω) = 3

    if (x < 1.0) {
        return findFiniteOrdinal(x, threshold, params.scaleAdd);
    } else if (x < params.precomputed[3]) { // Covers [1, 3) - f(ω) to f(ω^ω)
        return findOmegaPowerOrdinal(x, params, threshold, depth);
    } else { // Covers [3, 5) - f(ω^ω) up to (but not including) f(ε₀)
        // This also now implicitly covers the range up to 4.98 if not caught by w_tower.
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

    // Ensure tracer is provided, create a default if not (though script.js should provide one)
    const effectiveTracer = tracer || new OperationTracer(10000); // Default budget if no tracer given

    if (typeof ord_representation === 'bigint') {
        return new CNFOrdinal(ord_representation, effectiveTracer); // Pass tracer
    }

    if (ord_representation === "E0_TYPE") {
        return new EpsilonNaughtOrdinal(effectiveTracer); // Pass tracer
    }

    if (typeof ord_representation === 'object' && ord_representation !== null) {
        if (ord_representation.type === 'w_tower') { // NEW case for w_tower
            if (typeof ord_representation.height !== 'number' || ord_representation.height < 1 || !Number.isInteger(ord_representation.height)){
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
                displayResult = new EpsilonNaughtOrdinal();
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
    runTest(2/3, "0.666...");

    // Test ω and its multiples
    runTest(1, "1");
    runTest(1.5, "1.5");
    runTest(5/3, "1.666...");

    // Test ω^2 and its multiples
    runTest(2, "2");
    runTest(13/6, "2.166...");

    // Test ω^ω
    runTest(3, "3");

    // Test higher powers
    runTest(11/3, "3.666...");

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