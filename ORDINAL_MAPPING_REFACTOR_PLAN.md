# Ordinal Mapping Refactor Plan - October 19, 2025

## Executive Summary

This document outlines a plan to refactor the ordinal mapping system (`ordinal_mapping.js` and `ordinal_mapping_inverse.js`) with two major improvements:

1. **Interval-Based Computation** - Replace threshold-based approximation with interval arithmetic
2. **Strongly-Typed Real Values** - Abstract numeric types supporting multiple implementations

## Goals

### Primary Goals
1. Improve mathematical precision and rigor
2. Make uncertainty handling more explicit and composable
3. Support multiple numeric types (IEEE floats, rationals, future: arbitrary precision)
4. Maintain backward compatibility for public APIs
5. Preserve existing functionality and test coverage

### Non-Goals
1. Changing the mathematical definition of f(α) or f⁻¹(x)
2. Adding new ordinal types or ranges
3. Performance optimization (maintain current performance as baseline)

---

## Part 1: Interval Arithmetic System

### 1.1 Interval Class Design

#### 1.1.1 Base Interval Class

**File:** `src/ordinal_mapping/Interval.js` (new file)

```javascript
/**
 * Interval - Represents a range [lower, upper] with typed numeric values
 * 
 * Invariants:
 * - lower <= upper (enforced by constructor)
 * - lower and upper must be of the same NumericType
 * - Intervals are immutable
 */
export class Interval {
    /**
     * @param {NumericValue} lower - Lower bound (inclusive)
     * @param {NumericValue} upper - Upper bound (inclusive)
     */
    constructor(lower, upper) {
        // Validate same type
        // Validate lower <= upper
        // Store immutably
    }

    // === Accessors ===
    get lower() { /* ... */ }
    get upper() { /* ... */ }
    get width() { /* return upper - lower */ }
    get center() { /* return (lower + upper) / 2 */ }
    get type() { /* return type of numeric values */ }
    
    // === Predicates ===
    isEmpty() { /* width === 0 */ }
    contains(value) { /* lower <= value <= upper */ }
    containsInterval(other) { /* this contains all of other */ }
    overlaps(other) { /* intervals have non-empty intersection */ }
    
    // === Arithmetic Operations ===
    // All operations return new Interval instances
    
    add(other) {
        // [a,b] + [c,d] = [a+c, b+d]
    }
    
    subtract(other) {
        // [a,b] - [c,d] = [a-d, b-c]
    }
    
    multiply(other) {
        // [a,b] * [c,d] = [min(ac,ad,bc,bd), max(ac,ad,bc,bd)]
    }
    
    divide(other) {
        // [a,b] / [c,d] = [a,b] * [1/d, 1/c] (if 0 not in [c,d])
        // Throws error if division by zero possible
    }
    
    square() {
        // Optimized square operation
        // Handles negative ranges correctly
    }
    
    reciprocal() {
        // 1 / [a,b] = [1/b, 1/a] (if 0 not in [a,b])
    }
    
    // === Comparison Operations ===
    // These return one of: 'definite', 'possible', 'impossible'
    
    compareToValue(value) {
        // Returns: '<', '=', '>', or 'uncertain'
    }
    
    compareToInterval(other) {
        // Returns: '<', '=', '>', 'overlaps', or 'disjoint'
    }
    
    // === Utility Methods ===
    
    narrow(newLower, newUpper) {
        // Returns intersection with [newLower, newUpper]
        // Used to refine intervals as we learn more
    }
    
    expand(factor) {
        // Expand interval by factor around center
        // Used for safety margins
    }
    
    toString() { /* "[lower, upper]" */ }
    toJSON() { /* for serialization */ }
    
    // === Static Factory Methods ===
    
    static fromValue(value) {
        // Creates [value, value] (point interval)
    }
    
    static fromThreshold(center, threshold) {
        // Creates [center - threshold, center + threshold]
        // For backward compatibility
    }
    
    static fromRelativeError(center, relativeError) {
        // Creates [center * (1 - err), center * (1 + err)]
    }
}
```

#### 1.1.2 Usage Examples

```javascript
// Create intervals
const x = new Interval(ctx.fromNumber(0.5), ctx.fromNumber(0.6));
const y = new Interval(ctx.fromNumber(0.3), ctx.fromNumber(0.4));

// Arithmetic automatically compounds uncertainty
const sum = x.add(y);  // [0.8, 1.0]
const product = x.multiply(y);  // [0.15, 0.24]

// Check containment
if (sum.contains(ctx.fromNumber(0.9))) {
    // Value is definitely in range
}

// Check against known values
const fOmega = Interval.fromValue(ctx.ONE);
if (x.compareToInterval(fOmega) === '<') {
    // x is definitely less than f(ω)
}
```

### 1.2 Integration with Existing Code

#### 1.2.1 Function Signature Changes

**Current:**
```javascript
function fInverse(x, params = DEFAULT_F_PARAMS, threshold = 1e-14, depth = 0)
function findFiniteOrdinal(ctx, x, threshold, scale)
function findJ(x, params, threshold)
// ... etc
```

