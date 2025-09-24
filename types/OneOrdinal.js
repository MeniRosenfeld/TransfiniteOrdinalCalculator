// OneOrdinal.js
// Represents the specific ordinal 1.

/**
 * Represents the finite ordinal number 1.
 * This is a specialized type for a common value.
 */
class OneOrdinal extends OrdinalBase {
    constructor() {
        super();
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
        return new OmegaOrdinal();
    }

    complexity() { return 1; }

    toString() { return "1"; }

    toGraphicalHTML() {
        return RenderingComponents.renderFinite(1);
    }

    toFFormat() { return 1n; }

    clone() {
        return new OneOrdinal();
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this.complexity() <= complexityBudget) {
            return {
                simplifiedOrdinal: this,
                remainingBudget: complexityBudget - this.complexity()
            };
        }
        // Fallback to 0 if 1 doesn't fit
        const zero = new ZeroOrdinal();
        return { simplifiedOrdinal: zero, remainingBudget: complexityBudget };
    }

    rank() {
        return new OneOrdinal();
    }

    log() {
        return new ZeroOrdinal();
    }

    logStar() {
        return 0n;
    }

    successor() {
        return new FiniteOrdinal(2n);
    }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('OneOrdinal is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'One'; }
    static getDirectConversions() { return ['Finite', 'WTower']; }
    convertTo(targetTypeName) {
        if (targetTypeName === 'Finite') return new FiniteOrdinal(1n);
        if (targetTypeName === 'WTower') return new WTowerOrdinal(0n);
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
