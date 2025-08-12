// ordinal_comparison.js

// Assumes CNFOrdinal, EpsilonOrdinal, and WTowerOrdinal classes are defined from ordinal_types.js

/**
 * Compares this CNFOrdinal to another ordinal.
 * @param {CNFOrdinal | EpsilonOrdinal | WTowerOrdinal} otherOrdinal The ordinal to compare against.
 * @returns {number} -1 if this < otherOrdinal, 0 if this == otherOrdinal, 1 if this > otherOrdinal.
 */
CNFOrdinal.prototype.compareTo = function (other) {
    if (this._tracer) this._tracer.consume();

    if (other instanceof EpsilonOrdinal || other instanceof WTowerOrdinal) {
        // Delegate comparison to the other type, but reverse the result.
        // e.g., for this.compareTo(other), call other.compareTo(this) and flip the sign.
        return -other.compareTo(this);
    }

    if (typeof ENFOrdinal !== 'undefined' && other instanceof ENFOrdinal) {
        // Convert ENF to CNF and continue CNF vs CNF comparison to avoid recursion in mapping
        other = other.toCNFOrdinal();
    }

    if (!(other instanceof CNFOrdinal)) {
        throw new Error("Cannot compare CNFOrdinal with unknown ordinal type.");
    }

    // Comparing two CNFOrdinals
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
        if (expComparison !== 0) {
            return expComparison;
        }
        if (thisTerm.coefficient < otherTerm.coefficient) return -1;
        if (thisTerm.coefficient > otherTerm.coefficient) return 1;
    }

    if (lenThis < lenOther) return -1;
    if (lenThis > lenOther) return 1;
    return 0; // Equal
};

/**
 * Compares this EpsilonOrdinal to another ordinal.
 * @param {CNFOrdinal | EpsilonOrdinal | WTowerOrdinal} other The ordinal to compare against.
 * @returns {number} -1 if this < other, 0 if this == other, 1 if this > other.
 */
EpsilonOrdinal.prototype.compareTo = function (other) {
    if (this._tracer) this._tracer.consume();

    if (other instanceof EpsilonOrdinal) {
        // To compare e_k and e_j, we just compare their indices k and j.
        return this.index.compareTo(other.index);
    }

    if (other instanceof WTowerOrdinal) {
        return -other.compareTo(this); // Delegate and flip
    }

    if (typeof ENFOrdinal !== 'undefined' && other instanceof ENFOrdinal) {
        // Convert ENF to CNF for comparison using existing CNF logic
        const otherCNF = other.toCNFOrdinal();
        return this.compareTo(otherCNF);
    }

    if (other instanceof CNFOrdinal) {
        // Comparing e_k to a CNF sum a = w^a_1*c_1 + ...
        // If a is zero or finite, e_k > a.
        if (other.isZero() || other.isFinite()) {
            return 1;
        }
        // Get the leading exponent of the CNF ordinal.
        const leadingExp = other.terms[0].exponent;

        // Compare this (e_k) to the leading exponent.
        const cmp = this.compareTo(leadingExp);
        if (cmp === 1) { // e_k > a_1
            return 1; // Then e_k > w^a_1*c_1 + ...
        }
        if (cmp === -1) { // e_k < a_1
            return -1; // Then e_k < w^a_1*c_1 + ...
        }
        // If cmp === 0, then e_k === a_1.
        // This means the CNF ordinal is w^(e_k)*c_1 + ...
        // which is greater than e_k.
        return -1;
    }

    throw new Error("Cannot compare EpsilonOrdinal with unknown ordinal type.");
};

/**
 * Compares this WTowerOrdinal to another ordinal.
 * @param {CNFOrdinal | EpsilonOrdinal | WTowerOrdinal} other The ordinal to compare against.
 * @returns {number} -1 if this < other, 0 if this == other, 1 if this > other.
 */
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.compareTo = function (other) {
        if (this._tracer) this._tracer.consume();
        // Convert this tower to CNF and then compare.
        const thisCNF = this.toCNFOrdinal();
        return thisCNF.compareTo(other);
    };
}

// Now that compareTo is defined, we can ensure _normalize in ordinal_types.js works fully.
// If CNFOrdinal._ZEROStatic was created before compareTo was prototyped, its internal terms might not be
// perfectly "normalized" by a sort if it had complex exponents (though for ZERO it's empty).
// It's generally safer to ensure all prototype methods are defined before creating complex static instances,
// or to re-normalize them if necessary. Our static getters for ZERO, ONE, OMEGA return clones,
// and the constructor calls _normalize, so new instances should be fine.