**Refactored:**
```javascript
// Internal functions use intervals
function fInverseInterval(xInterval, params, depth = 0)
function findFiniteOrdinalInterval(xInterval, scale)
function findJInterval(xInterval, params)
// ... etc

// Public API maintains backward compatibility
function fInverse(x, params = DEFAULT_F_PARAMS, threshold = 1e-14) {
    const xInterval = Interval.fromThreshold(x, threshold);
    return fInverseInterval(xInterval, params);
}
```

#### 1.2.2 Comparison Logic Refactoring

**Current (threshold-based):**
```javascript
if (ctx.compare(ctx.abs(ctx.subtract(x, params.precomputed[5])), threshold) < 0) {
    return { type: 'epsilon', index: 0n }; // ε₀
}
```

**Refactored (interval-based):**
```javascript
if (xInterval.contains(params.precomputed[5])) {
    return { type: 'epsilon', index: 0n }; // ε₀
}

// Or for more sophisticated checks:
const epsilon0Interval = Interval.fromValue(params.precomputed[5]);
const comparison = xInterval.compareToInterval(epsilon0Interval);
if (comparison === '=' || comparison === 'overlaps') {
    return { type: 'epsilon', index: 0n };
}
```

#### 1.2.3 Error Amplification Tracking

```javascript
function findRemainderHigher(xInterval, k, m, params) {
    const fOmegaK = f({ type: 'pow', k: k }, params);
    const fOmegaKPlus1 = f({ type: 'pow', k: addOneToOrdinal(k) }, params);
    
    // ... calculations ...
    
    const denominator = fOmegaKMPlus1.subtract(fOmegaKM);
    
    // Error amplification is natural:
    const rAmplification = fOmegaK.divide(denominator);
    // rAmplification is now an interval showing uncertainty growth
    
    const frInterval = xInterval.subtract(fOmegaKM).multiply(fOmegaK).divide(denominator);
    // frInterval automatically contains compounded uncertainty
    
    return fInverseInterval(frInterval, params, depth + 1);
}
```

---

## Part 2: Strongly-Typed Real Values

### 2.1 Numeric Type System

#### 2.1.1 Abstract Base Class

**File:** `src/ordinal_mapping/NumericValue.js` (new file)

```javascript
/**
 * NumericValue - Abstract base class for numeric types
 * 
 * All numeric types must inherit from this and implement all abstract methods.
 * This ensures that intervals can work with any numeric type uniformly.
 */
export class NumericValue {
    /**
     * Get the numeric type identifier
     * @returns {string} Type identifier ('double', 'rational', 'bigfloat', etc.)
     */
    getType() {
        throw new Error('Abstract method getType() must be implemented');
    }
    
    // === Constants ===
    static get ZERO() { throw new Error('Abstract'); }
    static get ONE() { throw new Error('Abstract'); }
    static get TWO() { throw new Error('Abstract'); }
    
    // === Comparison ===
    
    /**
     * Compare to another value
     * @param {NumericValue} other
     * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
     */
    compare(other) { throw new Error('Abstract'); }
    
    equals(other) { return this.compare(other) === 0; }
    lessThan(other) { return this.compare(other) < 0; }
    lessThanOrEqual(other) { return this.compare(other) <= 0; }
    greaterThan(other) { return this.compare(other) > 0; }
    greaterThanOrEqual(other) { return this.compare(other) >= 0; }
    
    // === Arithmetic Operations ===
    // All operations return new instances (immutable)
    
    add(other) { throw new Error('Abstract'); }
    subtract(other) { throw new Error('Abstract'); }
    multiply(other) { throw new Error('Abstract'); }
    divide(other) { throw new Error('Abstract'); }
    
    negate() { throw new Error('Abstract'); }
    abs() { throw new Error('Abstract'); }
    square() { return this.multiply(this); }
    
    // === Conversion ===
    
    /**
     * Convert to JavaScript number (may lose precision)
     * @returns {number}
     */
    toNumber() { throw new Error('Abstract'); }
    
    /**
     * Convert to string representation
     * @returns {string}
     */
    toString() { throw new Error('Abstract'); }
    
    /**
     * Convert to another numeric type
     * @param {string} targetType - Target type identifier
     * @returns {NumericValue}
     */
    convertTo(targetType) { throw new Error('Abstract'); }
    
    // === Type Checking ===
    
    isZero() { return this.equals(this.constructor.ZERO); }
    isOne() { return this.equals(this.constructor.ONE); }
    isPositive() { return this.greaterThan(this.constructor.ZERO); }
    isNegative() { return this.lessThan(this.constructor.ZERO); }
    
    // === Utility ===
    
    /**
     * Clone this value (for safety, though values should be immutable)
     * @returns {NumericValue}
     */
    clone() { throw new Error('Abstract'); }
}
```

#### 2.1.2 Double Float Implementation

**File:** `src/ordinal_mapping/DoubleNumericValue.js` (new file)

