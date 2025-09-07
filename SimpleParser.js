// SimpleParser.js
// Simple parser for finite ordinals and addition (starting point for new architecture)

class SimpleParser {
    constructor(inputString, operationTracer) {
        this.inputString = inputString.trim();
        this.tracer = operationTracer;
        this.tokens = this._tokenize(inputString);
        this.pos = 0;
    }

    _tokenize(str) {
        // Simple regex for finite numbers, omega, epsilon-zero, addition, multiplication, exponentiation (^), tetration (^^)
        const regex = /\s*(?:(\d+)|(w)|(e_0)|(\+)|(\*)|(\^\^)|(\^)|(\()|(\))|(\S))\s*/g;
        const tokens = [];
        let match;

        while ((match = regex.exec(str)) !== null) {
            if (match[1]) { // Number
                tokens.push({ type: 'NUMBER', value: BigInt(match[1]) });
            } else if (match[2]) { // Omega 'w'
                tokens.push({ type: 'OMEGA' });
            } else if (match[3]) { // Epsilon zero 'e_0'
                tokens.push({ type: 'EPSILON_ZERO' });
            } else if (match[4]) { // Plus
                tokens.push({ type: 'PLUS' });
            } else if (match[5]) { // Multiply
                tokens.push({ type: 'STAR' });
            } else if (match[6]) { // Double caret ^^ (tetration)
                tokens.push({ type: 'DCARET' });
            } else if (match[7]) { // Caret ^ (exponentiation)
                tokens.push({ type: 'CARET' });
            } else if (match[8]) { // Left paren
                tokens.push({ type: 'LPAREN' });
            } else if (match[9]) { // Right paren
                tokens.push({ type: 'RPAREN' });
            } else if (match[10]) { // Unexpected
                throw new Error(`Unexpected character: "${match[10]}"`);
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
            return new FiniteOrdinal(0, this.tracer);
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
            return new FiniteOrdinal(num, this.tracer);
        } else if (token.type === 'OMEGA') {
            this._consume('OMEGA');
            return new OmegaOrdinal(this.tracer);
        } else if (token.type === 'EPSILON_ZERO') {
            this._consume('EPSILON_ZERO');
            return new EpsilonZero(this.tracer);
        } else if (token.type === 'LPAREN') {
            this._consume('LPAREN');
            const expr = this._parseExpression();
            this._consume('RPAREN');
            return expr;
        } else {
            throw new Error(`Unexpected token: ${token.type}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleParser;
} else {
    // Browser global
    window.SimpleParser = SimpleParser;
}
