// SimpleParser.ts
// Comprehensive parser for ordinal expressions and boolean/comparison operations

import type { OrdinalBase } from './types/OrdinalBase.js';
import type { ParseResult, Token, TokenType, Variable, FunctionTree, ComparisonOpTree, EpsilonTree, SuccessorTree, OperationTree, LogicalOpTree, BooleanResult, ComparisonResult } from './parser-types.js';
import { FiniteOrdinal } from './types/FiniteOrdinal.js';
import { OmegaOrdinal } from './types/OmegaOrdinal.js';
import { EpsilonZero } from './types/EpsilonZero.js';
import { EpsilonNumber } from './types/EpsilonNumber.js';
import { EpsilonTunnelOrdinal } from './types/EpsilonTunnelOrdinal.js';
import { ZeroOrdinal } from './types/ZeroOrdinal.js';
import { OneOrdinal } from './types/OneOrdinal.js';

export class SimpleParser {
    private inputString: string;
    private tokens: Token[];
    private pos: number;

    constructor(inputString: string) {
        this.inputString = inputString.trim();
        this.tokens = this._tokenize(inputString);
        this.pos = 0;
    }

    private _tokenize(str: string): Token[] {
        // Comprehensive regex for all supported tokens
        const regex = /\s*(?:("(?:[^"\\]|\\.)*")|(\d+)|(w)|(e__)|(e_)|(:=)|(\/\.)|(\{)|(\})|(<=)|(>=)|(!=)|(->)|(\|\|)|(&&)|(\?)|(<)|(>)|(=)|(\+)|(\*)|(\^\^)|(\^)|(\[)|(\])|(\()|(\))|(!)|(_)|(,)|(')|([a-zA-Z_][a-zA-Z0-9_]*)|(\S))\s*/g;
        const tokens: Token[] = [];
        let match;

        while ((match = regex.exec(str)) !== null) {
            if (match[1]) { // String literal
                // Remove quotes and handle escape sequences
                const stringValue = match[1].slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                tokens.push({ type: 'STRING', value: stringValue });
            } else if (match[2]) { // Number
                tokens.push({ type: 'NUMBER', value: BigInt(match[2]) });
            } else if (match[3]) { // Omega 'w'
                tokens.push({ type: 'OMEGA' });
            } else if (match[4]) { // Tunnel 'e__'
                tokens.push({ type: 'TUNNEL' });
            } else if (match[5]) { // Epsilon 'e_'
                tokens.push({ type: 'EPSILON' });
            } else if (match[6]) { // Assignment :=
                tokens.push({ type: 'ASSIGN' });
            } else if (match[7]) { // Substitution operator /.
                tokens.push({ type: 'SUBSTITUTE' });
            } else if (match[8]) { // Left brace {
                tokens.push({ type: 'LBRACE' });
            } else if (match[9]) { // Right brace }
                tokens.push({ type: 'RBRACE' });
            } else if (match[10]) { // Less than or equal <=
                tokens.push({ type: 'LTE' });
            } else if (match[11]) { // Greater than or equal >=
                tokens.push({ type: 'GTE' });
            } else if (match[12]) { // Not equal !=
                tokens.push({ type: 'NEQ' });
            } else if (match[13]) { // Implication ->
                tokens.push({ type: 'IMPLIES' });
            } else if (match[14]) { // Logical OR ||
                tokens.push({ type: 'OR' });
            } else if (match[15]) { // Logical AND &&
                tokens.push({ type: 'AND' });
            } else if (match[16]) { // Comparison operator ?
                tokens.push({ type: 'COMPARE' });
            } else if (match[17]) { // Less than <
                tokens.push({ type: 'LT' });
            } else if (match[18]) { // Greater than >
                tokens.push({ type: 'GT' });
            } else if (match[19]) { // Equal =
                tokens.push({ type: 'EQ' });
            } else if (match[20]) { // Plus
                tokens.push({ type: 'PLUS' });
            } else if (match[21]) { // Multiply
                tokens.push({ type: 'STAR' });
            } else if (match[22]) { // Double caret ^^ (tetration)
                tokens.push({ type: 'DCARET' });
            } else if (match[23]) { // Caret ^ (exponentiation)
                tokens.push({ type: 'CARET' });
            } else if (match[24]) { // Left bracket [
                tokens.push({ type: 'LBRACKET' });
            } else if (match[25]) { // Right bracket ]
                tokens.push({ type: 'RBRACKET' });
            } else if (match[26]) { // Left paren (
                tokens.push({ type: 'LPAREN' });
            } else if (match[27]) { // Right paren )
                tokens.push({ type: 'RPAREN' });
            } else if (match[28]) { // Logical NOT !
                tokens.push({ type: 'NOT' });
            } else if (match[29]) { // Underscore _
                tokens.push({ type: 'UNDERSCORE' });
            } else if (match[30]) { // Comma ,
                tokens.push({ type: 'COMMA' });
            } else if (match[31]) { // Apostrophe ' (successor)
                tokens.push({ type: 'SUCCESSOR' });
            } else if (match[32]) { // Identifier (function names, variables) or boolean literals
                const identifier = match[32];
                const lowerIdentifier = identifier.toLowerCase();

                if (lowerIdentifier === 'true') {
                    tokens.push({ type: 'BOOLEAN', value: true });
                } else if (lowerIdentifier === 'false') {
                    tokens.push({ type: 'BOOLEAN', value: false });
                } else {
                    tokens.push({ type: 'IDENTIFIER', value: identifier });
                }
            } else if (match[33]) { // Unexpected
                throw new Error(`Unexpected character: "${match[33]}"`);
            }
        }

        return tokens;
    }

