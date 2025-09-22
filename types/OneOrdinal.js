// OneOrdinal.js
// Represents the specific ordinal 1.

/**
 * Represents the finite ordinal number 1.
 * This is a specialized type for a common value.
 */
class OneOrdinal extends OrdinalBase {
    constructor(operationTracer = null) {
        super(operationTracer);
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return true; }
    isLessThanEpsilon0() { return true; }
    isOmega() { return false; }
    isBasic() { return false; }
    isOne() { return true; }
    isLimit() { return false; }
    isTower() { return true; }

    isWellFormed() { return true; }

    getFiniteBigInt() { return 1n; }

    getFinitePart() { return 1n; }
    needsParenthesesAsExponent() { return false; }

    nextRank() {
        return new OmegaOrdinal(this._tracer);
    }

    complexity() { return 1; }

    toString() { return "1"; }

    toFFormat() { return 1n; }

    clone(newTracer = null) {
        return new OneOrdinal(newTracer || this._tracer);
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this.complexity() <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - this.complexity()
            };
        }
        // Fallback to 0 if 1 doesn't fit
        const zero = new ZeroOrdinal(this._tracer);
        return { simplifiedOrdinal: zero, remainingBudget: complexityBudget };
    }

    rank() {
        return new OneOrdinal(this._tracer);
    }

    log() {
        return new ZeroOrdinal(this._tracer);
    }

    logStar() {
        return 0n;
    }

    successor() {
        return new FiniteOrdinal(2n, this._tracer);
    }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('OneOrdinal is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'One'; }
    static getDirectConversions() { return ['Finite', 'WTower']; }
    convertTo(targetTypeName) {
        if (targetTypeName === 'Finite') return new FiniteOrdinal(1n, this._tracer);
        if (targetTypeName === 'WTower') return new WTowerOrdinal(0n, this._tracer);
        throw new Error(`OneOrdinal cannot convert directly to ${targetTypeName}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OneOrdinal;
} else {
    // Browser global
    window.OneOrdinal = OneOrdinal;
}
