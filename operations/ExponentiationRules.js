// ExponentiationRules.js
// Rule definitions for ordinal exponentiation

function powerFinite(a, b) {
    const base = a.getFiniteBigInt();
    const exp = b.getFiniteBigInt();
    const result = base ** exp;
    const tracer = a._tracer || b._tracer || null;
    return new FiniteOrdinal(result, tracer);
}

function buildLimitPart(cnf) {
    if (!(cnf instanceof CNFOrdinal)) return new CNFOrdinal(0);
    if (cnf.isZero()) return new CNFOrdinal(0);
    const terms = cnf.terms;
    const resultTerms = [];
    const tracer = cnf._tracer || null;
    if (tracer) tracer.consume(terms.length || 0);
    for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        if (i === terms.length - 1 && t.exponent.isZero()) continue; // drop finite tail
        resultTerms.push({ exponent: t.exponent.clone(tracer), coefficient: t.coefficient });
    }
    return new CNFOrdinal(resultTerms, tracer);
}

function powerCNF(a, b) {
    // Port of legacy CNF power with available helpers
    if (b.isZero()) return CNFOrdinal.ONEStatic().clone(a._tracer || b._tracer || null);
    if (a.isZero()) return CNFOrdinal.ZEROStatic().clone(a._tracer || b._tracer || null);
    if (a.isOne()) return CNFOrdinal.ONEStatic().clone(a._tracer || b._tracer || null);
    if (b.isOne()) return a.clone(a._tracer || b._tracer || null);

    const tracer = a._tracer || b._tracer || null;

    // Helper: exponentiation by squaring for CNF ordinals
    function powBySquaringCNF(baseCNF, expBigInt) {
        let result = CNFOrdinal.ONEStatic().clone(tracer);
        let base = baseCNF.clone(tracer);
        let e = expBigInt;
        let loopCount = 0;
        while (e > 0n) {
            loopCount++;
            if ((e & 1n) === 1n) {
                result = result.multiply(base);
            }
            e >>= 1n;
            if (e > 0n) {
                base = base.multiply(base);
            }
        }
        if (tracer) tracer.consume(loopCount);
        return result;
    }

    // Both finite handled by earlier rule, but safe-guard here too
    if (a.isFinite() && b.isFinite()) {
        const base = a.getFinitePart();
        const exp = b.getFinitePart();
        return new CNFOrdinal(base ** exp, tracer);
    }

    // Infinite base, finite exponent
    if (!a.isFinite() && b.isFinite()) {
        const m = b.getFinitePart();
        if (m === 0n) return CNFOrdinal.ONEStatic().clone(tracer);

        // (ω^α)^m = ω^(α*m) when single term with coeff 1
        if (a.terms.length === 1 && a.terms[0].coefficient === 1n) {
            const alpha = a.terms[0].exponent;
            const mAsOrdinal = new CNFOrdinal(m, tracer);
            const newExp = alpha.multiply(mAsOrdinal); // multiply ordinals (rule engine)
            return new CNFOrdinal([{ exponent: newExp, coefficient: 1n }], tracer);
        }

        // General case: use exponentiation by squaring
        return powBySquaringCNF(a, m);
    }

    // Infinite base, infinite exponent: α^B = ω^(α1*B_lim) * α^m
    if (!a.isFinite() && !b.isFinite()) {
        const mVal = b.getFinitePart();
        const B_lim = buildLimitPart(b);

        // α^m (finite power)
        let alphaPowM = CNFOrdinal.ONEStatic().clone(tracer);
        if (mVal > 0n) {
            const mAsOrdinal = new CNFOrdinal(mVal, tracer);
            // Use repeated multiplication or the single-term fast path if available
            if (a.terms.length === 1 && a.terms[0].coefficient === 1n) {
                const alpha = a.terms[0].exponent;
                const newExp = alpha.multiply(mAsOrdinal);
                alphaPowM = new CNFOrdinal([{ exponent: newExp, coefficient: 1n }], tracer);
            } else {
                alphaPowM = powBySquaringCNF(a, mVal);
            }
        }

        if (B_lim.isZero()) {
            return alphaPowM;
        }

        const leading = a.getLeadingTerm();
        if (!leading || leading.exponent.isZero()) {
            throw new Error('CNF power: expected infinite base');
        }
        const alpha1 = leading.exponent;
        const omegaExp = alpha1.multiply(B_lim);
        const omegaTerm = new CNFOrdinal([{ exponent: omegaExp, coefficient: 1n }], tracer);
        return omegaTerm.multiply(alphaPowM);
    }

    // Finite base, infinite exponent: k^β where β = ω·ξ + r  => ω^ξ * k^r
    if (a.isFinite() && !b.isFinite()) {
        const k = a.getFinitePart();
        if (k === 0n) return new CNFOrdinal(0n, tracer);
        if (k === 1n) return new CNFOrdinal(1n, tracer);

        const r = b.getFinitePart();
        const B_lim = buildLimitPart(b);
        if (B_lim.isZero()) {
            return new CNFOrdinal(k ** r, tracer);
        }
        // ξ = B_lim / ω
        const xi = B_lim.divideByOmega();
        const omegaPowXi = new CNFOrdinal([{ exponent: xi, coefficient: 1n }], tracer);
        const kPowR = new CNFOrdinal(k ** r, tracer);
        return omegaPowXi.multiply(kPowR);
    }

    throw new Error('CNF exponentiation: unsupported case');
}

function createExponentiationRules(conversionEngine) {
    return [
        // a ^ 0 = 1
        new Rule('a^0 = 1',
            (a, b) => b.isZero(),
            (a, b) => new OneOrdinal(a._tracer || b._tracer || null)),

        // 0 ^ a = 0 (a>0 is implied by previous rule)
        new Rule('0^a = 0',
            (a, b) => a.isZero(),
            (a, b) => new ZeroOrdinal(a._tracer || b._tracer || null)),

        // 1 ^ a = 1
        new Rule('1^a = 1',
            (a, b) => a.isOne(),
            (a, b) => new OneOrdinal(a._tracer || b._tracer || null)),

        // a ^ 1 = a
        new Rule('a^1 = a',
            (a, b) => b.isOne(),
            (a, b) => a.clone(a._tracer || b._tracer || null)),

        // Finite ^ finite
        new Rule('Finite ^ finite',
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => powerFinite(a, b)),

        // Finite ^ infinite -> CNF path (k^β)
        new Rule('Finite ^ infinite via CNF',
            (a, b) => a.isFinite() && !b.isFinite(),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                return powerCNF(aCNF, bCNF);
            }),

        // Prefer CNF path when both can convert to CNF (no extra type checks needed)
        new Rule('Convert to CNF when convertible',
            (a, b) => conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                return powerCNF(aCNF, bCNF);
            })

        // ENF fallback can be added later
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createExponentiationRules;
} else {
    // Browser global
    window.createExponentiationRules = createExponentiationRules;
}


