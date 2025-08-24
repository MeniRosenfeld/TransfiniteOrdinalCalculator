// ordinal_graphical_renderer.js

// Assumes CNFOrdinal, EpsilonOrdinal, WTowerOrdinal, and optionally ENFOrdinal classes are defined.

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

    // ENFOrdinal support: render ENF terms as products of epsilon factors, ω^k, and m; sum across terms
    if (typeof ENFOrdinal !== 'undefined' && ordinal instanceof ENFOrdinal) {
        if (ordinal.isZero()) {
            return '<span class="ordinal-finite">0</span>';
        }

        const termHtml = ordinal.terms.map(term => {
            const parts = [];

            // Epsilon factors: ε_{base}^{exp}
            if (term.epsilonFactors && term.epsilonFactors.length > 0) {
                for (const factor of term.epsilonFactors) {
                    const baseHTML = renderOrdinalGraphical(factor.base);
                    let epsHTML = `<span class="ordinal-epsilon">ε<sub class="ordinal-subscript"><span class="ordinal-sub-content">${baseHTML}</span></sub>`;
                    const exp = factor.exp;
                    try {
                        const isOne = typeof exp.isOne === 'function' ? exp.isOne() : false;
                        if (!isOne) {
                            const expHTML = renderOrdinalGraphical(exp);
                            epsHTML += `<sup class="ordinal-exponent">${expHTML}</sup>`;
                        }
                    } catch (_) {
                        const expHTML = renderOrdinalGraphical(exp);
                        epsHTML += `<sup class="ordinal-exponent">${expHTML}</sup>`;
                    }
                    epsHTML += `</span>`;
                    parts.push(epsHTML);
                }
            }

            // ω^k where k is CNFOrdinal
            if (term.omegaExponent && typeof term.omegaExponent.isZero === 'function' && !term.omegaExponent.isZero()) {
                let omegaPart = '';
                if (term.omegaExponent instanceof CNFOrdinal && term.omegaExponent.equals(CNFOrdinal.ONEStatic())) {
                    omegaPart = '<span class="omega">ω</span>';
                } else {
                    const expHTML = renderOrdinalGraphical(term.omegaExponent);
                    omegaPart = `<span class="omega">ω</span><sup class="ordinal-exponent">${expHTML}</sup>`;
                }
                parts.push(omegaPart);
            }

            // finite coefficient
            if (term.coefficient && term.coefficient > 1n) {
                parts.push(`<span class="ordinal-coeff">${term.coefficient}</span>`);
            }

            if (parts.length === 0) {
                // pure finite 1
                parts.push(`<span class="ordinal-coeff">1</span>`);
            }

            return `<span class="ordinal-term">${parts.join('<span class="ordinal-op">·</span>')}</span>`;
        });

        return termHtml.join('<span class="ordinal-op">+</span>');
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
                termStr = '<span class="omega">ω</span>';
            } else { // Term is w^a*c
                const expRender = renderOrdinalGraphical(exp);
                termStr = `<span class="omega">ω</span><sup class="ordinal-exponent">${expRender}</sup>`;
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