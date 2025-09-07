// WTowerOrdinal.js
// Represents finite-height ω-tower: w^^h where h is a non-negative finite integer

class WTowerOrdinal extends OrdinalBase {
    constructor(height = 1, operationTracer = null) {
        super(operationTracer);
        if (typeof height === 'bigint') {
            if (height < 0n) throw new Error('WTowerOrdinal height must be non-negative');
            this.height = height;
        } else if (typeof height === 'number') {
            if (!Number.isInteger(height) || height < 0) throw new Error('WTowerOrdinal height must be non-negative');
            this.height = BigInt(height);
        } else if (height instanceof FiniteOrdinal) {
            this.height = height.getFiniteBigInt();
        } else {
            throw new Error('WTowerOrdinal height must be a non-negative integer');
        }
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return false; }
    isFinite() { return this.height === 0n; }
    isLessThanEpsilon0() { return true; } // finite towers are < ε₀
    isOmega() { return this.height === 1n; }
    isBasic() { return this.height === 1n; }
    isOne() { return this.height === 0n; }

    complexity() {
        // Rough complexity proportional to height digits
        return 3 + this.height.toString().length; // "w^^h"
    }

    toString() {
        if (this.height === 0n) return '1';
        if (this.height === 1n) return 'w';
        return `w^^${this.height.toString()}`;
    }

    toGraphicalHTML() {
        return RenderingComponents.renderTower(RenderingComponents.renderOmega(), this.height.toString());
    }

    clone(newTracer = null) {
        return new WTowerOrdinal(this.height, newTracer || this._tracer);
    }

    toFFormat() {
        // Represent as { type: 'w_tower', height: Number }
        const h = this.height;
        const asNum = Number(h);
        return { type: 'w_tower', height: asNum };
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }
        // Fallback to 0 if it does not fit
        return {
            simplifiedOrdinal: new FiniteOrdinal(0, this._tracer),
            remainingBudget: complexityBudget
        };
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'WTower'; }

    static getDirectConversions() {
        return ['CNF'];
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'CNF': {
                // height 0 -> 1
                if (this.height === 0n) return CNFOrdinal.ONEStatic().clone(this._tracer);
                // Build exponentExp by iterating x_{0}=1, x_{k+1}=ω^{x_k} for k from 0 to height-2
                let exponentExp = CNFOrdinal.ONEStatic().clone(this._tracer);
                const steps = this.height - 1n; // if height=1, zero steps and exponentExp stays 1
                for (let i = 0n; i < steps; i++) {
                    exponentExp = new CNFOrdinal([{ exponent: exponentExp, coefficient: 1n }], this._tracer);
                }
                return new CNFOrdinal([{ exponent: exponentExp, coefficient: 1n }], this._tracer);
            }
            default:
                throw new Error(`WTowerOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank() {
        if (this.height === 0n) return new OmegaOrdinal(this._tracer);
        if (this.height === 1n) return new EpsilonZero(this._tracer);
        return new EpsilonZero(this._tracer);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WTowerOrdinal;
} else {
    // Browser global
    window.WTowerOrdinal = WTowerOrdinal;
}


