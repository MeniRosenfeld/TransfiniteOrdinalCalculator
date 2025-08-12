// ordinal_enf.js

/**
 * Represents a single additive term in an ENF (Epsilon Normal Form) expression.
 * A term has the structure: (e_a1^k1 * e_a2^k2 * ...) * w^k * m
 */
class ENFTerm {
    /**
     * @param {Array<{base: ENFOrdinal, exp: ENFOrdinal}>} epsilonFactors - An array of epsilon factors, sorted by descending base.
     * @param {CNFOrdinal} omegaExponent - The exponent for w. Must not contain any epsilon numbers.
     * @param {BigInt} coefficient - The finite coefficient of the term.
     */
    constructor(epsilonFactors = [], omegaExponent = CNFOrdinal.ZERO, coefficient = 1n) {
        // Validation for epsilonFactors
        for (let i = 0; i < epsilonFactors.length - 1; i++) {
            if (epsilonFactors[i].base.compareTo(epsilonFactors[i + 1].base) <= 0) {
                throw new Error("Epsilon bases must be in strictly descending order.");
            }
        }
        this.epsilonFactors = epsilonFactors; // Array of {base: ENFOrdinal, exp: ENFOrdinal}
        // Coerce omegaExponent to CNFOrdinal if needed
        if (!(omegaExponent instanceof CNFOrdinal)) {
            if (omegaExponent instanceof ENFOrdinal && typeof omegaExponent.toCNFOrdinal === 'function') {
                omegaExponent = omegaExponent.toCNFOrdinal();
            } else if (omegaExponent && typeof omegaExponent.toCNFOrdinal === 'function') {
                omegaExponent = omegaExponent.toCNFOrdinal();
            } else if (omegaExponent === CNFOrdinal.ZERO || omegaExponent === CNFOrdinal.ONE || omegaExponent === CNFOrdinal.OMEGA) {
                // Accept legacy static getters
                // They are CNF ordinals returned via getters
            } else {
                throw new Error('ENFTerm: omegaExponent must be a CNFOrdinal or convertible to CNF');
            }
        }
        this.omegaExponent = omegaExponent;   // CNFOrdinal
        this.coefficient = coefficient;       // BigInt
    }

    /**
     * Creates a deep copy of this term.
     * @returns {ENFTerm} A new ENFTerm instance that is a deep copy of this one.
     */
    clone() {
        const clonedEpsilonFactors = this.epsilonFactors.map(f => ({
            base: f.base.clone(),
            exp: f.exp.clone()
        }));
        const clonedOmegaExponent = this.omegaExponent.clone();
        return new ENFTerm(clonedEpsilonFactors, clonedOmegaExponent, this.coefficient);
    }

    /**
     * Checks if the term represents a finite number.
     * @returns {boolean}
     */
    isFinite() {
        return this.epsilonFactors.length === 0 && this.omegaExponent.isZero();
    }

    /**
     * Compares this term with another ENFTerm.
     * @param {ENFTerm} other The term to compare against.
     * @returns {number} -1 if this < other, 0 if this == other, 1 if this > other.
     */
    compareTo(other) {
        // 1. Compare Epsilon Factors (with effective promotion from omegaExponent when needed)
        const thisEffFactors = this.epsilonFactors.length > 0
            ? this.epsilonFactors
            : (function () {
                // If no epsilon factors, see if omegaExponent carries an epsilon rank (e_k + ...)
                if (this.omegaExponent && typeof findLargestEpsilonIndexLessThan === 'function') {
                    const idx = findLargestEpsilonIndexLessThan(this.omegaExponent);
                    if (idx) {
                        return [{ base: ENFOrdinal.fromCNF(idx), exp: ENFOrdinal.one() }];
                    }
                }
                return [];
            }).call(this);

        const otherEffFactors = other.epsilonFactors && other.epsilonFactors.length > 0
            ? other.epsilonFactors
            : (function () {
                if (other.omegaExponent && typeof findLargestEpsilonIndexLessThan === 'function') {
                    const idx = findLargestEpsilonIndexLessThan(other.omegaExponent);
                    if (idx) {
                        return [{ base: ENFOrdinal.fromCNF(idx), exp: ENFOrdinal.one() }];
                    }
                }
                return [];
            })();

        const len = Math.max(thisEffFactors.length, otherEffFactors.length);
        for (let i = 0; i < len; i++) {
            const thisFactor = thisEffFactors[i];
            const otherFactor = otherEffFactors[i];
            if (!thisFactor) return -1;
            if (!otherFactor) return 1;
            const baseCmp = thisFactor.base.compareTo(otherFactor.base);
            if (baseCmp !== 0) return baseCmp;
            const expCmp = thisFactor.exp.compareTo(otherFactor.exp);
            if (expCmp !== 0) return expCmp;
        }

        // 2. Compare Omega Exponent
        const omegaCmp = this.omegaExponent.compareTo(other.omegaExponent);
        if (omegaCmp !== 0) return omegaCmp;

        // 3. Compare Coefficient
        if (this.coefficient > other.coefficient) return 1;
        if (this.coefficient < other.coefficient) return -1;
        return 0;
    }

