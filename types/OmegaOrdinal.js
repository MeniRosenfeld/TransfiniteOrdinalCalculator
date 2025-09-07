// OmegaOrdinal.js
// Represents the specific ordinal omega (ω)

/**
 * Represents the specific ordinal omega (ω).
 * This is the smallest infinite ordinal.
 */
class OmegaOrdinal extends OrdinalBase {
    constructor(operationTracer = null) {
        super(operationTracer);
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return false; }
    isLessThanEpsilon0() { return true; }
    isOmega() { return true; }
    isBasic() { return true; }
    isOne() { return false; }

    getFiniteBigInt() { throw new Error('OmegaOrdinal is not finite'); }

    nextRank() {
        return new EpsilonZero(this._tracer);
    }

    complexity() {
        return 1; // Omega has minimal complexity
    }

    toString() {
        return "w";
    }

    toGraphicalHTML() {
        return RenderingComponents.renderOmega();
    }

    clone(newTracer = null) {
        return new OmegaOrdinal(newTracer || this._tracer);
    }

    toFFormat() {
        // ω = ω^1 = { type: 'pow', k: 1n }
        return { type: 'pow', k: 1n };
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        // If omega doesn't fit, fallback to 0
        const zero = new FiniteOrdinal(0, this._tracer);
        return {
            simplifiedOrdinal: zero,
            remainingBudget: complexityBudget
        };
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
                    exponent: CNFOrdinal.ONEStatic().clone(this._tracer), // ω^1 as CNF exponent
                    coefficient: 1n
                }], this._tracer);
            case 'WTower':
                return new WTowerOrdinal(1, this._tracer);

            default:
                throw new Error(`OmegaOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    // === UTILITY METHODS ===

    /**
     * Singleton instance for efficiency.
     */
    static instance(tracer = null) {
        return new OmegaOrdinal(tracer);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OmegaOrdinal;
} else {
    // Browser global
    window.OmegaOrdinal = OmegaOrdinal;
}
