// RenderingComponents.js
// Shared rendering components for all ordinal types

/**
 * Shared rendering functions that all ordinal types can use.
 * This avoids duplication while allowing type-specific assembly.
 */
class RenderingComponents {

    /**
     * Renders a finite number.
     */
    static renderFinite(value) {
        return `<span class="ordinal-finite">${value}</span>`;
    }

    /**
     * Renders omega (ω).
     */
    static renderOmega() {
        return '<span class="omega">ω</span>';
    }

    /**
     * Renders epsilon zero (ε₀).
     */
    static renderEpsilonZero() {
        return '<span class="ordinal-e0">ε₀</span>';
    }

    /**
     * Renders omega with an exponent (ω^k).
     */
    static renderOmegaPower(exponentHTML) {
        return `<span class="omega">ω</span><sup class="ordinal-exponent">${exponentHTML}</sup>`;
    }

    /**
     * Renders an epsilon number (ε_k).
     */
    static renderEpsilon(indexHTML, needsParentheses = false) {
        if (needsParentheses) {
            return `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript">(<span class="ordinal-sub-content">${indexHTML}</span>)</sub></span>`;
        } else {
            return `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript"><span class="ordinal-sub-content">${indexHTML}</span></sub></span>`;
        }
    }

    /**
     * Renders an epsilon with an exponent (ε_k^n).
     */
    static renderEpsilonPower(indexHTML, exponentHTML, needsIndexParentheses = false) {
        const epsilonBase = RenderingComponents.renderEpsilon(indexHTML, needsIndexParentheses);
        return `${epsilonBase}<sup class="ordinal-exponent">${exponentHTML}</sup>`;
    }

    /**
     * Renders a tower notation (ω↑↑n or ε_k↑↑n).
     */
    static renderTower(baseHTML, height) {
        return `<span class="ordinal-tower">${baseHTML}<span class="ordinal-tet-op">↑↑</span><span class="ordinal-tower-height">${height}</span></span>`;
    }

    /**
     * Renders a coefficient multiplier.
     */
    static renderCoefficient(value) {
        return `<span class="ordinal-coeff">${value}</span>`;
    }

    /**
     * Renders a multiplication operator (·).
     */
    static renderMultiplyOp() {
        return '<span class="ordinal-op">·</span>';
    }

    /**
     * Renders an addition operator (+).
     */
    static renderAddOp() {
        return '<span class="ordinal-op">+</span>';
    }

    /**
     * Joins multiple term HTMLs with addition operators.
     */
    static joinTerms(termHTMLs) {
        return termHTMLs.join(RenderingComponents.renderAddOp());
    }

    /**
     * Joins multiple factor HTMLs with multiplication operators.
     */
    static joinFactors(factorHTMLs) {
        return factorHTMLs.join(RenderingComponents.renderMultiplyOp());
    }

    /**
     * Wraps content in a term container.
     */
    static wrapTerm(content) {
        return `<span class="ordinal-term">${content}</span>`;
    }

    /**
     * Determines if parentheses are needed for an index based on complexity.
     */
    static needsIndexParentheses(ordinal) {
        // Graphical rendering policy: no parentheses needed for indices.
        // Keep function for future flexibility.
        return false;
    }

    /**
     * Determines if parentheses are needed for an exponent.
     */
    static needsExponentParentheses(ordinal) {
        // Graphical rendering policy: no parentheses needed for exponents.
        // Keep function for future flexibility.
        return false;
    }

    /**
     * Renders a CNF term (ω^a*c).
     */
    static renderCNFTerm(exponent, coefficient) {
        const parts = [];

        if (exponent.isZero()) {
            // Finite term
            return RenderingComponents.renderFinite(coefficient);
        }

        if ((exponent instanceof CNFOrdinal) && exponent.equals(CNFOrdinal.ONEStatic())) {
            // ω^1 = ω
            parts.push(RenderingComponents.renderOmega());
        } else {
            // ω^a where a ≠ 1
            const expHTML = exponent.toGraphicalHTML();
            const needsParen = RenderingComponents.needsExponentParentheses(exponent);
            if (needsParen) {
                parts.push(`<span class="omega">ω</span><sup class="ordinal-exponent">(${expHTML})</sup>`);
            } else {
                parts.push(`<span class="omega">ω</span><sup class="ordinal-exponent">${expHTML}</sup>`);
            }
        }

        if (coefficient > 1n) {
            parts.push(RenderingComponents.renderCoefficient(coefficient));
        }

        return RenderingComponents.wrapTerm(RenderingComponents.joinFactors(parts));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderingComponents;
} else {
    // Browser global
    window.RenderingComponents = RenderingComponents;
}
