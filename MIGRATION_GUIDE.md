# Migration Guide: Window Globals to ES6 Imports

## Overview
The TransfiniteOrdinalCalculator has been modernized to use ES6 imports instead of `window` globals. This guide helps you migrate existing code to the new pattern.

**Important:** Window globals are **still available** for backward compatibility. You can migrate at your own pace.

---

## Quick Reference

### Operations Singleton

**Old (window global):**
```javascript
const result = window.OPERATIONS.add(a, b);
const comparison = window.OPERATIONS.compare(x, y);
```

**New (ES6 import):**
```javascript
import { getOperations } from './operations/OperationsSingleton.js';

const ops = getOperations();
const result = ops.add(a, b);
const comparison = ops.compare(x, y);
```

---

### Ordinal Type Constructors

**Old (window global):**
```javascript
const zero = window.ZeroOrdinal.instance();
const one = window.OneOrdinal.instance();
const finite = new window.FiniteOrdinal(42n);
const epsilon = new window.EpsilonNumber(base);
```

**New (ES6 import):**
```javascript
import { ZeroOrdinal } from './types/ZeroOrdinal.js';
import { OneOrdinal } from './types/OneOrdinal.js';
import { FiniteOrdinal } from './types/FiniteOrdinal.js';
import { EpsilonNumber } from './types/EpsilonNumber.js';

const zero = ZeroOrdinal.instance();
const one = OneOrdinal.instance();
const finite = new FiniteOrdinal(42n);
const epsilon = new EpsilonNumber(base);
```

---

### Helper Functions

**Old (window global):**
```javascript
const info = window.getTowerInfo(ordinal);
```

**New (ES6 import):**
```javascript
import { getTowerInfo } from './operations/Auxiliary.js';

const info = getTowerInfo(ordinal);
```

---

## Complete Migration Examples

### Example 1: Simple Arithmetic Test

**Before:**
```html
<script type="module">
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const a = new window.CNFOrdinal([{
        exponent: window.ZeroOrdinal.instance(),
        coefficient: 5n
    }]);
    
    const b = new window.CNFOrdinal([{
        exponent: window.ZeroOrdinal.instance(),
        coefficient: 3n
    }]);
    
    const sum = window.OPERATIONS.add(a, b);
    console.log('Sum:', sum.toString());
</script>
```

**After:**
```html
<script type="module">
    import { getOperations } from './operations/OperationsSingleton.js';
    import { CNFOrdinal } from './types/CNFOrdinal.js';
    import { ZeroOrdinal } from './types/ZeroOrdinal.js';
    
    const ops = getOperations();
    const zero = ZeroOrdinal.instance();
    
    const a = new CNFOrdinal([{
        exponent: zero,
        coefficient: 5n
    }]);
    
    const b = new CNFOrdinal([{
        exponent: zero,
        coefficient: 3n
    }]);
    
    const sum = ops.add(a, b);
    console.log('Sum:', sum.toString());
</script>
```

---

### Example 2: Comparison Test

**Before:**
```javascript
if (typeof window !== 'undefined' && window.OPERATIONS) {
    const cmp = window.OPERATIONS.compare(ordinal1, ordinal2);
    if (cmp === 0) {
        console.log('Equal');
    }
}
```

**After:**
```javascript
import { getOperations } from './operations/OperationsSingleton.js';

const ops = getOperations();
const cmp = ops.compare(ordinal1, ordinal2);
if (cmp === 0) {
    console.log('Equal');
}
```

---

### Example 3: Instance Methods

**Good news:** Instance methods like `add()`, `multiply()`, etc. already use the modern pattern internally!

```javascript
// This works the same way as before:
const result = ordinal1.add(ordinal2);
const product = ordinal1.multiply(ordinal2);
const power = ordinal1.power(ordinal2);

// Behind the scenes, these now call getOperations() instead of window.OPERATIONS
```

---

## Migration Strategy

### For Application Code

1. **Module-level imports:**
   ```javascript
   // At the top of your file
   import { getOperations } from './operations/OperationsSingleton.js';
   import { CNFOrdinal } from './types/CNFOrdinal.js';
   // ... etc
   ```

2. **Remove window checks:**
   ```javascript
   // Old:
   if (typeof window !== 'undefined' && window.OPERATIONS) {
       // ...
   }
   
   // New:
   // No check needed - imports are always available
   ```

