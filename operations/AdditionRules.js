// AdditionRules.js
// Rule definitions for ordinal addition

// Addition-specific implementations
function addCNF(a, b) {
    // CNF-specific addition algorithm (extracted from CNFOrdinal.prototype.addCNF)
    if (a._tracer) a._tracer.consume();
    const tracer = a._tracer || b._tracer || null;

    // Case 1: b is 0
    if (b.isZero()) {
        return a.clone(tracer);
    }

    // Case 2: a is 0
    if (a.isZero()) {
        return b.clone(tracer);
    }

    // Case 3: a is finite, b is infinite
    if (a.isFinite() && !b.isFinite()) {
        return b.clone(tracer);
    }

    // Case 4: a is infinite, b is finite
    if (!a.isFinite() && b.isFinite()) {
        if (tracer) tracer.consume(a.terms.length || 0);
        const newTerms = a.terms.map(t => ({
            exponent: t.exponent.clone(tracer),
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
            newTerms.push({ exponent: CNFOrdinal.ZEROStatic().clone(tracer), coefficient: combinedFinitePart });
        }
        return new CNFOrdinal(newTerms, tracer);
    }

    // Case 5: a is finite, b is finite (both non-zero)
    if (a.isFinite() && b.isFinite()) {
        return new CNFOrdinal(a.getFinitePart() + b.getFinitePart(), tracer);
    }

    // Case 6: Both a and b are infinite - core CNF addition logic
    const firstTermOther = b.terms[0];
    const firstExpOther = firstTermOther.exponent;

    const newTermsResult = [];
    let i = 0;

    // Copy terms from a whose exponents are greater than the leading exponent of b
    if (tracer) tracer.consume(a.terms.length || 0);
    while (i < a.terms.length && a.terms[i].exponent.compareTo(firstExpOther) > 0) {
        newTermsResult.push({
            exponent: a.terms[i].exponent.clone(tracer),
            coefficient: a.terms[i].coefficient
        });
        i++;
    }

    if (i < a.terms.length && a.terms[i].exponent.equals(firstExpOther)) {
        // Exponents are equal: add coefficients and take the rest of b
        newTermsResult.push({
            exponent: a.terms[i].exponent.clone(tracer),
            coefficient: a.terms[i].coefficient + firstTermOther.coefficient
        });
        // Add remaining terms from b
        if (tracer) tracer.consume(Math.max(0, (b.terms.length - 1)));
        for (let j = 1; j < b.terms.length; j++) {
            newTermsResult.push({
                exponent: b.terms[j].exponent.clone(tracer),
                coefficient: b.terms[j].coefficient
            });
        }
    } else {
        // All remaining exponents in a are smaller than firstExpOther,
        // or a has no more terms. So, all terms of b are appended.
        if (tracer) tracer.consume(b.terms.length || 0);
        for (let j = 0; j < b.terms.length; j++) {
            newTermsResult.push({
                exponent: b.terms[j].exponent.clone(tracer),
                coefficient: b.terms[j].coefficient
            });
        }
    }
    return new CNFOrdinal(newTermsResult, tracer);
}

function addENF(a, b) {
    // ENF-specific addition algorithm (extracted from ENFOrdinal.prototype.add)
    if (a.isZero()) return b.clone();
    if (b.isZero()) return a.clone();

    const b1 = b.terms[0];
    const newTerms = [];
    let k = -1;

    const tracer = a._tracer || b._tracer || null;
    if (tracer) tracer.consume(a.terms.length || 0);
    for (let i = 0; i < a.terms.length; i++) {
        if (a.terms[i].compareStructureTo(b1) <= 0) {
            k = i;
            break;
        }
        newTerms.push(a.terms[i].clone(tracer));
    }

    if (k === -1) return new ENFOrdinal(newTerms.concat(b.terms.map(t => t.clone(tracer))), tracer);

    const ak = a.terms[k];
    if (ak.compareStructureTo(b1) < 0) return new ENFOrdinal(newTerms.concat(b.terms.map(t => t.clone(tracer))), tracer);

    if (ak.compareStructureTo(b1) === 0) {
        const junctionTerm = ak.clone(tracer);
        junctionTerm.coefficient += b1.coefficient;
        newTerms.push(junctionTerm);
        const restOfBeta = b.terms.slice(1).map(t => t.clone(tracer));
        return new ENFOrdinal(newTerms.concat(restOfBeta), tracer);
    }
    return new ENFOrdinal(newTerms.concat(b.terms.map(t => t.clone(tracer))), tracer);
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
            (a, b) => b.clone(a._tracer || b._tracer || null)),

        new Rule("Zero right identity",
            (a, b) => b.isZero(),
            (a, b) => a.clone(a._tracer || b._tracer || null)),

        // Finite arithmetic
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => addFinite(a, b)),

        // Finite + infinite => infinite (left finite)
        new Rule("Finite + infinite = infinite",
            (a, b) => a.isFinite() && !b.isFinite(),
            (a, b) => b.clone(a._tracer || b._tracer || null)),

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
            }),

        // ZetaZero rules (lowest precedence)
        // z0 + a is not implemented for a > 0
        new Rule("z0 + a not implemented",
            (a, b) => (typeof ZetaZero !== 'undefined') && (a instanceof ZetaZero),
            () => { throw new Error('Addition with z_0 on the left is not implemented'); }),

        // a + z0 = z0 (here a is known not to be z0 due to previous rule)
        new Rule("a + z0 = z0",
            (a, b) => (typeof ZetaZero !== 'undefined') && (b instanceof ZetaZero),
            (a, b) => b.clone(a._tracer || b._tracer || null))
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createAdditionRules;
} else {
    // Browser global
    window.createAdditionRules = createAdditionRules;
}
