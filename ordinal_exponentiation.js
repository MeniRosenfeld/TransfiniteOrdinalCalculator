// ordinal_exponentiation.js

// Assumes CNFOrdinal, EpsilonOrdinal, WTowerOrdinal classes and their helpers are defined.
// Assumes comparison, addition, multiplication, auxiliary ops are defined.

/**
 * Raises this CNFOrdinal to the power of another CNFOrdinal. ( α^β )
 * This is the specific implementation for CNFOrdinal ^ CNFOrdinal.
 */
CNFOrdinal.prototype.powerCNF = function (exponentCNF) {
    if (!(exponentCNF instanceof CNFOrdinal)) {
        throw new Error("Exponent must be a CNFOrdinal for powerCNF.");
    }
    if (this._tracer) this._tracer.consume();

    if (exponentCNF.isZero()) {
        return CNFOrdinal.ONEStatic().clone(this._tracer);
    }
    if (this.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer);
    }
    if (this.equals(CNFOrdinal.ONEStatic())) {
        return CNFOrdinal.ONEStatic().clone(this._tracer);
    }
    if (exponentCNF.equals(CNFOrdinal.ONEStatic())) {
        return this.clone();
    }

    const base = this;
    const exponent = exponentCNF;

    if (base.isFinite() && exponent.isFinite()) {
        const baseVal = base.getFinitePart();
        const expVal = exponent.getFinitePart();
        if (this._tracer) this._tracer.consume();
        let resultVal;
        try {
            resultVal = baseVal ** expVal;
        } catch (e) {
            throw new Error(`BigInt exponentiation error for ${baseVal}^${expVal}: ${e.message}`);
        }
        return new CNFOrdinal(resultVal, this._tracer);
    }

    if (base.isFinite() && !exponent.isFinite()) {
        const k = base.getFinitePart();
        if (k < 2n) {
            throw new Error("Base k < 2 in k^Inf computation not handled by this rule directly (0^Inf=0, 1^Inf=1 handled).");
        }
        const r_val = exponent.getFinitePart();
        const B_exp = exponent.getLimitPart();

        if (B_exp.isZero()) { // Should be caught by exponent.isFinite(), but defensive
            if (this._tracer) this._tracer.consume();
            return new CNFOrdinal(k ** r_val, this._tracer);
        }

        if (this._tracer) this._tracer.consume(2);
        const xi_exp = B_exp.divideByOmega();
        const k_pow_r_val = k ** r_val;
        const k_pow_r_ord = new CNFOrdinal(k_pow_r_val, this._tracer);
        const omega_pow_xi = new CNFOrdinal([{ exponent: xi_exp, coefficient: 1n }], this._tracer);

        if (this._tracer) this._tracer.consume();
        return omega_pow_xi.multiply(k_pow_r_ord);
    }

    if (!base.isFinite() && exponent.isFinite()) {
        const m = exponent.getFinitePart();
        if (m < 0n) {
            throw new Error("Finite exponent cannot be negative in ordinal exponentiation.");
        }
        // Optimized case for (w^a*c)^m = w^(a*m)*c^m if c is 1 (or handled carefully)
        // For (w^a*c)^m = w^(a*m)*c is only if m is finite and c is absorbed or rule applies differently
        // The rule is (ω^a c)^m = ω^(am) c  -- if c is finite.
        // If base is (X)^m, it's iterated multiplication.
        // If base is (w^a)^m = w^(a*m)
        // If base is (w^a * c)^m = w^(a*m) * c (if c doesn't interact complexly, often assumed c=1 or absorbed)
        // Let's stick to iterated multiplication for general (A+n)^m where m is finite.
        // However, for (w^a * c)^m = w^(a*m) * c if c is a finite number coeff.
        // The current implementation for single term base: (w^a*c_val)^m -> w^(a*m)*c_val.
        // This is correct under assumption that c_val does not grow ordinally.

        if (base.terms.length === 1 && base.terms[0].coefficient === 1n) { // (w^a)^m = w^(a*m)
            const a_ord = base.terms[0].exponent;
            if (this._tracer) this._tracer.consume(1);
            const m_as_ordinal = new CNFOrdinal(m, this._tracer);
            const new_omega_exponent = a_ord.multiply(m_as_ordinal);
            return new CNFOrdinal([{ exponent: new_omega_exponent, coefficient: 1n }], this._tracer);
        }
        // General case: (X)^m = X * X * ... * X (m times)
        let result = CNFOrdinal.ONEStatic().clone(this._tracer);
        for (let i = 0n; i < m; i++) {
            if (this._tracer) this._tracer.consume();
            result = result.multiply(base);
        }
        return result;
    }

    if (!base.isFinite() && !exponent.isFinite()) {
        const m_val = exponent.getFinitePart();
        const B_exp_part = exponent.getLimitPart();

        if (this._tracer) this._tracer.consume();
        const alpha_pow_m = base.powerCNF(new CNFOrdinal(m_val, this._tracer));

        if (B_exp_part.isZero()) { // Should be caught by exponent.isFinite(), but defensive
            return alpha_pow_m;
        }

        const leadingTerm_base = base.getLeadingTerm();
        if (!leadingTerm_base || leadingTerm_base.exponent.isZero()) {
            throw new Error("Internal error: Infinite base expected for α^B calculation.");
        }
        const alpha1 = leadingTerm_base.exponent;

        if (this._tracer) this._tracer.consume();
        const exp_for_omega_base = alpha1.multiply(B_exp_part);
        const alpha_pow_B = new CNFOrdinal([{ exponent: exp_for_omega_base, coefficient: 1n }], this._tracer);

        if (this._tracer) this._tracer.consume();
        return alpha_pow_B.multiply(alpha_pow_m);
    }
    throw new Error("Unhandled case in CNFOrdinal.powerCNF");
};

/**
 * General ordinal exponentiation dispatcher.
 */
function powerOrdinals(base, exponent) {
    if (base._tracer) base._tracer.consume();

    // Convert all operands to CNFOrdinal first to ensure consistent types.
    const baseCNF = (base instanceof CNFOrdinal) ? base : new CNFOrdinal(base, base._tracer);
    const exponentCNF = (exponent instanceof CNFOrdinal) ? exponent : new CNFOrdinal(exponent, exponent._tracer);

    // Handle identity cases first.
    if (exponentCNF.isZero()) {
        return CNFOrdinal.ONEStatic().clone(base._tracer);
    }
    if (exponentCNF.equals(CNFOrdinal.ONEStatic())) {
        return baseCNF.clone();
    }
    if (baseCNF.equals(CNFOrdinal.ONEStatic())) {
        return CNFOrdinal.ONEStatic().clone(base._tracer);
    }
    if (baseCNF.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(base._tracer);
    }

    // Critical identity: w^e_k = e_k
    if (baseCNF.isOmega() && exponent instanceof EpsilonOrdinal) {
        return exponent.clone();
    }

    // Rule: a^e_k = e_k for 2 <= a < e_k
    const two = CNFOrdinal.fromInt(2);
    if (exponent instanceof EpsilonOrdinal && baseCNF.compareTo(two) >= 0 && baseCNF.compareTo(exponent) < 0) {
        return exponent.clone();
    }

    return baseCNF.powerCNF(exponentCNF);
}

// Public API for power on prototypes
CNFOrdinal.prototype.power = function (otherOrdinal) {
    return powerOrdinals(this, otherOrdinal);
};
EpsilonOrdinal.prototype.power = function (otherOrdinal) {
    return powerOrdinals(this, otherOrdinal);
};
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.power = function (otherOrdinal) {
        return powerOrdinals(this, otherOrdinal);
    };
}