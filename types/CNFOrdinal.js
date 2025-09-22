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
            if (this._tracer) this._tracer.consume(initVal.length || 0);
            this.terms = initVal.map(t => ({
                exponent: t.exponent.clone(this._tracer),
                coefficient: t.coefficient
            }));
        } else if (typeof initVal === 'object' && initVal.constructor) {
            // Handle various ordinal types
            if (initVal instanceof CNFOrdinal) {
                if (this._tracer) this._tracer.consume(initVal.terms.length || 0);
                this.terms = initVal.terms.map(t => ({
                    exponent: t.exponent.clone(this._tracer),
                    coefficient: t.coefficient
                }));
            } else if (typeof ENFOrdinal !== 'undefined' && initVal instanceof ENFOrdinal) {
                const cnf = initVal.toCNFOrdinal();
                if (this._tracer) this._tracer.consume(cnf.terms.length || 0);
                this.terms = cnf.terms.map(t => ({ exponent: t.exponent.clone(this._tracer), coefficient: t.coefficient }));
            } else if (initVal instanceof WTowerOrdinal) {
                const cnf = initVal.toCNFOrdinal();
                if (this._tracer) this._tracer.consume(cnf.terms.length || 0);
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
            return new ZeroOrdinal(this._tracer);
        }
        if (this.isFinite()) {
            return new OneOrdinal(this._tracer);
        }
        return new OmegaOrdinal(this._tracer);
    }

    log() {
        if (this.isZero()) {
            throw new Error('Log of 0 is undefined.');
        }
        if (this.isFinite()) {
            return new ZeroOrdinal(this._tracer);
        }
        return this.terms[0].exponent.clone(this._tracer);
    }

    logStar() {
        if (this.isFinite()) {
            if (this.isZero()) {
                return -1n;
            } else {
                return 0n;
            }
        }

        let count = 0;
        let current = this;
        // Iterate until the ordinal becomes finite
        while (!current.isFinite()) {
            count++;
            current = current.log();
            // Safety break for unexpected cycles or extremely deep chains
            if (count > 1000) {
                throw new Error("Exceeded maximum recursion depth for logStar calculation.");
            }
        }

        // 'current' is now a finite ordinal. Get its logStar value (-1 for 0, 0 for >0)
        const finalPart = current.logStar();
        return BigInt(count) + finalPart;
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
            if (n === 0n) return new OneOrdinal(this._tracer);
            return new OmegaOrdinal(this._tracer);
        }
        // CNF ordinals here are < ε₀ and infinite
        return new EpsilonZero(this._tracer);
    }

    // === EXPONENT/OMEGA HELPERS (needed for CNF exponentiation) ===
    exponentPredecessor() {
        if (this.isZero()) {
            return new ZeroOrdinal(this._tracer);
        }
        if (this.isFinite()) {
            const n = this.getFinitePart();
            if (n <= 1n) return new ZeroOrdinal(this._tracer);
            return new FiniteOrdinal(n - 1n, this._tracer);
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
            return new ZeroOrdinal(this._tracer);
        }
        const newTerms = [];
        if (this._tracer) this._tracer.consume(this.terms.length || 0);
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
        if (this._tracer) this._tracer.consume(this.terms.length || 0);
        for (const term of this.terms) {
            const single = new CNFOrdinal([term], this._tracer);
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

    isEpsilonNumber() { return false; }

    epsilonIndex() {
        throw new Error('CNFOrdinal is not an epsilon number');
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
        if (this._tracer) this._tracer.consume(); // For the simplify call itself

        // --- Top-Level MPT Fallback Check (only if not skipping) ---
        if (!skipMyOwnMPTFCheck) {
            if (!this.isZero() && !this.isFinite()) { // Only relevant for infinite ordinals
                const E_this = this.terms[0].exponent; // Consider leading exponent for the MPT structure of 'this'

                const towerInfo_this = getTowerInfo(E_this, this._tracer);
                let mptStructureOfThis_expPart;
                if (E_this.isZero()) {
                    mptStructureOfThis_expPart = CNFOrdinal.ZEROStatic().clone(this._tracer);
                } else {
                    mptStructureOfThis_expPart = towerInfo_this.mptOrdinalForG;
                }
                // Check complexity of the exponent's tower structure w^(mpt_of_E_this)
                const mptExpTowerStructureOfThis = new CNFOrdinal([{ exponent: mptStructureOfThis_expPart.clone(this._tracer), coefficient: 1n }], this._tracer);
                const g_mptExpTowerStructureOfThis = mptExpTowerStructureOfThis.complexity();

                const wTowerHeightForThisApprox = 1n + towerInfo_this.numOmegas;

                // If the MPT structure of the leading exponent itself is too costly
                if (g_mptExpTowerStructureOfThis > complexityBudget && wTowerHeightForThisApprox >= 0) {
                    const wTowerApproxOfThis = new WTowerOrdinal(wTowerHeightForThisApprox, this._tracer);
                    const g_wTowerApproxOfThis = wTowerApproxOfThis.complexity();
                    if (g_wTowerApproxOfThis <= complexityBudget) {
                        return { simplifiedOrdinal: wTowerApproxOfThis, remainingBudget: complexityBudget - g_wTowerApproxOfThis };
                    }
                }
            }
        }

        // Case 1: this is Zero
        if (this.isZero()) {
            const costThis = this.complexity();
            if (costThis <= complexityBudget) {
                return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - costThis };
            } else {
                return { simplifiedOrdinal: this.clone(), remainingBudget: 0 };
            }
        }

        // Case 2: this is Finite (but not Zero)
        if (this.isFinite()) {
            const costThis = this.complexity();
            if (costThis <= complexityBudget) {
                return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - costThis };
            } else {
                const zeroOrdinal = new ZeroOrdinal(this._tracer);
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
            return this._simplifyCNFSingleTermRule(term.exponent, term.coefficient, complexityBudget, this._tracer, skipMyOwnMPTFCheck, false);
        } else { // It's an actual sum
            let simplifiedAccumulator = new ZeroOrdinal(this._tracer);
            let currentOverallBudget = complexityBudget;

            if (this._tracer) this._tracer.consume(this.terms.length || 0);
            for (let i = 0; i < this.terms.length; i++) {
                const term = this.terms[i];
                const E_i = term.exponent;
                const C_i = term.coefficient;

                if (this._tracer) this._tracer.consume();

                let operatorCost = simplifiedAccumulator.isZero() ? 0 : 1;

                const budgetForTermSimplification = currentOverallBudget - operatorCost;

                if (budgetForTermSimplification < 0) {
                    break;
                }

                const simplifiedTermResult = this._simplifyCNFSingleTermRule(E_i, C_i, budgetForTermSimplification, this._tracer, false, true);
                const simplifiedTermToAdd = simplifiedTermResult.simplifiedOrdinal;
                const g_simplifiedTermToAdd = simplifiedTermToAdd.complexity();

                let actualOperatorCost = (!simplifiedAccumulator.isZero() && !simplifiedTermToAdd.isZero()) ? 1 : 0;

                if ((g_simplifiedTermToAdd + actualOperatorCost) <= currentOverallBudget) {
                    simplifiedAccumulator = simplifiedAccumulator.add(simplifiedTermToAdd);
                    currentOverallBudget -= (g_simplifiedTermToAdd + actualOperatorCost);

                    const originalTerm_i = new CNFOrdinal([{ exponent: E_i, coefficient: C_i }], this._tracer);
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
                    finalSimplifiedOrdinal = this.clone(this._tracer);
                    finalRemainingBudget = complexityBudget - g_this;
                } else {
                    if (!this.isZero() && this.terms.length > 0) {
                        const leadingTerm = this.terms[0];
                        const simplifiedLeadingTermResult = this._simplifyCNFSingleTermRule(
                            leadingTerm.exponent, leadingTerm.coefficient, complexityBudget, this._tracer, true, false
                        );
                        const simplifiedLeadingOrd = simplifiedLeadingTermResult.simplifiedOrdinal;
                        const g_simplifiedLeading = simplifiedLeadingOrd.complexity();

                        if (g_simplifiedLeading <= complexityBudget && simplifiedLeadingOrd.compareTo(this) <= 0) {
                            finalSimplifiedOrdinal = simplifiedLeadingOrd;
                            finalRemainingBudget = complexityBudget - g_simplifiedLeading;
                        } else {
                            const zeroStatic = new ZeroOrdinal(this._tracer);
                            const g_zero_final = zeroStatic.complexity();
                            finalSimplifiedOrdinal = zeroStatic.clone(this._tracer);
                            finalRemainingBudget = (g_zero_final <= complexityBudget) ? complexityBudget - g_zero_final : 0;
                        }
                    } else {
                        const zeroStatic = new ZeroOrdinal(this._tracer);
                        const g_zero_final = zeroStatic.complexity();
                        finalSimplifiedOrdinal = zeroStatic.clone(this._tracer);
                        finalRemainingBudget = (g_zero_final <= complexityBudget) ? complexityBudget - g_zero_final : 0;
                    }
                }
            }
            return { simplifiedOrdinal: finalSimplifiedOrdinal, remainingBudget: finalRemainingBudget };
        }
    }

    _simplifyCNFSingleTermRule(expB, coeffM, budgetForThisTerm, tracer, skipMPTFCheckForThisTerm = false, isPartOfSumContext = false) {
        if (tracer) tracer.consume();

        if (expB.isZero()) {
            const finiteOrdinalTerm = new CNFOrdinal(coeffM, tracer);
            const g_coeffM_actual = finiteOrdinalTerm.complexity();
            if (g_coeffM_actual <= budgetForThisTerm) {
                return { simplifiedOrdinal: finiteOrdinalTerm, remainingBudget: budgetForThisTerm - g_coeffM_actual };
            }
            const zeroOrd = new ZeroOrdinal(this._tracer);
            const g_zero_finite_fallback = zeroOrd.complexity();
            return { simplifiedOrdinal: zeroOrd, remainingBudget: (g_zero_finite_fallback <= budgetForThisTerm) ? budgetForThisTerm - g_zero_finite_fallback : 0 };
        }

        if (!skipMPTFCheckForThisTerm) {
            if (tracer) tracer.consume();
            const towerInfo = getTowerInfo(expB, tracer);
            const mptExponentPart = towerInfo.mptOrdinalForG;
            const mptExpTowerStructure = new CNFOrdinal([{ exponent: mptExponentPart.clone(tracer), coefficient: 1n }], tracer);
            const g_mptExpTowerStructure = mptExpTowerStructure.complexity();
            const wTowerHeightForApproximation = 1n + towerInfo.numOmegas;

            if (g_mptExpTowerStructure > budgetForThisTerm) {
                const zeroOrd = new ZeroOrdinal(this._tracer);
                const g_zero = zeroOrd.complexity();
                if (isPartOfSumContext) {
                    return { simplifiedOrdinal: zeroOrd, remainingBudget: (g_zero <= budgetForThisTerm) ? budgetForThisTerm - g_zero : 0 };
                } else if (wTowerHeightForApproximation >= 0) {
                    const wTowerApproximation = new WTowerOrdinal(wTowerHeightForApproximation, tracer);
                    const g_wTowerApproximation = wTowerApproximation.complexity();
                    if (g_wTowerApproximation <= budgetForThisTerm) {
                        return { simplifiedOrdinal: wTowerApproximation, remainingBudget: budgetForThisTerm - g_wTowerApproximation };
                    }
                    return { simplifiedOrdinal: zeroOrd, remainingBudget: (g_zero <= budgetForThisTerm) ? budgetForThisTerm - g_zero : 0 };
                }
            }
        }

        const originalTermOrdinal = new CNFOrdinal([{ exponent: expB.clone(tracer), coefficient: coeffM }], tracer);
        const g_originalTermOrdinal = originalTermOrdinal.complexity();
        if (g_originalTermOrdinal <= budgetForThisTerm) {
            return { simplifiedOrdinal: originalTermOrdinal, remainingBudget: budgetForThisTerm - g_originalTermOrdinal };
        }

        const cost_w_op_structure = 4;
        const budgetFor_expB_simplification = budgetForThisTerm - cost_w_op_structure;

        if (budgetFor_expB_simplification >= 0) {
            const h_expB_result = expB.simplify(budgetFor_expB_simplification, true);
            const h_expB = h_expB_result.simplifiedOrdinal;

            let current_simplified_ordinal = new CNFOrdinal([{ exponent: h_expB, coefficient: 1n }], tracer);
            let g_current_simplified = current_simplified_ordinal.complexity();

            if (g_current_simplified <= budgetForThisTerm) {
                let remaining_budget_after_exp_part = budgetForThisTerm - g_current_simplified;
                const expB_was_reduced = !h_expB.equals(expB);

                if (coeffM > 1n && !expB_was_reduced) {
                    const g_coeffM_val = (new CNFOrdinal(coeffM, tracer)).complexity();
                    const cost_of_mult_and_coeffM = 1 + g_coeffM_val;

                    if (cost_of_mult_and_coeffM <= remaining_budget_after_exp_part) {
                        const final_ordinal_with_coeff = new CNFOrdinal([{ exponent: h_expB, coefficient: coeffM }], tracer);
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
            return { simplifiedOrdinal: omegaStatic.clone(tracer), remainingBudget: budgetForThisTerm - omega_cost_actual };
        }

        const zeroStatic = new ZeroOrdinal(this._tracer);
        const zero_cost_actual = zeroStatic.complexity();
        return { simplifiedOrdinal: zeroStatic.clone(tracer), remainingBudget: (zero_cost_actual <= budgetForThisTerm) ? budgetForThisTerm - zero_cost_actual : 0 };
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
