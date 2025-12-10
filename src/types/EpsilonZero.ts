// EpsilonZero.ts
// Represents ε₀, the first fixed point of ω^x = x

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import { FiniteOrdinal } from './FiniteOrdinal.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { OneOrdinal } from './OneOrdinal.js';
import { EpsilonNumber } from './EpsilonNumber.js';
import { RenderingComponents } from '../RenderingComponents.js';

export class EpsilonZero extends OrdinalBase {
    constructor() {
        super();
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return false; }
    isFinite(): boolean { return false; }
    isLessThanEpsilon0(): boolean { return false; }
    isOmega(): boolean { return false; }
    isBasic(): boolean { return true; }
    isOne(): boolean { return false; }

    isLimit(): boolean {
        return true;
    }

    rank(): OrdinalBase {
        return EpsilonZero.instance();
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

    isEpsilonNumber(): boolean { return true; }

    epsilonIndex(): OrdinalBase {
        return ZeroOrdinal.instance();
    }

    getFiniteBigInt(): bigint {
        throw new Error('EpsilonZero is not finite');
    }

    getFinitePart(): bigint { return 0n; }
    needsParenthesesAsExponent(): boolean { return false; }

    complexity(): number { return 6; }

    toString(): string { return 'e_0'; }

    toGraphicalHTML(): string {
        return RenderingComponents.renderEpsilonZero();
    }

    clone(): EpsilonZero { return EpsilonZero.instance(); }

    toFFormat(): { type: string; index: bigint } {
        return { type: 'epsilon', index: 0n };
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

    // === SINGLETON INSTANCE ===

    private static _instance: EpsilonZero | null = null;

    static instance(): EpsilonZero {
        if (!EpsilonZero._instance) {
            EpsilonZero._instance = new EpsilonZero();
        }
        return EpsilonZero._instance;
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'EpsilonZero'; }
    static getDirectConversions(): string[] { return ['EpsilonNumber']; }

    convertTo(targetTypeName: string): OrdinalBase {
        switch (targetTypeName) {
            case 'EpsilonNumber':
                return new EpsilonNumber(ZeroOrdinal.instance());
            default:
                throw new Error(`EpsilonZero cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank(): OrdinalBase {
        // nextRank for e_0 is e_1
        return new EpsilonNumber(OneOrdinal.instance());
    }
}
