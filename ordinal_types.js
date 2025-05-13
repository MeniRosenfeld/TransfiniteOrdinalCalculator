// ordinal_types.js

/**
 * Represents an Ordinal number in Cantor Normal Form (CNF).
 * CNF: w^a1*c1 + w^a2*c2 + ... + w^ak*ck + n
 * where a1 > a2 > ... > ak > 0 are ordinals, and c_i, n are positive integers.
 * Internally, terms are stored as:
 * [{ exponent: Ordinal, coefficient: number }, ...]
 * The finite part 'n' is represented as a term with exponent Ordinal.ZERO.
 */
class Ordinal {
    // terms: Array of { exponent: Ordinal, coefficient: BigInt }
    // Sorted by exponent descending. Coefficients are positive BigInts.
    constructor(initVal, operationTracer = null) { // Added operationTracer
        this.terms = [];
        this._tracer = operationTracer; // For operation counting

        if (initVal === undefined || initVal === null) {
            // Default to 0
        } else if (typeof initVal === 'number' || typeof initVal === 'bigint') {
            const val = BigInt(initVal);
            if (val < 0n) {
                throw new Error(`Ordinal from number: Must be a non-negative integer, got ${initVal}`);
            }
            if (val > 0n) {
                this.terms.push({ exponent: Ordinal.ZEROStatic(), coefficient: val });
            }
        } else if (typeof initVal === 'string') {
            // Basic string parsing for "0", "w", or simple integers for internal use.
            // Full string parsing is handled by OrdinalParser.
            if (initVal === "0") {
                // Stays as empty terms
            } else if (initVal === "w") {
                this.terms.push({ exponent: Ordinal.ONEStatic(), coefficient: 1n });
            } else if (/^\d+$/.test(initVal)) {
                const n = BigInt(initVal);
                if (n > 0n) {
                    this.terms.push({ exponent: Ordinal.ZEROStatic(), coefficient: n });
                }
            } else {
                throw new Error(`Ordinal from string: Basic constructor only handles "0", "w", or simple integers. Got "${initVal}"`);
            }
        } else if (Array.isArray(initVal)) {
            // Assumes initVal is an array of term objects, used internally by operations
            this.terms = initVal.map(t => {
                if (!(t.exponent instanceof Ordinal) || typeof t.coefficient !== 'bigint' || t.coefficient <= 0n) {
                    throw new Error('Invalid term structure in Ordinal constructor. Coefficient must be a positive BigInt.');
                }
                return { exponent: t.exponent.clone(this._tracer), coefficient: t.coefficient };
            });
            this._normalize();
        } else if (initVal instanceof Ordinal) { // Constructor from another Ordinal (clone)
            this.terms = initVal.terms.map(t => ({
                exponent: t.exponent.clone(this._tracer), // Deep clone exponents
                coefficient: t.coefficient // coefficient is already a BigInt
            }));
            this._tracer = initVal._tracer; // Share tracer on clone
        } else {
            throw new Error(`Invalid Ordinal constructor argument: ${initVal}`);
        }
    }

