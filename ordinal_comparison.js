// ordinal_comparison.js

// Assumes CNFOrdinal, EpsilonNaughtOrdinal, and WTowerOrdinal classes are defined.

/**
 * Compares this CNFOrdinal to another ordinal.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal | WTowerOrdinal} otherOrdinal The ordinal to compare against.
 * @returns {number} -1 if this < otherOrdinal, 0 if this == otherOrdinal, 1 if this > otherOrdinal.
 */
CNFOrdinal.prototype.compareTo = function(otherOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (otherOrdinal instanceof WTowerOrdinal) {
        otherOrdinal = otherOrdinal.toCNFOrdinal(); // Convert WTower to CNF for comparison
    }

    if (otherOrdinal instanceof EpsilonNaughtOrdinal) {
        return -1; // Any CNFOrdinal (less than e_0) is less than e_0.
    }
    if (!(otherOrdinal instanceof CNFOrdinal)) {
        throw new Error("Cannot compare CNFOrdinal with unknown ordinal type.");
    }

    // Handle easy cases with zero
    if (this.isZero() && otherOrdinal.isZero()) return 0;
    if (this.isZero()) return -1; // 0 is less than any positive ordinal
    if (otherOrdinal.isZero()) return 1;  // Any positive ordinal is greater than 0

    // Iterate through terms for lexicographical comparison
    const lenThis = this.terms.length;
    const lenOther = otherOrdinal.terms.length;
    const minLen = Math.min(lenThis, lenOther);

    for (let i = 0; i < minLen; i++) {
        const thisTerm = this.terms[i];
        const otherTerm = otherOrdinal.terms[i];

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
 * Compares this EpsilonNaughtOrdinal to another ordinal.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal | WTowerOrdinal} otherOrdinal The ordinal to compare against.
 * @returns {number} -1 if this < otherOrdinal, 0 if this == otherOrdinal, 1 if this > otherOrdinal.
 */
EpsilonNaughtOrdinal.prototype.compareTo = function(otherOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (otherOrdinal instanceof WTowerOrdinal) {
        otherOrdinal = otherOrdinal.toCNFOrdinal(); // Convert WTower to CNF for comparison
    }

    if (otherOrdinal instanceof EpsilonNaughtOrdinal) {
        return 0; // e_0 == e_0
    }
    if (otherOrdinal instanceof CNFOrdinal) {
        return 1; // e_0 > any CNFOrdinal
    }
    throw new Error("Cannot compare EpsilonNaughtOrdinal with unknown ordinal type.");
};

/**
 * Compares this WTowerOrdinal to another ordinal.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal | WTowerOrdinal} otherOrdinal The ordinal to compare against.
 * @returns {number} -1 if this < otherOrdinal, 0 if this == otherOrdinal, 1 if this > otherOrdinal.
 */
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.compareTo = function(otherOrdinal) {
        if (this._tracer) this._tracer.consume();
        const thisCNF = this.toCNFOrdinal();
        // No need to convert otherOrdinal to CNF here, as thisCNF.compareTo will handle it.
        return thisCNF.compareTo(otherOrdinal);
    };
}

// Now that compareTo is defined, we can ensure _normalize in ordinal_types.js works fully.
// If CNFOrdinal._ZEROStatic was created before compareTo was prototyped, its internal terms might not be
// perfectly "normalized" by a sort if it had complex exponents (though for ZERO it's empty).
// It's generally safer to ensure all prototype methods are defined before creating complex static instances,
// or to re-normalize them if necessary. Our static getters for ZERO, ONE, OMEGA return clones,
// and the constructor calls _normalize, so new instances should be fine.

// ordinal_comparison.js