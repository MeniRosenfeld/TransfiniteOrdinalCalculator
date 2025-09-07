// ordinal_types_complete.js
// Complete new architecture implementation
// This will replace ordinal_types.js entirely

// Essential constants and utilities
const ORDINAL_BRAND = Symbol.for('TransfiniteOrdinal.OrdinalBrand');
const ALLOW_EPSILON_IN_CNF = true;
const DEFAULT_OPERATION_BUDGET = 1000000;

function isOrdinal(obj) {
    return obj && obj._ordinalBrand === ORDINAL_BRAND;
}

// OperationTracer (unchanged)
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

// Base class for all ordinals (from new architecture)
class OrdinalBase {
    constructor(operationTracer = null) {
        this._tracer = operationTracer;
        this._ordinalBrand = ORDINAL_BRAND;
    }

    // Universal interface - all types must implement these
    isZero() { throw new Error(`${this.constructor.name} must implement isZero()`); }
    isFinite() { throw new Error(`${this.constructor.name} must implement isFinite()`); }
    complexity() { throw new Error(`${this.constructor.name} must implement complexity()`); }
    toString() { throw new Error(`${this.constructor.name} must implement toString()`); }
    clone(newTracer = null) { throw new Error(`${this.constructor.name} must implement clone()`); }

    // Binary operations - delegate to legacy dispatchers for now
    add(other) { return addOrdinals(this, other); }
    multiply(other) { return multiplyOrdinals(this, other); }
    power(other) { return powerOrdinals(this, other); }
    tetrate(other) { return tetrateOrdinals(this, other); }
    equals(other) { return this.compareTo(other) === 0; }
    compareTo(other) { throw new Error(`${this.constructor.name} must implement compareTo()`); }

    // Display methods
    toDisplayString(options = {}) {
        const format = options.format || 'ENF';
        if (format === 'CNF' && typeof this.toStringCNF === 'function') {
            return this.toStringCNF();
        }
        return this.toString();
    }

    // Conversion support (for future new architecture)
    isOrdinal() { return true; }

    // Simplify method - universal contract
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        // Fallback to 0 if doesn't fit
        const zero = CNFOrdinal.ZEROStatic().clone(this._tracer);
        return {
            simplifiedOrdinal: zero,
            remainingBudget: complexityBudget
        };
    }
}

// CNFOrdinal - complete implementation maintaining legacy API
class CNFOrdinal extends OrdinalBase {
    constructor(initVal, operationTracer = null) {
        super(operationTracer);
        this.terms = [];

        if (initVal === undefined || initVal === null) {
            // Default to 0
        } else if (typeof initVal === 'number' || typeof initVal === 'bigint') {
            const val = BigInt(initVal);
            if (val < 0n) {
                throw new Error("CNFOrdinal cannot represent negative values.");
            }
            if (val > 0n) {
                this.terms.push({ exponent: CNFOrdinal.ZEROStatic(), coefficient: val });
            }
        } else if (Array.isArray(initVal)) {
            this.terms = initVal.map(t => ({
                exponent: t.exponent.clone(this._tracer),
                coefficient: t.coefficient
            }));
        } else if (typeof initVal === 'object' && initVal.constructor) {
            if (initVal instanceof CNFOrdinal) {
                this.terms = initVal.terms.map(t => ({
                    exponent: t.exponent.clone(this._tracer),
                    coefficient: t.coefficient
                }));
            } else {
                throw new Error(`Invalid Ordinal type for CNFOrdinal cloning: ${initVal.constructor.name}`);
            }
        } else {
            throw new Error(`Invalid CNFOrdinal constructor argument: ${initVal}`);
        }
    }

    // Required unary methods
    isZero() { return this.terms.length === 0; }
    isFinite() { return this.terms.length === 0 || (this.terms.length === 1 && this.terms[0].exponent.isZero()); }

