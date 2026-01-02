# Transfinite Ordinal Calculator

A comprehensive web application for parsing, computing, and visualizing transfinite ordinal numbers up to ζ₀ (zeta-naught). Built with a modular, rule-based architecture supporting multiple ordinal representations including Cantor Normal Form (CNF), Epsilon Normal Form (ENF), omega towers, epsilon towers, epsilon tunnels, and more.

**Live Demo:** [On Github Pages](https://menirosenfeld.github.io/TransfiniteOrdinalCalculator/)

## Features

### **Enhanced Expression System**

- **Multi-type expression support:**
  - **Ordinals**: Non-negative integers, `w` (omega), `e_k` (epsilon numbers), `e__n` (tunnels)
  - **Comparisons**: `=`, `!=`, `<`, `>`, `<=`, `>=`, `?` (returns `<`, `=`, or `>`)
  - **Boolean Logic**: `&&`, `||`, `->` (implication), `!` (not)
  - **String Literals**: `"text"` with escape sequences
  - **Boolean Literals**: `true`, `false` (case insensitive)
  - **Variables**: `a`, `b`, `c`, etc. with substitution support
  - **Functions**: `complexity[ordinal]`, `toString[value]`, `parse[string]`
- **Advanced operations:**
  - **Arithmetic**: `+`, `*`, `^`, `^^` with proper precedence
  - **Successor**: `ordinal'` (postfix operator)
  - **Variable Substitution**: `expr/.{var:=value, ...}` (lowest precedence)
  - **Parentheses**: `()` for grouping and controlling order of operations
- **Expression Trees**: Deferred evaluation system for complex expressions with variables
- **Partial Substitution**: Variables can be substituted incrementally

### **Multiple Ordinal Representations**

- **`FiniteOrdinal`**: Natural numbers with BigInt precision
- **`OmegaOrdinal`**: The ordinal ω
- **`CNFOrdinal`**: Cantor Normal Form for ordinals < ε₀
- **`EpsilonZero`**: The ordinal ε₀
- **`EpsilonNumber`**: Epsilon numbers ε_k for arbitrary indices k
- **`ENFOrdinal`/`ENFTerm`/`ENFFactor`**: Epsilon Normal Form for ordinals < Γ₀
- **`WTowerOrdinal`**: Omega towers (ω↑↑n) like ω, ω^ω, ω^ω^ω, etc.
- **`EpsilonTowerOrdinal`**: Epsilon towers (ε_k↑↑n) with arbitrary base indices
- **`EpsilonTunnelOrdinal`**: Deep epsilon nesting (ε*ε*ε\_...0)
- **`ZetaZero`**: The ordinal ζ₀ (zeta-zero)

### **Advanced Arithmetic Operations**

- **Rule-based computation engine** with modular operation rules
- **Automatic type conversion** and intelligent dispatch
- **Comprehensive tetration support:**
  - `0^^n`: 1 if n even, 0 if n odd; `0^^∞` undefined
  - `1^^k`: always 1
  - `m^^n` (finite m≥2): iterative computation for small n, ω for infinite n
  - `ω^^n`: `WTowerOrdinal` for large n, ε₀ for infinite n
  - `ε_k^^n`: `EpsilonTowerOrdinal` for large n, ε\_(k+1) for infinite n
- **Operation budget system** prevents infinite computation loops

### **Dual Display System**

- **Graphical Representation:** Beautiful mathematical rendering with:
  - True superscripts and subscripts
  - Proper ω, ε, ζ symbols with Unicode subscripts
  - Tower notation with up arrows (ω↑↑n) and down arrows (ε↓↓n)
  - Smart parentheses placement for readability
- **Linear String Format:** Clean text representation preserving mathematical structure

### **Ordinal-to-Real Mapping f(α)**

- **Strictly increasing function** mapping ordinals α < ζ₀ to real numbers
- **Parameterizable scaling** with `FParams` class
- **Interactive exploration** via slider interface
- **Inverse mapping** `fInverse(x)` for real-to-ordinal conversion
- **Bidirectional discovery:** Find ordinals corresponding to specific real values
- **Typed API:** Use `fTyped`/`fInverseTyped` with `FParams.default(new DoubleContext())`. The legacy `OrdinalMappingLegacy` shim has been removed; converters live in `OrdinalMapping.ts`.
- **Out-of-range handling:** Inverse mapping throws the canonical message `Input value <x> is outside the valid range [0,<max>]` for values outside `[0, f(ε₀)]`.

### **User Interface**

- **Copy functionality:** Export results as images or text
- **Shareable links:** Generate URLs with pre-filled expressions
- **Interactive slider:** Explore ordinal-real number relationships
- **Responsive design:** Works on desktop and mobile devices

### **Developer Tools**

- **Comprehensive test suites** with visual feedback
- **Enhanced parser test suite** for multi-type expressions and variable substitution
- **Unified test system** with declarative test definitions (90% code reduction)
- **Immutability testing** verifies ordinal objects remain unchanged during operations
- **Conversion debugging matrix** showing all type transformations
- **Operation tracing** with budget monitoring
- **Alertness testing** randomly introduces errors to verify test suite effectiveness
- **Singleton instances** for efficient constant ordinal access
- **Expression tree debugging** for complex variable expressions
- **Extensive documentation** and development guides

## How to Use

### **Basic Calculator Usage**

1. **Enter Expression:** Type any supported expression:
   - **Ordinals**: `w^w+1`, `e_0*2`, `e__(w+1)`
   - **Comparisons**: `w > 5`, `e_0 ? w`
   - **Boolean Logic**: `!true && false`, `(w > 1) -> (w != 0)`
   - **Variables**: `a+b/.{a:=w,b:=1}`, `parse[toString[a]]/.{a:=e_0}`
2. **Calculate:** Click "Calculate" or press Enter
3. **View Results:** See results with appropriate formatting:
   - **Ordinals**: Graphical mathematical notation
   - **Booleans**: `true`/`false` with blue styling
   - **Comparisons**: `<`, `=`, `>` with red styling
   - **Expressions**: Variable expressions with purple styling
4. **Explore Mapping:** Use the slider to explore the f(α) real number mapping (ordinals only)

### **Example Expressions**

**Ordinal Arithmetic:**

```
w+1              → ω+1
(w+1)*2          → ω×2+2
w^2              → ω²
2^w              → ω
w^^3             → ω^ω^ω (displayed as ω↑↑3 for large towers)
e_0+1            → ε₀+1
e_1^w            → ε₁^ω
w'               → ω+1 (successor operator)
```

**Enhanced Expressions:**

```
w > 5            → true (boolean result)
w ? e_0          → < (comparison result)
"hello" = "world" → false
!true && false   → false
complexity[w^w]  → 2
toString[e_0]    → "e_0"
parse["w+1"]     → ω+1
```

**Variable Substitution:**

```
a+b/.{a:=w,b:=1}           → ω+1
a+b/.{a:=w}                → ω+b (partial substitution)
parse[toString[a]]/.{a:=5}  → 5 (nested functions)
(a < w && b < w)/.{a:=e_0,b:=w} → false (condition evaluation)
```

### **Advanced Features**

- **Copy Results:** Click "Copy as Image" or "Copy Text"
- **Share:** Click "Share Link" to generate a URL
- **Real Number Exploration:** Adjust slider to find ordinals for specific f(α) values
- **Fine Control:** Use ↔️ nudge control for precise slider adjustments

## Technical Architecture

### **Modular Design**

- **`types/`**: All ordinal type implementations inheriting from `OrdinalBase`
- **`operations/`**: Rule-based arithmetic engines with pluggable rules
- **`conversions/`**: Type conversion system with automatic path finding
- **`tests/`**: Comprehensive test suites and debugging tools

### **Rule-Based Operations**

- **`RuleEngine`**: Pattern matching and rule application system
- **Modular rules**: Separate files for addition, multiplication, exponentiation, tetration
- **Automatic dispatch**: Smart selection of appropriate algorithms based on operand types

### **Type Conversion System**

- **`ConversionRegistry`**: Manages all type-to-type conversions
- **`ConversionEngine`**: Finds optimal conversion paths automatically
- **Lazy conversion**: Operations convert types only when necessary

### **Parser Architecture**

- **`SimpleParser`**: Recursive descent parser with tokenization
- **Flexible output**: Can produce any supported ordinal type
- **Error handling**: Clear error messages with position information

### **Performance Features**

- **Operation budgets**: Prevents infinite loops in complex calculations
- **Efficient algorithms**: Optimized implementations for common operations
- **Caching**: Results cached where appropriate to avoid recomputation

### **Modern Architecture (TypeScript + ES6 Modules)**

- **TypeScript migration**: Full type safety with strict mode enabled
- **ES6 modules**: Proper dependency management and imports
- **Factory pattern**: Circular dependency resolution via `OrdinalFactory`
- **Singleton pattern**: Operations accessible via `getOperations()` from `OperationsSingleton`
- **Backward compatible**: Window globals maintained for test files and console debugging
- **Import patterns**: See `DEVELOPMENT.md` for ES6 import examples

## File Structure

```
TransfiniteOrdinalCalculator/
├── src/                                # ES6 Module Source (New System)
│   ├── main.js                         # Main entry point
│   ├── types/                          # Ordinal type implementations
│   │   ├── OrdinalBase.js              # Base class defining ordinal contract
│   │   ├── FiniteOrdinal.js            # Natural numbers
│   │   ├── CNFOrdinal.js               # Cantor Normal Form
│   │   ├── ENFOrdinal.js               # Epsilon Normal Form
│   │   └── [13 more type files]
│   ├── operations/                     # Arithmetic operation engines
│   │   ├── Operations.js               # Main operations registry
│   │   ├── RuleEngine.js               # Rule matching and application
│   │   ├── AdditionRules.js            # Addition operation rules
│   │   └── [7 more operation files]
│   ├── conversions/                    # Type conversion system
│   │   ├── ConversionRegistry.js       # Conversion registry
│   │   └── ConversionEngine.js         # Conversion path finding
│   ├── SimpleParser.js                 # Expression parser
│   ├── SimpleCalculator.js             # Calculator logic
│   ├── SimpleRenderer.js               # Result rendering
│   ├── ordinal_mapping.js              # f(α) ordinal-to-real mapping
│   ├── ordinal_mapping_inverse.js      # fInverse(x) real-to-ordinal mapping
│   └── script.js                       # UI interaction logic
├── dist/                               # Production Build (Generated)
│   ├── index.html                      # Built HTML
│   └── assets/                         # Bundled JS, CSS, images
│       ├── bundle.js                   # Optimized bundle (~118KB)
│       ├── index-new.css               # Bundled styles
│       └── epsilonOmega.png            # Favicon
├── public/                             # Static Assets
│   ├── style.css                       # Original CSS
│   └── epsilonOmega.png                # Original favicon
├── tests/                              # Test Suites
│   ├── ordinal_enf_test.html           # ENF tests
│   ├── ordinal_calculator_test.html    # Calculator tests
│   └── [15 more test files]
├── src/                                # TypeScript source files
│   ├── types/                          # Ordinal type classes
│   ├── operations/                     # Arithmetic operations
│   └── conversions/                    # Type conversion system
├── index.html                          # Main calculator
├── index-tests.html                    # Test loader
├── package.json                        # npm configuration
├── tsconfig.json                       # TypeScript configuration
├── vite.config.ts                      # Vite build configuration
├── COMPREHENSIVE_DOCUMENTATION.md      # Complete project documentation
├── AGENT_DOCUMENTATION.md              # Development best practices
└── README.md                           # This file
```

## Local Development

### **Setup**

Clone the repository and install dependencies:

```bash
git clone https://github.com/MeniRosenfeld/TransfiniteOrdinalCalculator.git
cd TransfiniteOrdinalCalculator
npm install
```

### **Running Locally**

**⚡ Quick Start (For Development):**

```bash
npm run dev          # Start dev server → http://localhost:3000
```

Changes to `src/` files hot-reload instantly! See `DEVELOPMENT.md` for full workflow guide.

**📦 Other Commands:**

```bash
npm run build        # Build production bundle → dist/
npm run preview      # Preview production build → http://localhost:4173
```

**Legacy Method (Direct file access):**
The original `index.html` still works by opening directly in a browser, or via a simple HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### **Project Structure**

```
├── src/                  # ES6 module source code (new system)
├── dist/                 # Optimized production build (generated)
├── public/               # Static assets (style.css, images)
├── tests/                # Test suites
├── [root .js files]      # Original source files (legacy)
└── package.json          # npm configuration
```

### **Testing**

**New ES6 Module System:**

- **Test Index:** Open `index-tests.html` for all test links
- **Main Test Suite:** Open `tests/ordinal_enf_test.html`
- **Calculator Tests:** Open `tests/ordinal_calculator_test.html`

**Legacy System (for comparison):**

- **Main Test Suite:** Open `tests/ordinal_enf_test.html`
- **Enhanced Parser Tests:** Open `tests/enhanced_parser_test.html`
- **Arithmetic Laws Tests:** Open `tests/arithmetic_laws_test.html`
- **Immutability Tests:** Open `tests/immutability_test.html`
- **Conversion Testing:** Open `tests/conversion_debug.html`
- **Architecture Tests:** Open `tests/new_system_smoke_tests.html`
- **Comparison Debugging:** Open `tests/debug_enf.html`

## Technologies Used

- **HTML5** with semantic markup
- **CSS3** with mathematical typography
- **ES6 Modules** with modern JavaScript (ES2020+ for BigInt support)
- **[Vite](https://vitejs.dev/)** for development and production builds
- **TypeScript** (configured for gradual migration)
- **[html2canvas](https://html2canvas.hertzen.com/)** for image export

### **Build System**

The project uses a modern build system with dual compatibility:

- **Development:** Fast hot-reload with Vite dev server
- **Production:** Optimized bundled builds (~118KB minified)
- **Legacy Support:** Original script-tag loading still works for backward compatibility

## Mathematical Background

### **Ordinal Numbers**

Ordinal numbers extend natural numbers into the transfinite, representing well-ordered sets. Key ordinals include:

- **ω** (omega): First infinite ordinal
- **ε₀** (epsilon-zero): First epsilon number, where ω^ε₀ = ε₀
- **ζ₀** (zeta-zero): First zeta number, limit of epsilon tower

### **Normal Forms**

- **Cantor Normal Form (CNF)**: Represents ordinals < ε₀ as finite sums of omega powers
- **Epsilon Normal Form (ENF)**: Extends CNF to handle epsilon numbers up to Γ₀

### **Ordinal Arithmetic**

- **Non-commutative**: α + β ≠ β + α in general
- **Left-distributive**: α(β + γ) = αβ + αγ, but (β + γ)α ≠ βα + γα
- **Tetration**: Iterated exponentiation creating tower structures

## Development

**Developed by:** Claude Sonnet 4, with extensive guidance and testing by [Meni Rosenfeld](https://github.com/MeniRosenfeld)

**Important for Contributors:** Read `AGENT_DOCUMENTATION.md` before making changes. It contains critical architectural guidelines and common pitfalls.

**Validation:** Results validated through comprehensive test suites and comparison with [Claudio Kressibucher's Ordinal Calculator](https://www.transfinite.ch/).

**Learn More:** [The Unabashed Expanse of Ordinal Numbers](https://fieryspinningsword.com/2021/08/20/the-unabashed-expanse-of-ordinal-numbers/) by Meni Rosenfeld

### **Development Workflow**

The project currently maintains two parallel systems during migration:

**New System (src/):**

- ES6 modules with proper imports/exports
- Vite for development and building
- Optimized production bundles
- Ready for TypeScript migration

**Legacy System (root .js files):**

- Original script-tag loading
- Still functional for backward compatibility
- Used by some test files

**Making Changes:**

1. Edit files in `src/` directory
2. Run `npm run dev` to test with hot reload
3. Run `npm run build` to create production bundle
4. Test with `npm run preview`
5. Verify tests pass: open `index-tests.html` or `tests/ordinal_enf_test.html`

**Migration Status:**

- ✅ Phase 1: Infrastructure setup (complete)
- ✅ Phase 2: ES6 modules (complete)
- 🔄 Phase 3: TypeScript migration (in progress)
- ⏳ Phase 4-6: Advanced TypeScript, optimization (planned)

## Documentation

Comprehensive documentation is available:

### **For Users**

- **[README.md](README.md)** (this file) - Project overview and quick start
- **[MATHEMATICAL_BACKGROUND.md](MATHEMATICAL_BACKGROUND.md)** - Mathematical foundations

### **For Developers**

- **[COMPREHENSIVE_DOCUMENTATION.md](COMPREHENSIVE_DOCUMENTATION.md)** - Technical architecture and design
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow, testing, and ES6 imports
- **[AGENT_DOCUMENTATION.md](AGENT_DOCUMENTATION.md)** - Common pitfalls and best practices
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[TODO.md](TODO.md)** - Current roadmap and planned features

## Future Enhancements

- Support for larger ordinals (Γ₀, Veblen functions)
- Step-by-step calculation display
- Advanced error reporting with syntax highlighting
- Random ordinal generation and exploration
- More sophisticated visual rendering for deeply nested expressions
- Export to LaTeX and other mathematical formats

## License

[MIT License](LICENSE)