    /**
     * Compares the structure of this term (ignoring coefficient) with another ENFTerm.
     * @param {ENFTerm} other The term to compare against.
     * @returns {number} -1 if this < other, 0 if this == other, 1 if this > other.
     */
    compareStructureTo(other) {
        // 1. Compare Epsilon Factors (with effective promotion like in compareTo)
        const thisEffFactors = this.epsilonFactors.length > 0
            ? this.epsilonFactors
            : (function () {
                if (this.omegaExponent && typeof findLargestEpsilonIndexLessThan === 'function') {
                    const idx = findLargestEpsilonIndexLessThan(this.omegaExponent);
                    if (idx) {
                        return [{ base: ENFOrdinal.fromCNF(idx), exp: ENFOrdinal.one() }];
                    }
                }
                return [];
            }).call(this);

        const otherEffFactors = other.epsilonFactors && other.epsilonFactors.length > 0
            ? other.epsilonFactors
            : (function () {
                if (other.omegaExponent && typeof findLargestEpsilonIndexLessThan === 'function') {
                    const idx = findLargestEpsilonIndexLessThan(other.omegaExponent);
                    if (idx) {
                        return [{ base: ENFOrdinal.fromCNF(idx), exp: ENFOrdinal.one() }];
                    }
                }
                return [];
            })();

        const len = Math.max(thisEffFactors.length, otherEffFactors.length);
        for (let i = 0; i < len; i++) {
            const thisFactor = thisEffFactors[i];
            const otherFactor = otherEffFactors[i];
            if (!thisFactor) return -1;
            if (!otherFactor) return 1;
            const baseCmp = thisFactor.base.compareTo(otherFactor.base);
            if (baseCmp !== 0) return baseCmp;
            const expCmp = thisFactor.exp.compareTo(otherFactor.exp);
            if (expCmp !== 0) return expCmp;
        }

        // 2. Compare Omega Exponent
        const omegaCmp = this.omegaExponent.compareTo(other.omegaExponent);
        if (omegaCmp !== 0) return omegaCmp;
        return 0;
    }

    /**
     * Multiplies this term by another term.
     * @param {ENFTerm} other The term to multiply by.
     * @returns {ENFTerm} The product of the two terms.
     */
    multiply(other) {
        if (other.isFinite()) {
            return new ENFTerm(
                this.epsilonFactors.map(f => ({ base: f.base.clone(), exp: f.exp.clone() })),
                this.omegaExponent.clone(),
                this.coefficient * other.coefficient
            );
        }

        const thisEpsilonFactors = this.epsilonFactors;
        const otherEpsilonFactors = other.epsilonFactors;
        const newEpsilonFactors = [];
        let i = 0, j = 0;

        if (otherEpsilonFactors.length > 0) {
            const otherLeadingBase = otherEpsilonFactors[0].base;
            while (i < thisEpsilonFactors.length && thisEpsilonFactors[i].base.compareTo(otherLeadingBase) > 0) {
                const f = thisEpsilonFactors[i];
                newEpsilonFactors.push({ base: f.base.clone(), exp: f.exp.clone() });
                i++;
            }
            if (i < thisEpsilonFactors.length && thisEpsilonFactors[i].base.compareTo(otherLeadingBase) === 0) {
                const f1 = thisEpsilonFactors[i];
                const f2 = otherEpsilonFactors[j];
                newEpsilonFactors.push({ base: f1.base.clone(), exp: f1.exp.add(f2.exp) });
                i++;
                j++;
            }
        } else {
            while (i < thisEpsilonFactors.length) {
                const f = thisEpsilonFactors[i];
                newEpsilonFactors.push({ base: f.base.clone(), exp: f.exp.clone() });
                i++;
            }
        }

        while (j < otherEpsilonFactors.length) {
            const f = otherEpsilonFactors[j];
            newEpsilonFactors.push({ base: f.base.clone(), exp: f.exp.clone() });
            j++;
        }

        let newOmegaExponent;
        if (otherEpsilonFactors.length > 0) {
            newOmegaExponent = other.omegaExponent.clone();
        } else {
            newOmegaExponent = this.omegaExponent.add(other.omegaExponent);
        }

        // Absorb finite coefficient of the left into the merged leading factor, not simple multiplication.
        // Preserve right coefficient as the finite multiplier of the resulting term.
        return new ENFTerm(newEpsilonFactors, newOmegaExponent, other.coefficient);
    }

