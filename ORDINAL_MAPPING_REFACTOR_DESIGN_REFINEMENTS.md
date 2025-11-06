# Design Refinements for Ordinal Mapping Refactor - October 19, 2025

This document addresses key design issues raised during the initial plan review.

---

## Issue 1: Type Consistency and Generics

### Problem Statement

The current design doesn't enforce type consistency:
- `Interval` can have `lower` and `upper` of different `NumericValue` types
- Operations like `add(other)` accept any `NumericValue`, leading to O(n²) type combinations
- No compile-time guarantee that scale parameters match value types

### Solution: Use TypeScript Generics

TypeScript generics can enforce type consistency without runtime overhead.

#### Refined NumericValue Design

```typescript
/**
 * NumericValue - Abstract base class for numeric types
 * 
 * Generic parameter T is the concrete type (for type-safe operations)
 */
export abstract class NumericValue<T extends NumericValue<T>> {
    /**
     * Get the numeric type identifier
     */
    abstract getType(): string;
    
    // === Constants (must be overridden with correct type) ===
    static readonly ZERO: never; // Subclasses override with specific type
    static readonly ONE: never;
    static readonly TWO: never;
    
    // === Comparison ===
    abstract compare(other: T): number;
    
    equals(other: T): boolean { return this.compare(other) === 0; }
    lessThan(other: T): boolean { return this.compare(other) < 0; }
    // ... etc
    
    // === Arithmetic Operations (type-safe) ===
    abstract add(other: T): T;
    abstract subtract(other: T): T;
    abstract multiply(other: T): T;
    abstract divide(other: T): T;
    
    abstract negate(): T;
    abstract abs(): T;
    square(): T { return this.multiply(this as unknown as T); }
    
    // === Conversion ===
    abstract toNumber(): number;
    abstract toString(): string;
    abstract clone(): T;
}
```

#### Concrete Implementations

```typescript
export class DoubleNumericValue extends NumericValue<DoubleNumericValue> {
    private readonly _value: number;
    
    constructor(value: number) {
        super();
        this._value = value;
    }
    
    getType(): string { return 'double'; }
    
    // === Constants ===
    static readonly ZERO = new DoubleNumericValue(0);
    static readonly ONE = new DoubleNumericValue(1);
    static readonly TWO = new DoubleNumericValue(2);
    static readonly POSITIVE_INFINITY = new DoubleNumericValue(Infinity);
    static readonly NEGATIVE_INFINITY = new DoubleNumericValue(-Infinity);
    
    // === Comparison ===
    compare(other: DoubleNumericValue): number {
        if (this._value < other._value) return -1;
        if (this._value > other._value) return 1;
        return 0;
    }
    
    // === Arithmetic (type-safe - only accepts DoubleNumericValue) ===
    add(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value + other._value);
    }
    
    subtract(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value - other._value);
    }
    
    multiply(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value * other._value);
    }
    
    divide(other: DoubleNumericValue): DoubleNumericValue {
        return new DoubleNumericValue(this._value / other._value);
    }
    
    negate(): DoubleNumericValue {
        return new DoubleNumericValue(-this._value);
    }
    
    abs(): DoubleNumericValue {
        return new DoubleNumericValue(Math.abs(this._value));
    }
    
    // === Utility ===
    isInfinite(): boolean {
        return !isFinite(this._value);
    }
    
    isPositiveInfinity(): boolean {
        return this._value === Infinity;
    }
    
    isNegativeInfinity(): boolean {
        return this._value === -Infinity;
    }
    
    // === Conversion ===
    toNumber(): number { return this._value; }
    toString(): string { return this._value.toString(); }
    clone(): DoubleNumericValue { return new DoubleNumericValue(this._value); }
    
    // === Factory ===
    static fromNumber(n: number): DoubleNumericValue {
        return new DoubleNumericValue(n);
    }
}
```

