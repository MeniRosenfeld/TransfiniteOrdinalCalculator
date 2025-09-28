// OrdinalBase.js
// Base contract that all ordinal types must implement

/**
 * Base class defining the contract for all ordinal types.
 * This is an abstract base - all methods must be implemented by subclasses.
 */
class OrdinalBase {
    constructor() {
        this._ordinalBrand = Symbol.for('TransfiniteOrdinal.OrdinalBrand');
        // Consume operation for construction using global tracer
        OperationTracer.consume(1);
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
     * Returns BigInt value if finite, otherwise throws.
     */
    getFiniteBigInt() { throw new Error(`${this.constructor.name} must implement getFiniteBigInt()`); }

    /**
     * Returns the finite part of this ordinal as a BigInt.
     * For finite ordinals, returns the ordinal value.
     * For infinite ordinals, returns the finite additive part (0n if none).
     */
    getFinitePart() { throw new Error(`${this.constructor.name} must implement getFinitePart()`); }
    needsParenthesesAsExponent() { throw new Error(`${this.constructor.name} must implement needsParenthesesAsExponent()`); }

    leftPredecessor() {
        if (this.isZero()) {
            throw new Error("Cannot take left predecessor of zero");
        }
        if (this.isFinite()) {
            const n = this.getFiniteBigInt();
            return new FiniteOrdinal(n - 1n);
        }
        // For infinite ordinals, left predecessor is itself
        return this;
    }

    /**
     * Returns the first ordinal larger than this from the list [1, ω, ε₀].
     */
    nextRank() { throw new Error(`${this.constructor.name} must implement nextRank()`); }

    /**
     * Returns true if this ordinal equals 1.
     */
    isOne() { throw new Error(`${this.constructor.name} must implement isOne()`); }

    /**
     * Returns true if this ordinal is less than ε₀.
     */
    isLessThanEpsilon0() { throw new Error(`${this.constructor.name} must implement isLessThanEpsilon0()`); }

    /**
     * Returns true if this ordinal is less than ζ₀.
     * For all currently defined ordinal types, this is true.
     * Specific exceptions can override this in their own classes.
     */
    isLessThanZeta0() { return true; }

    /**
     * Coarse rank tier classification:
     * 0 if zero; 1 if finite; 2 if < ε₀; 3 if < ζ₀; otherwise 4.
     */
    rankTier() {
        if (this.isZero()) return 0;
        if (this.isFinite()) return 1;
        if (this.isLessThanEpsilon0()) return 2;
        if (this.isLessThanZeta0()) return 3;
        return 4;
    }

    /**
     * Returns true if this ordinal equals ω.
     */
    isOmega() { throw new Error(`${this.constructor.name} must implement isOmega()`); }

    /**
     * Returns true if this ordinal is a "basic" ordinal (ω or ε_k).
     */
    isBasic() { throw new Error(`${this.constructor.name} must implement isBasic()`); }

    /**
     * Returns true if this ordinal is a limit ordinal.
     */
    isLimit() { throw new Error(`${this.constructor.name} must implement isLimit()`); }

    /**
     * Returns true if this ordinal can be represented as (a.rank) ^^ n for some finite n.
     */
    isTower() { throw new Error(`${this.constructor.name} must implement isTower()`); }

    /**
     * Returns true if this ordinal is an epsilon number (e_k for some k).
     */
    isEpsilonNumber() { throw new Error(`${this.constructor.name} must implement isEpsilonNumber()`); }

    /**
     * Returns the index k if this ordinal is e_k, otherwise throws an error.
     */
    epsilonIndex() { throw new Error(`${this.constructor.name} must implement epsilonIndex()`); }

    /**
     * Returns true if the internal structure is valid per the type's definition.
     * Defaults to true for types that have no additional invariants or are pending implementation.
     */
    isWellFormed() { return true; }

    /**
     * Returns the successor of this ordinal (this + 1).
     */
    successor() {
        // This relies on the global availability of FiniteOrdinal and the rule-based addition system
        return this.add(OneOrdinal.instance());
    }

    /**
     * Returns the rank of this ordinal.
     */
    rank() { throw new Error(`${this.constructor.name} must implement rank()`); }

    /**
     * Returns the log of this ordinal.
     */
    log() { throw new Error(`${this.constructor.name} must implement log()`); }

    /**
     * Returns the logStar of this ordinal.
     */
    logStar() { throw new Error(`${this.constructor.name} must implement logStar()`); }

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
     * Converts this ordinal into the f(·) mapping's plain-object representation.
     * Each concrete ordinal type must implement this.
     */
    toFFormat() {
        throw new Error(`${this.constructor.name} must implement toFFormat()`);
    }

    /**
     * Returns a string that includes the runtime type and the ordinal string.
     * Example: [OmegaOrdinal: w]
     */
    toStringWithType() {
        const typeName = (this && this.constructor && this.constructor.name)
            ? this.constructor.name
            : (this.constructor && this.constructor.getTypeName
                ? this.constructor.getTypeName()
                : 'UnknownType');
        return `[${typeName}: ${this.toString()}]`;
    }

    /**
 * Returns true if this ordinal equals another ordinal.
 * Uses legacy comparison for compatibility during migration.
 */
    equals(other) {
        if (typeof OPERATIONS !== 'undefined') {
            return OPERATIONS.compare(this, other) === 0;
        }
        throw new Error('Comparison engine not available');
    }

    /**
     * Compares this ordinal with another. Returns -1, 0, or 1.
     * Must be implemented by subclasses.
     */
    compareTo(other) {
        if (typeof OPERATIONS !== 'undefined') {
            return OPERATIONS.compare(this, other);
        }
        throw new Error('Comparison engine not available');
    }

    // === ARITHMETIC OPERATIONS (use legacy dispatchers during migration) ===

    add(other) {
        if (typeof OPERATIONS !== 'undefined') {
            return OPERATIONS.add(this, other);
        }
        throw new Error('Addition engine not available');
    }

    multiply(other) {
        if (typeof OPERATIONS !== 'undefined') {
            return OPERATIONS.multiply(this, other);
        }
        throw new Error('Multiplication engine not available');
    }

    power(other) {
        if (typeof OPERATIONS !== 'undefined') {
            return OPERATIONS.power(this, other);
        }
        throw new Error('Exponentiation engine not available');
    }

    tetrate(other) {
        if (typeof OPERATIONS !== 'undefined') {
            return OPERATIONS.tetrate(this, other);
        }
        throw new Error('Tetration engine not available');
    }

    tunnel() {
        // Tunnel operation: creates deeply nested epsilon structures
        // e__0 = 0, e__1 = e_0, e__2 = e_e_0, etc.

        // If this is infinite: return z_0
        if (!this.isFinite()) {
            return new ZetaZero();
        }

        // If this is finite n:
        const n = this.getFiniteBigInt();

        // If n=0, return 0
        if (n === 0n) {
            return ZeroOrdinal.instance();
        }

        // If 0<n<=10, return an EpsilonNumber e_e_e_...(n times)...0
        // For small n, we expand the structure explicitly for better performance
        if (n > 0n && n <= 10n) {
            let result = ZeroOrdinal.instance();
            for (let i = 0n; i < n; i++) {
                result = new EpsilonNumber(result);
            }
            return result;
        }

        // If n>10, return an EpsilonTunnel object of depth n
        // For large n, we use the compact tunnel representation
        return new EpsilonTunnelOrdinal(n);
    }

    /**
     * Creates a copy of this ordinal .
     */
    clone() { throw new Error(`${this.constructor.name} must implement clone()`); }

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
