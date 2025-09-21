// MultiplicationRules.js
// Rule definitions for ordinal multiplication


function multiplyFinite(a, b) {
    const av = a.getFiniteBigInt();
    const bv = b.getFiniteBigInt();
    const tracer = a._tracer || b._tracer || null;
    return new FiniteOrdinal(av * bv, tracer);
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
        // Skip finite last term (ω^0)
        if (i === terms.length - 1 && t.exponent.isZero()) continue;
        resultTerms.push({ exponent: t.exponent.clone(tracer), coefficient: t.coefficient });
    }
    return new CNFOrdinal(resultTerms, tracer);
}

function multiplyCNF(a, b) {
    // Implements the legacy CNF * CNF algorithm, using rule-based add for exponents
    if (a.isZero() || b.isZero()) return CNFOrdinal.ZEROStatic().clone(a._tracer || b._tracer || null);
    if (a.isOne()) return b.clone(a._tracer || b._tracer || null);
    if (b.isOne()) return a.clone(a._tracer || b._tracer || null);

    const a1_exp = a.terms[0].exponent;
    const n1_coeff = a.terms[0].coefficient;

    const b_limit_part = buildLimitPart(b);
    const m_finite_part = b.getFinitePart();

    const newTerms = [];
    const tracer = a._tracer || b._tracer || null;

    // sum over limit part: ω^{a1+bj} * mj
    if (tracer) tracer.consume(b_limit_part.terms.length || 0);
    for (const term_b of b_limit_part.terms) {
        const bj_exp = term_b.exponent;
        const mj_coeff = term_b.coefficient;
        // Add exponents via rule engine, then ensure exponent is CNF
        const expSum = a1_exp.add(bj_exp);
        const new_exp = (expSum instanceof CNFOrdinal)
            ? expSum
            : new CNFOrdinal(expSum.getFiniteBigInt(), tracer);
        newTerms.push({ exponent: new_exp, coefficient: mj_coeff });
    }

    if (m_finite_part > 0n) {
        // ω^{a1} * n1 * m
        newTerms.push({ exponent: a1_exp.clone(tracer), coefficient: n1_coeff * m_finite_part });
        // plus the tail of a (i >= 2)
        if (tracer) tracer.consume(Math.max(0, a.terms.length - 1));
        for (let i = 1; i < a.terms.length; i++) {
            newTerms.push({ exponent: a.terms[i].exponent.clone(tracer), coefficient: a.terms[i].coefficient });
        }
    }

    return new CNFOrdinal(newTerms, tracer);
}

function createMultiplicationRules(conversionEngine) {
    return [
        // Zero annihilators
        new Rule("Zero left",
            (a, b) => a.isZero(),
            (a, b) => a.clone(a._tracer || b._tracer || null)), // 0 * b = 0

        new Rule("Zero right",
            (a, b) => b.isZero(),
            (a, b) => b.clone(a._tracer || b._tracer || null)), // a * 0 = 0

        // One identities
        new Rule("One left",
            (a, b) => a.isOne(),
            (a, b) => b.clone(a._tracer || b._tracer || null)),

        new Rule("One right",
            (a, b) => b.isOne(),
            (a, b) => a.clone(a._tracer || b._tracer || null)),

        // Finite * finite
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => multiplyFinite(a, b)),

        // Finite * infinite = infinite (left finite)
        new Rule("Finite * infinite = infinite",
            (a, b) => a.isFinite(),
            (a, b) => b.clone(a._tracer || b._tracer || null)),

        // Convert to CNF for < ε0 and use CNF multiplication
        new Rule("Convert to CNF for <ε₀",
            (a, b) => a.isLessThanEpsilon0() && b.isLessThanEpsilon0() &&
                conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const tracer = a._tracer || b._tracer || null;
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                const res = multiplyCNF(aCNF, bCNF);
                return res.clone(tracer);
            }),

        // ZetaZero rules (lowest precedence)
        // z0 * a is not implemented for a > 1
        new Rule("z0 * a not implemented",
            (a, b) => (typeof ZetaZero !== 'undefined') && (a instanceof ZetaZero),
            () => { throw new Error('Multiplication with z_0 on the left is not implemented'); }),

        // a * z0 = z0 (here a is known not to be z0 due to previous rule)
        new Rule("a * z0 = z0",
            (a, b) => (typeof ZetaZero !== 'undefined') && (b instanceof ZetaZero),
            (a, b) => b.clone(a._tracer || b._tracer || null)),

        // ENF fallback can be added later when ENF is migrated
        new Rule("Convert to ENF fallback",
            (a, b) => conversionEngine.canConvert(a, 'ENF') && conversionEngine.canConvert(b, 'ENF'),
            (a, b) => {
                const aENF = conversionEngine.convert(a, 'ENF');
                const bENF = conversionEngine.convert(b, 'ENF');
                return multiplyENF(aENF, bENF);
            })
    ];
}

function multiplyENF(a, b) {
    const tracer = a._tracer || b._tracer || null;
    if (a.isZero() || b.isZero()) return new ENFOrdinal([], tracer);

    // a * b where b is finite: (t1 + t2 + ...)*m = (t1*m) + t2 + ...
    if (b.isFinite()) {
        if (a.isFinite()) {
            return new ENFOrdinal([new ENFTerm([], a.getFiniteBigInt() * b.getFiniteBigInt(), tracer)]);
        }
        const leadingTermProduct = a.terms[0].clone(tracer);
        leadingTermProduct.coefficient *= b.getFiniteBigInt();
        const remainingTerms = a.terms.slice(1).map(t => t.clone(tracer));
        return new ENFOrdinal([leadingTermProduct, ...remainingTerms], tracer);
    }

    // a * b where b is infinite: (t1 + ...)*(s1 + ...) = (t1 * s1) + (t1 * s2) + ...
    // Note: this is distributive and requires addition.
    let result = new ENFOrdinal([], tracer);
    for (const termB of b.terms) {
        // product = a * termB
        // For infinite termB, a * termB = (a.terms[0] * termB)
        const productTerm = a.terms[0].multiply(termB);
        const product = new ENFOrdinal([productTerm], tracer);
        result = result.add(product);
    }
    return result;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createMultiplicationRules;
} else {
    // Browser global
    window.createMultiplicationRules = createMultiplicationRules;
}