```typescript
export class RationalNumericValue extends NumericValue<RationalNumericValue> {
    private readonly _numerator: bigint;
    private readonly _denominator: bigint;
    
    constructor(numerator: bigint, denominator: bigint = 1n) {
        super();
        if (denominator === 0n) {
            throw new Error('Denominator cannot be zero');
        }
        
        // Normalize
        const gcd = this._gcd(numerator, denominator);
        this._numerator = numerator / gcd;
        this._denominator = denominator / gcd;
        
        // Ensure denominator is positive
        if (this._denominator < 0n) {
            this._numerator = -this._numerator;
            this._denominator = -this._denominator;
        }
    }
    
    getType(): string { return 'rational'; }
    
    // === Constants ===
    static readonly ZERO = new RationalNumericValue(0n, 1n);
    static readonly ONE = new RationalNumericValue(1n, 1n);
    static readonly TWO = new RationalNumericValue(2n, 1n);
    static readonly POSITIVE_INFINITY = new RationalNumericValue(1n, 0n); // Positive numerator, zero denominator
    static readonly NEGATIVE_INFINITY = new RationalNumericValue(-1n, 0n); // Negative numerator, zero denominator
    
    // === Comparison (type-safe) ===
    compare(other: RationalNumericValue): number {
        // Handle infinities
        if (this._denominator === 0n && other._denominator === 0n) {
            // Both infinite - compare signs
            if (this._numerator > 0n && other._numerator < 0n) return 1;
            if (this._numerator < 0n && other._numerator > 0n) return -1;
            return 0; // Both same infinity
        }
        if (this._denominator === 0n) {
            return this._numerator > 0n ? 1 : -1; // This is infinite
        }
        if (other._denominator === 0n) {
            return other._numerator > 0n ? -1 : 1; // Other is infinite
        }
        
        // Normal comparison: a/b < c/d iff a*d < b*c
        const left = this._numerator * other._denominator;
        const right = other._numerator * this._denominator;
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
    }
    
    // === Arithmetic (type-safe) ===
    add(other: RationalNumericValue): RationalNumericValue {
        // Handle infinity cases
        if (this._denominator === 0n) return this.clone();
        if (other._denominator === 0n) return other.clone();
        
        // a/b + c/d = (a*d + b*c) / (b*d)
        const num = this._numerator * other._denominator + this._denominator * other._numerator;
        const den = this._denominator * other._denominator;
        return new RationalNumericValue(num, den);
    }
    
    subtract(other: RationalNumericValue): RationalNumericValue {
        return this.add(other.negate());
    }
    
    multiply(other: RationalNumericValue): RationalNumericValue {
        // Handle infinity cases
        if (this._denominator === 0n || other._denominator === 0n) {
            const sign = (this._numerator > 0n) === (other._numerator > 0n) ? 1n : -1n;
            return new RationalNumericValue(sign, 0n);
        }
        
        return new RationalNumericValue(
            this._numerator * other._numerator,
            this._denominator * other._denominator
        );
    }
    
    divide(other: RationalNumericValue): RationalNumericValue {
        // Division by infinity -> 0
        if (other._denominator === 0n) {
            return RationalNumericValue.ZERO;
        }
        
        // Division by zero -> infinity
        if (other._numerator === 0n) {
            const sign = this._numerator > 0n ? 1n : -1n;
            return new RationalNumericValue(sign, 0n);
        }
        
        // Normal division: (a/b) / (c/d) = (a*d) / (b*c)
        return new RationalNumericValue(
            this._numerator * other._denominator,
            this._denominator * other._numerator
        );
    }
    
    negate(): RationalNumericValue {
        return new RationalNumericValue(-this._numerator, this._denominator);
    }
    
    abs(): RationalNumericValue {
        return new RationalNumericValue(
            this._numerator < 0n ? -this._numerator : this._numerator,
            this._denominator
        );
    }
    
    // === Utility ===
    isInfinite(): boolean {
        return this._denominator === 0n;
    }
    
    isPositiveInfinity(): boolean {
        return this._denominator === 0n && this._numerator > 0n;
    }
    
    isNegativeInfinity(): boolean {
        return this._denominator === 0n && this._numerator < 0n;
    }
    
    private _gcd(a: bigint, b: bigint): bigint {
        a = a < 0n ? -a : a;
        b = b < 0n ? -b : b;
        while (b !== 0n) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
    
    // === Conversion ===
    toNumber(): number {
        if (this._denominator === 0n) {
            return this._numerator > 0n ? Infinity : -Infinity;
        }
        return Number(this._numerator) / Number(this._denominator);
    }
    
    toString(): string {
        if (this._denominator === 0n) {
            return this._numerator > 0n ? '+∞' : '-∞';
        }
        if (this._denominator === 1n) {
            return this._numerator.toString();
        }
        return `${this._numerator}/${this._denominator}`;
    }
    
    clone(): RationalNumericValue {
        return new RationalNumericValue(this._numerator, this._denominator);
    }
    
    // === Factory ===
    static fromIntegers(num: number, den: number = 1): RationalNumericValue {
        return new RationalNumericValue(BigInt(num), BigInt(den));
    }
    
    static fromBigInts(num: bigint, den: bigint = 1n): RationalNumericValue {
        return new RationalNumericValue(num, den);
    }
}
```

