// ENFOrdinal.js
// Epsilon Normal Form ordinal representation

/**
 * Represents an ordinal in Epsilon Normal Form (ENF).
 * ENF is a sum of ENFTerms: t1 + t2 + ... + tn
 * where t1 > t2 > ... > tn.
 */
class ENFOrdinal extends OrdinalBase {
    constructor(terms = [], operationTracer = null) {
        super(operationTracer);
        // Validation: ensure it's an array of ENFTerm instances
        if (!Array.isArray(terms) || !terms.every(t => t instanceof ENFTerm)) {
            throw new Error("ENFOrdinal constructor expects an array of ENFTerm instances.");
        }
        this.terms = terms;
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.terms.length === 0; }
    isFinite() {
        if (this.isZero()) return true;
        // An ENF sum is finite iff all its terms are finite
        return this.terms.every(t => t.isFinite());
    }
    isLessThanEpsilon0() {
        if (this.isZero()) return true;
        return this.terms[0].isLessThanEpsilon0();
    }
    isOmega() {
        return this.terms.length === 1 && this.terms[0].isOmega();
    }
    isBasic() {
        return this.terms.length === 1 && this.terms[0].isBasic();
    }
    isOne() {
        return this.terms.length === 1 && this.terms[0].isOne();
    }
    isLimit() {
        if (this.isZero()) return false;
        // A sum is a limit if its last term is a limit
        return this.terms[this.terms.length - 1].isLimit();
    }
    isTower() {
        if (this.isZero()) return false; // Or true for 0? Let's be consistent. Finite 0 is not a tower.
        if (this.terms.length !== 1) return false;
        return this.terms[0].isTower();
    }

    isLessThanZeta0() { return true; }

    isWellFormed() {
        // Zero is trivially well-formed
        if (this.isZero()) return true;
        // Terms must be ENFTerms, strictly decreasing (by structural order), and individually well-formed
        for (let i = 0; i < this.terms.length; i++) {
            const t = this.terms[i];
            if (!(t instanceof ENFTerm)) return false;
            if (typeof t.isWellFormed === 'function' && !t.isWellFormed()) return false;
            if (i + 1 < this.terms.length) {
                const next = this.terms[i + 1];
                // 1) Structure must strictly decrease ignoring coefficients
                // Compare by rank/log: leading factor base comparison, then exponents, then omega exponent
                if (typeof t.compareStructureTo === 'function' && typeof next.compareStructureTo === 'function') {
                    if (!(t.compareStructureTo(next) > 0)) return false;
                }
            }
        }
        return true;
    }

    getFiniteBigInt() {
        if (!this.isFinite()) {
            throw new Error('ENFOrdinal is not finite');
        }
        if (this.isZero()) return 0n;
        // Sum of coefficients of all (finite) terms
        return this.terms.reduce((sum, term) => sum + term.getFiniteBigInt(), 0n);
    }

    getFinitePart() {
        if (this.isZero()) return 0n;
        // Only the last (smallest) term can have a finite part in ENF
        const lastTerm = this.terms[this.terms.length - 1];
        return lastTerm.getFinitePart();
    }

    needsParenthesesAsExponent() {
        // ENF ordinals need parentheses when:
        // - They have more than one term (sums), OR
        // - They have a single term which itself needs parentheses
        if (this.terms.length > 1) return true;
        if (this.terms.length === 1) {
            return this.terms[0].needsParenthesesAsExponent();
        }
        return false;
    }

    toString() {
        if (this.isZero()) return "0";
        return this.terms.map(t => t.toString()).join("+");
    }

    clone(newTracer = null) {
        const newTerms = this.terms.map(t => t.clone(newTracer));
        return new ENFOrdinal(newTerms, newTracer || this._tracer);
    }

    rank() {
        if (this.isZero()) return new ZeroOrdinal(this._tracer);
        return this.terms[0].rank();
    }

    log() {
        if (this.isZero()) throw new Error("Log of 0 is undefined.");
        return this.terms[0].log();
    }

    logStar() {
        if (this.isZero()) return -1n;
        return this.terms[0].logStar();
    }

    getLimitPart() {
        // Returns the infinite part (all terms except finite ones)
        const limitTerms = [];
        for (const term of this.terms) {
            if (!term.isFinite()) {
                limitTerms.push(term.clone());
            }
        }
        return new ENFOrdinal(limitTerms, this._tracer);
    }

