// MultiplicationRules.ts
// Rule definitions for ordinal multiplication

import { OperationTracer } from '../OperationTracer.js';
import { Rule } from './RuleEngine.js';
import type { ConversionEngine } from '../conversions/ConversionEngine.js';
import { CNFOrdinal } from '../types/CNFOrdinal.js';
import type { CNFTerm } from '../types/CNFOrdinal.js';
import { ENFOrdinal } from '../types/ENFOrdinal.js';
import { ENFTerm } from '../types/ENFTerm.js';
import { ENFFactor } from '../types/ENFFactor.js';
import type { OrdinalBase } from '../types/OrdinalBase.js';
import { FiniteOrdinal } from '../types/FiniteOrdinal.js';
import { ZetaZero } from '../types/ZetaZero.js';
import { getOperations } from './OperationsSingleton.js';


function multiplyFinite(a: OrdinalBase, b: OrdinalBase): FiniteOrdinal {
    const av = a.getFiniteBigInt();
    const bv = b.getFiniteBigInt();
    return new FiniteOrdinal(av * bv);
}

function buildLimitPart(cnf: CNFOrdinal): CNFOrdinal {
    if (!(cnf instanceof CNFOrdinal)) return new CNFOrdinal(0);
    if (cnf.isZero()) return new CNFOrdinal(0);
    const terms = cnf.terms;
    const resultTerms: CNFTerm[] = [];
    OperationTracer.consume(terms.length || 0);
    for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        // Skip finite last term (ω^0)
        if (i === terms.length - 1 && t.exponent.isZero()) continue;
        resultTerms.push({ exponent: t.exponent, coefficient: t.coefficient });
    }
    return new CNFOrdinal(resultTerms);
}

function multiplyCNF(a: CNFOrdinal, b: CNFOrdinal): CNFOrdinal {
    // Implements the legacy CNF * CNF algorithm, using rule-based add for exponents
    if (a.isZero() || b.isZero()) return CNFOrdinal.ZEROStatic();
    if (a.isOne()) return b;
    if (b.isOne()) return a;

    const a1_exp = a.terms[0].exponent;
    const n1_coeff = a.terms[0].coefficient;

    const b_limit_part = buildLimitPart(b);
    const m_finite_part = b.getFinitePart();

    const newTerms: CNFTerm[] = [];

    // sum over limit part: ω^{a1+bj} * mj
    OperationTracer.consume(b_limit_part.terms.length || 0);
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
        newTerms.push({ exponent: a1_exp, coefficient: n1_coeff * m_finite_part });
        // plus the tail of a (i >= 2)
        OperationTracer.consume(Math.max(0, a.terms.length - 1));
        for (let i = 1; i < a.terms.length; i++) {
            newTerms.push({ exponent: a.terms[i].exponent, coefficient: a.terms[i].coefficient });
        }
    }

    return new CNFOrdinal(newTerms);
}

function multiplyENFTerms(termA: ENFTerm, termB: ENFTerm): ENFTerm {
    // Multiply two ENFTerms with correct factor absorption
    // A * B: factors are absorbed by higher-ranked factors on the right
    // This implements ordinal multiplication's key property: only the "large" part of A survives

    const factorsA = termA.factors || [];
    const factorsB = termB.factors || [];
    const newFactors: ENFFactor[] = [];

    // If B is finite, just multiply coefficients and keep A's factors
    if (factorsB.length === 0) {
        return new ENFTerm(
            [...factorsA],
            BigInt(termA.coefficient) * BigInt(termB.coefficient)
        );
    }

    // Get the leading (highest-ranked) base from B
    const leadingBaseB = factorsB[0].base;

    // Keep only factors of A where base >= leading base of B
    let foundEqualBase = false;
    for (const factorA of factorsA) {
        const baseCmp = getOperations().compare(factorA.base, leadingBaseB);

        if (baseCmp > 0) {
            // Base of A > leading base of B: keep this factor
            newFactors.push(factorA);
        } else if (baseCmp === 0 && !foundEqualBase) {
            // Base of A = leading base of B: combine exponents
            const combinedExp = factorA.exponent.add(factorsB[0].exponent);
            newFactors.push(new ENFFactor(factorA.base, combinedExp));
            foundEqualBase = true;
            break;
        } else {
            // Base of A < leading base of B: all remaining factors will be absorbed
            // Since factors are sorted in descending order, we can break here
            break;
        }
    }

    // If we didn't find an equal base in A, add the leading factor of B
    if (!foundEqualBase) {
        newFactors.push(factorsB[0]);
    }

    // Append all remaining factors of B (after the leading one)
    for (let i = 1; i < factorsB.length; i++) {
        newFactors.push(factorsB[i]);
    }

    // Coefficient: use B's coefficient unless B is finite (then multiply)
    const newCoeff = (factorsB.length === 0) ?
        termA.coefficient * termB.coefficient :
        termB.coefficient;

    return new ENFTerm(newFactors, newCoeff);
}

