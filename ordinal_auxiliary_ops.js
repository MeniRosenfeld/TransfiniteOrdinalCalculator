// ordinal_auxiliary_ops.js

// Assumes Ordinal class and its basic methods (isZero, isFinite, getFinitePart, clone, etc.)
// from ordinal_types.js are defined.
// Assumes Ordinal.prototype.compareTo from ordinal_comparison.js is defined.
// Assumes Ordinal.prototype.add, Ordinal.prototype.subtract (if we were to implement it fully)
// would be in their respective files. For now, predecessor might involve manual term manipulation.

/**
 * Computes the predecessor of this ordinal, γ⊖1.
 * Used primarily for exponent arithmetic, e.g., in k^β or B/ω.
 * - If γ = δ+1 (successor), γ⊖1 = δ.
 * - If γ is finite > 0, γ⊖1 = γ-1.
 * - If γ is limit, γ⊖1 = γ.
 * - If γ = 0, γ⊖1 = 0 (convention for non-negative exponent results).
 * @returns {Ordinal} A new Ordinal instance representing the predecessor.
 */
Ordinal.prototype.exponentPredecessor = function() {
    if (this._tracer) this._tracer.consume(); // Count as an operation

    if (this.isZero()) {
        return Ordinal.ZEROStatic().clone(this._tracer); // 0 ⊖ 1 = 0 (convention)
    }

    if (this.isFinite()) {
        // Finite and non-zero, so it's just n. n-1.
        // this.terms[0].coefficient is a BigInt
        const n = this.terms[0].coefficient;
        if (n === 1n) return Ordinal.ZEROStatic().clone(this._tracer); // 1n - 1n = 0n
        // Create a new Ordinal with coefficient n - 1n
        return new Ordinal([{ exponent: Ordinal.ZEROStatic(), coefficient: n - 1n }], this._tracer);
    }

    // Infinite ordinal: Check if it's a successor or limit
    // A successor ordinal in CNF has a finite part > 0 (i.e., a w^0 term).
    // Or, more generally, its last term is w^0 * c.
    const lastTermIndex = this.terms.length - 1;
    const lastTerm = this.terms[lastTermIndex]; // lastTerm.coefficient is BigInt

    if (lastTerm.exponent.isZero()) { // It's a successor form A + n where n > 0n
        const newTerms = this.terms.map(t => ({ // Deep clone terms for modification
            exponent: t.exponent.clone(this._tracer),
            coefficient: t.coefficient // coefficient is already BigInt
        }));

        if (lastTerm.coefficient > 1n) { // Compare with BigInt 1n
            newTerms[lastTermIndex].coefficient -= 1n; // BigInt subtraction
        } else {
            // Coefficient was 1n, so this term (w^0 * 1n) is removed
            newTerms.pop();
        }
        // If newTerms becomes empty, it means original was "1", handled by isFinite.
        // Or if it was w+1 -> w. Or w^2+1 -> w^2.
        return new Ordinal(newTerms, this._tracer); // Constructor will normalize
    } else {
        // It's a limit ordinal (e.g., w, w^2, w*2, w^w). Predecessor is itself.
        return this.clone();
    }
};

/**
 * Computes ξ = B / ω, where B is typically the limit part of an exponent.
 * B = ω^β₁*b₁ + ω^β₂*b₂ + ...
 * ξ = ω^(β₁⊖1)*b₁ + ω^(β₂⊖1)*b₂ + ...
 * This operation is used in the rule k^β = ω^ξ * k^r where β = ωξ + r.
 * Assumes `this` is the ordinal B (should be composed of terms with exp > 0).
 * @returns {Ordinal} A new Ordinal instance representing ξ.
 */
Ordinal.prototype.divideByOmega = function() {
    if (this._tracer) this._tracer.consume(); // Count as an operation

    if (this.isZero() || this.isFinite()) {
        // If B is 0 or finite, B/w = 0.
        return Ordinal.ZEROStatic().clone(this._tracer);
    }

    const newTerms = [];
    for (const term of this.terms) { // term.coefficient is already BigInt
        // Original term: ω^βᵢ * bᵢ
        // New exponent: βᵢ ⊖ 1
        const newExponent = term.exponent.exponentPredecessor();

        // If the original exponent was ω (i.e., βᵢ = 1), then βᵢ⊖1 = 0.
        // The new term becomes ω^0 * bᵢ, which is just the coefficient bᵢ.
        // This new term's exponent is Ordinal.ZERO.
        // Coefficients are BigInts, so term.coefficient > 0n check implicitly done by Ordinal constructor
        if (!newExponent.isZero() || term.coefficient > 0n) { 
             // If newExponent became Ordinal.ZERO, this term contributes to the finite part of xi.
            newTerms.push({ exponent: newExponent, coefficient: term.coefficient });
        }
    }

    const result = new Ordinal(newTerms, this._tracer);
    result._normalize(); // Ensure the result is in proper CNF (e.g. w/w = 1)
    return result;
};

// ordinal_auxiliary_ops.js