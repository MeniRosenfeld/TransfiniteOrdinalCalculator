# LLM Agent Documentation for Transfinite Ordinal Calculator

This document provides a detailed technical overview of the Transfinite Ordinal Calculator project. It is intended for consumption by LLM agents to facilitate efficient and accurate development in future sessions.

## 1. Project Overview

This project implements a calculator for transfinite ordinal arithmetic. It currently supports two main representations for ordinals:

1.  **Cantor Normal Form (CNF):** Used for ordinals up to (but not including) ε₀.
2.  **Epsilon Normal Form (ENF):** A more advanced representation that supports ordinals up to the Feferman-Schütte ordinal Γ₀.

The primary goal is to parse ordinal expressions from strings, perform arithmetic operations (comparison, addition, multiplication, etc.), and display the results in the chosen format. The project includes a main UI (`index.html`) and a dedicated test suite for ENF (`ordinal_enf_test.html`).

## 2. File Structure

-   `index.html`: The main application entry point and user interface.
-   `script.js`: Handles UI logic, event listeners, and orchestrates calls between the UI and the ordinal logic.
-   `ordinal_types.js`: Defines `CNFOrdinal`, `EpsilonOrdinal`, `WTowerOrdinal`, and `OperationTracer`.
-   `ordinal_enf.js`: Defines the `ENFOrdinal` and `ENFTerm` classes; core ENF arithmetic and rank-based exponentiation.
-   `ordinal_parser.js`: `OrdinalParser(input, tracer, options?)`, where `options.coerceToCNF` (default true) controls whether ENF results are coerced to CNF at parse time.
-   `ordinal_enf_test.html`: ENF test suite; uses `{ coerceToCNF: false }` when parsing expected ENF strings.
-   `ordinal_enf_expected_results.js`: Expected strings for comprehensive pairwise tests.
-   `ordinal_addition.js`, `ordinal_multiplication.js`, `ordinal_exponentiation.js`, `ordinal_tetration.js`: Dispatch and arithmetic.
-   `ordinal_comparison.js`, `ordinal_auxiliary_ops.js` (helpers: `exponentPredecessor`, `divideByOmega`, `findLargestEpsilonIndexLessThan`).
-   `ordinal_mapping.js`, `ordinal_mapping_inverse.js` for f/fInverse.

## 3. Core Data Structures & Concepts

### `CNFOrdinal` (`ordinal_types.js`)

-   **Represents:** An ordinal in Cantor Normal Form: `w^a1*c1 + w^a2*c2 + ... + n`.
-   **Structure:** An array of terms `[{ exponent: Ordinal, coefficient: BigInt }]`.
-   **Usage:** It's the foundational representation for ordinals `< ε₀` and is critically used as the type for the omega exponent (`w^k`) within an `ENFTerm`.

### `ENFOrdinal` (`ordinal_enf.js`)

-   **Represents:** An ordinal as a sum of `ENFTerm`s.
-   **Structure:** An array of `ENFTerm` objects, sorted in descending order.

### `ENFTerm` (`ordinal_enf.js`)

-   **Represents:** A single multiplicative term in ENF: `(e_a1^k1 * e_a2^k2 * ...) * w^k * m`.
-   **Structure:**
    1.  `epsilonFactors`: An array of plain objects `{base: ENFOrdinal, exp: ENFOrdinal}`.
    2.  `omegaExponent`: A `CNFOrdinal` instance. **This exponent must not itself contain any epsilon numbers.**
    3.  `coefficient`: A JavaScript `BigInt`.

### `OperationTracer` (`ordinal_types.js`)

-   **Purpose:** A crucial utility to prevent infinitely long or excessively complex computations. It is a simple counter with a budget.
-   **Mechanism:** Key computational steps (e.g., a recursive call, a loop iteration) must call `tracer.consume()`. If the internal counter exceeds the budget, it throws an error, halting the operation.
-   **Usage:** **A valid `OperationTracer` instance is a required argument for the `OrdinalParser` constructor** and other complex functions.

## 4. Best Practices & Pitfalls to Avoid

This section documents guidelines based on bugs and misunderstandings encountered during development. Adhering to these will prevent repeating past mistakes.

### **Guideline 1: `OrdinalParser` and `OperationTracer` Usage**

-   **The Bug:** We repeatedly encountered `OrdinalParser requires a valid OperationTracer instance` and `Operation budget exceeded` errors.
-   **The Cause:**
    1.  Incorrectly calling `new OrdinalParser(tracer)` instead of `new OrdinalParser(string, tracer)`.
    2.  Passing a single `OperationTracer` instance to a function that performs thousands of parsing operations in a loop. The tracer's budget was exhausted by the cumulative operations.
