# simplify_test.html ES6 Migration

## Summary
Migrated `tests/simplify_test.html` to use ES6 module system, but **this test is currently non-functional** because it depends on old legacy code that no longer exists.

## Changes Made

### Before
- **12 individual script tags** loading legacy ordinal calculator files:
  - ordinal_types.js
  - ordinal_comparison.js
  - ordinal_auxiliary_ops.js
  - ordinal_addition.js
  - ordinal_multiplication.js
  - ordinal_exponentiation.js
  - ordinal_tetration.js
  - ordinal_parser.js
  - ordinal_calculator.js
  - ordinal_mapping.js
  - ordinal_mapping_inverse.js
  - script.js

### After
- **Single ES6 module import**: `<script type="module" src="/src/main.js"></script>`
- Module initialization with 200ms delay
- Global verification for SimpleParser and OPERATIONS
- OPERATIONS singleton initialization

## Current Status: ⚠️ NON-FUNCTIONAL

### Why This Test Doesn't Work
This test file was written for the **old legacy ordinal calculator system** which used:
- `calculateOrdinalCNF()` function (no longer exists)
- `ordinal_calculator.js` (no longer exists)
- Legacy ordinal types and operations (replaced by new architecture)
- F-format mapping functions (ordinal_mapping.js, ordinal_mapping_inverse.js)
- Old parser system (replaced by SimpleParser)

The new architecture uses:
- **SimpleParser** for parsing expressions
- **OPERATIONS singleton** for arithmetic operations
- **New type system** (CNFOrdinal, ENFOrdinal, EpsilonNumber, etc.)
- **Different API** for calculations and simplification

### Key Missing Functions
```javascript
// OLD SYSTEM (no longer available):
calculateOrdinalCNF(expr)  // Returns { ordinalObject, cnfString, error }
f()                         // F-format mapping
fInverse()                  // Inverse F-format mapping
convertOrdinalInstanceToFFormat()
convertFFormatToOrdinalInstance()
```

## Migration Strategy

### Option 1: Rewrite Tests for New Architecture
The test would need to be completely rewritten to use:
```javascript
// NEW SYSTEM:
const parser = new SimpleParser(expr);
const result = parser.parse();
if (result.type === 'ordinal') {
    const ordinal = result.value;
    const simplified = ordinal.simplify(1000);
    const cnfString = simplified.toDisplayString({ format: 'CNF' });
}
```

### Option 2: Delete This Test
Since the old system is deprecated, this test could be removed entirely.

### Option 3: Keep As-Is (Current)
Leave the file in place but non-functional, as a reference for potential future work.

## Test Structure (For Reference)

The test file includes:
1. **Test Statistics Tracking**: `testStats` object for SIMPLIFY tests
2. **Helper Functions**:
   - `toCnfString()` - Convert ordinal to CNF string
   - `logToPage()` - Log messages to page
   - `addDetailElement()` - Add test details
3. **Test Functions**:
   - `testOrdinalCalc()` - Test CNF calculations (uses old system)
   - `testSimplify()` - Test simplification
   - `calculateAndSimplify()` - Calculate and simplify expressions (uses `calculateOrdinalCNF`)
4. **Main Test Runner**: `runAllTestsAndRender()` - Executes all tests
5. **Test Cases Array**: `testCases` - Array of test inputs and expected outputs

## What Would Need to Change

To make this test functional with the new architecture:

1. **Replace `calculateOrdinalCNF`** with SimpleParser:
   ```javascript
   // Old:
   const result = calculateOrdinalCNF(expr);
   
   // New:
   const parser = new SimpleParser(expr);
   const result = parser.parse();
   if (result.type === 'ordinal') {
       // handle ordinal
   } else if (result.type === 'error') {
       // handle error
   }
   ```

2. **Update ordinal operations** to use new API:
   ```javascript
   // Old:
   ordinal.simplify(1000)
   
   // New:
   // Simplify method signature may have changed
   ordinal.simplify(1000)  // Or use OPERATIONS.simplify()
   ```

3. **Remove F-format mapping** tests (if no longer relevant)

4. **Update CNF string generation**:
   ```javascript
   // Already implemented in helper:
   ordinal.toDisplayString({ format: 'CNF' })
   ```

5. **Rewrite all test cases** to use new expression syntax (if changed)

## Recommendation

**This test should be either rewritten or removed.** Since the old ordinal calculator system has been completely replaced by the new architecture, keeping this test in a non-functional state provides no value except as historical reference.

If simplification testing is needed, create a new test file:
- `tests/new_simplify_test.html` - Tests using SimpleParser and new architecture
- Use the same UI structure but updated test logic
- Test modern simplification algorithms with new ordinal types

## Pattern Established

This migration follows the ES6 module pattern, but note that unlike the other migrated test files (which are functional), this one requires additional work beyond module migration to become operational.

Functional test files migrated:
- ✅ arithmetic_laws_test.html
- ✅ conversion_debug.html
- ✅ enhanced_parser_test.html
- ✅ finverse_debug.html
- ✅ immutability_test.html
- ✅ is_well_formed_test.html

Non-functional (needs rewrite):
- ⚠️ simplify_test.html (depends on deleted legacy code)
