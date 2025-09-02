# Transfinite Ordinal Calculator

This web application provides a user-friendly interface to parse expressions representing ordinal numbers and calculates their representation up to ε₀ (epsilon-naught), typically in Cantor Normal Form (CNF) for ordinals less than ε₀. It displays the result in both a traditional linear string format and a graphical representation using mathematical symbols.

**Live Demo:** [On Github Pages](https://menirosenfeld.github.io/TransfiniteOrdinalCalculator/)

## Features

*   **Parses Ordinal Expressions:** Accepts input strings with:
    *   Non-negative integers (e.g., `0`, `1`, `42`), parsed using `BigInt` for exact arithmetic.
    *   The symbol `w` for the smallest infinite ordinal, omega (ω).
    *   The symbol `e_0` for epsilon-naught (ε₀), the first fixed point of ω^x=x.
    *   Standard arithmetic operations:
        *   Addition: `+` (left-associative)
        *   Multiplication: `*` (left-associative)
        *   Exponentiation: `^` (right-associative)
        *   Tetration: `^^` (right-associative, highest precedence)
    *   Parentheses `()` for grouping and controlling order of operations.
*   **Multiple Ordinal Types:** Internally represents and operates on:
    *   `CNFOrdinal`: For ordinals in Cantor Normal Form (primarily < ε₀; CNF epsilon support is being phased out behind a flag).
    *   `EpsilonNaughtOrdinal`: For the ordinal ε₀.
    *   `WTowerOrdinal`: For ordinals of the form ω↑↑n (ω tetrated to a finite height n), like ω, ω^ω, ω^(ω^ω), etc. For display these are preserved natively; for most operations they can be converted to `CNFOrdinal` on demand.
    *   `EpsilonTowerOrdinal`: For ordinals of the form e_k↑↑n (ε-tetration with fixed index k and finite height n). For display these are preserved natively; operationally they convert to ENF/CNF on demand.
    *   `ENFOrdinal`/`ENFTerm`: Epsilon Normal Form used whenever epsilon structure is present.
*   **Calculates Ordinal Forms:**
    *   Implements the standard rules for ordinal addition, multiplication, exponentiation, and tetration (see below for extended tetration rules).
    *   Produces accurate CNF for ordinals less than ε₀.
    *   Handles operations involving ε₀ according to defined rules (e.g., `α + ε₀ = ε₀` for α < ε₀, `k^^ε₀ = ω` for finite k>1, `α^^ε₀ = ε₀` for infinite α).
*   **Dual Display:**
    *   **Graphical Representation:** Renders using ω, ε₀, ω↑↑n (inline arrows), and true superscripts for exponents. For small towers (n < 10), ω↑↑n is expanded as an explicit power tower with nested superscripts; for n ≥ 10, the compact ω↑↑n form is used. The renderer now supports rendering directly from a chosen string via `renderOrdinalGraphicalFromString(text)` to ensure consistency with the textual representation.
    *   **Linear String Representation (native):** The UI shows each ordinal using its type’s native `toDisplayString`/`toString` (no format selector). Towers preserve native notation: `WTowerOrdinal` uses `w^^n`, `EpsilonTowerOrdinal` uses `e_k^^n`. Parentheses are added only when necessary (e.g., composite exponents), and power chains like `w^w^w^w` are not parenthesized.
*   **Result Simplification:**
    *   Automatically simplifies very complex results based on a structural complexity budget (`g(α)`) to enhance readability.
    *   If simplification occurs, an indicator (e.g., `(Displayed complexity: G_simp / G_orig)`) is shown alongside the graphical result.
*   **Ordinal-to-Real Number Mapping `f(α)`:**
    *   Displays a strictly increasing mapping `f(α)` which maps ordinals α < ε₀ to a real interval.
    *   This mapping is now parameterized by a set of scale factors (`scaleAdd`, `scaleMult`, `scaleExp`, `scaleTet`) which default to 1. These parameters are managed by an `FParams` class.
    *   With default parameters, the mapping is to `[0, 5)`. The upper bound of this interval (and thus the slider's maximum) is dynamically determined by `DEFAULT_F_PARAMS.precomputed[5]`.
    *   This mapping uses the *original, unsimplified* ordinal value.
    *   A tooltip explains the basis of this mapping. The function `f(α)` is defined recursively as follows (description below assumes default parameters for simplicity):
        *   **Rule 1: α is a finite ordinal `n`** (represented as a JavaScript `BigInt`)
            *   `f(0) = 0.0`
            *   `f(n) = n / (n + 1)` for `n > 0`
        *   **Rule 2: α is ε₀** (represented as the string `"E0_TYPE"`)
            *   `f(ε₀) = 5.0`
        *   **Rule 3: α = ω^k** (where `k` is an ordinal representation)
            *   **Sub-rule 3a: `k` is a finite ordinal `j ≥ 0`**
                *   If `j = 0` (so α = ω⁰ = 1): `f(ω⁰) = f(1) = 0.5`
                *   If `j > 0`: `f(ω^j) = (3j - 2) / j` (This means `f(ω) = 1`, `f(ω²) = 2`, `f(ω³) = 7/3`, etc., approaching 3 as `j` increases)
            *   **Sub-rule 3b: `k` is an ordinal `≥ ω`**
                *   `f(ω^k) = (25 - f(k)) / (9 - f(k))` (This means `f(ω^ω) = 3`, `f(ω^(ω^ω)) = 11/3`, etc., approaching 5 as `f(k)` approaches 5)
        *   **Rule 4: α = ω^β ⋅ c + δ** (where `β` is an ordinal, `c` is a positive integer coefficient, and `δ` is an ordinal `0 ≤ δ < ω^β`)
            *   Let `f_A = f(ω^β)` and `f_B = f(ω^(β+1))`.
            *   Let `f_c_minus_1 = f(c-1)` (calculated using Rule 1, as `c-1` is finite).
            *   The value for the first part `f(ω^β ⋅ c)` is calculated as: `f(ω^β ⋅ c) = f_A + (f_B - f_A) * f_c_minus_1`.
            *   If `δ = 0`, then `f(α) = f(ω^β ⋅ c)`.
            *   If `δ > 0`:
                *   Let `f_c = f(c)`.
                *   The value for `f(ω^β ⋅ (c+1))` is effectively `f_A + (f_B - f_A) * f_c`.
                *   Then `f(α) = f(ω^β ⋅ c) + (f(ω^β ⋅ (c+1)) - f(ω^β ⋅ c)) * f(δ) / f_A`.
*   **Interactive Real-to-Ordinal Exploration:**
    *   Includes an interactive slider and nudge controls linked to the `f(α)` mapping.
    *   Users can adjust the slider to select a real number `x` in the dynamic range determined by `f(α)`.
    *   The calculator then uses an inverse mapping function, `fInverse(x, params)`, to find and display an ordinal `α` such that `f(α) ≈ x`.
    *   Moving the slider also updates the main ordinal expression input box with the string representation of the found ordinal `α`.
    *   This allows users to explore which ordinals correspond to specific real values under the `f(α)` mapping.
*   **Copy Functionality:**
    *   Button to copy the graphical representation as an image to the clipboard.
    *   Button to copy the linear string representation to the clipboard.
*   **Shareable Links:**
    *   Button to generate a URL that pre-fills the calculator with the current expression.
*   **Operation Budget:** Includes an internal operation counter to prevent excessively long computations for extremely complex inputs, halting with an error if a predefined budget is exceeded.
*   **User-Friendly Interface:** Clean layout with input field, clear result displays, and instructions.
*   **Static Website:** Built with HTML, CSS, and vanilla JavaScript, making it easy to host.

## How to Use the Online Calculator

1.  **Enter Expression:** Type your ordinal expression into the input box. Examples:
    *   `w+1` ➜ `w+1`
    *   `(w+1)*2` ➜ `w*2+1`
    *   `w*w` or `w^2` ➜ `w^2`
    *   `2^w` ➜ `w`
    *   `w^(w+1)` ➜ `w^(w+1)`
    *   `(w^w)^w` ➜ `w^(w^2)`
    *   `2^^3` (2↑↑3) ➜ `16`
    *   `w^^2` (ω↑↑2) ➜ `w^w`
    *   `w^^w` (ω↑↑ω) ➜ `e_0`
    *   `e_0+1` ➜ Unspported in the current implementation, largest ordinal is `e_0`.
    *   `w+e_0` ➜ `e_0`
2.  **Calculate:** Click the "Calculate" button or press Enter.
3.  **View Results:** The result will be displayed in both graphical and linear string formats.
    *   The mapped real value `f(α)` will also be shown.
    *   If the displayed ordinal was simplified, complexity information will appear.
4.  **Copy (Optional):**
    *   Click "Copy as Image" to copy the graphical rendering.
    *   Click "Copy Text" to copy the linear string.
5.  **Share (Optional):**
    *   Click "Share Link" to get a URL for the current expression.
6.  **Explore (Optional):**
    *   Use the slider located below the input field to select a real number value (its range is dynamically set by the current `f(α)` parameters, defaulting to approximately [0, 5)).
    *   The calculator will dynamically display the ordinal `α` that corresponds to this real number (i.e., where `f(α) ≈ x`) and also populate the main "Enter Ordinal Expression" input box with this ordinal's string representation.
    *   The `↔️` (nudge) control next to the slider can be used for fine-grained adjustments to the selected real value.

## Technical Details

*   **Representations and dispatch**
    *   `CNFOrdinal` (Cantor Normal Form), `EpsilonOrdinal` (ε-indexed), `WTowerOrdinal` (ω↑↑n), and `ENFOrdinal` (Epsilon Normal Form).
    *   Addition and multiplication default to CNF when both operands are epsilon-free; if either operand has epsilon structure, the operation is performed in ENF to respect rank order.
    *   Exponentiation uses ENF by default. It falls back to CNF only when both operands are CNF and epsilon-free.
    *   Tetration supports all base/exponent pairs:
        - 0^^n: 1 if n is even, 0 if n is odd; 0^^(infinite) is undefined.
        - 1^^k: 1 for any k.
        - Finite m≥2: finite-height uses iterative recursion; infinite height yields ω.
        - ω^^n: returns `WTowerOrdinal` when n>10; otherwise uses recursion. Infinite height yields ε₀.
        - e_k^^n: returns `EpsilonTowerOrdinal` when n>10; otherwise recursion. Infinite height yields e_(k+1).
        - General infinite base a and finite n: recursion. For infinite height: if a is CNF epsilon‑free (< ε₀), result is ε₀; if a ≥ ε₀, result is e_(k+1) where k is the largest epsilon index occurring in a.

*   **Central operation registry**
    *   `ordinal_ops.js` defines `ordinalAdd`, `ordinalMultiply`, `ordinalPower`, `ordinalTetrate`. It currently delegates to existing dispatchers and provides a single place to evolve multi-dispatch logic.

*   **Calculator API (format-aware)**
    *   `calculateOrdinalCNF(expressionString, maxOperations, options?)` still accepts `{ format?: 'CNF' | 'ENF' }`, but the main UI always displays the native string regardless of this option.
      - `format: 'ENF'` parses with `{ coerceToCNF: false }`, evaluates using ENF, and returns `{ enfString, ordinalObject }` (preserving `WTowerOrdinal` and `EpsilonTowerOrdinal` natively when produced).
      - `format: 'CNF'` returns `{ cnfString, ordinalObject }`.

*   **ENF rank-based exponentiation**
    *   Basic ordinals: 1, ω, and each ε_a.
    *   Rank(α): greatest basic ordinal ≤ α. For finite, rank=1; for infinite ω-based terms, rank=ω; for ε-based terms, the basic ε.
    *   For a^b:
        - If rank(b) > rank(a): write b = k·x + r with k = rank(b), return k^x · a^r.
        - Else: let a’s leading factor be k^c; decompose b = d + r (d limit, r finite); return k^(c·d) · a^r.
    *   Identities used: ω^(ε_k) = ε_k; ω^(ε_k + r_finite) = ε_k · ω^r.

*   **Parser options**
    *   `new OrdinalParser(input, tracer, options)` supports `{ coerceToCNF?: boolean }` (default true).
    *   Tests that compare ENF objects use `{ coerceToCNF: false }` to stay in ENF space.

*   **Comparison**
    *   `CNFOrdinal.compareTo` converts ENF inputs to CNF for comparison.
    *   `ENFOrdinal.compareTo` converts CNF/Epsilon/WTower inputs to ENF.
    *   ENF term ordering: epsilon factors (rank-first, base then exponent), then ω-exponent (CNF), then finite coefficient.

*   **Stability and conversion**
    *   `WTowerOrdinal.toCNFOrdinal()` is iterative (no deep recursion). The evaluator preserves `WTowerOrdinal` natively when tetration with base ω and finite height is requested. Display uses native tower strings.
    *   `EpsilonTowerOrdinal`: constructed from index k (CNF/Epsilon/ENF accepted) and finite height n; `toENFOrdinal()` computes the recursive tower (e_k^^n) and `toCNFOrdinal()` routes via ENF. The calculator preserves `EpsilonTowerOrdinal` natively for display.
    *   Conversions avoid recursion loops: use `ENFOrdinal.fromCNF` for CNF→ENF; `ENFOrdinal.toCNFOrdinal` builds CNF structurally.
*   **Parser:** Recursive descent parser that handles numbers, `w`, `e_0`, operators `+`, `*`, `^`, `^^` (with correct precedence and associativity), and parentheses. Use `{ coerceToCNF: false }` when you intend to keep ENF.
*   **Polymorphic display API:** All ordinal types carry an internal brand and implement `toDisplayString({ format })`. Use this for rendering strings (CNF/ENF) instead of calling `toStringCNF()` directly.
*   **Complexity Function `g(α)`:**
    *   `g(n)` = number of digits of `n`
    *   `g(w)` = 1
    *   `g(w*m) = g(m)+2`
    *   `g(w^a) = g(a)+4`
    *   `g(w^a*m) = g(a)+g(m)+5`
    *   `g(a+b) = g(a)+g(b)+1`
    *   `g(e_0) = 3`
    *   `g(w^^m) = g(m)+3` (where `w^^m` is a `WTowerOrdinal` or its CNF equivalent)
*   **Simplification Function `simplify(α, budget)`:**
    *   Returns an ordinal `α'` such that `α' ≤ α` and `g(α') ≤ budget`.
    *   Aims to find the largest such `α'`.
    *   Uses heuristics like checking the Main Power Tower (MPT) of exponents and potentially replacing complex terms with `WTowerOrdinal` approximations (e.g., `w^^k`) if they fit the budget.
*   **Graphical Rendering:** Dynamically generates HTML with `<sup>` tags and specific classes for ω, ε₀, and ω↑↑n (arrows inline and slightly larger). For small towers, emits explicit nested superscripts; for large towers, shows `ω↑↑n`. A helper `renderOrdinalGraphicalFromString(text)` is available to render from a canonical string.
*   **Image Copying:** Utilizes the `html2canvas` library.
*   **Mapping Functions:**
    *   `ordinal_mapping.js`: Defines `f(α)` and includes `FParams` for parameters (`scaleAdd`, `scaleMult`, `scaleExp`, `scaleTet`, `scaleEpsilon`). The mapping supports `WTowerOrdinal` natively via a closed-form rule (`{type:'w_tower', height}`), so `f(w^^n)` is O(1). Display of `f(α)` is rounded to 13 decimals and trailing zeros are trimmed for readability.
    *   `ordinal_mapping_inverse.js`: Defines the `fInverse(x, params)` real-to-ordinal inverse mapping function, which now accepts an `FParams` object. It's used for the interactive slider exploration and for internal testing.
    *   Test files like `ordinal_calculator_test.html` and `haskell_comparison_test.html` are also included.

## Local Development & Setup

1.  **Clone the repository (or download the files):**
    ```bash
    git clone https://github.com/MeniRosenfeld/TransfiniteOrdinalCalculator.git
    cd TransfiniteOrdinalCalculator
    ```
2.  **Ensure all `.js` files are present in the `TransfiniteOrdinalCalculator` directory:**
    *   `index.html` (Main page)
    *   `style.css`
    *   `script.js` (UI logic)
    *   `ordinal_types.js` (Core classes: `CNFOrdinal`, `EpsilonNaughtOrdinal`, `WTowerOrdinal`, `OperationTracer`)
    *   `ordinal_comparison.js` (Comparison methods)
    *   `ordinal_auxiliary_ops.js` (Auxiliary functions like `exponentPredecessor`)
    *   `ordinal_addition.js`
    *   `ordinal_multiplication.js`
    *   `ordinal_exponentiation.js`
    *   `ordinal_tetration.js`
    *   `ordinal_parser.js`
    *   `ordinal_calculator.js` (Main `calculateOrdinalCNF` function)
    *   `ordinal_graphical_renderer.js`
    *   `ordinal_mapping.js` (The `f(α)` mapping function)
    *   `ordinal_mapping_inverse.js` (The `fInverse(x)` inverse mapping function, used for the interactive slider exploration and for internal testing)
    *   Test files like `ordinal_calculator_test.html` and `haskell_comparison_test.html` are also included.
3.  **Open `index.html` in a web browser.**
    *   No build step or local server is strictly required. However, for full Clipboard API support and to avoid potential issues with `file://` URLs, using a simple local HTTP server is recommended.

    *Optional: Using a simple HTTP server (e.g., with Python):*
    ```bash
    # Navigate to the TransfiniteOrdinalCalculator directory first
    # If you have Python 3
    python -m http.server
    # If you have Python 2
    # python -m SimpleHTTPServer
    ```
    Then navigate to `http://localhost:8000` (or the port shown) in your browser.

## File Structure

*   `index.html`, `style.css`, `script.js`
*   Ordinal core:
    - `ordinal_types.js` (CNFOrdinal, EpsilonOrdinal, WTowerOrdinal, OperationTracer)
    - `ordinal_comparison.js`
    - `ordinal_auxiliary_ops.js` (exponentPredecessor, divideByOmega, helpers)
    - `ordinal_addition.js`, `ordinal_multiplication.js`, `ordinal_exponentiation.js`, `ordinal_tetration.js`
    - `ordinal_ops.js` (central operation registry)
    - `ordinal_parser.js` (supports `{ coerceToCNF }`)
    - `ordinal_graphical_renderer.js`
    - `style.css` (math-like styling; Ω uses a single `.omega` class consistently in and out of superscripts)
*   Mapping:
    - `ordinal_mapping.js` (f(α), FParams)
    - `ordinal_mapping_inverse.js` (fInverse)
*   ENF:
    - `ordinal_enf.js` (ENFOrdinal, ENFTerm, ENF arithmetic and rank-based exponentiation)
    - `ordinal_enf_test.html`, `ordinal_enf_expected_results.js`
*   Calculator / tests:
    - `ordinal_calculator.js` (calculateOrdinalCNF)
    - `ordinal_calculator_test.html`
    - `haskell_comparison_test.html`, `haskell_comparison_test.js` (optional)
    - `Ordinal.hs` (optional)

## Technologies Used

*   HTML5
*   CSS3
*   Vanilla JavaScript (ECMAScript 2020+ for `BigInt`)
*   [html2canvas](https://html2canvas.hertzen.com/) (for "Copy as Image" functionality)

## Development
Developed by Gemini 2.5 Pro, with extensive guidance, testing, and feature specification by ordinal number enthusiast [Meni Rosenfeld](https://github.com/MeniRosenfeld).

Important: AI agents MUST read `AGENT_DOCUMENTATION.md` before making changes. It captures architectural rules, dispatch decisions, parser options, comparison invariants, and common pitfalls that caused regressions (e.g., CNF⇄ENF conversion loops, multiplication coefficient absorption, monotonicity checks in ENF vs CNF).

Calculation results have been primarily validated through a comprehensive internal test suite (`ordinal_calculator_test.html`), which includes checks for CNF accuracy and the consistency of the ordinal-to-real mapping (`f(α)`) and its inverse. Comparisons are also made, where applicable, with Claudio Kressibucher's [Ordinal Calculator](https://www.transfinite.ch/).

You can read more about ordinal numbers here: [The Unabashed Expanse of Ordinal numbers](https://fieryspinningsword.com/2021/08/20/the-unabashed-expanse-of-ordinal-numbers/) by Meni Rosenfeld.

## Future Considerations (Potential Enhancements)

*   Support for larger epsilon numbers (ε₁, etc.) and other Veblen functions.
*   More advanced error reporting with highlighting of syntax errors in the input.
*   More sophisticated visual rendering for very deeply nested exponents.
*   Option to display intermediate calculation steps.
*   Random ordinal generation and testing.

## License

[MIT License](LICENSE).
