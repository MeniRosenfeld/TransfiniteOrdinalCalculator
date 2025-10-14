// OrdinalBase.ts
// Base contract that all ordinal types must implement

import { OperationTracer } from '../OperationTracer.js';

/**
 * Base class defining the contract for all ordinal types.
 * This is an abstract base - all methods must be implemented by subclasses.
 */
export abstract class OrdinalBase {
    private readonly _ordinalBrand: symbol;

    constructor() {
        this._ordinalBrand = Symbol.for('TransfiniteOrdinal.OrdinalBrand');
        // Consume operation for construction using global tracer
        OperationTracer.consume(1);
    }

    // === REQUIRED UNARY METHODS ===

    abstract isZero(): boolean;
    abstract isFinite(): boolean;
    abstract getFiniteBigInt(): bigint;
    abstract getFinitePart(): bigint;
    abstract needsParenthesesAsExponent(): boolean;
    abstract nextRank(): OrdinalBase;
    abstract isOne(): boolean;
    abstract isLessThanEpsilon0(): boolean;
    abstract isOmega(): boolean;
    abstract isBasic(): boolean;
    abstract isLimit(): boolean;
    abstract isTower(): boolean;
    abstract isEpsilonNumber(): boolean;
    abstract epsilonIndex(): OrdinalBase;
    abstract rank(): OrdinalBase;
    abstract log(): OrdinalBase;
    abstract logStar(): bigint;
    abstract complexity(): number;
    abstract toString(): string;
    abstract toGraphicalHTML(): string;
    abstract clone(): OrdinalBase;
    abstract toFFormat(): any;
    abstract convertTo(targetTypeName: string): OrdinalBase;

    /**
     * Returns true if this ordinal is less than ζ₀.
     */
    isLessThanZeta0(): boolean {
        return true;
    }

    /**
     * Coarse rank tier classification.
     */
    rankTier(): number {
        if (this.isZero()) return 0;
        if (this.isFinite()) return 1;
        if (this.isLessThanEpsilon0()) return 2;
        if (this.isLessThanZeta0()) return 3;
        return 4;
    }

    /**
     * Returns true if the internal structure is valid.
     */
    isWellFormed(): boolean {
        return true;
    }

    /**
     * Returns formatted string representation.
     */
    toDisplayString(options: any = {}): string {
        return this.toString();
    }

    /**
     * Returns a string that includes the runtime type and the ordinal string.
     */
    toStringWithType(): string {
        const typeName = (this && this.constructor && this.constructor.name)
            ? this.constructor.name
            : 'UnknownType';
        return `[${typeName}: ${this.toString()}]`;
    }

    /**
     * Left predecessor operation.
     */
    leftPredecessor(): OrdinalBase {
        if (this.isZero()) {
            throw new Error("Cannot take left predecessor of zero");
        }
        if (this.isFinite()) {
            const n = this.getFiniteBigInt();
            if (typeof window !== 'undefined' && window.FiniteOrdinal) {
                return new window.FiniteOrdinal(n - 1n);
            }
            throw new Error('FiniteOrdinal not available');
        }
        return this;
    }

    /**
     * Returns the successor of this ordinal (this + 1).
     */
    successor(): OrdinalBase {
        if (typeof window !== 'undefined' && window.OneOrdinal && window.OneOrdinal.instance) {
            return this.add(window.OneOrdinal.instance());
        }
        throw new Error('OneOrdinal not available for successor operation');
    }

    /**
     * Tunnel operation: creates deeply nested epsilon structures.
     */
    tunnel(): OrdinalBase {
        if (!this.isFinite()) {
            if (typeof window !== 'undefined' && window.ZetaZero) {
                return new window.ZetaZero();
            }
            throw new Error('ZetaZero not available');
        }

        const n = this.getFiniteBigInt();

        if (n === 0n) {
            if (typeof window !== 'undefined' && window.ZeroOrdinal && window.ZeroOrdinal.instance) {
                return window.ZeroOrdinal.instance();
            }
            throw new Error('ZeroOrdinal not available');
        }

        if (n > 0n && n <= 10n) {
            if (typeof window !== 'undefined' && window.ZeroOrdinal && window.EpsilonNumber) {
                let result: OrdinalBase = window.ZeroOrdinal.instance();
                for (let i = 0n; i < n; i++) {
                    result = new window.EpsilonNumber(result) as OrdinalBase;
                }
                return result;
            }
            throw new Error('EpsilonNumber or ZeroOrdinal not available');
        }

        if (typeof window !== 'undefined' && window.EpsilonTunnelOrdinal) {
            return new window.EpsilonTunnelOrdinal(n);
        }
        throw new Error('EpsilonTunnelOrdinal not available');
    }

    /**
     * Simplifies this ordinal within the given complexity budget.
     */
    simplify(complexityBudget: number, skipMyOwnMPTFCheck: boolean = false): { simplifiedOrdinal: OrdinalBase; remainingBudget: number } {
        throw new Error(`${this.constructor.name} must implement simplify()`);
    }

    // === ARITHMETIC OPERATIONS ===

    equals(other: OrdinalBase): boolean {
        if (typeof window !== 'undefined' && window.OPERATIONS) {
            return window.OPERATIONS.compare(this, other) === 0;
        }
        throw new Error('Comparison engine not available');
    }

    compareTo(other: OrdinalBase): number {
        if (typeof window !== 'undefined' && window.OPERATIONS) {
            return window.OPERATIONS.compare(this, other);
        }
        throw new Error('Comparison engine not available');
    }

    add(other: OrdinalBase): OrdinalBase {
        if (typeof window !== 'undefined' && window.OPERATIONS) {
            return window.OPERATIONS.add(this, other);
        }
        throw new Error('Addition engine not available');
    }

    multiply(other: OrdinalBase): OrdinalBase {
        if (typeof window !== 'undefined' && window.OPERATIONS) {
            return window.OPERATIONS.multiply(this, other);
        }
        throw new Error('Multiplication engine not available');
    }

    power(other: OrdinalBase): OrdinalBase {
        if (typeof window !== 'undefined' && window.OPERATIONS) {
            return window.OPERATIONS.power(this, other);
        }
        throw new Error('Exponentiation engine not available');
    }

    tetrate(other: OrdinalBase): OrdinalBase {
        if (typeof window !== 'undefined' && window.OPERATIONS) {
            return window.OPERATIONS.tetrate(this, other);
        }
        throw new Error('Tetration engine not available');
    }

    // === STATIC METHODS ===

    static getDirectConversions(): string[] {
        throw new Error(`${this.name} must implement getDirectConversions()`);
    }

    static getTypeName(): string {
        throw new Error(`${this.name} must implement getTypeName()`);
    }

    // === UTILITY METHODS ===

    isOrdinal(): boolean {
        return this._ordinalBrand === Symbol.for('TransfiniteOrdinal.OrdinalBrand');
    }
}
