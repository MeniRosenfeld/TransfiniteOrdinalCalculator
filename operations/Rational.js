// operations/Rational.js

// Helper function for GCD
function gcd(a, b) {
    return b === 0n ? a : gcd(b, a % b);
}

class Rational {
    constructor(numerator, denominator = 1n) {
        if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint') {
            throw new Error("Rational numerator and denominator must be BigInts");
        }
        if (denominator === 0n) {
            throw new Error("Denominator cannot be zero");
        }

        const common = gcd(numerator, denominator);
        this.num = numerator / common;
        this.den = denominator / common;

        if (this.den < 0n) {
            this.num = -this.num;
            this.den = -this.den;
        }
    }

    add(other) {
        const newNum = this.num * other.den + other.num * this.den;
        const newDen = this.den * other.den;
        return new Rational(newNum, newDen);
    }

    subtract(other) {
        const newNum = this.num * other.den - other.num * this.den;
        const newDen = this.den * other.den;
        return new Rational(newNum, newDen);
    }

    multiply(other) {
        return new Rational(this.num * other.num, this.den * other.den);
    }

    divide(other) {
        if (other.num === 0n) {
            throw new Error("Division by zero in Rational");
        }
        return new Rational(this.num * other.den, this.den * other.num);
    }

    // For x^2
    square() {
        return new Rational(this.num * this.num, this.den * this.den);
    }

    toString() {
        if (this.den === 1n) {
            return this.num.toString();
        }
        return `${this.num}/${this.den}`;
    }

    toNumber() {
        return Number(this.num) / Number(this.den);
    }

    static fromInt(n) {
        return new Rational(BigInt(n), 1n);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Rational;
} else {
    window.Rational = Rational;
}
