// OmegaOrdinal.ts
// Represents the specific ordinal omega (ω)

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import { OneOrdinal } from './OneOrdinal.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { EpsilonZero } from './EpsilonZero.js';
import { RenderingComponents } from '../RenderingComponents.js';
import { CNFOrdinal } from './CNFOrdinal.js';
import { WTowerOrdinal } from './WTowerOrdinal.js';

/**
 * Represents the specific ordinal omega (ω).
 * This is the smallest infinite ordinal.
 */
export class OmegaOrdinal extends OrdinalBase {
    constructor() {
        super();
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return false; }
    isFinite(): boolean { return false; }
    isLessThanEpsilon0(): boolean { return true; }
    isOmega(): boolean { return true; }
    isBasic(): boolean { return true; }
    isOne(): boolean { return false; }

    isLimit(): boolean {
        return true;
    }

    rank(): OrdinalBase {
        return new OmegaOrdinal();
    }

    log(): OrdinalBase {
        return OneOrdinal.instance();
    }

    logStar(): bigint {
        return 1n;
    }

    isTower(): boolean {
        return true;
    }

    isWellFormed(): boolean { return true; }

    getFiniteBigInt(): bigint {
        throw new Error('OmegaOrdinal is not finite');
    }

    getFinitePart(): bigint { return 0n; }
    needsParenthesesAsExponent(): boolean { return false; }

    nextRank(): OrdinalBase {
        return new EpsilonZero();
    }

    complexity(): number { return 1; }

    toString(): string {
        return "w";
    }

    toGraphicalHTML(): string {
        return RenderingComponents.renderOmega();
    }

    clone(): OmegaOrdinal {
        return new OmegaOrdinal();
    }

    toFFormat(): { type: string; k: bigint } {
        // ω = ω^1 = { type: 'pow', k: 1n }
        return { type: 'pow', k: 1n };
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

    isEpsilonNumber(): boolean { return false; }

    epsilonIndex(): OrdinalBase {
        throw new Error('OmegaOrdinal is not an epsilon number');
    }

    // === SINGLETON INSTANCE ===

    private static _instance: OmegaOrdinal | null = null;

    static instance(): OmegaOrdinal {
        if (!OmegaOrdinal._instance) {
            OmegaOrdinal._instance = new OmegaOrdinal();
        }
        return OmegaOrdinal._instance;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'Omega'; }

    static getDirectConversions(): string[] {
        return ['CNF', 'WTower']; // Can convert to CNF representation or WTower
    }

    convertTo(targetTypeName: string): OrdinalBase {
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
}