    _peek(): Token | null {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }

    _consume(expectedType: TokenType | null = null): Token {
        if (this.pos >= this.tokens.length) {
            throw new Error(`Unexpected end of input, expected ${expectedType || 'token'}`);
        }

        const token = this.tokens[this.pos];
        if (expectedType && token.type !== expectedType) {
            throw new Error(`Expected ${expectedType}, got ${token.type}`);
        }

        this.pos++;
        return token;
    }

    parse() {
        if (this.tokens.length === 0) {
            return new FiniteOrdinal(0);
        }

        const result = this._parseExpression();

        if (this.pos < this.tokens.length) {
            throw new Error(`Unexpected token after complete expression: ${this.tokens[this.pos].type}`);
        }

        return result;
    }

    // Parse with direct object substitution (more efficient than string-based substitution)
    parseWithSubstitution(substitutions: Map<string, ParseResult>): ParseResult {
        if (this.tokens.length === 0) {
            return new FiniteOrdinal(0);
        }

        // Parse the expression normally (this will create trees with variables)
        const result = this._parseExpressionWithoutSubstitution();

        if (this.pos < this.tokens.length) {
            throw new Error(`Unexpected token after complete expression: ${this.tokens[this.pos].type}`);
        }

        // Apply direct object substitutions
        return this._applyDirectSubstitutions(result, substitutions);
    }

    // Parse expression without substitution (creates trees with variables)
    _parseExpressionWithoutSubstitution(): ParseResult {
        return this._parseImplication();
    }

