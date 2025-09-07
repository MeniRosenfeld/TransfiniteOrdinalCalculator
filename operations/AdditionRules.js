// AdditionRules.js
// Rule definitions for ordinal addition

// Addition-specific implementations
function addCNF(a, b) {
    // CNF-specific addition algorithm (extracted from CNFOrdinal.prototype.addCNF)
    if (a._tracer) a._tracer.consume();

    // Case 1: b is 0
    if (b.isZero()) {
        return a.clone();
    }

    // Case 2: a is 0
    if (a.isZero()) {
        return b.clone();
    }

    // Case 3: a is finite, b is infinite
    if (a.isFinite() && !b.isFinite()) {
        return b.clone();
    }

    // Case 4: a is infinite, b is finite
    if (!a.isFinite() && b.isFinite()) {
        const newTerms = a.terms.map(t => ({
            exponent: t.exponent.clone(a._tracer),
            coefficient: t.coefficient
        }));
        const aFinitePart = a.getFinitePart();
        const bFinitePart = b.getFinitePart();
        const combinedFinitePart = aFinitePart + bFinitePart;

        if (aFinitePart > 0n) {
            newTerms[newTerms.length - 1].coefficient = combinedFinitePart;
            if (combinedFinitePart === 0n && newTerms[newTerms.length - 1].exponent.isZero()) {
                newTerms.pop();
            }
        } else if (combinedFinitePart > 0n) {
            newTerms.push({ exponent: CNFOrdinal.ZEROStatic().clone(a._tracer), coefficient: combinedFinitePart });
        }
        return new CNFOrdinal(newTerms, a._tracer);
    }

    // Case 5: a is finite, b is finite (both non-zero)
    if (a.isFinite() && b.isFinite()) {
        return new CNFOrdinal(a.getFinitePart() + b.getFinitePart(), a._tracer);
    }

    // Case 6: Both a and b are infinite - core CNF addition logic
    const firstTermOther = b.terms[0];
    const firstExpOther = firstTermOther.exponent;

    const newTermsResult = [];
    let i = 0;

    // Copy terms from a whose exponents are greater than the leading exponent of b
    while (i < a.terms.length && a.terms[i].exponent.compareTo(firstExpOther) > 0) {
        newTermsResult.push({
            exponent: a.terms[i].exponent.clone(a._tracer),
            coefficient: a.terms[i].coefficient
        });
        i++;
    }

    if (i < a.terms.length && a.terms[i].exponent.equals(firstExpOther)) {
        // Exponents are equal: add coefficients and take the rest of b
        newTermsResult.push({
            exponent: a.terms[i].exponent.clone(a._tracer),
            coefficient: a.terms[i].coefficient + firstTermOther.coefficient
        });
        // Add remaining terms from b
        for (let j = 1; j < b.terms.length; j++) {
            newTermsResult.push({
                exponent: b.terms[j].exponent.clone(a._tracer),
                coefficient: b.terms[j].coefficient
            });
        }
    } else {
        // All remaining exponents in a are smaller than firstExpOther,
        // or a has no more terms. So, all terms of b are appended.
        for (let j = 0; j < b.terms.length; j++) {
            newTermsResult.push({
                exponent: b.terms[j].exponent.clone(a._tracer),
                coefficient: b.terms[j].coefficient
            });
        }
    }
    return new CNFOrdinal(newTermsResult, a._tracer);
}

function addENF(a, b) {
    // ENF-specific addition algorithm (extracted from ENFOrdinal.prototype.add)
    if (a.isZero()) return b.clone();
    if (b.isZero()) return a.clone();

    const b1 = b.terms[0];
    const newTerms = [];
    let k = -1;

    for (let i = 0; i < a.terms.length; i++) {
        if (a.terms[i].compareStructureTo(b1) <= 0) {
            k = i;
            break;
        }
        newTerms.push(a.terms[i].clone());
    }

    if (k === -1) return new ENFOrdinal(newTerms.concat(b.terms.map(t => t.clone())));

    const ak = a.terms[k];
    if (ak.compareStructureTo(b1) < 0) return new ENFOrdinal(newTerms.concat(b.terms.map(t => t.clone())));

    if (ak.compareStructureTo(b1) === 0) {
        const junctionTerm = ak.clone();
        junctionTerm.coefficient += b1.coefficient;
        newTerms.push(junctionTerm);
        const restOfBeta = b.terms.slice(1).map(t => t.clone());
        return new ENFOrdinal(newTerms.concat(restOfBeta));
    }
    return new ENFOrdinal(newTerms.concat(b.terms.map(t => t.clone())));
}

function addFinite(a, b) {
    // Simple finite addition
    const aVal = a.getFiniteBigInt();
    const bVal = b.getFiniteBigInt();
    return new FiniteOrdinal(aVal + bVal);
}

/**
 * Creates the complete set of addition rules in priority order.
 * @param {ConversionEngine} conversionEngine - For type conversions
 * @returns {Rule[]} - Array of addition rules
 */
function createAdditionRules(conversionEngine) {
    return [
        // Identity rules (highest precedence)
        new Rule("Zero left identity",
            (a, b) => a.isZero(),
            (a, b) => b.clone()),

        new Rule("Zero right identity",
            (a, b) => b.isZero(),
            (a, b) => a.clone()),

        // Finite arithmetic
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => addFinite(a, b)),

        // Finite + infinite => infinite (left finite)
        new Rule("Finite + infinite = infinite",
            (a, b) => a.isFinite() && !b.isFinite(),
            (a, b) => b.clone()),

        // Convert to CNF for <ε₀ ordinals
        new Rule("Convert to CNF for <ε₀",
            (a, b) => a.isLessThanEpsilon0() && b.isLessThanEpsilon0() &&
                conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                return addCNF(aCNF, bCNF);
            }),

        // Fallback to ENF for general case
        new Rule("Convert to ENF fallback",
            (a, b) => conversionEngine.canConvert(a, 'ENF') && conversionEngine.canConvert(b, 'ENF'),
            (a, b) => {
                const aENF = conversionEngine.convert(a, 'ENF');
                const bENF = conversionEngine.convert(b, 'ENF');
                return addENF(aENF, bENF);
            })
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createAdditionRules;
} else {
    // Browser global
    window.createAdditionRules = createAdditionRules;
}
