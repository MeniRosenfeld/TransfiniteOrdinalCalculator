# Contributing to Transfinite Ordinal Calculator

Thank you for your interest in contributing! This document provides guidelines for working with the codebase.

## Getting Started

### Prerequisites
- Node.js 18+ (for npm and build tools)
- Git
- A modern code editor (VS Code recommended)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/MeniRosenfeld/TransfiniteOrdinalCalculator.git
cd TransfiniteOrdinalCalculator

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:3000` with hot-reload enabled.

## Project Architecture

### Current System (ES6 Modules)

The project uses ES6 modules with Vite for development and production builds:

```
src/                    # Active development (ES6 modules)
├── main.js             # Entry point
├── types/              # Ordinal type implementations  
├── operations/         # Arithmetic rules and engines
├── conversions/        # Type conversion system
└── [parser, UI, etc.]  # Other components

dist/                   # Production build (generated)
public/                 # Static assets
[root .js files]        # Legacy code (still functional)
```

### Development Workflow

1. **Make Changes:** Edit files in `src/` directory
2. **Test Locally:** Changes hot-reload automatically in dev server
3. **Verify:** Run tests (see Testing section below)
4. **Build:** Run `npm run build` to create production bundle
5. **Preview:** Run `npm run preview` to test production build

## Code Guidelines

### ES6 Module Patterns

**Always use explicit imports:**
```javascript
import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
```

**Always export what others need:**
```javascript
export class FiniteOrdinal extends OrdinalBase {
    // ... implementation
}

export function helperFunction() {
    // ... implementation
}
```

**Include .js extension in imports** (required for ES modules, even when migrating to TypeScript):
```javascript
import { CNFOrdinal } from './CNFOrdinal.js';  // ✅ Correct
import { CNFOrdinal } from './CNFOrdinal';     // ❌ Wrong
```

### Coding Standards

1. **Immutability**: Ordinal objects must never be mutated
2. **Operation Tracer**: Always use global tracer via `OperationTracer.consume()`
3. **Error Messages**: Include context (operation name, operand types)
4. **Documentation**: Add comments explaining complex mathematical algorithms

### Important Guidelines

Before making changes, read:
- `AGENT_DOCUMENTATION.md` - Critical architectural guidelines and common pitfalls
- `COMPREHENSIVE_DOCUMENTATION.md` - Complete project documentation
- `MIGRATION_NOTES.md` - Migration status and build system notes

## Testing

### Running Tests

**ES6 Module System (New):**
- Open `tests/ordinal_enf_test_new.html` in browser
- Open `tests/ordinal_calculator_test_new.html` in browser

**Legacy System (For Comparison):**
- Open `tests/ordinal_enf_test.html` in browser
- Open other test files in `tests/` directory

### Writing Tests

Tests follow the existing patterns in test files. For new features:
1. Add test cases to appropriate test file
2. Verify tests pass in both old and new systems (if applicable)
3. Document expected behavior

### Verification Checklist

Before submitting changes:
- [ ] Code works in `npm run dev`
- [ ] Production build succeeds: `npm run build`
- [ ] Tests pass: check `tests/ordinal_enf_test_new.html`
- [ ] No console errors in browser
- [ ] Original `index.html` still works (backward compatibility)

## Common Tasks

### Adding a New Ordinal Type

1. Create `src/types/NewOrdinalType.js`
2. Extend `OrdinalBase`
3. Implement all required methods
4. Add conversion support
5. Register in `src/operations/Operations.js`
6. Add tests

See `COMPREHENSIVE_DOCUMENTATION.md` for detailed guide.

### Adding a New Operation

1. Create `src/operations/NewOperationRules.js`
2. Define rules using `Rule` class
3. Add to `Operations.js` initialization
4. Test thoroughly

## Build System

### Development Mode
```bash
npm run dev
```
- Vite dev server with hot reload
- Source maps for debugging
- Fast compilation

### Production Build
```bash
npm run build
```
- Optimized bundle
- Minified code
- Tree-shaking removes unused code
- Outputs to `dist/`

### Preview Production Build
```bash
npm run preview
```
- Serves `dist/` folder
- Test production bundle locally

## Migration Status

The project is currently in **Phase 2 (ES6 Modules)** of a multi-phase migration to TypeScript:

- ✅ Phase 1: Infrastructure (Complete)
- ✅ Phase 2: ES6 Modules (Complete)
- ⏳ Phase 3: TypeScript Core Types (Next)
- ⏳ Phase 4: TypeScript Operations
- ⏳ Phase 5: TypeScript Parser/UI
- ⏳ Phase 6: Strict Mode & Optimization

During migration:
- Work in `src/` directory (ES6 modules)
- Original files in root still work
- Both systems tested in parallel

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Documentation**: See `COMPREHENSIVE_DOCUMENTATION.md`
- **Architecture**: See `AGENT_DOCUMENTATION.md`
- **Migration**: See `MIGRATION_NOTES.md`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

