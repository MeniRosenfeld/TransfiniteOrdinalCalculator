// operations/NumericContexts.js

const DoubleFloatContext = {
    ZERO: 0.0,
    ONE: 1.0,
    fromInt: (n) => Number(n.toString()), // Handles both numbers and BigInts safely
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b,
    square: (a) => a * a,
    compare: (a, b) => a < b ? -1 : (a > b ? 1 : 0),
    abs: (a) => Math.abs(a),
    min: (a, b) => Math.min(a, b),
    max: (a, b) => Math.max(a, b),
    isNaN: (a) => isNaN(a),
    toNumber: (a) => a,
    isZero: (a) => a === 0.0
};

const RationalContext = {
    ZERO: new Rational(0n),
    ONE: new Rational(1n),
    fromInt: (n) => Rational.fromInt(n),
    add: (a, b) => a.add(b),
    subtract: (a, b) => a.subtract(b),
    multiply: (a, b) => a.multiply(b),
    divide: (a, b) => a.divide(b),
    square: (a) => a.square(),
    compare: (a, b) => {
        const diff = a.subtract(b);
        if (diff.num < 0n) return -1;
        if (diff.num > 0n) return 1;
        return 0;
    },
    abs: (a) => new Rational(a.num < 0n ? -a.num : a.num, a.den),
    min: (a, b) => a.subtract(b).num < 0n ? a : b,
    max: (a, b) => a.subtract(b).num > 0n ? a : b,
    isNaN: (a) => false, // A valid Rational number can't be NaN
    toNumber: (a) => a.toNumber(),
    isZero: (a) => a.num === 0n
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DoubleFloatContext, RationalContext };
} else {
    window.DoubleFloatContext = DoubleFloatContext;
    window.RationalContext = RationalContext;
}
