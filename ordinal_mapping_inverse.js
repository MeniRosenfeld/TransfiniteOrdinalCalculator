// ordinal_mapping_inverse.js

// Remove ES6 import since we're using script tags
// import { f, fFinite, addOneToOrdinal, ORDINAL_ZERO, ORDINAL_ONE } from './ordinal_mapping.js';

// Assumes DEFAULT_F_PARAMS is globally available from ordinal_mapping.js
// Assumes f, fFinite, addOneToOrdinal, ORDINAL_ZERO, ORDINAL_ONE are global and param-aware.

const MAX_FINVERSE_DEPTH = 15; // Temporarily reduced for debugging hangs

function findFiniteOrdinal(x, threshold, params = DEFAULT_F_PARAMS) {
    const u_add_val = params.u_add;
    if (typeof u_add_val !== 'number' || u_add_val <= 0) {
        // Fallback to a default u_add if params are not correctly providing it.
        // This can happen if fInverse is called without params and DEFAULT_F_PARAMS isn't propagated as expected.
        console.warn(`findFiniteOrdinal: Invalid or missing params.u_add (${u_add_val}). Using fallback u_add = 1.0`);
        const u_add_fallback = 1.0;
        // Recalculate n using fallback u_add_fallback if necessary, or throw error
        // For robustness, let's allow calculation with fallback if params structure is an issue.
        // However, the function signature defaults params to DEFAULT_F_PARAMS which should have u_add.
        // This error implies DEFAULT_F_PARAMS itself is problematic or not passed.
        // Sticking to throwing error for now to highlight configuration issues.
        throw new Error(`findFiniteOrdinal called with invalid params.u_add: ${u_add_val}`);
    }

    if (x < threshold) { // x is approximately 0
        return 0n; // Return BigInt zero
    }

    // Target: x = n / (n + u_add_val)  => n = x * u_add_val / (1 - x)
    if (x >= 1.0 - 1e-15) { // x is approximately 1 or greater
        const one_minus_x = 1.0 - x;
        if (one_minus_x <= 0) { 
            // This happens if x >= 1. For x=1, n is infinite. For x > 1, n is negative (invalid).
            console.warn(`findFiniteOrdinal (u_add=${u_add_val}) called with x=${x} >= 1. This implies infinite or invalid n. Returning large BigInt as approximation for x near 1.`);
            // Return a very large BigInt as an approximation of infinity for x=1 case
            return BigInt(Number.MAX_SAFE_INTEGER); 
        }
        const n_float = (x * u_add_val) / one_minus_x;
        if (n_float < 0) { // Should not happen if x < 1
            console.warn(`findFiniteOrdinal (u_add=${u_add_val}) calculated negative n_float=${n_float} for x=${x}. Returning 0n.`);
            return 0n;
        }
        return BigInt(Math.floor(n_float)); 
    }

    // General case for x < 1 and not near 0.
    const n_calculated_float = (x * u_add_val) / (1.0 - x);
    if (n_calculated_float < 0) { // Safeguard
         console.warn(`findFiniteOrdinal (u_add=${u_add_val}) calculated negative n_calculated_float=${n_calculated_float} for x=${x}. Returning 0n.`);
         return 0n;
    }
    const n_floor = Math.floor(n_calculated_float);

    // Check which integer n_floor or n_floor+1 gives f(n) closer to x
    // This involves comparing x with f(n_floor + 0.5) implicitly, or checking f(n_floor) and f(n_floor+1)
    const val_f_n_floor = fFinite(BigInt(n_floor), u_add_val);
    const val_f_n_floor_plus_1 = fFinite(BigInt(n_floor + 1), u_add_val);

    // If x is closer to f(n_floor+1) than to f(n_floor)
    if (Math.abs(x - val_f_n_floor_plus_1) < Math.abs(x - val_f_n_floor)) {
        // Exception: if n_floor was result of large x/(1-x) and x is actually closer to f(n_floor)
        // but rounding n_calculated_float made n_floor too small.
        // The original logic using f(n_floor+1) < x + threshold was simpler.
        // Let's use: if x is clearly above the midpoint between f(n_floor) and f(n_floor+1), choose n_floor+1.
        // Midpoint: (val_f_n_floor + val_f_n_floor_plus_1) / 2
        if (x > (val_f_n_floor + val_f_n_floor_plus_1) / 2.0 - threshold ) { // allow some tolerance
             return BigInt(n_floor + 1);
        }
        return BigInt(n_floor);
    } else {
        return BigInt(n_floor);
    }
}

