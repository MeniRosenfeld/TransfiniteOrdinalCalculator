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

    /**
     * Calculates the complexity of the CNFOrdinal based on a defined set of rules.
     * g(n) = number of decimal digits in n
     * g(w) = 1
     * g(w*m) = g(m)+2
     * g(w^a) = g(a)+4  (where a is not 0 or 1, and not part of w*m)
     * g(w^a*m) = g(a)+g(m)+5 (where a is not 0 or 1, and not part of w*m)
     * g(x+y) = g(x)+g(y)+1
     * @returns {number} The calculated complexity.
     */
    complexity() {
        if (this._tracer) this._tracer.consume(); // Count as an operation

        if (this.isZero()) {
            return 0; // g(0) - Now defined as 0
        }

        if (this.isFinite()) {
            const n_str = this.terms[0].coefficient.toString();
            return n_str.length; // g(n) = number of decimal digits
        }

        // Specific rules for single term ordinals take precedence
        if (this.terms.length === 1) {
            const term = this.terms[0];
            const exponent = term.exponent; // This is a CNFOrdinal instance
            const coefficient = term.coefficient;

            // g(w) = 1
            if (this.isOmega()) { // Checks if this ordinal is precisely w^1*1
                return 1;
            }

            // g(w*m) = g(m)+2 
            // (this is w^1*m where m > 1)
            if (exponent.equals(CNFOrdinal.ONEStatic()) && coefficient > 1n) {
                const m_complexity = coefficient.toString().length;
                return m_complexity + 2;
            }
            
            // g(w^a*m) or g(w^a) where a is not 0 or 1.
            // The checks for isOmega and (exponent.isOne() && coeff > 1n) cover a=1 cases.
            // If exponent is zero, it's finite (handled above).
            if (!exponent.isZero() && !exponent.equals(CNFOrdinal.ONEStatic())) {
                const a_complexity = exponent.complexity(); // g(a)
                if (coefficient === 1n) { // g(w^a) = g(a)+4
                    return a_complexity + 4;
                }
                // g(w^a*m) = g(a)+g(m)+5 (m > 1)
                const m_complexity = coefficient.toString().length;
                return a_complexity + m_complexity + 5;
            }
            // Fallback for any single term not caught above (should ideally not happen if rules are comprehensive)
            // For example, if it was w^0*m (a finite number), it's caught by isFinite().
            // If it was w^1*1 (i.e. w), it's caught by isOmega().
            // If it was w^1*m (m>1), it's caught by the g(w*m) rule.
        }

        // General sum: g(x+y) = g(x)+g(y)+1. Applied iteratively.
        // The CNF is t1 + t2 + ... + tk
        let totalComplexity = 0;
        for (let i = 0; i < this.terms.length; i++) {
            // Create a temporary CNFOrdinal for each term to get its individual complexity
            // This ensures the single-term rules (g(w), g(w*m), g(w^a), g(w^a*m)) are applied to each term.
            const singleTermOrdinal = new CNFOrdinal([this.terms[i]], this._tracer);
            totalComplexity += singleTermOrdinal.complexity(); 
        }
        
        if (this.terms.length > 1) {
            totalComplexity += (this.terms.length - 1); // Add 1 for each '+' sign
        }
        
        return totalComplexity;
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume(); // For the simplify call itself

        // --- Top-Level MPT Fallback Check (only if not skipping) ---
        if (!skipMyOwnMPTFCheck) {
            if (!this.isZero() && !this.isFinite()) { // Only relevant for infinite ordinals
                const E_this = this.terms[0].exponent; // Consider leading exponent for the MPT structure of 'this'
                // const C_this_leading = this.terms[0].coefficient; // Coefficient not directly used in g(w^(mpt_of_E_this)) check
                
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

                const wTowerHeightForThisApprox = 1 + towerInfo_this.numOmegas; // Changed: 1 + numOmegas

                // If the MPT structure of the leading exponent itself is too costly
                if (g_mptExpTowerStructureOfThis > complexityBudget && wTowerHeightForThisApprox >= 0) {
                    const wTowerApproxOfThis = new WTowerOrdinal(wTowerHeightForThisApprox, this._tracer);
                    const g_wTowerApproxOfThis = wTowerApproxOfThis.complexity();
                    if (g_wTowerApproxOfThis <= complexityBudget) {
                        return { simplifiedOrdinal: wTowerApproxOfThis, remainingBudget: complexityBudget - g_wTowerApproxOfThis };
                    }
                    // If WTower approx of 'this' also doesn't fit, we proceed to other simplification methods below,
                    // but internal MPT checks will be skipped because skipMyOwnMPTFCheck will be true for recursive calls.
                }
            }
        }
        // If MPT fallback for 'this' was not taken or skipMyOwnMPTFCheck was true, proceed:

        // Case 1: this is Zero
        if (this.isZero()) {
            const costThis = this.complexity(); // consumes op
            if (costThis <= complexityBudget) {
                return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - costThis };
            } else {
                return { simplifiedOrdinal: this.clone(), remainingBudget: 0 };
            }
        }

        // Case 2: this is Finite (but not Zero)
        if (this.isFinite()) {
            const costThis = this.complexity(); // consumes op
            if (costThis <= complexityBudget) {
                return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - costThis };
            } else {
                const zeroOrdinal = CNFOrdinal.ZEROStatic().clone(this._tracer);
                const costZero = zeroOrdinal.complexity(); // consumes op
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
            // For this single term, the MPT check inside _simplifyCNFSingleTermRule should be controlled
            // by the 'skipMyOwnMPTFCheck' passed to the main simplify method.
            // It's NOT part of a sum context in this direct call.
            return this._simplifyCNFSingleTermRule(term.exponent, term.coefficient, complexityBudget, this._tracer, skipMyOwnMPTFCheck, false);
        } else { // It's an actual sum (this.terms.length > 1 or this.terms.length === 0 if it was already handled by isZero)
            let simplifiedAccumulator = CNFOrdinal.ZEROStatic().clone(this._tracer);
            let currentOverallBudget = complexityBudget;
            let termsActuallyAddedToSum = 0;

            for (let i = 0; i < this.terms.length; i++) {
                const term = this.terms[i]; // b_i
                const E_i = term.exponent;
                const C_i = term.coefficient;

                if (this._tracer) this._tracer.consume(); // For the loop iteration

                // Determine cost of operator before simplifying the term
                let operatorCost = 0;
                if (!simplifiedAccumulator.isZero()) { // If accumulator is not empty, a '+' will be needed IF the current term isn't zero.
                                                    // We don't know if term will be zero yet, but must provision for '+'.
                                                    // However, if currentOverallBudget is already too low for a '+', we might break early.
                    operatorCost = 1;
                }

                const budgetForTermSimplification = currentOverallBudget - operatorCost;

                if (budgetForTermSimplification < 0 && operatorCost > 0) { // Cannot even afford the operator
                     // If operatorCost was 0 (e.g. first term), budgetForTermSimplification is currentOverallBudget, proceed.
                    break;
                }
                if (budgetForTermSimplification < 0 && operatorCost === 0) { // Budget is negative even for the first term
                    break;
                }

                const simplifiedTermResult = this._simplifyCNFSingleTermRule(E_i, C_i, budgetForTermSimplification, this._tracer, false, true);
                const simplifiedTermToAdd = simplifiedTermResult.simplifiedOrdinal;
                const g_simplifiedTermToAdd = simplifiedTermToAdd.complexity();

                // Now, re-evaluate actual operator cost based on simplifiedTermToAdd
                let actualOperatorCost = 0;
                if (!simplifiedAccumulator.isZero() && !simplifiedTermToAdd.isZero()) {
                    actualOperatorCost = 1;
                }
                // If provisioned operatorCost was 1, but simplifiedTermToAdd is 0, we get that '1' budget back for the term implicitly.
                // The budgetForTermSimplification already had the provisional 1 removed.
                // If actualOperatorCost is 0 (because term became 0), then budgetForTermSimplification was effectively currentOverallBudget.

                if (g_simplifiedTermToAdd <= budgetForTermSimplification) { // Check if term fits the budget allocated FOR THE TERM
                    // Now check if term + actual_operator_cost fits the *original* currentOverallBudget slice for this iteration
                    if ((g_simplifiedTermToAdd + actualOperatorCost) <= currentOverallBudget) {
                        simplifiedAccumulator = simplifiedAccumulator.add(simplifiedTermToAdd);
                        currentOverallBudget -= (g_simplifiedTermToAdd + actualOperatorCost);
                        termsActuallyAddedToSum++;

                        const originalTerm_i = new CNFOrdinal([{ exponent: E_i, coefficient: C_i }], this._tracer);
                        if (!simplifiedTermToAdd.equals(originalTerm_i)) {
                            break; // Rule 2: Term was reduced/changed, so stop processing further terms
                        }
                    } else {
                        // Simplified term fit its own budget, but with operator, it exceeds currentOverallBudget slice.
                        break;
                    }
                } else {
                    // Term could not be simplified to fit budgetForTermSimplification. Break.
                    break;
                }
            }

            // Ensure budget is not negative after all deductions (this can remain as a safeguard)
            currentOverallBudget = Math.max(0, currentOverallBudget);


            // Final checks for the assembled simplifiedAccumulator
            // The final result can be CNFOrdinal or WTowerOrdinal if the input was a single term that simplified to WTower.
            // However, if simplifiedAccumulator was built through a sum, it will be CNFOrdinal due to .add().
            const g_simplifiedAccumulator = simplifiedAccumulator.complexity();
            let finalSimplifiedOrdinal = simplifiedAccumulator;
            let finalRemainingBudget = currentOverallBudget;

            // Condition 1: The built accumulator is acceptable
            let accumulatorIsAcceptable = (g_simplifiedAccumulator <= complexityBudget && 
                                           simplifiedAccumulator.compareTo(this) <= 0);
            
            if (accumulatorIsAcceptable) {
                // Use finalSimplifiedOrdinal = simplifiedAccumulator and finalRemainingBudget = currentOverallBudget
            } else {
                // Accumulator is not acceptable. Try other fallbacks.
                // Condition 2: Fallback - Original 'this' fits the budget
                const g_this = this.complexity();
                if (g_this <= complexityBudget) {
                    finalSimplifiedOrdinal = this.clone(this._tracer);
                    finalRemainingBudget = complexityBudget - g_this;
                } else {
                    // Condition 3: Fallback - Leading term of 'this' simplified
                    // (Only if 'this' is not zero and has terms)
                    if (!this.isZero() && this.terms.length > 0) {
                        const leadingTerm = this.terms[0];
                        const simplifiedLeadingTermResult = this._simplifyCNFSingleTermRule(
                            leadingTerm.exponent, leadingTerm.coefficient, complexityBudget, this._tracer, true, false
                        );
                        const simplifiedLeadingOrd = simplifiedLeadingTermResult.simplifiedOrdinal; // Can be CNF or WTower
                        const g_simplifiedLeading = simplifiedLeadingOrd.complexity();

                        // Check if this simplified leading term is better than a potentially invalid accumulator
                        if (g_simplifiedLeading <= complexityBudget && simplifiedLeadingOrd.compareTo(this) <= 0) {
                            finalSimplifiedOrdinal = simplifiedLeadingOrd;
                            finalRemainingBudget = complexityBudget - g_simplifiedLeading;
                        } else {
                            // Condition 4: Final fallback to Zero
                            const zeroStatic = CNFOrdinal.ZEROStatic();
                            const g_zero_final = zeroStatic.complexity();
                            finalSimplifiedOrdinal = zeroStatic.clone(this._tracer);
                            if (g_zero_final <= complexityBudget) {
                                finalRemainingBudget = complexityBudget - g_zero_final;
                            } else {
                                finalRemainingBudget = 0;
                            }
                        }
                    } else {
                        // Condition 4 (also): Original 'this' is zero or has no terms (should be caught by earlier cases)
                        const zeroStatic = CNFOrdinal.ZEROStatic();
                        const g_zero_final = zeroStatic.complexity();
                        finalSimplifiedOrdinal = zeroStatic.clone(this._tracer);
                        if (g_zero_final <= complexityBudget) {
                            finalRemainingBudget = complexityBudget - g_zero_final;
                        } else {
                            finalRemainingBudget = 0;
                        }
                    }
                }
            }
            return { simplifiedOrdinal: finalSimplifiedOrdinal, remainingBudget: finalRemainingBudget };
        }
    }

    _simplifyCNFSingleTermRule(expB, coeffM, budgetForThisTerm, tracer, skipMPTFCheckForThisTerm = false, isPartOfSumContext = false) {
        if (tracer) tracer.consume(); // For calling this rule

        // Handle finite term case directly: w^0 * coeffM = coeffM
        if (expB.isZero()) {
            const finiteOrdinalTerm = CNFOrdinal.fromInt(coeffM, tracer);
            const g_coeffM_actual = finiteOrdinalTerm.complexity();
            if (g_coeffM_actual <= budgetForThisTerm) {
                return { simplifiedOrdinal: finiteOrdinalTerm, remainingBudget: budgetForThisTerm - g_coeffM_actual };
            }
            const zeroOrd = CNFOrdinal.ZEROStatic().clone(tracer);
            const g_zero_finite_fallback = zeroOrd.complexity();
            if (g_zero_finite_fallback <= budgetForThisTerm) {
                return { simplifiedOrdinal: zeroOrd, remainingBudget: budgetForThisTerm - g_zero_finite_fallback };
            }
            return { simplifiedOrdinal: zeroOrd, remainingBudget: 0 };
        }

        // --- MPT Check & Fallback Block (only if not skipping) ---
        if (!skipMPTFCheckForThisTerm) {
            if (tracer) tracer.consume(); // For the MPT check itself
            const towerInfo = getTowerInfo(expB, tracer);
            const mptExponentPart = towerInfo.mptOrdinalForG;
            const mptExpTowerStructure = new CNFOrdinal([{ exponent: mptExponentPart.clone(tracer), coefficient: 1n }], tracer);
            const g_mptExpTowerStructure = mptExpTowerStructure.complexity();
            const wTowerHeightForApproximation = 1 + towerInfo.numOmegas; // Changed: 1 + numOmegas

            if (g_mptExpTowerStructure > budgetForThisTerm) { // MPT structure itself is too costly for this term's budget slice
                if (isPartOfSumContext) {
                    // If part of a sum context and MPT fails for the term, discard the term (simplify to 0 for this slot)
                    const zeroOrd_sum_mpt_fail = CNFOrdinal.ZEROStatic().clone(tracer);
                    const g_zero_sum_mpt_fail = zeroOrd_sum_mpt_fail.complexity();
                    if (g_zero_sum_mpt_fail <= budgetForThisTerm) {
                        return { simplifiedOrdinal: zeroOrd_sum_mpt_fail, remainingBudget: budgetForThisTerm - g_zero_sum_mpt_fail };
                    }
                    return { simplifiedOrdinal: zeroOrd_sum_mpt_fail, remainingBudget: 0 }; // Should fit if g(0)=0
                } else if (wTowerHeightForApproximation >= 0) { // Not part of sum, try WTower fallback as before
                    const wTowerApproximation = new WTowerOrdinal(wTowerHeightForApproximation, tracer);
                    const g_wTowerApproximation = wTowerApproximation.complexity();
                    if (g_wTowerApproximation <= budgetForThisTerm) {
                        return { simplifiedOrdinal: wTowerApproximation, remainingBudget: budgetForThisTerm - g_wTowerApproximation };
                    }
                    const zeroOrd_mpt_fallback = CNFOrdinal.ZEROStatic().clone(tracer);
                    const g_zero_mpt_fallback = zeroOrd_mpt_fallback.complexity();
                    if (g_zero_mpt_fallback <= budgetForThisTerm) {
                        return { simplifiedOrdinal: zeroOrd_mpt_fallback, remainingBudget: budgetForThisTerm - g_zero_mpt_fallback };
                    }
                    return { simplifiedOrdinal: zeroOrd_mpt_fallback, remainingBudget: 0 };
                }
            }
        }

        // --- Priority 1: Original Term (Attempt 0 from previous logic) ---
        // If the original term w^expB * coeffM itself fits the budget, use it.
        const originalTermOrdinal = new CNFOrdinal([{ exponent: expB.clone(tracer), coefficient: coeffM }], tracer);
        const g_originalTermOrdinal = originalTermOrdinal.complexity();
        if (g_originalTermOrdinal <= budgetForThisTerm) {
            // And ensure it's not ordinally greater than what it's simplifying (though this is for a single term rule)
            // This check is more for sums; for single term, it's implicitly itself.
            return { simplifiedOrdinal: originalTermOrdinal, remainingBudget: budgetForThisTerm - g_originalTermOrdinal };
        }

        // --- Priority 2: Attempt to build w^(h_expB) first, then try to add *coeffM ---
        const cost_w_op_structure = 4; // for w^()
        const budgetFor_expB_simplification = budgetForThisTerm - cost_w_op_structure;

        if (budgetFor_expB_simplification >= 0) {
            const h_expB_result = expB.simplify(budgetFor_expB_simplification, true);
            const h_expB = h_expB_result.simplifiedOrdinal;
            const cost_of_h_expB_simplification = budgetFor_expB_simplification - h_expB_result.remainingBudget;
            
            const cost_for_w_h_expB_part = cost_w_op_structure + cost_of_h_expB_simplification;

            if (cost_for_w_h_expB_part <= budgetForThisTerm) {
                let current_simplified_ordinal = new CNFOrdinal([{ exponent: h_expB, coefficient: 1n }], tracer);
                let remaining_budget_after_exp_part = budgetForThisTerm - current_simplified_ordinal.complexity(); // Cost of w^(h_expB)

                // Rule 1: If expB was reduced to h_expB, discard coeffM (unless coeffM is 1n)
                const expB_was_reduced = !h_expB.equals(expB);

                if (coeffM > 1n && !expB_was_reduced) { // Only try to add coeffM if it's > 1 AND expB was NOT reduced
                    const g_coeffM_val = CNFOrdinal.fromInt(coeffM, tracer).complexity(); // Cost of M itself
                    const cost_of_mult_and_coeffM = 1 + g_coeffM_val; // Cost for '*' and M

                    if (cost_of_mult_and_coeffM <= remaining_budget_after_exp_part) {
                        const final_ordinal_with_coeff = new CNFOrdinal([{ exponent: h_expB, coefficient: coeffM }], tracer);
                        // Ensure final ordinal doesn't exceed original budget due to combined g()
                        if (final_ordinal_with_coeff.complexity() <= budgetForThisTerm) {
                             return { 
                                simplifiedOrdinal: final_ordinal_with_coeff, 
                                remainingBudget: budgetForThisTerm - final_ordinal_with_coeff.complexity()
                            };
                        }
                        // If adding coeffM makes it too complex, revert to w^(h_expB)
                        // but use the already calculated remaining_budget_after_exp_part based on w^(h_expB)'s complexity
                        return { 
                            simplifiedOrdinal: current_simplified_ordinal, 
                            remainingBudget: remaining_budget_after_exp_part 
                        };
                    } else {
                        // Cannot afford *coeffM, use w^(h_expB)
                        return { 
                            simplifiedOrdinal: current_simplified_ordinal, 
                            remainingBudget: remaining_budget_after_exp_part 
                        };
                    }
                } else { // coeffM is 1n, so w^(h_expB) is the final form for this path
                    return { 
                        simplifiedOrdinal: current_simplified_ordinal, 
                        remainingBudget: remaining_budget_after_exp_part
                    };
                }
            }
        }
        // --- If forming w^(h_expB) failed (e.g. budgetFor_expB_simplification < 0 or cost_for_w_h_expB_part too high) ---
        // The original fallbacks to w and 0 are now effectively covered by the primary fallback section below,
        // as the originalTermOrdinal check is now the primary fallback if the w^(h_expB) structure fails.
        // However, we need to ensure that if w^(h_expB) path fails completely, we still try simpler forms.
        // The current originalTermOrdinal check is ALREADY above this section.
        // So this section should only contain w and 0 if the w^(h_expB) path fails AND originalTermOrdinal also failed.
        // Let's keep the explicit w and 0 fallbacks at the very end for clarity if ALL structured attempts fail.

        // Fallback (Ultimate) Attempt 1: w (CNFOrdinal.OMEGA)
        const omegaStatic = CNFOrdinal.OMEGAStatic();
        const omega_cost_actual = omegaStatic.complexity();
        if (omega_cost_actual <= budgetForThisTerm) {
            return { simplifiedOrdinal: omegaStatic.clone(tracer), remainingBudget: budgetForThisTerm - omega_cost_actual };
        }

        // Fallback (Ultimate) Attempt 2: 0 (CNFOrdinal.ZERO)
        const zeroStatic = CNFOrdinal.ZEROStatic();
        const zero_cost_actual = zeroStatic.complexity();
        if (zero_cost_actual <= budgetForThisTerm) {
            return { simplifiedOrdinal: zeroStatic.clone(tracer), remainingBudget: budgetForThisTerm - zero_cost_actual };
        }
        return { simplifiedOrdinal: zeroStatic.clone(tracer), remainingBudget: 0 };
    }
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

    /**
     * Calculates the complexity of e_0.
     * g(e_0) = 3
     * @returns {number} The complexity (3).
     */
    complexity() {
        if (this._tracer) this._tracer.consume(); // Ensure op consumption
        return 3; // g(e_0) = 3
    }

    /**
     * Simplifies this EpsilonNaughtOrdinal based on the provided complexity budget.
     * @param {number} complexityBudget The maximum allowed complexity for the result.
     * @returns {{simplifiedOrdinal: EpsilonNaughtOrdinal | CNFOrdinal, remainingBudget: number}}
     */
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume(); // Consume for the simplify call itself
        // skipMyOwnMPTFCheck is ignored for EpsilonNaughtOrdinal
        const costThis = this.complexity(); // This will consume another op
        if (costThis <= complexityBudget) {
            return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - costThis };
        } else {
            const zeroTracer = this._tracer; // Reuse tracer
            const zeroOrdinal = CNFOrdinal.ZEROStatic().clone(zeroTracer);
            const costZero = zeroOrdinal.complexity(); // Consumes op
            if (costZero <= complexityBudget) {
                return { simplifiedOrdinal: zeroOrdinal, remainingBudget: complexityBudget - costZero };
            } else {
                return { simplifiedOrdinal: zeroOrdinal, remainingBudget: 0 }; // Cannot even afford 0
            }
        }
    }
}

