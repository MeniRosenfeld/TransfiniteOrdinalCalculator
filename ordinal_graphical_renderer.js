// ordinal_graphical_renderer.js

// Assumes CNFOrdinal, EpsilonOrdinal, and WTowerOrdinal classes are defined.

/**
 * Renders an Ordinal object into an HTML string for graphical display.
 * @param {CNFOrdinal | EpsilonOrdinal | WTowerOrdinal} ordinal The Ordinal object to render.
 * @returns {string} The HTML string representation.
 */
function renderOrdinalGraphical(ordinal) {
    if (!ordinal) {
        return '<span class="ordinal-placeholder">Invalid Ordinal</span>';
    }

    if (ordinal instanceof EpsilonOrdinal) {
        if (ordinal.index.isZero()) {
            return `<span class="ordinal-e0">ε₀</span>`;
        }
        const indexRender = renderOrdinalGraphical(ordinal.index);
        let needsParen = ordinal.index instanceof CNFOrdinal && ordinal.index.terms.length > 1;
        if (needsParen) {
            return `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript">(<span class="ordinal-sub-content">${indexRender}</span>)</sub></span>`;
        } else {
            return `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript"><span class="ordinal-sub-content">${indexRender}</span></sub></span>`;
        }
    }

    if (ordinal instanceof WTowerOrdinal) {
        return `<span class="ordinal-w-tower">ω<sup class="ordinal-tet-op">↑↑</sup><span class="ordinal-w-tower-height">${ordinal.height}</span></span>`;
    }

    if (ordinal instanceof CNFOrdinal) {
        if (ordinal.isZero()) {
            return '<span class="ordinal-finite">0</span>';
        }

        const renderedTerms = ordinal.terms.map(term => {
            const exp = term.exponent;
            const coeff = term.coefficient;

            if (exp.isZero()) {
                return `<span class="ordinal-finite">${coeff}</span>`;
            }

            let termStr = '';
            if (exp.equals(CNFOrdinal.ONEStatic())) { // Term is w*c
                termStr = '<span class="ordinal-w">ω</span>';
            } else { // Term is w^a*c
                const expRender = renderOrdinalGraphical(exp);
                termStr = `<span class="ordinal-w">ω</span><sup class="ordinal-exponent">${expRender}</sup>`;
            }

            if (coeff > 1n) {
                termStr += `<span class="ordinal-op">·</span><span class="ordinal-coeff">${coeff}</span>`;
            }
            return `<span class="ordinal-term">${termStr}</span>`;
        });
        return renderedTerms.join('<span class="ordinal-op">+</span>');
    }

    console.error("renderOrdinalGraphical expects a CNFOrdinal, EpsilonOrdinal, or WTowerOrdinal object.", ordinal);
    return '<span class="ordinal-error">Error</span>';
}