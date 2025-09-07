// CNFOrdinal.js
// Cantor Normal Form ordinal representation

/**
 * Represents an ordinal in Cantor Normal Form (CNF).
 * CNF: ω^a₁*c₁ + ω^a₂*c₂ + ... + ω^aₖ*cₖ + n
 * where a₁ > a₂ > ... > aₖ > 0 are ordinals, and c_i, n are positive integers.
 */
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
            // Handle various ordinal types
            if (initVal instanceof CNFOrdinal) {
                this.terms = initVal.terms.map(t => ({
                    exponent: t.exponent.clone(this._tracer),
                    coefficient: t.coefficient
                }));
            } else if (typeof ENFOrdinal !== 'undefined' && initVal instanceof ENFOrdinal) {
                const cnf = initVal.toCNFOrdinal();
                this.terms = cnf.terms.map(t => ({ exponent: t.exponent.clone(this._tracer), coefficient: t.coefficient }));
            } else if (initVal instanceof WTowerOrdinal) {
                const cnf = initVal.toCNFOrdinal();
                this.terms = cnf.terms;
            } else {
                throw new Error(`Invalid Ordinal type for CNFOrdinal cloning: ${initVal.constructor.name}`);
            }
        } else {
            throw new Error(`Invalid CNFOrdinal constructor argument: ${initVal}`);
        }
    }

    // === REQUIRED UNARY METHODS ===

    isZero() {
        return this.terms.length === 0;
    }

    isFinite() {
        return this.terms.length === 0 || (this.terms.length === 1 && this.terms[0].exponent.isZero());
    }

    isLessThanEpsilon0() {
        return true;
    }

    isOmega() {
        return this.terms.length === 1 &&
            this.terms[0].exponent.equals(CNFOrdinal.ONEStatic()) &&
            this.terms[0].coefficient === 1n;
    }

    isBasic() {
        return this.isOmega();
    }

    isOne() {
        return this.isFinite() && this.getFinitePart() === 1n;
    }

    getFiniteBigInt() {
        if (!this.isFinite()) {
            throw new Error('CNFOrdinal is not finite');
        }
        return this.getFinitePart();
    }

    nextRank() {
        if (this.isFinite()) {
            const n = this.getFinitePart();
            if (n === 0n) return new FiniteOrdinal(1n, this._tracer);
            return new OmegaOrdinal(this._tracer);
        }
        // CNF ordinals here are < ε₀ and infinite
        return new EpsilonZero(this._tracer);
    }

    // === EXPONENT/OMEGA HELPERS (needed for CNF exponentiation) ===
    exponentPredecessor() {
        if (this.isZero()) {
            return CNFOrdinal.ZEROStatic().clone(this._tracer);
        }
        if (this.isFinite()) {
            const n = this.getFinitePart();
            if (n <= 1n) return CNFOrdinal.ZEROStatic().clone(this._tracer);
            return new CNFOrdinal(n - 1n, this._tracer);
        }

        const lastIdx = this.terms.length - 1;
        const lastTerm = this.terms[lastIdx];
        if (lastTerm.exponent.isZero()) {
            const newTerms = this.terms.map(t => ({ exponent: t.exponent.clone(this._tracer), coefficient: t.coefficient }));
            if (lastTerm.coefficient > 1n) {
                newTerms[lastIdx].coefficient -= 1n;
            } else {
                newTerms.pop();
            }
            return new CNFOrdinal(newTerms, this._tracer);
        }
        return this.clone();
    }

    divideByOmega() {
        if (this.isZero() || this.isFinite()) {
            return CNFOrdinal.ZEROStatic().clone(this._tracer);
        }
        const newTerms = [];
        for (const term of this.terms) {
            const newExponent = term.exponent.exponentPredecessor();
            newTerms.push({ exponent: newExponent, coefficient: term.coefficient });
        }
        return new CNFOrdinal(newTerms, this._tracer);
    }

    complexity() {
        if (this._tracer) this._tracer.consume();

        if (this.isZero()) return 0;

        if (this.isFinite()) {
            return this.terms[0].coefficient.toString().length;
        }

        // Handle single-term ordinals first
        if (this.terms.length === 1) {
            const term = this.terms[0];
            const exponent = term.exponent;
            const coefficient = term.coefficient;

            // Check for canonical equivalence to the exponent
            if (coefficient === 1n) {
                if (this.equals(exponent)) {
                    return exponent.complexity();
                }
            }

            // Rule g(ω) = 1
            if (this.isOmega()) {
                return 1;
            }
            // Rule g(ω*m) = g(m)+2
            if (exponent.equals(CNFOrdinal.ONEStatic())) {
                return coefficient.toString().length + 2;
            }
            // Rule g(ω^a) = g(a)+4
            if (coefficient === 1n) {
                return exponent.complexity() + 4;
            }
            // Rule g(ω^a*m) = g(a)+g(m)+5
            return exponent.complexity() + coefficient.toString().length + 5;
        }

        // General sum rule: g(x+y) = g(x)+g(y)+1
        let totalComplexity = 0;
        for (const term of this.terms) {
            const singleTermOrdinal = new CNFOrdinal([term], this._tracer);
            totalComplexity += singleTermOrdinal.complexity();
        }
        totalComplexity += (this.terms.length - 1); // Add 1 for each '+'

        return totalComplexity;
    }

    toString() {
        return this.toStringCNF();
    }

    toGraphicalHTML() {
        if (this.isZero()) {
            return RenderingComponents.renderFinite(0);
        }

        const termHTMLs = this.terms.map(term =>
            RenderingComponents.renderCNFTerm(term.exponent, term.coefficient)
        );

        return RenderingComponents.joinTerms(termHTMLs);
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
                // Parenthesize only when necessary
                let needsParen = false;
                if (exp instanceof CNFOrdinal) {
                    needsParen = !(exp.isFinite() || exp.isOmega() || exp.isOmegaPower());
                }

                if (needsParen) {
                    expStr = `w^(${expCNF})`;
                } else {
                    expStr = `w^${expCNF}`;
                }
            }

            if (coeff === 1n) return expStr;
            return `${expStr}*${coeff.toString()}`;
        }).join("+");
    }

    clone(newTracer = null) {
        const effectiveTracer = newTracer !== null ? newTracer : this._tracer;
        return new CNFOrdinal(this, effectiveTracer);
    }

    toFFormat() {
        if (this.isZero()) return 0n;
        if (this.isFinite()) return this.getFinitePart();

        const terms = this.terms;
        if (terms.length === 1 && terms[0].coefficient === 1n && !terms[0].exponent.isZero()) {
            const k_rep_for_f = terms[0].exponent.toFFormat();
            return { type: 'pow', k: k_rep_for_f };
        }
        const firstTerm = terms[0];
        const beta_rep_for_f = firstTerm.exponent.toFFormat();
        const c_from_ordinal = firstTerm.coefficient;
        let c_num_for_f = Number(c_from_ordinal);
        if (c_from_ordinal > BigInt(Number.MAX_SAFE_INTEGER) || c_from_ordinal < BigInt(Number.MIN_SAFE_INTEGER)) {
            // Outside safe range; Number() still yields a number (possibly Infinity), which f() already handles
        }
        let delta_rep_for_f;
        if (terms.length === 1) {
            delta_rep_for_f = 0n;
        } else {
            const remainderTerms = terms.slice(1).map(t => ({ exponent: t.exponent.clone(this._tracer), coefficient: t.coefficient }));
            const remainderOrdinal = new CNFOrdinal(remainderTerms, this._tracer);
            delta_rep_for_f = remainderOrdinal.toFFormat();
        }
        return { type: 'sum', beta: beta_rep_for_f, c: c_num_for_f, delta: delta_rep_for_f };
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'CNF'; }

    static getDirectConversions() {
        return ['ENF']; // Can convert directly to ENF
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'ENF':
                if (typeof ENFOrdinal !== 'undefined') {
                    return ENFOrdinal.fromCNF(this);
                }
                break;

            default:
                throw new Error(`CNFOrdinal cannot convert directly to ${targetTypeName}`);
        }

        throw new Error(`Required ordinal type ${targetTypeName} not available`);
    }

    // === UTILITY METHODS ===

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

    // Implement simplify method (extracted from existing CNFOrdinal.simplify)
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        // For now, return basic budget-aware simplification
        // Full CNF simplification logic can be migrated later
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

    // === STATIC FACTORY METHODS ===

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
            // Create omega manually to avoid circular reference
            const omega = new CNFOrdinal();
            omega.terms = [{
                exponent: CNFOrdinal.ONEStatic(),
                coefficient: 1n
            }];
            CNFOrdinal._omegaInstance = omega;
        }
        return CNFOrdinal._omegaInstance;
    }

    // Initialize static instances
    static initializeStatics() {
        CNFOrdinal.ZEROStatic();
        CNFOrdinal.ONEStatic();
        CNFOrdinal.OMEGAStatic();
    }
}

// Legacy constants for backward compatibility
const ALLOW_EPSILON_IN_CNF = true;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CNFOrdinal;
} else {
    // Browser global
    window.CNFOrdinal = CNFOrdinal;
}