function findCoefficientHigher(x, k, threshold, params = DEFAULT_F_PARAMS) {
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k, params) }, params);

    const target_f_m_minus_1 = (x - fOmegaK)/(fOmegaKPlus1 - fOmegaK);

    if (x < fOmegaK + threshold) { // Note: original had fOmegaK+threshold, implies x could be slightly > fOmegaK if threshold is large relative to difference
        return 1; 
    }
    // Handle cases where (fOmegaKPlus1 - fOmegaK) is zero or very small, or target_f_m_minus_1 implies m is infinite or < 1
    if (Math.abs(fOmegaKPlus1 - fOmegaK) < 1e-15) { // Denominator for target_f_m_minus_1 is effectively zero
        return (Math.abs(x - fOmegaK) < threshold) ? 1 : Number.MAX_SAFE_INTEGER; // m=1 if x approx fOmegaK, else m is huge
    }
    if (target_f_m_minus_1 >= 1.0 - 1e-15) return Number.MAX_SAFE_INTEGER; // m is huge
    if (target_f_m_minus_1 < 0) return 1; // implies x < fOmegaK

    const m = Math.max(1, Math.floor(1/(1-target_f_m_minus_1)));

    // Original rounding logic was: (m/(m+1)) < target_f_m_minus_1+threshold
    // This compares f(m_candidate) with target_f_m_minus_1 (which is target f(m-1) for coefficient m)
    // Let's test m and m+1 by reconstructing the value of f(ω^k * m_candidate)
    const f_m_minus_1_candidate_val = (m === 1) ? 0.0 : fFinite(BigInt(m - 1), params);
    const f_omega_k_times_m_candidate = fOmegaK + (fOmegaKPlus1 - fOmegaK) * f_m_minus_1_candidate_val;

    const f_m_candidate_val = fFinite(BigInt(m), params);
    const f_omega_k_times_m_plus_1_candidate = fOmegaK + (fOmegaKPlus1 - fOmegaK) * f_m_candidate_val;

    if (f_omega_k_times_m_candidate <= x + threshold && x < f_omega_k_times_m_plus_1_candidate - threshold) {
        return m;
    }
    if (Math.abs(x - f_omega_k_times_m_plus_1_candidate) < threshold ) {
        return m + 1;
    }
    // Fallback if direct check isn't conclusive, original logic was simple comparison with target_f_m_minus_1
    // Reverting to a simpler rounding based on target_f_m_minus_1 if above fails to pinpoint
    if (fFinite(BigInt(m), params) < target_f_m_minus_1 + threshold * 0.1) { // Use slightly adjusted threshold for this comparison
        return m+1;
    }
    return m; 
}

function findRemainderHigher(x, k, m, threshold, params = DEFAULT_F_PARAMS) {
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k, params) }, params);
    const fOmegaKM = fOmegaK + (fOmegaKPlus1 - fOmegaK) * fFinite(BigInt(Math.max(0, m-1)), params);
    const fOmegaKMPlus1 = fOmegaK + (fOmegaKPlus1 - fOmegaK) * fFinite(BigInt(m), params);
    
    // Denominator check
    const denominator = fOmegaKMPlus1 - fOmegaKM;
    if (Math.abs(denominator) < 1e-15) {
        // If x is also very close to fOmegaKM, then remainder is 0.
        // Otherwise, cannot reliably calculate fr.
        return (Math.abs(x - fOmegaKM) < threshold) ? 0n : new Error("Cannot determine remainder: denominator too small in findRemainderHigher"); 
    }
    const fr = (x - fOmegaKM) * fOmegaK / denominator;

    if (fr < threshold) {
        return 0n;
    } else {
        const rAmplification = (Math.abs(denominator) > 1e-15) ? (fOmegaK / denominator) : 1;
        // Propagate depth correctly
        return fInverse(fr, threshold * Math.max(1, rAmplification), depth + 1, params);
    }
}

