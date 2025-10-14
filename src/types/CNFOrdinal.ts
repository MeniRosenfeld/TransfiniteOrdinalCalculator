// CNFOrdinal.ts
// Cantor Normal Form ordinal representation

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import { ENFOrdinal } from './ENFOrdinal.js';
import { WTowerOrdinal } from './WTowerOrdinal.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { OneOrdinal } from './OneOrdinal.js';
import { FiniteOrdinal } from './FiniteOrdinal.js';
import { OmegaOrdinal } from './OmegaOrdinal.js';
import { EpsilonZero } from './EpsilonZero.js';
import { RenderingComponents } from '../RenderingComponents.js';

export interface CNFTerm {
    exponent: OrdinalBase;
    coefficient: bigint;
}

/**
 * Represents an ordinal in Cantor Normal Form (CNF).
 * CNF: ω^a₁*c₁ + ω^a₂*c₂ + ... + ω^aₖ*cₖ + n
 * where a₁ > a₂ > ... > aₖ > 0 are ordinals, and c_i, n are positive integers.
 */
export class CNFOrdinal extends OrdinalBase {
    terms: CNFTerm[];

    constructor(initVal?: number | bigint | CNFTerm[] | OrdinalBase | null) {
        super();
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
            OperationTracer.consume(initVal.length || 0);
            this.terms = initVal.map(t => ({
                exponent: t.exponent,
                coefficient: t.coefficient
            }));
        } else if (typeof initVal === 'object' && initVal.constructor) {
            // Handle various ordinal types
            if (initVal instanceof CNFOrdinal) {
                OperationTracer.consume(initVal.terms.length || 0);
                this.terms = initVal.terms.map(t => ({
                    exponent: t.exponent,
                    coefficient: t.coefficient
                }));
            } else if (initVal instanceof ENFOrdinal) {
                const cnf = (initVal as any).toCNFOrdinal() as CNFOrdinal;
                OperationTracer.consume(cnf.terms.length || 0);
                this.terms = cnf.terms.map(t => ({ exponent: t.exponent, coefficient: t.coefficient }));
            } else if (initVal instanceof WTowerOrdinal) {
                const cnf = initVal.toCNFOrdinal();
                OperationTracer.consume(cnf.terms.length || 0);
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
            this.terms[0].exponent.isOne() &&
            this.terms[0].coefficient === 1n;
    }

    isBasic() {
        return this.isOmega();
    }

    isOne() {
        return this.isFinite() && this.getFinitePart() === 1n;
    }

    isWellFormed() {
        // Terms must be in strictly decreasing exponent order; coefficients nonnegative integers
        let prevExp = null;
        for (let i = 0; i < this.terms.length; i++) {
            const term = this.terms[i];
            // Coefficient check
            if (typeof term.coefficient !== 'bigint' || term.coefficient < 0n) return false;
            // Exponent must be an ordinal < e0 and well-formed
            const exp = term.exponent;
            if (!exp || !exp.isOrdinal || !exp.isOrdinal()) return false;
            if (!exp.isLessThanEpsilon0 || !exp.isLessThanEpsilon0()) return false;
            if (typeof exp.isWellFormed === 'function' && !exp.isWellFormed()) return false;
            // Strictly decreasing
            if (prevExp !== null) {
                if (!(prevExp.compareTo && typeof prevExp.compareTo === 'function')) return false;
                if (prevExp.compareTo(exp) <= 0) return false;
            }
            prevExp = exp;
        }
        return true;
    }

    isLimit() {
        // A CNF ordinal is a limit if it is not zero and has no finite part.
        return !this.isZero() && this.getFinitePart() === 0n;
    }

    rank() {
        if (this.isZero()) {
            return ZeroOrdinal.instance();
        }
        if (this.isFinite()) {
            return OneOrdinal.instance();
        }
        return new OmegaOrdinal();
    }

    log() {
        if (this.isZero()) {
            throw new Error('Log of 0 is undefined.');
        }
        if (this.isFinite()) {
            return ZeroOrdinal.instance();
        }
        return this.terms[0].exponent;
    }

    logStar() {
        if (this.isFinite()) {
            if (this.isZero()) {
                return -1n;
            } else {
                return 0n;
            }
        }

        // For CNF ordinals, the base is always omega, so we compare against omega
        const originalBase = new OmegaOrdinal();

        // Iterative implementation to avoid quadratic complexity from cloning
        let count = 0;
        let currentTerms = this.terms;

        // Navigate down the exponent tower without cloning entire ordinals
        while (currentTerms.length > 0 && !this._isFiniteTerms(currentTerms)) {
            count++;

            OperationTracer.consume();

            // Get the exponent of the leading term without cloning the whole ordinal
            const leadingTerm = currentTerms[0];
            const exponent = leadingTerm.exponent;

            if (exponent.isFinite()) {
                // If exponent is finite, we're done - the log is finite
                break;
            } else if (exponent instanceof CNFOrdinal) {
                // Continue with the exponent's terms
                currentTerms = exponent.terms;
            } else {
                // For other ordinal types, fall back to the recursive approach
                // but only for this single step
                const logResult = exponent.log();
                if (logResult.isFinite()) {
                    break;
                } else if (logResult instanceof CNFOrdinal) {
                    currentTerms = logResult.terms;
                } else {
                    // Can't continue iteratively, but we've already reduced the problem significantly
                    return BigInt(count) + logResult.logStar();
                }
            }

            // Safety break for unexpected cycles or extremely deep chains
            if (count > 100000) {
                throw new Error("Exceeded maximum recursion depth for logStar calculation.");
            }
        }

        // Final result: count of iterations plus logStar of finite result (0 for positive finite, -1 for 0)
        return BigInt(count);
    }

    // Helper method to check if terms represent a finite ordinal
    _isFiniteTerms(terms: any) {
        return terms.length === 0 || (terms.length === 1 && terms[0].exponent.isZero());
    }

    isTower() {
        if (this.isFinite()) {
            return this.isZero() || this.isOne();
        }

        // For infinite ordinals, must be a pure power of omega, like w^k
        if (this.terms.length !== 1 || this.terms[0].coefficient !== 1n) {
            return false;
        }

        // The exponent k must also be a tower.
        const exponent = this.terms[0].exponent;
        return exponent.isTower();
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
            if (n === 0n) {
                return OneOrdinal.instance();
            }
            return new OmegaOrdinal();
        }
        // CNF ordinals here are < ε₀ and infinite
        return new EpsilonZero();
    }