#### Type-Safe Interval

```typescript
/**
 * Interval with type-safe bounds
 * 
 * Generic parameter T ensures lower and upper are the same type
 */
export class Interval<T extends NumericValue<T>> {
    private readonly _lower: T;
    private readonly _upper: T;
    
    constructor(lower: T, upper: T) {
        // Validate same type
        if (lower.getType() !== upper.getType()) {
            throw new TypeError('Interval bounds must be the same type');
        }
        
        // Validate lower <= upper
        if (lower.compare(upper) > 0) {
            throw new Error('Interval lower bound must be <= upper bound');
        }
        
        this._lower = lower;
        this._upper = upper;
    }
    
    get lower(): T { return this._lower; }
    get upper(): T { return this._upper; }
    
    getType(): string { return this._lower.getType(); }
    
    // === Predicates ===
    isEmpty(): boolean {
        return this._lower.equals(this._upper);
    }
    
    contains(value: T): boolean {
        return this._lower.lessThanOrEqual(value) && 
               value.lessThanOrEqual(this._upper);
    }
    
    isInfinite(): boolean {
        // Check if either bound is infinite
        if ('isInfinite' in this._lower) {
            return (this._lower as any).isInfinite() || (this._upper as any).isInfinite();
        }
        return false;
    }
    
    // === Arithmetic (type-safe) ===
    add(other: Interval<T>): Interval<T> {
        return new Interval(
            this._lower.add(other._lower),
            this._upper.add(other._upper)
        );
    }
    
    subtract(other: Interval<T>): Interval<T> {
        return new Interval(
            this._lower.subtract(other._upper),
            this._upper.subtract(other._lower)
        );
    }
    
    multiply(other: Interval<T>): Interval<T> {
        const products = [
            this._lower.multiply(other._lower),
            this._lower.multiply(other._upper),
            this._upper.multiply(other._lower),
            this._upper.multiply(other._upper)
        ];
        
        let min = products[0];
        let max = products[0];
        
        for (const p of products) {
            if (p.lessThan(min)) min = p;
            if (p.greaterThan(max)) max = p;
        }
        
        return new Interval(min, max);
    }
    
    divide(other: Interval<T>): Interval<T> {
        // Check if denominator contains zero
        const zero = (this._lower.constructor as any).ZERO as T;
        
        if (other.contains(zero)) {
            // Division by interval containing zero -> infinite interval
            const negInf = (this._lower.constructor as any).NEGATIVE_INFINITY as T;
            const posInf = (this._lower.constructor as any).POSITIVE_INFINITY as T;
            return new Interval(negInf, posInf);
        }
        
        // Normal division: multiply by reciprocal
        const reciprocals = [
            other._lower.divide(zero.add(zero).add((this._lower.constructor as any).ONE as T)),
            other._upper.divide(zero.add(zero).add((this._lower.constructor as any).ONE as T))
        ];
        
        // Actually compute 1/lower and 1/upper
        const one = (this._lower.constructor as any).ONE as T;
        const recipLower = one.divide(other._upper);
        const recipUpper = one.divide(other._lower);
        
        return this.multiply(new Interval(recipLower, recipUpper));
    }
    
    // === Utility ===
    toString(): string {
        return `[${this._lower.toString()}, ${this._upper.toString()}]`;
    }
    
    // === Static Factory ===
    static fromValue<T extends NumericValue<T>>(value: T): Interval<T> {
        return new Interval(value, value.clone());
    }
}
```

