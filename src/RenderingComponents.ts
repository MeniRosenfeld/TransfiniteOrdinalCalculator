// RenderingComponents.ts
// Shared rendering components for all ordinal types

import type { OrdinalBase } from './types/OrdinalBase.js';
import { CNFOrdinal } from './types/CNFOrdinal.js';

/**
 * Shared rendering functions that all ordinal types can use.
 * This avoids duplication while allowing type-specific assembly.
 */
export class RenderingComponents {

    /**
     * Renders a finite number.
     */
    static renderFinite(value: bigint | number | string): string {
        return `<span class="ordinal-finite">${value}</span>`;
    }

    /**
     * Renders omega (ω).
     */
    static renderOmega(): string {
        return '<span class="omega">ω</span>';
    }

    /**
     * Renders epsilon zero (ε₀).
     */
    static renderEpsilonZero(): string {
        return '<span class="ordinal-e0">ε₀</span>';
    }

    /**
     * Renders omega with an exponent (ω^k).
     */
    static renderOmegaPower(exponentHTML: string): string {
        return `<span class="omega">ω</span><sup class="ordinal-exponent">${exponentHTML}</sup>`;
    }

    /**
     * Renders an epsilon number (ε_k).
     */
    static renderEpsilon(indexHTML: string, needsParentheses: boolean = false): string {
        if (needsParentheses) {
            return `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript">(<span class="ordinal-sub-content">${indexHTML}</span>)</sub></span>`;
        } else {
            return `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript"><span class="ordinal-sub-content">${indexHTML}</span></sub></span>`;
        }
    }

    /**
     * Renders an epsilon with an exponent (ε_k^n).
     */
    static renderEpsilonPower(indexHTML: string, exponentHTML: string, needsIndexParentheses: boolean = false): string {
        const epsilonBase = RenderingComponents.renderEpsilon(indexHTML, needsIndexParentheses);
        return `${epsilonBase}<sup class="ordinal-exponent">${exponentHTML}</sup>`;
    }

    /**
     * Renders a tower notation (ω↑↑n or ε_k↑↑n).
     */
    static renderTower(baseHTML: string, height: string | number | bigint): string {
        return `<span class="ordinal-tower">${baseHTML}<span class="ordinal-tet-op">↑↑</span><span class="ordinal-tower-height">${height}</span></span>`;
    }

    /**
     * Renders a tunnel notation (ε↓↓n for deeply nested epsilon structures).
     */
    static renderTunnel(depth: string | number | bigint): string {
        return `<span class="ordinal-tunnel">ε<span class="ordinal-tunnel-op">↓↓</span><span class="ordinal-tunnel-depth">${depth}</span></span>`;
    }

    /**
     * Renders a coefficient multiplier.
     */
    static renderCoefficient(value: bigint | number | string): string {
        return `<span class="ordinal-coeff">${value}</span>`;
    }

    /**
     * Renders a multiplication operator (·).
     */
    static renderMultiplyOp(): string {
        return '<span class="ordinal-op">·</span>';
    }

    /**
     * Renders an addition operator (+).
     */
    static renderAddOp(): string {
        return '<span class="ordinal-op">+</span>';
    }

    /**
     * Joins multiple term HTMLs with addition operators.
     */
    static joinTerms(termHTMLs: string[]): string {
        return termHTMLs.join(RenderingComponents.renderAddOp());
    }

    /**
     * Joins multiple factor HTMLs with multiplication operators.
     */
    static joinFactors(factorHTMLs: string[]): string {
        return factorHTMLs.join(RenderingComponents.renderMultiplyOp());
    }

    /**
     * Wraps content in a term container.
     */
    static wrapTerm(content: string): string {
        return `<span class="ordinal-term">${content}</span>`;
    }

    /**
     * Wraps content in parentheses for grouping clarity.
     */
    static wrapParentheses(content: string): string {
        return `(${content})`;
    }

    /**
     * Determines if parentheses are needed for an index based on complexity.
     */
    static needsIndexParentheses(ordinal: OrdinalBase): boolean {
        // Graphical rendering policy: no parentheses needed for indices.
        // Subscripts provide implicit grouping, making parentheses unnecessary.
        return false;
    }

    /**
     * Determines if parentheses are needed for an exponent.
     */
    static needsExponentParentheses(ordinal: OrdinalBase): boolean {
        // Graphical rendering policy: no parentheses needed for exponents.
        // Superscripts provide implicit grouping, making parentheses unnecessary.
        return false;
    }

    /**
     * Note: While subscripts and superscripts generally provide implicit grouping,
     * there are specific cases where parentheses improve readability:
     * - When epsilon numbers have exponents: (ε_k)^b vs ε_k^b (which looks like ε_(k^b))
     * These cases are handled specifically in the relevant rendering methods.
     */

    /**
     * Renders a CNF term (ω^a*c).
     */
    static renderCNFTerm(exponent: OrdinalBase, coefficient: bigint): string {
        const parts = [];

        if (exponent.isZero()) {
            // Finite term
            return RenderingComponents.renderFinite(coefficient);
        }

        // Check if exponent equals 1 
        if (exponent instanceof CNFOrdinal && exponent.equals) {
            const one = CNFOrdinal.ONEStatic();
            if (exponent.equals(one)) {
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