    // Apply direct object substitutions (no string conversion needed)
    _applyDirectSubstitutions(expr: any, substitutions: Map<string, ParseResult>): ParseResult {
        if (!expr || typeof expr !== 'object') {
            return expr;
        }

        // Handle variables
        if (typeof expr === 'object' && 'type' in expr && expr.type === 'variable') {
            const variable = expr as Variable;
            if (substitutions.has(variable.name)) {
                const result = substitutions.get(variable.name);
                if (result === undefined) {
                    throw new Error(`Substitution for ${variable.name} is undefined`);
                }
                return result;
            } else {
                // Return the variable unchanged if not in substitutions
                return expr;
            }
        }

        // Handle ordinal objects - they don't contain variables, so return as-is
        if (this._isOrdinal(expr)) {
            return expr;
        }

        // Handle function call trees
        if (expr.type === 'function') {
            const substitutedArgs = expr.args.map((arg: any) => this._applyDirectSubstitutions(arg, substitutions));

            // Check if all arguments are now resolved (no unresolved elements)
            const hasUnresolved = substitutedArgs.some((arg: any) => this._hasUnresolvedElements(arg));

            if (!hasUnresolved) {
                // All arguments resolved, execute the function
                return this._executeFunction(expr.name, substitutedArgs);
            } else {
                // Some arguments still unresolved, return updated function tree
                return { type: 'function', name: expr.name, args: substitutedArgs };
            }
        }

        // Handle comparison operation trees
        if (expr.type === 'comparison_op') {
            const left = this._applyDirectSubstitutions(expr.left, substitutions);
            const right = this._applyDirectSubstitutions(expr.right, substitutions);

            // If both sides are now resolved, evaluate the comparison
            if (!this._hasUnresolvedElements(left) && !this._hasUnresolvedElements(right)) {
                switch (expr.operator) {
                    case 'EQ':
                        return this._createBooleanResult(this._compareValues(left, right) === 0);
                    case 'NEQ':
                        return this._createBooleanResult(this._compareValues(left, right) !== 0);
                    case 'LT':
                        return this._createBooleanResult(this._compareValues(left, right) < 0);
                    case 'GT':
                        return this._createBooleanResult(this._compareValues(left, right) > 0);
                    case 'LTE':
                        return this._createBooleanResult(this._compareValues(left, right) <= 0);
                    case 'GTE':
                        return this._createBooleanResult(this._compareValues(left, right) >= 0);
                    case 'COMPARE':
                        const compResult = this._compareValues(left, right);
                        return { type: 'comparison', value: compResult };
                    default:
                        throw new Error(`Unknown comparison operator: ${expr.operator}`);
                }
            } else {
                // Some elements still unresolved, return updated comparison tree
                return { type: 'comparison_op', operator: expr.operator, left: left, right: right };
            }
        }

        // Handle epsilon expression trees
        if (expr.type === 'epsilon') {
            const substitutedIndex = this._applyDirectSubstitutions(expr.index, substitutions);

            // If index is now resolved, create the appropriate epsilon object
            if (!this._hasUnresolvedElements(substitutedIndex)) {
                const indexAsOrdinal = substitutedIndex as any;
                if (indexAsOrdinal.isZero && indexAsOrdinal.isZero()) {
                    return EpsilonZero.instance();
                } else {
                    return new EpsilonNumber(indexAsOrdinal as OrdinalBase);
                }
            } else {
                // Index still has unresolved elements, return updated epsilon tree
                return { type: 'epsilon', index: substitutedIndex };
            }
        }

        // Handle successor trees
        if (expr.type === 'successor') {
            const substitutedOperand = this._applyDirectSubstitutions(expr.operand, substitutions);

            // If operand is now resolved, apply successor
            if (this._isOrdinal(substitutedOperand)) {
                return (substitutedOperand as any).successor();
            } else {
                // Operand still has unresolved elements, return updated successor tree
                return { type: 'successor', operand: substitutedOperand };
            }
        }

        // Handle logical operation trees
        if (expr.type === 'logical_op') {
            console.log(`   `, expr);
            const left = this._applyDirectSubstitutions(expr.left, substitutions);
            const right = this._applyDirectSubstitutions(expr.right, substitutions);
            console.log(`[DEBUG] After substitution - left:`, left, `right:`, right);
            console.log(`[DEBUG] Left has unresolved: ${this._hasUnresolvedElements(left)}, Right has unresolved: ${this._hasUnresolvedElements(right)}`);

            // If both sides are now resolved, evaluate the logical operation
            if (!this._hasUnresolvedElements(left) && !this._hasUnresolvedElements(right)) {
                console.log(`[DEBUG] Evaluating logical operation ${expr.operator} with left:`, left, `right:`, right);
                console.log(`[DEBUG] Left truthy: ${this._isTruthy(left)}, Right truthy: ${this._isTruthy(right)}`);

                switch (expr.operator) {
                    case 'AND':
                        const andResult = this._createBooleanResult(this._isTruthy(left) && this._isTruthy(right));
                        console.log(`[DEBUG] AND result:`, andResult);
                        return andResult;
                    case 'OR':
                        return this._createBooleanResult(this._isTruthy(left) || this._isTruthy(right));
                    case 'IMPLIES':
                        return this._createBooleanResult(!this._isTruthy(left) || this._isTruthy(right));
                    default:
                        throw new Error(`Unknown logical operator: ${expr.operator}`);
                }
            } else {
                // Some elements still unresolved, return updated logical tree
                console.log(`[DEBUG] Logical tree still has unresolved elements, returning tree`);
                return { type: 'logical_op', operator: expr.operator, left: left, right: right };
            }
        }

        // Handle other value types (strings, booleans, comparisons) - return as-is
        if (expr.type === 'string' || expr.type === 'boolean' || expr.type === 'comparison') {
            return expr;
        }

        // Handle operation trees
        if (expr.type === 'operation') {
            const left = this._applyDirectSubstitutions(expr.left, substitutions);
            const right = this._applyDirectSubstitutions(expr.right, substitutions);

            // After substitution, evaluate the operation if both sides are fully resolved
            if (this._isOrdinal(left) && this._isOrdinal(right)) {
                switch (expr.operator) {
                    case 'add':
                        return (left as any).add(right);
                    case 'multiply':
                        return (left as any).multiply(right);
                    case 'power':
                        return (left as any).power(right);
                    case 'tetrate':
                        return (left as any).tetrate(right);
                    default:
                        throw new Error(`Unknown operation: ${expr.operator}`);
                }
            } else {
                // If substitution didn't resolve both sides to ordinals, return the updated operation tree
                return { type: 'operation', operator: expr.operator, left: left, right: right };
            }
        }

        // For any other object types, return as-is
        return expr;
    }