3. **Use imported references:**
   ```javascript
   // Old: window.OPERATIONS.add(a, b)
   // New: getOperations().add(a, b)
   ```

---

### For Test Files

**Option A: Keep using window globals (easiest)**
```html
<script type="module" src="/src/main.js"></script>
<script type="module">
    // Wait for module to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use window globals as before
    const result = window.OPERATIONS.add(a, b);
</script>
```

**Option B: Import directly (modern)**
```html
<script type="module">
    import { getOperations } from '../src/operations/OperationsSingleton.js';
    import { CNFOrdinal } from '../src/types/CNFOrdinal.js';
    
    // Use imports
    const ops = getOperations();
    const result = ops.add(a, b);
</script>
```

**Recommendation:** Test files can continue using window globals indefinitely. No migration required.

---

### For Library Code

If you're writing reusable library functions:

```javascript
// my-library.js
import { getOperations } from './operations/OperationsSingleton.js';
import { CNFOrdinal } from './types/CNFOrdinal.js';

export function myUtilityFunction(ordinal) {
    const ops = getOperations();
    // ... use ops and CNFOrdinal
}
```

---

## Deprecation Timeline

| Phase | Status | Action |
|-------|--------|--------|
| **Phase 1-4** | ✅ Complete | Internal code migrated to ES6 imports |
| **Phase 5** | ✅ Complete | Test files work with both patterns |
| **Phase 6** | ✅ Complete | Documentation updated, deprecation notices added |
| **Future (Optional)** | ⏸️ On Hold | Remove window exports entirely |

**Current Status:** Window globals will remain **indefinitely** for backward compatibility.

---

## Benefits of Migration

### For Your Code

✅ **Better IDE Support**
- Auto-completion works better with imports
- Jump-to-definition works properly
- Refactoring tools work correctly

✅ **Better Type Safety**
- TypeScript knows exact types
- No need for type assertions
- Compile-time error checking

✅ **Node.js Compatible**
- Can run code in Node.js for testing
- No browser required for unit tests
- Works with standard test frameworks

✅ **Cleaner Code**
- No `typeof window !== 'undefined'` checks
- No `.js` module loading complexity
- Clear dependency graph

---

## Common Questions

### Q: Do I need to migrate my test files?
**A:** No! Test files work fine with window globals. Migrate only if you want to.

### Q: Will window globals ever be removed?
**A:** Not planned. They provide valuable backward compatibility and browser console access.

### Q: Can I mix both patterns?
**A:** Yes! You can use ES6 imports in some files and window globals in others.

### Q: What about browser console debugging?
**A:** Window globals remain available in the console. You can still do:
```javascript
> window.OPERATIONS.add(a, b)
> new window.CNFOrdinal([...])
```

### Q: Do I need to update my build process?
**A:** No! The build process handles both patterns automatically.

---

## Troubleshooting

### "getOperations() is not a function"
**Cause:** Operations singleton not initialized.
**Solution:** Ensure `main.js` is loaded and initialized before calling `getOperations()`.

### "Cannot find module './operations/OperationsSingleton.js'"
**Cause:** Wrong import path.
**Solution:** Use relative paths based on your file location:
```javascript
// From types/ folder:
import { getOperations } from '../operations/OperationsSingleton.js';

// From root src/ folder:
import { getOperations } from './operations/OperationsSingleton.js';
```

### "Circular dependency detected"
**Cause:** Importing concrete types in OrdinalBase (shouldn't happen with factory pattern).
**Solution:** The factory pattern prevents this. If you see this, report as a bug.

---

## Resources

- **Source Code:** See `src/operations/OperationsSingleton.ts` for implementation
- **Factory Pattern:** See `src/types/OrdinalFactory.ts` for circular dependency solution
- **Type Definitions:** See `src/globals.d.ts` for all window types
- **Complete Documentation:** See `WINDOW_DEPENDENCIES_REMOVED.md`

---

## Need Help?

If you encounter issues migrating your code:
1. Check if window globals still work (they should!)
2. Compare with examples in this guide
3. Review error messages for missing imports
4. Check that paths are correct relative to your file

Remember: **No rush to migrate!** Window globals work and will continue to work.
