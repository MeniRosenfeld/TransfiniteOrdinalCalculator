// ZetaZero.ts
// Represents ζ₀, the smallest ordinal larger than any ENF

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { OneOrdinal } from './OneOrdinal.js';

export class ZetaZero extends OrdinalBase {
    constructor() {
        super();
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return false; }
    isFinite(): boolean { return false; }
    isLessThanEpsilon0(): boolean { return false; }
    // Exception: not less than ζ₀ (it equals ζ₀)
    isLessThanZeta0(): boolean { return false; }
    isOmega(): boolean { return false; }
    isBasic(): boolean { return true; }
    isOne(): boolean { return false; }
    isLimit(): boolean { return true; }
    isTower(): boolean { return true; }

    getFiniteBigInt(): bigint {
        throw new Error('ZetaZero is not finite');
    }

    nextRank(): OrdinalBase {
        throw new Error('Numbers greater than ZetaZero are not implemented');
    }

    complexity(): number { return 6; }

    toString(): string { return 'z_0'; }

    toGraphicalHTML(): string {
        return '<span class="ordinal-zeta">ζ₀</span>';
    }

    clone(): ZetaZero { return new ZetaZero(); }

    toFFormat(): { type: string } {
        return { type: 'zeta_zero' };
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
        return {
            simplifiedOrdinal: zero,
            remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
        };
    }

    rank(): OrdinalBase { return this; }

    log(): OrdinalBase {
        return OneOrdinal.instance();
    }

    logStar(): bigint { return 1n; }

    // === SINGLETON INSTANCE ===

    private static _instance: ZetaZero | null = null;

    static instance(): ZetaZero {
        if (!ZetaZero._instance) {
            ZetaZero._instance = new ZetaZero();
        }
        return ZetaZero._instance;
    }

    isWellFormed(): boolean { return true; }

    getFinitePart(): bigint { return 0n; }
    needsParenthesesAsExponent(): boolean { return false; }

    isEpsilonNumber(): boolean { return false; }

    epsilonIndex(): OrdinalBase {
        throw new Error('ZetaZero is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'ZetaZero'; }
    static getDirectConversions(): string[] { return []; }

    convertTo(targetTypeName: string): OrdinalBase {
        throw new Error(`ZetaZero cannot convert directly to ${targetTypeName}`);
    }
}