    isSingleFactor() {
        if (this.epsilonFactors.length === 0 && this.omegaExponent.isZero()) return true; // Just a coefficient
        let numFactors = this.epsilonFactors.length;
        if (!this.omegaExponent.isZero()) numFactors++;
        if (this.coefficient !== 1n) numFactors++;
        return numFactors === 1;
    }

    toString() {
        let parts = [];
        for (const factor of this.epsilonFactors) {
            const baseStr = factor.base.toString();
            // Only wrap base in parentheses if it's not a simple case
            const needsBaseParen = !(baseStr === "0" || factor.base.isFinite() || factor.base.isSingleFactorTerm());
            const displayBase = needsBaseParen ? `e_(${baseStr})` : `e_${baseStr}`;
            const exp = factor.exp;
            if (exp.isOne()) {
                parts.push(displayBase);
            } else {
                const expStr = exp.toString();
                const needsExpParen = !exp.isSingleFactorTerm();
                parts.push(needsExpParen ? `${displayBase}^(${expStr})` : `${displayBase}^${expStr}`);
            }
        }

        {
            const omegaExpAny = this.omegaExponent;
            const hasOmega = omegaExpAny && (typeof omegaExpAny.isZero === 'function' ? !omegaExpAny.isZero() : Boolean(omegaExpAny));
            if (hasOmega) {
                let expStr;
                // Support CNFOrdinal and EpsilonOrdinal; fallback to generic toString
                if (typeof this.omegaExponent.toStringCNF === 'function') {
                    expStr = this.omegaExponent.toStringCNF();
                } else if (this.omegaExponent instanceof EpsilonOrdinal) {
                    expStr = this.omegaExponent.toStringCNF();
                } else {
                    expStr = this.omegaExponent && typeof this.omegaExponent.toString === 'function'
                        ? this.omegaExponent.toString()
                        : String(this.omegaExponent);
                }

                // Detect w (exponent 1) only when omegaExponent is CNF 1
                if (this.omegaExponent instanceof CNFOrdinal && this.omegaExponent.equals(CNFOrdinal.ONEStatic())) {
                    parts.push("w");
                } else {
                    let needsParen = true;
                    if (this.omegaExponent instanceof CNFOrdinal) {
                        needsParen = !(this.omegaExponent.isFinite() || (this.omegaExponent.terms.length === 1 && this.omegaExponent.getLeadingTerm().coefficient === 1n));
                    }
                    parts.push(needsParen ? `w^(${expStr})` : `w^${expStr}`);
                }
            }
        }

        if (this.isFinite()) return this.coefficient.toString();
        if (this.coefficient !== 1n || parts.length === 0) parts.push(this.coefficient.toString());
        return parts.join("*");
    }
}

class ENFOrdinal {
    constructor(terms = []) {
        this.terms = terms;
    }

    clone() {
        return new ENFOrdinal(this.terms.map(t => t.clone()));
    }