-   **The Rule:**
    -   The constructor signature is `new OrdinalParser(inputString, operationTracer, options?)`.
    -   Use `{ coerceToCNF: false }` for ENF-only test parsing.
    -   When performing many independent parsing operations (e.g., inside a loop in a test), **create a `new OperationTracer(budget)` for each individual parse operation.** This ensures every parse has a fresh budget.
    -   The `OperationTracer` class does **not** have a `.reset()` method.

    ```javascript
    // CORRECT USAGE IN A LOOP
    for (const str of manyStrings) {
        // Create a new tracer for each parse.
        const ord = new OrdinalParser(str, new OperationTracer(10000)).parse(); 
        // ... do something with ord
    }
    ```

### **Guideline 2: Distinguish Static Properties from Methods**

-   **The Bug:** Errors like `CNFOrdinal.omega is not a function`.
-   **The Cause:** `CNFOrdinal.ZERO`, `CNFOrdinal.ONE`, and `CNFOrdinal.OMEGA` are static *getters* (properties), not static methods.
-   **The Rule:** Access common ordinal values as properties.
    -   **Correct:** `CNFOrdinal.ZERO`
    -   **Incorrect:** `CNFOrdinal.zero()`

### **Guideline 3: Object Immutability and Cloning**

-   **The Bug:** An error `clone is not a function` occurred during `ENFTerm.multiply`.
-   **The Cause:** The `epsilonFactors` array within an `ENFTerm` stores plain JavaScript objects (`{base, exp}`), not instances of a class with a `.clone()` method. The code was attempting to clone the container object instead of its contents.
-   **The Rule:** When you need to duplicate `epsilonFactors`, you must perform a deep copy manually by cloning the `base` and `exp` properties within each object. Always be mindful of whether you are handling a class instance or a plain object.

### **Guideline 4: Nuances of Ordinal Arithmetic**

-   **The Bug:** `(w+1)*(w+1)` incorrectly resulted in `w^2+w` instead of `w^2+w+1`.
-   **The Cause:** The multiplication logic did not correctly distinguish between multiplying by a finite ordinal (where full right-distributivity applies) and a limit ordinal (where only the leading term of the left operand is multiplied).
-   **The Rule:** Ordinal arithmetic is not commutative and often not left-distributive. When implementing arithmetic operations, pay extremely close attention to the mathematical definitions. Specifically for multiplication `A * B`, the logic depends on the properties of `B` (e.g., is it finite, is it a limit ordinal?).

### **Guideline 5: ENF vs CNF dispatch and comparison**

-   **Dispatch:**
    - Addition/multiplication: prefer CNF when both operands are epsilon-free; otherwise use ENF.
    - Exponentiation: prefer ENF; fall back to CNF only for pure-CNF, epsilon-free operands.
    - Tetration: CNF; explicit error strings for epsilon-base cases.
-   **Comparison:**
    - CNF comparer converts ENF input to CNF (not vice versa) to avoid recursion in mapping and tests.
    - ENF comparer converts inputs to ENF, then compares by: epsilon factors (rank-first), ω-exponent (CNF), coefficient.

### **Guideline 6: Coefficients in ENF multiplication**

-   Coefficients can be absorbed into the merged leading factor during multiplication. Do not naively multiply coefficients across terms unless mathematically justified. Keep the existing semantics in `ENFTerm.multiply`.

### **Guideline 5: String Representation and Parentheses**

-   **The Bug:** `e_0^2` was incorrectly rendered as `e_0^(2)`.
-   **The Cause:** The `toString()` logic was too aggressive in adding parentheses around exponents.
-   **The Rule:** In an expression `a^b`, the exponent `b` should only be enclosed in parentheses if it is a sum of multiple terms (e.g., `w+1`) or a product of multiple factors (e.g., `e_0*w`). An exponent is exempt from parentheses only when it is represented by a single `ENFTerm` which itself contains only a single factor (e.g., `2`, `w`, `w^2`, `e_0`, `e_1^e_0`).

By consulting this document, future agents should be better equipped to understand the project's architecture and avoid these common pitfalls. AI agents MUST read this document before making changes.

## 5. Maintaining This Document

This is a living document. Future agents working on this project are instructed to update it with any new information that could be beneficial for subsequent sessions. This includes, but is not limited to:

-   Newly discovered bugs and their root causes.
-   New guidelines or best practices established during development.
-   Clarifications or additions to the documentation of core data structures.
-   Information about new features or architectural changes.
