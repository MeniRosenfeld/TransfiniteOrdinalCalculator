// ExponentiationRules.js
// Rule definitions for ordinal exponentiation

function powerFinite(a, b) {
    const base = a.getFiniteBigInt();
    const exp = b.getFiniteBigInt();
    const result = base ** exp;
    return new FiniteOrdinal(result);
}

function buildLimitPart(cnf) {
    if (!(cnf instanceof CNFOrdinal)) return new CNFOrdinal(0);
    if (cnf.isZero()) return new CNFOrdinal(0);
    const terms = cnf.terms;
    const resultTerms = [];
    for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        if (i === terms.length - 1 && t.exponent.isZero()) continue; // drop finite tail
        resultTerms.push({ exponent: t.exponent.clone(), coefficient: t.coefficient });
    }
    return new CNFOrdinal(resultTerms);
}

function powerCNF(a, b) {
    // Port of legacy CNF power with available helpers
    if (b.isZero()) return CNFOrdinal.ONEStatic().clone();
    if (a.isZero()) return CNFOrdinal.ZEROStatic().clone();
    if (a.isOne()) return CNFOrdinal.ONEStatic().clone();
    if (b.isOne()) return a.clone();

    // Both finite handled by earlier rule, but safe-guard here too
    if (a.isFinite() && b.isFinite()) {
        const base = a.getFinitePart();
        const exp = b.getFinitePart();
        return new CNFOrdinal(base ** exp);
    }

    // Infinite base, finite exponent
    if (!a.isFinite() && b.isFinite()) {
        const m = b.getFinitePart();
        if (m === 0n) return CNFOrdinal.ONEStatic().clone();

        // (ω^α)^m = ω^(α*m) when single term with coeff 1
        if (a.terms.length === 1 && a.terms[0].coefficient === 1n) {
            const alpha = a.terms[0].exponent;
            const mAsOrdinal = new CNFOrdinal(m);
            const newExp = alpha.multiply(mAsOrdinal); // multiply ordinals (rule engine)
            return new CNFOrdinal([{ exponent: newExp, coefficient: 1n }]);
        }

        // General case: iterate multiplication
        let result = CNFOrdinal.ONEStatic().clone();
        for (let i = 0n; i < m; i++) {
            result = result.multiply(a);
        }
        return result;
    }

    // Infinite base, infinite exponent: α^B = ω^(α1*B_lim) * α^m
    if (!a.isFinite() && !b.isFinite()) {
        const mVal = b.getFinitePart();
        const B_lim = buildLimitPart(b);

        // α^m (finite power)
        let alphaPowM = CNFOrdinal.ONEStatic().clone();
        if (mVal > 0n) {
            const mAsOrdinal = new CNFOrdinal(mVal);
            // Use repeated multiplication or the single-term fast path if available
            if (a.terms.length === 1 && a.terms[0].coefficient === 1n) {
                const alpha = a.terms[0].exponent;
                const newExp = alpha.multiply(mAsOrdinal);
                alphaPowM = new CNFOrdinal([{ exponent: newExp, coefficient: 1n }]);
            } else {
                for (let i = 0n; i < mVal; i++) {
                    alphaPowM = alphaPowM.multiply(a);
                }
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
        const omegaTerm = new CNFOrdinal([{ exponent: omegaExp, coefficient: 1n }]);
        return omegaTerm.multiply(alphaPowM);
    }

    // Finite base, infinite exponent: k^β where β = ω·ξ + r  => ω^ξ * k^r
    if (a.isFinite() && !b.isFinite()) {
        const k = a.getFinitePart();
        if (k === 0n) return new CNFOrdinal(0n);
        if (k === 1n) return new CNFOrdinal(1n);

        const r = b.getFinitePart();
        const B_lim = buildLimitPart(b);
        if (B_lim.isZero()) {
            return new CNFOrdinal(k ** r);
        }
        // ξ = B_lim / ω
        const xi = B_lim.divideByOmega();
        const omegaPowXi = new CNFOrdinal([{ exponent: xi, coefficient: 1n }]);
        const kPowR = new CNFOrdinal(k ** r);
        return omegaPowXi.multiply(kPowR);
    }

    throw new Error('CNF exponentiation: unsupported case');
}

function createExponentiationRules(conversionEngine) {
    return [
        // a ^ 0 = 1
        new Rule('a^0 = 1',
            (a, b) => b.isZero(),
            (a, b) => new FiniteOrdinal(1n)),

        // 0 ^ a = 0 (a>0 is implied by previous rule)
        new Rule('0^a = 0',
            (a, b) => a.isZero(),
            (a, b) => new FiniteOrdinal(0n)),

        // 1 ^ a = 1
        new Rule('1^a = 1',
            (a, b) => a.isOne(),
            (a, b) => new FiniteOrdinal(1n)),

        // a ^ 1 = a
        new Rule('a^1 = a',
            (a, b) => b.isOne(),
            (a, b) => a.clone()),

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