```javascript
import { NumericValue } from './NumericValue.js';

/**
 * DoubleNumericValue - IEEE 754 double-precision floating point
 * 
 * Fast but limited precision (~15 decimal digits)
 * Subject to rounding errors in interval arithmetic
 */
export class DoubleNumericValue extends NumericValue {
    constructor(value) {
        super();
        if (typeof value !== 'number') {
            throw new TypeError('DoubleNumericValue requires a number');
        }
        this._value = value;
    }
    
    getType() { return 'double'; }
    
    // === Constants ===
    static get ZERO() { return new DoubleNumericValue(0); }
    static get ONE() { return new DoubleNumericValue(1); }
    static get TWO() { return new DoubleNumericValue(2); }
    
    // === Comparison ===
    compare(other) {
        if (!(other instanceof DoubleNumericValue)) {
            throw new TypeError('Can only compare with same type');
        }
        if (this._value < other._value) return -1;
        if (this._value > other._value) return 1;
        return 0;
    }
    
    // === Arithmetic ===
    add(other) {
        if (!(other instanceof DoubleNumericValue)) {
            throw new TypeError('Can only add same type');
        }
        return new DoubleNumericValue(this._value + other._value);
    }
    
    subtract(other) {
        if (!(other instanceof DoubleNumericValue)) {
            throw new TypeError('Can only subtract same type');
        }
        return new DoubleNumericValue(this._value - other._value);
    }
    
    multiply(other) {
        if (!(other instanceof DoubleNumericValue)) {
            throw new TypeError('Can only multiply same type');
        }
        return new DoubleNumericValue(this._value * other._value);
    }
    
    divide(other) {
        if (!(other instanceof DoubleNumericValue)) {
            throw new TypeError('Can only divide same type');
        }
        if (other._value === 0) {
            throw new Error('Division by zero');
        }
        return new DoubleNumericValue(this._value / other._value);
    }
    
    negate() { return new DoubleNumericValue(-this._value); }
    abs() { return new DoubleNumericValue(Math.abs(this._value)); }
    
    // === Conversion ===
    toNumber() { return this._value; }
    toString() { return this._value.toString(); }
    
    convertTo(targetType) {
        if (targetType === 'double') return this.clone();
        if (targetType === 'rational') {
            // Convert to rational (import RationalNumericValue)
            return RationalNumericValue.fromNumber(this._value);
        }
        throw new Error(`Unsupported conversion to ${targetType}`);
    }
    
    clone() { return new DoubleNumericValue(this._value); }
    
    // === Factory Methods ===
    static fromNumber(n) { return new DoubleNumericValue(n); }
}
```

#### 2.1.3 Rational Number Implementation

**File:** `src/ordinal_mapping/RationalNumericValue.js` (new file)

```javascript
import { NumericValue } from './NumericValue.js';
import { Rational } from '../operations/Rational.js';

/**
 * RationalNumericValue - Exact rational arithmetic
 * 
 * Represents numbers as p/q where p and q are BigInts
 * Provides exact arithmetic (no rounding errors)
 * Can grow large for complex calculations
 */
export class RationalNumericValue extends NumericValue {
    constructor(numerator, denominator = 1n) {
        super();
        if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint') {
            throw new TypeError('RationalNumericValue requires BigInt numerator and denominator');
        }
        if (denominator === 0n) {
            throw new Error('Denominator cannot be zero');
        }
        
        // Normalize: reduce to lowest terms and ensure denominator > 0
        const gcd = this._gcd(numerator, denominator);
        this._numerator = numerator / gcd;
        this._denominator = denominator / gcd;
        
        if (this._denominator < 0n) {
            this._numerator = -this._numerator;
            this._denominator = -this._denominator;
        }
    }
    
    getType() { return 'rational'; }
    
    get numerator() { return this._numerator; }
    get denominator() { return this._denominator; }
    
    // === Constants ===
    static get ZERO() { return new RationalNumericValue(0n, 1n); }
    static get ONE() { return new RationalNumericValue(1n, 1n); }
    static get TWO() { return new RationalNumericValue(2n, 1n); }
    
    // === Helper ===
    _gcd(a, b) {
        a = a < 0n ? -a : a;
        b = b < 0n ? -b : b;
        while (b !== 0n) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
    
    // === Comparison ===
    compare(other) {
        if (!(other instanceof RationalNumericValue)) {
            throw new TypeError('Can only compare with same type');
        }
        // a/b < c/d  iff  a*d < b*c (assuming b,d > 0, which is ensured by constructor)
        const left = this._numerator * other._denominator;
        const right = other._numerator * this._denominator;
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
    }
    
    // === Arithmetic ===
    add(other) {
        if (!(other instanceof RationalNumericValue)) {
            throw new TypeError('Can only add same type');
        }
        // a/b + c/d = (a*d + b*c) / (b*d)
        const num = this._numerator * other._denominator + this._denominator * other._numerator;
        const den = this._denominator * other._denominator;
        return new RationalNumericValue(num, den);
    }
    
    subtract(other) {
        if (!(other instanceof RationalNumericValue)) {
            throw new TypeError('Can only subtract same type');
        }
        // a/b - c/d = (a*d - b*c) / (b*d)
        const num = this._numerator * other._denominator - this._denominator * other._numerator;
        const den = this._denominator * other._denominator;
        return new RationalNumericValue(num, den);
    }
    
    multiply(other) {
        if (!(other instanceof RationalNumericValue)) {
            throw new TypeError('Can only multiply same type');
        }
        // (a/b) * (c/d) = (a*c) / (b*d)
        return new RationalNumericValue(
            this._numerator * other._numerator,
            this._denominator * other._denominator
        );
    }
    
    divide(other) {
        if (!(other instanceof RationalNumericValue)) {
            throw new TypeError('Can only divide same type');
        }
        if (other._numerator === 0n) {
            throw new Error('Division by zero');
        }
        // (a/b) / (c/d) = (a*d) / (b*c)
        return new RationalNumericValue(
            this._numerator * other._denominator,
            this._denominator * other._numerator
        );
    }
    
    negate() {
        return new RationalNumericValue(-this._numerator, this._denominator);
    }
    
    abs() {
        return new RationalNumericValue(
            this._numerator < 0n ? -this._numerator : this._numerator,
            this._denominator
        );
    }
    
    // === Conversion ===
    toNumber() {
        return Number(this._numerator) / Number(this._denominator);
    }
    
    toString() {
        if (this._denominator === 1n) {
            return this._numerator.toString();
        }
        return `${this._numerator}/${this._denominator}`;
    }
    
    convertTo(targetType) {
        if (targetType === 'rational') return this.clone();
        if (targetType === 'double') {
            return DoubleNumericValue.fromNumber(this.toNumber());
        }
        throw new Error(`Unsupported conversion to ${targetType}`);
    }
    
    clone() {
        return new RationalNumericValue(this._numerator, this._denominator);
    }
    
    // === Factory Methods ===
    static fromIntegers(num, den = 1) {
        return new RationalNumericValue(BigInt(num), BigInt(den));
    }
    
    static fromNumber(n) {
        // Convert float to rational using continued fractions or similar
        // For simplicity, use a reasonable approximation
        const precision = 1e10;
        const numerator = BigInt(Math.round(n * precision));
        const denominator = BigInt(precision);
        return new RationalNumericValue(numerator, denominator);
    }
    
    static fromBigInts(num, den = 1n) {
        return new RationalNumericValue(num, den);
    }
}
```

