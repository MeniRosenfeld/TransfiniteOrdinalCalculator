# LLM Agent Development Notes

This document provides practical development guidance and lessons learned for working with the Transfinite Ordinal Calculator. It supplements the main `COMPREHENSIVE_DOCUMENTATION.md` with implementation-specific tips and common pitfalls.

**Note**: For complete project documentation, architecture overview, and mathematical background, see `COMPREHENSIVE_DOCUMENTATION.md`.

---

## Best Practices & Common Pitfalls

This section documents critical guidelines based on bugs and issues encountered during development. Following these will prevent repeating past mistakes.

### **Guideline 1: `OrdinalParser` and `OperationTracer` Usage**

**The Bug**: Repeated `OrdinalParser requires a valid OperationTracer instance` and `Operation budget exceeded` errors.

**The Causes**:
1. Incorrectly calling `new OrdinalParser(tracer)` instead of `new OrdinalParser(string, tracer)`
2. Passing a single `OperationTracer` instance to functions performing thousands of operations, exhausting the budget

**The Rules**:
- Constructor signature: `new OrdinalParser(inputString, operationTracer, options?)`
- Use `{ coerceToCNF: false }` for ENF-only parsing
- **Critical**: Create a `new OperationTracer(budget)` for each independent operation in loops
- `OperationTracer` has **no** `.reset()` method

```javascript
// CORRECT USAGE IN A LOOP
for (const str of manyStrings) {
    // Create fresh tracer for each parse
    const ord = new OrdinalParser(str, new OperationTracer(10000)).parse(); 
    // ... use ord
}
```

### **Guideline 2: Static Properties vs Methods**

**The Bug**: `CNFOrdinal.omega is not a function`

**The Cause**: `CNFOrdinal.ZERO`, `CNFOrdinal.ONE`, `CNFOrdinal.OMEGA` are static *getters* (properties), not methods.

**The Rule**: Access common ordinal values as properties:
- **Correct**: `CNFOrdinal.ZERO`
- **Incorrect**: `CNFOrdinal.zero()`

### **Guideline 3: Object Immutability and Cloning**

**The Bug**: `clone is not a function` during `ENFTerm.multiply`

**The Cause**: `epsilonFactors` arrays contain plain objects `{base, exp}`, not class instances with `.clone()` methods.

**The Rule**: When duplicating `epsilonFactors`, manually deep-copy by cloning `base` and `exp` properties. Always distinguish between class instances and plain objects.

### **Guideline 4: Ordinal Arithmetic Nuances**

**The Bug**: `(w+1)*(w+1)` incorrectly resulted in `w^2+w` instead of `w^2+w+1`

**The Cause**: Multiplication logic didn't distinguish between finite ordinals (full right-distributivity) and limit ordinals (only leading term multiplied).

**The Rule**: Ordinal arithmetic is non-commutative and often non-distributive. For multiplication `A * B`, logic depends on properties of `B` (finite vs limit ordinal).

### **Guideline 5: ENF vs CNF Dispatch**

**Dispatch Rules**:
- Addition/multiplication: prefer CNF when both operands are epsilon-free; otherwise ENF
- Exponentiation: prefer ENF; fall back to CNF only for pure-CNF, epsilon-free operands
- Tetration: CNF; explicit errors for epsilon-base cases; return `WTowerOrdinal` for base ω, finite heights n≥2

**Comparison Rules**:
- CNF comparer converts ENF input to CNF (not vice versa) to avoid recursion
- ENF comparer converts to ENF, then compares by: epsilon factors (rank-first), ω-exponent (CNF), coefficient

### **Guideline 6: String Representation and Parentheses**

**The Bug**: `e_0^2` incorrectly rendered as `e_0^(2)`

**The Cause**: Over-aggressive parentheses in `toString()` logic

**The Rule**: In `a^b`, add parentheses around `b` only when necessary. For CNF exponents: no parentheses when `b` is finite, `w`, or single omega power term (`w^a`).

### **Guideline 7: Left vs Right Arithmetic**

**The Bug**: `2^(w^w*w)` gave `w^w^w` instead of correct `w^w^(w+1)`

**The Cause**: Using right-subtraction (`exponentPredecessor()`) instead of left-subtraction in ordinal division

**Mathematical Foundation**:
- **Addition non-commutative**: `1 + ω = ω` but `ω + 1 = ω + 1`
- **Left-subtraction valid**: If `a ≥ b`, then `∃!c: b + c = a`
- **Right-subtraction invalid**: No general `c` such that `c + b = a`
- **Left-division valid**: `∃! q,r: b·q + r = a` with `r < b`

**The Rule**: Always use left-arithmetic operations in ordinal division. For infinite omega exponents, use identity; for finite ones, use `exponentPredecessor()`.

---

## Current Implementation Status

### ✅ **Completed (New Architecture)**
- Core ENF types: `ENFOrdinal`, `ENFTerm`, `ENFFactor`
- All unary properties: `isZero`, `isFinite`, `isEpsilonNumber`, etc.
- `ENFOrdinal.fromCNF` static method
- ENF fallback rules in multiplication and exponentiation
- Comparison rules with `compareENF` function
- Test page migration to new architecture
- Tracer accounting framework with loop-scale consumption
- Stringification standardized on `toString()`

### ⚠️ **Partially Complete**
- ENF multiplication logic (basic placeholder exists)
- ENF exponentiation logic (throws for infinite exponents)
- ENF addition logic (exists but may need refinement)

### ❌ **Still Needed**
- Complete ENF arithmetic implementations
- `ENFTerm.multiply()` method
- Full ENF → CNF conversion path
- Legacy test page migration

### **Migration Notes**
- New architecture uses `types/`, `operations/`, `conversions/` directories
- Binary operations implemented via rule engines, not in type classes
- Conversion-first rule checking rather than ad-hoc type tests
- Immutable operations with proper tracer threading

---

## Quick Reference

### **Constructor Patterns**
```javascript
// Correct parser usage
const parser = new OrdinalParser(inputString, tracer, options);
const ordinal = parser.parse();

// Fresh tracers for loops
for (const input of inputs) {
    const tracer = new OperationTracer(10000);
    const result = new OrdinalParser(input, tracer).parse();
}
```

### **Static Access**
```javascript
// Correct
const zero = CNFOrdinal.ZERO;
const omega = CNFOrdinal.OMEGA;

// Incorrect
const zero = CNFOrdinal.zero(); // Error!
```

### **Rule Engine Usage**
```javascript
// Operations delegate to rule engines
const result = OPERATIONS.add(a, b);
const comparison = OPERATIONS.compare(a, b);
```

This document should be consulted alongside `COMPREHENSIVE_DOCUMENTATION.md` for complete understanding of the project.
