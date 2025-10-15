# Plan: Remove Window Dependencies

## Overview
Remove all `window` object dependencies from the TypeScript codebase and replace with proper ES6 imports and dependency injection. This will make the code:
- ✅ More maintainable and testable
- ✅ Compatible with Node.js environments
- ✅ Better for tree-shaking and bundling
- ✅ Properly typed without global pollution

## Current State Analysis

### Window Usage Patterns:

1. **`window.OPERATIONS`** - Global operations singleton (83 occurrences)
   - Used in: OrdinalBase, ENFOrdinal, ENFTerm, EpsilonTunnelOrdinal
   - Methods: add, multiply, power, tetrate, compare, convert, canConvert

2. **Ordinal Type Constructors** (47 occurrences)
   - `window.FiniteOrdinal` - Create finite ordinals
   - `window.ZeroOrdinal` - Zero singleton
   - `window.OneOrdinal` - One singleton  
   - `window.EpsilonNumber` - Epsilon numbers
   - `window.ZetaZero` - Zeta zero
   - `window.EpsilonTunnelOrdinal` - Epsilon tunnels
   - `window.CNFOrdinal` - CNF ordinals

3. **Global Functions** (in CNFOrdinal.ts)
   - `window.getTowerInfo` - Tower information helper

### Files Affected:
- `src/types/OrdinalBase.ts` - 25+ occurrences
- `src/types/ENFOrdinal.ts` - 5 occurrences  
- `src/types/ENFTerm.ts` - 8 occurrences
- `src/types/EpsilonTunnelOrdinal.ts` - 3 occurrences
- `src/types/CNFOrdinal.ts` - 2 occurrences
- `src/RenderingComponents.ts` - 3 occurrences

---

## Phase 1: Create Operations Singleton Pattern

### Step 1.1: Create Operations Singleton
**File:** `src/operations/OperationsSingleton.ts`

```typescript
// Singleton pattern for global operations access
import { Operations } from './Operations.js';

let operationsInstance: Operations | null = null;

export function getOperations(): Operations {
    if (!operationsInstance) {
        throw new Error('Operations not initialized. Call initializeOperations() first.');
    }
    return operationsInstance;
}

export function initializeOperations(ops: Operations): void {
    operationsInstance = ops;
}

export function isOperationsInitialized(): boolean {
    return operationsInstance !== null;
}
```

**Benefits:**
- Single source of truth
- Proper error handling
- No window pollution
- Easy to mock for testing

### Step 1.2: Update main.ts
Replace `window.OPERATIONS` assignment with:
```typescript
import { initializeOperations } from './operations/OperationsSingleton.js';

const ops = new Operations();
await ops.initialize();
initializeOperations(ops);

// Keep window.OPERATIONS for backward compatibility (temporarily)
window.OPERATIONS = ops;
```

### Step 1.3: Replace window.OPERATIONS in Code
**Files to update:**
- `src/types/OrdinalBase.ts` (8 occurrences)
- `src/types/ENFOrdinal.ts` (3 occurrences)
- `src/types/ENFTerm.ts` (6 occurrences)
- `src/types/EpsilonTunnelOrdinal.ts` (2 occurrences)

**Pattern:**
```typescript
// BEFORE:
if (typeof window !== 'undefined' && window.OPERATIONS) {
    return window.OPERATIONS.compare(this, other);
}

// AFTER:
import { getOperations } from '../operations/OperationsSingleton.js';

equals(other: OrdinalBase): boolean {
    return getOperations().compare(this, other) === 0;
}
```

---

## Phase 2: Replace Ordinal Type Constructors with Factory Pattern

### Step 2.1: Create OrdinalFactory.ts

**Problem:** Direct imports in OrdinalBase.ts create circular dependencies because:
- `OrdinalBase` needs to instantiate `FiniteOrdinal`, `ZeroOrdinal`, etc.
- These classes extend `OrdinalBase`
- This causes "can't access lexical declaration before initialization" errors

**Solution:** Create a factory pattern with lazy initialization:

### Step 2.2: Update OrdinalBase.ts

