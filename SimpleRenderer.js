// SimpleRenderer.js
// Simple graphical renderer for new architecture ordinals

/**
 * Renders an ordinal to HTML using the new architecture.
 * Each ordinal type implements its own toGraphicalHTML() method.
 */
function renderOrdinalSimple(ordinal) {
    if (!ordinal) {
        return '<span class="ordinal-error">Invalid Ordinal</span>';
    }

    // Try type-specific rendering first
    if (typeof ordinal.toGraphicalHTML === 'function') {
        return ordinal.toGraphicalHTML();
    }

    // Fallback to string representation
    return `<span class="ordinal-generic">${ordinal.toString()}</span>`;
}

/**
 * Renders an ordinal from its string representation.
 * This maintains compatibility with the existing renderOrdinalGraphicalFromString function.
 */
function renderOrdinalGraphicalFromStringSimple(ordinalString) {
    try {
        const tracer = new OperationTracer(10000);
        const parser = new SimpleParser(ordinalString, tracer);
        const ordinal = parser.parse();
        return renderOrdinalSimple(ordinal);
    } catch (e) {
        console.error('renderOrdinalGraphicalFromStringSimple: failed to parse/render string:', ordinalString, e);
        return `<span class="ordinal-error">Error: ${e.message}</span>`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderOrdinalSimple, renderOrdinalGraphicalFromStringSimple };
} else {
    // Browser globals
    window.renderOrdinalSimple = renderOrdinalSimple;
    window.renderOrdinalGraphicalFromStringSimple = renderOrdinalGraphicalFromStringSimple;
}
