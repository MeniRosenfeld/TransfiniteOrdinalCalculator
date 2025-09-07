// MultiplicationRules.js
// Rule definitions for ordinal multiplication


function multiplyFinite(a, b) {
    const av = a.getFiniteBigInt();
    const bv = b.getFiniteBigInt();
    return new FiniteOrdinal(av * bv);
}

function buildLimitPart(cnf) {
    if (!(cnf instanceof CNFOrdinal)) return new CNFOrdinal(0);
    if (cnf.isZero()) return new CNFOrdinal(0);
    const terms = cnf.terms;
    const resultTerms = [];
    for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        // Skip finite last term (ω^0)
        if (i === terms.length - 1 && t.exponent.isZero()) continue;
        resultTerms.push({ exponent: t.exponent.clone(), coefficient: t.coefficient });
    }
    return new CNFOrdinal(resultTerms);
}

function multiplyCNF(a, b) {
    // Implements the legacy CNF * CNF algorithm, using rule-based add for exponents
    if (a.isZero() || b.isZero()) return CNFOrdinal.ZEROStatic().clone();
    if (a.isOne()) return b.clone();
    if (b.isOne()) return a.clone();

    const a1_exp = a.terms[0].exponent;
    const n1_coeff = a.terms[0].coefficient;

    const b_limit_part = buildLimitPart(b);
    const m_finite_part = b.getFinitePart();

    const newTerms = [];

    // sum over limit part: ω^{a1+bj} * mj
    for (const term_b of b_limit_part.terms) {
        const bj_exp = term_b.exponent;
        const mj_coeff = term_b.coefficient;
        // Add exponents via rule engine, then ensure exponent is CNF
        const expSum = a1_exp.add(bj_exp);
        const new_exp = (expSum instanceof CNFOrdinal)
            ? expSum
            : new CNFOrdinal(expSum.getFiniteBigInt());
        newTerms.push({ exponent: new_exp, coefficient: mj_coeff });
    }

    if (m_finite_part > 0n) {
        // ω^{a1} * n1 * m
        newTerms.push({ exponent: a1_exp.clone(), coefficient: n1_coeff * m_finite_part });
        // plus the tail of a (i >= 2)
        for (let i = 1; i < a.terms.length; i++) {
            newTerms.push({ exponent: a.terms[i].exponent.clone(), coefficient: a.terms[i].coefficient });
        }
    }

    return new CNFOrdinal(newTerms);
}

function createMultiplicationRules(conversionEngine) {
    return [
        // Zero annihilators
        new Rule("Zero left",
            (a, b) => a.isZero(),
            (a, b) => a.clone()), // 0 * b = 0

        new Rule("Zero right",
            (a, b) => b.isZero(),
            (a, b) => b.clone()), // a * 0 = 0

        // One identities
        new Rule("One left",
            (a, b) => a.isOne(),
            (a, b) => b.clone()),

        new Rule("One right",
            (a, b) => b.isOne(),
            (a, b) => a.clone()),

        // Finite * finite
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => multiplyFinite(a, b)),

        // Finite * infinite = infinite (left finite)
        new Rule("Finite * infinite = infinite",
            (a, b) => a.isFinite(),
            (a, b) => b.clone()),

        // Convert to CNF for < ε0 and use CNF multiplication
        new Rule("Convert to CNF for <ε₀",
            (a, b) => a.isLessThanEpsilon0() && b.isLessThanEpsilon0() &&
                conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                return multiplyCNF(aCNF, bCNF);
            })

        // ENF fallback can be added later when ENF is migrated
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createMultiplicationRules;
} else {
    // Browser global
    window.createMultiplicationRules = createMultiplicationRules;
}