**Current problematic methods:**
- `leftPredecessor()` - uses `window.FiniteOrdinal`
- `successor()` - uses `window.OneOrdinal`
- `tunnel()` - uses `window.ZetaZero`, `window.ZeroOrdinal`, `window.EpsilonNumber`, `window.EpsilonTunnelOrdinal`

**Solution:** Use factory functions instead of direct imports:

```typescript
import { 
    createFiniteOrdinal,
    getZeroOrdinal,
    getOneOrdinal,
    createEpsilonNumber,
    createZetaZero,
    createEpsilonTunnelOrdinal
} from './OrdinalFactory.js';
```

**Replace:**
```typescript
// BEFORE:
leftPredecessor(): OrdinalBase {
    if (this.isZero()) {
        throw new Error("Cannot take left predecessor of zero");
    }
    if (this.isFinite()) {
        const n = this.getFiniteBigInt();
        if (typeof window !== 'undefined' && window.FiniteOrdinal) {
            return new window.FiniteOrdinal(n - 1n);
        }
        throw new Error('FiniteOrdinal not available');
    }
    return this;
}

// AFTER:
leftPredecessor(): OrdinalBase {
    if (this.isZero()) {
        throw new Error("Cannot take left predecessor of zero");
    }
    if (this.isFinite()) {
        const n = this.getFiniteBigInt();
        return createFiniteOrdinal(n - 1n);
    }
    return this;
}
```

### Step 2.3: Initialize Factory in main.ts

**Critical:** The factory must be initialized BEFORE any ordinal operations are performed:

```typescript
import { initializeOrdinalFactory } from './types/OrdinalFactory.js';

// Initialize OrdinalFactory to avoid circular dependencies
initializeOrdinalFactory({
    FiniteOrdinal,
    ZeroOrdinal,
    OneOrdinal,
    EpsilonNumber,
    ZetaZero,
    EpsilonTunnelOrdinal
});
console.log('[Main] OrdinalFactory initialized');
```

### Step 2.4: Update all methods in OrdinalBase.ts
```typescript
// BEFORE:
tunnel(): OrdinalBase {
    if (!this.isFinite()) {
        if (typeof window !== 'undefined' && window.ZetaZero) {
            return new window.ZetaZero();
        }
        throw new Error('ZetaZero not available');
    }
    
    const n = this.getFiniteBigInt();
    
    if (n === 0n) {
        if (typeof window !== 'undefined' && window.ZeroOrdinal && window.ZeroOrdinal.instance) {
            return window.ZeroOrdinal.instance();
        }
        throw new Error('ZeroOrdinal not available');
    }
    
    if (n > 0n && n <= 10n) {
        if (typeof window !== 'undefined' && window.ZeroOrdinal && window.EpsilonNumber) {
            let result: OrdinalBase = window.ZeroOrdinal.instance();
            for (let i = 0n; i < n; i++) {
                result = new window.EpsilonNumber(result) as OrdinalBase;
            }
            return result;
        }
        throw new Error('EpsilonNumber or ZeroOrdinal not available');
    }
    
    if (typeof window !== 'undefined' && window.EpsilonTunnelOrdinal) {
        return new window.EpsilonTunnelOrdinal(n);
    }
    throw new Error('EpsilonTunnelOrdinal not available');
}

// AFTER:
tunnel(): OrdinalBase {
    if (!this.isFinite()) {
        return new ZetaZero();
    }
    
    const n = this.getFiniteBigInt();
    
    if (n === 0n) {
        return ZeroOrdinal.instance();
    }
    
    if (n > 0n && n <= 10n) {
        let result: OrdinalBase = ZeroOrdinal.instance();
        for (let i = 0n; i < n; i++) {
            result = new EpsilonNumber(result);
        }
        return result;
    }
    
    return new EpsilonTunnelOrdinal(n);
}
```

