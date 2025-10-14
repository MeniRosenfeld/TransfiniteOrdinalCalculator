// operations/NumericContexts.ts

import { Rational } from './Rational.js';

export interface NumericContext<T> {
    ZERO: T;
    ONE: T;
    fromInt(n: number | bigint): T;
    fromDecimal(n: number): T;
    add(a: T, b: T): T;
    subtract(a: T, b: T): T;
    multiply(a: T, b: T): T;
    divide(a: T, b: T): T;
    square(a: T): T;
    compare(a: T, b: T): number;
    abs(a: T): T;
    min(a: T, b: T): T;
    max(a: T, b: T): T;
    isNaN(a: T): boolean;
    floor(a: T): bigint;
    toNumber(a: T): number;
    isZero(a: T): boolean;
}

export const DoubleFloatContext: NumericContext<number> = {
    ZERO: 0.0,
    ONE: 1.0,
    fromInt: (n) => {
        if (typeof n === 'bigint') return Number(n);
        return n;
    },
    fromDecimal: (n) => n, // Standard floats are the native type
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
    floor: (a) => BigInt(Math.floor(a)),
    toNumber: (a) => a,
    isZero: (a) => a === 0.0
};

export const RationalContext: NumericContext<Rational> = {
    ZERO: new Rational(0n),
    ONE: new Rational(1n),
    fromInt: (n) => Rational.fromInt(n),
    fromDecimal: (n) => {
        const precision = 10000000000000000n; // 10^16
        return new Rational(BigInt(Math.round(n * Number(precision))), precision);
    },
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
    floor: (a) => a.num / a.den, // BigInt division naturally floors
    toNumber: (a) => a.toNumber(),
    isZero: (a) => a.num === 0n
};
