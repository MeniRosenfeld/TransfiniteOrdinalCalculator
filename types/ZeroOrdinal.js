// ZeroOrdinal.js
// Represents the specific ordinal 0.

/**
 * Represents the finite ordinal number 0.
 * This is a specialized type for a common value.
 */
class ZeroOrdinal extends OrdinalBase {
    constructor() {
        super();
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
        return OneOrdinal.instance();
    }

    complexity() { return 0; }

    toString() { return "0"; }

    toGraphicalHTML() {
        return RenderingComponents.renderFinite(0);
    }

    toFFormat() { return 0n; }

    clone() {
        return ZeroOrdinal.instance();
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        // 0 is already as simple as it gets.
        return {
            simplifiedOrdinal: this,
            remainingBudget: complexityBudget // Consumes 0 budget
        };
    }

    rank() {
        return ZeroOrdinal.instance();
    }

    log() {
        // log(0) is undefined
        throw new Error('Log of 0 is undefined.');
    }

    logStar() {
        return -1n;
    }

    successor() {
        return OneOrdinal.instance();
    }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('ZeroOrdinal is not an epsilon number');
    }

    // === SINGLETON INSTANCE ===

    static _instance = null;

    static instance() {
        if (!ZeroOrdinal._instance) {
            ZeroOrdinal._instance = new ZeroOrdinal();
        }
        return ZeroOrdinal._instance;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'Zero'; }
    static getDirectConversions() { return ['Finite', 'WTower']; }
    convertTo(targetTypeName) {
        if (targetTypeName === 'Finite') return new FiniteOrdinal(0n);
        if (targetTypeName === 'WTower') return new WTowerOrdinal(-1n);
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
