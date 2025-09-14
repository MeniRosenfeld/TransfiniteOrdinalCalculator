// FiniteOrdinal.js
// Represents finite ordinal numbers (0, 1, 2, 3, ...)

/**
 * Represents a finite ordinal number.
 * This is the most basic ordinal type.
 */
class FiniteOrdinal extends OrdinalBase {
    constructor(value = 0, operationTracer = null) {
        super(operationTracer);

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
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.value === 0n; }
    isFinite() { return true; }
    isLessThanEpsilon0() { return true; }
    isOmega() { return false; }
    isBasic() { return false; }
    isOne() { return this.value === 1n; }

    isLimit() {
        return false;
    }

    rank() {
        if (this.isZero()) return new FiniteOrdinal(0n, this._tracer);
        return new FiniteOrdinal(1n, this._tracer);
    }

    log() {
        return new ZeroOrdinal(this._tracer);
    }

    logStar() {
        if (this.isZero()) {
            return new FiniteOrdinal(-1n, this._tracer);
        } else {
            return new ZeroOrdinal(this._tracer);
        }
    }

    isTower() {
        return this.value === 0n || this.value === 1n;
    }

    getFiniteBigInt() { return this.value; }

    nextRank() {
        if (this.isZero()) return new OneOrdinal(this._tracer);
        return new OmegaOrdinal(this._tracer);
    }

    complexity() {
        if (this.value === 0n) return 0;
        return this.value.toString().length;
    }

    toString() {
        return this.value.toString();
    }

    toGraphicalHTML() {
        return RenderingComponents.renderFinite(this.value);
    }

    // equals() and compareTo() are inherited from OrdinalBase and use rule-based system

    toFFormat() {
        return this.value;
    }

    clone(newTracer = null) {
        return new FiniteOrdinal(this.value, newTracer || this._tracer);
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        const zero = new ZeroOrdinal(this._tracer);
        const zeroComplexity = zero.complexity();
        if (zeroComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: zero,
                remainingBudget: complexityBudget - zeroComplexity
            };
        }

        return { simplifiedOrdinal: zero, remainingBudget: 0 };
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'Finite'; }

    static getDirectConversions() {
        return ['CNF'];
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'CNF':
                // Finite n as CNF is just n (ω^0 * n)
                return new CNFOrdinal(this.value, this._tracer);
            default:
                throw new Error(`FiniteOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    // Note: No binary operations here. All binary ops are handled by the rule engine.

    // === UTILITY METHODS ===

    /**
     * Gets the finite value as BigInt.
     */
    getFiniteValue() {
        return this.value;
    }

    /**
     * Creates a FiniteOrdinal from various input types.
     */
    static from(input, tracer = null) {
        if (input instanceof FiniteOrdinal) {
            return input.clone(tracer);
        }
        if (typeof input === 'number' || typeof input === 'bigint') {
            return new FiniteOrdinal(input, tracer);
        }
        if (input && input.isFinite && input.isFinite() && input.getFiniteValue) {
            return new FiniteOrdinal(input.getFiniteValue(), tracer);
        }

        throw new Error(`Cannot create FiniteOrdinal from ${input}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiniteOrdinal;
} else {
    // Browser global
    window.FiniteOrdinal = FiniteOrdinal;
}