function findJ(x, threshold, params = DEFAULT_F_PARAMS) {
    const VAL_F_OMEGA = 1.0;
    const VAL_F_OMEGA_OMEGA = 1 + params.u_mul * (1 + params.u_exp);
    if (Math.abs(x - VAL_F_OMEGA) <= threshold) return 1n; // Exact f(w)
    if (x < VAL_F_OMEGA) { /* Should be handled by findFiniteOrdinal or error before */ return 1n; }
    if (x >= VAL_F_OMEGA_OMEGA - threshold) { return BigInt(Number.MAX_SAFE_INTEGER); /* Approx j is infinite */ }

    const C_exp = params.u_mul * (1 + params.u_exp);
    const x_minus_1 = x - 1.0;
    const denominator_j_formula = x_minus_1 - C_exp;

    if (Math.abs(denominator_j_formula) < 1e-15) {
        return BigInt(Number.MAX_SAFE_INTEGER);
    }
    const numerator_j_formula = x_minus_1 * (1 - params.u_exp) - C_exp;
    let j_solved_float = numerator_j_formula / denominator_j_formula;

    if (j_solved_float < 1.0) j_solved_float = 1.0; // j must be at least 1
    // We want the floor for j, as the remainder/coefficient part will handle the rest.
    const j_floor = Math.floor(j_solved_float);
    return BigInt(Math.max(1, j_floor)); 
}

function getValueFOmegaJM(j_base_bigint, m_coeff_num, params = DEFAULT_F_PARAMS) { 
    // This function calculates f(w^j_base * m_coeff_num)
    // f(A*c) = f(A) + (f(A*w) - f(A)) * f_std(c-1; u_mul)
    // Here A = w^j_base, c = m_coeff_num. So f_std is (m_coeff_num-1)/(m_coeff_num-1 + params.u_mul)
    if (m_coeff_num === 0) return 0.0; // Or throw? f(w^j * 0) is f(0) = 0.
    if (m_coeff_num === 1) return f({ type: 'pow', k: j_base_bigint }, params); // f(w^j_base * 1)

    const f_omega_j_base = f({ type: 'pow', k: j_base_bigint }, params);
    const f_omega_j_base_plus_1 = f({ type: 'pow', k: addOneToOrdinal(j_base_bigint, params) }, params);
    
    // Interpolation factor for coefficient (m_coeff_num - 1)
    const m_minus_1_bigint = BigInt(Math.max(0, Math.floor(m_coeff_num - 1.0)));
    const interp_factor = fFinite(m_minus_1_bigint, params.u_mul);

    return f_omega_j_base + (f_omega_j_base_plus_1 - f_omega_j_base) * interp_factor;
}

function findM(x, j_base_bigint, threshold, params = DEFAULT_F_PARAMS) {
    const A = f({type: 'pow', k: j_base_bigint}, params);
    const B = f({type: 'pow', k: addOneToOrdinal(j_base_bigint, params)}, params);

    if (x <= A + threshold) { return 1; } // x is at or below f(w^j_base * 1)
    if (x >= B - threshold) { // x is at or above f(w^j_base * w) = f(w^(j_base+1))
        // This means the coefficient is effectively infinite in this context, leading to next power.
        // This case should ideally be handled by findJ moving to j_base+1.
        // For safety, return large M, but this signals range issue for findM.
        return Number.MAX_SAFE_INTEGER; 
    }
    if (Math.abs(B - A) < 1e-15) { return 1; }

    const target_for_f_M_minus_1 = (x - A) / (B - A); // Target for (M-1)/(M-1+u_mul)

    if (target_for_f_M_minus_1 < 0) return 1; // Should be caught by x <= A + threshold
    if (target_for_f_M_minus_1 >= 1.0 - 1e-15) return Number.MAX_SAFE_INTEGER;
    
    const one_minus_T = 1.0 - target_for_f_M_minus_1;
    let M_minus_1_solved_float;
    if (Math.abs(one_minus_T) < 1e-15) { // Target is 1, implies M-1 is infinite
        M_minus_1_solved_float = Number.MAX_SAFE_INTEGER / 2; // Avoid overflow if adding 1 later
    } else {
        M_minus_1_solved_float = (target_for_f_M_minus_1 * params.u_mul) / one_minus_T;
    }

    if (M_minus_1_solved_float < 0) M_minus_1_solved_float = 0; // M-1 cannot be negative

    // M is the integer part of (M-1_solved + 1)
    const M_int_coeff = Math.max(1, Math.floor(M_minus_1_solved_float) + 1);
    return M_int_coeff; 
}

