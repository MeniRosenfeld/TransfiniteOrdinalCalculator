// OperationTracer.ts
// Operation budget tracking for preventing infinite loops

/**
 * Operation budget tracking system for preventing infinite loops and limiting computation.
 * 
 * The calculator uses a global static tracer that all operations consume from.
 * This prevents infinite recursion and provides fail-fast behavior when computations
 * become too expensive.
 * 
 * **Architecture:**
 * - Single global static tracer (no per-object tracers)
 * - Applications initialize: `OperationTracer.setGlobalTracer(budget)`
 * - Operations consume: `OperationTracer.consume(amount)`
 * - Exception thrown when budget exceeded
 * 
 * **Performance Benefits:**
 * - Eliminates per-object tracer overhead
 * - Enables linear O(n) algorithms instead of quadratic O(n²) with cloning
 * - True immutability without performance penalty
 * 
 * @example
 * // Initialize at application start
 * OperationTracer.setGlobalTracer(1000000);
 * 
 * // Operations automatically consume budget
 * const result = ordinalA.add(ordinalB);
 * 
 * // Reset for new calculation
 * OperationTracer.reset(500000);
 * 
 * // Check consumption
 * console.log(`Used ${OperationTracer.getCount()} operations`);
 */
export class OperationTracer {
    private budget: number;
    private count: number;

    /**
     * Creates a new OperationTracer instance.
     * Note: Applications should use static methods instead of creating instances directly.
     * 
     * @param budget - Maximum number of operations allowed
     */
    constructor(budget: number) {
        this.budget = budget;
        this.count = 0;
    }

    /**
     * Consumes budget for an operation.
     * 
     * @param amount - Number of operations to consume (default: 1)
     * @throws {Error} If budget is exceeded
     */
    consume(amount: number = 1): void {
        this.count += amount;
        if (this.count > this.budget) {
            throw new Error(`Operation budget exceeded (limit: ${this.budget}). Computation halted.`);
        }
    }

    /**
     * Returns the current operation count.
     * 
     * @returns Number of operations consumed so far
     */
    getCount(): number {
        return this.count;
    }

    /**
     * Returns the budget limit.
     * 
     * @returns Maximum number of operations allowed
     */
    getBudget(): number {
        return this.budget;
    }

    // === STATIC GLOBAL TRACER MANAGEMENT ===

    private static _globalTracer: OperationTracer | null = null;

    /**
     * Initializes the global tracer with the specified budget.
     * This must be called before any ordinal operations are performed.
     * 
     * @param budget - Maximum number of operations allowed
     * @example
     * OperationTracer.setGlobalTracer(1000000);
     */
    static setGlobalTracer(budget: number): void {
        OperationTracer._globalTracer = new OperationTracer(budget);
        //console.log(`[GlobalTracer] Set global tracer with budget: ${budget}`);
    }

    /**
     * Consumes from the global operation budget.
     * Called automatically by all ordinal operations.
     * 
     * @param amount - Number of operations to consume (default: 1)
     * @throws {Error} If global tracer not initialized
     * @throws {Error} If budget is exceeded
     * @example
     * OperationTracer.consume(5);  // Consume 5 operations
     */
    static consume(amount: number = 1): void {
        if (!OperationTracer._globalTracer) {
            throw new Error("Global tracer not initialized. Call OperationTracer.setGlobalTracer(budget) first.");
        }
        OperationTracer._globalTracer.consume(amount);
    }

    /**
     * Returns the current global operation count.
     * 
     * @returns Number of operations consumed, or 0 if not initialized
     * @example
     * console.log(`Used ${OperationTracer.getCount()} operations`);
     */
    static getCount(): number {
        return OperationTracer._globalTracer ? OperationTracer._globalTracer.getCount() : 0;
    }

    /**
     * Returns the global budget limit.
     * 
     * @returns Maximum operations allowed, or 0 if not initialized
     */
    static getBudget(): number {
        return OperationTracer._globalTracer ? OperationTracer._globalTracer.getBudget() : 0;
    }

    /**
     * Resets the global tracer with a new budget.
     * Useful for starting a fresh calculation with a new budget.
     * 
     * @param budget - New maximum number of operations allowed
     * @example
     * // Reset for next calculation
     * OperationTracer.reset(500000);
     */
    static reset(budget: number): void {
        OperationTracer.setGlobalTracer(budget);
    }

    /**
     * Checks if the global tracer has been initialized.
     * 
     * @returns True if global tracer is ready, false otherwise
     * @example
     * if (!OperationTracer.isInitialized()) {
     *     OperationTracer.setGlobalTracer(1000000);
     * }
     */
    static isInitialized(): boolean {
        return OperationTracer._globalTracer !== null;
    }
}

