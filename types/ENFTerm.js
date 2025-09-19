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
        this.coefficient = coefficient;
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.coefficient === 0n; }
    isFinite() { return this.factors.length === 0; }
    isOne() { return this.isFinite() && this.coefficient === 1n; }
    isOmega() {
        return this.coefficient === 1n &&
            this.factors.length === 1 &&
            this.factors[0].base.isOmega() &&
            this.factors[0].exponent.isOne();
    }
    isBasic() { return this.isOmega() || (this.factors.length === 1 && this.factors[0].exponent.isOne() && this.coefficient === 1n); }
    isLimit() { return !this.isFinite(); }
    isTower() {
        if (this.coefficient !== 1n) return false;
        if (this.factors.length > 1) return false;
        if (this.factors.length === 0) return this.isOne(); // Finite 1 is a tower
        const factor = this.factors[0];
        return factor.base.isTower() && factor.exponent.isTower();
    }

    getFiniteBigInt() {
        if (!this.isFinite()) throw new Error('ENFTerm is not finite');
        return this.coefficient;
    }

    toString() {
        const factorStr = this.factors.map(f => f.toString()).join("*");
        if (this.isFinite()) {
            return this.coefficient.toString();
        }
        if (this.coefficient === 1n) {
            return factorStr;
        }
        // Parenthesize factors if there are more than one
        const needsParen = this.factors.length > 1;
        if (needsParen) {
            return `(${factorStr})*${this.coefficient}`;
        }
        return `${factorStr}*${this.coefficient}`;
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

        const leadingFactor = this.factors[0];
        const rank = this.rank();

        if (this.factors.length === 1 && this.coefficient === 1n) {
            // log(a^b) = b
            if (rank.compareTo(leadingFactor.base) === 0) {
                return leadingFactor.exponent.clone();
            }
        }

        // log((a^b)*c) = b if c is finite
        // log((a^b)*c) where c is not finite is more complex, for now we assume simple cases.
        // A term is (f1*f2...)*m. log is log(f1).
        return leadingFactor.exponent.clone();
    }

    logStar() {
        // This is complex for a single term. Let's start with a basic implementation.
        if (this.isFinite()) {
            return this.isZero() ? new FiniteOrdinal(-1n) : new ZeroOrdinal(this._tracer);
        }
        // 1 + log(this).logStar()
        const logVal = this.log();
        const logStarOfLog = logVal.logStar();
        return new FiniteOrdinal(1n + logStarOfLog);
    }

    // Dummy implementations for methods that will be more complex
    nextRank() { throw new Error("nextRank not implemented for ENFTerm"); }
    complexity() {
        let c = this.factors.reduce((sum, f) => sum + f.base.complexity() + f.exponent.complexity() + 2, 0);
        c += this.coefficient.toString().length;
        return c;
    }
    toFFormat() { throw new Error("toFFormat not implemented for ENFTerm"); }
    simplify() { return { simplifiedOrdinal: this.clone(), remainingBudget: 0 }; }

    // === CONVERSION SYSTEM ===
    static getTypeName() { return 'ENFTerm'; }
    static getDirectConversions() { return []; }
    convertTo(targetTypeName) {
        throw new Error(`ENFTerm cannot convert directly to ${targetTypeName}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENFTerm;
} else {
    // Browser global
    window.ENFTerm = ENFTerm;
}
