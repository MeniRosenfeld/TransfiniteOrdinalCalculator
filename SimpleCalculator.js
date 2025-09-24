// SimpleCalculator.js
// Simple calculator using new architecture (finite ordinals + addition only)

/**
 * Simple calculator for finite ordinals and addition.
 * This is the starting point that will grow to support more operations.
 */
function calculateSimple(expressionString, maxOperations = 10000) {
    if (typeof expressionString !== 'string') {
        return { error: "Error: Input must be a string." };
    }

    try {
        // Reset global tracer for this calculation
        OperationTracer.setGlobalTracer(maxOperations);
        const parser = new SimpleParser(expressionString);
        const result = parser.parse();

        return {
            result: result,
            resultString: result.toString(),
            error: null
        };
    } catch (e) {
        return { error: `Error: ${e.message}` };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculateSimple;
} else {
    // Browser global
    window.calculateSimple = calculateSimple;
}
