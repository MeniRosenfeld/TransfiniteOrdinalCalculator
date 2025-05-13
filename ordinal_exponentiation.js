// ordinal_exponentiation.js

// Assumes CNFOrdinal class, its helpers, comparison, auxiliary ops, addition, and multiplication
// are all defined.
// Assumes EpsilonNaughtOrdinal class is defined.

/**
 * General ordinal exponentiation function.
 * Dispatches to the correct power method based on the types of the operands.
 * @param {Ordinal} base - The base ordinal.
 * @param {Ordinal} exponent - The exponent ordinal.
 * @returns {Ordinal} The result of base raised to the power of exponent.
 */
function powerOrdinals(base, exponent) {
    if (base instanceof EpsilonNaughtOrdinal) {
        if (exponent instanceof EpsilonNaughtOrdinal) {
            // e_0 ^ e_0 is unsupported
            throw new Error("e_0 ^ e_0 is unsupported in this implementation.");
        } else if (exponent instanceof CNFOrdinal) {
            // e_0 ^ x (where x is CNFOrdinal)
            if (exponent.isZero()) return CNFOrdinal.ONEStatic().clone(base._tracer); // e_0 ^ 0 = 1
            if (exponent.equals(CNFOrdinal.ONEStatic())) return new EpsilonNaughtOrdinal(base._tracer); // e_0 ^ 1 = e_0
            // e_0 ^ m (m finite > 1) or e_0 ^ a (a infinite) are unsupported
            throw new Error("e_0 ^ CNFOrdinal (where CNFOrdinal is not 0 or 1) is unsupported in this implementation.");
        } else {
            throw new Error("Unsupported exponent type for EpsilonNaughtOrdinal base.");
        }
    } else if (base instanceof CNFOrdinal) {
        if (exponent instanceof EpsilonNaughtOrdinal) {
            // x ^ e_0 (where x is CNFOrdinal)
            if (base.isZero()) return CNFOrdinal.ZEROStatic().clone(base._tracer); // 0 ^ e_0 = 0
            if (base.equals(CNFOrdinal.ONEStatic())) return CNFOrdinal.ONEStatic().clone(base._tracer); // 1 ^ e_0 = 1
            // For any other CNFOrdinal x (finite m > 1, or infinite a), x ^ e_0 = e_0
            return new EpsilonNaughtOrdinal(base._tracer);
        } else if (exponent instanceof CNFOrdinal) {
            // CNFOrdinal ^ CNFOrdinal
            return base.powerCNF(exponent); // Call the original CNF-specific power function
        } else {
            throw new Error("Unsupported exponent type for CNFOrdinal base.");
        }
    } else {
        throw new Error("Unsupported base type for exponentiation.");
    }
}

