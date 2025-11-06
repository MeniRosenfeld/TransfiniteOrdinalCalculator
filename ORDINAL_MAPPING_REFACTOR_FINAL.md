# Ordinal Mapping Refactor - Implementation Summary - October 21, 2025

## Executive Summary

This document provides the finalized design and implementation roadmap for refactoring the ordinal mapping system with interval-based computation and strongly-typed numeric values.

---

## Design Principles (Finalized)

### 1. Type Safety via TypeScript Generics
- All numeric types use generic parameter `T extends NumericValue<T>`
- Operations only accept same-type operands (compile-time enforced)
- No automatic type conversion - explicit only
- Zero runtime overhead from generics

### 2. Interval-Based Computation
- Replace threshold comparisons with interval containment
- Intervals propagate uncertainty naturally through arithmetic
- Division by intervals containing zero returns (-∞, +∞)
- Infinite intervals handled explicitly in computations

### 3. Strongly-Typed Numeric Values
- Abstract `NumericValue<T>` base class
- `DoubleNumericValue` for IEEE 754 doubles (fast, ~15 digits precision)
- `RationalNumericValue` for exact BigInt-based arithmetic
- Both support infinity via native/zero-denominator representations

### 4. Simplified Implementation
- Custom rational implementation (~200 lines) - no external libraries
- Simple infinity arithmetic (not full IEEE 754)
- Straightforward algorithms - optimize later if needed
- Focus on correctness first

---

## Type System Architecture

### Core Types

```typescript
// Abstract base with self-referential generic
abstract class NumericValue<T extends NumericValue<T>> {
    abstract add(other: T): T;
    abstract subtract(other: T): T;
    abstract multiply(other: T): T;
    abstract divide(other: T): T;
    // ... all operations type-safe
}

// Concrete implementations
class DoubleNumericValue extends NumericValue<DoubleNumericValue> {
    // Uses JavaScript number (Infinity supported natively)
}

class RationalNumericValue extends NumericValue<RationalNumericValue> {
    // Uses BigInt numerator/denominator
    // Infinity: numerator=sign, denominator=0n
}

// Intervals enforce same-type bounds
class Interval<T extends NumericValue<T>> {
    constructor(lower: T, upper: T) { /* type-safe */ }
    add(other: Interval<T>): Interval<T>
    divide(other: Interval<T>): Interval<T>  // Returns [-∞,+∞] if other contains 0
}

// Parameters all same type
class FParams<T extends NumericValue<T>> {
    readonly scaleAdd: T;
    readonly scaleMult: T;
    // ... all scales guaranteed same type
}
```

### Type Consistency Enforcement

**At Compile Time:**
```typescript
const d1 = DoubleNumericValue.fromNumber(5);
const d2 = DoubleNumericValue.fromNumber(3);
const r1 = RationalNumericValue.fromIntegers(5, 1);

d1.add(d2);  // ✅ OK - same type
d1.add(r1);  // ❌ Compile error - type mismatch

const interval1 = new Interval(d1, d2);  // ✅ OK
const interval2 = new Interval(d1, r1);  // ❌ Compile error
```

---

## Infinity Support

### DoubleNumericValue
```typescript
static readonly POSITIVE_INFINITY = new DoubleNumericValue(Infinity);
static readonly NEGATIVE_INFINITY = new DoubleNumericValue(-Infinity);

// Arithmetic uses JavaScript's native infinity handling
```

### RationalNumericValue
```typescript
static readonly POSITIVE_INFINITY = new RationalNumericValue(1n, 0n);
static readonly NEGATIVE_INFINITY = new RationalNumericValue(-1n, 0n);

// Operations handle zero denominator specially:
// - Comparison: infinity is greater/less than all finite values
// - Addition: infinity + anything = infinity
// - Multiplication: infinity * non-zero = infinity (with sign)
// - Division: anything / infinity = 0, infinity / anything finite = infinity
```

### Interval Division by Zero

