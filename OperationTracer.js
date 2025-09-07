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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperationTracer;
} else {
    // Browser global
    window.OperationTracer = OperationTracer;
}
