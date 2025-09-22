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

function powerENF(a, b) {
    const tracer = a._tracer || b._tracer || null;
    if (tracer) tracer.consume();
    
    // Trivial cases
    if (b.isZero()) return new ENFOrdinal([new ENFTerm([], 1n, tracer)], tracer);
    if (a.isZero()) return new ENFOrdinal([], tracer);
    if (a.isOne()) return new ENFOrdinal([new ENFTerm([], 1n, tracer)], tracer);
    if (b.isOne()) return a.clone(tracer);

    // Finite exponent -> exponentiation by squaring
    if (b.isFinite()) {
        let n = b.getFinitePart();
        let res = new ENFOrdinal([new ENFTerm([], 1n, tracer)], tracer);
        let temp_a = a.clone(tracer);
        while (n > 0n) {
            if (tracer) tracer.consume();
            if (n % 2n === 1n) res = res.multiply(temp_a);
            if (n > 1n) temp_a = temp_a.multiply(temp_a);
            n = n / 2n;
        }
        return res;
    }

    // Basic base case: a is omega or some epsilon e_a
    if (a.isBasic()) {
        const leading = a.terms[0];
        if (a.isOmega()) {
            // Special identity: ω^(ε_k) = ε_k
            if (b.isBasic() && b.isEpsilonNumber()) {
                return b.clone(tracer);
            }
            
            // If rank(b) > rank(a)=ω, use rank-based decomposition: b = k*X + r, return k^X * ω^r
            const rank_b = b.rank();
            if (OPERATIONS.compare(rank_b, a) > 0) {
                const k = rank_b;
                const { quotient: x, remainder: r } = b.ordinalDivision(k);
                // Build k^x
                let k_pow_x;
                if (k.isOmega()) {
                    // ω^x: create ENFFactor with base=ω and exponent=x
                    const omegaBase = new OmegaOrdinal(tracer);
                    const factor = new ENFFactor(omegaBase, x.clone(tracer));
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
                } else {
                    // k is epsilon: ε_t^x
                    const t = k.epsilonIndex();
                    const epsilonBase = new EpsilonNumber(t, tracer);
                    const factor = new ENFFactor(epsilonBase, x.clone(tracer));
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
                }
                const w_pow_r = powerENF(a, r);
                return k_pow_x.multiply(w_pow_r);
            }
            
            // If exponent splits as d + r with d = ε_k and r finite, use ω^(ε_k+r) = ε_k * ω^r
            const d = b.getLimitPart();
            const r = b.getFinitePart();
            if (!d.isZero() && d.isEpsilonNumber()) {
                const w_pow_r = r > 0n ? powerENF(a, new ENFOrdinal([new ENFTerm([], r, tracer)], tracer)) : new ENFOrdinal([new ENFTerm([], 1n, tracer)], tracer);
                return d.multiply(w_pow_r);
            }
            
            // General case: ω^b → ENFFactor with base=ω and exponent=b
            const omegaBase = new OmegaOrdinal(tracer);
            const factor = new ENFFactor(omegaBase, b.clone(tracer));
            return new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
        }
        
        if (a.isEpsilonNumber()) {
            // ε_(idx)^b
            const idx = a.epsilonIndex();
            // If exponent outranks base, decompose by rank(b)
            const rank_b = b.rank();
            if (OPERATIONS.compare(rank_b, a) > 0) {
                const k = rank_b;
                const { quotient: x, remainder: r } = b.ordinalDivision(k);
                // Build k^x
                let k_pow_x;
                if (k.isOmega()) {
                    const omegaBase = new OmegaOrdinal(tracer);
                    const factor = new ENFFactor(omegaBase, x.clone(tracer));
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
                } else {
                    const t = k.epsilonIndex();
                    const epsilonBase = new EpsilonNumber(t, tracer);
                    const factor = new ENFFactor(epsilonBase, x.clone(tracer));
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
                }
                const term_r = powerENF(a, r);
                return k_pow_x.multiply(term_r);
            }
            // ε_idx^b = ε_idx with exponent b
            const epsilonBase = new EpsilonNumber(idx, tracer);
            const factor = new ENFFactor(epsilonBase, b.clone(tracer));
            return new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
        }
    }

    // General rank-based decomposition
    const rank_a = a.rank();
    const rank_b = b.rank();

    // Case A: rank(b) > rank(a)
    if (OPERATIONS.compare(rank_b, rank_a) > 0) {
        const k = rank_b;
        const { quotient: x, remainder: r } = b.ordinalDivision(k);
        // Build k^x directly: if k = ω, create ω^x; if k=ε_t, create ε_t^x
        let k_pow_x;
        if (k.isOmega()) {
            const omegaBase = new OmegaOrdinal(tracer);
            const factor = new ENFFactor(omegaBase, x.clone(tracer));
            k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
        } else {
            // k is epsilon basic: extract its index t
            const t = k.epsilonIndex();
            const epsilonBase = new EpsilonNumber(t, tracer);
            const factor = new ENFFactor(epsilonBase, x.clone(tracer));
            k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
        }
        const term_r = powerENF(a, r);
        return k_pow_x.multiply(term_r);
    }
    // Case B: rank(b) <= rank(a)
    else {
        const k = rank_a;
        const c = a.log();
        const d = b.getLimitPart();
        const r = b.getFinitePart();
        const term_r = r > 0n ? powerENF(a, new ENFOrdinal([new ENFTerm([], r, tracer)], tracer)) : new ENFOrdinal([new ENFTerm([], 1n, tracer)], tracer);
        if (d.isZero()) {
            return term_r; // a^0 * a^r = a^r
        }
        const cd = c.multiply(d);
        // Build k^(c*d) directly
        let k_pow_cd;
        if (k.isOmega()) {
            const omegaBase = new OmegaOrdinal(tracer);
            const factor = new ENFFactor(omegaBase, cd.clone(tracer));
            k_pow_cd = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
        } else {
            const t = k.epsilonIndex();
            const epsilonBase = new EpsilonNumber(t, tracer);
            const factor = new ENFFactor(epsilonBase, cd.clone(tracer));
            k_pow_cd = new ENFOrdinal([new ENFTerm([factor], 1n, tracer)], tracer);
        }
        return k_pow_cd.multiply(term_r);
    }
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

        // w ^ WTower
        new Rule ('Omega ^ WTower',
            (a, b) => a.isOmega() && b instanceof WTowerOrdinal,
            (a, b) => {
                return new WTowerOrdinal(b.height + 1n, a._tracer || b._tracer || null);
            }),

        // e_k ^ EpsilonTower
        new Rule ('Epsilon ^ EpsilonTower',
            (a, b) => a.isEpsilonNumber() && b instanceof EpsilonTowerOrdinal && a.epsilonIndex().equals(b.baseIndex),
            (a, b) => {
                return new EpsilonTowerOrdinal(a.epsilonIndex(), b.height + 1n, a._tracer || b._tracer || null);
            }),

        // Prefer CNF path when both can convert to CNF (no extra type checks needed)
        new Rule('Convert to CNF when convertible',
            (a, b) => conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF');
                const bCNF = conversionEngine.convert(b, 'CNF');
                return powerCNF(aCNF, bCNF);
            }),

        // ZetaZero rules (lowest precedence)
        // z0^a is not implemented for a > 1
        new Rule('z0^a not implemented',
            (a, b) => (typeof ZetaZero !== 'undefined') && (a instanceof ZetaZero),
            () => { throw new Error('Exponentiation with z_0 on the left is not implemented'); }),

        // a^z0 = z0 (here a is known not to be z0 due to previous rule)
        new Rule('a^z0 = z0',
            (a, b) => (typeof ZetaZero !== 'undefined') && (b instanceof ZetaZero),
            (a, b) => b.clone(a._tracer || b._tracer || null)),

        // ENF fallback can be added later
        new Rule("Convert to ENF fallback",
            (a, b) => conversionEngine.canConvert(a, 'ENF') && conversionEngine.canConvert(b, 'ENF'),
            (a, b) => {
                const aENF = conversionEngine.convert(a, 'ENF');
                const bENF = conversionEngine.convert(b, 'ENF');
                return powerENF(aENF, bENF);
            })
    ];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createExponentiationRules;
} else {
    // Browser global
    window.createExponentiationRules = createExponentiationRules;
}


