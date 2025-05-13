// ordinal_exponentiation.js

// Assumes Ordinal class, its helpers, comparison, auxiliary ops, addition, and multiplication
// are all defined.

/**
 * Raises this ordinal to the power of another ordinal. ( α^β )
 * Returns a new Ordinal instance representing the result.
 *
 * Rules:
 * 1. β = 0: α^0 = 1 (for α!=0). 0^0 = 1 (convention).
 * 2. α = 0: 0^β = 0 (for β > 0).
 * 3. α = 1: 1^β = 1.
 * 4. β = 1: α^1 = α.
 * 5. α, β finite positive integers: n^m. Uses BigInt exponentiation.
 *
 * 6. α = k (finite, k≥2n), β infinite (B+m, B limit part != 0):
 *    k^β = k^(ωξ+r) = (ω^ξ) * k^r
 *    where β = ωξ+r (r finite part of β, B = ωξ).
 *    ξ = B.divideByOmega().
 *
 * 7. α infinite, β = m (finite BigInt, m ≥ 2n, as m=0n,1n handled by Rules 1 & 4):
 *    - If α = ω^a * c (single term where 'a' is the exponent of ω and 'c' is the coefficient),
 *      then α^m = ω^(a*m) * c. (Optimized path)
 *    - Otherwise (if α is a sum of terms), α^m is calculated by iterated multiplication: α * α * ... * α (m times).
 *
 * 8. α infinite, β infinite (B+m, B limit part != 0):
 *    α^β = α^(B+m) = α^B * α^m
 *    α^m is by Rule 7 (iterated multiplication or optimized).
 *    α^B: Let α = ω^α₁*c₁ + R_α (α₁ leading exp of α).
 *         Then α^B = ω^(α₁·B) (c₁ and R_α are absorbed). α₁·B is ordinal multiplication.
 */
