// ordinal_types_new.js
// New architecture implementation of all ordinal types

// Essential constants
const ORDINAL_BRAND = Symbol.for('TransfiniteOrdinal.OrdinalBrand');
const ALLOW_EPSILON_IN_CNF = true;
const DEFAULT_OPERATION_BUDGET = 1000000;

function isOrdinal(obj) {
    return obj && obj._ordinalBrand === ORDINAL_BRAND;
}

// OperationTracer (unchanged - needed everywhere)
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

// Load essential legacy classes with minimal changes for compatibility
// These maintain the same API but will eventually use the new architecture internally

// For now, I'll include just the essential parts from the legacy file
// and gradually migrate them to the new architecture pattern

// TODO: This file will be built up incrementally
// For now, let's include the core classes needed for basic functionality

console.log('[NewTypes] New architecture types loading...');
