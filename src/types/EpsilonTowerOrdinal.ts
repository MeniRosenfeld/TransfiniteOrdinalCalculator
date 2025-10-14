// EpsilonTowerOrdinal.ts
// Represents finite-height ε-tower: e_k^^h where k is an ordinal and h is an integer; h = -1 is semantic zero

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import { FiniteOrdinal } from './FiniteOrdinal.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { OneOrdinal } from './OneOrdinal.js';
import { OmegaOrdinal } from './OmegaOrdinal.js';
import { EpsilonNumber } from './EpsilonNumber.js';
import { ENFOrdinal } from './ENFOrdinal.js';
import { ENFTerm } from './ENFTerm.js';
import { ENFFactor } from './ENFFactor.js';
import { RenderingComponents } from '../RenderingComponents.js';

export class EpsilonTowerOrdinal extends OrdinalBase {
    readonly baseIndex: OrdinalBase;
    readonly height: bigint;

    constructor(baseIndex: OrdinalBase, height: bigint | number | FiniteOrdinal = 1) {
        super();

        // Validate and set base (the k in e_k)
        if (!baseIndex || !baseIndex.isOrdinal || !baseIndex.isOrdinal()) {
            throw new Error('EpsilonTowerOrdinal base must be an ordinal');
        }
        this.baseIndex = baseIndex;

        // Validate and set height
        if (typeof height === 'bigint') {
            if (height < -1n) throw new Error('EpsilonTowerOrdinal height must be at least -1');
            this.height = height;
        } else if (typeof height === 'number') {
            if (!Number.isInteger(height) || height < -1) throw new Error('EpsilonTowerOrdinal height must an integer at least -1');
            this.height = BigInt(height);
        } else if (height instanceof FiniteOrdinal) {
            this.height = height.getFiniteBigInt();
        } else {
            throw new Error('EpsilonTowerOrdinal height must be an integer at least -1');
        }
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.height === -1n; }
    isFinite() { return this.height === -1n || this.height === 0n; }
    isLessThanEpsilon0() { return this.height > 0; } // epsilon towers are >= ε₀
    isOmega() { return false; }
    isBasic() { return this.height === 1n || this.height === 0n; } // e_0^^1 = e_0 is basic
    isOne() { return this.height === 0n; }

    isLimit() {
        return this.height > 0n;
    }

    isWellFormed() {
        return (typeof this.height === 'bigint') && this.height >= -1n &&
            this.baseIndex && this.baseIndex.isWellFormed && this.baseIndex.isWellFormed();
    }

    rank() {
        if (this.height === -1n) {
            return ZeroOrdinal.instance();
        }
        if (this.height === 0n) {
            return OneOrdinal.instance();
        } else {
            // Rank of e_k^^h for h >= 1 is e_k
            return new EpsilonNumber(this.baseIndex);
        }
    }

    log(): OrdinalBase {
        if (this.height === -1n) {
            throw new Error('Log of 0 is undefined.');
        }
        if (this.height === 0n) {
            return ZeroOrdinal.instance();
        } else {
            return new EpsilonTowerOrdinal(this.baseIndex, this.height - 1n);
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
        throw new Error('EpsilonTowerOrdinal is not finite');
    }

    complexity() {
        // Rough complexity: base complexity + height digits + "e_^^" overhead
        const baseComplexity = this.baseIndex.complexity ? this.baseIndex.complexity() : 3;
        return baseComplexity + 6 + this.height.toString().length; // "e_k^^h"
    }

    toString() {
        if (this.height === -1n) return '0';
        const baseStr = this.baseIndex.toString();

        // Use parentheses around base if it needs them
        const needsParens = this.baseIndex.needsParenthesesAsExponent && this.baseIndex.needsParenthesesAsExponent();
        const baseDisplay = needsParens ? `(${baseStr})` : baseStr;

        return `e_${baseDisplay}^^${this.height.toString()}`;
    }

    toGraphicalHTML() {
        const baseHTML = this.baseIndex.toGraphicalHTML ? this.baseIndex.toGraphicalHTML() : this.baseIndex.toString();
        return RenderingComponents.renderTower(`ε<sub>${baseHTML}</sub>`, this.height.toString());
    }

    clone(): EpsilonTowerOrdinal {
        return new EpsilonTowerOrdinal(this.baseIndex, this.height);
    }

    toFFormat() {
        if (this.height === -1n) return 0n;
        // Represent as { type: 'epsilon_tower', base: baseF, height: Number }
        const baseF = this.baseIndex.toFFormat ? this.baseIndex.toFFormat() : this.baseIndex.toString();
        const h = this.height;
        const asNum = Number(h);
        return { type: 'epsilon_tower', base: baseF, height: asNum };
    }

    // Convenience method used by legacy tests: produce ENF directly
    toENFOrdinal() {
        return this.convertTo('ENF');
    }

    simplify(complexityBudget: any, skipMyOwnMPTFCheck = false) {
        OperationTracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this,
                remainingBudget: complexityBudget - myComplexity
            };
        }

