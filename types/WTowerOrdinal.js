// WTowerOrdinal.js
// Represents finite-height ω-tower: w^^h where h is an integer; h = -1 is semantic zero

class WTowerOrdinal extends OrdinalBase {
    constructor(height = 1) {
        super();
        if (typeof height === 'bigint') {
            if (height < -1n) throw new Error('WTowerOrdinal height must be at least -1');
            this.height = height;
        } else if (typeof height === 'number') {
            if (!Number.isInteger(height) || height < -1) throw new Error('WTowerOrdinal height must an integer at least -1');
            this.height = BigInt(height);
        } else if (height instanceof FiniteOrdinal) {
            this.height = height.getFiniteBigInt();
        } else {
            throw new Error('WTowerOrdinal height must be an integer at least -1');
        }
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.height === -1n; }
    isFinite() { return this.height === -1n || this.height === 0n; }
    isLessThanEpsilon0() { return true; } // finite towers are < ε₀
    isOmega() { return this.height === 1n; }
    isBasic() { return this.height === 1n; }
    isOne() { return this.height === 0n; }

    isLimit() {
        if (this.height === -1n) return false;
        return this.height > 0n;
    }

    isWellFormed() {
        return (typeof this.height === 'bigint') && this.height >= -1n;
    }

    rank() {
        if (this.height === -1n) {
            return new ZeroOrdinal();
        }
        if (this.height === 0n) {
            return new OneOrdinal();
        } else {
            return new OmegaOrdinal();
        }
    }

    log() {
        if (this.height === -1n) {
            throw new Error('Log of 0 is undefined.');
        }
        if (this.height === 0n) {
            return new ZeroOrdinal();
        } else {
            return new WTowerOrdinal(this.height - 1n);
        }
    }

    logStar() {
        return this.height;
    }

    isTower() {
        return true;
    }

    getFiniteBigInt() {
        if (this.height === -1n) return 0n;
        if (this.height === 0n) return 1n;
        throw new Error('WTowerOrdinal is not finite');
    }

    complexity() {
        // Rough complexity proportional to height digits
        return 3 + this.height.toString().length; // "w^^h"
    }

    toString() {
        if (this.height === -1n) return '0';
        return `w^^${this.height.toString()}`;
    }

    toGraphicalHTML() {
        return RenderingComponents.renderTower(RenderingComponents.renderOmega(), this.height.toString());
    }

    clone() {
        return new WTowerOrdinal(this.height);
    }

    toFFormat() {
        if (this.height === -1n) return 0n;
        // Represent as { type: 'w_tower', height: Number }
        const h = this.height;
        const asNum = Number(h);
        return { type: 'w_tower', height: asNum };
    }

    // Convenience method used by legacy tests: produce CNF directly
    toCNFOrdinal() {
        return this.convertTo('CNF');
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        OperationTracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        // If it doesn't fit, check height.
        if (this.height >= 3n) {
            const zero = new ZeroOrdinal();
            const zeroComplexity = zero.complexity();
            return {
                simplifiedOrdinal: zero,
                remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
            };
        }

        let expandedOrdinal;
        if (this.height === -1n) {
            expandedOrdinal = new ZeroOrdinal();
        } else if (this.height === 2n) {
            // w^^2 -> w^w
            expandedOrdinal = this.convertTo('CNF');
        } else if (this.height === 1n) {
            // w^^1 -> w
            expandedOrdinal = new OmegaOrdinal();
        } else { // this.height === 0n
            // w^^0 -> 1
            expandedOrdinal = new OneOrdinal();
        }

        const expandedComplexity = expandedOrdinal.complexity();
        if (expandedComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: expandedOrdinal,
                remainingBudget: complexityBudget - expandedComplexity
            };
        } else {
            // Expanded form also doesn't fit, fallback to 0.
            const zero = new ZeroOrdinal();
            const zeroComplexity = zero.complexity();
            return {
                simplifiedOrdinal: zero,
                remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
            };
        }
    }

    getFinitePart() {
        // WTower: height -1 is 0, height 0 is 1, height >= 1 is infinite
        if (this.height === -1n) return 0n;
        if (this.height === 0n) return 1n;
        return 0n; // Infinite towers have no finite part
    }
    needsParenthesesAsExponent() { return false; }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('WTowerOrdinal is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'WTower'; }

    static getDirectConversions() {
        return ['CNF'];
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'CNF': {
                // height -1 -> 0 ; height 0 -> 1
                if (this.height === -1n) return CNFOrdinal.ZEROStatic().clone();
                if (this.height === 0n) return CNFOrdinal.ONEStatic().clone();
                // Build exponentExp by iterating x_{0}=1, x_{k+1}=ω^{x_k} for k from 0 to height-2
                let exponentExp = CNFOrdinal.ONEStatic();
                const steps = this.height - 1n; // if height=1, zero steps and exponentExp stays 1
                OperationTracer.consume(Number(steps));
                for (let i = 0n; i < steps; i++) {
                    exponentExp = new CNFOrdinal([{ exponent: exponentExp, coefficient: 1n }]);
                }
                return new CNFOrdinal([{ exponent: exponentExp, coefficient: 1n }]);
            }
            default:
                throw new Error(`WTowerOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank() {
        if (this.height === -1n) return new OneOrdinal();
        if (this.height === 0n) return new OmegaOrdinal();
        return new EpsilonZero();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WTowerOrdinal;
} else {
    // Browser global
    window.WTowerOrdinal = WTowerOrdinal;
}


