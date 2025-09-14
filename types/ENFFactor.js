// ENFFactor.js
// Helper class representing a factor a^b in an ENF term.

/**
 * Represents a single factor of the form a^b in an ENF term,
 * where 'a' is a basic ordinal (w or an epsilon number) and 'b' is an ENF ordinal.
 * This is a helper class and does not extend OrdinalBase.
 */
class ENFFactor {
    /**
     * @param {OrdinalBase} base - The base of the factor (must be OmegaOrdinal or EpsilonNumber).
     * @param {ENFOrdinal} exponent - The exponent of the factor.
     */
    constructor(base, exponent) {
        if (!(base instanceof OmegaOrdinal || base instanceof EpsilonNumber)) {
            throw new Error("ENFFactor base must be an OmegaOrdinal or EpsilonNumber.");
        }
        if (!exponent || !exponent.isOrdinal()) {
            throw new Error("ENFFactor exponent must be a valid ordinal object.");
        }
        this.base = base;
        this.exponent = exponent;
    }

    /**
     * Creates a deep copy of this factor.
     * @returns {ENFFactor} A new ENFFactor instance.
     */
    clone() {
        return new ENFFactor(this.base.clone(), this.exponent.clone());
    }

    /**
     * Compares this factor with another ENFFactor.
     * @param {ENFFactor} other The factor to compare against.
     * @returns {number} -1 if this < other, 0 if this == other, 1 if this > other.
     */
    compareTo(other) {
        const baseCmp = this.base.compareTo(other.base);
        if (baseCmp !== 0) {
            return baseCmp;
        }
        return this.exponent.compareTo(other.exponent);
    }

    /**
     * Returns the string representation of the factor.
     * @returns {string}
     */
    toString() {
        const baseStr = this.base.toString();
        const expStr = this.exponent.toString();

        if (this.exponent.isOne()) {
            return baseStr;
        }

        // Parenthesize exponent if it's a sum
        const needsParen = this.exponent.terms.length > 1;
        if (needsParen) {
            return `${baseStr}^(${expStr})`;
        } else {
            return `${baseStr}^${expStr}`;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENFFactor;
} else {
    // Browser global
    window.ENFFactor = ENFFactor;
}