        // If it doesn't fit, check height.
        if (this.height >= 3n) {
            const zero = ZeroOrdinal.instance();
            const zeroComplexity = zero.complexity();
            return {
                simplifiedOrdinal: zero,
                remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
            };
        }

        let expandedOrdinal;
        if (this.height === -1n) {
            expandedOrdinal = ZeroOrdinal.instance();
        } else if (this.height === 2n) {
            // e_k^^2 -> e_k^e_k (convert to ENF)
            expandedOrdinal = this.convertTo('ENF');
        } else if (this.height === 1n) {
            // e_k^^1 -> e_k
            expandedOrdinal = new EpsilonNumber(this.baseIndex);
        } else { // this.height === 0n
            // e_k^^0 -> 1
            expandedOrdinal = OneOrdinal.instance();
        }

        const expandedComplexity = expandedOrdinal.complexity();
        if (expandedComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: expandedOrdinal,
                remainingBudget: complexityBudget - expandedComplexity
            };
        } else {
            // Expanded form also doesn't fit, fallback to 0.
            const zero = ZeroOrdinal.instance();
            const zeroComplexity = zero.complexity();
            return {
                simplifiedOrdinal: zero,
                remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
            };
        }
    }

    getFinitePart() {
        // EpsilonTower: height -1 is 0, height 0 is 1, height >= 1 is infinite
        if (this.height === -1n) return 0n;
        if (this.height === 0n) return 1n;
        return 0n; // Infinite towers have no finite part
    }

    needsParenthesesAsExponent() { return false; }

    isEpsilonNumber() {
        // e_k^^1 = e_k is an epsilon number
        return this.height === 1n;
    }

    epsilonIndex() {
        if (!this.isEpsilonNumber()) {
            throw new Error('EpsilonTowerOrdinal is not an epsilon number');
        }
        return this.baseIndex;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'EpsilonTower'; }

    static getDirectConversions() {
        return ['ENF'];
    }

    convertTo(targetTypeName: string): OrdinalBase {
        switch (targetTypeName) {
            case 'ENF': {
                // height -1 -> 0 ; height 0 -> 1
                if (this.height === -1n) return new ENFOrdinal([]);
                if (this.height === 0n) return new ENFOrdinal([new ENFTerm([], 1n)]);

                // height 1 -> e_k (single epsilon number)
                if (this.height === 1n) {
                    const epsilonBase = new EpsilonNumber(this.baseIndex);
                    const factor = new ENFFactor(epsilonBase, new ENFOrdinal([new ENFTerm([], 1n)]));
                    return new ENFOrdinal([new ENFTerm([factor], 1n)]);
                }

                // height >= 2: Build e_k^(e_k^(...)) tower
                // Start with e_k
                let exponentExp = new ENFOrdinal([new ENFTerm([new ENFFactor(new EpsilonNumber(this.baseIndex),
                    new ENFOrdinal([new ENFTerm([], 1n)]))], 1n)]);

                for (let i = 1n; i < this.height; i++) {
                    const epsilonBase = new EpsilonNumber(this.baseIndex);
                    const factor = new ENFFactor(epsilonBase, exponentExp);
                    exponentExp = new ENFOrdinal([new ENFTerm([factor], 1n)]);
                }

                return exponentExp;
            }
            default:
                throw new Error(`EpsilonTowerOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank() {
        if (this.height === -1n) {
            return OneOrdinal.instance();
        }
        if (this.height === 0n) {
            return new OmegaOrdinal();
        }
        return new EpsilonNumber(this.baseIndex.successor());
    }
}