    equals(other) {
        if (!(other instanceof ENFOrdinal)) return false;
        if (this.terms.length !== other.terms.length) return false;
        for (let i = 0; i < this.terms.length; i++) {
            if (this.terms[i].compareTo(other.terms[i]) !== 0) return false;
        }
        return true;
    }

    isZero() {
        return this.terms.length === 0;
    }

    isOne() {
        return this.terms.length === 1 && this.terms[0].isFinite() && this.terms[0].coefficient === 1n;
    }

    isFinite() {
        if (this.isZero()) return true;
        return this.terms.every(t => t.isFinite());
    }

    isOmega() {
        return this.terms.length === 1 && this.terms[0].epsilonFactors.length === 0 && this.terms[0].omegaExponent.equals(CNFOrdinal.ONEStatic()) && this.terms[0].coefficient === 1n;
    }

    isSingleFactorTerm() {
        return this.terms.length === 1 && this.terms[0].isSingleFactor();
    }

    getFinitePart() {
        if (this.isZero()) return ENFOrdinal.zero();
        const lastTerm = this.terms[this.terms.length - 1];
        if (lastTerm.isFinite()) {
            return new ENFOrdinal([lastTerm.clone()]);
        }
        return ENFOrdinal.zero();
    }

    getLimitPart() {
        if (this.isFinite()) return ENFOrdinal.zero();
        const limitTerms = this.terms.filter(term => !term.isFinite());
        return new ENFOrdinal(limitTerms);
    }

    getRank() {
        if (this.isZero()) return ENFOrdinal.zero();
        if (this.isFinite()) {
            return ENFOrdinal.one();
        }
        const leadingTerm = this.terms[0];
        if (leadingTerm.epsilonFactors.length > 0) {
            // For e_a, return e_a itself as the rank (not just a)
            const epsilonBase = leadingTerm.epsilonFactors[0].base;
            return new ENFOrdinal([new ENFTerm([{ base: epsilonBase, exp: ENFOrdinal.one() }])]);
        }
        return ENFOrdinal.omega();
    }

    getLogarithm() {
        if (this.isFinite()) {
            throw new Error("Logarithm is only defined for infinite ordinals.");
        }
        const leadingTerm = this.terms[0];
        if (leadingTerm.epsilonFactors.length > 0) {
            return leadingTerm.epsilonFactors[0].exp.clone();
        }
        // For w^k * m, the leading factor is w^k, so log_ω(a) = k
        return ENFOrdinal.fromCNF(leadingTerm.omegaExponent.clone());
    }

    predecessor() {
        if (this.isZero()) return ENFOrdinal.zero();

        const lastTerm = this.terms[this.terms.length - 1];
        if (!lastTerm.isFinite()) {
            return this.clone();
        }

        const newTerms = this.terms.map(t => t.clone());
        const newLastTerm = newTerms[newTerms.length - 1];

        if (newLastTerm.coefficient > 1n) {
            newLastTerm.coefficient -= 1n;
        } else {
            newTerms.pop();
        }
        return new ENFOrdinal(newTerms);
    }

    ordinalDivision(k) {
        if (k.isZero() || !k.isBasic()) {
            throw new Error("Divisor k must be a non-finite basic ordinal (w or e_k).");
        }

        const quotientTerms = [];
        const remainderTerms = [];
        let dividing = true;

        for (const term of this.terms) {
            const termOrd = new ENFOrdinal([term]);
            if (dividing && termOrd.getRank().compareTo(k) >= 0) {
                const newTerm = term.clone();
                if (k.isOmega()) {
                    newTerm.omegaExponent = newTerm.omegaExponent.exponentPredecessor();
                } else { // k is an epsilon number
                    // Match epsilon factor whose basic ordinal equals k (i.e., e_(base) == k)
                    let matchedIndex = -1;
                    for (let idx = 0; idx < newTerm.epsilonFactors.length; idx++) {
                        const f = newTerm.epsilonFactors[idx];
                        const basicEpsilon = new ENFOrdinal([new ENFTerm([{ base: f.base.clone(), exp: ENFOrdinal.one() }], CNFOrdinal.ZEROStatic(), 1n)]);
                        if (basicEpsilon.equals(k)) {
                            matchedIndex = idx;
                            break;
                        }
                    }
                    if (matchedIndex >= 0) {
                        const factor = newTerm.epsilonFactors[matchedIndex];
                        factor.exp = factor.exp.predecessor();
                        if (factor.exp.isZero()) {
                            newTerm.epsilonFactors.splice(matchedIndex, 1);
                        }
                    }
                }
                quotientTerms.push(newTerm);
            } else {
                dividing = false;
                remainderTerms.push(term.clone());
            }
        }

        return {
            quotient: new ENFOrdinal(quotientTerms),
            remainder: new ENFOrdinal(remainderTerms)
        };
    }

