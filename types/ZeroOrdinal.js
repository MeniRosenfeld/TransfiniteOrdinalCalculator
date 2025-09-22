// ZeroOrdinal.js
// Represents the specific ordinal 0.

/**
 * Represents the finite ordinal number 0.
 * This is a specialized type for a common value.
 */
class ZeroOrdinal extends OrdinalBase {
    constructor(operationTracer = null) {
        super(operationTracer);
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return true; }
    isFinite() { return true; }
    isLessThanEpsilon0() { return true; }
    isOmega() { return false; }
    isBasic() { return false; }
    isOne() { return false; }
    isLimit() { return false; }
    isTower() { return true; }

    isWellFormed() { return true; }

    getFiniteBigInt() { return 0n; }

    getFinitePart() { return 0n; }
    needsParenthesesAsExponent() { return false; }

    nextRank() {
        return new OneOrdinal(this._tracer);
    }

    complexity() { return 0; }

    toString() { return "0"; }

    toFFormat() { return 0n; }

    clone(newTracer = null) {
        return new ZeroOrdinal(newTracer || this._tracer);
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        // 0 is already as simple as it gets.
        return {
            simplifiedOrdinal: this.clone(),
            remainingBudget: complexityBudget // Consumes 0 budget
        };
    }

    rank() {
        return new ZeroOrdinal(this._tracer);
    }

    log() {
        // log(0) is undefined
        throw new Error('Log of 0 is undefined.');
    }

    logStar() {
        return -1n;
    }

    successor() {
        return new OneOrdinal(this._tracer);
    }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('ZeroOrdinal is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'Zero'; }
    static getDirectConversions() { return ['Finite', 'WTower']; }
    convertTo(targetTypeName) {
        if (targetTypeName === 'Finite') return new FiniteOrdinal(0n, this._tracer);
        if (targetTypeName === 'WTower') return new WTowerOrdinal(-1n, this._tracer);
        throw new Error(`ZeroOrdinal cannot convert directly to ${targetTypeName}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZeroOrdinal;
} else {
    // Browser global
    window.ZeroOrdinal = ZeroOrdinal;
}
