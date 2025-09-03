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

    complexity() {
        return this.value.toString().length;
    }

    toString() {
        return this.value.toString();
    }

    // equals() and compareTo() are inherited from OrdinalBase and use rule-based system

    clone(newTracer = null) {
        return new FiniteOrdinal(this.value, newTracer || this._tracer);
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        // If even this finite number doesn't fit, fallback to 0
        const zero = new FiniteOrdinal(0, this._tracer);
        return {
            simplifiedOrdinal: zero,
            remainingBudget: complexityBudget
        };
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'Finite'; }

    static getDirectConversions() {
        return ['CNF', 'ENF']; // Can convert directly to CNF or ENF
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'CNF':
                if (typeof CNFOrdinal !== 'undefined') {
                    return new CNFOrdinal(this.value, this._tracer);
                }
                throw new Error(`CNFOrdinal type not available`);

            case 'ENF':
                if (typeof ENFOrdinal !== 'undefined') {
                    return ENFOrdinal.fromInt(this.value);
                }
                throw new Error(`ENFOrdinal type not available`);

            default:
                throw new Error(`FiniteOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

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