    isBasic() {
        if (this.isOne() || this.isOmega()) return true;
        if (this.terms.length === 1 && this.terms[0].coefficient === 1n && this.terms[0].omegaExponent.isZero()) {
            const ef = this.terms[0].epsilonFactors;
            if (ef.length === 1 && ef[0].exp.isOne()) {
                return true; // e_k
            }
        }
        return false;
    }

    compareTo(other) {
        // Normalize type of 'other' to ENF
        if (!(other instanceof ENFOrdinal)) {
            if (other instanceof CNFOrdinal || other instanceof EpsilonOrdinal || (typeof WTowerOrdinal !== 'undefined' && other instanceof WTowerOrdinal)) {
                other = ENFOrdinal.fromCNF(other);
            } else {
                throw new Error("ENFOrdinal.compareTo: unsupported operand type");
            }
        }
        if (this.isZero()) return other.isZero() ? 0 : -1;
        if (other.isZero()) return 1;
        const len = Math.min(this.terms.length, other.terms.length);
        for (let i = 0; i < len; i++) {
            const termCmp = this.terms[i].compareTo(other.terms[i]);
            if (termCmp !== 0) return termCmp;
        }
        return this.terms.length > other.terms.length ? 1 : this.terms.length < other.terms.length ? -1 : 0;
    }

    add(other) {
        if (!(other instanceof ENFOrdinal)) {
            if (other instanceof CNFOrdinal) {
                other = ENFOrdinal.fromCNF(other);
            } else if (other instanceof EpsilonOrdinal) {
                const baseENF = ENFOrdinal.fromCNF(other.index);
                other = new ENFOrdinal([new ENFTerm([{ base: baseENF, exp: ENFOrdinal.one() }], CNFOrdinal.ZEROStatic(), 1n)]);
            } else if (typeof WTowerOrdinal !== 'undefined' && other instanceof WTowerOrdinal) {
                other = ENFOrdinal.fromCNF(other.toCNFOrdinal());
            } else {
                throw new Error("ENFOrdinal.add: unsupported operand type");
            }
        }

        if (this.isZero()) return other.clone();
        if (other.isZero()) return this.clone();

        const b1 = other.terms[0];
        const newTerms = [];
        let k = -1;
        for (let i = 0; i < this.terms.length; i++) {
            if (this.terms[i].compareStructureTo(b1) <= 0) {
                k = i;
                break;
            }
            newTerms.push(this.terms[i].clone());
        }

        if (k === -1) return new ENFOrdinal(newTerms.concat(other.terms.map(t => t.clone())));

        const ak = this.terms[k];
        if (ak.compareStructureTo(b1) < 0) return new ENFOrdinal(newTerms.concat(other.terms.map(t => t.clone())));

        if (ak.compareStructureTo(b1) === 0) {
            const junctionTerm = ak.clone();
            junctionTerm.coefficient += b1.coefficient;
            newTerms.push(junctionTerm);
            const restOfBeta = other.terms.slice(1).map(t => t.clone());
            return new ENFOrdinal(newTerms.concat(restOfBeta));
        }
        return new ENFOrdinal(newTerms.concat(other.terms.map(t => t.clone())));
    }

    multiplyByTerm(term) {
        if (this.isZero() || term.coefficient === 0n) {
            return ENFOrdinal.zero();
        }
        if (term.isFinite()) {
            if (this.isFinite()) {
                return ENFOrdinal.fromInt(this.terms[0].coefficient * term.coefficient);
            }
            const leadingTermProduct = this.terms[0].multiply(term);
            const remainingTerms = this.terms.slice(1).map(t => t.clone());
            return new ENFOrdinal([leadingTermProduct, ...remainingTerms]);
        }
        const productTerm = this.terms[0].multiply(term);
        return new ENFOrdinal([productTerm]);
    }

