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
-   `ordinal_types.js`: Defines `CNFOrdinal`, `EpsilonOrdinal`, `WTowerOrdinal`, and `OperationTracer`. All ordinal classes are branded with a shared symbol and expose `toDisplayString({ format })`, `toCNFOrdinal()`, and `toENFOrdinal()`. Updates:
    -   `WTowerOrdinal.toCNFOrdinal()` is iterative (no deep recursion). The evaluator preserves `WTowerOrdinal` natively for display; for n>10 it is produced directly.
    -   `WTowerOrdinal.toStringCNF()` always uses `w^^n` (native tower notation) for display.
    -   `EpsilonTowerOrdinal` (new): represents `e_k^^n` with fields `k` (ordinal index: CNF/Epsilon/ENF accepted) and `height` (finite integer). `toDisplayString()` returns `e_k^^n`; `toENFOrdinal()` computes the recursive tower; `toCNFOrdinal()` routes via ENF.
    -   `CNFOrdinal.toStringCNF()` reduces superfluous parentheses for exponents: no parentheses when exponent is finite, `w`, or a single omega power term (`w^a`).
-   `ordinal_enf.js`: Defines the `ENFOrdinal` and `ENFTerm` classes; core ENF arithmetic and rank-based exponentiation. `ENFOrdinal.fromCNF` now accepts `WTowerOrdinal` and `EpsilonTowerOrdinal` by converting them to CNF first.
-   `ordinal_parser.js`: `OrdinalParser(input, tracer, options?)`, where `options.coerceToCNF` (default true) controls whether ENF results are coerced to CNF at parse time.
    -   For ENF-first evaluation, pass `{ coerceToCNF: false }` to keep parsed results in ENF space.
-   `ordinal_enf_test.html`: ENF test suite; uses `{ coerceToCNF: false }` when parsing expected ENF strings.
-   `ordinal_enf_expected_results.js`: Expected strings for comprehensive pairwise tests.
-   `ordinal_addition.js`, `ordinal_multiplication.js`, `ordinal_exponentiation.js`, `ordinal_tetration.js`: Dispatch and arithmetic.
-   `ordinal_ops.js`: Central operation registry exposing `ordinalAdd`, `ordinalMultiply`, `ordinalPower`, `ordinalTetrate`. Currently delegates to existing dispatchers as a non-breaking indirection layer.
-   `ordinal_comparison.js`, `ordinal_auxiliary_ops.js` (helpers: `exponentPredecessor`, `divideByOmega`, `findLargestEpsilonIndexLessThan`).
-   `ordinal_mapping.js`, `ordinal_mapping_inverse.js` for f/fInverse.
    -   Display uses `toDisplayString({ format })` consistently; avoid mixing type-specific string calls in UI. The calculator preserves native towers in ENF mode (`WTowerOrdinal`, `EpsilonTowerOrdinal`) and never forces CNF for numbers ≥ ε₀.

## 3. Core Data Structures & Concepts

### `CNFOrdinal` (`ordinal_types.js`)

-   **Represents:** An ordinal in Cantor Normal Form: `w^a1*c1 + w^a2*c2 + ... + n`.
-   **Structure:** An array of terms `[{ exponent: Ordinal, coefficient: BigInt }]`.
-   **Usage:** Foundational for ordinals `< ε₀` and used as the type for the omega exponent (`w^k`) within an `ENFTerm`. Legacy CNF epsilon interop is guarded behind a feature flag and is being phased out.

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
### Ordinal branding & polymorphic display

-   All ordinal classes carry a shared internal brand (`Symbol.for('TransfiniteOrdinal.OrdinalBrand')`) to enable duck-typed `isOrdinal` checks without a common base class.
-   Use `toDisplayString({ format: 'CNF'|'ENF' })` to render strings, instead of calling `toStringCNF()`/`toString()` directly. This keeps UI/tests decoupled from representation choices.
    -   ENF string parentheses: epsilon indices avoid superfluous parentheses but disambiguate composite indices. Examples:
        *   `(e_e_0)^2` → `e_e_0^2`
        *   `e_(e_0^2)` → `e_(e_0^2)`

### Centralized operation registry

