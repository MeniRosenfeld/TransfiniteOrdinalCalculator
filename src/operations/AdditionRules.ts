// AdditionRules.js
// Rule definitions for ordinal addition

import { OperationTracer } from '../OperationTracer.js';
import { Rule } from './RuleEngine.js';
import { ConversionEngine } from '../conversions/ConversionEngine.js';
import { CNFOrdinal } from '../types/CNFOrdinal.js';
import { ENFOrdinal } from '../types/ENFOrdinal.js';
import { ENFTerm } from '../types/ENFTerm.js';
import { FiniteOrdinal } from '../types/FiniteOrdinal.js';
import { ZetaZero } from '../types/ZetaZero.js';

// Addition-specific implementations
function addCNF(a: any, b: any): any {
    // CNF-specific addition algorithm (extracted from CNFOrdinal.prototype.addCNF)
    OperationTracer.consume();
    // Case 1: b is 0
    if (b.isZero()) {
        return a;
    }

    // Case 2: a is 0
    if (a.isZero()) {
        return b;
    }

    // Case 3: a is finite, b is infinite
    if (a.isFinite() && !b.isFinite()) {
        return b;
    }

    // Case 4: a is infinite, b is finite
    if (!a.isFinite() && b.isFinite()) {
        OperationTracer.consume(a.terms.length || 0);
        const newTerms = a.terms.map((t: any) => ({
            exponent: t.exponent,
            coefficient: t.coefficient
        }));
        const aFinitePart = a.getFinitePart();
        const bFinitePart = b.getFinitePart();
        const combinedFinitePart = aFinitePart + bFinitePart;

        if (aFinitePart > 0n) {
            // IMMUTABILITY FIX: Don't mutate existing term, create new one
            const lastTerm = newTerms[newTerms.length - 1];
            newTerms[newTerms.length - 1] = {
                exponent: lastTerm.exponent,
                coefficient: combinedFinitePart
            };
        } else if (combinedFinitePart > 0n) {
            newTerms.push({ exponent: CNFOrdinal.ZEROStatic(), coefficient: combinedFinitePart });
        }
        return new CNFOrdinal(newTerms);
    }

    // Case 5: a is finite, b is finite (both non-zero)
    if (a.isFinite() && b.isFinite()) {
        return new CNFOrdinal(a.getFinitePart() + b.getFinitePart());
    }

    // Case 6: Both a and b are infinite - core CNF addition logic
    const firstTermOther = b.terms[0];
    const firstExpOther = firstTermOther.exponent;

    const newTermsResult = [];
    let i = 0;

    // Copy terms from a whose exponents are greater than the leading exponent of b
    OperationTracer.consume(a.terms.length || 0);
    while (i < a.terms.length && a.terms[i].exponent.compareTo(firstExpOther) > 0) {
        newTermsResult.push(a.terms[i]);
        i++;
    }

    if (i < a.terms.length && a.terms[i].exponent.equals(firstExpOther)) {
        // Exponents are equal: add coefficients and take the rest of b
        newTermsResult.push({
            exponent: a.terms[i].exponent,
            coefficient: a.terms[i].coefficient + firstTermOther.coefficient
        });
        // Add remaining terms from b
        OperationTracer.consume(Math.max(0, (b.terms.length - 1)));
        for (let j = 1; j < b.terms.length; j++) {
            newTermsResult.push(b.terms[j]);
        }
    } else {
        // All remaining exponents in a are smaller than firstExpOther,
        // or a has no more terms. So, all terms of b are appended.
        OperationTracer.consume(b.terms.length || 0);
        for (let j = 0; j < b.terms.length; j++) {
            newTermsResult.push(b.terms[j]);
        }
    }
    return new CNFOrdinal(newTermsResult);
}

function addENF(a: any, b: any): any {
    // ENF-specific addition algorithm (extracted from ENFOrdinal.prototype.add)
    if (a.isZero()) return b;
    if (b.isZero()) return a;

    const b1 = b.terms[0];
    const newTerms = [];
    let k = -1;

    OperationTracer.consume(a.terms.length || 0);
    for (let i = 0; i < a.terms.length; i++) {
        if (a.terms[i].compareStructureTo(b1) <= 0) {
            k = i;
            break;
        }
        newTerms.push(a.terms[i]);
    }

    if (k === -1) {
        return new ENFOrdinal(newTerms.concat(b.terms.map((t: any) => t)));
    }

    const ak = a.terms[k];
    if (ak.compareStructureTo(b1) < 0) {
        return new ENFOrdinal(newTerms.concat(b.terms.map((t: any) => t)));
    }

    if (ak.compareStructureTo(b1) === 0) {
        // IMMUTABILITY FIX: Don't mutate existing term, create new one
        const newJunctionTerm = new ENFTerm(
            ak.factors,
            ak.coefficient + b1.coefficient  // Combined coefficient
        );
        newTerms.push(newJunctionTerm);
        const restOfBeta = b.terms.slice(1).map((t: any) => t); // Clone remaining terms
        return new ENFOrdinal(newTerms.concat(restOfBeta));
    }
    return new ENFOrdinal(newTerms.concat(b.terms.map((t: any) => t)));
}

function addFinite(a: any, b: any): any {
    // Simple finite addition
    const aVal = a.getFiniteBigInt();
    const bVal = b.getFiniteBigInt();
    return new FiniteOrdinal(aVal + bVal);
}

/**
 * Creates the complete set of addition rules in priority order.
 */
export function createAdditionRules(conversionEngine: ConversionEngine): Rule[] {
    return [
        // Identity rules (highest precedence)
        new Rule("Zero left identity",
            (a, b) => a.isZero(),
            (a, b) => b),

        new Rule("Zero right identity",
            (a, b) => b.isZero(),
            (a, b) => a),

        // Finite arithmetic
        new Rule("Both finite",
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => addFinite(a, b)),

        // Finite + infinite => infinite (left finite)
        new Rule("Finite + infinite = infinite",
            (a, b) => a.isFinite() && !b.isFinite(),
            (a, b) => b),

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
            (a, b) => (a instanceof ZetaZero),
            (a, b) => { throw new Error('Addition with z_0 on the left is not implemented'); }),

        // a + z0 = z0 (here a is known not to be z0 due to previous rule)
        new Rule("a + z0 = z0",
            (a, b) => (b instanceof ZetaZero),
            (a, b) => b)
    ];
}
