// operations/Rational.ts

// Helper function for GCD
function gcd(a: bigint, b: bigint): bigint {
    return b === 0n ? a : gcd(b, a % b);
}

export class Rational {
    readonly num: bigint;
    readonly den: bigint;

    constructor(numerator: bigint, denominator: bigint = 1n) {
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
            this.num = -this.num as bigint;
            this.den = -this.den as bigint;
        }
    }

    add(other: Rational): Rational {
        const newNum = this.num * other.den + other.num * this.den;
        const newDen = this.den * other.den;
        return new Rational(newNum, newDen);
    }

    subtract(other: Rational): Rational {
        const newNum = this.num * other.den - other.num * this.den;
        const newDen = this.den * other.den;
        return new Rational(newNum, newDen);
    }

    multiply(other: Rational): Rational {
        return new Rational(this.num * other.num, this.den * other.den);
    }

    divide(other: Rational): Rational {
        if (other.num === 0n) {
            throw new Error("Division by zero in Rational");
        }
        return new Rational(this.num * other.den, this.den * other.num);
    }

    // For x^2
    square(): Rational {
        return new Rational(this.num * this.num, this.den * this.den);
    }

    toString(): string {
        if (this.den === 1n) {
            return this.num.toString();
        }
        return `${this.num}/${this.den}`;
    }

    toNumber(): number {
        return Number(this.num) / Number(this.den);
    }

    static fromInt(n: number | bigint): Rational {
        return new Rational(BigInt(n), 1n);
    }
}