    _normalize() {
        if (this.terms.length === 0) return;

        // Filter out terms with zero or negative coefficients
        this.terms = this.terms.filter(t => t.coefficient > 0n);
        if (this.terms.length === 0) return;

        // Sort terms by exponent (descending)
        // Requires Ordinal.prototype.compareTo to be defined.
        // We'll sort after all foundational methods are in place, or use a temporary sort for now.
        // For now, assume Ordinal.compareTo exists or delay sorting.
        // This creates a cyclic dependency if compareTo is not yet defined on Ordinal.prototype
        // Solution: Make sure compareTo is defined before _normalize is heavily used by complex ops.
        if (typeof this.compareTo === 'function') {
             this.terms.sort((a, b) => b.exponent.compareTo(a.exponent));
        } else {
            // console.warn("_normalize called before compareTo is fully available. Sorting might be partial.");
            // A simple preliminary sort if full compareTo isn't ready (e.g., during bootstrap)
            // This isn't robust for complex exponents but helps basic cases.
            this.terms.sort((a,b) => {
                if (a.exponent.isZero() && !b.exponent.isZero()) return 1;
                if (!a.exponent.isZero() && b.exponent.isZero()) return -1;
                // This is insufficient for w^w vs w^2, but better than nothing for now.
                return 0; // Needs real compareTo
            });
        }


        // Combine terms with identical exponents
        if (this.terms.length > 1) {
            const newTerms = [];
            let currentTerm = { ...this.terms[0] }; // Shallow copy term, exponent is still Ordinal
            currentTerm.exponent = this.terms[0].exponent.clone(this._tracer); // Clone exponent for the new term

            for (let i = 1; i < this.terms.length; i++) {
                if (this.terms[i].exponent.equals(currentTerm.exponent)) {
                    currentTerm.coefficient += this.terms[i].coefficient; // BigInt addition
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
    
    // Static instances - these need to be initialized carefully due to Ordinal definition order
    // We'll use static methods to retrieve them to handle initialization order.
    static _ZERO_INSTANCE = null;
    static ZEROStatic() {
        if (!Ordinal._ZERO_INSTANCE) {
            Ordinal._ZERO_INSTANCE = new Ordinal(); // Tracer not critical for constants
        }
        return Ordinal._ZERO_INSTANCE;
    }

    static _ONE_INSTANCE = null;
    static ONEStatic() {
        if (!Ordinal._ONE_INSTANCE) {
            const one = new Ordinal(undefined, null); // Temporary for exponent, tracer not critical for constants
            one.terms.push({ exponent: Ordinal.ZEROStatic(), coefficient: 1n });
            Ordinal._ONE_INSTANCE = one;
        }
        return Ordinal._ONE_INSTANCE;
    }

    static _OMEGA_INSTANCE = null;
    static OMEGAStatic() {
        if (!Ordinal._OMEGA_INSTANCE) {
            const omega = new Ordinal(undefined, null); // Temporary for base
            omega.terms.push({ exponent: Ordinal.ONEStatic(), coefficient: 1n });
            Ordinal._OMEGA_INSTANCE = omega;
        }
        return Ordinal._OMEGA_INSTANCE;
    }
    
    // Public static getters
    static get ZERO() { return Ordinal.ZEROStatic().clone(); } // Return clones to prevent mutation
    static get ONE() { return Ordinal.ONEStatic().clone(); }
    static get OMEGA() { return Ordinal.OMEGAStatic().clone(); }


    static fromInt(n, tracer = null) {
        return new Ordinal(BigInt(n), tracer);
    }

    // No fromString here, that's for the full parser.

    isZero() {
        return this.terms.length === 0;
    }

    isFinite() {
        if (this.isZero()) return true;
        // Finite if all terms have exponent Ordinal.ZERO
        return this.terms.every(term => term.exponent.isZero());
    }

    isLimitOrdinal() {
        if (this.isZero()) return false; // 0 is not typically considered a limit ordinal in this context
        if (this.isFinite()) return false;
        // Infinite and its finite part is 0
        const lastTerm = this.terms[this.terms.length - 1];
        return !lastTerm.exponent.isZero(); // Or getFinitePart() === 0
    }
    
    isOmega() {
        return this.terms.length === 1 &&
               this.terms[0].coefficient === 1n &&
               this.terms[0].exponent.equals(Ordinal.ONEStatic());
    }

    isOmegaPower() { // Is it of the form w^A (coefficient 1 for the w term)
        if (this.isZero() || this.isFinite()) return false;
        return this.terms.length === 1 && this.terms[0].coefficient === 1n && !this.terms[0].exponent.isZero();
    }


    getFinitePart() {
        if (this.isZero()) return 0n; // Return BigInt zero
        const lastTerm = this.terms[this.terms.length - 1];
        if (lastTerm.exponent.isZero()) {
            return lastTerm.coefficient; // Already a BigInt
        }
        return 0n; // Return BigInt zero
    }

    getLimitPart() {
        if (this.isFinite()) return new Ordinal(0, this._tracer);
        const limitTerms = this.terms.filter(term => !term.exponent.isZero());
        return new Ordinal(limitTerms, this._tracer); // Constructor handles cloning of terms
    }

    getLeadingTerm() {
        if (this.isZero()) return null;
        // Terms are sorted, so the first one is the leading term.
        // Return a copy to prevent external modification.
        return {
            exponent: this.terms[0].exponent.clone(this._tracer),
            coefficient: this.terms[0].coefficient
        };
    }

    getRest() {
        if (this.terms.length <= 1) return new Ordinal(0, this._tracer);
        return new Ordinal(this.terms.slice(1), this._tracer); // Constructor handles cloning
    }

    toStringCNF() {
        if (this.isZero()) return "0";
        return this.terms.map(term => {
            const coeff = term.coefficient; // This is a BigInt
            const exp = term.exponent;

            if (exp.isZero()) return coeff.toString(); // Convert BigInt to string

            let expStr;
            if (exp.equals(Ordinal.ONEStatic())) { // w^1
                expStr = "w";
            } else { // w^(complex_exponent) or w^N for N > 1
                const expCNF = exp.toStringCNF();
                // Only add parentheses if exponent is a sum or product not a simple number/w
                if (exp.terms.length > 1 || (exp.terms.length === 1 && !exp.terms[0].exponent.isZero() && !exp.isOmega())) {
                     expStr = `w^(${expCNF})`;
                } else {
                    expStr = `w^${expCNF}`;
                }
            }

            if (coeff === 1n) return expStr; // Compare with BigInt one
            // Decide if w should have () if coeff > 1, e.g. (w*2) vs w*2.
            // Standard CNF usually just puts coeff last: w*c or w^A*c
            return `${expStr}*${coeff.toString()}`; // Convert BigInt coeff to string
        }).join("+");
    }

    equals(otherOrdinal) {
        if (!(otherOrdinal instanceof Ordinal)) return false;
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
        // If a tracer is provided for the clone, use it; otherwise, use the current tracer.
        const effectiveTracer = tracer !== null ? tracer : this._tracer;
        const clonedOrdinal = new Ordinal(undefined, effectiveTracer); // Create empty with tracer
        clonedOrdinal.terms = this.terms.map(t => ({
            exponent: t.exponent.clone(effectiveTracer), // Ensure exponents also get the tracer
            coefficient: t.coefficient
        }));
        // No need for _normalize() here as `this` is already normalized.
        return clonedOrdinal;
    }

    // Placeholder for compareTo - will be in ordinal_comparison.js
    // compareTo(otherOrdinal) { throw new Error("compareTo not yet implemented"); }
}

// Initialize static constants carefully after class definition
// These are set up as static methods that return instances to handle cyclic dependencies
// during script load, ensuring Ordinal.ZEROStatic etc. are available for Ordinal.ONEStatic.
Ordinal.ZEROStatic();
Ordinal.ONEStatic();
Ordinal.OMEGAStatic();

// Make tracer utilities available (simple version)
// To be passed to parser and then to Ordinal instances.
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
//     module.exports = { Ordinal, OperationTracer };
// }

// ordinal_types.js
