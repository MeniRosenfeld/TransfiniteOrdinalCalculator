/**
 * Operations Singleton Pattern
 * 
 * Provides global access to the Operations instance without using window object.
 * This enables proper TypeScript imports, Node.js compatibility, and better testability.
 */

import type { Operations } from './Operations.js';

let operationsInstance: Operations | null = null;

/**
 * Get the global Operations instance.
 * @throws {Error} If operations have not been initialized
 */
export function getOperations(): Operations {
    if (!operationsInstance) {
        throw new Error('Operations not initialized. Call initializeOperations() first.');
    }
    return operationsInstance;
}

/**
 * Initialize the global Operations instance.
 * Should be called once during application startup.
 */
export function initializeOperations(ops: Operations): void {
    if (operationsInstance) {
        console.warn('Operations already initialized. Replacing existing instance.');
    }
    operationsInstance = ops;
}

/**
 * Check if operations have been initialized.
 */
export function isOperationsInitialized(): boolean {
    return operationsInstance !== null;
}

/**
 * Clear the operations instance (primarily for testing).
 */
export function clearOperations(): void {
    operationsInstance = null;
}
