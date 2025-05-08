# Ordinal Number Calculator (Cantor Normal Form)

This web application provides a user-friendly interface to parse expressions representing ordinal numbers and calculates their Cantor Normal Form (CNF). It displays the result in both a traditional linear string format and a graphical representation using mathematical symbols (ω for omega and proper superscripts for exponentiation).

**Live Demo:** [Link to your GitHub Pages site will go here, e.g., https://your-username.github.io/ordinal-calculator/]

## Features

*   **Parses Ordinal Expressions:** Accepts input strings with:
    *   Non-negative integers (e.g., `0`, `1`, `42`).
    *   The symbol `w` for the smallest infinite ordinal, omega (ω).
    *   Standard arithmetic operations:
        *   Addition: `+`
        *   Multiplication: `*`
        *   Exponentiation: `^`
    *   Parentheses `()` for grouping and controlling order of operations.
*   **Calculates Cantor Normal Form (CNF):** Implements the standard rules for ordinal addition, multiplication, and exponentiation to produce accurate CNF results for ordinals less than epsilon-naught (ε₀).
*   **Dual Display:**
    *   **Graphical Representation:** Renders the CNF using the proper omega symbol (ω) and true superscripts for exponents, with nested superscripts sized appropriately for readability.
    *   **Linear String Representation:** Provides the standard text-based CNF.
*   **Copy Functionality:**
    *   Button to copy the graphical representation as an image to the clipboard.
    *   Button to copy the linear string representation to the clipboard.
*   **Operation Budget:** Includes an internal operation counter to prevent excessively long computations for extremely complex inputs, halting with an error if a predefined budget is exceeded.
*   **User-Friendly Interface:** Clean layout with input field, clear result displays, and instructions.
*   **Static Website:** Built with HTML, CSS, and vanilla JavaScript, making it easy to host.

## How to Use the Online Calculator

1.  **Enter Expression:** Type your ordinal expression into the input box. Examples:
    *   `w+1`
    *   `(w+1)*2`
    *   `w*w` or `w^2`
    *   `2^w`
    *   `w^(w+1)`
    *   `(w^w)^w`
    *   `(w^2+w*3+5)*w + (w+1)`
2.  **Calculate:** Click the "Calculate CNF" button or press Enter.
3.  **View Results:** The Cantor Normal Form will be displayed in both graphical and linear string formats.
4.  **Copy (Optional):**
    *   Click "Copy as Image" to copy the graphical rendering.
    *   Click "Copy Text" to copy the linear string.

## Technical Details

The calculator implements ordinal arithmetic based on the following principles:

*   **Cantor Normal Form:** `ω^α₁·c₁ + ω^α₂·c₂ + ... + ω^αₖ·cₖ + n`
    *   `α₁ > α₂ > ... > αₖ > 0` are ordinals (also in CNF).
    *   `cᵢ` are positive integers (coefficients).
    *   `n` is a non-negative integer (finite part).
*   **Recursive Descent Parser:** To interpret the input string.
*   **Object-Oriented Representation:** Ordinals are represented internally as objects/classes, allowing for recursive definitions of exponents.
*   **Arithmetic Rules:** Implements the standard, accurate set-theoretic rules for:
    *   Ordinal Addition (handling absorption and coefficient summing).
    *   Ordinal Multiplication (using right-distributivity `α·(β+γ) = α·β + α·γ` and specific term-by-term rules).
    *   Ordinal Exponentiation (covering finite/infinite bases and exponents, including rules like `k^β = ω^ξ·k^r` and `α^β = α^B·α^m`).
*   **Auxiliary Operations:** Includes internal functions for ordinal comparison, predecessor of an exponent (`⊖1`), and "division by omega" (`B/ω`).
*   **Graphical Rendering:** Dynamically generates HTML with `<sup>` tags for superscripts and uses CSS for styling.
*   **Image Copying:** Utilizes the `html2canvas` library to render the HTML graphical display to an image.

## Local Development & Setup

To run this project locally:

1.  **Clone the repository (or download the files):**
    ```bash
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```
2.  **Ensure all `.js` files are present:**
    *   `index.html`
    *   `style.css`
    *   `script.js`
    *   `ordinal_types.js`
    *   `ordinal_comparison.js`
    *   `ordinal_auxiliary_ops.js`
    *   `ordinal_addition.js`
    *   `ordinal_multiplication.js`
    *   `ordinal_exponentiation.js`
    *   `ordinal_parser.js`
    *   `ordinal_calculator.js`
    *   `ordinal_graphical_renderer.js`
3.  **Open `index.html` in a web browser.**
    *   No build step or local server is strictly required for basic functionality as it's a static site. However, some browser security features (especially around the Clipboard API for images if not served over HTTP/S) might behave more consistently if you use a simple local HTTP server.

    *Optional: Using a simple HTTP server (e.g., with Python):*
    ```bash
    # If you have Python 3
    python -m http.server
    # If you have Python 2
    # python -m SimpleHTTPServer
    ```
    Then navigate to `http://localhost:8000` (or the port shown) in your browser.

## File Structure

*   `index.html`: The main page structure.
*   `style.css`: All CSS styling for the page and graphical rendering.
*   `script.js`: Handles UI interactions, event listeners, and calls to the calculator logic.
*   `ordinal_types.js`: Defines the core `Ordinal` class and `OperationTracer`.
*   `ordinal_comparison.js`: Implements `Ordinal.prototype.compareTo`.
*   `ordinal_auxiliary_ops.js`: Implements `exponentPredecessor` and `divideByOmega`.
*   `ordinal_addition.js`: Implements `Ordinal.prototype.add`.
*   `ordinal_multiplication.js`: Implements `Ordinal.prototype.multiply`.
*   `ordinal_exponentiation.js`: Implements `Ordinal.prototype.power`.
*   `ordinal_parser.js`: Defines the `OrdinalParser` class.
*   `ordinal_calculator.js`: Contains the main `calculateOrdinalCNF` function as the public API.
*   `ordinal_graphical_renderer.js`: Contains the `renderOrdinalGraphical` function.

## Technologies Used

*   HTML5
*   CSS3
*   Vanilla JavaScript (ECMAScript 6+)
*   [html2canvas](https://html2canvas.hertzen.com/) (for "Copy as Image" functionality)

## Future Considerations (Potential Enhancements)

*   Support for epsilon numbers (ε₀ and beyond).
*   More advanced error reporting with highlighting of syntax errors in the input.
*   More sophisticated visual rendering for very deeply nested exponents.
*   Unit testing framework integration.
*   Option to display intermediate calculation steps.
*   Conversion between real/rational numbers and ordinal numbers
*   Random ordinal generation

## License

MIT License.