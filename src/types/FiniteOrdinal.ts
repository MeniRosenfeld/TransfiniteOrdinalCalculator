// FiniteOrdinal.ts
// Represents finite ordinal numbers (0, 1, 2, 3, ...)

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import type { ZeroOrdinal } from './ZeroOrdinal.js';
import type { OneOrdinal } from './OneOrdinal.js';
import type { OmegaOrdinal } from './OmegaOrdinal.js';
import { RenderingComponents } from '../RenderingComponents.js';
import type { CNFOrdinal } from './CNFOrdinal.js';

/**
 * Represents a finite ordinal number.
 * This is the most basic ordinal type.
 */
export class FiniteOrdinal extends OrdinalBase {
    readonly value: bigint;

    constructor(value: number | bigint = 0) {
        super();

        if (typeof value === 'bigint') {
            this.value = value;
        } else if (typeof value === 'number') {
            if (!Number.isInteger(value) || value < 0) {
                throw new Error('FiniteOrdinal value must be a non-negative integer');
            }
            this.value = BigInt(value);
        } else {
            throw new Error('FiniteOrdinal value must be a number or BigInt');
        }

        OperationTracer.consume();
    }

    // === REQUIRED UNARY METHODS ===

    isZero(): boolean { return this.value === 0n; }
    isFinite(): boolean { return true; }
    isLessThanEpsilon0(): boolean { return true; }
    isOmega(): boolean { return false; }
    isBasic(): boolean { return false; }
    isOne(): boolean { return this.value === 1n; }

    isLimit(): boolean {
        return false;
    }

    isWellFormed(): boolean {
        return (typeof this.value === 'bigint') && this.value >= 0n;
    }

    rank(): OrdinalBase {
        if (this.isZero()) return new FiniteOrdinal(0n);
        return new FiniteOrdinal(1n);
    }

    log(): OrdinalBase {
        if (this.isZero()) {
            throw new Error('Log of 0 is undefined.');
        }
        return (window as any).ZeroOrdinal.instance();
    }

    logStar(): bigint {
        if (this.isZero()) {
            return -1n;
        } else {
            return 0n;
        }
    }

    isTower(): boolean {
        return this.value === 0n || this.value === 1n;
    }

    getFiniteBigInt(): bigint { return this.value; }

    getFinitePart(): bigint { return this.value; }
    needsParenthesesAsExponent(): boolean { return false; }

    nextRank(): OrdinalBase {
        if (this.isZero()) {
            return (window as any).OneOrdinal.instance();
        }
        return new (window as any).OmegaOrdinal();
    }

    complexity(): number {
        if (this.value === 0n) return 0;
        return this.value.toString().length;
    }

    toString(): string {
        return this.value.toString();
    }

    toGraphicalHTML(): string {
        return RenderingComponents.renderFinite(this.value);
    }

    toFFormat(): bigint {
        return this.value;
    }

    clone(): FiniteOrdinal {
        return new FiniteOrdinal(this.value);
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

        const zero = (window as any).ZeroOrdinal.instance();
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
        throw new Error('FiniteOrdinal is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName(): string { return 'Finite'; }

    static getDirectConversions(): string[] {
        return ['CNF'];
    }

    convertTo(targetTypeName: string): OrdinalBase {
        switch (targetTypeName) {
            case 'CNF':
                // Finite n as CNF is just n (ω^0 * n)
                return new (window as any).CNFOrdinal(this.value);
            default:
                throw new Error(`FiniteOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    // === UTILITY METHODS ===

    /**
     * Gets the finite value as BigInt.
     */
    getFiniteValue(): bigint {
        return this.value;
    }

    /**
     * Creates a FiniteOrdinal from various input types.
     */
    static from(input: any): FiniteOrdinal {
        if (input instanceof FiniteOrdinal) {
            return input;
        }
        if (typeof input === 'number' || typeof input === 'bigint') {
            return new FiniteOrdinal(input);
        }
        if (input && input.isFinite && input.isFinite() && input.getFiniteValue) {
            return new FiniteOrdinal(input.getFiniteValue());
        }

        throw new Error(`Cannot create FiniteOrdinal from ${input}`);
    }
}
