// ZeroOrdinal.ts
// Represents the specific ordinal 0.

import { OrdinalBase } from './OrdinalBase.js';
import { OneOrdinal } from './OneOrdinal.js';
import { FiniteOrdinal } from './FiniteOrdinal.js';
import { WTowerOrdinal } from './WTowerOrdinal.js';
import { RenderingComponents } from '../RenderingComponents.js';

/**
 * Represents the finite ordinal number 0.
 * This is a specialized type for a common value.
 */
export class ZeroOrdinal extends OrdinalBase {
    constructor() {
        super();
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return true; }
    isFinite(): boolean { return true; }
    isLessThanEpsilon0(): boolean { return true; }
    isOmega(): boolean { return false; }
    isBasic(): boolean { return false; }
    isOne(): boolean { return false; }
    isLimit(): boolean { return false; }
    isTower(): boolean { return true; }

    isWellFormed(): boolean { return true; }

    getFiniteBigInt(): bigint { return 0n; }

    getFinitePart(): bigint { return 0n; }
    needsParenthesesAsExponent(): boolean { return false; }

    nextRank(): OrdinalBase {
        return OneOrdinal.instance();
    }

    complexity(): number { return 0; }

    toString(): string { return "0"; }

    toGraphicalHTML(): string {
        return RenderingComponents.renderFinite(0);
    }

    toFFormat(): bigint { return 0n; }

    clone(): ZeroOrdinal {
        return ZeroOrdinal.instance();
    }

    simplify(complexityBudget: number, skipMyOwnMPTFCheck: boolean = false): { simplifiedOrdinal: OrdinalBase; remainingBudget: number } {
        // 0 is already as simple as it gets.
        return {
            simplifiedOrdinal: this,
            remainingBudget: complexityBudget // Consumes 0 budget
        };
    }

    rank(): OrdinalBase {
        return ZeroOrdinal.instance();
    }

    log(): OrdinalBase {
        // log(0) is undefined
        throw new Error('Log of 0 is undefined.');
    }

    logStar(): bigint {
        return -1n;
    }

    successor(): OrdinalBase {
        return OneOrdinal.instance();
    }

    isEpsilonNumber(): boolean { return false; }

    epsilonIndex(): OrdinalBase {
        throw new Error('ZeroOrdinal is not an epsilon number');
    }

    // === SINGLETON INSTANCE ===

    private static _instance: ZeroOrdinal | null = null;

    static instance(): ZeroOrdinal {
        if (!ZeroOrdinal._instance) {
            ZeroOrdinal._instance = new ZeroOrdinal();
        }
        return ZeroOrdinal._instance;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'Zero'; }
    static getDirectConversions(): string[] { return ['Finite', 'WTower']; }

    convertTo(targetTypeName: string): OrdinalBase {
        if (targetTypeName === 'Finite') {
            return new FiniteOrdinal(0n);
        }
        if (targetTypeName === 'WTower') {
            return new WTowerOrdinal(-1n);
        }
        throw new Error(`ZeroOrdinal cannot convert directly to ${targetTypeName}`);
    }
}

