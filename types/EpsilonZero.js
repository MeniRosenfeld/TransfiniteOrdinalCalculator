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
        return new FiniteOrdinal(1n, this._tracer);
    }

    isTower() {
        return true;
    }

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
    static getDirectConversions() { return []; }
    convertTo(targetTypeName) {
        throw new Error(`EpsilonZero cannot convert directly to ${targetTypeName}`);
    }

    nextRank() {
        // Will be e_1 once general epsilons exist
        throw new Error('nextRank for EpsilonZero is not implemented yet');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpsilonZero;
} else {
    // Browser global
    window.EpsilonZero = EpsilonZero;
}


