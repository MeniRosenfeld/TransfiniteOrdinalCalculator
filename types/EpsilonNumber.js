// EpsilonNumber.js
// Represents e_k for some ordinal k

/**
 * Represents an epsilon number, e_k, where k is an ordinal.
 * Epsilon numbers are fixed points of exponentiation: w^x = x.
 */
class EpsilonNumber extends OrdinalBase {
    constructor(k, operationTracer = null) {
        super(operationTracer);
        if (!k || !k.isOrdinal()) {
            throw new Error('EpsilonNumber index k must be a valid ordinal object');
        }
        this.k = k;
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return false; }
    isLessThanEpsilon0() { return false; }
    isOmega() { return false; }
    isBasic() { return true; }
    isOne() { return false; }
    isLimit() { return true; }
    isTower() { return true; }

    getFiniteBigInt() {
        throw new Error('EpsilonNumber is not finite');
    }

    nextRank() {
        return new EpsilonNumber(this.k.successor(), this._tracer);
    }

    complexity() {
        return this.k.complexity() + 6;
    }

    toString() {
        const kStr = this.k.toString();
        // Parenthesize only when necessary
        let needsParen = false;
        if (this.k instanceof CNFOrdinal) {
            needsParen = !(this.k.isFinite() || this.k.isOmega() || this.k.isOmegaPower());
        }

        if (needsParen) {
            return `e_(${kStr})`;
        } else {
            return `e_${kStr}`;
        }
    }

    toFFormat() {
        return { type: 'epsilon', index: this.k.toFFormat() };
    }

    clone(newTracer = null) {
        return new EpsilonNumber(this.k.clone(newTracer), newTracer || this._tracer);
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        const zero = new FiniteOrdinal(0, this._tracer);
        const zeroComplexity = zero.complexity();
        if (zeroComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: zero,
                remainingBudget: complexityBudget - zeroComplexity
            };
        }

        return { simplifiedOrdinal: zero, remainingBudget: 0 };
    }

    rank() {
        return this.clone();
    }

    log() {
        return new OneOrdinal(this._tracer);
    }

    logStar() {
        return new OneOrdinal(this._tracer);
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'EpsilonNumber'; }
    static getDirectConversions() { return []; }
    convertTo(targetTypeName) {
        throw new Error(`EpsilonNumber cannot convert directly to ${targetTypeName}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpsilonNumber;
} else {
    // Browser global
    window.EpsilonNumber = EpsilonNumber;
}
