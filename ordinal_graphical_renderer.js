// ordinal_graphical_renderer.js

// Assumes Ordinal class and its methods (isZero, terms, exponent, coefficient, equals, ONEStatic)
// are available globally or via modules if this were refactored.

/**
 * Renders an Ordinal object into an HTML string for graphical display.
 * Uses ω for omega, and actual superscripts for exponentiation.
 * @param {Ordinal} ordinal The Ordinal object to render.
 * @returns {string} HTML string representation.
 */
function renderOrdinalGraphical(ordinal) {
    if (!ordinal || !(ordinal instanceof Ordinal)) {
        console.error("renderOrdinalGraphical expects an Ordinal object.");
        return '<span style="color:red;">Error: Invalid input to renderer</span>';
    }

    if (ordinal.isZero()) {
        return '<span class="ord-char">0</span>';
    }

    const renderedTerms = ordinal.terms.map(term => {
        let termStr = '';
        const expOrdinal = term.exponent;
        const coeff = term.coefficient;

        if (expOrdinal.isZero()) { // Term is a finite number (w^0 * coeff)
            termStr = `<span class="coefficient">${coeff}</span>`;
        } else {
            // Term has an omega part
            termStr += '<span class="omega">ω</span>';

            if (!expOrdinal.equals(Ordinal.ONEStatic())) { // Exponent is not 1
                // Recursively render the exponent.
                // The CSS will handle font size reduction for `sup`.
                const expRendered = renderOrdinalGraphical(expOrdinal);
                termStr += `<sup>${expRendered}</sup>`;
            }
            // else: exponent is 1, so it's just ω (no explicit ^1 displayed)

            if (coeff > 1) {
                // Standard CNF writes coefficient after: ω^A*c
                // Use · for the center dot multiplication symbol
                termStr += `<span class="operator multiplication-dot">·</span><span class="coefficient">${coeff}</span>`;
            }
        }
        return `<span class="ord-term">${termStr}</span>`;
    });

    return renderedTerms.join('<span class="operator"> + </span>');
}