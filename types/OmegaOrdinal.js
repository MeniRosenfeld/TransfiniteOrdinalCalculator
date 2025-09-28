// OmegaOrdinal.js
// Represents the specific ordinal omega (ω)

/**
 * Represents the specific ordinal omega (ω).
 * This is the smallest infinite ordinal.
 */
class OmegaOrdinal extends OrdinalBase {
    constructor() {
        super();
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return false; }
    isLessThanEpsilon0() { return true; }
    isOmega() { return true; }
    isBasic() { return true; }
    isOne() { return false; }

    isLimit() {
        return true;
    }

    rank() {
        return new OmegaOrdinal();
    }

    log() {
        return OneOrdinal.instance();
    }

    logStar() {
        return 1n;
    }

    isTower() {
        return true;
    }

    isWellFormed() { return true; }

    getFiniteBigInt() { throw new Error('OmegaOrdinal is not finite'); }

    getFinitePart() { return 0n; }
    needsParenthesesAsExponent() { return false; }

    nextRank() {
        return new EpsilonZero();
    }

    complexity() { return 1; }

    toString() {
        return "w";
    }

    toGraphicalHTML() {
        return RenderingComponents.renderOmega();
    }

    clone() {
        return new OmegaOrdinal();
    }

    toFFormat() {
        // ω = ω^1 = { type: 'pow', k: 1n }
        return { type: 'pow', k: 1n };
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        OperationTracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this,
                remainingBudget: complexityBudget - myComplexity
            };
        }

        const zero = ZeroOrdinal.instance();
        const zeroComplexity = zero.complexity();
        if (zeroComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: zero,
                remainingBudget: complexityBudget - zeroComplexity
            };
        }

        return { simplifiedOrdinal: zero, remainingBudget: 0 };
    }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('OmegaOrdinal is not an epsilon number');
    }

    // === SINGLETON INSTANCE ===

    static _instance = null;

    static instance() {
        if (!OmegaOrdinal._instance) {
            OmegaOrdinal._instance = new OmegaOrdinal();
        }
        return OmegaOrdinal._instance;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'Omega'; }

    static getDirectConversions() {
        return ['CNF', 'WTower']; // Can convert to CNF representation or WTower
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'CNF':
                // ω = CNFOrdinal with single term: ω^1 * 1
                return new CNFOrdinal([{
                    exponent: CNFOrdinal.ONEStatic(), // ω^1 as CNF exponent
                    coefficient: 1n
                }]);
            case 'WTower':
                return new WTowerOrdinal(1);

            default:
                throw new Error(`OmegaOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    // === UTILITY METHODS ===

    /**
     * Singleton instance for efficiency.
     */
    static instance() {
        return new OmegaOrdinal();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OmegaOrdinal;
} else {
    // Browser global
    window.OmegaOrdinal = OmegaOrdinal;
}
