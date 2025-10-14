// SimpleCalculator.ts
// Enhanced calculator supporting ordinals, comparisons, boolean logic, strings, and functions

import { OperationTracer } from './OperationTracer.js';
import { SimpleParser } from './SimpleParser.js';
import type { ParseResult } from './parser-types.js';

export interface CalculationResult {
    result?: ParseResult;
    resultString: string;
    resultType: string;
    error: string | null;
}

/**
 * Enhanced calculator supporting:
 * - Ordinal arithmetic (addition, multiplication, exponentiation, tetration)
 * - Comparison operators (=, <, >, <=, >=, !=, ?)
 * - Boolean logic (&&, ||, ->, !)
 * - String literals and operations
 * - Built-in functions (complexity, toString, parse)
 */
export function calculateSimple(expressionString: string, maxOperations: number = 10000): CalculationResult {
    if (typeof expressionString !== 'string') {
        return { error: "Error: Input must be a string.", resultString: '', resultType: 'error' };
    }

    try {
        // Reset global tracer for this calculation
        OperationTracer.setGlobalTracer(maxOperations);
        const parser = new SimpleParser(expressionString);
        const result = parser.parse();

        // Format result based on type
        let resultString;
        let resultType;
        const resultAny: any = result;

        if (result && typeof result.toString === 'function' && typeof resultAny.isZero === 'function') {
            // Ordinal object
            resultString = result.toString();
            resultType = 'ordinal';
        } else if (result && resultAny.type === 'string') {
            // String result
            resultString = `"${resultAny.value}"`;
            resultType = 'string';
        } else if (result && resultAny.type === 'boolean') {
            // Boolean result
            resultString = resultAny.value.toString();
            resultType = 'boolean';
        } else if (result && resultAny.type === 'comparison') {
            // Comparison result
            switch (resultAny.value) {
                case -1: resultString = '<'; break;
                case 0: resultString = '='; break;
                case 1: resultString = '>'; break;
                default: resultString = resultAny.value.toString();
            }
            resultType = 'comparison';
        } else if (result && resultAny.type === 'operation') {
            // Operation tree (partially substituted expression)
            resultString = _formatOperationTree(result);
            resultType = 'operation';
        } else if (result && resultAny.type === 'variable') {
            // Variable
            resultString = resultAny.name;
            resultType = 'variable';
        } else if (result && resultAny.type === 'successor') {
            // Successor tree
            resultString = _formatSuccessorTree(result);
            resultType = 'successor';
        } else if (result && resultAny.type === 'comparison_op') {
            // Comparison operation tree
            resultString = _formatComparisonOpTree(result);
            resultType = 'comparison_op';
        } else if (result && resultAny.type === 'function') {
            // Function tree
            resultString = _formatFunctionTree(result);
            resultType = 'function';
        } else if (result && resultAny.type === 'epsilon') {
            // Epsilon tree
            resultString = _formatEpsilonTree(result);
            resultType = 'epsilon';
        } else if (result && resultAny.type === 'logical_op') {
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
    } catch (e: any) {
        return { error: `Error: ${e.message}`, resultString: '', resultType: 'error' };
    }
}

// Helper method to format operation trees
function _formatOperationTree(operation: any): string {
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
function _formatOperationValue(value: any): string {
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
function _formatSuccessorTree(successor: any): string {
    if (!successor || successor.type !== 'successor') {
        return String(successor);
    }
    const operandStr = _formatOperationValue(successor.operand);
    return `${operandStr}'`;
}

// Format comparison operation trees  
function _formatComparisonOpTree(comp: any): string {
    if (!comp || comp.type !== 'comparison_op') {
        return String(comp);
    }
    const leftStr = _formatOperationValue(comp.left);
    const rightStr = _formatOperationValue(comp.right);
    const opStr = _comparisonOperatorToString(comp.operator);
    return `${leftStr} ${opStr} ${rightStr}`;
}

// Format function trees
function _formatFunctionTree(func: any): string {
    if (!func || func.type !== 'function') {
        return String(func);
    }
    const argsStr = func.args.map((arg: any) => _formatOperationValue(arg)).join(',');
    return `${func.name}[${argsStr}]`;
}

// Format epsilon trees
function _formatEpsilonTree(epsilon: any): string {
    if (!epsilon || epsilon.type !== 'epsilon') {
        return String(epsilon);
    }
    const indexStr = _formatOperationValue(epsilon.index);
    return `e_${indexStr}`;
}

// Format logical operation trees
function _formatLogicalOpTree(logical: any): string {
    if (!logical || logical.type !== 'logical_op') {
        return String(logical);
    }
    const leftStr = _formatOperationValue(logical.left);
    const rightStr = _formatOperationValue(logical.right);
    const opStr = _logicalOperatorToString(logical.operator);
    return `${leftStr} ${opStr} ${rightStr}`;
}

// Helper for comparison operators
function _comparisonOperatorToString(operator: any): string {
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
function _logicalOperatorToString(operator: any): string {
    switch (operator) {
        case 'AND': return '&&';
        case 'OR': return '||';
        case 'IMPLIES': return '->';
        default: return operator;
    }
}
