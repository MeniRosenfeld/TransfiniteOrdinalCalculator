# LLM Agent Development Notes

This document provides practical development guidance and lessons learned for working with the Transfinite Ordinal Calculator. It supplements the main `COMPREHENSIVE_DOCUMENTATION.md` with implementation-specific tips and common pitfalls.

**Note**: For complete project documentation, architecture overview, and mathematical background, see `COMPREHENSIVE_DOCUMENTATION.md`.

---

## Best Practices & Common Pitfalls

This section documents critical guidelines based on bugs and issues encountered during development. Following these will prevent repeating past mistakes.

### **Guideline 1: Global `OperationTracer` Usage**

**The Revolution**: The project now uses a global static tracer system instead of per-object tracers.

**The New Architecture**:
1. **Single Global Tracer**: `OperationTracer` is now managed via static methods
2. **No Per-Object Tracers**: Ordinal constructors no longer take tracer parameters
3. **Frontend Responsibility**: Applications must initialize and manage the global budget

**The Rules**:
- **Initialize First**: Always call `OperationTracer.setGlobalTracer(budget)` before any ordinal operations
- **Reset Per Calculation**: Use `OperationTracer.reset(budget)` for fresh calculations
- **No Tracer Parameters**: Ordinal constructors and operations no longer take tracers
- **Automatic Consumption**: All operations automatically consume from global budget

```javascript
// CORRECT USAGE WITH GLOBAL TRACER
OperationTracer.setGlobalTracer(100000);  // Initialize global budget
const parser = new SimpleParser(inputString); // No tracer parameter
const result = parser.parse();

// For loops, reset budget as needed
for (const str of manyStrings) {
    OperationTracer.reset(10000);  // Fresh budget for each parse
    const ord = new SimpleParser(str).parse(); 
}
```

**Performance Benefits**:
- **No Cloning Overhead**: Ordinals are truly immutable and stateless
- **Linear Complexity**: Operations scale O(n) instead of O(n²)
- **Simplified Code**: No tracer parameter passing throughout codebase

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

### **Guideline 8: Immutability and Object Sharing**

**The Architecture**: With the global tracer system, ordinals are truly immutable and stateless.

**The Benefits**:
- **Safe Object Sharing**: Multiple references to the same ordinal are safe
- **No Cloning Needed**: Operations can share objects without mutation concerns
- **Performance**: Linear complexity instead of quadratic cloning overhead

**The Rules**:
- **Never Mutate**: Operations must create new objects, never modify existing ones
- **Clone When Building**: Use `.clone()` when constructing new ordinals from existing parts
- **Share Safely**: Direct object references are safe due to immutability

### **Guideline 9: Error Categorization in Tests**

**The Issue**: Different types of errors need different handling in test suites.

**The Categories**:
- **Failed**: Arithmetic law violations or incorrect results
- **Aborted**: Resource limitations (budget exceeded, recursion limit, stack overflow)
- **Error**: Unexpected exceptions or system failures

**The Detection**:
```javascript
if (error.message && (
    error.message.includes('budget exceeded') ||      // Our operation budget
    error.message.includes('too much recursion') ||   // Firefox recursion limit  
    error.message.includes('Maximum call stack')      // Chrome/Safari recursion limit
)) {
    return { status: 'aborted', reason: error.message };
} else {
    return { status: 'failed', reason: error.message };
}
```

**The Rule**: Distinguish between computational limits (abort) vs mathematical incorrectness (fail).

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