/**
 * Represents an ordinal of the form ω^^n (omega tetrated to n), where n is a non-negative integer.
 * This type primarily serves as a compact representation that converts to CNFOrdinal for arithmetic.
 */
class WTowerOrdinal {
    constructor(height, operationTracer = null) {
        if (typeof height !== 'number' || !Number.isInteger(height) || height < 0) {
            throw new Error(`WTowerOrdinal height must be a non-negative integer, got ${height}`);
        }
        this.height = height;
        this._tracer = operationTracer;
    }

    /**
     * Converts this WTowerOrdinal to its equivalent CNFOrdinal representation.
     * Calculates ω^^n.
     * @returns {CNFOrdinal}
     */
    toCNFOrdinal() {
        if (this._tracer) this._tracer.consume(); // Count conversion as an operation

        const baseOmega = CNFOrdinal.OMEGAStatic().clone(this._tracer);
        const heightOrdinal = CNFOrdinal.fromInt(this.height, this._tracer);

        // Need to ensure tetrateOrdinals is available and can be called here,
        // or call a prototype method on baseOmega if tetrate is defined on CNFOrdinal.prototype
        // For now, assuming tetrateOrdinals will be defined globally or accessible.
        if (typeof tetrateOrdinals === "function") {
            return tetrateOrdinals(baseOmega, heightOrdinal);
        } else {
            // Fallback or assumption that CNFOrdinal.prototype.tetrate exists and calls the dispatcher
            if (typeof baseOmega.tetrate !== 'function') {
                 throw new Error("tetrateOrdinals dispatcher or CNFOrdinal.prototype.tetrate not available for WTowerOrdinal.toCNFOrdinal.");
            }
            return baseOmega.tetrate(heightOrdinal);
        }
    }

