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
    *   `CNFOrdinal`: For ordinals representable in Cantor Normal Form.
    *   `EpsilonNaughtOrdinal`: For the ordinal ε₀.
    *   `WTowerOrdinal`: For ordinals of the form ω↑↑n (ω tetrated to a finite height n), like ω, ω^ω, ω^(ω^ω), etc. These are converted to `CNFOrdinal` for most operations.
*   **Calculates Ordinal Forms:**
    *   Implements the standard rules for ordinal addition, multiplication, exponentiation, and tetration.
    *   Produces accurate CNF for ordinals less than ε₀.
    *   Handles operations involving ε₀ according to defined rules (e.g., `α + ε₀ = ε₀` for α < ε₀, `k^^ε₀ = ω` for finite k>1, `α^^ε₀ = ε₀` for infinite α).
*   **Dual Display:**
    *   **Graphical Representation:** Renders the result using symbols like ω, ε₀, ω↑↑n, and true superscripts for exponents, with nested superscripts sized appropriately.
    *   **Linear String Representation:** Provides the standard text-based CNF or "e_0" / "w^^n".
*   **Result Simplification:**
    *   Automatically simplifies very complex results based on a structural complexity budget (`g(α)`) to enhance readability.
    *   If simplification occurs, an indicator (e.g., `(Displayed complexity: G_simp / G_orig)`) is shown alongside the graphical result.
*   **Ordinal-to-Real Number Mapping `f(α)`:**
    *   Displays a strictly increasing mapping `f(α)` which maps ordinals α < ε₀ to the real interval `[0, 5)`.
    *   This mapping uses the *original, unsimplified* ordinal value.
    *   A tooltip explains the basis of this mapping. The function `f(α)` is defined recursively as follows:
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
    *   Users can adjust the slider to select a real number `x` in the `[0, 5)` range.
    *   The calculator then uses an inverse mapping function, `fInverse(x)`, to find and display an ordinal `α` such that `f(α) ≈ x`.
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
    *   Use the slider located below the input field to select a real number value (between 0 and 5).
    *   The calculator will dynamically display the ordinal `α` that corresponds to this real number, i.e., where `f(α) ≈ x`.
    *   The `↔️` (nudge) control next to the slider can be used for fine-grained adjustments to the selected real value.

## Technical Details

*   **Ordinal Types & Arithmetic:**
    *   `CNFOrdinal`: Represents ordinals as `ω^α₁·c₁ + ω^α₂·c₂ + ... + ω^αₖ·cₖ + n` where `α₁ > α₂ > ... > αₖ > 0` are ordinals and `cᵢ` are positive `BigInt` coefficients, `n` is a `BigInt`.
    *   `EpsilonNaughtOrdinal`: Represents ε₀.
    *   `WTowerOrdinal`: Represents ω↑↑m for finite integer m.
    *   Dispatcher functions route arithmetic operations (`+`, `*`, `^`, `^^`) to type-specific methods.
    *   Uses `BigInt` for coefficients and finite parts, ensuring exact integer arithmetic.
    *   Multiplication `α * m` (finite `m`) is optimized.
*   **Parser:** Recursive descent parser that handles numbers, `w`, `e_0`, operators `+`, `*`, `^`, `^^` (with correct precedence and associativity), and parentheses.
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
*   **Graphical Rendering:** Dynamically generates HTML with `<sup>` tags and specific classes for ω, ε₀, ω↑↑n, operators, and coefficients, styled with CSS.
*   **Image Copying:** Utilizes the `html2canvas` library.

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

*   `index.html`: The main page structure.
*   `style.css`: All CSS styling.
*   `script.js`: UI interactions, event listeners, simplification logic, and `f(α)` display.
*   `ordinal_types.js`: Defines `CNFOrdinal`, `EpsilonNaughtOrdinal`, `WTowerOrdinal`, `OperationTracer`, complexity `g(α)` methods, and simplification `simplify()` methods.
*   `ordinal_comparison.js`: Implements `compareTo` methods for all ordinal types.
*   `ordinal_auxiliary_ops.js`: Implements `exponentPredecessor`, `divideByOmega`, etc.
*   `ordinal_addition.js`, `ordinal_multiplication.js`, `ordinal_exponentiation.js`, `ordinal_tetration.js`: Implement the respective arithmetic operations and dispatchers.
*   `ordinal_parser.js`: Defines the `OrdinalParser` class.
*   `ordinal_calculator.js`: Contains the `calculateOrdinalCNF` function.
*   `ordinal_graphical_renderer.js`: Contains the `renderOrdinalGraphical` function.
*   `ordinal_mapping.js`: Defines the `f(α)` ordinal-to-real mapping function.
*   `ordinal_mapping_inverse.js`: Defines the `fInverse(x)` real-to-ordinal inverse mapping function, used for the interactive slider exploration and for internal testing.
*   `ordinal_calculator_test.html`: Comprehensive test suite for JavaScript features, with an interactive UI to view all tests or only failures, and including round-trip consistency checks for `f(α)` and `fInverse(x)`.
*   `haskell_comparison_test.html` & `haskell_comparison_test.js`: (If Haskell Wasm comparison is set up) For comparing JS results against a Haskell implementation.
*   `ordinal_haskell.wasm`: (If built) The Haskell Wasm module.
*   `Ordinal.hs`: (If using Haskell) The Haskell source for ordinal arithmetic.

## Technologies Used

*   HTML5
*   CSS3
*   Vanilla JavaScript (ECMAScript 2020+ for `BigInt`)
*   [html2canvas](https://html2canvas.hertzen.com/) (for "Copy as Image" functionality)

## Development
Developed by Gemini 2.5 Pro, with extensive guidance, testing, and feature specification by ordinal number enthusiast [Meni Rosenfeld](https://github.com/MeniRosenfeld).

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