    // Top-level expression parsing - handles substitution (lowest precedence)
    _parseExpression(): ParseResult {
        return this._parseSubstitution();
    }

    // Parse variable substitution (/.{...}) - LOWEST precedence
    _parseSubstitution(): ParseResult {
        let expr: any = this._parseImplication();

        // Check for substitution operator /.
        if (this._peek() && this._peek()!.type === 'SUBSTITUTE') {
            this._consume('SUBSTITUTE');
            this._consume('LBRACE');

            // Parse substitution list
            const substitutions = new Map();

            if (this._peek() && this._peek()!.type !== 'RBRACE') {
                do {
                    // Parse variable := value
                    if (this._peek()!.type !== 'IDENTIFIER') {
                        throw new Error('Expected variable name in substitution');
                    }
                    const varName = this._consume('IDENTIFIER').value;
                    this._consume('ASSIGN');
                    const value = this._parseImplication();

                    substitutions.set(varName, value);

                    // Check for comma or end
                    if (this._peek() && this._peek()!.type === 'COMMA') {
                        this._consume('COMMA');
                    } else {
                        break;
                    }
                } while (this._peek() && this._peek()!.type !== 'RBRACE');
            }

            this._consume('RBRACE');

            // Convert string-based substitutions to object map and use direct substitution
            const objectSubstitutions = new Map();
            for (const [varName, valueExpr] of substitutions.entries()) {
                objectSubstitutions.set(varName, valueExpr);
            }

            // Apply substitutions using the direct method
            expr = this._applyDirectSubstitutions(expr, objectSubstitutions);
        }

        return expr;
    }

    // Parse implication (->)
    _parseImplication(): ParseResult {
        let left: any = this._parseLogicalOr();

        while (this._peek() && this._peek()!.type === 'IMPLIES') {
            this._consume('IMPLIES' as any);
            const right = this._parseLogicalOr();

            // Check if either operand has unresolved elements
            if (this._hasUnresolvedElements(left) || this._hasUnresolvedElements(right)) {
                // Create logical operation tree
                left = { type: 'logical_op', operator: 'IMPLIES', left: left, right: right };
            } else {
                // Evaluate immediately: A -> B is equivalent to !A || B
                left = this._createBooleanResult(!this._isTruthy(left) || this._isTruthy(right));
            }
        }

        return left;
    }

    // Parse logical OR (||)
    _parseLogicalOr(): ParseResult {
        let left: any = this._parseLogicalAnd();

        while (this._peek() && this._peek()!.type === 'OR') {
            this._consume('OR' as any);
            const right = this._parseLogicalAnd();

            // Check if either operand has unresolved elements
            if (this._hasUnresolvedElements(left) || this._hasUnresolvedElements(right)) {
                // Create logical operation tree
                left = { type: 'logical_op', operator: 'OR', left: left, right: right };
            } else {
                // Evaluate immediately
                left = this._createBooleanResult(this._isTruthy(left) || this._isTruthy(right));
            }
        }

        return left;
    }

    // Parse logical AND (&&)
    _parseLogicalAnd(): ParseResult {
        let left: any = this._parseComparison();

        while (this._peek() && this._peek()!.type === 'AND') {
            this._consume('AND' as any);
            const right = this._parseComparison();

            // Check if either operand has unresolved elements
            if (this._hasUnresolvedElements(left) || this._hasUnresolvedElements(right)) {
                // Create logical operation tree
                left = { type: 'logical_op', operator: 'AND', left: left, right: right };
            } else {
                // Evaluate immediately
                left = this._createBooleanResult(this._isTruthy(left) && this._isTruthy(right));
            }
        }

        return left;
    }

