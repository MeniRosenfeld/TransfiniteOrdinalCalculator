// OperationTracer.js
// Operation budget tracking for preventing infinite loops

class OperationTracer {
    constructor(budget) {
        this.budget = budget;
        this.count = 0;
    }

    consume(amount = 1) {
        this.count += amount;
        if (this.count > this.budget) {
            throw new Error(`Operation budget exceeded (limit: ${this.budget}). Computation halted.`);
        }
    }

    getCount() { return this.count; }
    getBudget() { return this.budget; }
    
    // Static global tracer management
    static _globalTracer = null;
    
    static setGlobalTracer(budget) {
        OperationTracer._globalTracer = new OperationTracer(budget);
        console.log(`[GlobalTracer] Set global tracer with budget: ${budget}`);
    }
    
    static consume(amount = 1) {
        if (!OperationTracer._globalTracer) {
            throw new Error("Global tracer not initialized. Call OperationTracer.setGlobalTracer(budget) first.");
        }
        OperationTracer._globalTracer.consume(amount);
    }
    
    static getCount() {
        return OperationTracer._globalTracer ? OperationTracer._globalTracer.getCount() : 0;
    }
    
    static getBudget() {
        return OperationTracer._globalTracer ? OperationTracer._globalTracer.getBudget() : 0;
    }
    
    static reset(budget) {
        OperationTracer.setGlobalTracer(budget);
    }
    
    static isInitialized() {
        return OperationTracer._globalTracer !== null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperationTracer;
} else {
    // Browser global
    window.OperationTracer = OperationTracer;
}
