// OneOrdinal.ts
// Represents the specific ordinal 1.

import { OrdinalBase } from './OrdinalBase.js';
import type { OmegaOrdinal } from './OmegaOrdinal.js';
import type { ZeroOrdinal } from './ZeroOrdinal.js';
import type { FiniteOrdinal } from './FiniteOrdinal.js';
import type { WTowerOrdinal } from './WTowerOrdinal.js';
import { RenderingComponents } from '../RenderingComponents.js';

/**
 * Represents the finite ordinal number 1.
 * This is a specialized type for a common value.
 */
export class OneOrdinal extends OrdinalBase {
    constructor() {
        super();
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return false; }
    isFinite(): boolean { return true; }
    isLessThanEpsilon0(): boolean { return true; }
    isOmega(): boolean { return false; }
    isBasic(): boolean { return false; }
    isOne(): boolean { return true; }
    isLimit(): boolean { return false; }
    isTower(): boolean { return true; }

    isWellFormed(): boolean { return true; }

    getFiniteBigInt(): bigint { return 1n; }

    getFinitePart(): bigint { return 1n; }
    needsParenthesesAsExponent(): boolean { return false; }

    nextRank(): OrdinalBase {
        return new (window as any).OmegaOrdinal();
    }

    complexity(): number { return 1; }

    toString(): string { return "1"; }

    toGraphicalHTML(): string {
        return RenderingComponents.renderFinite(1);
    }

    toFFormat(): bigint { return 1n; }

    clone(): OneOrdinal {
        return OneOrdinal.instance();
    }

    simplify(complexityBudget: number, skipMyOwnMPTFCheck: boolean = false): { simplifiedOrdinal: OrdinalBase; remainingBudget: number } {
        if (this.complexity() <= complexityBudget) {
            return {
                simplifiedOrdinal: this,
                remainingBudget: complexityBudget - this.complexity()
            };
        }
        // Fallback to 0 if 1 doesn't fit
        const zero = (window as any).ZeroOrdinal.instance();
        return { simplifiedOrdinal: zero, remainingBudget: complexityBudget };
    }

    rank(): OrdinalBase {
        return OneOrdinal.instance();
    }

    log(): OrdinalBase {
        return (window as any).ZeroOrdinal.instance();
    }

    logStar(): bigint {
        return 0n;
    }

    successor(): OrdinalBase {
        return new (window as any).FiniteOrdinal(2n);
    }

    isEpsilonNumber(): boolean { return false; }

    epsilonIndex(): OrdinalBase {
        throw new Error('OneOrdinal is not an epsilon number');
    }

    // === SINGLETON INSTANCE ===

    private static _instance: OneOrdinal | null = null;

    static instance(): OneOrdinal {
        if (!OneOrdinal._instance) {
            OneOrdinal._instance = new OneOrdinal();
        }
        return OneOrdinal._instance;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'One'; }
    static getDirectConversions(): string[] { return ['Finite', 'WTower']; }

    convertTo(targetTypeName: string): OrdinalBase {
        if (targetTypeName === 'Finite') {
            return new (window as any).FiniteOrdinal(1n);
        }
        if (targetTypeName === 'WTower') {
            return new (window as any).WTowerOrdinal(0n);
        }
        throw new Error(`OneOrdinal cannot convert directly to ${targetTypeName}`);
    }
}