    // Parse comparison operators (=, !=, <, >, <=, >=, ?)
    _parseComparison(): ParseResult {
        let left: any = this._parseOrdinalExpression();

        while (this._peek() && ['EQ', 'NEQ', 'LT', 'GT', 'LTE', 'GTE', 'COMPARE'].includes(this._peek()!.type)) {
            const operator = this._consume().type;
            const right = this._parseOrdinalExpression();

            // Check if either operand has unresolved elements
            if (this._hasUnresolvedElements(left) || this._hasUnresolvedElements(right)) {
                // Create comparison operation tree
                left = { type: 'comparison_op', operator: operator, left: left, right: right };
            } else {
                // Evaluate comparison immediately
                switch (operator) {
                    case 'EQ':
                        left = this._createBooleanResult(this._compareValues(left, right) === 0);
                        break;
                    case 'NEQ':
                        left = this._createBooleanResult(this._compareValues(left, right) !== 0);
                        break;
                    case 'LT':
                        left = this._createBooleanResult(this._compareValues(left, right) < 0);
                        break;
                    case 'GT':
                        left = this._createBooleanResult(this._compareValues(left, right) > 0);
                        break;
                    case 'LTE':
                        left = this._createBooleanResult(this._compareValues(left, right) <= 0);
                        break;
                    case 'GTE':
                        left = this._createBooleanResult(this._compareValues(left, right) >= 0);
                        break;
                    case 'COMPARE':
                        const compResult = this._compareValues(left, right);
                        left = { type: 'comparison', value: compResult };
                        break;
                }
            }
        }

        return left;
    }

    // Parse ordinal expressions (addition)
    _parseOrdinalExpression(): ParseResult {
        let left: any = this._parseOrdinalTerm();

        while (this._peek() && this._peek()!.type === 'PLUS') {
            this._consume('PLUS');
            const right: any = this._parseOrdinalTerm();
            // Handle addition with variables or operation trees - create expression tree
            if (left.type === 'variable' || right.type === 'variable' || left.type === 'operation' || right.type === 'operation') {
                left = { type: 'operation', operator: 'add', left: left, right: right };
            } else if (this._isOrdinal(left) && this._isOrdinal(right)) {
                left = (left as any).add(right);
            } else if (this._isComparisonResult(left) || this._isComparisonResult(right)) {
                throw new Error('Cannot perform addition with comparison results (use parentheses if you want to compare the result of addition)');
            } else {
                throw new Error('Addition can only be performed on ordinal values');
            }
        }

        return left;
    }

    // Parse ordinal terms (multiplication)
    _parseOrdinalTerm(): ParseResult {
        let left: any = this._parseOrdinalTetration();

        while (this._peek() && this._peek()!.type === 'STAR') {
            this._consume('STAR');
            const right: any = this._parseOrdinalTetration();
            // Handle multiplication with variables or operation trees - create expression tree
            if (left.type === 'variable' || right.type === 'variable' || left.type === 'operation' || right.type === 'operation') {
                left = { type: 'operation', operator: 'multiply', left: left, right: right };
            } else if (this._isOrdinal(left) && this._isOrdinal(right)) {
                left = (left as any).multiply(right);
            } else if (this._isComparisonResult(left) || this._isComparisonResult(right)) {
                throw new Error('Cannot perform multiplication with comparison results (use parentheses if you want to compare the result of multiplication)');
            } else {
                throw new Error('Multiplication can only be performed on ordinal values');
            }
        }

        return left;
    }

    // Parse ordinal tetration (^^)
    _parseOrdinalTetration(): ParseResult {
        // Handle right-associative tetration
        let base: any = this._parseOrdinalPower();
        if (this._peek() && this._peek()!.type === 'DCARET') {
            this._consume('DCARET');
            const height: any = this._parseOrdinalTetration();
            if (base.type === 'variable' || height.type === 'variable' || base.type === 'operation' || height.type === 'operation') {
                base = { type: 'operation', operator: 'tetrate', left: base, right: height };
            } else if (this._isOrdinal(base) && this._isOrdinal(height)) {
                base = (base as any).tetrate(height);
            } else if (this._isComparisonResult(base) || this._isComparisonResult(height)) {
                throw new Error('Cannot perform tetration with comparison results (use parentheses if you want to compare the result of tetration)');
            } else {
                throw new Error('Tetration can only be performed on ordinal values');
            }
        }
        return base;
    }

