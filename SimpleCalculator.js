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
        } else if (result && result.type === 'variable') {
            // Variable
            resultString = result.name;
            resultType = 'variable';
        } else if (result && result.type === 'successor') {
            // Successor tree
            resultString = _formatSuccessorTree(result);
            resultType = 'successor';
        } else if (result && result.type === 'comparison_op') {
            // Comparison operation tree
            resultString = _formatComparisonOpTree(result);
            resultType = 'comparison_op';
        } else if (result && result.type === 'function') {
            // Function tree
            resultString = _formatFunctionTree(result);
            resultType = 'function';
        } else if (result && result.type === 'epsilon') {
            // Epsilon tree
            resultString = _formatEpsilonTree(result);
            resultType = 'epsilon';
        } else if (result && result.type === 'logical_op') {
            // Logical operation tree
            resultString = _formatLogicalOpTree(result);
            resultType = 'logical_op';
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
    } else if (value.type === 'successor') {
        return _formatSuccessorTree(value);
    } else if (value.type === 'comparison_op') {
        return _formatComparisonOpTree(value);
    } else if (value.type === 'function') {
        return _formatFunctionTree(value);
    } else if (value.type === 'epsilon') {
        return _formatEpsilonTree(value);
    } else if (value.type === 'logical_op') {
        return _formatLogicalOpTree(value);
    } else if (value.type === 'string') {
        return `"${value.value}"`;
    } else if (value.type === 'boolean') {
        return value.value.toString();
    } else {
        return String(value);
    }
}

// Format successor trees
function _formatSuccessorTree(successor) {
    if (!successor || successor.type !== 'successor') {
        return String(successor);
    }
    const operandStr = _formatOperationValue(successor.operand);
    return `${operandStr}'`;
}

// Format comparison operation trees  
function _formatComparisonOpTree(comp) {
    if (!comp || comp.type !== 'comparison_op') {
        return String(comp);
    }
    const leftStr = _formatOperationValue(comp.left);
    const rightStr = _formatOperationValue(comp.right);
    const opStr = _comparisonOperatorToString(comp.operator);
    return `${leftStr} ${opStr} ${rightStr}`;
}

// Format function trees
function _formatFunctionTree(func) {
    if (!func || func.type !== 'function') {
        return String(func);
    }
    const argsStr = func.args.map(arg => _formatOperationValue(arg)).join(',');
    return `${func.name}[${argsStr}]`;
}

// Format epsilon trees
function _formatEpsilonTree(epsilon) {
    if (!epsilon || epsilon.type !== 'epsilon') {
        return String(epsilon);
    }
    const indexStr = _formatOperationValue(epsilon.index);
    return `e_${indexStr}`;
}

// Format logical operation trees
function _formatLogicalOpTree(logical) {
    if (!logical || logical.type !== 'logical_op') {
        return String(logical);
    }
    const leftStr = _formatOperationValue(logical.left);
    const rightStr = _formatOperationValue(logical.right);
    const opStr = _logicalOperatorToString(logical.operator);
    return `${leftStr} ${opStr} ${rightStr}`;
}

// Helper for comparison operators
function _comparisonOperatorToString(operator) {
    switch (operator) {
        case 'EQ': return '=';
        case 'NEQ': return '!=';
        case 'LT': return '<';
        case 'GT': return '>';
        case 'LTE': return '<=';
        case 'GTE': return '>=';
        case 'COMPARE': return '?';
        default: return operator;
    }
}

// Helper for logical operators
function _logicalOperatorToString(operator) {
    switch (operator) {
        case 'AND': return '&&';
        case 'OR': return '||';
        case 'IMPLIES': return '->';
        default: return operator;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculateSimple;
} else {
    // Browser global
    window.calculateSimple = calculateSimple;
}