#### Type-Safe FParams

```typescript
/**
 * FParams with type-safe numeric values
 * 
 * All scale factors and precomputed values are guaranteed to be the same type
 */
export class FParams<T extends NumericValue<T>> {
    readonly scaleAdd: T;
    readonly scaleMult: T;
    readonly scaleExp: T;
    readonly scaleTet: T;
    readonly scaleEpsilon: T;
    readonly precomputed: Array<T | null>;
    
    constructor(
        valueType: new (n: number) => T,
        scaleAdd: number,
        scaleMult: number,
        scaleExp: number,
        scaleTet: number,
        scaleEpsilon: number
    ) {
        // Create values of the correct type
        this.scaleAdd = new valueType(scaleAdd);
        this.scaleMult = new valueType(scaleMult);
        this.scaleExp = new valueType(scaleExp);
        this.scaleTet = new valueType(scaleTet);
        this.scaleEpsilon = new valueType(scaleEpsilon);
        
        // Get constants
        const ONE = (valueType as any).ONE as T;
        
        // Precompute values (all guaranteed to be type T)
        this.precomputed = new Array(11);
        this.precomputed[0] = null;
        
        // Expression 1: scaleMult * (1 + scaleExp)
        this.precomputed[1] = this.scaleMult.multiply(ONE.add(this.scaleExp));
        
        // Expression 2: 1 + scaleMult
        this.precomputed[2] = ONE.add(this.scaleMult);
        
        // Expression 3: 1 + scaleMult * (1 + scaleExp)
        this.precomputed[3] = ONE.add(this.precomputed[1]!);
        
        // ... etc - all type-safe
    }
    
    getType(): string {
        return this.scaleAdd.getType();
    }
}

// Usage:
const paramsDouble = new FParams(DoubleNumericValue, 3, 3, 3, 3, 3);
const paramsRational = new FParams(RationalNumericValue, 3, 3, 3, 3, 3);
```

### Benefits of Generic Approach

1. **Compile-time type safety**: TypeScript prevents mixing types
2. **No runtime overhead**: Generics are erased at runtime
3. **Better IDE support**: Autocomplete knows exact types
4. **Prevents O(n²) combinations**: Can't call `DoubleNumericValue.add(RationalNumericValue)`
5. **Self-documenting**: Type signatures make contracts clear

---

## Issue 2: Division by Zero and Infinity

### Problem Statement

Division by interval containing zero should return (-∞, +∞), but this requires:
1. Infinity support in numeric types
2. Proper arithmetic with infinities

### Solution: Native Infinity Support

#### DoubleNumericValue (Already Supports Infinity)

JavaScript numbers naturally support `Infinity` and `-Infinity`:

```typescript
const posInf = DoubleNumericValue.fromNumber(Infinity);
const negInf = DoubleNumericValue.fromNumber(-Infinity);

// Arithmetic works correctly
posInf.add(DoubleNumericValue.ONE); // -> Infinity
negInf.multiply(DoubleNumericValue.TWO); // -> -Infinity
DoubleNumericValue.ONE.divide(DoubleNumericValue.ZERO); // -> Infinity
```

#### RationalNumericValue (Use Zero Denominator)

Represent infinity as rational with zero denominator:

```typescript
// Infinity: numerator = sign, denominator = 0
+∞ = 1n / 0n  (numerator > 0, denominator = 0)
-∞ = -1n / 0n (numerator < 0, denominator = 0)

// Implementation already shown above in RationalNumericValue
```

**BigInt has no max value** - it can grow arbitrarily large, so we need the zero-denominator representation.

#### Interval Division Handling

```typescript
divide(other: Interval<T>): Interval<T> {
    const zero = (this._lower.constructor as any).ZERO as T;
    
    if (other.contains(zero)) {
        // Denominator contains zero -> result is full real line
        const negInf = (this._lower.constructor as any).NEGATIVE_INFINITY as T;
        const posInf = (this._lower.constructor as any).POSITIVE_INFINITY as T;
        return new Interval(negInf, posInf);
    }
    
    // Safe to divide - doesn't contain zero
    const one = (this._lower.constructor as any).ONE as T;
    const recipLower = one.divide(other._upper);
    const recipUpper = one.divide(other._lower);
    return this.multiply(new Interval(recipLower, recipUpper));
}
```

