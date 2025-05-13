// ordinal_types.js

/**
 * Represents an Ordinal number in Cantor Normal Form (CNF).
 * CNF: w^a1*c1 + w^a2*c2 + ... + w^ak*ck + n
 * where a1 > a2 > ... > ak > 0 are ordinals, and c_i, n are positive integers.
 * Internally, terms are stored as:
 * [{ exponent: CNFOrdinal, coefficient: number }, ...]
 * The finite part 'n' is represented as a term with exponent CNFOrdinal.ZERO.
 */
class CNFOrdinal {
    // terms: Array of { exponent: CNFOrdinal, coefficient: BigInt }
    // Sorted by exponent descending. Coefficients are positive BigInts.
    constructor(initVal, operationTracer = null) { // Added operationTracer
        this.terms = [];
        this._tracer = operationTracer; // For operation counting

        if (initVal === undefined || initVal === null) {
            // Default to 0
        } else if (typeof initVal === 'number' || typeof initVal === 'bigint') {
            const val = BigInt(initVal);
            if (val < 0n) {
                throw new Error(`CNFOrdinal from number: Must be a non-negative integer, got ${initVal}`);
            }
            if (val > 0n) {
                this.terms.push({ exponent: CNFOrdinal.ZEROStatic(), coefficient: val });
            }
        } else if (typeof initVal === 'string') {
            // Basic string parsing for "0", "w", or simple integers for internal use.
            // Full string parsing is handled by OrdinalParser.
            if (initVal === "0") {
                // Stays as empty terms
            } else if (initVal === "w") {
                this.terms.push({ exponent: CNFOrdinal.ONEStatic(), coefficient: 1n });
            } else if (/^\d+$/.test(initVal)) {
                const n = BigInt(initVal);
                if (n > 0n) {
                    this.terms.push({ exponent: CNFOrdinal.ZEROStatic(), coefficient: n });
                }
            } else {
                throw new Error(`CNFOrdinal from string: Basic constructor only handles "0", "w", or simple integers. Got "${initVal}"`);
            }
        } else if (Array.isArray(initVal)) {
            // Assumes initVal is an array of term objects, used internally by operations
            this.terms = initVal.map(t => {
                if (!(t.exponent instanceof CNFOrdinal) || typeof t.coefficient !== 'bigint' || t.coefficient <= 0n) {
                    throw new Error('Invalid term structure in CNFOrdinal constructor. Exponent must be CNFOrdinal. Coefficient must be a positive BigInt.');
                }
                return { exponent: t.exponent.clone(this._tracer), coefficient: t.coefficient };
            });
            this._normalize();
        } else if (initVal instanceof CNFOrdinal) { // Constructor from another CNFOrdinal (clone)
            this.terms = initVal.terms.map(t => ({
                exponent: t.exponent.clone(this._tracer), // Deep clone exponents
                coefficient: t.coefficient // coefficient is already a BigInt
            }));
            this._tracer = initVal._tracer; // Share tracer on clone
        } else {
            throw new Error(`Invalid CNFOrdinal constructor argument: ${initVal}`);
        }
    }

    _normalize() {
        if (this.terms.length === 0) return;

        // Filter out terms with zero or negative coefficients
        this.terms = this.terms.filter(t => t.coefficient > 0n);
        if (this.terms.length === 0) return;

        // Sort terms by exponent (descending)
        if (typeof this.compareTo === 'function') {
             this.terms.sort((a, b) => b.exponent.compareTo(a.exponent));
        } else {
            // console.warn("_normalize called before compareTo is fully available. Sorting might be partial.");
            this.terms.sort((a,b) => {
                if (a.exponent.isZero() && !b.exponent.isZero()) return 1;
                if (!a.exponent.isZero() && b.exponent.isZero()) return -1;
                return 0; 
            });
        }

        if (this.terms.length > 1) {
            const newTerms = [];
            let currentTerm = { ...this.terms[0] }; 
            currentTerm.exponent = this.terms[0].exponent.clone(this._tracer); 

            for (let i = 1; i < this.terms.length; i++) {
                if (this.terms[i].exponent.equals(currentTerm.exponent)) {
                    currentTerm.coefficient += this.terms[i].coefficient; 
                } else {
                    if (currentTerm.coefficient > 0n) newTerms.push(currentTerm);
                    currentTerm = { ...this.terms[i] };
                    currentTerm.exponent = this.terms[i].exponent.clone(this._tracer);
                }
            }
            if (currentTerm.coefficient > 0n) newTerms.push(currentTerm);
            this.terms = newTerms;
        }
    }
    
    static _ZERO_INSTANCE = null;
    static ZEROStatic() {
        if (!CNFOrdinal._ZERO_INSTANCE) {
            CNFOrdinal._ZERO_INSTANCE = new CNFOrdinal(); 
        }
        return CNFOrdinal._ZERO_INSTANCE;
    }

    static _ONE_INSTANCE = null;
    static ONEStatic() {
        if (!CNFOrdinal._ONE_INSTANCE) {
            const one = new CNFOrdinal(undefined, null); 
            one.terms.push({ exponent: CNFOrdinal.ZEROStatic(), coefficient: 1n });
            CNFOrdinal._ONE_INSTANCE = one;
        }
        return CNFOrdinal._ONE_INSTANCE;
    }