    isZero() {
        // w^^0 = 1, w^^n for n>0 is > 1. So never zero.
        return false;
    }

    isFinite() {
        // w^^0 = 1 (finite). w^^n for n>0 is infinite (w, w^w, e_0).
        return this.height === 0;
    }

    getFinitePart() {
        if (this.isFinite()) { // Only if height is 0, where w^^0 = 1
            return 1n;
        }
        return 0n; // For w^^n where n > 0, the CNF is infinite with 0 finite part.
    }

    getLimitPart() {
        if (this.isFinite()) { // w^^0 = 1
            return CNFOrdinal.ZEROStatic().clone(this._tracer);
        }
        // For n > 0, w^^n is a limit ordinal (w, w^w, e_0).
        // The actual limit part comes from its CNF representation.
        return this.toCNFOrdinal(); // Or its limit part: this.toCNFOrdinal().getLimitPart();
                                    // Let's return the full CNF as its "limit part" if infinite for simplicity,
                                    // as it doesn't have a separate finite component for n > 0.
    }

    // toStringCNF for this type means its own linear string representation.
    toStringCNF() {
        return `w^^${this.height}`;
    }

    equals(otherOrdinal) {
        if (this._tracer) this._tracer.consume();

        if (otherOrdinal instanceof WTowerOrdinal) {
            // Direct comparison for two WTowerOrdinals
            return this.height === otherOrdinal.height;
        }
        
        // If comparing WTowerOrdinal with CNFOrdinal or EpsilonNaughtOrdinal,
        // convert this WTowerOrdinal to CNF for comparison.
        // This can still be expensive for large towers if otherOrdinal is not also a WTowerOrdinal
        // that would have been caught above. Consider if this comparison is frequent or critical.
        // If otherOrdinal is e_0, w^^h = e_0 only if h >= omega (not possible for finite h here)
        // or specific finite h values like w^^w for parsing (which would not be WTowerOrdinal type directly).
        // A WTowerOrdinal with finite height 'h' typically corresponds to an ordinal < e_0, 
        // unless h is large enough that w^^h would be simplified to e_0 by some rule not yet in WTowerOrdinal.
        // However, the f(w^^h) = 5 - 4/h suggests it always stays < 5 (i.e., < e_0).

        // The primary cause of recursion was WTower.equals(WTower) calling toCNFOrdinal twice.
        // Now, for WTower.equals(NonWTower), we convert *this* WTower to CNF.
        // This is still potentially expensive if `this` is a large tower.
        // A more robust equals would require a type-dispatching comparison system similar to arithmetic ops.
        // For now, this fixes the WTower-vs-WTower recursion.
        if (this._tracer) this._tracer.consume(this.height + 1); // Estimate cost for toCNFOrdinal
        const thisCNF = this.toCNFOrdinal();
        return thisCNF.equals(otherOrdinal); // Compare this tower (as CNF) with the other ordinal
    }

