// EpsilonNumber.ts
// Represents e_k for some ordinal k

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import type { FiniteOrdinal } from './FiniteOrdinal.js';
import type { OneOrdinal } from './OneOrdinal.js';
import { RenderingComponents } from '../RenderingComponents.js';
import type { ENFFactor } from './ENFFactor.js';
import type { ENFTerm } from './ENFTerm.js';
import type { EpsilonTowerOrdinal } from './EpsilonTowerOrdinal.js';

/**
 * Represents an epsilon number, e_k, where k is an ordinal.
 * Epsilon numbers are fixed points of exponentiation: w^x = x.
 */
export class EpsilonNumber extends OrdinalBase {
    readonly k: OrdinalBase;

    constructor(k: OrdinalBase) {
        super();
        if (!k || !k.isOrdinal()) {
            throw new Error('EpsilonNumber index k must be a valid ordinal object');
        }
        this.k = k;
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return false; }
    isFinite(): boolean { return false; }
    isLessThanEpsilon0(): boolean { return false; }
    isOmega(): boolean { return false; }
    isBasic(): boolean { return true; }
    isOne(): boolean { return false; }
    isLimit(): boolean { return true; }
    isTower(): boolean { return true; }

    getFiniteBigInt(): bigint {
        throw new Error('EpsilonNumber is not finite');
    }

    nextRank(): OrdinalBase {
        return new EpsilonNumber(this.k.successor());
    }

    complexity(): number {
        return this.k.complexity() + 6;
    }

    toString(): string {
        const kStr = this.k.toString();
        // Parenthesize only when necessary
        let needsParen = !(this.k.isFinite() || this.k.isOmega() || this.k.isEpsilonNumber());
        if (needsParen) {
            return `e_(${kStr})`;
        } else {
            return `e_${kStr}`;
        }
    }

    toGraphicalHTML(): string {
        const indexHTML = this.k.toGraphicalHTML ? this.k.toGraphicalHTML() : this.k.toString();
        // Graphical representation never needs parentheses - subscript provides implicit grouping
        return RenderingComponents.renderEpsilon(indexHTML, false);
    }

    toFFormat(): { type: string; index: any } {
        return { type: 'epsilon', index: this.k.toFFormat() };
    }

    clone(): EpsilonNumber {
        return new EpsilonNumber(this.k);
    }

    simplify(complexityBudget: number, skipMyOwnMPTFCheck: boolean = false): { simplifiedOrdinal: OrdinalBase; remainingBudget: number } {
        OperationTracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this,
                remainingBudget: complexityBudget - myComplexity
            };
        }

        const zero = new (window as any).FiniteOrdinal(0);
        const zeroComplexity = zero.complexity();
        if (zeroComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: zero,
                remainingBudget: complexityBudget - zeroComplexity
            };
        }

        return { simplifiedOrdinal: zero, remainingBudget: 0 };
    }

    rank(): OrdinalBase {
        return this;
    }

    log(): OrdinalBase {
        return (window as any).OneOrdinal.instance();
    }

    logStar(): bigint {
        return 1n;
    }

    isWellFormed(): boolean { return this.k.isLessThanZeta0(); }

    getFinitePart(): bigint { return 0n; }
    needsParenthesesAsExponent(): boolean { return false; }

    isEpsilonNumber(): boolean { return true; }

    epsilonIndex(): OrdinalBase {
        return this.k;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'EpsilonNumber'; }
    static getDirectConversions(): string[] { return ['ENFTerm', 'EpsilonTower']; }

    convertTo(targetTypeName: string): OrdinalBase {
        switch (targetTypeName) {
            case 'ENFTerm':
                // Convert e_k to ENFTerm with single factor: e_k^1 * 1
                const factor = new (window as any).ENFFactor(this, (window as any).OneOrdinal.instance());
                return new (window as any).ENFTerm([factor], 1n);
            case 'EpsilonTower':
                // Convert e_k to EpsilonTower e_k^^1 (which equals e_k)
                return new (window as any).EpsilonTowerOrdinal(this.k, 1);
            default:
                throw new Error(`EpsilonNumber cannot convert directly to ${targetTypeName}`);
        }
    }
}
