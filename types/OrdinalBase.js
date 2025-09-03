// OrdinalBase.js
// Base contract that all ordinal types must implement

/**
 * Base class defining the contract for all ordinal types.
 * This is an abstract base - all methods must be implemented by subclasses.
 */
class OrdinalBase {
    constructor(operationTracer = null) {
        this._tracer = operationTracer;
        this._ordinalBrand = Symbol.for('TransfiniteOrdinal.OrdinalBrand');
    }

    // === REQUIRED UNARY METHODS ===

    /**
     * Returns true if this ordinal represents zero.
     */
    isZero() { throw new Error(`${this.constructor.name} must implement isZero()`); }

    /**
     * Returns true if this ordinal is finite.
     */
    isFinite() { throw new Error(`${this.constructor.name} must implement isFinite()`); }

    /**
     * Returns true if this ordinal is less than ε₀.
     */
    isLessThanEpsilon0() { throw new Error(`${this.constructor.name} must implement isLessThanEpsilon0()`); }

    /**
     * Returns true if this ordinal equals ω.
     */
    isOmega() { throw new Error(`${this.constructor.name} must implement isOmega()`); }

    /**
     * Returns true if this ordinal is a "basic" ordinal (ω or ε_k).
     */
    isBasic() { throw new Error(`${this.constructor.name} must implement isBasic()`); }

    /**
     * Returns the structural complexity of this ordinal.
     */
    complexity() { throw new Error(`${this.constructor.name} must implement complexity()`); }

    /**
     * Returns the string representation of this ordinal.
     */
    toString() { throw new Error(`${this.constructor.name} must implement toString()`); }

    /**
     * Returns formatted string representation.
     */
    toDisplayString(options = {}) {
        return this.toString();
    }

    /**
 * Returns true if this ordinal equals another ordinal.
 * Implemented via rule-based comparison system.
 */
    equals(other) {
        if (typeof OPERATIONS !== 'undefined' && OPERATIONS.initialized) {
            return OPERATIONS.compare(this, other) === 0;
        }
        // Fallback for during initialization
        throw new Error(`Comparison system not initialized`);
    }

    /**
     * Compares this ordinal with another. Returns -1, 0, or 1.
     * Implemented via rule-based comparison system.
     */
    compareTo(other) {
        if (typeof OPERATIONS !== 'undefined' && OPERATIONS.initialized) {
            return OPERATIONS.compare(this, other);
        }
        // Fallback for during initialization
        throw new Error(`Comparison system not initialized`);
    }

    // === ARITHMETIC OPERATIONS (delegate to rule engines) ===

    add(other) {
        if (typeof OPERATIONS !== 'undefined' && OPERATIONS.initialized) {
            return OPERATIONS.add(this, other);
        }
        throw new Error(`Operations system not initialized`);
    }

    multiply(other) {
        if (typeof OPERATIONS !== 'undefined' && OPERATIONS.initialized) {
            return OPERATIONS.multiply(this, other);
        }
        throw new Error(`Operations system not initialized`);
    }

    power(other) {
        if (typeof OPERATIONS !== 'undefined' && OPERATIONS.initialized) {
            return OPERATIONS.power(this, other);
        }
        throw new Error(`Operations system not initialized`);
    }

    tetrate(other) {
        if (typeof OPERATIONS !== 'undefined' && OPERATIONS.initialized) {
            return OPERATIONS.tetrate(this, other);
        }
        throw new Error(`Operations system not initialized`);
    }

    /**
     * Creates a copy of this ordinal with optional new tracer.
     */
    clone(newTracer = null) { throw new Error(`${this.constructor.name} must implement clone()`); }

    /**
     * Simplifies this ordinal within the given complexity budget.
     */
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        throw new Error(`${this.constructor.name} must implement simplify()`);
    }

    // === CONVERSION SYSTEM ===

    /**
     * Returns array of type names this ordinal can be directly converted to.
     */
    static getDirectConversions() {
        throw new Error(`${this.name} must implement getDirectConversions()`);
    }

    /**
     * Returns the type name for this ordinal class.
     */
    static getTypeName() {
        throw new Error(`${this.name} must implement getTypeName()`);
    }

    /**
     * Converts this ordinal to the specified target type.
     * Should only handle direct conversions - indirect paths handled by ConversionEngine.
     */
    convertTo(targetTypeName) {
        throw new Error(`${this.constructor.name} must implement convertTo() for ${targetTypeName}`);
    }

    // === UTILITY METHODS ===

    /**
     * Returns true if this object is a valid ordinal.
     */
    isOrdinal() {
        return this._ordinalBrand === Symbol.for('TransfiniteOrdinal.OrdinalBrand');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdinalBase;
} else {
    // Browser global
    window.OrdinalBase = OrdinalBase;
}
