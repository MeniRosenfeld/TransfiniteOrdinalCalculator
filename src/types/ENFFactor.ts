// ENFFactor.ts
// Helper class representing a factor a^b in an ENF term.

import type { OrdinalBase } from './OrdinalBase.js';
import { OmegaOrdinal } from './OmegaOrdinal.js';
import { EpsilonNumber } from './EpsilonNumber.js';
import { RenderingComponents } from '../RenderingComponents.js';

/**
 * Represents a single factor of the form a^b in an ENF term,
 * where 'a' is a basic ordinal (w or an epsilon number) and 'b' is an ENF ordinal.
 * This is a helper class and does not extend OrdinalBase.
 */
export class ENFFactor {
    readonly base: OrdinalBase;
    readonly exponent: OrdinalBase;

    /**
     * @param base - The base of the factor (must be omega or an Epsilon Number).
     * @param exponent - The exponent of the factor.
     */
    constructor(base: OrdinalBase, exponent: OrdinalBase) {
        if (!exponent || !exponent.isOrdinal || !exponent.isOrdinal()) {
            throw new Error("ENFFactor exponent must be a valid ordinal object.");
        }
        this.exponent = exponent;
        if (base.isOmega()) {
            this.base = OmegaOrdinal.instance();
        } else if (base.isEpsilonNumber()) {
            this.base = new EpsilonNumber(base.epsilonIndex());
        } else {
            throw new Error("ENFFactor base must be omega or an Epsilon Number.");
        }
    }

    /**
     * Creates a deep copy of this factor.
     */
    clone(): ENFFactor {
        return new ENFFactor(this.base, this.exponent);
    }

    /**
     * Compares this factor with another ENFFactor.
     * @returns -1 if this < other, 0 if this == other, 1 if this > other.
     */
    compareTo(other: ENFFactor): number {
        const baseCmp = this.base.compareTo(other.base);
        if (baseCmp !== 0) {
            return baseCmp;
        }
        return this.exponent.compareTo(other.exponent);
    }

    /**
     * Returns the string representation of the factor.
     */
    toString(): string {
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

    toGraphicalHTML(): string {
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
