// ExponentiationRules.ts
// Rule definitions for ordinal exponentiation

import { OperationTracer } from '../OperationTracer.js';
import { Rule } from './RuleEngine.js';
import type { ConversionEngine } from '../conversions/ConversionEngine.js';
import { CNFOrdinal } from '../types/CNFOrdinal.js';
import { ENFOrdinal } from '../types/ENFOrdinal.js';
import { ENFTerm } from '../types/ENFTerm.js';
import { ENFFactor } from '../types/ENFFactor.js';
import { FiniteOrdinal } from '../types/FiniteOrdinal.js';
import { ZeroOrdinal } from '../types/ZeroOrdinal.js';
import { OneOrdinal } from '../types/OneOrdinal.js';
import { OmegaOrdinal } from '../types/OmegaOrdinal.js';
import { EpsilonNumber } from '../types/EpsilonNumber.js';
import { WTowerOrdinal } from '../types/WTowerOrdinal.js';
import { EpsilonTowerOrdinal } from '../types/EpsilonTowerOrdinal.js';
import { ZetaZero } from '../types/ZetaZero.js';

function powerFinite(a: any, b: any): any {
    const base = a.getFiniteBigInt();
    const exp = b.getFiniteBigInt();
    const result = base ** exp;
    return new FiniteOrdinal(result);
}

function buildLimitPart(cnf: any): any {
    if (!(cnf instanceof CNFOrdinal)) return new CNFOrdinal(0);
    if (cnf.isZero()) return new CNFOrdinal(0);
    const terms = cnf.terms;
    const resultTerms = [];
    OperationTracer.consume(terms.length || 0);
    for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        if (i === terms.length - 1 && t.exponent.isZero()) continue; // drop finite tail
        resultTerms.push({ exponent: t.exponent, coefficient: t.coefficient });
    }
    return new CNFOrdinal(resultTerms);
}