export function createMultiplicationRules(conversionEngine: ConversionEngine): Rule[] {
    return [
        // Zero annihilators
        new Rule("Zero left",
            (a, b) => a.isZero(),
            (a, b) => a), // 0 * b = 0

        new Rule("Zero right",
            (a, b) => b.isZero(),
            (a, b) => b), // a * 0 = 0

        // One identities
        new Rule("One left",
            (a, b) => a.isOne(),
            (a, b) => b),

        new Rule("One right",
            (a, b) => b.isOne(),
            (a, b) => a),

        // Finite * finite
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => multiplyFinite(a, b)),

        // Finite * infinite = infinite (left finite)
        new Rule("Finite * infinite = infinite",
            (a, b) => a.isFinite(),
            (a, b) => {
                const n = a.getFiniteBigInt();
                const k = b.getFinitePart();
                return b.add(new FiniteOrdinal((n - 1n) * k));
            }),

        // ENFTerm * ENFTerm multiplication
        new Rule("ENFTerm * ENFTerm",
            (a, b) => (a instanceof ENFTerm) && (b instanceof ENFTerm),
            (a, b) => {
                return multiplyENFTerms(a as ENFTerm, b as ENFTerm);
            }),

        // Convert to CNF for < ε0 and use CNF multiplication
        new Rule("Convert to CNF for <ε₀",
            (a, b) => a.isLessThanEpsilon0() && b.isLessThanEpsilon0() &&
                conversionEngine.canConvert(a, 'CNF') && conversionEngine.canConvert(b, 'CNF'),
            (a, b) => {
                const aCNF = conversionEngine.convert(a, 'CNF') as CNFOrdinal;
                const bCNF = conversionEngine.convert(b, 'CNF') as CNFOrdinal;
                const res = multiplyCNF(aCNF, bCNF);
                return res;
            }),

        // ZetaZero rules (lowest precedence)
        // z0 * a is not implemented for a > 1
        new Rule("z0 * a not implemented",
            (a, b) => (a instanceof ZetaZero),
            () => { throw new Error('Multiplication with z_0 on the left is not implemented'); }),

        // a * z0 = z0 (here a is known not to be z0 due to previous rule)
        new Rule("a * z0 = z0",
            (a, b) => (b instanceof ZetaZero),
            (a, b) => b),

        // ENF fallback can be added later when ENF is migrated
        new Rule("Convert to ENF fallback",
            (a, b) => conversionEngine.canConvert(a, 'ENF') && conversionEngine.canConvert(b, 'ENF'),
            (a, b) => {
                const aENF = conversionEngine.convert(a, 'ENF') as ENFOrdinal;
                const bENF = conversionEngine.convert(b, 'ENF') as ENFOrdinal;
                return multiplyENF(aENF, bENF);
            })
    ];
}

function multiplyENF(a: ENFOrdinal, b: ENFOrdinal): ENFOrdinal {
    if (a.isZero() || b.isZero()) return new ENFOrdinal([]);

    // a * b where b is finite: (t1 + t2 + ...)*m = (t1*m) + t2 + ...
    if (b.isFinite()) {
        if (a.isFinite()) {
            return new ENFOrdinal([new ENFTerm([], BigInt(a.getFiniteBigInt()) * BigInt(b.getFiniteBigInt()))]);
        }
        // IMMUTABILITY FIX: Don't mutate existing term, create new one
        const leadingTerm = a.terms[0];
        const newLeadingTerm = new ENFTerm(
            [...leadingTerm.factors],
            BigInt(leadingTerm.coefficient) * BigInt(b.getFinitePart()) // New coefficient
        );
        const remainingTerms = a.terms.slice(1);
        return new ENFOrdinal([newLeadingTerm, ...remainingTerms]);
    }

    // a * b where b is infinite: (t1 + t2 + ...)*(s1 + s2 + ...) 
    // = (t1 * s1) + (t1 * s2) + ... + t2 + t3 + ...
    // Only the leading term of a gets multiplied; lower-order terms are preserved
    const resultTerms: ENFTerm[] = [];

    // Multiply leading term of a by each term of b
    for (const termB of b.terms) {
        const productTerm = multiplyENFTerms(a.terms[0], termB);
        resultTerms.push(productTerm);
    }

    // Add the finite part of b if it exists
    const bFinitePart = b.getFinitePart();
    if (bFinitePart > 0n) {
        // Add the lower-order terms of a (unmodified)
        for (let i = 1; i < a.terms.length; i++) {
            resultTerms.push(a.terms[i]);
        }
    }

    // Terms are already in decreasing order by construction, so create ENFOrdinal directly
    return new ENFOrdinal(resultTerms);
}
