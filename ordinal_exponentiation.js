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
 * 5. α, β finite positive integers: n^m.
 *
 * 6. α = k (finite, k≥2), β infinite (B+m, B limit part != 0):
 *    k^β = k^(ωξ+r) = (ω^ξ) * k^r
 *    where β = ωξ+r (r finite part of β, B = ωξ).
 *    ξ = B.divideByOmega().
 *
 * 7. α infinite, β = m (finite, m>1):
 *    α^m = α * α * ... * α (m times) - Iterated multiplication.
 *
 * 8. α infinite, β infinite (B+m, B limit part != 0):
 *    α^β = α^(B+m) = α^B * α^m
 *    α^m is by Rule 7 (iterated multiplication).
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
        const baseVal = base.getFinitePart();
        const expVal = exponent.getFinitePart();

        if (baseVal === 0 || baseVal === 1) { /* Already handled by rules 2,3 */ }
        if (expVal === 0 || expVal === 1) { /* Already handled by rules 1,4 */ }
        
        // Standard JS Math.pow for finite integers.
        // Note: Result might exceed Number.MAX_SAFE_INTEGER for large inputs.
        // Ordinal coefficients are standard numbers.
        if (this._tracer) this._tracer.consume(); // For the Math.pow
        const resultVal = Math.pow(baseVal, expVal);
        if (!Number.isSafeInteger(resultVal) || resultVal < 0) {
            // This might happen for very large finite exponentiation.
            // For simplicity, we'll throw an error, though BigInt could be used.
            throw new Error(`Finite exponentiation result ${resultVal} is too large or invalid for standard number.`);
        }
        return new Ordinal(resultVal, this._tracer);
    }

    // Rule 6: α = k (finite, k≥2), β infinite.
    if (base.isFinite() && !exponent.isFinite()) {
        const k = base.getFinitePart();
        if (k < 2) { /* Should have been caught by α=0 or α=1 rules */
            throw new Error("Base < 2 in finite^infinite case, should be handled earlier.");
        }

        const r_val = exponent.getFinitePart(); // r (finite part of β)
        const B_exp = exponent.getLimitPart();  // B (limit part of β)

        if (B_exp.isZero()) {
            // This means exponent was actually finite, should have been caught by Rule 5.
            // This can happen if exponent was like "w^0*5" which is finite.
            // Fallback to Rule 5 logic if B_exp is zero.
             if (this._tracer) this._tracer.consume();
            return new Ordinal(Math.pow(k, r_val), this._tracer);
        }
        
        if (this._tracer) this._tracer.consume(2); // For divideByOmega and k^r
        const xi_exp = B_exp.divideByOmega(); // ξ = B/ω
        const k_pow_r_ord = new Ordinal(Math.pow(k, r_val), this._tracer); // k^r

        // Result is (ω^ξ) * k^r
        const omega_pow_xi = new Ordinal([{ exponent: xi_exp, coefficient: 1 }], this._tracer);
        
        if (this._tracer) this._tracer.consume(); // For the final multiplication
        return omega_pow_xi.multiply(k_pow_r_ord);
    }

    // Rule 7: α infinite, β = m (finite, m > 1). Iterated multiplication.
    if (!base.isFinite() && exponent.isFinite()) {
        const m = exponent.getFinitePart();
        if (m === 0 || m === 1) { /* Already handled */ }
        if (m < 0) throw new Error("Finite exponent cannot be negative."); // Should be caught by Ordinal constructor

        let result = Ordinal.ONEStatic().clone(this._tracer);
        // If m is very large, this loop can exceed budget quickly.
        // Each multiplication consumes from the budget.
        for (let i = 0; i < m; i++) {
            if (this._tracer) this._tracer.consume(); // Consume for the multiply operation itself
                                                     // The multiply method will consume more internally.
            result = result.multiply(base);
        }
        return result;
    }

    // Rule 8: α infinite, β infinite. α^β = α^B * α^m
    if (!base.isFinite() && !exponent.isFinite()) {
        const m_val = exponent.getFinitePart();       // m (finite part of β)
        const B_exp_part = exponent.getLimitPart(); // B (limit part of β)

        // Calculate α^m (iterated multiplication, using Rule 7 logic via recursive call)
        // This re-call will correctly use the tracer.
        if (this._tracer) this._tracer.consume(); // For the α^m power call
        const alpha_pow_m = base.power(new Ordinal(m_val, this._tracer));

        if (B_exp_part.isZero()) {
            // Exponent's limit part was zero, so it was effectively finite.
            // α^m is the full result.
            return alpha_pow_m;
        }

        // Calculate α^B = ω^(α₁·B)
        // Let α = ω^α₁*c₁ + R_α
        const leadingTerm_base = base.getLeadingTerm();
        if (!leadingTerm_base || leadingTerm_base.exponent.isZero()) {
            // Base is somehow finite here, should have been caught.
            throw new Error("Internal error: Infinite base expected for α^B calculation.");
        }
        const alpha1 = leadingTerm_base.exponent; // This is an Ordinal

        // Calculate exponent for ω: α₁ · B
        if (this._tracer) this._tracer.consume(); // For the α₁·B multiplication
        const exp_for_omega_base = alpha1.multiply(B_exp_part);
        
        const alpha_pow_B = new Ordinal([{
            exponent: exp_for_omega_base,
            coefficient: 1 // Coefficient is 1 for ω^(...)
        }], this._tracer);

        // Result is α^B * α^m
        if (this._tracer) this._tracer.consume(); // For the final multiplication
        return alpha_pow_B.multiply(alpha_pow_m);
    }

    // Should not be reached if all cases are covered
    throw new Error("Unhandled case in Ordinal.power");
};


// ordinal_exponentiation.js