### Step 2.4: Update ENFOrdinal.ts
```typescript
// Add import at top:
import { getOperations } from '../operations/OperationsSingleton.js';

// Replace window.OPERATIONS.compare calls:
// BEFORE:
if (typeof window !== 'undefined' && window.OPERATIONS) {
    const comparison = window.OPERATIONS.compare(leadingFactor.base, k);
    // ...
}

// AFTER:
const comparison = getOperations().compare(leadingFactor.base, k);
```

### Step 2.5: Update ENFTerm.ts
```typescript
// Add import:
import { getOperations } from '../operations/OperationsSingleton.js';

// Replace all window.OPERATIONS calls
```

### Step 2.6: Update EpsilonTunnelOrdinal.ts
```typescript
// Add import:
import { getOperations } from '../operations/OperationsSingleton.js';

// Replace window.OPERATIONS.conversionEngine
```

### Step 2.7: Update RenderingComponents.ts
```typescript
// Add import:
import { CNFOrdinal } from './types/CNFOrdinal.js';

// BEFORE:
if (exponent.constructor.name === 'CNFOrdinal' && exponent.equals && 
    typeof window !== 'undefined' && window.CNFOrdinal && window.CNFOrdinal.ONEStatic) {
    const one = window.CNFOrdinal.ONEStatic();
    // ...
}

// AFTER:
if (exponent instanceof CNFOrdinal && exponent.equals) {
    const one = CNFOrdinal.ONEStatic();
    // ...
}
```

---

## Phase 3: Handle getTowerInfo Global Function

### Step 3.1: Create TowerInfoService
**File:** `src/services/TowerInfoService.ts`

```typescript
import type { OrdinalBase } from '../types/OrdinalBase.js';

interface TowerInfo {
    mptOrdinalForG: OrdinalBase;
    numOmegas: number;
    // ... other fields
}

let towerInfoFunction: ((ordinal: OrdinalBase) => TowerInfo) | null = null;

export function setTowerInfoFunction(fn: (ordinal: OrdinalBase) => TowerInfo): void {
    towerInfoFunction = fn;
}

export function getTowerInfo(ordinal: OrdinalBase): TowerInfo {
    if (!towerInfoFunction) {
        throw new Error('TowerInfo function not initialized');
    }
    return towerInfoFunction(ordinal);
}

export function hasTowerInfo(): boolean {
    return towerInfoFunction !== null;
}
```

### Step 3.2: Update CNFOrdinal.ts
```typescript
// Add import:
import { getTowerInfo, hasTowerInfo } from '../services/TowerInfoService.js';

// BEFORE:
if (typeof window !== 'undefined' && window.getTowerInfo) {
    const towerInfo_this = window.getTowerInfo(E_this);
    // ...
}

// AFTER:
if (hasTowerInfo()) {
    const towerInfo_this = getTowerInfo(E_this);
    // ...
}
```

### Step 3.3: Update main.ts
```typescript
import { setTowerInfoFunction } from './services/TowerInfoService.js';

// Initialize tower info
setTowerInfoFunction(computeTowerInfo); // wherever this function is defined

// Keep window.getTowerInfo for backward compatibility (temporarily)
window.getTowerInfo = computeTowerInfo;
```

---

## Phase 4: Update main.ts Exports

### Step 4.1: Current main.ts Structure
Review what's exported to `window` and ensure proper initialization order.

### Step 4.2: Keep Backward Compatibility (Temporary)
During transition, maintain both:
```typescript
// Modern approach
import { getOperations } from './operations/OperationsSingleton.js';

// Legacy approach (for backward compatibility)
window.OPERATIONS = getOperations();
```

### Step 4.3: Add Deprecation Warnings (Optional)
```typescript
Object.defineProperty(window, 'OPERATIONS', {
    get() {
        console.warn('window.OPERATIONS is deprecated. Use getOperations() instead.');
        return getOperations();
    }
});
```

---

## Phase 5: Update Tests

### Step 5.1: Test File Updates
All test files need to import properly:
```typescript
// BEFORE (test files):
// Relied on window.OPERATIONS being available

// AFTER:
import { getOperations } from '../src/operations/OperationsSingleton.js';
import { FiniteOrdinal } from '../src/types/FiniteOrdinal.js';
```