    multiply(other) {
        // Normalize type of 'other' to ENF
        if (!(other instanceof ENFOrdinal)) {
            if (other instanceof CNFOrdinal || other instanceof EpsilonOrdinal || (typeof WTowerOrdinal !== 'undefined' && other instanceof WTowerOrdinal)) {
                other = ENFOrdinal.fromCNF(other);
            } else {
                throw new Error("ENFOrdinal.multiply: unsupported operand type");
            }
        }
        if (this.isZero() || other.isZero()) return ENFOrdinal.zero();
        if (other.isFinite()) {
            return this.multiplyByTerm(other.terms[0]);
        }
        let result = ENFOrdinal.zero();
        for (const termB of other.terms) {
            const product = this.multiplyByTerm(termB);
            result = result.add(product);
        }
        return result;
    }

    toCNFOrdinal() {
        if (this.isZero()) return CNFOrdinal.ZEROStatic().clone();

        let totalCNF = CNFOrdinal.ZEROStatic().clone();
        for (const term of this.terms) {
            // Build exponent for leading ω^exponent using epsilon factors as a CNF ordinal
            let expTerms = [];
            if (term.epsilonFactors.length > 0) {
                for (const factor of term.epsilonFactors) {
                    const baseIdxCNF = factor.base.toCNFOrdinal();
                    const epsBase = new EpsilonOrdinal(baseIdxCNF);
                    let count = null;
                    if (factor.exp.isFinite()) {
                        const n = factor.exp.terms.length === 0 ? 0n : factor.exp.terms[0].coefficient;
                        count = n;
                    }
                    if (count !== null) {
                        for (let i = 0n; i < count; i++) {
                            expTerms.push({ exponent: epsBase, coefficient: 1n });
                        }
                    } else {
                        expTerms.push({ exponent: epsBase, coefficient: 1n });
                    }
                }
            }

            let termCNF;
            if (expTerms.length === 0) {
                termCNF = CNFOrdinal.ONEStatic().clone();
            } else {
                const exponentOrdinal = new CNFOrdinal(expTerms);
                termCNF = new CNFOrdinal([{ exponent: exponentOrdinal, coefficient: 1n }]);
            }

            if (!term.omegaExponent.isZero()) {
                const w_pow = new CNFOrdinal([{ exponent: term.omegaExponent.clone(), coefficient: 1n }]);
                termCNF = termCNF.multiply(w_pow);
            }

            if (term.coefficient > 1n) {
                termCNF = termCNF.multiply(CNFOrdinal.fromInt(term.coefficient));
            }

            totalCNF = totalCNF.add(termCNF);
        }
        return totalCNF;
    }

    toString() {
        if (this.isZero()) return "0";
        return this.terms.map(t => t.toString()).join("+");
    }

    static zero() {
        return new ENFOrdinal();
    }

    static one() {
        return new ENFOrdinal([new ENFTerm([], CNFOrdinal.ZEROStatic(), 1n)]);
    }

    static fromInt(n) {
        const val = BigInt(n);
        if (val < 0n) throw new Error("ENFOrdinal fromInt: Must be non-negative.");
        if (val === 0n) return ENFOrdinal.zero();
        return new ENFOrdinal([new ENFTerm([], CNFOrdinal.ZEROStatic(), val)]);
    }

    static omega() {
        return new ENFOrdinal([new ENFTerm([], CNFOrdinal.ONEStatic(), 1n)]);
    }