### 2.2 NumericContext Refactoring

The existing `NumericContexts.js` needs to be refactored to work with the new type system.

**File:** `src/ordinal_mapping/NumericContext.js` (refactored)

```javascript
/**
 * NumericContext - Factory and operations for a specific numeric type
 * 
 * Replaces the old DoubleFloatContext and RationalContext
 * Now works with NumericValue subclasses
 */
export class NumericContext {
    constructor(valueType) {
        this.valueType = valueType;
    }
    
    get ZERO() { return this.valueType.ZERO; }
    get ONE() { return this.valueType.ONE; }
    get TWO() { return this.valueType.TWO; }
    
    // === Factory Methods ===
    fromNumber(n) {
        if (this.valueType === DoubleNumericValue) {
            return DoubleNumericValue.fromNumber(n);
        } else if (this.valueType === RationalNumericValue) {
            return RationalNumericValue.fromNumber(n);
        }
        throw new Error(`Unknown value type: ${this.valueType}`);
    }
    
    fromInt(bigInt) {
        const n = Number(bigInt);
        return this.fromNumber(n);
    }
    
    // === Interval Factory ===
    intervalFromValue(value) {
        return Interval.fromValue(value);
    }
    
    intervalFromRange(lower, upper) {
        return new Interval(lower, upper);
    }
    
    intervalFromThreshold(center, threshold) {
        return Interval.fromThreshold(center, threshold);
    }
    
    // === Operations (for backward compatibility) ===
    add(a, b) { return a.add(b); }
    subtract(a, b) { return a.subtract(b); }
    multiply(a, b) { return a.multiply(b); }
    divide(a, b) { return a.divide(b); }
    square(a) { return a.square(); }
    abs(a) { return a.abs(); }
    
    compare(a, b) { return a.compare(b); }
    max(a, b) { return a.greaterThan(b) ? a : b; }
    min(a, b) { return a.lessThan(b) ? a : b; }
    
    isZero(a) { return a.isZero(); }
    isNaN(a) { return false; } // NumericValues don't have NaN
    
    toNumber(a) { return a.toNumber(); }
    floor(a) {
        const n = Math.floor(a.toNumber());
        return BigInt(n);
    }
}

// Export standard contexts
export const DoubleContext = new NumericContext(DoubleNumericValue);
export const RationalContext = new NumericContext(RationalNumericValue);
```

### 2.3 FParams Refactoring

**File:** `src/ordinal_mapping.js` (refactored section)

