// ENFOrdinal.js
// Epsilon Normal Form ordinal representation

/**
 * Represents an ordinal in Epsilon Normal Form (ENF).
 * ENF is a sum of ENFTerms: t1 + t2 + ... + tn
 * where t1 > t2 > ... > tn.
 */
class ENFOrdinal extends OrdinalBase {
    constructor(terms = [], operationTracer = null) {
        super(operationTracer);
        // Validation: ensure it's an array of ENFTerm instances
        if (!Array.isArray(terms) || !terms.every(t => t instanceof ENFTerm)) {
            throw new Error("ENFOrdinal constructor expects an array of ENFTerm instances.");
        }
        this.terms = terms;
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.terms.length === 0; }
    isFinite() {
        if (this.isZero()) return true;
        // An ENF sum is finite iff all its terms are finite
        return this.terms.every(t => t.isFinite());
    }
    isLessThanEpsilon0() { return false; } // Generally, ENF is for ordinals >= e_0
    isOmega() {
        return this.terms.length === 1 && this.terms[0].isOmega();
    }
    isBasic() {
        return this.terms.length === 1 && this.terms[0].isBasic();
    }
    isOne() {
        return this.terms.length === 1 && this.terms[0].isOne();
    }
    isLimit() {
        if (this.isZero()) return false;
        // A sum is a limit if its last term is a limit
        return this.terms[this.terms.length - 1].isLimit();
    }
    isTower() {
        if (this.isZero()) return false; // Or true for 0? Let's be consistent. Finite 0 is not a tower.
        if (this.terms.length !== 1) return false;
        return this.terms[0].isTower();
    }

    getFiniteBigInt() {
        if (!this.isFinite()) {
            throw new Error('ENFOrdinal is not finite');
        }
        if (this.isZero()) return 0n;
        // Sum of coefficients of all (finite) terms
        return this.terms.reduce((sum, term) => sum + term.getFiniteBigInt(), 0n);
    }

    toString() {
        if (this.isZero()) return "0";
        return this.terms.map(t => t.toString()).join("+");
    }

    clone(newTracer = null) {
        const newTerms = this.terms.map(t => t.clone(newTracer));
        return new ENFOrdinal(newTerms, newTracer || this._tracer);
    }

    rank() {
        if (this.isZero()) return new ZeroOrdinal(this._tracer);
        return this.terms[0].rank();
    }

    log() {
        if (this.isZero()) throw new Error("Log of 0 is undefined.");
        return this.terms[0].log();
    }

    logStar() {
        if (this.isZero()) return new FiniteOrdinal(-1n, this._tracer);
        return this.terms[0].logStar();
    }

    // Methods that need more complex implementation
    nextRank() {
        if (this.isZero()) {
            return new EpsilonNumber(new ZeroOrdinal(this._tracer), this._tracer);
        }
        return this.terms[0].nextRank();
    }
    complexity() {
        if (this.isZero()) return 0;
        let total = this.terms.map(t => t.complexity()).reduce((a, b) => a + b, 0);
        total += this.terms.length - 1; // For the '+' signs
        return total;
    }
    toFFormat() {
        // This remains complex and will be addressed later.
        if (this.terms.length === 1) {
            return this.terms[0].toFFormat();
        }
        throw new Error("toFFormat for ENF sums not yet implemented.");
    }
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this.complexity() <= complexityBudget) {
            return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - this.complexity() };
        }
        // Proper simplification would truncate terms. For now, fallback to 0.
        return { simplifiedOrdinal: new ZeroOrdinal(this._tracer), remainingBudget: complexityBudget };
    }

    // === CONVERSION SYSTEM ===
    static getTypeName() { return 'ENF'; }
    static getDirectConversions() { return ['CNF']; }
    convertTo(targetTypeName) {
        if (targetTypeName === 'CNF') {
            throw new Error("ENF to CNF conversion not yet implemented.");
        }
        throw new Error(`ENFOrdinal cannot convert directly to ${targetTypeName}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENFOrdinal;
} else {
    // Browser global
    window.ENFOrdinal = ENFOrdinal;
}