    power(b) {
        // Normalize exponent type to ENF
        if (!(b instanceof ENFOrdinal)) {
            if (b instanceof CNFOrdinal || b instanceof EpsilonOrdinal || (typeof WTowerOrdinal !== 'undefined' && b instanceof WTowerOrdinal)) {
                b = ENFOrdinal.fromCNF(b);
            } else {
                throw new Error("ENFOrdinal.power: unsupported exponent type");
            }
        }
        // Trivial cases
        if (b.isZero()) return ENFOrdinal.one();
        const a = this;
        if (a.isZero()) return ENFOrdinal.zero();
        if (a.isOne()) return ENFOrdinal.one();
        if (b.isOne()) return a.clone();

        // Finite exponent -> exponentiation by squaring
        if (b.isFinite()) {
            let n = b.terms[0].coefficient;
            let res = ENFOrdinal.one();
            let temp_a = a;
            while (n > 0n) {
                if (n % 2n === 1n) res = res.multiply(temp_a);
                temp_a = temp_a.multiply(temp_a);
                n /= 2n;
            }
            return res;
        }

        // No special finite-base infinite-exponent branch; defer to rank-based logic

        // Basic base case: a is omega or some epsilon e_a
        if (a.isBasic()) {
            const leading = a.terms[0];
            if (a.isOmega()) {
                // Special identity: w^(e_k) = e_k
                if (b.isBasic() && b.terms.length === 1) {
                    const t = b.terms[0];
                    if (t.omegaExponent.isZero() && t.epsilonFactors.length === 1 && t.epsilonFactors[0].exp.isOne()) {
                        return b.clone();
                    }
                }
                // If rank(b) > rank(a)=w, use rank-based decomposition: b = k*X + r, return k^X * w^r
                const rank_b = b.getRank();
                if (rank_b.compareTo(a) > 0) {
                    const k = rank_b;
                    const { quotient: x, remainder: r } = b.ordinalDivision(k);
                    // Build k^x
                    let k_pow_x;
                    if (k.isOmega()) {
                        k_pow_x = new ENFOrdinal([new ENFTerm([], x.toCNFOrdinal(), 1n)]);
                    } else {
                        const t = k.terms[0].epsilonFactors[0].base.clone();
                        k_pow_x = new ENFOrdinal([new ENFTerm([{ base: t, exp: x.clone() }], CNFOrdinal.ZEROStatic(), 1n)]);
                    }
                    const w_pow_r = this.power(r);
                    return k_pow_x.multiply(w_pow_r);
                }
                // If exponent splits as d + r with d = e_k and r finite, use w^(e_k+r) = (w^e_k) * (w^r) = e_k * w^r
                const d = b.getLimitPart();
                const r = b.getFinitePart();
                if (!d.isZero() && d.terms.length === 1) {
                    const dt = d.terms[0];
                    if (dt.omegaExponent.isZero() && dt.epsilonFactors.length === 1 && dt.epsilonFactors[0].exp.isOne() && dt.coefficient === 1n) {
                        const idx = dt.epsilonFactors[0].base.clone();
                        const w_pow_r = this.power(r); // r is finite; handled by squaring earlier
                        const e_k = new ENFOrdinal([new ENFTerm([{ base: idx, exp: ENFOrdinal.one() }], CNFOrdinal.ZEROStatic(), 1n)]);
                        return e_k.multiply(w_pow_r);
                    }
                }
                // General case: w^b → term with omega exponent = b (as CNF)
                const b_as_cnf = b.toCNFOrdinal();
                return new ENFOrdinal([new ENFTerm([], b_as_cnf, 1n)]);
            }
            if (leading.epsilonFactors.length === 1 && leading.epsilonFactors[0].exp.isOne()) {
                // e_(idx)^b
                const idx = leading.epsilonFactors[0].base.clone(); // ENF index
                // If exponent outranks base, decompose by rank(b)
                const rank_b_local = b.getRank();
                if (rank_b_local.compareTo(a) > 0) {
                    const k = rank_b_local;
                    const { quotient: x, remainder: r } = b.ordinalDivision(k);
                    // Build k^x
                    let k_pow_x;
                    if (k.isOmega()) {
                        k_pow_x = new ENFOrdinal([new ENFTerm([], x.toCNFOrdinal(), 1n)]);
                    } else {
                        const t = k.terms[0].epsilonFactors[0].base.clone();
                        k_pow_x = new ENFOrdinal([new ENFTerm([{ base: t, exp: x.clone() }], CNFOrdinal.ZEROStatic(), 1n)]);
                    }
                    const term_r = a.power(r);
                    return k_pow_x.multiply(term_r);
                }
                return new ENFOrdinal([new ENFTerm([{ base: idx, exp: b.clone() }], CNFOrdinal.ZEROStatic(), 1n)]);
            }
        }

        const rank_a = a.getRank();
        const rank_b = b.getRank();

        // Case A: rank(b) > rank(a)
        if (rank_b.compareTo(rank_a) > 0) {
            const k = rank_b;
            const { quotient: x, remainder: r } = b.ordinalDivision(k);
            // Build k^x directly: if k = ω, set omegaExponent=x; if k=e_t, epsilon factor (t, x)
            let k_pow_x;
            if (k.isOmega()) {
                k_pow_x = new ENFOrdinal([new ENFTerm([], x.toCNFOrdinal(), 1n)]);
            } else {
                // k is epsilon basic: extract its index t
                const t = k.terms[0].epsilonFactors[0].base.clone();
                k_pow_x = new ENFOrdinal([new ENFTerm([{ base: t, exp: x.clone() }], CNFOrdinal.ZEROStatic(), 1n)]);
            }
            const term_r = a.power(r);
            return k_pow_x.multiply(term_r);
        }
        // Case B: rank(b) <= rank(a)
        else {
            const k = rank_a;
            const c = a.getLogarithm();
            const d = b.getLimitPart();
            const r = b.getFinitePart();
            const term_r = a.power(r);
            if (d.isZero()) {
                return term_r; // a^0 * a^r = a^r
            }
            const cd = c.multiply(d);
            // Build k^(c*d) directly
            let k_pow_cd;
            if (k.isOmega()) {
                k_pow_cd = new ENFOrdinal([new ENFTerm([], cd.toCNFOrdinal(), 1n)]);
            } else {
                const t = k.terms[0].epsilonFactors[0].base.clone();
                k_pow_cd = new ENFOrdinal([new ENFTerm([{ base: t, exp: cd.clone() }], CNFOrdinal.ZEROStatic(), 1n)]);
            }
            return k_pow_cd.multiply(term_r);
        }
    }