    clone(tracer = null) {
        const effectiveTracer = tracer !== null ? tracer : this._tracer;
        return new WTowerOrdinal(this.height, effectiveTracer);
    }

    // compareTo, add, multiply, power, tetrate will be defined on its prototype
    // or handled by dispatchers that convert to CNF first.

    /**
     * Calculates the complexity of a WTowerOrdinal.
     * g(w^^m) = g(m)+3
     * @returns {number} The calculated complexity.
     */
    complexity() {
        if (this._tracer) this._tracer.consume(); // Ensure op consumption
        const m_complexity = this.height.toString().length; // g(m) = number of digits in height
        return m_complexity + 3; // g(w^^m) = g(m)+3
    }

    /**
     * Simplifies this WTowerOrdinal based on the provided complexity budget.
     * @param {number} complexityBudget The maximum allowed complexity for the result.
     * @returns {{simplifiedOrdinal: WTowerOrdinal | CNFOrdinal, remainingBudget: number}}
     */
    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume(); // Consume for the simplify call itself
        // skipMyOwnMPTFCheck is ignored for WTowerOrdinal
        const costThis = this.complexity(); // Consumes op
        if (costThis <= complexityBudget) {
            return { simplifiedOrdinal: this.clone(), remainingBudget: complexityBudget - costThis };
        } else {
            const zeroTracer = this._tracer; // Reuse tracer
            const zeroOrdinal = CNFOrdinal.ZEROStatic().clone(zeroTracer);
            const costZero = zeroOrdinal.complexity(); // Consumes op
            if (costZero <= complexityBudget) {
                return { simplifiedOrdinal: zeroOrdinal, remainingBudget: complexityBudget - costZero };
            } else {
                return { simplifiedOrdinal: zeroOrdinal, remainingBudget: 0 }; // Cannot even afford 0
            }
        }
    }
}

