// parser-types.ts
// Type definitions for parser tokens and results

import type { OrdinalBase } from './types/OrdinalBase.js';

// Token types
export type TokenType =
    | 'NUMBER' | 'STRING' | 'OMEGA' | 'EPSILON' | 'TUNNEL'
    | 'PLUS' | 'STAR' | 'CARET' | 'DCARET'
    | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET' | 'LBRACE' | 'RBRACE'
    | 'EQ' | 'NEQ' | 'LT' | 'GT' | 'LTE' | 'GTE' | 'COMPARE'
    | 'AND' | 'OR' | 'IMPLIES' | 'NOT'
    | 'ASSIGN' | 'SUBSTITUTE' | 'UNDERSCORE' | 'COMMA' | 'SUCCESSOR'
    | 'IDENTIFIER' | 'BOOLEAN';

export interface Token {
    type: TokenType;
    value?: string | bigint | boolean;
}

// Parse result types
export type ParseResult =
    | OrdinalBase
    | StringLiteral
    | BooleanResult
    | ComparisonResult
    | OperationTree
    | SuccessorTree
    | ComparisonOpTree
    | LogicalOpTree
    | FunctionTree
    | EpsilonTree
    | Variable;

export interface StringLiteral {
    type: 'string';
    value: string;
}

export interface BooleanResult {
    type: 'boolean';
    value: boolean;
}

export interface ComparisonResult {
    type: 'comparison';
    value: -1 | 0 | 1;
}

export interface OperationTree {
    type: 'operation';
    operator: 'add' | 'multiply' | 'power' | 'tetrate';
    left: ParseResult;
    right: ParseResult;
}

export interface SuccessorTree {
    type: 'successor';
    operand: ParseResult;
}

export interface ComparisonOpTree {
    type: 'comparison_op';
    operator: 'EQ' | 'NEQ' | 'LT' | 'GT' | 'LTE' | 'GTE' | 'COMPARE';
    left: ParseResult;
    right: ParseResult;
}

export interface LogicalOpTree {
    type: 'logical_op';
    operator: 'AND' | 'OR' | 'IMPLIES' | 'NOT';
    left?: ParseResult;
    right?: ParseResult;
    operand?: ParseResult;
}

export interface FunctionTree {
    type: 'function';
    name: string;
    args: ParseResult[];
}

export interface EpsilonTree {
    type: 'epsilon';
    index: ParseResult;
}

export interface Variable {
    type: 'variable';
    name: string;
}

// Helper type guards
export function isOrdinal(result: ParseResult): result is OrdinalBase {
    return result && typeof (result as any).isOrdinal === 'function' && (result as any).isOrdinal();
}

export function isStringLiteral(result: ParseResult): result is StringLiteral {
    return result && typeof result === 'object' && (result as any).type === 'string';
}

export function isBooleanResult(result: ParseResult): result is BooleanResult {
    return result && typeof result === 'object' && (result as any).type === 'boolean';
}

export function isComparisonResult(result: ParseResult): result is ComparisonResult {
    return result && typeof result === 'object' && (result as any).type === 'comparison';
}

export function isVariable(result: ParseResult): result is Variable {
    return result && typeof result === 'object' && (result as any).type === 'variable';
}

// Simplify result type
export interface SimplifyResult {
    simplifiedOrdinal: OrdinalBase;
    remainingBudget: number;
}
