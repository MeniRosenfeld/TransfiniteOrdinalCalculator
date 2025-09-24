// SimpleParser.js
// Enhanced parser for ordinal expressions supporting:
// - Finite numbers (e.g., 5, 42)
// - Omega (w)
// - Epsilon numbers (e_k where k can be number, omega, epsilon, or parenthesized expression)
// - Epsilon tunnels (e__n where n is a finite depth)
// - Addition (+)
// - Multiplication (*)
// - Exponentiation (^)
// - Tetration (^^)
// - Parentheses for grouping

class SimpleParser {
    constructor(inputString) {
        this.inputString = inputString.trim();
        this.tokens = this._tokenize(inputString);
        this.pos = 0;
    }

    _tokenize(str) {
        // Enhanced regex for finite numbers, omega, epsilon numbers, tunnels, addition, multiplication, exponentiation (^), tetration (^^)
        const regex = /\s*(?:(\d+)|(w)|(e__)|(e_)|(\+)|(\*)|(\^\^)|(\^)|(\()|(\))|(_)|(\S))\s*/g;
        const tokens = [];
        let match;

        while ((match = regex.exec(str)) !== null) {
            if (match[1]) { // Number
                tokens.push({ type: 'NUMBER', value: BigInt(match[1]) });
            } else if (match[2]) { // Omega 'w'
                tokens.push({ type: 'OMEGA' });
            } else if (match[3]) { // Tunnel 'e__'
                tokens.push({ type: 'TUNNEL' });
            } else if (match[4]) { // Epsilon 'e_'
                tokens.push({ type: 'EPSILON' });
            } else if (match[5]) { // Plus
                tokens.push({ type: 'PLUS' });
            } else if (match[6]) { // Multiply
                tokens.push({ type: 'STAR' });
            } else if (match[7]) { // Double caret ^^ (tetration)
                tokens.push({ type: 'DCARET' });
            } else if (match[8]) { // Caret ^ (exponentiation)
                tokens.push({ type: 'CARET' });
            } else if (match[9]) { // Left paren
                tokens.push({ type: 'LPAREN' });
            } else if (match[10]) { // Right paren
                tokens.push({ type: 'RPAREN' });
            } else if (match[11]) { // Underscore '_'
                tokens.push({ type: 'UNDERSCORE' });
            } else if (match[12]) { // Unexpected
                throw new Error(`Unexpected character: "${match[11]}"`);
            }
        }

        return tokens;
    }

    _peek() {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }

    _consume(expectedType = null) {
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

    _parseExpression() {
        let left = this._parseTerm();

        while (this._peek() && this._peek().type === 'PLUS') {
            this._consume('PLUS');
            const right = this._parseTerm();
            left = left.add(right);
        }

        return left;
    }

    _parseTerm() {
        let left = this._parseTetration();

        while (this._peek() && this._peek().type === 'STAR') {
            this._consume('STAR');
            const right = this._parseTetration();
            left = left.multiply(right);
        }

        return left;
    }

    _parseTetration() {
        // Handle right-associative tetration
        let base = this._parsePower();
        if (this._peek() && this._peek().type === 'DCARET') {
            this._consume('DCARET');
            const height = this._parseTetration();
            base = base.tetrate(height);
        }
        return base;
    }

    _parsePower() {
        let base = this._parseFactor();
        if (this._peek() && this._peek().type === 'CARET') {
            this._consume('CARET');
            const exponent = this._parsePower(); // right-associative
            base = base.power(exponent);
        }
        return base;
    }

    _parseFactor() {
        const token = this._peek();

        if (!token) {
            throw new Error('Unexpected end of input');
        }

        if (token.type === 'NUMBER') {
            const num = this._consume('NUMBER').value;
            return new FiniteOrdinal(num);
        } else if (token.type === 'OMEGA') {
            this._consume('OMEGA');
            return new OmegaOrdinal();
            } else if (token.type === 'EPSILON') {
                return this._parseEpsilon();
            } else if (token.type === 'TUNNEL') {
                return this._parseTunnel();
            } else if (token.type === 'LPAREN') {
            this._consume('LPAREN');
            const expr = this._parseExpression();
            this._consume('RPAREN');
            return expr;
        } else {
            throw new Error(`Unexpected token: ${token.type}`);
        }
    }

    _parseEpsilon() {
        // Parse epsilon numbers: e_k where k can be an expression, epsilon number, finite number, or omega
        this._consume('EPSILON'); // consume 'e_'
        
        // The underscore is already consumed as part of the 'e_' token
        // Parse the index - this can be any valid ordinal expression
        const index = this._parseEpsilonIndex();
        
        // Handle special case: if index is 0, return EpsilonZero
        if (index.isZero()) {
            return new EpsilonZero();
        }
        
        // Otherwise return EpsilonNumber with the parsed index
        return new EpsilonNumber(index);
    }

    _parseEpsilonIndex() {
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
            const num = this._consume('NUMBER').value;
            return new FiniteOrdinal(num);
        } else if (token.type === 'OMEGA') {
            this._consume('OMEGA');
            return new OmegaOrdinal();
        } else if (token.type === 'EPSILON') {
            // Nested epsilon number: e_e_k
            return this._parseEpsilon();
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
            const depth = this._consume('NUMBER').value;
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
        return depthOrdinal.tunnel();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleParser;
} else {
    // Browser global
    window.SimpleParser = SimpleParser;
}