    ordinalDivision(divisor) {
        // For ENF ordinal division: find quotient and remainder such that this = divisor * quotient + remainder
        // This is a simplified implementation for the power function's needs
        if (divisor.isZero()) throw new Error("Division by zero");
        if (this.isZero()) return { quotient: new ENFOrdinal([], this._tracer), remainder: new ENFOrdinal([], this._tracer) };
        
        // For rank-based decomposition in power: if this = k*x + r, we want x and r
        // This is a placeholder - full implementation would be complex
        // For now, assume simple cases where divisor is the rank
        if (this.isFinite()) {
            return { 
                quotient: new ENFOrdinal([], this._tracer), 
                remainder: this.clone() 
            };
        }
        
        const leadingTerm = this.terms[0];
        const divisorRank = divisor.rank();
        const thisRank = this.rank();
        
        if (OPERATIONS.compare(divisorRank, thisRank) === 0) {
            // Same rank - extract coefficient as quotient
            const quotient = new ENFOrdinal([new ENFTerm([], leadingTerm.coefficient, this._tracer)], this._tracer);
            const remainderTerms = this.terms.slice(1).map(t => t.clone());
            const remainder = new ENFOrdinal(remainderTerms, this._tracer);
            return { quotient, remainder };
        }
        
        // Different ranks - simplified handling
        return { 
            quotient: new ENFOrdinal([new ENFTerm([], 1n, this._tracer)], this._tracer), 
            remainder: this.clone() 
        };
    }

    isEpsilonNumber() {
        // Must have exactly one term that is itself an epsilon number
        if (this.terms.length !== 1) return false;
        return this.terms[0].isEpsilonNumber();
    }

    epsilonIndex() {
        if (!this.isEpsilonNumber()) {
            throw new Error('ENFOrdinal is not an epsilon number');
        }
        return this.terms[0].epsilonIndex();
    }

    // Methods that need more complex implementation
    nextRank() {
        if (this.isZero()) {
            return new EpsilonNumber(new ZeroOrdinal(this._tracer), this._tracer);
        }
        return this.terms[0].nextRank();
    }
    complexity() {
        if (this.isZero()) return 0;
        let total = this.terms.map(t => t.complexity()).reduce((a, b) => a + b, 0);
        total += this.terms.length - 1; // For the '+' signs
        return total;
    }
    toFFormat() {
        // This remains complex and will be addressed later.
        if (this.terms.length === 1) {
            return this.terms[0].toFFormat();
        }
        throw new Error("toFFormat for ENF sums not yet implemented.");
    }
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this.complexity() <= complexityBudget) {
            return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - this.complexity() };
        }
        // Proper simplification would truncate terms. For now, fallback to 0.
        return { simplifiedOrdinal: new ZeroOrdinal(this._tracer), remainingBudget: complexityBudget };
    }

    // === CONVERSION SYSTEM ===
    static getTypeName() { return 'ENF'; }
    static getDirectConversions() { return []; }
    convertTo(targetTypeName) {
        throw new Error(`ENFOrdinal cannot convert directly to ${targetTypeName}`);
    }

    // === STATIC CONSTRUCTORS ===

    static fromCNF(ord) {
        if (ord instanceof ENFOrdinal) return ord.clone();

        // Handle new arch basic types
        if (ord instanceof ZeroOrdinal) return new ENFOrdinal([]);
        if (ord instanceof OneOrdinal) return new ENFOrdinal([new ENFTerm([], 1n)]);
        if (ord instanceof FiniteOrdinal) {
            if (ord.isZero()) return new ENFOrdinal([]);
            return new ENFOrdinal([new ENFTerm([], ord.getFiniteBigInt())]);
        }
        if (ord instanceof OmegaOrdinal) {
            const one = new OneOrdinal();
            const omegaFactor = new ENFFactor(new OmegaOrdinal(), one);
            return new ENFOrdinal([new ENFTerm([omegaFactor], 1n)]);
        }
        if (ord instanceof EpsilonZero) {
            const base = new EpsilonNumber(new ZeroOrdinal());
            const one = new OneOrdinal();
            const factor = new ENFFactor(base, one);
            return new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }
        if (ord instanceof EpsilonNumber) {
            const base = ord;
            const one = new OneOrdinal();
            const factor = new ENFFactor(base, one);
            return new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }

        if (!(ord instanceof CNFOrdinal)) {
            // Fallback for types that can convert to CNF
            if (ord && typeof ord.convertTo === 'function' && OPERATIONS.canConvert(ord, 'CNF')) {
                ord = OPERATIONS.convert(ord, 'CNF');
            } else {
                throw new Error("ENFOrdinal.fromCNF: unsupported type " + (ord ? ord.constructor.name : ord));
            }
        }

        if (ord.isZero()) return new ENFOrdinal([]);

        const terms = [];
        for (const t of ord.terms) {
            const exp = t.exponent;
            if (exp.isZero()) {
                // Finite term
                terms.push(new ENFTerm([], t.coefficient));
            } else {
                // Term of the form ω^k * m
                const omegaFactor = new ENFFactor(new OmegaOrdinal(), exp);
                terms.push(new ENFTerm([omegaFactor], t.coefficient));
            }
        }
        // Note: this doesn't merge/simplify, just translates. A normalize step could be added.
        return new ENFOrdinal(terms);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENFOrdinal;
} else {
    // Browser global
    window.ENFOrdinal = ENFOrdinal;
}