    static expOmega(delta) {
        if (delta.isZero()) return ENFOrdinal.one();

        let result = ENFOrdinal.one();
        for (const term of delta.terms) {
            const termAsOrd = new ENFOrdinal([term.clone()]);
            let newEpsilonIndex;

            if (term.epsilonFactors.length > 0) {
                const pred = termAsOrd.predecessor();
                newEpsilonIndex = pred;
            } else {
                const omegaExp = term.omegaExponent;
                const pred = omegaExp.exponentPredecessor();
                newEpsilonIndex = new ENFOrdinal([new ENFTerm([], pred, term.coefficient)]);
            }

            const newTerm = new ENFTerm([{ base: newEpsilonIndex, exp: ENFOrdinal.one() }]);
            result = result.multiply(new ENFOrdinal([newTerm]));
        }
        return result;
    }
}

// Helper: convert CNF/Epsilon/WTower to ENF
ENFOrdinal.fromCNF = function (ord) {
    if (ord instanceof ENFOrdinal) return ord.clone();
    if (ord instanceof EpsilonOrdinal) {
        const baseENF = ENFOrdinal.fromCNF(ord.index);
        return new ENFOrdinal([new ENFTerm([{ base: baseENF, exp: ENFOrdinal.one() }], CNFOrdinal.ZEROStatic(), 1n)]);
    }
    if (!(ord instanceof CNFOrdinal)) {
        if (typeof WTowerOrdinal !== 'undefined' && ord instanceof WTowerOrdinal) {
            return ENFOrdinal.fromCNF(ord.toCNFOrdinal());
        }
        throw new Error("ENFOrdinal.fromCNF: unsupported type");
    }

    if (ord.isZero()) return ENFOrdinal.zero();

    const terms = [];
    for (const t of ord.terms) {
        if (t.exponent.isZero()) {
            terms.push(new ENFTerm([], CNFOrdinal.ZEROStatic(), t.coefficient));
        } else if (t.exponent instanceof EpsilonOrdinal) {
            const baseENF = ENFOrdinal.fromCNF(t.exponent.index);
            terms.push(new ENFTerm([{ base: baseENF, exp: ENFOrdinal.one() }], CNFOrdinal.ZEROStatic(), t.coefficient));
        } else {
            terms.push(new ENFTerm([], t.exponent.clone(), t.coefficient));
        }
    }
    return new ENFOrdinal(terms);
};