function findOmegaPowerOrdinal(x, threshold, depth, params = DEFAULT_F_PARAMS) {
    // Use threshold directly instead of epsilon variable for consistency
    const j = findJ(x, threshold, params);
    if (j === 0) { 
      return findFiniteOrdinal(x, threshold, params); 
    }

    const m = findM(x, j, threshold, params);

    // Use BigInt for j when calling f for powers
    const j_bigint = BigInt(j);
    const fOmegaJ_val = f({ type: 'pow', k: j_bigint }, params);
    const fOmegaJM_val = getValueFOmegaJM(j_bigint, m, params);
    const fOmegaJMPlus1_val = getValueFOmegaJM(j_bigint, m + 1, params);

    console.log(`[findOmegaPowerOrdinal] x=${x.toFixed(15)}, j=${j}, m=${m}`);
    console.log(`[findOmegaPowerOrdinal] f(w^j) = ${fOmegaJ_val.toFixed(15)}`);
    console.log(`[findOmegaPowerOrdinal] f(w^j*m) = ${fOmegaJM_val.toFixed(15)}`);
    console.log(`[findOmegaPowerOrdinal] f(w^j*(m+1)) = ${fOmegaJMPlus1_val.toFixed(15)}`);

    let fk;
    const fk_denominator = fOmegaJMPlus1_val - fOmegaJM_val;
    if (Math.abs(x - fOmegaJM_val) < threshold && Math.abs(fk_denominator) > threshold) { // If x is essentially f(w^j*m), remainder f(k) is 0
        fk = 0;
        console.log(`[findOmegaPowerOrdinal] x is very close to f(w^j*m). Setting fk = 0.`);
    } else if (Math.abs(fk_denominator) < 1e-15) { 
        console.warn(`[findOmegaPowerOrdinal] Denominator for fk is near zero: ${fk_denominator}. x=${x}, f(w^j*m)=${fOmegaJM_val}.`);
        // If x is also very close to fOmegaJM_val, fk should be 0. Otherwise, it's problematic.
        fk = (Math.abs(x - fOmegaJM_val) < threshold) ? 0 : Number.POSITIVE_INFINITY; // Or some other indicator of error/limit
        if(fk !== 0) console.warn(`[findOmegaPowerOrdinal] fk set to Infinity due to zero denominator and x != f(w^j*m)`);
    } else {
        fk = (x - fOmegaJM_val) * fOmegaJ_val / fk_denominator;
    }
    console.log(`[findOmegaPowerOrdinal] Calculated fk = ${fk.toFixed(15)}`);

    const VAL_F_E0 = 1 + params.u_mul * (1 + params.u_exp) * (1 + params.u_tet);
    if (fk < -threshold || fk > VAL_F_E0 + threshold) { 
        if (fk < 0 && Math.abs(fk) < threshold * 100) { // Allow slightly more tolerance for negative fk near zero
            console.warn(`[findOmegaPowerOrdinal] fk=${fk} slightly negative, coercing to 0.`);
            fk = 0;
        } else {
             // Log the components that led to this out-of-range fk
             console.error(`[findOmegaPowerOrdinal] About to throw: fk=${fk}, x=${x}, f(w^j*m)=${fOmegaJM_val}, f(w^j)=${fOmegaJ_val}, denom=${fk_denominator}`);
             throw new Error(`Calculated fk=${fk} is out of valid range [0, ${VAL_F_E0.toFixed(4)}] for x=${x}, j=${j}, m=${m}`);
        }
    }

    let k_rem_ordinal_representation;
    if (fk < threshold) { 
        k_rem_ordinal_representation = 0n; 
    } else {
        const kAmplificationFactor = (Math.abs(fOmegaJMPlus1_val - fOmegaJM_val) > 1e-15) ? 
                                   (fOmegaJ_val / (fOmegaJMPlus1_val - fOmegaJM_val)) : 1;
        k_rem_ordinal_representation = fInverse(fk, threshold * Math.max(1, kAmplificationFactor), depth + 1, params);
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

function findHigherPowerOrdinal(x, threshold, depth, params = DEFAULT_F_PARAMS) { 
    // Inverts x = f(w^k) where k is infinite.
    // The formula for f(w^k) is: 
    // (val_f_e0^2 + f(k) * C1_num_term) / (1 - f(k) + C2_den_term)
    // where val_f_e0 = 1 + u_m(1+u_e)(1+u_t)
    //       C1_num_term = -1 + u_m(1+u_e)(-1+u_t^2)
    //       C2_den_term = u_m(1+u_e)(1+u_t)^2
    // Let y = f(k). We want to solve x = (val_f_e0^2 + y*C1) / (1-y+C2) for y.
    // x(1-y+C2) = val_f_e0^2 + yC1
    // x - xy + xC2 = val_f_e0^2 + yC1
    // x + xC2 - val_f_e0^2 = yC1 + xy = y(C1+x)
    // y = f(k) = (x * (1+C2_den_term) - val_f_e0^2) / (C1_num_term + x)
    // Note: x * (1+C2_den_term) is x * C2 from the derivation in the plan, if C2 was (1+C2_den_term).
    // Let's re-label C2 from the plan to match the components: DenomConstPart = 1 + C2_den_term.
    // Original derivation was y = (x*C2_overall - F_e0_sq) / (C1+x) where C2_overall = (1 + C2_den_term from f() code)

    const val_f_e0 = 1 + params.u_mul * (1 + params.u_exp) * (1 + params.u_tet);
    const C1_num_term = -1 + params.u_mul * (1 + params.u_exp) * (-1 + params.u_tet * params.u_tet);
    const C2_den_term_from_f = params.u_mul * (1 + params.u_exp) * Math.pow(1 + params.u_tet, 2);
    // This C2_den_term_from_f is the term added to (1-f(k)) in the denominator of f(w^k).
    // So the full denominator constant part is (1 + C2_den_term_from_f).

    let fk_numerator = x * (1 + C2_den_term_from_f) - (val_f_e0 * val_f_e0);
    let fk_denominator = C1_num_term + x;

    if (Math.abs(fk_denominator) < 1e-15) {
        // This implies x is very close to -C1_num_term.
        // This situation needs careful thought for what fk should be (e.g. infinite, or specific boundary value).
        console.warn(`findHigherPowerOrdinal: Denominator for fk is near zero. x=${x}, C1_num_term=${C1_num_term}.`);
        // If fk becomes indeterminate, it might mean x corresponds to a boundary that f(w^k) approaches, e.g. f(w^w)
        // For robustness, if this happens, perhaps we should target f(w^w) for k.
        const VAL_F_OMEGA_OMEGA = 1 + params.u_mul * (1 + params.u_exp);
        fk = VAL_F_OMEGA_OMEGA; // Fallback to f(w^w)
    } else {
        fk = fk_numerator / fk_denominator;
    }
    
    // fk is f(exponent_k). This exponent_k must be an infinite ordinal.
    // So fk must be >= f(w) = VAL_F_OMEGA.
    // And fk must be < VAL_F_E0 (unless x itself is VAL_F_E0, handled earlier).
    const VAL_F_OMEGA = 1.0; // Should be consistent with fInverse main part

    // Range check for fk. It should be >= f(w) and < VAL_F_E0.
    if (fk < VAL_F_OMEGA - threshold && Math.abs(fk - VAL_F_OMEGA) > threshold*100) { // If substantially less than f(w)
        // This might indicate an issue if x was supposed to be in the higher power range.
        console.warn(`[findHigherPowerOrdinal] Calculated fk=${fk.toFixed(10)} is unexpectedly less than f(w)=${VAL_F_OMEGA.toFixed(10)}. For x=${x.toFixed(10)}. Clamping fk to f(w).`);
        fk = VAL_F_OMEGA;
    }
    if (fk >= val_f_e0 - threshold) { // If fk is at or above f(e_0)
        console.warn(`[findHigherPowerOrdinal] Calculated fk=${fk.toFixed(10)} is at or above f(e_0)=${val_f_e0.toFixed(10)}. For x=${x.toFixed(10)}. Clamping fk to just below f(e_0).`);
        fk = val_f_e0 - threshold * 100; // Push it slightly below to avoid exact f(e_0) recursion if possible
    }

    const C2_overall_for_amp = 1 + C2_den_term_from_f;
    const amp_deriv_numerator = C2_overall_for_amp * C1_num_term + val_f_e0 * val_f_e0;
    const amp_deriv_denominator_sq_part = (C1_num_term + x);
    
    let kAmplificationFactor;
    if (Math.abs(amp_deriv_denominator_sq_part) < 1e-9) { // Avoid division by zero if (C1+x) is zero
        console.warn(`[findHigherPowerOrdinal] Denominator part (C1+x) for kAmplificationFactor derivative is near zero. Using default high amplification.`);
        kAmplificationFactor = 1e10; // Default to large amplification if derivative is undefined/huge
    } else {
        kAmplificationFactor = Math.abs( amp_deriv_numerator / (amp_deriv_denominator_sq_part * amp_deriv_denominator_sq_part) );
    }

    // Ensure kAmplificationFactor is sane: it scales the threshold for the next fInverse call.
    // If derivative |dfk/dx| is very small, kAmplificationFactor is small -> new_thresh is small (good, more precision needed for fk).
    // If derivative |dfk/dx| is very large, kAmplificationFactor is large -> new_thresh is large (less precision needed for fk).
    // We need to ensure it doesn't become pathologically small or large.
    kAmplificationFactor = Math.max(1e-12, kAmplificationFactor); // Lower bound to prevent overly tiny thresholds
    kAmplificationFactor = Math.min(1e12, kAmplificationFactor);  // Upper bound to prevent overly huge thresholds

    const k = fInverse(fk, threshold * kAmplificationFactor, depth + 1, params);
    
    const m = findCoefficientHigher(x, k, threshold, params); 
    const r = findRemainderHigher(x, k, m, threshold, params); 
    
    if (r instanceof Error) { 
        console.warn(`findHigherPowerOrdinal: Remainder calculation failed. Defaulting delta to 0. Error: ${r.message}`);
        return { type: 'sum', beta: k, c: m, delta: 0n }; 
    }
    return { type: 'sum', beta: k, c: m, delta: r };
}

function fInverse(x, threshold = 1e-14, depth = 0, params = DEFAULT_F_PARAMS) {
    console.log(`[fInv d=${depth}] x=${typeof x === 'number' ? x.toPrecision(8) : x}, thresh=${typeof threshold === 'number' ? threshold.toPrecision(3) : threshold}`); // Log entry

    if (depth > MAX_FINVERSE_DEPTH) {
        console.error(`fInverse: Max recursion depth ${MAX_FINVERSE_DEPTH} exceeded for x=${x}, threshold=${threshold}, depth=${depth}, params=${JSON.stringify(params)}`);
        return { type: "error_recursion_depth", value: x }; 
    }

    // Calculate dynamic boundary values based on params
    // f(w; params) should always be 1 because f(w^1) = 1 + u_m(1+u_e)*(1-1)/(u_e+1-1) = 1
    const VAL_F_OMEGA = 1.0; 
    // f(w^w; params) = 1 + u_m(1+u_e)
    const VAL_F_OMEGA_OMEGA = 1 + params.u_mul * (1 + params.u_exp);
    // f(e_0; params) = 1 + u_m(1+u_e)(1+u_t)
    const VAL_F_E0 = 1 + params.u_mul * (1 + params.u_exp) * (1 + params.u_tet);

    // Threshold for w_tower detection (e.g., 99% of the way from f(w^w) to f(e_0), or a fixed small offset from f(e_0))
    // Let's use a pragmatic approach: if f(w^^large_finite_h) approaches VAL_F_E0.
    // The previous 4.98 was for VAL_F_E0=5. If VAL_F_E0 changes, this threshold needs to be relative.
    // For f(w^^h) = VAL_F_E0 - params.u_mul*(1+params.u_exp)*(1+params.u_tet) * (1 / (params.u_tet + h - 1))
    // Let's set WTOWER_THRESHOLD_X to be close to VAL_F_E0, e.g., where h might be around 200-250.
    // Or, more simply, a value slightly less than VAL_F_E0, if VAL_F_E0 is the hard limit.
    // Example: VAL_F_E0 - 0.02 * (VAL_F_E0 / 5.0) to scale the 0.02 offset if VAL_F_E0 is not 5.
    // This makes the threshold sensitive to the scale of VAL_F_E0.
    const WTOWER_THRESHOLD_X = VAL_F_E0 - (0.02 * (VAL_F_E0 / 5.0)); 

    if (x < -threshold || x > VAL_F_E0 + threshold) {
        throw new Error(`Input value ${x} is outside the valid range [0, ${VAL_F_E0.toFixed(4)}] for current params.`);
    }

    if (Math.abs(x) <= threshold) return 0n;
    if (Math.abs(x - VAL_F_E0) <= threshold) return "E0_TYPE";

    if (x > WTOWER_THRESHOLD_X && x < VAL_F_E0 - threshold) { 
        const denominator = VAL_F_E0 - x; // Note: this is 5.0-x with old f(e0)=5. Need to use the formula for f(w^^h)
        // We are inverting x = 1 + C_tet_product * (h-1)/(params.u_tet + h -1)
        // where C_tet_product = params.u_mul*(1+params.u_exp)*(1+params.u_tet)
        // So, x_minus_1 = (x-1)
        // x_minus_1 * (params.u_tet + h - 1) = C_tet_product * (h-1)
        // x_minus_1*params.u_tet + x_minus_1*h - x_minus_1 = C_tet_product*h - C_tet_product
        // h * (x_minus_1 - C_tet_product) = x_minus_1 - C_tet_product - x_minus_1*params.u_tet
        // h = ( (x-1)*(1-params.u_tet) - C_tet_product ) / ( (x-1) - C_tet_product )
        const C_tet_product = params.u_mul * (1 + params.u_exp) * (1 + params.u_tet);
        if (Math.abs((x-1) - C_tet_product) < 1e-15) { // Denominator for h is zero
             console.warn(`fInverse WTower: Denominator for h is near zero. x=${x}, C_tet_prod=${C_tet_product}. Fallback to E0_TYPE.`);
             return "E0_TYPE";
        }
        let height = Math.floor(((x-1)*(1-params.u_tet) - C_tet_product) / ((x-1) - C_tet_product));
        
        if (height >= 1) {
            return { type: 'w_tower', height: height };
        } else {
            console.warn(`fInverse: Calculated w_tower height < 1 (h=${height}, x=${x}). Fallback to E0_TYPE.`);
            return "E0_TYPE"; 
        }
    }

    // Use VAL_F_OMEGA and VAL_F_OMEGA_OMEGA for branching
    if (Math.abs(x - VAL_F_OMEGA) <= threshold) return { type: 'pow', k: 1n };  
    if (Math.abs(x - VAL_F_OMEGA_OMEGA) <= threshold) return { type: 'pow', k: { type: 'pow', k: 1n } }; // This is f(w^w)

    if (x < VAL_F_OMEGA) { // Range for finite ordinals up to (but not including) f(w)
        return findFiniteOrdinal(x, threshold, params);
    } else if (x < VAL_F_OMEGA_OMEGA) { // Range for f(w) up to (but not including) f(w^w)
        return findOmegaPowerOrdinal(x, threshold, depth, params);
    } else { // Range for f(w^w) up to (but not including) f(e_0) (WTower range handled above)
        return findHigherPowerOrdinal(x, threshold, depth, params);
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
window.convertFFormatToOrdinalInstance = convertFFormatToOrdinalInstance; // Expose globally 