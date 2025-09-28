// SimpleCalculator.js
// Enhanced calculator supporting ordinals, comparisons, boolean logic, strings, and functions

/**
 * Enhanced calculator supporting:
 * - Ordinal arithmetic (addition, multiplication, exponentiation, tetration)
 * - Comparison operators (=, <, >, <=, >=, !=, ?)
 * - Boolean logic (&&, ||, ->, !)
 * - String literals and operations
 * - Built-in functions (complexity, toString, parse)
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

        // Format result based on type
        let resultString;
        let resultType;

        if (result && typeof result.toString === 'function' && typeof result.isZero === 'function') {
            // Ordinal object
            resultString = result.toString();
            resultType = 'ordinal';
        } else if (result && result.type === 'string') {
            // String result
            resultString = `"${result.value}"`;
            resultType = 'string';
        } else if (result && result.type === 'boolean') {
            // Boolean result
            resultString = result.value.toString();
            resultType = 'boolean';
        } else if (result && result.type === 'comparison') {
            // Comparison result
            switch (result.value) {
                case -1: resultString = '<'; break;
                case 0: resultString = '='; break;
                case 1: resultString = '>'; break;
                default: resultString = result.value.toString();
            }
            resultType = 'comparison';
        } else if (result && result.type === 'operation') {
            // Operation tree (partially substituted expression)
            resultString = _formatOperationTree(result);
            resultType = 'operation';
        } else {
            // Fallback
            resultString = String(result);
            resultType = 'unknown';
        }

        return {
            result: result,
            resultString: resultString,
            resultType: resultType,
            error: null
        };
    } catch (e) {
        return { error: `Error: ${e.message}` };
    }
}

// Helper method to format operation trees
function _formatOperationTree(operation) {
    if (!operation || operation.type !== 'operation') {
        return String(operation);
    }

    const leftStr = _formatOperationValue(operation.left);
    const rightStr = _formatOperationValue(operation.right);

    switch (operation.operator) {
        case 'add': return `${leftStr}+${rightStr}`;
        case 'multiply': return `${leftStr}*${rightStr}`;
        case 'power': return `${leftStr}^${rightStr}`;
        case 'tetrate': return `${leftStr}^^${rightStr}`;
        default: return `${leftStr} ${operation.operator} ${rightStr}`;
    }
}

// Helper method to format individual values in operation trees
function _formatOperationValue(value) {
    if (!value || typeof value !== 'object') {
        return String(value);
    }

    if (value.toString && typeof value.toString === 'function' && typeof value.isZero === 'function') {
        // Ordinal object
        return value.toString();
    } else if (value.type === 'variable') {
        return value.name;
    } else if (value.type === 'operation') {
        // Recursive formatting with parentheses for nested operations
        return `(${_formatOperationTree(value)})`;
    } else if (value.type === 'string') {
        return `"${value.value}"`;
    } else if (value.type === 'boolean') {
        return value.value.toString();
    } else {
        return String(value);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculateSimple;
} else {
    // Browser global
    window.calculateSimple = calculateSimple;
}