    // Parse ordinal exponentiation (^)
    _parseOrdinalPower(): ParseResult {
        let base: any = this._parseUnary();
        if (this._peek() && this._peek()!.type === 'CARET') {
            this._consume('CARET');
            const exponent: any = this._parseOrdinalPower(); // right-associative
            if (base.type === 'variable' || exponent.type === 'variable' || base.type === 'operation' || exponent.type === 'operation') {
                base = { type: 'operation', operator: 'power', left: base, right: exponent };
            } else if (this._isOrdinal(base) && this._isOrdinal(exponent)) {
                base = (base as any).power(exponent);
            } else if (this._isComparisonResult(base) || this._isComparisonResult(exponent)) {
                throw new Error('Cannot perform exponentiation with comparison results (use parentheses if you want to compare the result of exponentiation)');
            } else {
                throw new Error('Exponentiation can only be performed on ordinal values');
            }
        }
        return base;
    }

    // Parse unary operators (!)
    _parseUnary(): ParseResult {
        if (this._peek() && this._peek()!.type === 'NOT') {
            this._consume('NOT');
            const operand: any = this._parseUnary();
            return this._createBooleanResult(!this._isTruthy(operand));
        }

        return this._parseSuccessor();
    }

    // Parse successor operator (') - postfix, high precedence
    _parseSuccessor(): ParseResult {
        let expr: any = this._parsePrimary();

        // Handle multiple apostrophes: w'' = (w')'
        while (this._peek() && this._peek()!.type === 'SUCCESSOR') {
            this._consume('SUCCESSOR');

            if (this._isOrdinal(expr)) {
                expr = expr.successor();
            } else {
                // Always create successor operation tree for non-ordinals (including variables)
                expr = { type: 'successor', operand: expr };
            }
        }

        return expr;
    }


    // Parse primary expressions (highest precedence)
    _parsePrimary() {
        const token = this._peek();

        if (!token) {
            throw new Error('Unexpected end of input');
        }

        if (token.type === 'NUMBER') {
            const num = this._consume('NUMBER').value as bigint;
            return new FiniteOrdinal(num);
        } else if (token.type === 'STRING') {
            const str = this._consume('STRING').value;
            return { type: 'string', value: str };
        } else if (token.type === 'BOOLEAN') {
            const bool = this._consume('BOOLEAN').value;
            return { type: 'boolean', value: bool };
        } else if (token.type === 'OMEGA') {
            this._consume('OMEGA');
            return OmegaOrdinal.instance();
        } else if (token.type === 'EPSILON') {
            return this._parseEpsilon();
        } else if (token.type === 'TUNNEL') {
            return this._parseTunnel();
        } else if (token.type === 'IDENTIFIER') {
            // Check if it's a function call (followed by [) or a variable
            const nextToken = this.pos + 1 < this.tokens.length ? this.tokens[this.pos + 1] : null;
            if (nextToken && nextToken.type === 'LBRACKET') {
                // Function call
                return this._parseFunctionCall();
            } else {
                // Variable - return as a special variable object
                const varName = this._consume('IDENTIFIER').value;
                return { type: 'variable', name: varName };
            }
        } else if (token.type === 'LPAREN') {
            this._consume('LPAREN');
            const expr = this._parseExpression();
            this._consume('RPAREN');
            return expr;
        } else {
            throw new Error(`Unexpected token: ${token.type}`);
        }
    }

    // Parse function calls with f[arguments] syntax
    _parseFunctionCall() {
        const functionName = this._consume('IDENTIFIER').value;
        this._consume('LBRACKET');

        const args = [];

        // Parse arguments (comma-separated)
        if (this._peek() && this._peek()!.type !== 'RBRACKET') {
            args.push(this._parseExpression());

            while (this._peek() && this._peek()!.type === 'COMMA') {
                this._consume('COMMA');
                args.push(this._parseExpression());
            }
        }

        this._consume('RBRACKET');

        // Execute the function
        return this._executeFunction(functionName, args);
    }

