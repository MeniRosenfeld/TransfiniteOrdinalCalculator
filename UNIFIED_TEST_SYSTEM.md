# Unified Test System

The arithmetic laws test suite now features a revolutionary unified test system that leverages the enhanced parser with variable substitution to dramatically simplify test creation and maintenance.

## Overview

Instead of writing separate code blocks for each arithmetic law, tests are now defined declaratively as simple objects and processed by a unified test runner.

## Test Definition Format

```javascript
{
    name: "Test Name",           // Descriptive name for the test
    lhs: "expression",           // Left-hand side expression with variables a, b, c
    rhs: "expression",           // Right-hand side expression with variables a, b, c
    condition: "expression"      // Optional condition (test runs only if true)
}
```

## Examples

### Basic Equality Tests
```javascript
{
    name: "Associativity of Addition",
    lhs: "(a+b)+c",
    rhs: "a+(b+c)"
}
```

### Conditional Tests
```javascript
{
    name: "Exponentiation Exponent Zero",
    lhs: "a^0",
    rhs: "1",
    condition: "a > 0"  // Only test when a > 0
}
```

### Comparison Tests
```javascript
{
    name: "Addition Monotonicity", 
    lhs: "a+b ? a+c",
    rhs: "b ? c"
}
```

### Advanced Features
```javascript
{
    name: "Successor Properties",
    lhs: "a'",
    rhs: "a+1"
},
{
    name: "Boolean Logic Identity",
    lhs: "a = a", 
    rhs: "true"
},
{
    name: "Exponentiation Power Laws",
    lhs: "a^(b+c)",
    rhs: "a^b*a^c",
    condition: "a > 1"
}
```

## How It Works

1. **Variable Substitution**: For each test triple (a, b, c), the system:
   - Substitutes actual values: `"a+b"` becomes `"w+1"` when a=w, b=1
   - Uses enhanced parser: `"a+b/.{a:=w,b:=1,c:=5}"`

2. **Condition Evaluation**: If a condition is present:
   - Parses and evaluates: `"a > 1/.{a:=w,b:=1,c:=5}"`
   - Skips test if condition is false

3. **Expression Evaluation**: 
   - Parses both LHS and RHS with variable substitution
   - Supports all parser features: ordinals, comparisons, booleans, functions

4. **Result Comparison**:
   - Ordinals: Uses `OPERATIONS.compare()`
   - Booleans: Direct value comparison
   - Comparisons: Compares comparison result values
   - Mixed types: String-based comparison

## Benefits

### Before (Manual Implementation)
```javascript
// Test 1: Associativity of addition
try {
    const ab = OPERATIONS.add(a, b);
    const bc = OPERATIONS.add(b, c);
    const lhs1 = OPERATIONS.add(ab, c);
    const rhs1 = OPERATIONS.add(a, bc);
    const cmp1 = OPERATIONS.compare(lhs1, rhs1);
    if (cmp1 !== 0) {
        return {
            status: 'failed',
            reason: `Addition associativity failed: (${a}+${b})+${c} = ${lhs1} ≠ ${a}+(${b}+${c}) = ${rhs1}`
        };
    }
} catch (error) {
    // Error handling...
}

// Test 2: Associativity of multiplication  
try {
    const lhs2 = OPERATIONS.multiply(OPERATIONS.multiply(a, b), c);
    const rhs2 = OPERATIONS.multiply(a, OPERATIONS.multiply(b, c));
    const cmp2 = OPERATIONS.compare(lhs2, rhs2);
    if (cmp2 !== 0) {
        return {
            status: 'failed', 
            reason: `Multiplication associativity failed: (${a}*${b})*${c} = ${lhs2} ≠ ${a}*(${b}*${c}) = ${rhs2}`
        };
    }
} catch (error) {
    // Error handling...
}
// ... dozens more manual test blocks
```

### After (Unified System)
```javascript
const ARITHMETIC_TESTS = [
    {
        name: "Associativity of Addition",
        lhs: "(a+b)+c", 
        rhs: "a+(b+c)"
    },
    {
        name: "Associativity of Multiplication",
        lhs: "(a*b)*c",
        rhs: "a*(b*c)" 
    },
    {
        name: "Exponentiation Exponent Zero",
        lhs: "a^0",
        rhs: "1",
        condition: "a > 0"
    }
    // Add more tests with just 3-4 lines each!
];

// Single unified test runner handles everything
const results = runUnifiedTests(a, b, c);
```

## Advantages

1. **Dramatic Simplification**: 50+ lines of manual code → 3-4 lines per test
2. **Easy Maintenance**: Tests are pure data, no complex logic to debug
3. **Powerful Expressions**: Full parser support (functions, comparisons, successor, etc.)
4. **Conditional Testing**: Built-in condition evaluation
5. **Consistent Error Handling**: Unified error categorization (failed/aborted)
6. **Enhanced Readability**: Mathematical expressions instead of imperative code
7. **Extensibility**: Adding new tests is trivial

## Current Test Coverage

The unified system now includes:
- **Basic Laws**: Associativity, distributivity, identity elements
- **Monotonicity**: Addition, multiplication, exponentiation
- **Special Cases**: Zero/one behavior, successor properties
- **Advanced Features**: Power laws, tetration, boolean logic
- **Conditional Tests**: Tests that only apply under certain conditions

## Future Extensions

The system can easily be extended to test:
- Commutativity laws (where applicable)
- Advanced ordinal properties
- Function behavior
- Complex mathematical identities
- Edge cases and boundary conditions

This unified test system represents a major advancement in test maintainability and demonstrates the power of the enhanced parser with variable substitution for creating domain-specific languages within the calculator.
