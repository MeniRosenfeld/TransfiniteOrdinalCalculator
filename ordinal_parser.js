// ordinal_parser.js

// Assumes CNFOrdinal class and its arithmetic methods are defined.
// Assumes EpsilonNaughtOrdinal class is defined.
// Assumes OperationTracer class is defined.

class OrdinalParser {
    constructor(inputString, operationTracer) {
        if (!(operationTracer instanceof OperationTracer)) {
            throw new Error("OrdinalParser requires a valid OperationTracer instance.");
        }
        this.inputString = inputString;
        this.tracer = operationTracer;
        this.tokens = this._tokenize(inputString);
        this.pos = 0;
    }

    _tokenize(str) {
        // Regex to capture numbers, 'w', 'e_0', '^^', '^', other operators (+, *), parentheses, and ignore whitespace.
        // Order matters: '^^' must be checked before '^'.
        const regex = /\s*(?:(\d+)|(w)|(e_0)|(\^\^)|([+*^()])|(\S))\s*/g;
        // \d+ : numbers
        // w   : omega
        // e_0 : epsilon-naught
        // \^\^ : tetration
        // [+*^()] : other operators and parens. Note: ^ is also here for single ^, ^^ is caught by prior group.
        // \S  : any non-whitespace (to catch errors)
        
        const tokens = [];
        let match;
        while ((match = regex.exec(str)) !== null) {
            if (match[1]) { // Number
                tokens.push({ type: 'NUMBER', value: BigInt(match[1]) });
            } else if (match[2]) { // Omega 'w'
                tokens.push({ type: 'OMEGA' });
            } else if (match[3]) { // Epsilon-naught 'e_0'
                tokens.push({ type: 'EPSILON_NAUGHT' });
            } else if (match[4]) { // Tetration '^^'
                tokens.push({ type: 'OPERATOR', value: '^^' });
            } else if (match[5]) { // Operator (+, *, ^) or Parenthesis
                tokens.push({ type: 'OPERATOR', value: match[5] });
            } else if (match[6]) { // Unexpected character
                throw new Error(`Unexpected character in input: "${match[6]}"`);
            }
        }
        return tokens;
    }

    _peek() {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }

    _consume(expectedTarget) { // Renamed parameter for clarity
        const token = this.tokens[this.pos];
        if (!token) {
            throw new Error(`Unexpected end of input. Expected ${expectedTarget || 'more tokens'}.`);
        }

        let typeOrValueMismatch = false;
        let expectedDescription = "";

        // Check if expectedTarget is a specific operator value (e.g., '(', '+', '^^')
        // These are always of type 'OPERATOR'
        if (['(', ')', '+', '*', '^', '^^'].includes(expectedTarget)) {
            expectedDescription = `operator "${expectedTarget}"`;
            if (token.type !== 'OPERATOR' || token.value !== expectedTarget) {
                typeOrValueMismatch = true;
            }
        } 
        // Else, assume expectedTarget is a token type (e.g., 'NUMBER', 'OMEGA')
        else if (expectedTarget) { 
            expectedDescription = `token type "${expectedTarget}"`;
            if (token.type !== expectedTarget) {
                typeOrValueMismatch = true;
            }
        }
        // If expectedTarget is null/undefined, no check, just consume.

        if (typeOrValueMismatch) {
            throw new Error(`Expected ${expectedDescription} but found ${token.type} "${token.value !== undefined ? token.value : ''}" at position ${this.pos}.`);
        }

        this.pos++;
        return token;
    }

    // Parses atoms: numbers, 'w', 'e_0', or (expression)
    _parseAtom() {
        const token = this._peek(); // Peek to decide the path
        if (!token) {
            throw new Error("Unexpected end of input while parsing atom.");
        }

        if (token.type === 'NUMBER') {
            const consumedToken = this._consume('NUMBER'); // Consume and get the token
            return CNFOrdinal.fromInt(consumedToken.value, this.tracer);
        } else if (token.type === 'OMEGA') {
            this._consume('OMEGA'); // Just consume, type is enough
            return CNFOrdinal.OMEGAStatic().clone(this.tracer);
        } else if (token.type === 'EPSILON_NAUGHT') {
            this._consume('EPSILON_NAUGHT');
            return new EpsilonNaughtOrdinal(this.tracer);
        } else if (token.type === 'OPERATOR' && token.value === '(') {
            this._consume('('); // Consume the '(' operator
            const expr = this._parseExpression();
            this._consume(')'); // Consume the ')' operator
            return expr;
        } else {
            throw new Error(`Unexpected token "${token.value !== undefined ? token.value : token.type}" at pos ${this.pos}, expected a number, 'w', 'e_0', or '('.`);
        }
    }

    // New: Parses tetration (right-associative, higher precedence than power)
    // TetrationFactor ::= Atom (^^ TetrationFactor)*
    _parseTetration() {
        let left = this._parseAtom();
        
        let token = this._peek();
        if (token && token.type === 'OPERATOR' && token.value === '^^') {
            this._consume('^^');
            // For right-associativity, the right operand of ^^ is also a _parseTetration
            const right = this._parseTetration(); 
            if (this.tracer) this.tracer.consume(); // Count the tetration operation itself
            left = left.tetrate(right); // Assumes left ordinal has .tetrate method
        }
        return left;
    }

    // Parses exponentiation (right-associative)
    // PowerFactor ::= TetrationFactor (^ PowerFactor)*  (Updated: was Atom)
    _parsePower() {
        let left = this._parseTetration(); // Now calls _parseTetration instead of _parseAtom
        
        let token = this._peek();
        if (token && token.type === 'OPERATOR' && token.value === '^') {
            this._consume('^');
            // For right-associativity, the right operand of ^ is also a _parsePower
            const right = this._parsePower(); 
            if (this.tracer) this.tracer.consume(); // Count the power operation itself
            left = left.power(right); 
        }
        return left;
    }
    
    // Parses products (left-associative)
    // Term ::= PowerFactor (* PowerFactor)* (Updated: was Factor)
    _parseProduct() {
        let left = this._parsePower(); 

        let token = this._peek();
        while (token && token.type === 'OPERATOR' && token.value === '*') {
            this._consume('*');
            const right = this._parsePower(); // RHS of * is a PowerFactor
            if (this.tracer) this.tracer.consume(); // Count the multiply operation itself
            left = left.multiply(right); // Assumes left is CNFOrdinal and has .multiply
            token = this._peek();
        }
        return left;
    }

    // Parses sums/expressions (left-associative)
    // Expression ::= Term (+ Term)*
    _parseExpression() {
        let left = this._parseProduct(); // A term is the highest precedence within an expression

        let token = this._peek();
        while (token && token.type === 'OPERATOR' && token.value === '+') {
            this._consume('+');
            const right = this._parseProduct(); // RHS of + is a Term
            if (this.tracer) this.tracer.consume(); // Count the add operation itself
            left = left.add(right); // Assumes left is CNFOrdinal and has .add
            token = this._peek();
        }
        return left;
    }

    parse() {
        if (this.tokens.length === 0) {
            // Handle empty input string - return Ordinal 0
            return CNFOrdinal.ZEROStatic().clone(this.tracer);
        }
        
        const result = this._parseExpression();

        if (this.pos < this.tokens.length) {
            const remainingTokens = this.tokens.slice(this.pos).map(t=>t.value || t.type).join(" ");
            throw new Error(`Unexpected tokens remaining after parsing: "${remainingTokens}"`);
        }
        return result;
    }
}

// ordinal_parser.js