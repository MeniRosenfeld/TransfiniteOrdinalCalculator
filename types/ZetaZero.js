// ZetaZero.js
// Represents ζ₀, the smallest ordinal larger than any ENF

class ZetaZero extends OrdinalBase {
    constructor() {
        super();
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

    toGraphicalHTML() {
        return '<span class="ordinal-zeta">ζ₀</span>';
    }

    clone() { return new ZetaZero(); }

    toFFormat() { return { type: 'zeta_zero' }; }

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
        return {
            simplifiedOrdinal: zero,
            remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
        };
    }

    rank() { return this; }

    log() { return OneOrdinal.instance(); }

    logStar() { return 1n; }

    // === SINGLETON INSTANCE ===

    static _instance = null;

    static instance() {
        if (!ZetaZero._instance) {
            ZetaZero._instance = new ZetaZero();
        }
        return ZetaZero._instance;
    }

    isWellFormed() { return true; }

    getFinitePart() { return 0n; }
    needsParenthesesAsExponent() { return false; }

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


