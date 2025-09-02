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
 * Converts various ordinal types to a unified ENFOrdinal representation.
 * @param {Ordinal} ord The ordinal to convert.
 * @returns {ENFOrdinal}
 */
function convertToENF(ord) {
    return ENFOrdinal.fromCNF(ord);
}

function cnfHasEpsilonStructure(cnf) {
    if (!(cnf instanceof CNFOrdinal)) return true;
    for (const t of cnf.terms) {
        if (t.exponent instanceof EpsilonOrdinal) return true;
    }
    return false;
}


/**
 * General ordinal exponentiation dispatcher.
 */
function powerOrdinals(base, exponent) {
    // Special-case: e_k ^ (e_k^^n) -> EpsilonTowerOrdinal(k, n+1)
    try {
        if (typeof EpsilonTowerOrdinal !== 'undefined') {
            // Detect exponent as EpsilonTowerOrdinal
            if (exponent instanceof EpsilonTowerOrdinal) {
                // Detect base is exactly e_k where k equals exponent.k
                let baseIsEpsilonWithSameK = false;
                if (base instanceof EpsilonOrdinal) {
                    baseIsEpsilonWithSameK = base.index.equals(exponent.k);
                } else if (base instanceof CNFOrdinal) {
                    // CNF representing epsilon e_k is w^(e_k) with coeff 1
                    if (!base.isFinite() && base.terms.length === 1 && base.terms[0].coefficient === 1n && base.terms[0].exponent instanceof EpsilonOrdinal) {
                        baseIsEpsilonWithSameK = base.terms[0].exponent.index.equals(exponent.k);
                    }
                }
                if (baseIsEpsilonWithSameK) {
                    return new EpsilonTowerOrdinal(exponent.k.clone ? exponent.k.clone() : exponent.k, exponent.height + 1);
                }
            }
        }
    } catch (_) { /* fall through to normal dispatch */ }

    // Prefer CNF path when both operands are CNF and do not involve epsilon structure
    if (base instanceof CNFOrdinal && exponent instanceof CNFOrdinal && !cnfHasEpsilonStructure(base) && !cnfHasEpsilonStructure(exponent)) {
        return base.powerCNF(exponent);
    }
    // Otherwise, use ENF rank-aware power
    const baseENF = convertToENF(base);
    const exponentENF = convertToENF(exponent);
    return baseENF.power(exponentENF);
}

// Public API for power on prototypes (central registry)
CNFOrdinal.prototype.power = function (otherOrdinal) { return powerOrdinals(this, otherOrdinal); };
EpsilonOrdinal.prototype.power = function (otherOrdinal) { return powerOrdinals(this, otherOrdinal); };
if (typeof WTowerOrdinal !== 'undefined') { WTowerOrdinal.prototype.power = function (otherOrdinal) { return powerOrdinals(this, otherOrdinal); }; }