    complexity() {
        if (this._tracer) this._tracer.consume();
        if (this.isZero()) return 0;
        if (this.isFinite()) return this.terms[0].coefficient.toString().length;

        // Simplified complexity for now - full logic can be migrated later
        let total = 0;
        for (const term of this.terms) {
            total += 5; // Base cost per term
            if (term.exponent && typeof term.exponent.complexity === 'function') {
                total += term.exponent.complexity();
            }
            total += term.coefficient.toString().length;
        }
        return total;
    }

    toString() { return this.toStringCNF(); }

    toStringCNF() {
        if (this.isZero()) return "0";
        return this.terms.map(term => {
            const coeff = term.coefficient;
            const exp = term.exponent;
            if (exp.isZero()) return coeff.toString();

            let expStr;
            if (exp.equals(CNFOrdinal.ONEStatic())) {
                expStr = "w";
            } else {
                const expCNF = exp.toStringCNF();
                const needsParen = !(exp.isFinite() || exp.isOmega() || exp.isOmegaPower());
                expStr = needsParen ? `w^(${expCNF})` : `w^${expCNF}`;
            }

            return coeff === 1n ? expStr : `${expStr}*${coeff.toString()}`;
        }).join("+");
    }

    clone(newTracer = null) {
        return new CNFOrdinal(this, newTracer || this._tracer);
    }

    // Comparison (maintains legacy behavior)
    compareTo(other) {
        if (this._tracer) this._tracer.consume();

        if (!(other instanceof CNFOrdinal)) {
            throw new Error("Cannot compare CNFOrdinal with unknown ordinal type.");
        }

        if (this.isZero() && other.isZero()) return 0;
        if (this.isZero()) return -1;
        if (other.isZero()) return 1;

        const lenThis = this.terms.length;
        const lenOther = other.terms.length;
        const minLen = Math.min(lenThis, lenOther);

        for (let i = 0; i < minLen; i++) {
            const thisTerm = this.terms[i];
            const otherTerm = other.terms[i];

            const expComparison = thisTerm.exponent.compareTo(otherTerm.exponent);
            if (expComparison !== 0) return expComparison;

            if (thisTerm.coefficient < otherTerm.coefficient) return -1;
            if (thisTerm.coefficient > otherTerm.coefficient) return 1;
        }

        if (lenThis < lenOther) return -1;
        if (lenThis > lenOther) return 1;
        return 0;
    }

    // Utility methods
    isOmega() {
        return this.terms.length === 1 &&
            this.terms[0].exponent.equals(CNFOrdinal.ONEStatic()) &&
            this.terms[0].coefficient === 1n;
    }

    isOmegaPower() {
        return this.terms.length === 1 && this.terms[0].coefficient === 1n && !this.terms[0].exponent.isZero();
    }

    getFinitePart() {
        if (this.isZero()) return 0n;
        if (this.isFinite()) return this.terms[0].coefficient;
        const lastTerm = this.terms[this.terms.length - 1];
        return lastTerm.exponent.isZero() ? lastTerm.coefficient : 0n;
    }

    getLeadingTerm() {
        return this.terms.length > 0 ? this.terms[0] : null;
    }

    // Static factory methods
    static fromInt(value, tracer = null) {
        return new CNFOrdinal(value, tracer);
    }

    static ZEROStatic() {
        if (!CNFOrdinal._zeroInstance) {
            CNFOrdinal._zeroInstance = new CNFOrdinal(0n);
        }
        return CNFOrdinal._zeroInstance;
    }

    static ONEStatic() {
        if (!CNFOrdinal._oneInstance) {
            CNFOrdinal._oneInstance = new CNFOrdinal(1n);
        }
        return CNFOrdinal._oneInstance;
    }

    static OMEGAStatic() {
        if (!CNFOrdinal._omegaInstance) {
            const omega = new CNFOrdinal();
            omega.terms = [{
                exponent: CNFOrdinal.ONEStatic(),
                coefficient: 1n
            }];
            CNFOrdinal._omegaInstance = omega;
        }
        return CNFOrdinal._omegaInstance;
    }
}

// Initialize static instances
CNFOrdinal.ZEROStatic();
CNFOrdinal.ONEStatic();
CNFOrdinal.OMEGAStatic();

console.log('[OrdinalTypes] New architecture ordinal types loaded');
