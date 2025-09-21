// Comparison.js
// Rule definitions for ordinal comparison

// Comparison-specific implementations
function compareCNF(a, b) {
    // CNF-specific comparison algorithm (extracted from CNFOrdinal.prototype.compareTo)
    const tracer = a._tracer || b._tracer || null;
    if (tracer) tracer.consume(1);

    // Comparing two CNFOrdinals
    if (a.isZero() && b.isZero()) return 0;
    if (a.isZero()) return -1;
    if (b.isZero()) return 1;

    const lenA = a.terms.length;
    const lenB = b.terms.length;
    const minLen = Math.min(lenA, lenB);
    if (tracer) tracer.consume(minLen);

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
    const tracer = a._tracer || b._tracer || null;
    if (a.isZero() && b.isZero()) return 0;
    if (a.isZero()) return -1;
    if (b.isZero()) return 1;

    const len = Math.min(a.terms.length, b.terms.length);
    if (tracer) tracer.consume(len);
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

        new Rule("Omega equality",
            (a, b) => (a.isOmega() && b.isOmega()),
            (a, b) => 0),

        // Different rankTier: lower tier is smaller
        new Rule("Different rankTier",
            (a, b) => (typeof a.rankTier === 'function') && (typeof b.rankTier === 'function') && (a.rankTier() !== b.rankTier()),
            (a, b) => a.rankTier() < b.rankTier() ? -1 : 1
        ),

        // Epsilon index ordering: compare e_k by their indices (EpsilonZero treated as k=0)
        new Rule("Epsilon index ordering",
            (a, b) => (
                ((typeof EpsilonZero !== 'undefined' && (a instanceof EpsilonZero)) || (typeof EpsilonNumber !== 'undefined' && (a instanceof EpsilonNumber))) &&
                ((typeof EpsilonZero !== 'undefined' && (b instanceof EpsilonZero)) || (typeof EpsilonNumber !== 'undefined' && (b instanceof EpsilonNumber)))
            ),
            (a, b) => {
                const zeroIdx = new ZeroOrdinal(a._tracer || b._tracer || null);
                const idxA = (typeof EpsilonZero !== 'undefined' && a instanceof EpsilonZero)
                    ? zeroIdx
                    : a.k; // EpsilonNumber.k
                const idxB = (typeof EpsilonZero !== 'undefined' && b instanceof EpsilonZero)
                    ? zeroIdx
                    : b.k; // EpsilonNumber.k
                return OPERATIONS.compare(idxA, idxB);
            }
        ),

        new Rule("Different rank",
            (a, b) => OPERATIONS.compare(a.rank(), b.rank()) != 0,
            (a, b) => OPERATIONS.compare(a.rank(), b.rank())
        ),

        new Rule("Different log*",
            (a, b) => a.logStar() != b.logStar(),
            (a, b) => a.logStar() < b.logStar() ? -1 : 1
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
            }),

        // ZetaZero rules (lowest precedence)
        new Rule("ZetaZero equality",
            (a, b) => (typeof ZetaZero !== 'undefined') && (a instanceof ZetaZero) && (b instanceof ZetaZero),
            (a, b) => 0),

        new Rule("ZetaZero left dominates",
            (a, b) => (typeof ZetaZero !== 'undefined') && (a instanceof ZetaZero) && !(b instanceof ZetaZero),
            (a, b) => 1),

        new Rule("ZetaZero right dominates",
            (a, b) => (typeof ZetaZero !== 'undefined') && (b instanceof ZetaZero) && !(a instanceof ZetaZero),
            (a, b) => -1)
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createComparisonRules;
} else {
    // Browser global
    window.createComparisonRules = createComparisonRules;
}