```javascript
/**
 * FParams - Parameters for the f mapping with typed numeric values
 * 
 * All scale factors and precomputed values must be of the same numeric type.
 */
export class FParams {
    constructor(numericContext, scaleAdd, scaleMult, scaleExp, scaleTet, scaleEpsilon) {
        this.ctx = numericContext;
        
        // Convert scale factors to appropriate numeric type
        this.scaleAdd = numericContext.fromNumber(scaleAdd);
        this.scaleMult = numericContext.fromNumber(scaleMult);
        this.scaleExp = numericContext.fromNumber(scaleExp);
        this.scaleTet = numericContext.fromNumber(scaleTet);
        this.scaleEpsilon = numericContext.fromNumber(scaleEpsilon);
        
        // Precompute common expressions (using new NumericValue operations)
        this.precomputed = new Array(11);
        this.precomputed[0] = null;
        
        // All arithmetic now uses NumericValue methods
        this.precomputed[1] = this.scaleMult.multiply(
            this.ctx.ONE.add(this.scaleExp)
        );
        
        this.precomputed[2] = this.ctx.ONE.add(this.scaleMult);
        
        this.precomputed[3] = this.ctx.ONE.add(this.precomputed[1]);
        
        // ... etc (convert all precomputed values to use NumericValue operations)
    }
    
    /**
     * Get the numeric type used by this FParams
     */
    getNumericType() {
        return this.scaleAdd.getType();
    }
    
    /**
     * Convert this FParams to use a different numeric type
     */
    convertTo(targetContext) {
        return new FParams(
            targetContext,
            this.scaleAdd.toNumber(),
            this.scaleMult.toNumber(),
            this.scaleExp.toNumber(),
            this.scaleTet.toNumber(),
            this.scaleEpsilon.toNumber()
        );
    }
}

// Default parameters now use DoubleContext
export const DEFAULT_F_PARAMS = new FParams(DoubleContext, 3, 3, 3, 3, 3);
export const DEFAULT_F_PARAMS_RATIONAL = new FParams(RationalContext, 3, 3, 3, 3, 3);
```

---

## Part 3: Implementation Strategy

### 3.1 Phase 1: Foundation (Week 1)

#### Day 1-2: Numeric Type System
- [ ] Create `src/ordinal_mapping/` directory
- [ ] Implement `NumericValue.js` (abstract base)
- [ ] Implement `DoubleNumericValue.js`
- [ ] Write unit tests for DoubleNumericValue
- [ ] Verify all arithmetic operations work correctly

#### Day 3-4: Rational Implementation
- [ ] Implement `RationalNumericValue.js`
- [ ] Write unit tests for RationalNumericValue
- [ ] Test conversion between Double and Rational
- [ ] Test edge cases (large numerators, precision)

#### Day 5: NumericContext Refactor
- [ ] Refactor `NumericContext.js` to use new types
- [ ] Update FParams to use NumericValue
- [ ] Ensure backward compatibility with existing code
- [ ] Run existing tests to ensure nothing breaks

### 3.2 Phase 2: Interval Arithmetic (Week 2)

#### Day 1-2: Interval Class
- [ ] Implement `Interval.js` class
- [ ] Implement all arithmetic operations
- [ ] Implement comparison operations
- [ ] Write comprehensive unit tests

#### Day 3-4: Interval Operations
- [ ] Test interval arithmetic with DoubleNumericValue
- [ ] Test interval arithmetic with RationalNumericValue
- [ ] Verify error propagation works correctly
- [ ] Test edge cases (zero-width, division by zero)

#### Day 5: Integration Preparation
- [ ] Design conversion strategy for existing functions
- [ ] Document migration patterns
- [ ] Create helper functions for common operations

### 3.3 Phase 3: Refactor f() Function (Week 3)

#### Day 1-2: Core f() Refactor
- [ ] Create `fInterval()` internal function
- [ ] Update all arithmetic to use NumericValue operations
- [ ] Maintain `f()` public API with backward compatibility
- [ ] Update memoization to work with intervals

#### Day 3-4: Testing and Validation
- [ ] Run all existing f() tests
- [ ] Add new tests with intervals
- [ ] Add new tests with rational arithmetic
- [ ] Compare results: double vs rational

#### Day 5: Documentation
- [ ] Document new interval-based f() behavior
- [ ] Document numeric type selection guide
- [ ] Update API documentation

### 3.4 Phase 4: Refactor fInverse() (Week 4)

#### Day 1-3: Helper Functions
- [ ] Refactor `findFiniteOrdinal` → `findFiniteOrdinalInterval`
- [ ] Refactor `findJ` → `findJInterval`
- [ ] Refactor `findM` → `findMInterval`
- [ ] Refactor `findCoefficientHigher` → `findCoefficientHigherInterval`
- [ ] Refactor `findRemainderHigher` → `findRemainderHigherInterval`

#### Day 4: Core fInverse() Refactor
- [ ] Create `fInverseInterval()` internal function
- [ ] Replace all threshold checks with interval containment
- [ ] Update error amplification to use interval arithmetic
- [ ] Maintain `fInverse()` public API

#### Day 5: Testing
- [ ] Run all existing fInverse() tests
- [ ] Add new interval-based tests
- [ ] Test with rational arithmetic
- [ ] Verify performance is acceptable

### 3.5 Phase 5: Advanced Features (Week 5)

#### Day 1-2: Range Detection
- [ ] Update `findOmegaPowerOrdinal` to use intervals
- [ ] Update `findHigherPowerOrdinal` to use intervals
- [ ] Update WTower range detection

#### Day 3-4: Polish and Optimization
- [ ] Profile performance
- [ ] Optimize hot paths if needed
- [ ] Add caching for computed intervals
- [ ] Optimize interval width management

#### Day 5: Final Testing
- [ ] Run full test suite
- [ ] Test edge cases
- [ ] Performance regression testing
- [ ] Documentation review