Ordinal.prototype.power = function(exponentOrdinal) {
    if (!(exponentOrdinal instanceof Ordinal)) {
        throw new Error("Exponent must be an Ordinal type.");
    }
    if (this._tracer) this._tracer.consume(); // Base consumption for the power call

    // Rule 1: β = 0. α^0 = 1.
    if (exponentOrdinal.isZero()) {
        // 0^0 is conventionally 1 in some set theory contexts for ordinals.
        return Ordinal.ONEStatic().clone(this._tracer);
    }

    // Rule 2: α = 0. 0^β = 0 (for β > 0).
    if (this.isZero()) {
        // exponentOrdinal > 0 is guaranteed by previous check.
        return Ordinal.ZEROStatic().clone(this._tracer);
    }

    // Rule 3: α = 1. 1^β = 1.
    if (this.equals(Ordinal.ONEStatic())) {
        return Ordinal.ONEStatic().clone(this._tracer);
    }

    // Rule 4: β = 1. α^1 = α.
    if (exponentOrdinal.equals(Ordinal.ONEStatic())) {
        return this.clone();
    }

    const base = this; // α
    const exponent = exponentOrdinal; // β

    // Rule 5: α, β finite positive integers.
    if (base.isFinite() && exponent.isFinite()) {
        const baseVal = base.getFinitePart(); // BigInt
        const expVal = exponent.getFinitePart(); // BigInt

        if (baseVal === 0n || baseVal === 1n) { /* Already handled by rules 2,3 */ }
        if (expVal === 0n || expVal === 1n) { /* Already handled by rules 1,4 */ }
        
        // BigInt exponentiation
        // Note: expVal must not be negative for BigInt power. Finite ordinals are non-negative.
        if (this._tracer) this._tracer.consume(); 
        
        let resultVal;
        // BigInt power (**) requires the exponent to be non-negative.
        // Ordinal finite parts are non-negative.
        // Handle 0^0 separately (covered by Rule 1). If baseVal is 0n and expVal > 0n, result is 0n.
        if (baseVal === 0n && expVal > 0n) { // Technically covered by Rule 2 but good to be explicit
            resultVal = 0n;
        } else {
            try {
                resultVal = baseVal ** expVal;
            } catch (e) {
                // This might happen for very large finite exponentiation if baseVal is too large
                // for the specific JS engine's BigInt limits (though they are very high)
                // or if expVal was somehow negative (should not happen for ordinals).
                throw new Error(`BigInt exponentiation error for ${baseVal}^${expVal}: ${e.message}`);
            }
        }
        return new Ordinal(resultVal, this._tracer);
    }

    // Rule 6: α = k (finite, k≥2n), β infinite.
    if (base.isFinite() && !exponent.isFinite()) {
        const k = base.getFinitePart(); // k is BigInt
        if (k < 2n) { 
            throw new Error("Base < 2n in finite^infinite case, should be handled earlier.");
        }

        const r_val = exponent.getFinitePart();  // r (finite part of β, BigInt)
        const B_exp = exponent.getLimitPart();  // B (limit part of β)

        if (B_exp.isZero()) {
            // This means exponent was actually finite, should have been caught by Rule 5.
             if (this._tracer) this._tracer.consume();
            // Use BigInt exponentiation for k^r
            const resultVal_k_pow_r = k ** r_val;
            return new Ordinal(resultVal_k_pow_r, this._tracer);
        }
        
        if (this._tracer) this._tracer.consume(2); // For divideByOmega and k^r
        const xi_exp = B_exp.divideByOmega(); // ξ = B/ω
        
        const k_pow_r_val = k ** r_val; // BigInt power
        const k_pow_r_ord = new Ordinal(k_pow_r_val, this._tracer); // k^r

        // Result is (ω^ξ) * k^r
        // Create ω^ξ: exponent is xi_exp (Ordinal), coefficient is 1n
        const omega_pow_xi = new Ordinal([{ exponent: xi_exp, coefficient: 1n }], this._tracer);
        
        if (this._tracer) this._tracer.consume(); // For the final multiplication
        return omega_pow_xi.multiply(k_pow_r_ord);
    }

    // Rule 7: α infinite, β = m (finite BigInt, m ≥ 2n).
    if (!base.isFinite() && exponent.isFinite()) {
        const m = exponent.getFinitePart(); // m is BigInt

        if (m < 0n) { 
            throw new Error("Finite exponent cannot be negative in ordinal exponentiation.");
        }
        // If m < 2n (i.e., m=0n or m=1n), those are handled by Rules 1 and 4.

        // OPTIMIZATION for α = (ω^a * c) where exponent m is a finite BigInt >= 0n.
        // Formula: (ω^a * c)^m = ω^(a*m) * c (if m>0). If m=0, result is 1 (handled by Rule 1).
        // The coefficient 'c' is not raised to power 'm' in this specific ordinal rule.
        // It should be ω^(a*m) * c for m > 0 if base.terms.length === 1
        if (base.terms.length === 1) {
            const baseLeadTerm = base.terms[0]; // coefficient here is BigInt
            const a_ord = baseLeadTerm.exponent;    // Exponent of ω in the base (an Ordinal)
            const c_val = baseLeadTerm.coefficient; // Coefficient (a BigInt)

            if (this._tracer) this._tracer.consume(1); 

            const m_as_ordinal = new Ordinal(m, this._tracer); // Convert m (BigInt) to an Ordinal
            
            const new_omega_exponent = a_ord.multiply(m_as_ordinal); 
            
            // The coefficient 'c_val' of the base is retained, not raised to power 'm'.
            // Exception: if base itself is finite like (w^0*c)^m = c^m. But this case (base infinite)
            // is handled here.
            return new Ordinal([{ exponent: new_omega_exponent, coefficient: c_val }], this._tracer);
        }
        // else, base is a sum (e.g., ω+1), fall through to iterated multiplication.

        let result = Ordinal.ONEStatic().clone(this._tracer);
        // Loop m times using BigInt for loop counter
        for (let i = 0n; i < m; i++) {
            if (this._tracer) this._tracer.consume(); 
            result = result.multiply(base);
        }
        return result;
    }

    // Rule 8: α infinite, β infinite. α^β = α^B * α^m
    if (!base.isFinite() && !exponent.isFinite()) {
        const m_val = exponent.getFinitePart();       // m (finite part of β, BigInt)
        const B_exp_part = exponent.getLimitPart(); // B (limit part of β)

        if (this._tracer) this._tracer.consume(); 
        const alpha_pow_m = base.power(new Ordinal(m_val, this._tracer));

        if (B_exp_part.isZero()) {
            return alpha_pow_m;
        }

        const leadingTerm_base = base.getLeadingTerm(); // coefficient is BigInt
        if (!leadingTerm_base || leadingTerm_base.exponent.isZero()) {
            throw new Error("Internal error: Infinite base expected for α^B calculation.");
        }
        const alpha1 = leadingTerm_base.exponent; 

        if (this._tracer) this._tracer.consume(); 
        const exp_for_omega_base = alpha1.multiply(B_exp_part);
        
        const alpha_pow_B = new Ordinal([{
            exponent: exp_for_omega_base,
            coefficient: 1n // Coefficient is 1n for ω^(...)
        }], this._tracer);

        if (this._tracer) this._tracer.consume(); 
        return alpha_pow_B.multiply(alpha_pow_m);
    }

    throw new Error("Unhandled case in Ordinal.power");
};


// ordinal_exponentiation.js