// Helper function for CNFOrdinal.simplify (will be defined before CNFOrdinal.simplify or passed)
// This function should be defined in a scope accessible by CNFOrdinal.prototype.simplify
// For now, let's imagine it as a static helper or a free function defined before its use.
/**
 * Helper to get main power tower information from an exponent.
 * @param {CNFOrdinal} exponent The exponent to analyze.
 * @param {OperationTracer} tracer
 * @returns {{ mptOrdinalForG: CNFOrdinal, numOmegas: number }}
 *           mptOrdinalForG is the w^(w^(...w^F)...) structure.
 *           numOmegas is the count of omegas in this tower structure.
 */
function getTowerInfo(exponent, tracer) {
    if (tracer) tracer.consume(); // For calling getTowerInfo

    let current = exponent;
    let depth = 0;
    let coreExponent = CNFOrdinal.ZEROStatic().clone(tracer); // Default to F=0 if E is 0 or not w-based

    if (exponent.isZero() || exponent.isFinite()) { // If exponent is finite F (or 0)
        coreExponent = exponent.clone(tracer);
        // numOmegas (depth) remains 0
        // mptOrdinalForG for a finite F is F itself (no w^ structure)
        // However, the rule applies to w^(exp). If exp is F, mpt is w^F.
        // The example "main power tower of w^(w^w^2+w^4) is w^w^w^2" means
        // we are interested in the tower *within* the exponent if it's part of w^exponent.
        // getTowerInfo is about the structure *of the exponent E* itself.
        // If E is finite 'F', then mptOrdinalForG is 'F', numOmegas is 0.
        return { mptOrdinalForG: exponent.clone(tracer), numOmegas: 0 };
    }

    // Traverse down the "spine" of the exponent
    // Spine means w^(w^(...w^F)...) where F is finite.
    // We are looking for the structure of E = E_0 in the form w^(E_1)*C_0 + ... -> E_1 = w^(E_2)*C_1 + ...
    let tempCurrent = exponent.clone(tracer);
    let structureForG = null; // This will be the F at the bottom first

    while (tempCurrent instanceof CNFOrdinal && !tempCurrent.isFinite()) {
        if (tracer) tracer.consume(); // For step in loop
        depth++;
        if (tempCurrent.terms.length === 1 && tempCurrent.terms[0].coefficient === 1n) { // Pure w^X
            tempCurrent = tempCurrent.terms[0].exponent;
        } else { // Sum or w^X*C with C>1, or other complex form. Take leading exponent.
            if (tempCurrent.isZero()) { // Should not happen if !isFinite and is CNFOrdinal
                 depth--; // Correct depth if we hit zero unexpectedly
                 tempCurrent = CNFOrdinal.ZEROStatic().clone(tracer); // Set to zero and break
                 break;
            }
            tempCurrent = tempCurrent.getLeadingTerm().exponent;
        }
    }
    // tempCurrent is now the innermost finite exponent F (or 0 if original was purely w^(w...))
    coreExponent = tempCurrent.clone(tracer); // This is F

    // Construct the mptOrdinalForG: w^(w^(...w^F)...) with 'depth' omegas
    let mptG = coreExponent;
    for (let i = 0; i < depth; i++) {
        if (tracer) tracer.consume(); // For each w^ application
        mptG = new CNFOrdinal([{ exponent: mptG.clone(tracer), coefficient: 1n }], tracer);
    }
    return { mptOrdinalForG: mptG, numOmegas: depth };
}

// Export if in a module system
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = { CNFOrdinal, EpsilonNaughtOrdinal, WTowerOrdinal, OperationTracer };
// }