    divideByOmega() {
        if (this.isZero() || this.isFinite()) {
            return ZeroOrdinal.instance();
        }
        const newTerms = [];
        OperationTracer.consume(this.terms.length || 0);
        for (const term of this.terms) {
            const newExponent = term.exponent.leftPredecessor();
            newTerms.push({ exponent: newExponent, coefficient: term.coefficient });
        }
        return new CNFOrdinal(newTerms);
    }

    complexity() {
        OperationTracer.consume();

        if (this.isZero()) return 0;

        if (this.isFinite()) {
            const n = this.getFinitePart();
            if (n === 0n) return 0;
            return n.toString().length;
        }

        // Single-term cases
        if (this.terms.length === 1) {
            const term = this.terms[0];
            const a = term.exponent;
            const m = term.coefficient;

            // ω
            if (this.isOmega()) return 1;

            // ω*m
            if (a.isOne()) {
                // g(ω*m) = g(m)+2; with finite m, g(m) = digits(m) (0 handled earlier)
                const gM = m.toString().length;
                return gM + 2;
            }

            // ω^a
            if (m === 1n) {
                // g(ω^a) = g(a)+4
                return a.complexity() + 4;
            }

            // ω^a*m
            // g(ω^a*m) = g(a)+g(m)+5
            const gA = a.complexity();
            const gM = m.toString().length;
            return gA + gM + 5;
        }

        // Sum: g(x+y) = g(x)+g(y)+1 (add 1 per plus)
        let total = 0;
        OperationTracer.consume(this.terms.length || 0);
        for (const term of this.terms) {
            const single = new CNFOrdinal([term]);
            total += single.complexity();
        }
        total += (this.terms.length - 1);
        return total;
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

    toString() {
        if (this.isZero()) return "0";

        return this.terms.map(term => {
            const coeff = term.coefficient;
            const exp = term.exponent;

            if (exp.isZero()) return coeff.toString();

            let expStr;
            if (exp.isOne()) {
                expStr = "w";
            } else {
                const expCNF = exp.toString();
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

    clone(): CNFOrdinal {
        return new CNFOrdinal(this);
    }

    toFFormat(): any {
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
            const remainderTerms = terms.slice(1).map(t => ({ exponent: t.exponent, coefficient: t.coefficient }));
            const remainderOrdinal = new CNFOrdinal(remainderTerms);
            delta_rep_for_f = remainderOrdinal.toFFormat();
        }
        return { type: 'sum', beta: beta_rep_for_f, c: c_num_for_f, delta: delta_rep_for_f };
    }

    isEpsilonNumber() { return false; }

    epsilonIndex(): OrdinalBase {
        throw new Error('CNFOrdinal is not an epsilon number');
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'CNF'; }

    static getDirectConversions() {
        return ['ENF']; // Can convert directly to ENF
    }

    convertTo(targetTypeName: string): OrdinalBase {
        switch (targetTypeName) {
            case 'ENF':
                return ENFOrdinal.fromCNF(this);

            default:
                throw new Error(`CNFOrdinal cannot convert directly to ${targetTypeName}`);
        }
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

    needsParenthesesAsExponent() {
        // CNF ordinals need parentheses when:
        // a. They have more than 1 term (sums)
        // b. They have a single term with both omega exponent and >1 coefficient (products like w^2*3)
        if (this.terms.length > 1) return true;
        if (this.terms.length === 1) {
            const term = this.terms[0];
            return !term.exponent.isZero() && term.coefficient > 1n;
        }
        return false;
    }

    getLeadingTerm() {
        return this.terms.length > 0 ? this.terms[0] : null;
    }

    // Implement simplify method (extracted from existing CNFOrdinal.simplify)
    simplify(complexityBudget: any, skipMyOwnMPTFCheck = false) {
        OperationTracer.consume(); // For the simplify call itself

        // --- Top-Level MPT Fallback Check (only if not skipping) ---
        if (!skipMyOwnMPTFCheck) {
            if (!this.isZero() && !this.isFinite()) { // Only relevant for infinite ordinals
                const E_this = this.terms[0].exponent; // Consider leading exponent for the MPT structure of 'this'

                // getTowerInfo available via window global
                if (typeof window !== 'undefined' && window.getTowerInfo) {
                    const towerInfo_this = window.getTowerInfo(E_this);
                    let mptStructureOfThis_expPart;
                    if (E_this.isZero()) {
                        mptStructureOfThis_expPart = CNFOrdinal.ZEROStatic();
                    } else {
                        mptStructureOfThis_expPart = (towerInfo_this as any).mptOrdinalForG;
                    }
                    // Check complexity of the exponent's tower structure w^(mpt_of_E_this)
                    const mptExpTowerStructureOfThis = new CNFOrdinal([{ exponent: mptStructureOfThis_expPart, coefficient: 1n }]);
                    const g_mptExpTowerStructureOfThis = mptExpTowerStructureOfThis.complexity();

                    const wTowerHeightForThisApprox = 1n + BigInt((towerInfo_this as any).numOmegas || 0);

                    // If the MPT structure of the leading exponent itself is too costly
                    if (g_mptExpTowerStructureOfThis > complexityBudget && wTowerHeightForThisApprox >= 0) {
                        const wTowerApproxOfThis = new WTowerOrdinal(wTowerHeightForThisApprox);
                        const g_wTowerApproxOfThis = wTowerApproxOfThis.complexity();
                        if (g_wTowerApproxOfThis <= complexityBudget) {
                            return { simplifiedOrdinal: wTowerApproxOfThis, remainingBudget: complexityBudget - g_wTowerApproxOfThis };
                        }
                    }
                }
            }
        }

        // Case 1: this is Zero
        if (this.isZero()) {
            const costThis = this.complexity();
            if (costThis <= complexityBudget) {
                return { simplifiedOrdinal: this, remainingBudget: complexityBudget - costThis };
            } else {
                return { simplifiedOrdinal: this, remainingBudget: 0 };
            }
        }

        // Case 2: this is Finite (but not Zero)
        if (this.isFinite()) {
            const costThis = this.complexity();
            if (costThis <= complexityBudget) {
                return { simplifiedOrdinal: this, remainingBudget: complexityBudget - costThis };
            } else {
                const zeroOrdinal = ZeroOrdinal.instance();
                const costZero = zeroOrdinal.complexity();
                if (costZero <= complexityBudget) {
                    return { simplifiedOrdinal: zeroOrdinal, remainingBudget: complexityBudget - costZero };
                } else {
                    return { simplifiedOrdinal: zeroOrdinal, remainingBudget: 0 };
                }
            }
        }

        // Case 3: this is an Infinite Ordinal (single term or sum)
        if (this.terms.length === 1) { // It's an infinite single term like w^a*m or w^a
            const term = this.terms[0];
            return this._simplifyCNFSingleTermRule(term.exponent, term.coefficient, complexityBudget, skipMyOwnMPTFCheck, false);
        } else { // It's an actual sum
            let simplifiedAccumulator = ZeroOrdinal.instance();
            let currentOverallBudget = complexityBudget;

            OperationTracer.consume(this.terms.length || 0);
            for (let i = 0; i < this.terms.length; i++) {
                const term = this.terms[i];
                const E_i = term.exponent;
                const C_i = term.coefficient;

                OperationTracer.consume();

                let operatorCost = simplifiedAccumulator.isZero() ? 0 : 1;

                const budgetForTermSimplification = currentOverallBudget - operatorCost;

                if (budgetForTermSimplification < 0) {
                    break;
                }

                const simplifiedTermResult = this._simplifyCNFSingleTermRule(E_i, C_i, budgetForTermSimplification, false, true);
                const simplifiedTermToAdd = simplifiedTermResult.simplifiedOrdinal;
                const g_simplifiedTermToAdd = simplifiedTermToAdd.complexity();

                let actualOperatorCost = (!simplifiedAccumulator.isZero() && !simplifiedTermToAdd.isZero()) ? 1 : 0;

                if ((g_simplifiedTermToAdd + actualOperatorCost) <= currentOverallBudget) {
                    simplifiedAccumulator = simplifiedAccumulator.add(simplifiedTermToAdd);
                    currentOverallBudget -= (g_simplifiedTermToAdd + actualOperatorCost);

                    const originalTerm_i = new CNFOrdinal([{ exponent: E_i, coefficient: C_i }]);
                    if (!simplifiedTermToAdd.equals(originalTerm_i)) {
                        break; // Rule 2: Term was reduced, so stop
                    }
                } else {
                    break;
                }
            }

            currentOverallBudget = Math.max(0, currentOverallBudget);

            const g_simplifiedAccumulator = simplifiedAccumulator.complexity();
            let finalSimplifiedOrdinal = simplifiedAccumulator;
            let finalRemainingBudget = currentOverallBudget;

            let accumulatorIsAcceptable = (g_simplifiedAccumulator <= complexityBudget &&
                simplifiedAccumulator.compareTo(this) <= 0);

            if (!accumulatorIsAcceptable) {
                const g_this = this.complexity();
                if (g_this <= complexityBudget) {
                    finalSimplifiedOrdinal = this as OrdinalBase;
                    finalRemainingBudget = complexityBudget - g_this;
                } else {
                    if (!this.isZero() && this.terms.length > 0) {
                        const leadingTerm = this.terms[0];
                        const simplifiedLeadingTermResult = this._simplifyCNFSingleTermRule(
                            leadingTerm.exponent, leadingTerm.coefficient, complexityBudget, true, false
                        );
                        const simplifiedLeadingOrd = simplifiedLeadingTermResult.simplifiedOrdinal;
                        const g_simplifiedLeading = simplifiedLeadingOrd.complexity();

                        if (g_simplifiedLeading <= complexityBudget && simplifiedLeadingOrd.compareTo(this) <= 0) {
                            finalSimplifiedOrdinal = simplifiedLeadingOrd as OrdinalBase;
                            finalRemainingBudget = complexityBudget - g_simplifiedLeading;
                        } else {
                            const zeroStatic = ZeroOrdinal.instance();
                            const g_zero_final = zeroStatic.complexity();
                            finalSimplifiedOrdinal = zeroStatic;
                            finalRemainingBudget = (g_zero_final <= complexityBudget) ? complexityBudget - g_zero_final : 0;
                        }
                    } else {
                        const zeroStatic = ZeroOrdinal.instance();
                        const g_zero_final = zeroStatic.complexity();
                        finalSimplifiedOrdinal = zeroStatic;
                        finalRemainingBudget = (g_zero_final <= complexityBudget) ? complexityBudget - g_zero_final : 0;
                    }
                }
            }
            return { simplifiedOrdinal: finalSimplifiedOrdinal, remainingBudget: finalRemainingBudget };
        }
    }

    _simplifyCNFSingleTermRule(expB: any, coeffM: any, budgetForThisTerm: any, skipMPTFCheckForThisTerm = false, isPartOfSumContext = false) {
        OperationTracer.consume();

        if (expB.isZero()) {
            const finiteOrdinalTerm = new CNFOrdinal(coeffM);
            const g_coeffM_actual = finiteOrdinalTerm.complexity();
            if (g_coeffM_actual <= budgetForThisTerm) {
                return { simplifiedOrdinal: finiteOrdinalTerm, remainingBudget: budgetForThisTerm - g_coeffM_actual };
            }
            const zeroOrd = ZeroOrdinal.instance();
            const g_zero_finite_fallback = zeroOrd.complexity();
            return { simplifiedOrdinal: zeroOrd, remainingBudget: (g_zero_finite_fallback <= budgetForThisTerm) ? budgetForThisTerm - g_zero_finite_fallback : 0 };
        }

        if (!skipMPTFCheckForThisTerm) {
            OperationTracer.consume();
            if (typeof window !== 'undefined' && window.getTowerInfo) {
                const towerInfo = window.getTowerInfo(expB);
                const mptExponentPart = (towerInfo as any).mptOrdinalForG;
                const mptExpTowerStructure = new CNFOrdinal([{ exponent: mptExponentPart, coefficient: 1n }]);
                const g_mptExpTowerStructure = mptExpTowerStructure.complexity();
                const wTowerHeightForApproximation = 1n + BigInt((towerInfo as any).numOmegas || 0);

                if (g_mptExpTowerStructure > budgetForThisTerm) {
                    const zeroOrd = ZeroOrdinal.instance();
                    const g_zero = zeroOrd.complexity();
                    if (isPartOfSumContext) {
                        return { simplifiedOrdinal: zeroOrd, remainingBudget: (g_zero <= budgetForThisTerm) ? budgetForThisTerm - g_zero : 0 };
                    } else if (wTowerHeightForApproximation >= 0) {
                        const wTowerApproximation = new WTowerOrdinal(wTowerHeightForApproximation);
                        const g_wTowerApproximation = wTowerApproximation.complexity();
                        if (g_wTowerApproximation <= budgetForThisTerm) {
                            return { simplifiedOrdinal: wTowerApproximation, remainingBudget: budgetForThisTerm - g_wTowerApproximation };
                        }
                        return { simplifiedOrdinal: zeroOrd, remainingBudget: (g_zero <= budgetForThisTerm) ? budgetForThisTerm - g_zero : 0 };
                    }
                }
            }
        }

        const originalTermOrdinal = new CNFOrdinal([{ exponent: expB, coefficient: coeffM }]);
        const g_originalTermOrdinal = originalTermOrdinal.complexity();
        if (g_originalTermOrdinal <= budgetForThisTerm) {
            return { simplifiedOrdinal: originalTermOrdinal, remainingBudget: budgetForThisTerm - g_originalTermOrdinal };
        }

        const cost_w_op_structure = 4;
        const budgetFor_expB_simplification = budgetForThisTerm - cost_w_op_structure;

        if (budgetFor_expB_simplification >= 0) {
            const h_expB_result = expB.simplify(budgetFor_expB_simplification, true);
            const h_expB = h_expB_result.simplifiedOrdinal;

            let current_simplified_ordinal = new CNFOrdinal([{ exponent: h_expB, coefficient: 1n }]);
            let g_current_simplified = current_simplified_ordinal.complexity();

            if (g_current_simplified <= budgetForThisTerm) {
                let remaining_budget_after_exp_part = budgetForThisTerm - g_current_simplified;
                const expB_was_reduced = !h_expB.equals(expB);

                if (coeffM > 1n && !expB_was_reduced) {
                    const g_coeffM_val = (new CNFOrdinal(coeffM)).complexity();
                    const cost_of_mult_and_coeffM = 1 + g_coeffM_val;

                    if (cost_of_mult_and_coeffM <= remaining_budget_after_exp_part) {
                        const final_ordinal_with_coeff = new CNFOrdinal([{ exponent: h_expB, coefficient: coeffM }]);
                        if (final_ordinal_with_coeff.complexity() <= budgetForThisTerm) {
                            return {
                                simplifiedOrdinal: final_ordinal_with_coeff,
                                remainingBudget: budgetForThisTerm - final_ordinal_with_coeff.complexity()
                            };
                        }
                    }
                }
                return {
                    simplifiedOrdinal: current_simplified_ordinal,
                    remainingBudget: remaining_budget_after_exp_part
                };
            }
        }

        const omegaStatic = CNFOrdinal.OMEGAStatic();
        const omega_cost_actual = omegaStatic.complexity();
        if (omega_cost_actual <= budgetForThisTerm) {
            return { simplifiedOrdinal: omegaStatic, remainingBudget: budgetForThisTerm - omega_cost_actual };
        }

        const zeroStatic = ZeroOrdinal.instance();
        const zero_cost_actual = zeroStatic.complexity();
        return { simplifiedOrdinal: zeroStatic, remainingBudget: (zero_cost_actual <= budgetForThisTerm) ? budgetForThisTerm - zero_cost_actual : 0 };
    }

    // === STATIC FACTORY METHODS ===

    private static _zeroInstance: CNFOrdinal | null = null;
    private static _oneInstance: CNFOrdinal | null = null;
    private static _omegaInstance: CNFOrdinal | null = null;

    static fromInt(value: number | bigint): CNFOrdinal {
        return new CNFOrdinal(value);
    }

    static ZEROStatic(): CNFOrdinal {
        if (!CNFOrdinal._zeroInstance) {
            CNFOrdinal._zeroInstance = new CNFOrdinal(0n);
        }
        return CNFOrdinal._zeroInstance;
    }

    static ONEStatic(): CNFOrdinal {
        if (!CNFOrdinal._oneInstance) {
            CNFOrdinal._oneInstance = new CNFOrdinal(1n);
        }
        return CNFOrdinal._oneInstance;
    }

    static OMEGAStatic(): CNFOrdinal {
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
export const ALLOW_EPSILON_IN_CNF = true;