### How This Works in Practice

```typescript
// Example: finding remainder with potential division by near-zero

function findRemainderInterval<T extends NumericValue<T>>(
    xInterval: Interval<T>,
    k: OrdinalRep,
    m: bigint,  // Note: ordinal coefficients are BigInt, not number
    params: FParams<T>
): Interval<T> {
    const fOmegaKM = /* ... */;
    const fOmegaKMPlus1 = /* ... */;
    
    const denominator = fOmegaKMPlus1.subtract(fOmegaKM);
    
    // If denominator contains zero, division returns (-∞, +∞)
    const frInterval = xInterval.subtract(fOmegaKM)
        .multiply(fOmegaK)
        .divide(denominator);
    
    if (frInterval.isInfinite()) {
        // Can't determine remainder precisely - too much uncertainty
        // Return a safe fallback (e.g., zero or throw error)
        return Interval.fromValue((xInterval.lower.constructor as any).ZERO);
    }
    
    // Continue with bounded interval
    return frInterval;
}
```

**Behavior Confirmed:** Returning (-∞, +∞) will propagate through arithmetic operations.
- When tested for containment of 0 (or any value), it will test positive
- This effectively says "unknown, so use simplest option"
- This is mathematically honest - we truly don't know the precise value

**Special Case - Division 0/0:**
When dividing an interval containing 0 by another interval containing 0, we also return (-∞, +∞).
This differs semantically from dividing a non-zero interval by one containing 0, but the same
representation works for both. Further exploration may reveal if different handling would be beneficial.

---

## Issue 3: Existing Rational Libraries

### JavaScript Rational Number Libraries

#### Option 1: `fraction.js`
```bash
npm install fraction.js
```

**Pros:**
- Mature, well-tested
- Supports mixed numbers, LaTeX output
- Good API: `new Fraction(1, 3).add(new Fraction(1, 6))`
- ~50KB minified

**Cons:**
- Uses JavaScript numbers internally (not BigInt) - limited range
- No infinity support built-in

#### Option 2: `big-rational`
```bash
npm install big-rational
```

**Pros:**
- Uses BigInt internally - arbitrary precision
- Clean API: `bigRat(1, 3).add(bigRat(1, 6))`
- Automatic reduction to lowest terms

**Cons:**
- No infinity support
- Less feature-rich
- Smaller community

#### Option 3: Roll Our Own (Recommended)

**Reasons:**
1. **Need infinity support**: Neither library provides this natively
2. **Need to fit NumericValue interface**: Would need wrapper anyway
3. **Simple implementation**: Rational arithmetic is straightforward
4. **No external dependencies**: Keeps bundle small
5. **Full control**: Can optimize for our use case

**Implementation complexity:** ~200 lines including infinity support

```typescript
// Our implementation is actually not much code:
class RationalNumericValue extends NumericValue<RationalNumericValue> {
    // ~30 lines: constructor + normalization
    // ~40 lines: comparison
    // ~60 lines: arithmetic (add, sub, mul, div)
    // ~30 lines: infinity handling
    // ~20 lines: utilities and factories
    // ~20 lines: conversion and display
    // Total: ~200 lines, simple algorithms
}
```

### Recommendation

**Implement our own RationalNumericValue** because:
- We need infinity support anyway (custom addition)
- We need to implement NumericValue interface (wrapper needed)
- Algorithm is simple (GCD, arithmetic, normalization)
- No external dependency
- Full control over behavior

If implementation proves buggy, we can switch to `big-rational` as backend:

```typescript
import bigRat from 'big-rational';

class RationalNumericValue extends NumericValue<RationalNumericValue> {
    private _value: bigRat;
    
    // Wrap big-rational operations...
    add(other: RationalNumericValue): RationalNumericValue {
        return new RationalNumericValue(this._value.add(other._value));
    }
}
```

---

## Issue 4: Do We Need NumericContext?

### Current Role of NumericContext

From the existing code:

```typescript
export class NumericContext {
    // 1. Factory methods
    fromNumber(n: number): NumericValue
    fromInt(bigInt: bigint): NumericValue
    
    // 2. Constants
    get ZERO(): NumericValue
    get ONE(): NumericValue
    
    // 3. Operations (delegating to instances)
    add(a, b): NumericValue
    subtract(a, b): NumericValue
    // ... etc
    
    // 4. Interval factories
    intervalFromValue(v): Interval
    intervalFromThreshold(center, threshold): Interval
}
```

### Analysis: Is NumericContext Needed?

#### Arguments FOR keeping it:

1. **Factory convenience**: `ctx.fromNumber(5)` vs `new DoubleNumericValue(5)`
2. **Type uniformity**: One context object carries type information
3. **Backward compatibility**: Existing code uses `ctx.add(a, b)`
4. **Switching types**: Easy to swap `DoubleContext` → `RationalContext`

#### Arguments AGAINST keeping it:

1. **Redundant with static methods**: `DoubleNumericValue.fromNumber(5)` works fine
2. **Redundant with instance methods**: `a.add(b)` is more natural than `ctx.add(a, b)`
3. **Extra abstraction layer**: More code to maintain
4. **Type safety**: Generics enforce type safety without context

### Recommendation: Simplified NumericContext

**Keep a minimal NumericContext** for convenience, but make it optional:

```typescript
/**
 * NumericContext - Optional convenience wrapper for type-specific operations
 * 
 * Provides factory methods and constants for a specific numeric type.
 * Not required - can use NumericValue types directly.
 */
export class NumericContext<T extends NumericValue<T>> {
    constructor(private readonly valueType: new (...args: any[]) => T) {}
    
    // === Constants (delegate to static) ===
    get ZERO(): T { return (this.valueType as any).ZERO; }
    get ONE(): T { return (this.valueType as any).ONE; }
    get TWO(): T { return (this.valueType as any).TWO; }
    get POSITIVE_INFINITY(): T { return (this.valueType as any).POSITIVE_INFINITY; }
    get NEGATIVE_INFINITY(): T { return (this.valueType as any).NEGATIVE_INFINITY; }
    
    // === Factory Methods ===
    fromNumber(n: number): T {
        return (this.valueType as any).fromNumber(n);
    }
    
    // === Interval Factories ===
    interval(lower: T, upper: T): Interval<T> {
        return new Interval(lower, upper);
    }
    
    intervalFromValue(value: T): Interval<T> {
        return Interval.fromValue(value);
    }
    
    intervalFromThreshold(center: T, threshold: T): Interval<T> {
        const lower = center.subtract(threshold);
        const upper = center.add(threshold);
        return new Interval(lower, upper);
    }
    
    // Optional: convenience operations (delegate to instance methods)
    // These are not necessary but may improve readability in some contexts
    add(a: T, b: T): T { return a.add(b); }
    subtract(a: T, b: T): T { return a.subtract(b); }
    multiply(a: T, b: T): T { return a.multiply(b); }
    divide(a: T, b: T): T { return a.divide(b); }
}

// Standard contexts
export const DoubleContext = new NumericContext(DoubleNumericValue);
export const RationalContext = new NumericContext(RationalNumericValue);
```

### Usage Patterns

**With context (for convenience):**
```typescript
const ctx = DoubleContext;
const x = ctx.fromNumber(5);
const y = ctx.fromNumber(3);
const interval = ctx.intervalFromThreshold(x, ctx.fromNumber(0.1));
```

**Without context (direct usage):**
```typescript
const x = DoubleNumericValue.fromNumber(5);
const y = DoubleNumericValue.fromNumber(3);
const sum = x.add(y);
const interval = new Interval(
    x.subtract(DoubleNumericValue.fromNumber(0.1)),
    x.add(DoubleNumericValue.fromNumber(0.1))
);
```

**In FParams:**
```typescript
// Context provides type information
const params = new FParams(DoubleContext, 3, 3, 3, 3, 3);

// Or pass type constructor directly
const params = new FParams(DoubleNumericValue, 3, 3, 3, 3, 3);
```

### Recommendation

**Keep NumericContext but make it lightweight:**
- Primary role: convenient factories and constants
- Secondary role: type carrying object (pass one context instead of type + values)
- Optional: Users can bypass it and use NumericValue types directly
- Don't duplicate all operations - instance methods are preferred

