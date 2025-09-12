// Comparison.js
// Rule definitions for ordinal comparison

// Comparison-specific implementations
function compareCNF(a, b) {
    // CNF-specific comparison algorithm (extracted from CNFOrdinal.prototype.compareTo)
    if (a._tracer) a._tracer.consume();

    // Comparing two CNFOrdinals
    if (a.isZero() && b.isZero()) return 0;
    if (a.isZero()) return -1;
    if (b.isZero()) return 1;

    const lenA = a.terms.length;
    const lenB = b.terms.length;
    const minLen = Math.min(lenA, lenB);

    for (let i = 0; i < minLen; i++) {
        const aTerms = a.terms[i];
        const bTerms = b.terms[i];

        const expComparison = aTerms.exponent.compareTo(bTerms.exponent);
        if (expComparison !== 0) {
            return expComparison;
        }
        if (aTerms.coefficient < bTerms.coefficient) return -1;
        if (aTerms.coefficient > bTerms.coefficient) return 1;
    }

    if (lenA < lenB) return -1;
    if (lenA > lenB) return 1;
    return 0;
}

function compareENF(a, b) {
    // ENF-specific comparison algorithm (extracted from ENFOrdinal.prototype.compareTo)
    if (a.isZero() && b.isZero()) return 0;
    if (a.isZero()) return -1;
    if (b.isZero()) return 1;

    const len = Math.min(a.terms.length, b.terms.length);
    for (let i = 0; i < len; i++) {
        const termCmp = a.terms[i].compareTo(b.terms[i]);
        if (termCmp !== 0) return termCmp;
    }

    return a.terms.length > b.terms.length ? 1 : a.terms.length < b.terms.length ? -1 : 0;
}

function compareFinite(a, b) {
    // Simple finite comparison
    const aVal = a.getFiniteBigInt();
    const bVal = b.getFiniteBigInt();
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
}

/**
 * Creates the complete set of comparison rules in priority order.
 * @param {ConversionEngine} conversionEngine - For type conversions
 * @returns {Rule[]} - Array of comparison rules
 */
function createComparisonRules(conversionEngine) {
    return [
        // Identity and trivial cases (checked first)
        new Rule("Same object",
            (a, b) => a === b,
            (a, b) => 0),

        // Both finite
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => compareFinite(a, b)),

        // Finite vs infinite
        new Rule("Finite vs infinite",
            (a, b) => a.isFinite() !== b.isFinite(),
            (a, b) => a.isFinite() ? -1 : 1), // finite < infinite

        // EpsilonZero equality (new architecture basic type)
        new Rule("EpsilonZero equality",
            (a, b) => (typeof EpsilonZero !== 'undefined') && (a instanceof EpsilonZero) && (b instanceof EpsilonZero),
            (a, b) => 0),

        new Rule("Omega equality",
            (a, b) => (a.isOmega() && b.isOmega()),
            (a, b) => 0),


        // Any <ε₀ ordinal is less than ε₀
        new Rule("CNF vs EpsilonZero ordering",
            (a, b) => (typeof EpsilonZero !== 'undefined') && (
                (a.isLessThanEpsilon0() && (b instanceof EpsilonZero)) ||
                (b.isLessThanEpsilon0() && (a instanceof EpsilonZero))
            ),
            (a, b) => {
                if (a instanceof EpsilonZero && b.isLessThanEpsilon0()) return 1;
                if (b instanceof EpsilonZero && a.isLessThanEpsilon0()) return -1;
                return 0;
            }),

        new Rule("Different rank",
            (a, b) => OPERATIONS.compare(a.rank(), b.rank()) != 0,
            (a, b) => OPERATIONS.compare(a.rank(), b.rank())
        ),

        new Rule("Different log*",
            (a, b) => a.logStar().getFiniteBigInt() != b.logStar().getFiniteBigInt(),
            (a, b) => a.logStar().getFiniteBigInt() < b.logStar().getFiniteBigInt() ? -1 : 1
        ),

        new Rule("Tower vs not tower",
            (a, b) => a.isTower() != b.isTower(),
            (a, b) => a.isTower() ? -1 : 1
        ),

        new Rule("Both towers",
            (a, b) => a.isTower() && b.isTower(),
            (a, b) => 0
        ),


        // Convert to CNF for <ε₀ ordinals
        new Rule("Convert to CNF for <ε₀",
            (a, b) => a.isLessThanEpsilon0() && b.isLessThanEpsilon0() &&
                conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                return compareCNF(aCNF, bCNF);
            }),

        // Fallback to ENF for general case
        new Rule("Convert to ENF fallback",
            (a, b) => conversionEngine.canConvert(a, 'ENF') && conversionEngine.canConvert(b, 'ENF'),
            (a, b) => {
                const aENF = conversionEngine.convert(a, 'ENF');
                const bENF = conversionEngine.convert(b, 'ENF');
                return compareENF(aENF, bENF);
            })
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createComparisonRules;
} else {
    // Browser global
    window.createComparisonRules = createComparisonRules;
}
