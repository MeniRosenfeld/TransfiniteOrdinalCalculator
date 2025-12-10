// ENFOrdinal.ts
// Epsilon Normal Form ordinal representation

import { OrdinalBase } from './OrdinalBase.js';
import { ENFTerm } from './ENFTerm.js';
import { ENFFactor } from './ENFFactor.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { OneOrdinal } from './OneOrdinal.js';
import { FiniteOrdinal } from './FiniteOrdinal.js';
import { OmegaOrdinal } from './OmegaOrdinal.js';
import type { SimplifyResult } from '../parser-types.js';
import { EpsilonZero } from './EpsilonZero.js';
import { EpsilonNumber } from './EpsilonNumber.js';
import { CNFOrdinal } from './CNFOrdinal.js';
import { RenderingComponents } from '../RenderingComponents.js';
import { getOperations } from '../operations/OperationsSingleton.js';

/**
 * Represents an ordinal in Epsilon Normal Form (ENF).
 * ENF is a sum of ENFTerms: t1 + t2 + ... + tn
 * where t1 > t2 > ... > tn.
 */
export class ENFOrdinal extends OrdinalBase {
    readonly terms: ENFTerm[];

    constructor(terms: ENFTerm[] = []) {
        super();
        // Validation: ensure it's an array of ENFTerm instances
        if (!Array.isArray(terms) || !terms.every(t => t instanceof ENFTerm)) {
            throw new Error("ENFOrdinal constructor expects an array of ENFTerm instances.");
        }
        // Terms should be in descending order: t1 > t2 > ... > tn
        // This invariant is maintained by all operations
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
        if (this.isZero()) return false;
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

    toGraphicalHTML() {
        if (this.isZero()) {
            return RenderingComponents.renderFinite(0);
        }

        const termHTMLs = this.terms.map(t => t.toGraphicalHTML ? t.toGraphicalHTML() : t.toString());
        return RenderingComponents.joinTerms(termHTMLs);
    }

    clone(): ENFOrdinal {
        const newTerms = this.terms.map(t => t);
        return new ENFOrdinal(newTerms);
    }

    rank() {
        if (this.isZero()) {
            return ZeroOrdinal.instance();
        }
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
                limitTerms.push(term);
            }
        }
        return new ENFOrdinal(limitTerms);
    }

    ordinalDivision(k: OrdinalBase): {quotient: ENFOrdinal, remainder: ENFOrdinal} {
        // Simplified ordinal division - only works for basic ordinals (ω or ε_k)
        if (k.isZero() || !k.isBasic()) {
            throw new Error("Divisor k must be a non-finite basic ordinal (w or e_k).");
        }

        const quotientTerms = [];
        const remainderTerms = [];

        for (const term of this.terms) {
            if (term.factors.length === 0) {
                // Finite term - goes to remainder
                remainderTerms.push(term);
                continue;
            }

            const leadingFactor = term.factors[0];
            const comparison = getOperations().compare(leadingFactor.base, k);

            if (comparison > 0) {
                // term.factors[0].base > k: Add term as is to the quotient
                quotientTerms.push(term);
            } else if (comparison === 0) {
                // term.factors[0].base = k: Add term to quotient with leftPredecessor applied to leading factor's exponent
                let newTermFactors = term.factors.map(t => t.clone());
                const newExp = leadingFactor.exponent.leftPredecessor();
                if (newExp.isZero()) {
                    // Remove the leading factor entirely
                    newTermFactors.shift();
                } else {
                    // Replace the leading factor with updated exponent (readonly)
                    newTermFactors[0] = new ENFFactor(newTermFactors[0].base, newExp);
                }
                quotientTerms.push(new ENFTerm(newTermFactors, term.coefficient));
            } else {
                // term.factors[0].base < k: Add term to remainder
                remainderTerms.push(term);
            }
        }

        return {
            quotient: new ENFOrdinal(quotientTerms),
            remainder: new ENFOrdinal(remainderTerms)
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
            return OneOrdinal.instance();
        }
        // Delegate to the leading term's nextRank
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

    simplify(complexityBudget: number, skipMyOwnMPTFCheck = false): { simplifiedOrdinal: OrdinalBase; remainingBudget: number } {
        if (this.complexity() <= complexityBudget) {
            return { simplifiedOrdinal: this, remainingBudget: complexityBudget - this.complexity() };
        }
        // Proper simplification would truncate terms. For now, fallback to 0.
        return { simplifiedOrdinal: ZeroOrdinal.instance(), remainingBudget: complexityBudget };
    }

    // === CONVERSION SYSTEM ===
    static getTypeName() { return 'ENF'; }
    static getDirectConversions() { return []; }
    convertTo(targetTypeName: string): OrdinalBase {
        throw new Error(`ENFOrdinal cannot convert directly to ${targetTypeName}`);
    }

    // === STATIC CONSTRUCTORS ===

    static fromCNF(ord: OrdinalBase): ENFOrdinal {
        if (ord instanceof ENFOrdinal) return ord;

        // Handle new arch basic types
        if (ord instanceof ZeroOrdinal) return new ENFOrdinal([]);
        if (ord instanceof OneOrdinal) return new ENFOrdinal([new ENFTerm([], 1n)]);
        if (ord instanceof FiniteOrdinal) {
            if (ord.isZero()) return new ENFOrdinal([]);
            return new ENFOrdinal([new ENFTerm([], ord.getFiniteBigInt())]);
        }
        if (ord instanceof OmegaOrdinal) {
            const one = OneOrdinal.instance();
            const omegaFactor = new ENFFactor(OmegaOrdinal.instance(), one);
            return new ENFOrdinal([new ENFTerm([omegaFactor], 1n)]);
        }
        if (ord instanceof EpsilonZero) {
            const base = new EpsilonNumber(ZeroOrdinal.instance());
            const one = OneOrdinal.instance();
            const factor = new ENFFactor(base, one);
            return new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }
        if (ord instanceof EpsilonNumber) {
            const base = ord;
            const one = OneOrdinal.instance();
            const factor = new ENFFactor(base, one);
            return new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }

        if (!(ord instanceof CNFOrdinal)) {
            // Fallback for types that can convert to CNF
            if (ord && typeof ord.convertTo === 'function' && getOperations().canConvert(ord, 'CNF')) {
                ord = getOperations().convert(ord, 'CNF') as CNFOrdinal;
            } else {
                throw new Error("ENFOrdinal.fromCNF: unsupported type " + (ord ? ord.constructor.name : ord));
            }
        }

        // TypeScript now knows ord is CNFOrdinal
        const cnfOrd = ord as CNFOrdinal;
        
        if (cnfOrd.isZero()) return new ENFOrdinal([]);

        const terms = [];
        for (const t of cnfOrd.terms) {
            const exp = t.exponent;
            if (exp.isZero()) {
                // Finite term
                terms.push(new ENFTerm([], t.coefficient));
            } else {
                // Term of the form ω^k * m
                const omegaFactor = new ENFFactor(OmegaOrdinal.instance(), exp);
                terms.push(new ENFTerm([omegaFactor], t.coefficient));
            }
        }
        // Note: this doesn't merge/simplify, just translates. A normalize step could be added.
        return new ENFOrdinal(terms);
    }
}