-   Use `ordinal_ops.js` when evolving dispatch policies. It currently forwards to existing dispatchers (`addOrdinals`, `multiplyOrdinals`, `powerOrdinals`, `tetrateOrdinals`).
-   Future changes to multi-dispatch should be implemented here to avoid touching call sites.

### Graphical renderer

-   `ordinal_graphical_renderer.js` now supports `ENFOrdinal` directly and tower policies:
    -   Renders epsilon factors (ε with subscripted ENF base, exponent shown when ≠ 1), ω^k (k as CNF ordinal), and finite coefficient.
    -   Terms are joined by `+`, factors within a term by a centered dot.
    -   ω is rendered using a single `.omega` CSS class. Towers: for n<10, expand as nested superscripts; for n≥10, render `ω↑↑n` inline (arrows slightly larger). New helper `renderOrdinalGraphicalFromString(text)` renders from a canonical string chosen by the caller to keep text/graphics consistent.

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
    - Tetration: CNF; explicit error strings for epsilon-base cases. For base ω and finite heights (n≥2), return `WTowerOrdinal` directly.
    - Note: CNF epsilon support in construction/equality is guarded behind a feature flag and will be disabled when tests/UI migrate fully to ENF for ε-structure.
-   **Comparison:**
    - CNF comparer converts ENF input to CNF (not vice versa) to avoid recursion in mapping and tests.
    - ENF comparer converts inputs to ENF, then compares by: epsilon factors (rank-first), ω-exponent (CNF), coefficient.

### **Guideline 6: Coefficients in ENF multiplication**

-   Coefficients can be absorbed into the merged leading factor during multiplication. Do not naively multiply coefficients across terms unless mathematically justified. Keep the existing semantics in `ENFTerm.multiply`.

### **Guideline 7: String Representation and Parentheses**

-   **The Bug:** `e_0^2` was incorrectly rendered as `e_0^(2)`.
-   **The Cause:** The `toString()` logic was too aggressive in adding parentheses around exponents.
-   **The Rule:** In an expression `a^b`, add parentheses around `b` only when necessary to disambiguate. For CNF exponents, no parentheses when `b` is finite, `w`, or a single omega power term (`w^a`) — allowing chains like `w^w^w^w`.

### **Guideline 8: Left vs Right Arithmetic in Ordinal Operations**

-   **The Bug:** `2^(w^w*w)` gave `w^w^w` instead of the correct `w^w^(w+1)`.
-   **The Cause:** The ω division case in `ENFOrdinal.ordinalDivision()` was using right-subtraction (`exponentPredecessor()`) instead of left-subtraction.
-   **Mathematical Foundation:** 
    -   **Addition is not commutative:** `1 + ω = ω` but `ω + 1 = ω + 1`
    -   **Left-subtraction is valid:** If `a ≥ b`, then `∃!c: b + c = a`. For infinite ordinals, `a - 1 = a`.
    -   **Right-subtraction is invalid:** No general `c` such that `c + b = a`
    -   **Left-division is valid:** `∃! q,r: b·q + r = a` with `r < b`
    -   **Right-division is invalid:** No general `q,r` such that `q·b + r = a`
-   **The Fix:** Modified `ordinalDivision()` to use left-subtraction for ω case: infinite omega exponents remain unchanged (identity), finite ones use `exponentPredecessor()`.
-   **The Rule:** Always use left-arithmetic operations in ordinal division. The epsilon cases were already correct (using `leftPredecessor()`), but the ω case needed fixing.

By consulting this document, future agents should be better equipped to understand the project's architecture and avoid these common pitfalls. AI agents MUST read this document before making changes.

## 6. Migration Notes (OOP scaffolding)

-   The codebase now includes a non-breaking OOP surface and a central ops registry. Behavior is unchanged.
-   Prefer `toDisplayString({ format })` for output. Avoid assuming CNF-only `toStringCNF()` in new code.
-   When ready to drop CNF epsilon support, flip the `ALLOW_EPSILON_IN_CNF` flag in `ordinal_types.js` and update any remaining CNF ε call sites/tests.

## 5. Maintaining This Document

This is a living document. Future agents working on this project are instructed to update it with any new information that could be beneficial for subsequent sessions. This includes, but is not limited to:

-   Newly discovered bugs and their root causes.
-   New guidelines or best practices established during development.
-   Clarifications or additions to the documentation of core data structures.
-   Information about new features or architectural changes.
