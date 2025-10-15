# Operations Singleton Fix

## Problem

After implementing the Operations Singleton pattern, test files and the slider functionality were failing with:

```
Error: Operations not initialized. Call initializeOperations() first.
```

## Root Causes

1. **Auto-initialization conflict**: `Operations.ts` had auto-initialization code with a 100ms delay that conflicted with explicit initialization in `main.ts`
2. **Test compatibility**: Test files call `OPERATIONS.initialize()` but didn't know about the singleton pattern

## Solution

### Part 1: Remove Auto-Initialization (Operations.ts)

Removed the DOMContentLoaded auto-initialization code from `Operations.ts` since `main.ts` now explicitly handles initialization:

```typescript
// REMOVED:
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            OPERATIONS.initialize();
        }, 100);
    });
}

// REPLACED WITH:
// Note: OPERATIONS is explicitly initialized in main.ts after all types are loaded.
// Do not auto-initialize here to avoid race conditions.
```

### Part 2: Auto-Initialize from window.OPERATIONS (OperationsSingleton.ts)

Made `getOperations()` automatically initialize from `window.OPERATIONS` if available:

```typescript
export function getOperations(): Operations {
    if (!operationsInstance) {
        // Auto-initialize from window.OPERATIONS if available (for test compatibility)
        if (typeof window !== 'undefined' && (window as any).OPERATIONS) {
            console.warn('[OperationsSingleton] Auto-initializing from window.OPERATIONS');
            initializeOperations((window as any).OPERATIONS);
            return operationsInstance!;
        } else {
            throw new Error('Operations not initialized. Call initializeOperations() first.');
        }
    }
    return operationsInstance;
}
```

### Part 3: Export initializeOperations to Window (main.ts)

Added `initializeOperations` to window exports for test files that want explicit control:

```typescript
window.initializeOperations = initializeOperations;
```

And updated `globals.d.ts`:

```typescript
interface Window {
    // ...
    initializeOperations: (operations: Operations) => void;
}
```

### Part 4: Update Test Files (Optional)

Updated key test files to explicitly call `initializeOperations()` after calling `OPERATIONS.initialize()`:

- `tests/ordinal_enf_test_new.html`
- `tests/ordinal_calculator_test_new.html`

This is optional because the auto-initialization in `getOperations()` handles it, but explicit initialization is clearer.

## Result

- ✅ Main application initializes explicitly in `main.ts`
- ✅ Test files work automatically via auto-initialization
- ✅ Test files can optionally call `initializeOperations()` explicitly
- ✅ No more race conditions
- ✅ All errors resolved

## Initialization Flow

### Main Application (index.html)
1. `main.ts` loads
2. `OPERATIONS.initialize()` called
3. `initializeOperations(OPERATIONS)` called
4. `initializeUI()` called
5. ✅ Singleton ready

### Test Files (*.html)
1. Load `main.js` (exports to window)
2. Test calls `OPERATIONS.initialize()`
3. Optionally: Test calls `initializeOperations(OPERATIONS)`
4. Test code calls `getOperations()`
5. If singleton not initialized: Auto-initialize from `window.OPERATIONS`
6. ✅ Singleton ready

## Files Changed

- `src/operations/Operations.ts` - Removed auto-initialization
- `src/operations/OperationsSingleton.ts` - Added auto-initialization fallback
- `src/main.ts` - Exported `initializeOperations` to window
- `src/globals.d.ts` - Added `initializeOperations` type declaration
- `tests/ordinal_enf_test_new.html` - Added explicit singleton initialization
- `tests/ordinal_calculator_test_new.html` - Added explicit singleton initialization
