// ENFTerm.js
// Represents a single term in an ENF sum.

/**
 * Represents a single additive term in an ENF expression.
 * A term is a product of ENFFactors and a finite coefficient.
 * e.g., (e_w^2 * w^3) * 5
 */
class ENFTerm extends OrdinalBase {
    /**
     * @param {Array<ENFFactor>} factors - An array of ENFFactor instances, sorted by descending base.
     * @param {BigInt} coefficient - The finite coefficient of the term.
     */
    constructor(factors = [], coefficient = 1n, operationTracer = null) {
        super(operationTracer);
        // Validation for factors can be added here (e.g., ensuring they are sorted)
        this.factors = factors;
        if (typeof coefficient !== 'bigint' || coefficient <= 0n) {
            throw new Error('ENFTerm coefficient must be a positive BigInt');
        }
        this.coefficient = coefficient;
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return this.factors.length === 0; }
    isOne() { return this.isFinite() && this.coefficient === 1n; }
    isOmega() {
        return this.coefficient === 1n &&
            this.factors.length === 1 &&
            this.factors[0].base.isOmega() &&
            this.factors[0].exponent.isOne();
    }
    isBasic() { return this.isOne() || (this.factors.length === 1 && this.factors[0].exponent.isOne() && this.coefficient === 1n); }
    isLimit() { return !this.isFinite(); }
    isTower() {
        if (this.coefficient !== 1n) return false;
        if (this.factors.length > 1) return false;
        if (this.factors.length === 0) return this.isOne(); // Finite 1 is a tower
        const factor = this.factors[0];
        return factor.base.equalTo(factor.exponent.rank()) && factor.exponent.isTower();
    }
    isLessThanEpsilon0() {
        if (this.isFinite()) return true;
        if (this.factors.length === 1) {
            const base = this.factors[0].base;
            if (base && typeof base.isOmega === 'function' && base.isOmega()) return true;
        }
        return false;
    }

    isLessThanZeta0() { return true; }

    isWellFormed() {
        // Finite term: no factors, coefficient >= 0
        if (this.isFinite()) {
            return this.factors.length === 0 && typeof this.coefficient === 'bigint' && this.coefficient >= 0n;
        }

        // Infinite term: at least one factor, coefficient >= 1
        if (!Array.isArray(this.factors) || this.factors.length === 0) return false;
        if (typeof this.coefficient !== 'bigint' || this.coefficient < 1n) return false;

        // Factors must be ENFFactor instances and strictly descending by base
        for (let i = 0; i < this.factors.length; i++) {
            const f = this.factors[i];
            if (!(f instanceof ENFFactor)) return false;
            // Exponent should be an ordinal and well-formed if available
            if (!f.exponent || !f.exponent.isOrdinal || !f.exponent.isOrdinal()) return false;
            if (typeof f.exponent.isWellFormed === 'function' && !f.exponent.isWellFormed()) return false;
            // Rank(exponent) <= base
            try {
                const expRank = f.exponent.rank();
                if (OPERATIONS.compare(expRank, f.base) > 0) return false;
            } catch (_) { return false; }
            // Strictly descending by base
            if (i + 1 < this.factors.length) {
                const next = this.factors[i + 1];
                const baseCmp = OPERATIONS.compare(f.base, next.base);
                if (!(baseCmp > 0)) return false;
            }
        }
        return true;
    }

    getFiniteBigInt() {
        if (!this.isFinite()) throw new Error('ENFTerm is not finite');
        return this.coefficient;
    }

    getFinitePart() {
        // ENFTerm: if finite, return coefficient; if infinite, return 0n
        return this.isFinite() ? this.coefficient : 0n;
    }

    needsParenthesesAsExponent() {
        // ENF terms need parentheses when they represent products:
        // - Multiple factors, OR
        // - Single factor with non-one coefficient (but not if no factors at all - that's just a finite number)
        return this.factors.length > 1 || (this.factors.length === 1 && this.coefficient !== 1n);
    }

    toString() {
        const factorStr = this.factors.map(f => f.toString()).join("*");
        if (this.isFinite()) {
            return this.coefficient.toString();
        }
        if (this.coefficient === 1n) {
            return factorStr;
        }
        // Coefficient is just another factor in the product, no parentheses needed
        return `${factorStr}*${this.coefficient}`;
    }

    toGraphicalHTML() {
        if (this.isFinite()) {
            return RenderingComponents.renderFinite(this.coefficient);
        }

        const factorHTMLs = this.factors.map(f => f.toGraphicalHTML ? f.toGraphicalHTML() : f.toString());
        
        if (this.coefficient === 1n) {
            return RenderingComponents.wrapTerm(RenderingComponents.joinFactors(factorHTMLs));
        } else {
            factorHTMLs.push(RenderingComponents.renderCoefficient(this.coefficient));
            return RenderingComponents.wrapTerm(RenderingComponents.joinFactors(factorHTMLs));
        }
    }

    clone(newTracer = null) {
        const newFactors = this.factors.map(f => f.clone());
        return new ENFTerm(newFactors, this.coefficient, newTracer || this._tracer);
    }