```typescript
divide(other: Interval<T>): Interval<T> {
    if (other.contains(ZERO)) {
        // Division by interval containing zero
        // Returns infinite interval: (-∞, +∞)
        return new Interval(NEGATIVE_INFINITY, POSITIVE_INFINITY);
    }
    
    // Normal division (multiply by reciprocal)
    const one = ONE;
    const recipLower = one.divide(other.upper);
    const recipUpper = one.divide(other.lower);
    return this.multiply(new Interval(recipLower, recipUpper));
}
```

**Behavior:**
1. **Numerator non-zero, denominator contains zero:** Returns (-∞, +∞)
2. **Both contain zero (0/0):** Also returns (-∞, +∞)
   - Semantically different but same representation works
   - May explore different handling later
3. **Infinite interval propagates:** Further arithmetic uses full range
4. **Containment tests:** Infinite interval contains any value

---

## Important Corrections

### Ordinal Coefficients are BigInt

Throughout the codebase, ordinal coefficients must be `bigint`, not `number`:

```typescript
// ❌ WRONG
function findRemainder(k: OrdinalRep, m: number, ...) { }

// ✅ CORRECT
function findRemainder(k: OrdinalRep, m: bigint, ...) { }

// Example ordinal representation
type OrdinalSum = {
    type: 'sum',
    beta: OrdinalRep,
    c: bigint,      // Coefficient is BigInt
    delta: OrdinalRep
};
```

**Conversion when needed:**
```typescript
// From BigInt to numeric type for f() computation
const cValue = params.ctx.fromInt(coefficient);  // BigInt -> NumericValue

// From number to BigInt for ordinal construction
const cBigInt = BigInt(Math.floor(numberValue));
```

---

## NumericContext (Lightweight, Optional)

```typescript
class NumericContext<T extends NumericValue<T>> {
    constructor(private valueType: new (...args: any[]) => T) {}
    
    // === Constants ===
    get ZERO(): T;
    get ONE(): T;
    get POSITIVE_INFINITY(): T;
    get NEGATIVE_INFINITY(): T;
    
    // === Factory Methods ===
    fromNumber(n: number): T;
    
    // === Interval Factories ===
    interval(lower: T, upper: T): Interval<T>;
    intervalFromValue(value: T): Interval<T>;
    intervalFromThreshold(center: T, threshold: T): Interval<T>;
    
    // Optional convenience: operations delegate to instance methods
    add(a: T, b: T): T { return a.add(b); }
}

// Standard contexts
export const DoubleContext = new NumericContext(DoubleNumericValue);
export const RationalContext = new NumericContext(RationalNumericValue);
```

**Usage Pattern:**
```typescript
// Using context (convenient)
const ctx = DoubleContext;
const x = ctx.fromNumber(5);
const interval = ctx.intervalFromThreshold(x, ctx.fromNumber(0.1));

// Direct usage (no context needed)
const x = DoubleNumericValue.fromNumber(5);
const interval = new Interval(
    x.subtract(DoubleNumericValue.fromNumber(0.1)),
    x.add(DoubleNumericValue.fromNumber(0.1))
);
```

---

## Implementation Phases

### Phase 1: Core Numeric Types (Days 1-3)

**Files to create:**
```
src/ordinal_mapping/
├── NumericValue.ts              [Abstract base with generic T]
├── DoubleNumericValue.ts        [Concrete: extends NumericValue<DoubleNumericValue>]
└── NumericValue.test.ts         [Unit tests for Double]
```

**Deliverables:**
- [ ] `NumericValue<T>` abstract class with all operations
- [ ] `DoubleNumericValue` implementation with infinity
- [ ] Comprehensive tests: arithmetic, comparison, infinity cases
- [ ] Static constants: ZERO, ONE, TWO, POSITIVE_INFINITY, NEGATIVE_INFINITY

### Phase 2: Rational Arithmetic (Days 4-6)

**Files to create:**
```
src/ordinal_mapping/
├── RationalNumericValue.ts      [Concrete: BigInt-based with zero-denom infinity]
└── RationalNumericValue.test.ts [Unit tests including infinity]
```

**Deliverables:**
- [ ] `RationalNumericValue` with BigInt numerator/denominator
- [ ] Zero-denominator infinity representation
- [ ] GCD normalization
- [ ] Tests: exact arithmetic, infinity, edge cases (large numbers)
- [ ] Conversion tests: to/from doubles

