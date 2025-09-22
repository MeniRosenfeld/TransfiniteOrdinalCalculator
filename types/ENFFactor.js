// ENFFactor.js
// Helper class representing a factor a^b in an ENF term.

/**
 * Represents a single factor of the form a^b in an ENF term,
 * where 'a' is a basic ordinal (w or an epsilon number) and 'b' is an ENF ordinal.
 * This is a helper class and does not extend OrdinalBase.
 */
class ENFFactor {
    /**
     * @param {OrdinalBase} base - The base of the factor (must be omega or an Epsilon Number).
     * @param {ENFOrdinal} exponent - The exponent of the factor.
     */
    constructor(base, exponent) {
        if (!exponent || !exponent.isOrdinal()) {
            throw new Error("ENFFactor exponent must be a valid ordinal object.");
        }
        this.exponent = exponent;
        if (base.isOmega()) {  
            this.base = new OmegaOrdinal(base._tracer);
        } else if (base.isEpsilonNumber()) {
            this.base = new EpsilonNumber(base.epsilonIndex(), base._tracer);
        } else {
            throw new Error("ENFFactor base must be omega or an Epsilon Number.");
        }

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

        // Use the ordinal's own method to determine if parentheses are needed
        if (this.exponent.needsParenthesesAsExponent()) {
            return `${baseStr}^(${expStr})`;
        } else {
            return `${baseStr}^${expStr}`;
        }
    }

    toGraphicalHTML() {
        const baseHTML = this.base.toGraphicalHTML ? this.base.toGraphicalHTML() : this.base.toString();
        
        if (this.exponent.isOne()) {
            return baseHTML;
        }

        const expHTML = this.exponent.toGraphicalHTML ? this.exponent.toGraphicalHTML() : this.exponent.toString();
        
        if (this.base.isEpsilonNumber()) {
            // For epsilon numbers with exponents, we need parentheses around the epsilon to avoid visual ambiguity
            // Without parentheses, ε_k^b looks like ε_(k^b) instead of (ε_k)^b
            const baseHTML = this.base.toGraphicalHTML ? this.base.toGraphicalHTML() : this.base.toString();
            return `${RenderingComponents.wrapParentheses(baseHTML)}<sup class="ordinal-exponent">${expHTML}</sup>`;
        } else if (this.base.isOmega()) {
            // For omega, use the omega power renderer
            return RenderingComponents.renderOmegaPower(expHTML);
        } else {
            // Generic base^exponent
            return `${baseHTML}<sup class="ordinal-exponent">${expHTML}</sup>`;
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
