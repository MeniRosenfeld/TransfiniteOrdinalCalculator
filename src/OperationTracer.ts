// OperationTracer.ts
// Operation budget tracking for preventing infinite loops

export class OperationTracer {
    private budget: number;
    private count: number;

    constructor(budget: number) {
        this.budget = budget;
        this.count = 0;
    }

    consume(amount: number = 1): void {
        this.count += amount;
        if (this.count > this.budget) {
            throw new Error(`Operation budget exceeded (limit: ${this.budget}). Computation halted.`);
        }
    }

    getCount(): number {
        return this.count;
    }

    getBudget(): number {
        return this.budget;
    }

    // Static global tracer management
    private static _globalTracer: OperationTracer | null = null;

    static setGlobalTracer(budget: number): void {
        OperationTracer._globalTracer = new OperationTracer(budget);
        console.log(`[GlobalTracer] Set global tracer with budget: ${budget}`);
    }

    static consume(amount: number = 1): void {
        if (!OperationTracer._globalTracer) {
            throw new Error("Global tracer not initialized. Call OperationTracer.setGlobalTracer(budget) first.");
        }
        OperationTracer._globalTracer.consume(amount);
    }

    static getCount(): number {
        return OperationTracer._globalTracer ? OperationTracer._globalTracer.getCount() : 0;
    }

    static getBudget(): number {
        return OperationTracer._globalTracer ? OperationTracer._globalTracer.getBudget() : 0;
    }

    static reset(budget: number): void {
        OperationTracer.setGlobalTracer(budget);
    }

    static isInitialized(): boolean {
        return OperationTracer._globalTracer !== null;
    }
}