/**
 * Raises this ordinal to the power of another ordinal. ( α^β )
 * Returns a new CNFOrdinal instance representing the result.
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
CNFOrdinal.prototype.powerCNF = function(exponentOrdinal) {
    if (!(exponentOrdinal instanceof CNFOrdinal)) {
        throw new Error("Exponent must be an CNFOrdinal type.");
    }
    if (this._tracer) this._tracer.consume();

    // Rule 1: β = 0. α^0 = 1.
    if (exponentOrdinal.isZero()) {
        return CNFOrdinal.ONEStatic().clone(this._tracer);
    }

    // Rule 2: α = 0. 0^β = 0 (for β > 0).
    if (this.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer);
    }

    // Rule 3: α = 1. 1^β = 1.
    if (this.equals(CNFOrdinal.ONEStatic())) {
        return CNFOrdinal.ONEStatic().clone(this._tracer);
    }

    // Rule 4: β = 1. α^1 = α.
    if (exponentOrdinal.equals(CNFOrdinal.ONEStatic())) {
        return this.clone();
    }

    const base = this;
    const exponent = exponentOrdinal;

    // Rule 5: α, β finite positive integers.
    if (base.isFinite() && exponent.isFinite()) {
        const baseVal = base.getFinitePart();
        const expVal = exponent.getFinitePart();

        if (this._tracer) this._tracer.consume();
        
        let resultVal;
        if (baseVal === 0n && expVal > 0n) {
            resultVal = 0n;
        } else {
            try {
                resultVal = baseVal ** expVal;
            } catch (e) {
                throw new Error(`BigInt exponentiation error for ${baseVal}^${expVal}: ${e.message}`);
            }
        }
        return new CNFOrdinal(resultVal, this._tracer);
    }

    // Rule 6: α = k (finite, k≥2n), β infinite.
    if (base.isFinite() && !exponent.isFinite()) {
        const k = base.getFinitePart();
        if (k < 2n) { 
            throw new Error("Base < 2n in finite^infinite case, should be handled earlier.");
        }

        const r_val = exponent.getFinitePart();
        const B_exp = exponent.getLimitPart();

        if (B_exp.isZero()) {
            if (this._tracer) this._tracer.consume();
            const resultVal_k_pow_r = k ** r_val;
            return new CNFOrdinal(resultVal_k_pow_r, this._tracer);
        }
        
        if (this._tracer) this._tracer.consume(2);
        const xi_exp = B_exp.divideByOmega();
        
        const k_pow_r_val = k ** r_val;
        const k_pow_r_ord = new CNFOrdinal(k_pow_r_val, this._tracer);
        
        const omega_pow_xi = new CNFOrdinal([{ exponent: xi_exp, coefficient: 1n }], this._tracer);
        
        if (this._tracer) this._tracer.consume();
        return omega_pow_xi.multiply(k_pow_r_ord);
    }

    // Rule 7: α infinite, β = m (finite BigInt, m ≥ 2n).
    if (!base.isFinite() && exponent.isFinite()) {
        const m = exponent.getFinitePart();

        if (m < 0n) { 
            throw new Error("Finite exponent cannot be negative in ordinal exponentiation.");
        }

        if (base.terms.length === 1) {
            const baseLeadTerm = base.terms[0];
            const a_ord = baseLeadTerm.exponent;
            const c_val = baseLeadTerm.coefficient;

            if (this._tracer) this._tracer.consume(1);

            const m_as_ordinal = new CNFOrdinal(m, this._tracer);
            
            const new_omega_exponent = a_ord.multiply(m_as_ordinal);
            
            return new CNFOrdinal([{ exponent: new_omega_exponent, coefficient: c_val }], this._tracer);
        }

        let result = CNFOrdinal.ONEStatic().clone(this._tracer);
        for (let i = 0n; i < m; i++) {
            if (this._tracer) this._tracer.consume();
            result = result.multiply(base);
        }
        return result;
    }

    // Rule 8: α infinite, β infinite. α^β = α^B * α^m
    if (!base.isFinite() && !exponent.isFinite()) {
        const m_val = exponent.getFinitePart();
        const B_exp_part = exponent.getLimitPart();

        if (this._tracer) this._tracer.consume();
        const alpha_pow_m = base.powerCNF(new CNFOrdinal(m_val, this._tracer));

        if (B_exp_part.isZero()) {
            return alpha_pow_m;
        }

        const leadingTerm_base = base.getLeadingTerm();
        if (!leadingTerm_base || leadingTerm_base.exponent.isZero()) {
            throw new Error("Internal error: Infinite base expected for α^B calculation.");
        }
        const alpha1 = leadingTerm_base.exponent;

        if (this._tracer) this._tracer.consume();
        const exp_for_omega_base = alpha1.multiply(B_exp_part);
        
        const alpha_pow_B = new CNFOrdinal([{
            exponent: exp_for_omega_base,
            coefficient: 1n
        }], this._tracer);

        if (this._tracer) this._tracer.consume();
        return alpha_pow_B.multiply(alpha_pow_m);
    }

    throw new Error("Unhandled case in CNFOrdinal.powerCNF");
};

// Add a general power method to CNFOrdinal prototype that calls the dispatcher
CNFOrdinal.prototype.power = function(otherOrdinal) {
    return powerOrdinals(this, otherOrdinal);
};

// Add a general power method to EpsilonNaughtOrdinal prototype that calls the dispatcher
EpsilonNaughtOrdinal.prototype.power = function(otherOrdinal) {
    return powerOrdinals(this, otherOrdinal);
};

// ordinal_exponentiation.js