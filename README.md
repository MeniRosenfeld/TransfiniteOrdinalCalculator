# Transfinite Ordinal Calculator

A comprehensive web application for parsing, computing, and visualizing transfinite ordinal numbers up to ζ₀ (zeta-naught). Built with a modular, rule-based architecture supporting multiple ordinal representations including Cantor Normal Form (CNF), Epsilon Normal Form (ENF), omega towers, epsilon towers, epsilon tunnels, and more.

**Live Demo:** [On Github Pages](https://menirosenfeld.github.io/TransfiniteOrdinalCalculator/)

## Features

### **Ordinal Expression Parsing**
*   **Comprehensive syntax support:**
    *   Non-negative integers (e.g., `0`, `1`, `42`) with `BigInt` precision
    *   `w` for omega (ω), the first infinite ordinal
    *   `e_0` for epsilon-zero (ε₀), the first epsilon number
    *   `e_k` for arbitrary epsilon numbers (e.g., `e_1`, `e_w`, `e_(w+1)`)
    *   `e__n` for epsilon tunnels (deeply nested epsilon structures)
    *   Standard arithmetic operations with correct precedence:
        *   Addition: `+` (left-associative)
        *   Multiplication: `*` (left-associative)
        *   Exponentiation: `^` (right-associative)
        *   Tetration: `^^` (right-associative, highest precedence)
    *   Parentheses `()` for grouping and controlling order of operations

### **Multiple Ordinal Representations**
*   **`FiniteOrdinal`**: Natural numbers with BigInt precision
*   **`OmegaOrdinal`**: The ordinal ω
*   **`CNFOrdinal`**: Cantor Normal Form for ordinals < ε₀
*   **`EpsilonZero`**: The ordinal ε₀
*   **`EpsilonNumber`**: Epsilon numbers ε_k for arbitrary indices k
*   **`ENFOrdinal`/`ENFTerm`/`ENFFactor`**: Epsilon Normal Form for ordinals < Γ₀
*   **`WTowerOrdinal`**: Omega towers (ω↑↑n) like ω, ω^ω, ω^ω^ω, etc.
*   **`EpsilonTowerOrdinal`**: Epsilon towers (ε_k↑↑n) with arbitrary base indices
*   **`EpsilonTunnelOrdinal`**: Deep epsilon nesting (ε_ε_ε_...0)
*   **`ZetaZero`**: The ordinal ζ₀ (zeta-zero)

### **Advanced Arithmetic Operations**
*   **Rule-based computation engine** with modular operation rules
*   **Automatic type conversion** and intelligent dispatch
*   **Comprehensive tetration support:**
    *   `0^^n`: 1 if n even, 0 if n odd; `0^^∞` undefined
    *   `1^^k`: always 1
    *   `m^^n` (finite m≥2): iterative computation for small n, ω for infinite n
    *   `ω^^n`: `WTowerOrdinal` for large n, ε₀ for infinite n
    *   `ε_k^^n`: `EpsilonTowerOrdinal` for large n, ε_(k+1) for infinite n
*   **Operation budget system** prevents infinite computation loops

### **Dual Display System**
*   **Graphical Representation:** Beautiful mathematical rendering with:
    *   True superscripts and subscripts
    *   Proper ω, ε, ζ symbols with Unicode subscripts
    *   Tower notation with up arrows (ω↑↑n) and down arrows (ε↓↓n)
    *   Smart parentheses placement for readability
*   **Linear String Format:** Clean text representation preserving mathematical structure

### **Ordinal-to-Real Mapping f(α)**
*   **Strictly increasing function** mapping ordinals α < ζ₀ to real numbers
*   **Parameterizable scaling** with `FParams` class
*   **Interactive exploration** via slider interface
*   **Inverse mapping** `fInverse(x)` for real-to-ordinal conversion
*   **Bidirectional discovery:** Find ordinals corresponding to specific real values

### **User Interface**
*   **Copy functionality:** Export results as images or text
*   **Shareable links:** Generate URLs with pre-filled expressions
*   **Interactive slider:** Explore ordinal-real number relationships
*   **Responsive design:** Works on desktop and mobile devices

### **Developer Tools**
*   **Comprehensive test suites** with visual feedback
*   **Conversion debugging matrix** showing all type transformations
*   **Operation tracing** with budget monitoring
*   **Extensive documentation** and development guides

## How to Use

### **Basic Calculator Usage**
1. **Enter Expression:** Type your ordinal expression (e.g., `w^w+1`, `e_0*2`, `e__(w+1)`)
2. **Calculate:** Click "Calculate" or press Enter
3. **View Results:** See both graphical and text representations
4. **Explore Mapping:** Use the slider to explore the f(α) real number mapping

### **Example Expressions**
```
w+1              → ω+1
(w+1)*2          → ω×2+2  
w^2              → ω²
2^w              → ω
w^^3             → ω^ω^ω (displayed as ω↑↑3 for large towers)
e_0+1            → ε₀+1
e_1^w            → ε₁^ω
e_w*3+e_0^2*5    → ε_ω×3+ε₀²×5
e__3             → ε_ε_ε_0 (epsilon tunnel of depth 3)
e_(e_0+1)        → ε_(ε₀+1) (epsilon number with complex index)
```

### **Advanced Features**
*   **Copy Results:** Click "Copy as Image" or "Copy Text"
*   **Share:** Click "Share Link" to generate a URL
*   **Real Number Exploration:** Adjust slider to find ordinals for specific f(α) values
*   **Fine Control:** Use ↔️ nudge control for precise slider adjustments

## Technical Architecture

### **Modular Design**
*   **`types/`**: All ordinal type implementations inheriting from `OrdinalBase`
*   **`operations/`**: Rule-based arithmetic engines with pluggable rules
*   **`conversions/`**: Type conversion system with automatic path finding
*   **`tests/`**: Comprehensive test suites and debugging tools

### **Rule-Based Operations**
*   **`RuleEngine`**: Pattern matching and rule application system
*   **Modular rules**: Separate files for addition, multiplication, exponentiation, tetration
*   **Automatic dispatch**: Smart selection of appropriate algorithms based on operand types

### **Type Conversion System**
*   **`ConversionRegistry`**: Manages all type-to-type conversions
*   **`ConversionEngine`**: Finds optimal conversion paths automatically
*   **Lazy conversion**: Operations convert types only when necessary

### **Parser Architecture**
*   **`SimpleParser`**: Recursive descent parser with tokenization
*   **Flexible output**: Can produce any supported ordinal type
*   **Error handling**: Clear error messages with position information

### **Performance Features**
*   **Operation budgets**: Prevents infinite loops in complex calculations
*   **Efficient algorithms**: Optimized implementations for common operations
*   **Caching**: Results cached where appropriate to avoid recomputation

## File Structure

```
TransfiniteOrdinalCalculator/
├── index.html                          # Main calculator interface
├── style.css                           # Styling and mathematical typography
├── script.js                           # UI interaction logic
├── types/                              # Ordinal type implementations
│   ├── OrdinalBase.js                  # Base class defining ordinal contract
│   ├── FiniteOrdinal.js               # Natural numbers
│   ├── OmegaOrdinal.js                # The ordinal ω
│   ├── CNFOrdinal.js                  # Cantor Normal Form
│   ├── EpsilonZero.js                 # The ordinal ε₀
│   ├── EpsilonNumber.js               # Epsilon numbers ε_k
│   ├── ENFOrdinal.js                  # Epsilon Normal Form
│   ├── ENFTerm.js                     # ENF terms
│   ├── ENFFactor.js                   # ENF factors
│   ├── WTowerOrdinal.js               # Omega towers ω↑↑n
│   ├── EpsilonTowerOrdinal.js         # Epsilon towers ε_k↑↑n
│   ├── EpsilonTunnelOrdinal.js        # Epsilon tunnels ε↓↓n
│   ├── ZetaZero.js                    # The ordinal ζ₀
│   ├── ZeroOrdinal.js                 # The ordinal 0
│   └── OneOrdinal.js                  # The ordinal 1
├── operations/                         # Arithmetic operation engines
│   ├── Operations.js                   # Main operations registry
│   ├── RuleEngine.js                   # Rule matching and application
│   ├── AdditionRules.js               # Addition operation rules
│   ├── MultiplicationRules.js         # Multiplication operation rules
│   ├── ExponentiationRules.js         # Exponentiation operation rules
│   ├── TetrationRules.js              # Tetration operation rules
│   ├── Comparison.js                  # Comparison operation rules
│   ├── Auxiliary.js                   # Helper functions
│   └── NumericContexts.js             # Numeric computation contexts
├── conversions/                        # Type conversion system
│   ├── ConversionRegistry.js          # Conversion registry
│   └── ConversionEngine.js            # Conversion path finding
├── tests/                             # Test suites and debugging tools
│   ├── ordinal_enf_test.html          # Main ENF test suite
│   ├── ordinal_calculator_test.html   # Legacy calculator tests
│   ├── conversion_debug.html          # Conversion matrix debugger
│   ├── new_system_smoke_tests.html    # Architecture validation tests
│   └── [various other test files]
├── SimpleParser.js                     # Expression parser
├── SimpleCalculator.js                # Calculator logic
├── SimpleRenderer.js                  # Result rendering
├── RenderingComponents.js             # Mathematical notation components
├── OperationTracer.js                 # Operation budget and tracing
├── ordinal_mapping.js                 # f(α) ordinal-to-real mapping
├── ordinal_mapping_inverse.js         # fInverse(x) real-to-ordinal mapping
├── COMPREHENSIVE_DOCUMENTATION.md     # Complete project documentation
├── AGENT_DOCUMENTATION.md             # Development best practices
└── README.md                          # This file
```

## Local Development

### **Setup**
    ```bash
    git clone https://github.com/MeniRosenfeld/TransfiniteOrdinalCalculator.git
    cd TransfiniteOrdinalCalculator
    ```

### **Running Locally**
The calculator works directly by opening `index.html` in a browser, but for full functionality (clipboard API, etc.), use a local server:

    ```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### **Testing**
*   **Main Test Suite:** Open `tests/ordinal_enf_test.html`
*   **Conversion Testing:** Open `tests/conversion_debug.html`  
*   **Architecture Tests:** Open `tests/new_system_smoke_tests.html`

## Technologies Used

*   **HTML5** with semantic markup
*   **CSS3** with mathematical typography
*   **Vanilla JavaScript** (ES2020+ for BigInt support)
*   **[html2canvas](https://html2canvas.hertzen.com/)** for image export

## Mathematical Background

### **Ordinal Numbers**
Ordinal numbers extend natural numbers into the transfinite, representing well-ordered sets. Key ordinals include:
*   **ω** (omega): First infinite ordinal
*   **ε₀** (epsilon-zero): First epsilon number, where ω^ε₀ = ε₀
*   **ζ₀** (zeta-zero): First zeta number, limit of epsilon tower

### **Normal Forms**
*   **Cantor Normal Form (CNF)**: Represents ordinals < ε₀ as finite sums of omega powers
*   **Epsilon Normal Form (ENF)**: Extends CNF to handle epsilon numbers up to Γ₀

### **Ordinal Arithmetic**
*   **Non-commutative**: α + β ≠ β + α in general
*   **Left-distributive**: α(β + γ) = αβ + αγ, but (β + γ)α ≠ βα + γα
*   **Tetration**: Iterated exponentiation creating tower structures

## Development

**Developed by:** Claude Sonnet 4, with extensive guidance and testing by [Meni Rosenfeld](https://github.com/MeniRosenfeld)

**Important for Contributors:** Read `AGENT_DOCUMENTATION.md` before making changes. It contains critical architectural guidelines and common pitfalls.

**Validation:** Results validated through comprehensive test suites and comparison with [Claudio Kressibucher's Ordinal Calculator](https://www.transfinite.ch/).

**Learn More:** [The Unabashed Expanse of Ordinal Numbers](https://fieryspinningsword.com/2021/08/20/the-unabashed-expanse-of-ordinal-numbers/) by Meni Rosenfeld

## Future Enhancements

*   Support for larger ordinals (Γ₀, Veblen functions)
*   Step-by-step calculation display
*   Advanced error reporting with syntax highlighting
*   Random ordinal generation and exploration
*   More sophisticated visual rendering for deeply nested expressions
*   Export to LaTeX and other mathematical formats

## License

[MIT License](LICENSE)
