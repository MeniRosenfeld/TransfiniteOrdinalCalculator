# API Reference

**Version:** 2.0  
**Last Updated:** October 16, 2025

Complete API documentation for the Transfinite Ordinal Calculator.

---

## Table of Contents

1. [Core Classes](#core-classes)
   - [OrdinalBase](#ordinalbase) - Abstract base class
   - [FiniteOrdinal](#finiteordinal) - Natural numbers
   - [OmegaOrdinal](#omegaordinal) - The ordinal ω
   - [CNFOrdinal](#cnfordinal) - Cantor Normal Form
   - [ENFOrdinal](#enfordinal) - Epsilon Normal Form
   - [EpsilonNumber](#epsilonnumber) - Epsilon numbers ε_k
   - [EpsilonZero](#epsilonzero) - The ordinal ε₀
   - [ZetaZero](#zetazero) - The ordinal ζ₀
   - [Other Ordinal Types](#other-ordinal-types)

2. [Operations System](#operations-system)
   - [Operations](#operations) - Main operations coordinator
   - [RuleEngine](#ruleengine) - Rule-based execution
   - [Operation Rules](#operation-rules) - Addition, Multiplication, etc.

3. [Conversion System](#conversion-system)
   - [ConversionEngine](#conversionengine) - Conversion execution
   - [ConversionRegistry](#conversionregistry) - Type registration

4. [Parser and Calculator](#parser-and-calculator)
   - [SimpleParser](#simpleparser) - Expression parser
   - [SimpleCalculator](#simplecalculator) - Calculator logic

5. [Utility Classes](#utility-classes)
   - [OperationTracer](#operationtracer) - Budget tracking
   - [RenderingComponents](#renderingcomponents) - HTML rendering

6. [Type Definitions](#type-definitions)
   - [ParseResult](#parseresult) - Parser output types
   - [Token Types](#token-types) - Lexer tokens

---

## Core Classes

### OrdinalBase

**File:** `src/types/OrdinalBase.ts`

Abstract base class defining the contract that all ordinal types must implement.

#### Constructor

```typescript
constructor()
```

Initializes the ordinal brand symbol and consumes 1 operation from the global tracer.

#### Classification Methods

##### isZero()

```typescript
abstract isZero(): boolean
```

Returns true if this ordinal equals zero (α = 0).

- **Returns:** `boolean` - True if zero, false otherwise
- **Complexity:** O(1)
- **Examples:**
  ```typescript
  new FiniteOrdinal(0).isZero()  // true
  new FiniteOrdinal(5).isZero()  // false
  new OmegaOrdinal().isZero()    // false
  ```

##### isFinite()

```typescript
abstract isFinite(): boolean
```

Returns true if this ordinal is a finite natural number (α < ω).

- **Returns:** `boolean` - True if finite, false otherwise
- **Complexity:** O(1)
- **Examples:**
  ```typescript
  new FiniteOrdinal(42).isFinite()  // true
  new OmegaOrdinal().isFinite()     // false
  ```

##### isOne()

```typescript
abstract isOne(): boolean
```

Returns true if this ordinal equals 1.

- **Returns:** `boolean` - True if one, false otherwise
- **Complexity:** O(1)

##### isOmega()

```typescript
abstract isOmega(): boolean
```

Returns true if this ordinal equals ω (omega).

- **Returns:** `boolean` - True if omega, false otherwise
- **Complexity:** O(1)

##### isEpsilonNumber()

```typescript
abstract isEpsilonNumber(): boolean
```

Returns true if this ordinal is an epsilon number (ε_α).

- **Returns:** `boolean` - True if epsilon number, false otherwise
- **Complexity:** O(1)

##### isLessThanEpsilon0()

```typescript
abstract isLessThanEpsilon0(): boolean
```

Returns true if this ordinal is less than ε₀.

- **Returns:** `boolean` - True if α < ε₀, false otherwise
- **Complexity:** O(1)

##### isLessThanZeta0()

```typescript
isLessThanZeta0(): boolean
```

Returns true if this ordinal is less than ζ₀.

- **Returns:** `boolean` - True if α < ζ₀ (default: true for all implemented types)
- **Complexity:** O(1)

##### isBasic()

```typescript
abstract isBasic(): boolean
```

Returns true if this is a basic ordinal (0, 1, ω, ε₀, ε₁, etc.).

- **Returns:** `boolean` - True if basic, false otherwise
- **Complexity:** O(1)

##### isLimit()

```typescript
abstract isLimit(): boolean
```

Returns true if this is a limit ordinal (has no immediate predecessor).

- **Returns:** `boolean` - True if limit, false otherwise
- **Complexity:** O(1)
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).isLimit()  // false (successor)
  new OmegaOrdinal().isLimit()    // true
  ```

##### isTower()

```typescript
abstract isTower(): boolean
```

Returns true if this ordinal is a tower (repeated exponentiation).

- **Returns:** `boolean` - True if tower, false otherwise
- **Complexity:** O(1)

##### isWellFormed()

```typescript
isWellFormed(): boolean
```

Returns true if the internal structure is valid.

- **Returns:** `boolean` - True if valid, false if corrupted
- **Complexity:** O(n) where n is number of components
- **Note:** Default implementation returns true; subclasses override for validation

#### Value Access Methods

##### getFiniteBigInt()

```typescript
abstract getFiniteBigInt(): bigint
```

Returns the finite value as a BigInt.

- **Returns:** `bigint` - The finite value
- **Throws:** `Error` if ordinal is not finite
- **Precondition:** `isFinite()` must return true
- **Complexity:** O(1) for simple types, O(n) for sum types
- **Examples:**
  ```typescript
  new FiniteOrdinal(42).getFiniteBigInt()  // 42n
  new OmegaOrdinal().getFiniteBigInt()     // throws Error
  ```

##### getFinitePart()

```typescript
abstract getFinitePart(): bigint
```

Returns the finite additive part of this ordinal (0n if none).

- **Returns:** `bigint` - The finite part (0n if no finite part)
- **Complexity:** O(1)
- **Examples:**
  ```typescript
  new FiniteOrdinal(42).getFinitePart()    // 42n
  new OmegaOrdinal().getFinitePart()       // 0n
  (ω+5).getFinitePart()                    // 5n
  ```

#### Structural Analysis Methods

##### rank()

```typescript
abstract rank(): OrdinalBase
```

Returns the rank (critical ordinal) of this ordinal.

- **Returns:** `OrdinalBase` - The rank
- **Complexity:** O(1) for most types
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).rank()   // 1
  (ω^5).rank()                  // ω
  (ε₁^ε₀).rank()                // ε₁
  ```

##### nextRank()

```typescript
abstract nextRank(): OrdinalBase
```

Returns the next rank in the hierarchy.

- **Returns:** `OrdinalBase` - The next higher rank
- **Complexity:** O(1) to O(log n)
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).nextRank()  // ω
  (ω^ω).nextRank()                 // ε₀
  ```

##### rankTier()

```typescript
rankTier(): number
```

Coarse rank tier classification.

- **Returns:** `number` - Tier (0=zero, 1=finite, 2=<ε₀, 3=<ζ₀, 4=≥ζ₀)
- **Complexity:** O(1)

##### log()

```typescript
abstract log(): OrdinalBase
```

Returns the "logarithm" of this ordinal.

- **Returns:** `OrdinalBase` - The logarithm
- **Throws:** `Error` if ordinal is zero
- **Complexity:** O(1)
- **Examples:**
  ```typescript
  (ω^5).log()   // 5
  (ω^ω).log()   // ω
  ```

##### logStar()

```typescript
abstract logStar(): bigint
```

Returns the iterated logarithm.

- **Returns:** `bigint` - Iteration count (-1n for zero)
- **Complexity:** O(height) where height is nesting depth
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).logStar()  // 0n
  new OmegaOrdinal().logStar()    // 1n
  (ω^ω).logStar()                 // 2n
  ```

##### complexity()

```typescript
abstract complexity(): number
```

Returns the structural complexity measure.

- **Returns:** `number` - Complexity value
- **Complexity:** O(n) where n is number of components
- **Note:** Higher values indicate more nested structure

##### epsilonIndex()

```typescript
abstract epsilonIndex(): OrdinalBase
```

Returns the index for epsilon numbers.

- **Returns:** `OrdinalBase` - The index α for ε_α
- **Throws:** `Error` if not an epsilon number
- **Precondition:** `isEpsilonNumber()` must return true
- **Complexity:** O(1)

#### Representation Methods

##### toString()

```typescript
abstract toString(): string
```

Returns canonical string representation (ASCII notation).

- **Returns:** `string` - Parseable representation
- **Complexity:** O(n) where n is number of terms
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).toString()   // "5"
  new OmegaOrdinal().toString()     // "w"
  (ε₀).toString()                   // "e_0"
  ```

##### toGraphicalHTML()

```typescript
abstract toGraphicalHTML(): string
```

Returns HTML with mathematical notation.

- **Returns:** `string` - HTML with Unicode symbols and formatting
- **Complexity:** O(n) where n is number of terms
- **Examples:**
  ```typescript
  (ω^2).toGraphicalHTML()      // "ω<sup>2</sup>"
  (ε₀).toGraphicalHTML()       // "ε<sub>0</sub>"
  ```

##### toDisplayString()

```typescript
toDisplayString(options?: any): string
```

Returns formatted string (currently delegates to `toString()`).

- **Parameters:**
  - `options` - Display options (currently unused)
- **Returns:** `string` - Formatted representation
- **Complexity:** O(n)

##### toStringWithType()

```typescript
toStringWithType(): string
```

Returns string with type name included.

- **Returns:** `string` - Format: "[TypeName: value]"
- **Complexity:** O(n)
- **Examples:**
  ```typescript
  new CNFOrdinal([...]).toStringWithType()  // "[CNFOrdinal: w^w+5]"
  ```

#### Utility Methods

##### needsParenthesesAsExponent()

```typescript
abstract needsParenthesesAsExponent(): boolean
```

Returns true if parentheses needed when used as exponent.

- **Returns:** `boolean` - True if parentheses needed
- **Complexity:** O(1)
- **Examples:**
  ```typescript
  (ω+1).needsParenthesesAsExponent()  // true → ω^(ω+1)
  ω.needsParenthesesAsExponent()      // false → ω^ω
  ```

##### clone()

```typescript
abstract clone(): OrdinalBase
```

Creates a deep copy of this ordinal.

- **Returns:** `OrdinalBase` - New equal ordinal
- **Complexity:** O(n) where n is number of components

##### leftPredecessor()

```typescript
leftPredecessor(): OrdinalBase
```

Returns the left predecessor (α - 1).

- **Returns:** `OrdinalBase` - The predecessor
- **Throws:** `Error` if ordinal is zero
- **Complexity:** O(1) for finite, O(n) for limit
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).leftPredecessor()   // 4
  new OmegaOrdinal().leftPredecessor()     // ω (no predecessor)
  ```

##### successor()

```typescript
successor(): OrdinalBase
```

Returns the successor (α + 1).

- **Returns:** `OrdinalBase` - The successor
- **Complexity:** Depends on addition implementation
- **Examples:**
  ```typescript
  new FiniteOrdinal(5).successor()  // 6
  new OmegaOrdinal().successor()    // ω + 1
  ```

##### tunnel()

```typescript
tunnel(): OrdinalBase
```

Creates deeply nested epsilon structures (ε_ε_ε_...).

- **Returns:** `OrdinalBase` - Nested epsilon structure
- **Throws:** `Error` if not finite
- **Complexity:** O(n) for small n ≤ 10, O(1) for large n
- **Examples:**
  ```typescript
  new FiniteOrdinal(0).tunnel()  // 0
  new FiniteOrdinal(1).tunnel()  // ε₀
  new FiniteOrdinal(2).tunnel()  // ε_ε₀
  ```

##### simplify()

```typescript
abstract simplify(complexityBudget: number, skipMyOwnMPTFCheck?: boolean): 
    { simplifiedOrdinal: OrdinalBase; remainingBudget: number }
```

Attempts to simplify within complexity budget.

- **Parameters:**
  - `complexityBudget` - Maximum complexity for attempts
  - `skipMyOwnMPTFCheck` - Internal optimization flag (default: false)
- **Returns:** Object with simplified ordinal and remaining budget
- **Complexity:** O(complexityBudget)

#### Arithmetic Operations

##### equals()

```typescript
equals(other: OrdinalBase): boolean
```

Tests equality (α = β).

- **Parameters:**
  - `other` - Ordinal to compare with
- **Returns:** `boolean` - True if equal
- **Complexity:** Varies by type (typically O(n))

##### compareTo()

```typescript
compareTo(other: OrdinalBase): number
```

Compares ordinals (α ? β).

- **Parameters:**
  - `other` - Ordinal to compare with
- **Returns:** `number` - -1 if α < β, 0 if α = β, 1 if α > β
- **Complexity:** Varies by type (typically O(n))

##### add()

```typescript
add(other: OrdinalBase): OrdinalBase
```

Adds ordinals (α + β). Non-commutative!

- **Parameters:**
  - `other` - Ordinal to add
- **Returns:** `OrdinalBase` - The sum
- **Complexity:** Varies by type (typically O(n+m))
- **Note:** 1 + ω = ω, but ω + 1 ≠ ω

##### multiply()

```typescript
multiply(other: OrdinalBase): OrdinalBase
```

Multiplies ordinals (α * β). Non-commutative!

- **Parameters:**
  - `other` - Ordinal to multiply by
- **Returns:** `OrdinalBase` - The product
- **Complexity:** Varies by type (typically O(n*m))
- **Note:** 2 * ω = ω, but ω * 2 ≠ ω

##### power()

```typescript
power(other: OrdinalBase): OrdinalBase
```

Raises to power (α ^ β).

- **Parameters:**
  - `other` - The exponent
- **Returns:** `OrdinalBase` - The power
- **Complexity:** Varies significantly
- **Note:** 2^ω = ω, ω^2 = ω*ω

##### tetrate()

```typescript
tetrate(other: OrdinalBase): OrdinalBase
```

Tetrates (repeated exponentiation): α ^^ β.

- **Parameters:**
  - `other` - The tetration height
- **Returns:** `OrdinalBase` - The result
- **Complexity:** Varies significantly; may create towers
- **Note:** ω^^∞ = ε₀

#### Type Conversion

##### convertTo()

```typescript
abstract convertTo(targetTypeName: string): OrdinalBase
```

Converts to specified target type.

- **Parameters:**
  - `targetTypeName` - Target type name (e.g., 'CNF', 'ENF')
- **Returns:** `OrdinalBase` - Converted ordinal
- **Throws:** `Error` if direct conversion unsupported
- **Complexity:** Varies by conversion
- **Note:** Use ConversionEngine for indirect conversions

##### toFFormat()

```typescript
abstract toFFormat(): any
```

Converts to F-format for ordinal-to-real mapping.

- **Returns:** F-format representation
- **Complexity:** O(n)

#### Static Methods

##### getTypeName()

```typescript
static getTypeName(): string
```

Returns the type name for conversion registry.

- **Returns:** `string` - Type name
- **Throws:** `Error` if not implemented by subclass

##### getDirectConversions()

```typescript
static getDirectConversions(): string[]
```

Returns list of directly convertible type names.

- **Returns:** `string[]` - Array of type names
- **Throws:** `Error` if not implemented by subclass

##### isOrdinal()

```typescript
isOrdinal(): boolean
```

Verifies this is a valid ordinal.

- **Returns:** `boolean` - Always true for proper instances
- **Complexity:** O(1)

---

## Operations System

### Operations

**File:** `src/operations/Operations.ts`

Main coordinator for all arithmetic operations. Provides unified API and delegates to specialized RuleEngines.

#### Methods

##### add()

```typescript
add(a: OrdinalBase, b: OrdinalBase): OrdinalBase
```

Performs ordinal addition (α + β).

- **Parameters:**
  - `a` - First operand
  - `b` - Second operand
- **Returns:** `OrdinalBase` - The sum
- **Note:** Non-commutative operation

##### multiply()

```typescript
multiply(a: OrdinalBase, b: OrdinalBase): OrdinalBase
```

Performs ordinal multiplication (α * β).

- **Parameters:**
  - `a` - First operand
  - `b` - Second operand
- **Returns:** `OrdinalBase` - The product
- **Note:** Non-commutative operation

##### power()

```typescript
power(a: OrdinalBase, b: OrdinalBase): OrdinalBase
```

Performs ordinal exponentiation (α ^ β).

- **Parameters:**
  - `a` - Base
  - `b` - Exponent
- **Returns:** `OrdinalBase` - The power

##### tetrate()

```typescript
tetrate(a: OrdinalBase, b: OrdinalBase): OrdinalBase
```

Performs ordinal tetration (α ^^ β).

- **Parameters:**
  - `a` - Base
  - `b` - Height
- **Returns:** `OrdinalBase` - The tetration result

##### compare()

```typescript
compare(a: OrdinalBase, b: OrdinalBase): number
```

Compares two ordinals.

- **Parameters:**
  - `a` - First ordinal
  - `b` - Second ordinal
- **Returns:** `number` - -1, 0, or 1

##### convert()

```typescript
convert(ordinal: OrdinalBase, targetType: string): OrdinalBase
```

Converts ordinal to target type.

- **Parameters:**
  - `ordinal` - The ordinal to convert
  - `targetType` - Target type name
- **Returns:** `OrdinalBase` - Converted ordinal

---

### RuleEngine

**File:** `src/operations/RuleEngine.ts`

Engine for executing rule-based binary operations using pattern matching.

See detailed documentation in the JSDoc comments above.

---

## Utility Classes

### OperationTracer

**File:** `src/OperationTracer.ts`

Global operation budget tracking system for preventing infinite loops.

See detailed documentation in the JSDoc comments above.

#### Key Static Methods

- `setGlobalTracer(budget)` - Initialize global tracer
- `consume(amount)` - Consume from budget
- `reset(budget)` - Reset with new budget
- `getCount()` - Get current consumption
- `isInitialized()` - Check if initialized

---

## Getting Started

### Basic Usage

```typescript
import { OperationTracer } from './OperationTracer.js';
import { FiniteOrdinal } from './types/FiniteOrdinal.js';
import { OmegaOrdinal } from './types/OmegaOrdinal.js';
import { getOperations } from './operations/OperationsSingleton.js';

// Initialize global tracer
OperationTracer.setGlobalTracer(1000000);

// Create ordinals
const five = new FiniteOrdinal(5);
const omega = new OmegaOrdinal();

// Perform operations
const ops = getOperations();
const sum = ops.add(omega, five);  // ω + 5
const product = ops.multiply(omega, five);  // ω * 5

console.log(sum.toString());  // "w+5"
console.log(product.toString());  // "w*5"
```

### Parser Usage

```typescript
import { SimpleParser } from './SimpleParser.js';

const parser = new SimpleParser("w^w+5");
const ordinal = parser.parse();
console.log(ordinal.toGraphicalHTML());  // ω<sup>ω</sup>+5
```

---

## See Also

- [COMPREHENSIVE_DOCUMENTATION.md](COMPREHENSIVE_DOCUMENTATION.md) - Complete technical documentation
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflow guide
- [AGENT_DOCUMENTATION.md](AGENT_DOCUMENTATION.md) - Common pitfalls and guidelines
- [README.md](README.md) - Project overview and quick start

---

**Note:** This is a living document. As new features are added, this reference will be updated to reflect the current API.