### Step 5.2: Test Initialization
Ensure tests properly initialize operations:
```typescript
import { Operations } from '../src/operations/Operations.js';
import { initializeOperations } from '../src/operations/OperationsSingleton.js';

beforeAll(async () => {
    const ops = new Operations();
    await ops.initialize();
    initializeOperations(ops);
});
```

---

## Phase 6: Remove window Exports (Final Cleanup)

### Step 6.1: Remove Temporary Backward Compatibility
After all code and tests are updated, remove:
```typescript
// DELETE these lines from main.ts:
window.OPERATIONS = ops;
window.getTowerInfo = computeTowerInfo;
// etc.
```

### Step 6.2: Update globals.d.ts
Remove or update window interface:
```typescript
// BEFORE:
interface Window {
    OPERATIONS: any;
    FiniteOrdinal: any;
    // etc...
}

// AFTER:
// Remove or keep minimal for console debugging only
interface Window {
    // Keep only what's truly needed for browser console access
}
```

---

## Implementation Order

1. ✅ **Phase 1** - Operations Singleton (Low risk, high value)
2. ✅ **Phase 2** - Replace Type Constructors (Medium risk)
3. ✅ **Phase 3** - TowerInfo Service (Low risk)
4. ✅ **Phase 4** - Update main.ts (Low risk)
5. ✅ **Phase 5** - Update Tests (Critical for safety)
6. ✅ **Phase 6** - Remove window exports (Final cleanup)

## Testing Strategy

After each phase:
1. ✅ Run `npm run build` - Ensure TypeScript compilation succeeds
2. ✅ Run `npm run dev` - Test in browser
3. ✅ Run all test suites - Ensure no regressions
4. ✅ Test in browser console - Verify functionality
5. ✅ Check for circular dependency warnings

## Risks & Mitigation

### Risk 1: Circular Dependencies
**Mitigation:** 
- OrdinalBase is abstract and imported by all types - shouldn't cause issues
- OperationsSingleton is a separate module
- Use type-only imports where possible: `import type { ... }`

### Risk 2: Test File Breakage
**Mitigation:**
- Keep window exports during transition
- Update test files incrementally
- Add initialization helpers for tests

### Risk 3: Browser Console Usage
**Mitigation:**
- Keep window exports for debugging
- Add helper: `window.debug = { getOperations, ... }`
- Document new console API

### Risk 4: Initialization Order
**Mitigation:**
- Operations must be initialized before ordinal operations
- Add runtime checks in getOperations()
- Document initialization requirements

## Benefits After Completion

1. ✅ **Better Type Safety** - No more `window.X` type casts
2. ✅ **Node.js Compatible** - Can run tests without browser
3. ✅ **Better IDE Support** - Proper import auto-completion
4. ✅ **Tree Shaking** - Unused code can be eliminated
5. ✅ **Easier Testing** - Mock dependencies properly
6. ✅ **Cleaner Code** - No `typeof window !== 'undefined'` checks
7. ✅ **Maintainability** - Clear dependency graph

## Estimated Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 3-4 hours  
- **Phase 3:** 1-2 hours
- **Phase 4:** 1 hour
- **Phase 5:** 2-3 hours
- **Phase 6:** 1 hour

**Total:** ~10-16 hours

## Success Criteria

- [ ] All TypeScript files compile without errors
- [ ] All tests pass
- [ ] No `window.OPERATIONS` references in src/ (except main.ts for compatibility)
- [ ] No `typeof window !== 'undefined'` checks in src/types/
- [ ] Build size same or smaller
- [ ] Browser functionality unchanged
- [ ] Browser console still works (optional exports)

---

## Next Steps

1. Review and approve this plan
2. Create feature branch: `refactor/remove-window-dependencies`
3. Implement Phase 1 first (lowest risk)
4. Test thoroughly after each phase
5. Merge when all phases complete and tested

## Alternative: Keep window for Legacy Support

If backward compatibility is critical, consider:
- Keep window exports in main.ts indefinitely
- Use modern imports internally
- Add deprecation notices
- Document both APIs
