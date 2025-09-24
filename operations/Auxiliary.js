// operations/Auxiliary.js

/**
 * Analyzes an ordinal to determine its tower height and Main Power Tower (MPT) component.
 * This is used for complexity calculations and simplification fallbacks.
 * @param {OrdinalBase} ord The ordinal to analyze.
 * @returns {{numOmegas: BigInt, mptOrdinalForG: OrdinalBase}}
 */
function getTowerInfo(ord) {
    OperationTracer.consume();

    // Base case: Finite ordinals contribute 0 to tower height. MPT is the ordinal itself.
    if (ord.isFinite()) {
        return { numOmegas: 0n, mptOrdinalForG: ord };
    }

    // If it's already a WTower, we know the height. The MPT is the tower itself.
    if (ord instanceof WTowerOrdinal) {
        return { numOmegas: ord.height, mptOrdinalForG: ord };
    }

    // For CNF: ω^a * c + ... -> recursively analyze 'a'
    if (ord instanceof CNFOrdinal) {
        if (ord.isZero()) {
            return { numOmegas: 0n, mptOrdinalForG: ord };
        }
        const leadingTerm = ord.terms[0];
        const a = leadingTerm.exponent;

        // The MPT of ω^a*c is ω^(MPT of a)
        const innerTowerInfo = getTowerInfo(a);
        const mpt = new CNFOrdinal([{ exponent: innerTowerInfo.mptOrdinalForG, coefficient: 1n }]);

        return {
            numOmegas: 1n + innerTowerInfo.numOmegas,
            mptOrdinalForG: mpt
        };
    }

    // Fallback for other types like EpsilonZero, which don't have a simple tower structure in this context.
    // Treat them like a base case.
    return { numOmegas: 0n, mptOrdinalForG: ord };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getTowerInfo };
} else {
    window.getTowerInfo = getTowerInfo;
}