    // Execute built-in functions
    _executeFunction(functionName: any, args: any): ParseResult {
        // Check if any arguments contain unresolved elements
        const hasUnresolved = args.some((arg: any) => this._hasUnresolvedElements(arg));

        if (hasUnresolved) {
            // Return a function call tree to be evaluated after substitution
            return { type: 'function', name: functionName, args: args };
        }

        switch (functionName) {
            case 'complexity':
                if (args.length !== 1) {
                    throw new Error('complexity function expects exactly 1 argument');
                }
                if (!this._isOrdinal(args[0])) {
                    throw new Error('complexity function expects an ordinal argument');
                }
                return new FiniteOrdinal(BigInt(args[0].complexity()));

            case 'toString':
                if (args.length !== 1) {
                    throw new Error('toString function expects exactly 1 argument');
                }
                let stringValue;
                if (this._isOrdinal(args[0])) {
                    stringValue = args[0].toString();
                } else if (args[0].type === 'string') {
                    stringValue = args[0].value;
                } else if (args[0].type === 'boolean') {
                    stringValue = args[0].value.toString();
                } else if (args[0].type === 'comparison') {
                    stringValue = this._valueToString(args[0]);
                } else {
                    stringValue = String(args[0]);
                }
                return { type: 'string', value: stringValue };

            case 'parse':
                if (args.length !== 1) {
                    throw new Error('parse function expects exactly 1 argument');
                }
                if (args[0].type !== 'string') {
                    throw new Error('parse function expects a string argument');
                }
                // Recursively parse the string
                const parser = new SimpleParser(args[0].value);
                return parser.parse();

            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    }

    // Helper methods for value type checking and operations
    _isOrdinal(value: any): boolean {
        return value && typeof value === 'object' &&
            typeof value.isZero === 'function' &&
            typeof value.add === 'function';
    }

    _isComparisonResult(value: any): boolean {
        return value && typeof value === 'object' && value.type === 'comparison';
    }

    _hasUnresolvedElements(value: any): boolean {
        return value && typeof value === 'object' &&
            (value.type === 'variable' || value.type === 'operation' || value.type === 'function' || value.type === 'comparison_op' || value.type === 'epsilon' || value.type === 'successor' || value.type === 'logical_op');
    }

    _isTruthy(value: any): boolean {
        if (this._isOrdinal(value)) {
            return !value.isZero();
        } else if (value && value.type === 'boolean') {
            return value.value;
        } else if (value && value.type === 'string') {
            return value.value.length > 0;
        } else if (value && value.type === 'comparison') {
            return value.value !== 0; // Non-zero comparison results are truthy
        } else if (value && value.type === 'variable') {
            throw new Error(`Cannot evaluate truthiness of unsubstituted variable: ${value.name}`);
        } else if (value && value.type === 'operation') {
            throw new Error(`Cannot evaluate truthiness of unsubstituted operation tree`);
        } else {
            return Boolean(value);
        }
    }

    _createBooleanResult(boolValue: boolean): BooleanResult {
        return { type: 'boolean' as const, value: Boolean(boolValue) };
    }

    _compareValues(left: any, right: any): -1 | 0 | 1 {
        // Both are ordinals
        if (this._isOrdinal(left) && this._isOrdinal(right)) {
            return left.compareTo(right);
        }

        // Both are strings
        if (left.type === 'string' && right.type === 'string') {
            if (left.value < right.value) return -1;
            if (left.value > right.value) return 1;
            return 0;
        }

        // Both are booleans
        if (left.type === 'boolean' && right.type === 'boolean') {
            if (left.value === right.value) return 0;
            return left.value ? 1 : -1;
        }

        // Both are comparison results
        if (left.type === 'comparison' && right.type === 'comparison') {
            if (left.value < right.value) return -1;
            if (left.value > right.value) return 1;
            return 0;
        }

        // Check for unresolved elements (these should not reach here due to tree creation)
        if (this._hasUnresolvedElements(left)) {
            throw new Error(`Cannot compare unresolved expression: ${this._valueToString(left)}`);
        }
        if (this._hasUnresolvedElements(right)) {
            throw new Error(`Cannot compare unresolved expression: ${this._valueToString(right)}`);
        }

        // Mixed types - convert to strings for comparison
        const leftStr = this._valueToString(left);
        const rightStr = this._valueToString(right);
        if (leftStr < rightStr) return -1;
        if (leftStr > rightStr) return 1;
        return 0;
    }

    _valueToString(value: any): string {
        if (this._isOrdinal(value)) {
            return value.toString();
        } else if (value.type === 'string') {
            return value.value;
        } else if (value.type === 'boolean') {
            return value.value.toString();
        } else if (value.type === 'comparison') {
            // Convert comparison result to symbol
            switch (value.value) {
                case -1: return '<';
                case 0: return '=';
                case 1: return '>';
                default: return value.value.toString();
            }
        } else if (value.type === 'variable') {
            return `${value.name}`;
        } else if (value.type === 'operation') {
            const leftStr = this._valueToString(value.left);
            const rightStr = this._valueToString(value.right);
            switch (value.operator) {
                case 'add': return `(${leftStr}+${rightStr})`;
                case 'multiply': return `(${leftStr}*${rightStr})`;
                case 'power': return `(${leftStr}^${rightStr})`;
                case 'tetrate': return `(${leftStr}^^${rightStr})`;
                default: return `(${leftStr} ${value.operator} ${rightStr})`;
            }
        } else if (value.type === 'function') {
            const argsStr = value.args.map((arg: any) => this._valueToString(arg)).join(',');
            return `${value.name}[${argsStr}]`;
        } else if (value.type === 'comparison_op') {
            const leftStr = this._valueToString(value.left);
            const rightStr = this._valueToString(value.right);
            const opStr = this._comparisonOperatorToString(value.operator);
            return `(${leftStr} ${opStr} ${rightStr})`;
        } else if (value.type === 'epsilon') {
            const indexStr = this._valueToString(value.index);
            return `e_${indexStr}`;
        } else if (value.type === 'successor') {
            const operandStr = this._valueToString(value.operand);
            return `${operandStr}'`;
        } else if (value.type === 'logical_op') {
            const leftStr = this._valueToString(value.left);
            const rightStr = this._valueToString(value.right);
            const opStr = this._logicalOperatorToString(value.operator);
            return `(${leftStr} ${opStr} ${rightStr})`;
        } else {
            return String(value);
        }
    }

    _logicalOperatorToString(operator: any): string {
        switch (operator) {
            case 'AND': return '&&';
            case 'OR': return '||';
            case 'IMPLIES': return '->';
            default: return operator;
        }
    }

    _comparisonOperatorToString(operator: any): string {
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

    _parseEpsilon(): ParseResult {
        // Parse epsilon numbers: e_k where k can be an expression, epsilon number, finite number, or omega
        this._consume('EPSILON'); // consume 'e_'

        // The underscore is already consumed as part of the 'e_' token
        // Parse the index - this can be any valid ordinal expression
        const index: any = this._parseEpsilonIndex();

        // Check if index contains variables or operation trees
        if (this._hasUnresolvedElements(index)) {
            // Return epsilon expression tree
            return { type: 'epsilon', index: index };
        }

        // Handle special case: if index is 0, return EpsilonZero
        if (index.isZero()) {
            return EpsilonZero.instance();
        }

        // Otherwise return EpsilonNumber with the parsed index
        return new EpsilonNumber(index);
    }

    _parseEpsilonIndex(): ParseResult {
        // Parse epsilon index - can be:
        // - A finite number
        // - Omega (w)
        // - An expression in parentheses
        // - Another epsilon number (e_k)

        const token = this._peek();

        if (!token) {
            throw new Error('Expected epsilon index after e_');
        }

        if (token.type === 'NUMBER') {
            const num = this._consume('NUMBER').value as bigint;
            return new FiniteOrdinal(num);
        } else if (token.type === 'OMEGA') {
            this._consume('OMEGA');
            return OmegaOrdinal.instance();
        } else if (token.type === 'EPSILON') {
            // Nested epsilon number: e_e_k
            return this._parseEpsilon();
        } else if (token.type === 'IDENTIFIER') {
            // Variable in epsilon index: e_a
            const varName = this._consume('IDENTIFIER').value;
            return { type: 'variable', name: String(varName) };
        } else if (token.type === 'LPAREN') {
            // Expression in parentheses: e_(w+1)
            this._consume('LPAREN');
            const expr = this._parseExpression();
            this._consume('RPAREN');
            return expr;
        } else {
            throw new Error(`Invalid epsilon index: ${token.type}`);
        }
    }

    _parseTunnel() {
        this._consume('TUNNEL'); // consume 'e__'

        // Parse the depth as an ordinal
        const token = this._peek();
        if (!token) {
            throw new Error('Expected tunnel depth after e__');
        }

        let depthOrdinal;

        if (token.type === 'NUMBER') {
            const depth = this._consume('NUMBER').value as bigint;
            depthOrdinal = new FiniteOrdinal(depth);
        } else if (token.type === 'LPAREN') {
            // Parse parenthesized expression for depth
            this._consume('LPAREN');
            depthOrdinal = this._parseExpression();
            this._consume('RPAREN');
        } else {
            throw new Error(`Invalid tunnel depth: ${token.type}. Expected finite number or parenthesized expression.`);
        }

        // Call tunnel() on the parsed depth ordinal
        return (depthOrdinal as any).tunnel();
    }
}

// Exported as ES6 module