### 3.6 Phase 6: Migration and Deployment (Week 6)

#### Day 1-2: Backward Compatibility
- [ ] Ensure all public APIs unchanged
- [ ] Test with existing client code
- [ ] Create migration guide for advanced users

#### Day 3-4: Documentation
- [ ] Update COMPREHENSIVE_DOCUMENTATION.md
- [ ] Update API_REFERENCE.md
- [ ] Create INTERVAL_ARITHMETIC_GUIDE.md
- [ ] Create NUMERIC_TYPES_GUIDE.md

#### Day 5: Deployment
- [ ] Create release notes
- [ ] Update version numbers
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Part 4: Detailed Design Decisions

### 4.1 Interval Width Management

**Challenge:** Intervals naturally grow wider with each operation. Need strategy to manage this.

**Solution:**
```javascript
// Strategy 1: Periodic refinement
function fInverseInterval(xInterval, params, depth = 0) {
    // Every few recursion levels, refine the interval
    if (depth % 3 === 0 && depth > 0) {
        // Narrow interval by recomputing with tighter bounds
        xInterval = refineInterval(xInterval, params);
    }
    // ... continue computation
}

// Strategy 2: Adaptive precision
function adaptiveIntervalComputation(x, params, targetWidth) {
    let currentWidth = targetWidth * 2;
    let interval = Interval.fromThreshold(x, currentWidth);
    
    while (interval.width().greaterThan(targetWidth)) {
        currentWidth = currentWidth / 2;
        interval = Interval.fromThreshold(x, currentWidth);
        // Try computation and see if result is precise enough
    }
}
```

### 4.2 Type Coercion Strategy

**Challenge:** Public APIs should accept numbers, but internal code needs NumericValues.

**Solution:**
```javascript
// Automatic conversion wrapper
function ensureNumericValue(value, targetType) {
    if (value instanceof NumericValue) {
        if (value.getType() === targetType) {
            return value;
        }
        return value.convertTo(targetType);
    }
    
    // Convert plain number
    if (typeof value === 'number') {
        if (targetType === 'double') {
            return DoubleNumericValue.fromNumber(value);
        } else if (targetType === 'rational') {
            return RationalNumericValue.fromNumber(value);
        }
    }
    
    throw new TypeError(`Cannot convert ${typeof value} to ${targetType}`);
}

// Public API with automatic conversion
export function fInverse(x, params = DEFAULT_F_PARAMS, threshold = 1e-14) {
    // Convert inputs to match params numeric type
    const targetType = params.getNumericType();
    const xValue = ensureNumericValue(x, targetType);
    const thresholdValue = ensureNumericValue(threshold, targetType);
    
    // Create interval and call internal function
    const xInterval = Interval.fromThreshold(xValue, thresholdValue);
    return fInverseInterval(xInterval, params);
}
```

### 4.3 Memoization with Intervals

**Challenge:** Intervals make memoization keys more complex.

**Solution:**
```javascript
// Memo key includes interval bounds
function generateMemoKey(alphaRep, xInterval, params) {
    const ordinalKey = generateOrdinalMemoKey(alphaRep);
    const intervalKey = `[${xInterval.lower.toString()},${xInterval.upper.toString()}]`;
    const paramsKey = generateParamsKey(params);
    return `${ordinalKey}|${intervalKey}|${paramsKey}`;
}

// Smart caching: cache by interval center, retrieve if query interval is within cached interval
const memo = new Map();

function memoizedComputation(key, intervalIn, computeFn) {
    if (memo.has(key)) {
        const cached = memo.get(key);
        // Check if cached interval contains our query interval
        if (cached.interval.containsInterval(intervalIn)) {
            return cached.result;
        }
    }
    
    const result = computeFn(intervalIn);
    memo.set(key, { interval: intervalIn, result });
    return result;
}
```

### 4.4 Error Handling

**New error types:**
```javascript
export class IntervalError extends Error {
    constructor(message, interval) {
        super(message);
        this.name = 'IntervalError';
        this.interval = interval;
    }
}

export class NumericTypeError extends Error {
    constructor(message, expectedType, actualType) {
        super(message);
        this.name = 'NumericTypeError';
        this.expectedType = expectedType;
        this.actualType = actualType;
    }
}

export class PrecisionError extends Error {
    constructor(message, requiredPrecision, achievedPrecision) {
        super(message);
        this.name = 'PrecisionError';
        this.requiredPrecision = requiredPrecision;
        this.achievedPrecision = achievedPrecision;
    }
}
```

---

## Part 5: Testing Strategy

### 5.1 Unit Tests

#### Numeric Types
```javascript
describe('DoubleNumericValue', () => {
    test('basic arithmetic', () => {
        const a = DoubleNumericValue.fromNumber(0.5);
        const b = DoubleNumericValue.fromNumber(0.3);
        expect(a.add(b).toNumber()).toBeCloseTo(0.8);
    });
    
    test('comparison', () => {
        const a = DoubleNumericValue.fromNumber(0.5);
        const b = DoubleNumericValue.fromNumber(0.3);
        expect(a.compare(b)).toBe(1);
    });
});

describe('RationalNumericValue', () => {
    test('exact arithmetic', () => {
        const a = RationalNumericValue.fromIntegers(1, 3); // 1/3
        const b = RationalNumericValue.fromIntegers(1, 6); // 1/6
        const sum = a.add(b); // Should be 1/2
        expect(sum.numerator).toBe(1n);
        expect(sum.denominator).toBe(2n);
    });
});
```