    static _OMEGA_INSTANCE = null;
    static OMEGAStatic() {
        if (!CNFOrdinal._OMEGA_INSTANCE) {
            const omega = new CNFOrdinal(undefined, null); 
            omega.terms.push({ exponent: CNFOrdinal.ONEStatic(), coefficient: 1n });
            CNFOrdinal._OMEGA_INSTANCE = omega;
        }
        return CNFOrdinal._OMEGA_INSTANCE;
    }
    
    static get ZERO() { return CNFOrdinal.ZEROStatic().clone(); } 
    static get ONE() { return CNFOrdinal.ONEStatic().clone(); }
    static get OMEGA() { return CNFOrdinal.OMEGAStatic().clone(); }


    static fromInt(n, tracer = null) {
        return new CNFOrdinal(BigInt(n), tracer);
    }

    isZero() {
        return this.terms.length === 0;
    }

    isFinite() {
        if (this.isZero()) return true;
        return this.terms.every(term => term.exponent.isZero());
    }

    isLimitOrdinal() {
        if (this.isZero()) return false; 
        if (this.isFinite()) return false;
        const lastTerm = this.terms[this.terms.length - 1];
        return !lastTerm.exponent.isZero(); 
    }
    
    isOmega() {
        return this.terms.length === 1 &&
               this.terms[0].coefficient === 1n &&
               this.terms[0].exponent.equals(CNFOrdinal.ONEStatic());
    }

    isOmegaPower() { 
        if (this.isZero() || this.isFinite()) return false;
        return this.terms.length === 1 && this.terms[0].coefficient === 1n && !this.terms[0].exponent.isZero();
    }


    getFinitePart() {
        if (this.isZero()) return 0n; 
        const lastTerm = this.terms[this.terms.length - 1];
        if (lastTerm.exponent.isZero()) {
            return lastTerm.coefficient; 
        }
        return 0n; 
    }

    getLimitPart() {
        if (this.isFinite()) return new CNFOrdinal(0, this._tracer);
        const limitTerms = this.terms.filter(term => !term.exponent.isZero());
        return new CNFOrdinal(limitTerms, this._tracer); 
    }

    getLeadingTerm() {
        if (this.isZero()) return null;
        return {
            exponent: this.terms[0].exponent.clone(this._tracer),
            coefficient: this.terms[0].coefficient
        };
    }

    getRest() {
        if (this.terms.length <= 1) return new CNFOrdinal(0, this._tracer);
        return new CNFOrdinal(this.terms.slice(1), this._tracer); 
    }

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
                if (exp.terms.length > 1 || (exp.terms.length === 1 && !exp.terms[0].exponent.isZero() && !exp.isOmega())) {
                     expStr = `w^(${expCNF})`;
                } else {
                    expStr = `w^${expCNF}`;
                }
            }

            if (coeff === 1n) return expStr; 
            return `${expStr}*${coeff.toString()}`; 
        }).join("+");
    }

    equals(otherOrdinal) {
        if (!(otherOrdinal instanceof CNFOrdinal)) return false;
        if (this.terms.length !== otherOrdinal.terms.length) return false;
        for (let i = 0; i < this.terms.length; i++) {
            if (this.terms[i].coefficient !== otherOrdinal.terms[i].coefficient ||
                !this.terms[i].exponent.equals(otherOrdinal.terms[i].exponent)) {
                return false;
            }
        }
        return true;
    }

    clone(tracer = null) {
        const effectiveTracer = tracer !== null ? tracer : this._tracer;
        const clonedOrdinal = new CNFOrdinal(undefined, effectiveTracer);
        clonedOrdinal.terms = this.terms.map(t => ({
            exponent: t.exponent.clone(effectiveTracer), 
            coefficient: t.coefficient
        }));
        return clonedOrdinal;
    }

    // compareTo will be defined on CNFOrdinal.prototype in ordinal_comparison.js
    // add, multiply, power, tetrate will be defined on its prototype in their respective files.
}

CNFOrdinal.ZEROStatic();
CNFOrdinal.ONEStatic();
CNFOrdinal.OMEGAStatic();

// Make tracer utilities available (simple version)
// To be passed to parser and then to CNFOrdinal instances.
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

    getCount() {
        return this.count;
    }

    getBudget() {
        return this.budget;
    }
}


// Export if in a module system (e.g., Node.js)
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = { CNFOrdinal, OperationTracer };
// }

// ordinal_types.js

/**
 * Represents the ordinal ε₀ (epsilon-naught).
 * This is a distinct type and does not have terms like CNFOrdinal.
 */
class EpsilonNaughtOrdinal {
    constructor(operationTracer = null) {
        this._tracer = operationTracer;
        // No fields needed as it represents a single, specific ordinal.
    }

    isZero() {
        return false; // e_0 is not zero
    }

    isFinite() {
        return false; // e_0 is not finite
    }

    // Add other query methods as needed, generally returning false or specific values for e_0
    // For example, getFinitePart() would be 0n for e_0.
    getFinitePart() { return 0n; }
    getLimitPart() { return this.clone(); } // e_0 is its own limit part

    toStringCNF() {
        return "e_0";
    }

    equals(otherOrdinal) {
        return (otherOrdinal instanceof EpsilonNaughtOrdinal);
    }

    clone(tracer = null) {
        const effectiveTracer = tracer !== null ? tracer : this._tracer;
        return new EpsilonNaughtOrdinal(effectiveTracer);
    }
    // compareTo will be defined on EpsilonNaughtOrdinal.prototype in ordinal_comparison.js
    // add, multiply, power, tetrate will be defined on its prototype in their respective files.
}