function powerCNF(a: any, b: any): any {
    // Port of legacy CNF power with available helpers
    if (b.isZero()) return CNFOrdinal.ONEStatic();
    if (a.isZero()) return CNFOrdinal.ZEROStatic();
    if (a.isOne()) return CNFOrdinal.ONEStatic();
    if (b.isOne()) return a;

    // Helper: exponentiation by squaring for CNF ordinals
    function powBySquaringCNF(baseCNF: any, expBigInt: bigint): any {
        let result: any = CNFOrdinal.ONEStatic();
        let base: any = baseCNF;
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
        OperationTracer.consume(loopCount);
        return result;
    }

    // Both finite handled by earlier rule, but safe-guard here too
    if (a.isFinite() && b.isFinite()) {
        const base = a.getFinitePart();
        const exp = b.getFinitePart();
        return new CNFOrdinal(base ** exp);
    }

    // Infinite base, finite exponent
    if (!a.isFinite() && b.isFinite()) {
        const m = b.getFinitePart();
        if (m === 0n) return CNFOrdinal.ONEStatic();

        // (ω^α)^m = ω^(α*m) when single term with coeff 1
        if (a.terms.length === 1 && a.terms[0].coefficient === 1n) {
            const alpha = a.terms[0].exponent;
            const mAsOrdinal = new CNFOrdinal(m);
            const newExp = alpha.multiply(mAsOrdinal); // multiply ordinals (rule engine)
            return new CNFOrdinal([{ exponent: newExp, coefficient: 1n }]);
        }

        // General case: use exponentiation by squaring
        return powBySquaringCNF(a, m);
    }

    // Infinite base, infinite exponent: α^B = ω^(α1*B_lim) * α^m
    if (!a.isFinite() && !b.isFinite()) {
        const mVal = b.getFinitePart();
        const B_lim = buildLimitPart(b);

        // α^m (finite power)
        let alphaPowM = CNFOrdinal.ONEStatic();
        if (mVal > 0n) {
            const mAsOrdinal = new CNFOrdinal(mVal);
            // Use repeated multiplication or the single-term fast path if available
            if (a.terms.length === 1 && a.terms[0].coefficient === 1n) {
                const alpha = a.terms[0].exponent;
                const newExp = alpha.multiply(mAsOrdinal);
                alphaPowM = new CNFOrdinal([{ exponent: newExp, coefficient: 1n }]);
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

function powerENF(a: any, b: any): any {
    OperationTracer.consume();

    // Trivial cases
    if (b.isZero()) return new ENFOrdinal([new ENFTerm([], 1n)]);
    if (a.isZero()) return new ENFOrdinal([]);
    if (a.isOne()) return new ENFOrdinal([new ENFTerm([], 1n)]);
    if (b.isOne()) return a;

    // Finite exponent -> exponentiation by squaring
    if (b.isFinite()) {
        let n = b.getFinitePart();
        let res = new ENFOrdinal([new ENFTerm([], 1n)]);
        let temp_a = a;
        while (n > 0n) {
            OperationTracer.consume();
            if (n % 2n === 1n) res = res.multiply(temp_a) as ENFOrdinal;
            if (n > 1n) temp_a = temp_a.multiply(temp_a) as ENFOrdinal;
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
                return b;
            }

            // If rank(b) > rank(a)=ω, use rank-based decomposition: b = k*X + r, return k^X * ω^r
            const rank_b = b.rank();
            if (window.OPERATIONS.compare(rank_b, a) > 0) {
                const k = rank_b;
                const { quotient: x, remainder: r } = b.ordinalDivision(k);
                // Build k^x
                let k_pow_x;
                if (k.isOmega()) {
                    // ω^x: create ENFFactor with base=ω and exponent=x
                    const omegaBase = new OmegaOrdinal();
                    const factor = new ENFFactor(omegaBase, x);
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n)]);
                } else {
                    // k is epsilon: ε_t^x
                    const t = k.epsilonIndex();
                    const epsilonBase = new EpsilonNumber(t);
                    const factor = new ENFFactor(epsilonBase, x);
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n)]);
                }
                const w_pow_r: any = powerENF(a, r);
                return k_pow_x.multiply(w_pow_r);
            }

            // If exponent splits as d + r with d = ε_k and r finite, use ω^(ε_k+r) = ε_k * ω^r
            const d = b.getLimitPart();
            const r = b.getFinitePart();
            if (!d.isZero() && d.isEpsilonNumber()) {
                const w_pow_r: any = r > 0n ? powerENF(a, new ENFOrdinal([new ENFTerm([], r)])) : new ENFOrdinal([new ENFTerm([], 1n)]);
                return d.multiply(w_pow_r);
            }

            // General case: ω^b → ENFFactor with base=ω and exponent=b
            const omegaBase = new OmegaOrdinal();
            const factor = new ENFFactor(omegaBase, b);
            return new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }

        if (a.isEpsilonNumber()) {
            // ε_(idx)^b
            const idx = a.epsilonIndex();
            // If exponent outranks base, decompose by rank(b)
            const rank_b = b.rank();
            if (window.OPERATIONS.compare(rank_b, a) > 0) {
                const k = rank_b;
                const { quotient: x, remainder: r } = b.ordinalDivision(k);
                // Build k^x
                let k_pow_x;
                if (k.isOmega()) {
                    const omegaBase = new OmegaOrdinal();
                    const factor = new ENFFactor(omegaBase, x);
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n)]);
                } else {
                    const t = k.epsilonIndex();
                    const epsilonBase = new EpsilonNumber(t);
                    const factor = new ENFFactor(epsilonBase, x);
                    k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n)]);
                }
                const term_r: any = powerENF(a, r);
                return k_pow_x.multiply(term_r);
            }
            // ε_idx^b = ε_idx with exponent b
            const epsilonBase = new EpsilonNumber(idx);
            const factor = new ENFFactor(epsilonBase, b);
            return new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }
    }

    // General rank-based decomposition
    const rank_a = a.rank();
    const rank_b = b.rank();

    // Case A: rank(b) > rank(a)
    if (window.OPERATIONS.compare(rank_b, rank_a) > 0) {
        const k = rank_b;
        const { quotient: x, remainder: r } = b.ordinalDivision(k);
        // Build k^x directly: if k = ω, create ω^x; if k=ε_t, create ε_t^x
        let k_pow_x;
        if (k.isOmega()) {
            const omegaBase = new OmegaOrdinal();
            const factor = new ENFFactor(omegaBase, x);
            k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n)]);
        } else {
            // k is epsilon basic: extract its index t
            const t = k.epsilonIndex();
            const epsilonBase = new EpsilonNumber(t);
            const factor = new ENFFactor(epsilonBase, x);
            k_pow_x = new ENFOrdinal([new ENFTerm([factor], 1n)]);
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
        const term_r = r > 0n ? powerENF(a, new ENFOrdinal([new ENFTerm([], r)])) : new ENFOrdinal([new ENFTerm([], 1n)]);
        if (d.isZero()) {
            return term_r; // a^0 * a^r = a^r
        }
        const cd = c.multiply(d);
        // Build k^(c*d) directly
        let k_pow_cd;
        if (k.isOmega()) {
            const omegaBase = new OmegaOrdinal();
            const factor = new ENFFactor(omegaBase, cd);
            k_pow_cd = new ENFOrdinal([new ENFTerm([factor], 1n)]);
        } else {
            const t = k.epsilonIndex();
            const epsilonBase = new EpsilonNumber(t);
            const factor = new ENFFactor(epsilonBase, cd);
            k_pow_cd = new ENFOrdinal([new ENFTerm([factor], 1n)]);
        }
        return k_pow_cd.multiply(term_r);
    }
}

export function createExponentiationRules(conversionEngine: ConversionEngine): Rule[] {
    return [
        // a ^ 0 = 1
        new Rule('a^0 = 1',
            (a, b) => b.isZero(),
            (a, b) => OneOrdinal.instance()),

        // 0 ^ a = 0 (a>0 is implied by previous rule)
        new Rule('0^a = 0',
            (a, b) => a.isZero(),
            (a, b) => ZeroOrdinal.instance()),

        // 1 ^ a = 1
        new Rule('1^a = 1',
            (a, b) => a.isOne(),
            (a, b) => OneOrdinal.instance()),

        // a ^ 1 = a
        new Rule('a^1 = a',
            (a, b) => b.isOne(),
            (a, b) => a),

        // Finite ^ finite
        new Rule('Finite ^ finite',
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => powerFinite(a, b)),

        // w ^ WTower
        new Rule('Omega ^ WTower',
            (a, b) => a.isOmega() && b instanceof WTowerOrdinal,
            (a, b) => new WTowerOrdinal((b as WTowerOrdinal).height + 1n)),

        // e_k ^ EpsilonTower
        new Rule('Epsilon ^ EpsilonTower',
            (a, b) => a.isEpsilonNumber() && b instanceof EpsilonTowerOrdinal && a.epsilonIndex().equals((b as EpsilonTowerOrdinal).baseIndex),
            (a, b) => new EpsilonTowerOrdinal(a.epsilonIndex(), (b as EpsilonTowerOrdinal).height + 1n)),

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
            (a, b) => (a instanceof ZetaZero),
            () => { throw new Error('Exponentiation with z_0 on the left is not implemented'); }),

        // a^z0 = z0 (here a is known not to be z0 due to previous rule)
        new Rule('a^z0 = z0',
            (a, b) => (b instanceof ZetaZero),
            (a, b) => b),

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
