// FiniteOrdinal.js
// Represents finite ordinal numbers (0, 1, 2, 3, ...)

/**
 * Represents a finite ordinal number.
 * This is the most basic ordinal type.
 */
class FiniteOrdinal extends OrdinalBase {
    constructor(value = 0) {
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
        
        // Consume operation for construction
        OperationTracer.consume();
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

    isWellFormed() {
        return (typeof this.value === 'bigint') && this.value >= 0n;
    }

    rank() {
        if (this.isZero()) return new FiniteOrdinal(0n);
        return new FiniteOrdinal(1n);
    }

    log() {
        if (this.isZero()) {
            throw new Error('Log of 0 is undefined.');
        }
        return new ZeroOrdinal();
    }

    logStar() {
        if (this.isZero()) {
            return -1n;
        } else {
            return 0n;
        }
    }

    isTower() {
        return this.value === 0n || this.value === 1n;
    }

    getFiniteBigInt() { return this.value; }

    getFinitePart() { return this.value; }
    needsParenthesesAsExponent() { return false; }

    nextRank() {
        if (this.isZero()) return new OneOrdinal();
        return new OmegaOrdinal();
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

    clone() {
        return new FiniteOrdinal(this.value);
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        OperationTracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        const zero = new ZeroOrdinal();
        const zeroComplexity = zero.complexity();
        if (zeroComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: zero,
                remainingBudget: complexityBudget - zeroComplexity
            };
        }

        return { simplifiedOrdinal: zero, remainingBudget: 0 };
    }

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('FiniteOrdinal is not an epsilon number');
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
                return new CNFOrdinal(this.value);
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
    static from(input) {
        if (input instanceof FiniteOrdinal) {
            return input.clone();
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiniteOrdinal;
} else {
    // Browser global
    window.FiniteOrdinal = FiniteOrdinal;
}
