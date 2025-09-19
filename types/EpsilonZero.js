// EpsilonZero.js
// Represents ε₀, the first fixed point of ω^x = x

class EpsilonZero extends OrdinalBase {
    constructor(operationTracer = null) {
        super(operationTracer);
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return false; }
    isLessThanEpsilon0() { return false; }
    isOmega() { return false; }
    isBasic() { return true; }
    isOne() { return false; }

    isLimit() {
        return true;
    }

    rank() {
        return new EpsilonZero(this._tracer);
    }

    log() {
        return new FiniteOrdinal(1n, this._tracer);
    }

    logStar() {
        return 1n;
    }

    isTower() {
        return true;
    }

    isWellFormed() { return true; }

    complexity() { return 6; }

    toString() { return 'e_0'; }

    toGraphicalHTML() { return RenderingComponents.renderEpsilonZero(); }

    clone(newTracer = null) { return new EpsilonZero(newTracer || this._tracer); }

    toFFormat() {
        return { type: 'epsilon', index: 0n };
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

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'EpsilonZero'; }
    static getDirectConversions() { return ['EpsilonNumber']; }
    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'EpsilonNumber':
                return new EpsilonNumber(new ZeroOrdinal(this._tracer), this._tracer);
            default:
                throw new Error(`EpsilonZero cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank() {
        // nextRank for e_0 is e_1
        return new EpsilonNumber(new OneOrdinal(this._tracer), this._tracer);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpsilonZero;
} else {
    // Browser global
    window.EpsilonZero = EpsilonZero;
}


