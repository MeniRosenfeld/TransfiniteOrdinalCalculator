// ZetaZero.js
// Represents ζ₀, the smallest ordinal larger than any ENF

class ZetaZero extends OrdinalBase {
    constructor(operationTracer = null) {
        super(operationTracer);
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return false; }
    isLessThanEpsilon0() { return false; }
    // Exception: not less than ζ₀ (it equals ζ₀)
    isLessThanZeta0() { return false; }
    isOmega() { return false; }
    isBasic() { return true; }
    isOne() { return false; }
    isLimit() { return true; }
    isTower() { return true; }

    getFiniteBigInt() { throw new Error('ZetaZero is not finite'); }

    nextRank() { throw new Error('Numbers greater than ZetaZero are not implemented'); }

    complexity() { return 6; }

    toString() { return 'z_0'; }

    clone(newTracer = null) { return new ZetaZero(newTracer || this._tracer); }

    toFFormat() { return { type: 'zeta_zero' }; }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }
        const zero = new ZeroOrdinal(this._tracer);
        const zeroComplexity = zero.complexity();
        return {
            simplifiedOrdinal: zero,
            remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
        };
    }

    rank() { return this.clone(); }

    log() { return new OneOrdinal(this._tracer); }

    logStar() { return 1n; }

    isWellFormed() { return true; }

    getFinitePart() { return 0n; }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('ZetaZero is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'ZetaZero'; }
    static getDirectConversions() { return []; }
    convertTo(targetTypeName) {
        throw new Error(`ZetaZero cannot convert directly to ${targetTypeName}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZetaZero;
} else {
    // Browser global
    window.ZetaZero = ZetaZero;
}