---

## Updated Design Summary

### Core Type Hierarchy (TypeScript)

```
NumericValue<T extends NumericValue<T>>          [abstract, generic]
├── DoubleNumericValue extends NumericValue<DoubleNumericValue>
├── RationalNumericValue extends NumericValue<RationalNumericValue>
└── [Future: BigFloatNumericValue, etc.]

Interval<T extends NumericValue<T>>             [concrete, generic]

FParams<T extends NumericValue<T>>              [concrete, generic]

NumericContext<T extends NumericValue<T>>       [concrete, optional helper]
```

### Key Improvements

1. **Type Safety**: Generics enforce same-type operations at compile time
2. **Infinity Support**: Both Double and Rational support ±∞
3. **No External Deps**: Implement our own Rational (simple, ~200 lines)
4. **Minimal Context**: Keep NumericContext lightweight and optional
5. **Division by Zero**: Returns (-∞, +∞) interval naturally

### Migration from Current Plan

**Changes to make:**
1. Add generic type parameters to all classes
2. Change `NumericValue` operations to accept same-type only
3. Add infinity constants and handling to both numeric types
4. Implement zero-denominator infinity for Rational
5. Simplify NumericContext to just factories + constants
6. Update Interval division to handle zero-containing denominators

### Files to Update

```
src/ordinal_mapping/
├── NumericValue.ts          [Add generic T, enforce same-type ops]
├── DoubleNumericValue.ts    [Extend NumericValue<DoubleNumericValue>]
├── RationalNumericValue.ts  [Extend NumericValue<RationalNumericValue>, add infinity]
├── Interval.ts              [Add generic T, handle infinite intervals]
├── NumericContext.ts        [Simplify, make optional]
└── FParams.ts               [Add generic T]
```

---

## Implementation Priority

### Phase 1: Core Types (Days 1-3)

1. Implement `NumericValue<T>` abstract class with generics
2. Implement `DoubleNumericValue` with infinity support
3. Test double arithmetic thoroughly

### Phase 2: Rational + Infinity (Days 4-6)

1. Implement `RationalNumericValue` with zero-denominator infinity
2. Test rational arithmetic including infinity cases
3. Test conversions between types

### Phase 3: Intervals (Days 7-9)

1. Implement `Interval<T>` with generics
2. Implement division by zero → infinite interval
3. Test interval arithmetic with both numeric types

### Phase 4: Integration (Days 10-12)

1. Implement generic `FParams<T>`
2. Update `f()` and `fInverse()` to use generic types
3. Test end-to-end with both numeric types

---

## Design Decisions (Finalized)

### 1. Division by Zero Behavior ✅
**Decision:** Return (-∞, +∞) interval and let it propagate naturally.
- Infinite intervals propagate through arithmetic operations
- Containment tests on infinite intervals always succeed
- Special case 0/0 uses same representation (may explore further optimization later)

### 2. Infinity Arithmetic ✅
**Decision:** Simplified infinity rules (not full IEEE 754).
- Focus on what's needed for interval arithmetic
- Inf + Inf = Inf (same sign)
- Inf - Inf = mathematically undefined, but we'll handle via intervals
- Inf * non-zero = Inf (with appropriate sign)
- Inf / Inf = treat as uncertain (interval-based)

### 3. Type Conversion ✅
**Decision:** No automatic conversion between numeric types.
- All operations require matching types
- Explicit conversion only via `.convertTo()` methods
- TypeScript generics enforce this at compile time

### 4. Performance Optimization ✅
**Decision:** Keep implementation simple initially.
- Standard GCD algorithm for rational normalization
- No lazy evaluation or advanced optimizations
- Profile later and optimize only if needed
- Correctness over performance in first iteration

### 5. Implementation Language ✅
**Decision:** TypeScript with full type safety.
- Implement in `.ts` files
- Fully typed architecture with generics
- Leverage TypeScript's type system for correctness
- No JavaScript + JSDoc approach

---

**Document Version:** 2.0  
**Author:** GitHub Copilot  
**Date:** October 19, 2025  
**Status:** Design Refinement