### Phase 3: Interval Arithmetic (Days 7-9)

**Files to create:**
```
src/ordinal_mapping/
├── Interval.ts                  [Generic interval with type-safe bounds]
└── Interval.test.ts             [Tests for all operations]
```

**Deliverables:**
- [ ] `Interval<T>` generic class
- [ ] All arithmetic operations (add, subtract, multiply, divide)
- [ ] Division by zero → infinite interval
- [ ] Containment and comparison operations
- [ ] Tests with both Double and Rational types
- [ ] Infinite interval propagation tests

### Phase 4: NumericContext & FParams (Days 10-11)

**Files to create:**
```
src/ordinal_mapping/
├── NumericContext.ts            [Optional convenience wrapper]
└── FParams.ts                   [Refactored with generic T]
```

**Deliverables:**
- [ ] Lightweight `NumericContext<T>` with factories
- [ ] Generic `FParams<T>` with type-safe precomputed values
- [ ] Standard contexts: `DoubleContext`, `RationalContext`
- [ ] Tests: ensure type consistency throughout

### Phase 5: Refactor f() Function (Days 12-14)

**Files to modify:**
```
src/ordinal_mapping.js → src/ordinal_mapping/mapping.ts
```

**Deliverables:**
- [ ] Internal `fInterval()` function using `Interval<T>`
- [ ] All arithmetic uses `NumericValue` operations
- [ ] Public `f()` maintains backward compatibility (returns number)
- [ ] Update memoization for interval-based computation
- [ ] Tests: verify results match original implementation
- [ ] Fix: ensure coefficients are BigInt throughout

### Phase 6: Refactor fInverse() (Days 15-18)

**Files to modify:**
```
src/ordinal_mapping_inverse.js → src/ordinal_mapping/mappingInverse.ts
```

**Deliverables:**
- [ ] `fInverseInterval()` internal function
- [ ] Refactor helper functions:
  - [ ] `findFiniteOrdinalInterval()`
  - [ ] `findJInterval()`
  - [ ] `findMInterval()`
  - [ ] `findCoefficientHigherInterval()`
  - [ ] `findRemainderHigherInterval()`
- [ ] Replace threshold checks with interval containment
- [ ] Handle infinite interval propagation
- [ ] Public `fInverse()` maintains compatibility
- [ ] Tests: round-trip, precision, edge cases
- [ ] Fix: coefficients are BigInt

### Phase 7: Integration & Testing (Days 19-21)

**Deliverables:**
- [ ] End-to-end tests with both Double and Rational
- [ ] Performance benchmarks vs current implementation
- [ ] Update all existing tests to pass
- [ ] Verify UI/slider integration works
- [ ] Update exports in `main.ts`

### Phase 8: Documentation (Days 22-23)

**Files to update:**
```
COMPREHENSIVE_DOCUMENTATION.md
API_REFERENCE.md
INTERVAL_ARITHMETIC_GUIDE.md     [New]
NUMERIC_TYPES_GUIDE.md           [New]
```

**Deliverables:**
- [ ] Complete API documentation
- [ ] Usage examples for intervals
- [ ] Guide for choosing numeric type
- [ ] Migration notes for advanced users
- [ ] Performance characteristics

---

## File Organization (Final)

```
src/ordinal_mapping/
├── NumericValue.ts              # Abstract base class
├── DoubleNumericValue.ts        # IEEE 754 implementation
├── RationalNumericValue.ts      # BigInt-based implementation
├── Interval.ts                  # Generic interval arithmetic
├── NumericContext.ts            # Optional convenience wrapper
├── FParams.ts                   # Typed parameter sets
├── mapping.ts                   # f(α) forward mapping
├── mappingInverse.ts            # f⁻¹(x) inverse mapping
├── types.ts                     # Shared TypeScript types
└── __tests__/                   # All test files
    ├── NumericValue.test.ts
    ├── RationalNumericValue.test.ts
    ├── Interval.test.ts
    ├── mapping.test.ts
    └── mappingInverse.test.ts
```

