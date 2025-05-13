// ordinal_auxiliary_ops.js

// Assumes CNFOrdinal class and its basic methods (isZero, isFinite, getFinitePart, clone, etc.)
// from ordinal_types.js are defined.
// Assumes CNFOrdinal.prototype.compareTo from ordinal_comparison.js is defined.
// Assumes CNFOrdinal.prototype.add, CNFOrdinal.prototype.subtract (if we were to implement it fully)
// would be in their respective files. For now, predecessor might involve manual term manipulation.

/**
 * Computes the predecessor of this ordinal, γ⊖1.
 * Used primarily for exponent arithmetic, e.g., in k^β or B/ω.
 * - If γ = δ+1 (successor), γ⊖1 = δ.
 * - If γ is finite > 0, γ⊖1 = γ-1.
 * - If γ is limit, γ⊖1 = γ.
 * - If γ = 0, γ⊖1 = 0 (convention for non-negative exponent results).
 * @returns {CNFOrdinal} A new CNFOrdinal instance representing the predecessor.
 */
CNFOrdinal.prototype.exponentPredecessor = function() {
    if (this._tracer) this._tracer.consume(); // Count as an operation

    if (this.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer); // Use CNFOrdinal
    }

    if (this.isFinite()) {
        const n = this.terms[0].coefficient;
        if (n === 1n) return CNFOrdinal.ZEROStatic().clone(this._tracer); // Use CNFOrdinal
        return new CNFOrdinal([{ exponent: CNFOrdinal.ZEROStatic(), coefficient: n - 1n }], this._tracer); // Use CNFOrdinal
    }

    const lastTermIndex = this.terms.length - 1;
    const lastTerm = this.terms[lastTermIndex]; 

    if (lastTerm.exponent.isZero()) { 
        const newTerms = this.terms.map(t => ({ 
            exponent: t.exponent.clone(this._tracer),
            coefficient: t.coefficient 
        }));

        if (lastTerm.coefficient > 1n) { 
            newTerms[lastTermIndex].coefficient -= 1n; 
        } else {
            newTerms.pop();
        }
        return new CNFOrdinal(newTerms, this._tracer); // Use CNFOrdinal
    } else {
        return this.clone();
    }
};

/**
 * Computes ξ = B / ω, where B is typically the limit part of an exponent.
 * B = ω^β₁*b₁ + ω^β₂*b₂ + ...
 * ξ = ω^(β₁⊖1)*b₁ + ω^(β₂⊖1)*b₂ + ...
 * This operation is used in the rule k^β = ω^ξ * k^r where β = ωξ + r.
 * Assumes `this` is the ordinal B (should be composed of terms with exp > 0).
 * @returns {CNFOrdinal} A new CNFOrdinal instance representing ξ.
 */
CNFOrdinal.prototype.divideByOmega = function() {
    if (this._tracer) this._tracer.consume(); 

    if (this.isZero() || this.isFinite()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer); // Use CNFOrdinal
    }

    const newTerms = [];
    for (const term of this.terms) { 
        const newExponent = term.exponent.exponentPredecessor();

        if (!newExponent.isZero() || term.coefficient > 0n) { 
            newTerms.push({ exponent: newExponent, coefficient: term.coefficient });
        }
    }

    const result = new CNFOrdinal(newTerms, this._tracer); // Use CNFOrdinal
    result._normalize(); 
    return result;
};

// ordinal_auxiliary_ops.js