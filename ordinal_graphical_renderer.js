// ordinal_graphical_renderer.js

// Assumes CNFOrdinal class and its methods (isZero, terms, exponent, coefficient, equals, ONEStatic)
// are available globally or via modules if this were refactored.
// Assumes EpsilonNaughtOrdinal class is defined.

/**
 * Renders an Ordinal object (CNFOrdinal or EpsilonNaughtOrdinal) into an HTML string for graphical display.
 * Uses ω for omega, ε₀ for epsilon-naught, and actual superscripts for exponentiation.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal} ordinal The Ordinal object to render.
 * @returns {string} HTML string representation.
 */
function renderOrdinalGraphical(ordinal) {
    if (!ordinal) {
        console.error("renderOrdinalGraphical received null or undefined input.");
        return '<span style="color:red;">Error: Invalid input to renderer</span>';
    }

    if (ordinal instanceof EpsilonNaughtOrdinal) {
        return '<span class="epsilon-naught">ε<sub>0</sub></span>';
    }

    if (ordinal instanceof CNFOrdinal) {
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

                if (!expOrdinal.equals(CNFOrdinal.ONEStatic())) { // Use CNFOrdinal.ONEStatic()
                    // Recursively render the exponent.
                    // The CSS will handle font size reduction for `sup`.
                    const expRendered = renderOrdinalGraphical(expOrdinal); // Recursive call
                    termStr += `<sup>${expRendered}</sup>`;
                }
                // else: exponent is 1, so it's just ω (no explicit ^1 displayed)

                if (coeff > 1n) { // Changed from > 1 to > 1n for BigInt comparison
                    // Standard CNF writes coefficient after: ω^A*c
                    // Use · for the center dot multiplication symbol
                    termStr += `<span class="operator multiplication-dot">·</span><span class="coefficient">${coeff}</span>`;
                }
            }
            return `<span class="ord-term">${termStr}</span>`;
        });

        return renderedTerms.join('<span class="operator addition-plus"> + </span>'); // Added class for + operator
    }

    // Fallback for unknown ordinal types
    console.error("renderOrdinalGraphical expects a CNFOrdinal or EpsilonNaughtOrdinal object.", ordinal);
    return '<span style="color:red;">Error: Unknown ordinal type</span>';
}