**Old files (deprecated after migration):**
```
src/
├── ordinal_mapping.js           # → ordinal_mapping/mapping.ts
├── ordinal_mapping_inverse.js   # → ordinal_mapping/mappingInverse.ts
└── operations/NumericContexts.js # → ordinal_mapping/NumericContext.ts
```

---

## Code Style Guidelines

### TypeScript Conventions

```typescript
// Use explicit types for public APIs
export function fInverse<T extends NumericValue<T>>(
    x: T,
    params: FParams<T>,
    threshold: T
): OrdinalRepresentation {
    // Implementation
}

// Use type inference for internals
const sum = a.add(b);  // Type inferred as T

// Prefer readonly for immutability
class Interval<T extends NumericValue<T>> {
    private readonly _lower: T;
    private readonly _upper: T;
}

// Document complex algorithms
/**
 * Finds the finite ordinal n such that f(n) ≈ x
 * 
 * Uses binary search with interval arithmetic to handle uncertainty.
 * Returns interval containing the result.
 * 
 * @param xInterval - Input interval
 * @param scale - Scale parameter from FParams
 * @returns Finite ordinal as BigInt
 */
function findFiniteOrdinalInterval<T extends NumericValue<T>>(
    xInterval: Interval<T>,
    scale: T
): bigint {
    // Implementation
}
```

### Testing Conventions

```typescript
describe('DoubleNumericValue', () => {
    describe('arithmetic operations', () => {
        it('should add two values correctly', () => {
            const a = DoubleNumericValue.fromNumber(0.5);
            const b = DoubleNumericValue.fromNumber(0.3);
            const result = a.add(b);
            expect(result.toNumber()).toBeCloseTo(0.8);
        });
    });
    
    describe('infinity handling', () => {
        it('should handle addition with infinity', () => {
            const finite = DoubleNumericValue.fromNumber(5);
            const inf = DoubleNumericValue.POSITIVE_INFINITY;
            const result = inf.add(finite);
            expect(result.isPositiveInfinity()).toBe(true);
        });
    });
});
```

---

## Success Criteria

### Must Have
- ✅ All existing tests pass after migration
- ✅ TypeScript compilation clean (strict mode)
- ✅ Type safety enforced (no type mismatches possible)
- ✅ Both Double and Rational implementations work
- ✅ Interval arithmetic correct (including infinity cases)
- ✅ Public API backward compatible
- ✅ Round-trip: f(fInverse(x)) ≈ x within precision
- ✅ Coefficients are BigInt throughout

### Performance Targets
- Double-precision within 20% of current performance
- Rational-precision acceptable for typical usage (within 10x)
- No memory leaks
- Reasonable memory usage for rationals

### Code Quality
- Unit test coverage > 90%
- All public functions documented
- Complex algorithms explained
- No linter warnings
- TypeScript strict mode enabled

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation Strategy |
|------|-------------------|
| Generic type complexity | Start simple, add complexity incrementally |
| Interval width explosion | Monitor in tests, implement refinement if needed |
| Rational arithmetic performance | Profile early, optimize hot paths if necessary |
| Backward compatibility breaks | Maintain public API wrappers, extensive testing |
| Infinity edge cases | Comprehensive test suite, document behavior |

### Schedule Risks

| Risk | Mitigation |
|------|-----------|
| TypeScript learning curve | Prototype first, reference documentation |
| Unexpected complexity | Build in buffer time, prioritize core features |
| Integration issues | Frequent integration, incremental migration |

---

## Next Steps

1. **Review and approve this design** (Oct 21)
2. **Set up project structure** (Oct 21-22)
   - Create `src/ordinal_mapping/` directory
   - Set up test framework for new files
   - Configure TypeScript for strict mode
3. **Begin Phase 1 implementation** (Oct 22-24)
   - Implement `NumericValue<T>` abstract class
   - Implement `DoubleNumericValue`
   - Write comprehensive tests

---

**Document Version:** 3.0  
**Status:** Finalized Design - Ready for Implementation  
**Last Updated:** October 21, 2025  
**Authors:** GitHub Copilot & Meni Rosenfeld