#### Intervals
```javascript
describe('Interval', () => {
    test('arithmetic operations', () => {
        const ctx = DoubleContext;
        const i1 = new Interval(ctx.fromNumber(1), ctx.fromNumber(2));
        const i2 = new Interval(ctx.fromNumber(3), ctx.fromNumber(4));
        const sum = i1.add(i2);
        expect(sum.lower.toNumber()).toBe(4);
        expect(sum.upper.toNumber()).toBe(6);
    });
    
    test('containment', () => {
        const ctx = DoubleContext;
        const interval = new Interval(ctx.fromNumber(1), ctx.fromNumber(3));
        expect(interval.contains(ctx.fromNumber(2))).toBe(true);
        expect(interval.contains(ctx.fromNumber(4))).toBe(false);
    });
});
```

### 5.2 Integration Tests

```javascript
describe('f() with intervals', () => {
    test('f(ω) with double precision', () => {
        const params = DEFAULT_F_PARAMS;
        const omega = { type: 'pow', k: 1n };
        const result = f(omega, params);
        expect(result.toNumber()).toBeCloseTo(1.0);
    });
    
    test('f(ω) with rational precision', () => {
        const params = DEFAULT_F_PARAMS_RATIONAL;
        const omega = { type: 'pow', k: 1n };
        const result = f(omega, params);
        expect(result).toBeInstanceOf(RationalNumericValue);
        expect(result.toNumber()).toBeCloseTo(1.0);
    });
});

describe('fInverse() with intervals', () => {
    test('round-trip: f(fInverse(x)) ≈ x', () => {
        const params = DEFAULT_F_PARAMS;
        const x = 0.5;
        const alpha = fInverse(x, params);
        const xRoundTrip = f(alpha, params);
        expect(xRoundTrip.toNumber()).toBeCloseTo(x, 10);
    });
});
```

### 5.3 Performance Tests

```javascript
describe('Performance regression', () => {
    test('f() performance with doubles', () => {
        const params = DEFAULT_F_PARAMS;
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            f({ type: 'pow', k: BigInt(i % 100) }, params);
        }
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
    
    test('fInverse() performance with doubles', () => {
        const params = DEFAULT_F_PARAMS;
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            fInverse(0.5 + i * 0.001, params);
        }
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });
});
```

---

## Part 6: Migration Guide for Existing Code

### 6.1 For Library Users (No Changes Required)

**Good news:** Public APIs remain unchanged!

```javascript
// This code continues to work exactly as before
import { f, fInverse, DEFAULT_F_PARAMS } from './ordinal_mapping.js';

const omega = { type: 'pow', k: 1n };
const fOmega = f(omega, DEFAULT_F_PARAMS); // Returns number (via toNumber())

const alpha = fInverse(0.5, DEFAULT_F_PARAMS, 1e-14); // Works as before
```

### 6.2 For Advanced Users (Optional Enhancements)

**Use intervals directly:**
```javascript
import { fInterval, fInverseInterval, Interval, DoubleContext } from './ordinal_mapping.js';

// Create interval with explicit bounds
const xInterval = new Interval(
    DoubleContext.fromNumber(0.49),
    DoubleContext.fromNumber(0.51)
);

// Get result as interval
const alphaResult = fInverseInterval(xInterval, DEFAULT_F_PARAMS);
// alphaResult is an ordinal representation

// Compute f() and get result as interval
const fResult = fInterval(alphaResult, DEFAULT_F_PARAMS);
// fResult is an Interval showing the computed range
```

**Use rational arithmetic:**
```javascript
import { DEFAULT_F_PARAMS_RATIONAL } from './ordinal_mapping.js';

// All computations now use exact rational arithmetic
const alpha = fInverse(0.5, DEFAULT_F_PARAMS_RATIONAL, 1e-14);
// Internal computations are exact (no rounding errors)
```

### 6.3 For Internal Code

**Before:**
```javascript
function someHelperFunction(x, params, threshold) {
    if (Math.abs(x - params.precomputed[5]) < threshold) {
        return { type: 'epsilon', index: 0n };
    }
    // ...
}
```

**After:**
```javascript
function someHelperFunctionInterval(xInterval, params) {
    if (xInterval.contains(params.precomputed[5])) {
        return { type: 'epsilon', index: 0n };
    }
    // ...
}

// Wrapper for backward compatibility
function someHelperFunction(x, params, threshold) {
    const xInterval = Interval.fromThreshold(x, threshold);
    return someHelperFunctionInterval(xInterval, params);
}
```

---

## Part 7: Future Extensions

### 7.1 Additional Numeric Types

After the refactor, adding new numeric types is straightforward:

**BigFloat (arbitrary precision):**
```javascript
import { NumericValue } from './NumericValue.js';
import bigfloat from 'bigfloat'; // hypothetical library

export class BigFloatNumericValue extends NumericValue {
    constructor(value, precision = 100) {
        super();
        this._value = bigfloat(value, precision);
        this._precision = precision;
    }
    
    // Implement all abstract methods...
}
```

**Complex numbers (for future extensions):**
```javascript
export class ComplexNumericValue extends NumericValue {
    constructor(real, imag) {
        super();
        this._real = real; // Another NumericValue
        this._imag = imag; // Another NumericValue
    }
    
    // Implement all abstract methods...
}
```

### 7.2 Interval Refinement Strategies

```javascript
// Adaptive intervals that split when too wide
class AdaptiveInterval extends Interval {
    refine(targetWidth) {
        if (this.width().greaterThan(targetWidth)) {
            const mid = this.center();
            const halfWidth = targetWidth.divide(DoubleNumericValue.fromNumber(2));
            return new Interval(mid.subtract(halfWidth), mid.add(halfWidth));
        }
        return this;
    }
}

// Multi-interval arithmetic (handle discontinuities)
class IntervalSet {
    constructor(intervals) {
        this.intervals = intervals; // Array of Interval
    }
    
    union(other) { /* ... */ }
    intersection(other) { /* ... */ }
    // Operations that preserve set structure
}
```

### 7.3 Performance Optimizations

```javascript
// Lazy evaluation for intervals
class LazyInterval extends Interval {
    constructor(lowerFn, upperFn) {
        this._lowerFn = lowerFn;
        this._upperFn = upperFn;
        this._lower = null;
        this._upper = null;
    }
    
    get lower() {
        if (this._lower === null) {
            this._lower = this._lowerFn();
        }
        return this._lower;
    }
    
    get upper() {
        if (this._upper === null) {
            this._upper = this._upperFn();
        }
        return this._upper;
    }
}
```

---

## Part 8: Success Criteria

### 8.1 Functional Requirements

- [ ] All existing tests pass
- [ ] Public API unchanged (backward compatible)
- [ ] Interval arithmetic produces correct results
- [ ] Rational arithmetic produces exact results
- [ ] Type conversions work correctly
- [ ] Error handling is comprehensive

### 8.2 Performance Requirements

- [ ] Double-precision performance within 20% of current
- [ ] Rational-precision performance acceptable for typical usage
- [ ] No memory leaks
- [ ] Reasonable memory usage for rational arithmetic

### 8.3 Code Quality Requirements

- [ ] All code properly documented
- [ ] Type system enforced throughout
- [ ] Unit test coverage > 90%
- [ ] Integration tests cover all major paths
- [ ] No linter warnings
- [ ] TypeScript compilation clean

### 8.4 Documentation Requirements

- [ ] API documentation updated
- [ ] Migration guide complete
- [ ] Design decisions documented
- [ ] Examples provided
- [ ] Performance characteristics documented

---

## Part 9: Risk Assessment

### 9.1 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rational arithmetic too slow | Medium | Provide hybrid mode: rational for critical paths, double elsewhere |
| Interval width explosion | Medium | Implement adaptive refinement, periodic recomputation |
| Backward compatibility breaks | High | Extensive testing, maintain public API wrapper layer |
| Memory usage with rationals | Low | Monitor and optimize GCD computation, add size limits |
| Rounding errors in conversions | Medium | Document precision loss, provide exact/approximate modes |

### 9.2 Schedule Risks

| Risk | Mitigation |
|------|------------|
| Underestimated complexity | Break into smaller phases, prototype first |
| Testing takes longer | Start testing early, automated test generation |
| Integration issues | Frequent integration, incremental rollout |

---

## Part 10: Open Questions

1. **Interval width management:** What's the optimal strategy for preventing excessive growth?
   - Suggested: Hybrid approach with periodic refinement and adaptive precision

2. **Type selection:** Should users explicitly choose numeric type, or auto-detect?
   - Suggested: Explicit choice via params, auto-conversion for compatibility

3. **Performance vs precision trade-off:** What's acceptable slowdown for rational arithmetic?
   - Suggested: 10x slowdown acceptable for exact computations, provide both options

4. **Memoization strategy:** Cache intervals or just values?
   - Suggested: Cache intervals with containment checks for retrieval

5. **Error handling philosophy:** Fail fast or return uncertain results?
   - Suggested: Return intervals showing uncertainty, fail only on true errors

---

## Conclusion

This refactor will significantly improve the mathematical rigor and flexibility of the ordinal mapping system while maintaining backward compatibility. The interval-based approach makes uncertainty explicit and composable, while the typed numeric values enable exact arithmetic when needed.

**Key benefits:**
- ✅ More mathematically precise
- ✅ Explicit uncertainty handling
- ✅ Support for exact rational arithmetic
- ✅ Extensible to future numeric types
- ✅ Backward compatible public API
- ✅ Better error propagation

**Estimated effort:** 4-6 weeks for complete implementation and testing

**Recommended start:** Implement Phases 1-2 (numeric types and intervals) first as a proof of concept, then proceed with full refactor based on lessons learned.

---

**Document Version:** 1.0  
**Author:** GitHub Copilot & Meni Rosenfeld  
**Date:** October 19, 2025  
**Status:** Planning Phase