    rank() {
        if (this.isFinite()) {
            return this.isZero() ? new ZeroOrdinal(this._tracer) : new OneOrdinal(this._tracer);
        }
        return this.factors[0].base.clone();
    }

    log() {
        if (this.isFinite()) return new ZeroOrdinal(this._tracer);
        // For an infinite ENF term, the logarithm is the exponent of the leading factor
        return this.factors[0].exponent.clone();
    }

    logStar() {
        // Return BigInt per global contract
        if (this.isFinite()) {
            return this.isZero() ? -1n : 0n;
        }
        const logVal = this.log();
        const logStarOfLog = logVal.logStar(); // BigInt
        return 1n + logStarOfLog;
    }

    isEpsilonNumber() {
        // Must have coefficient of 1 and a single factor with exponent of 1 and base which is not omega
        if (this.coefficient !== 1n) return false;
        if (this.factors.length !== 1) return false;
        
        const factor = this.factors[0];
        if (!factor.exponent.isOne()) return false;
        if (factor.base.isOmega()) return false;
        
        return true;
    }

    epsilonIndex() {
        if (!this.isEpsilonNumber()) {
            throw new Error('ENFTerm is not an epsilon number');
        }
        
        const factor = this.factors[0];
        // If the base is an EpsilonNumber, return its index
        if (factor.base.isEpsilonNumber()) {
            return factor.base.epsilonIndex();
        }
        
        throw new Error('Cannot determine epsilon index for this ENFTerm');
    }

    // Dummy implementations for methods that will be more complex
    nextRank() { 
        if (this.factors.length === 0) {
            // Pure finite term - next rank is ω
            return new OmegaOrdinal(this._tracer);
        }
        
        const leadingFactor = this.factors[0];
        const leadingBase = leadingFactor.base;
        
        if (leadingBase.isOmega()) {
            // Base is ω, next rank is ε₀
            return new EpsilonZero(this._tracer);
        } else if (leadingBase.isEpsilonNumber()) {
            // Base is ε_k, next rank is ε_(k+1)
            const k = leadingBase.epsilonIndex();
            const kPlusOne = k.successor();
            return new EpsilonNumber(kPlusOne, this._tracer);
        } else {
            // For other bases, fall back to the base's nextRank
            return leadingBase.nextRank();
        }
    }
    complexity() {
        let c = this.factors.reduce((sum, f) => sum + f.base.complexity() + f.exponent.complexity() + 2, 0);
        c += this.coefficient.toString().length;
        return c;
    }
    toFFormat() { throw new Error("toFFormat not implemented for ENFTerm"); }
    simplify() { return { simplifiedOrdinal: this.clone(), remainingBudget: 0 }; }

    /**
     * Structural comparison ignoring coefficient.
     * Returns 1 if this > other, 0 if equal structure, -1 if less.
     */
    compareStructureTo(other) {
        if (!(other instanceof ENFTerm)) throw new Error('compareStructureTo expects ENFTerm');
        const aFactors = this.factors;
        const bFactors = other.factors;

        // Finite vs non-finite: any non-finite (has factors) > finite (no factors)
        const aFinite = (aFactors.length === 0);
        const bFinite = (bFactors.length === 0);
        if (aFinite && bFinite) return 0;
        if (aFinite) return -1;
        if (bFinite) return 1;

        const minLen = Math.min(aFactors.length, bFactors.length);
        for (let i = 0; i < minLen; i++) {
            const af = aFactors[i];
            const bf = bFactors[i];
            // Compare bases (both basic)
            const baseCmp = OPERATIONS.compare(af.base, bf.base);
            if (baseCmp !== 0) return baseCmp;
            // Compare exponents (ordinals)
            const expCmp = OPERATIONS.compare(af.exponent, bf.exponent);
            if (expCmp !== 0) return expCmp;
        }
        // Longer factor list is considered greater
        if (aFactors.length > bFactors.length) return 1;
        if (aFactors.length < bFactors.length) return -1;
        return 0;
    }

    /**
     * Full term comparison including coefficient when structures match.
     */
    compareTermTo(other) {
        const structCmp = this.compareStructureTo(other);
        if (structCmp !== 0) return structCmp;
        // Same structure; compare coefficients
        const aCoeff = this.isFinite() ? this.coefficient : this.coefficient;
        const bCoeff = other.isFinite() ? other.coefficient : other.coefficient;
        if (aCoeff < bCoeff) return -1;
        if (aCoeff > bCoeff) return 1;
        return 0;
    }

    // Backward-compat alias used by comparison rules
    compareTo(other) { return this.compareTermTo(other); }

    // === CONVERSION SYSTEM ===
    static getTypeName() { return 'ENFTerm'; }
    static getDirectConversions() { return ['ENF']; }
    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'ENF':
                if (typeof ENFOrdinal !== 'undefined') {
                    // Convert ENFTerm to ENFOrdinal with single term
                    return new ENFOrdinal([this], this._tracer);
                }
                throw new Error('ENFOrdinal conversion not available for ENFTerm');
            default:
                throw new Error(`ENFTerm cannot convert directly to ${targetTypeName}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENFTerm;
} else {
    // Browser global
    window.ENFTerm = ENFTerm;
}
