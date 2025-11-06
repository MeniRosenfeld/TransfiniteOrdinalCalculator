/**
 * Backward compatibility wrappers for ordinal mapping functions.
 * 
 * This module provides the old JavaScript API (f, fInverse, etc.) as wrappers
 * around the new TypeScript typed implementations.
 * 
 * The old API uses OrdinalRepresentation objects and plain numbers.
 * The new API uses NumericValue<T> for type safety and interval arithmetic.
 */

import { fTyped, OrdinalRepresentation, ORDINAL_ZERO, ORDINAL_ONE } from './OrdinalMapping.js';
import { fInverseWrapper } from './OrdinalMappingInverse.js';
import { FParams } from './FParams.js';
import { DoubleContext } from './Contexts.js';
import { DoubleNumericValue } from './DoubleNumericValue.js';

/**
 * Default FParams instance using DoubleContext with scale 3 for all parameters.
 */
export const DEFAULT_F_PARAMS = FParams.default(new DoubleContext());

/**
 * Legacy FParams with scale 1 (OLD_F_PARAMS equivalent).
 * Note: The original test cases were written for scale 1, but the new default is 3.
 */
const doubleCtx = new DoubleContext();
export const OLD_F_PARAMS = FParams.uniform(doubleCtx, doubleCtx.fromNumber(1));

/**
 * Backward-compatible f function.
 * 
 * Computes the ordinal mapping f(α) for an ordinal α.
 * 
 * @param ordinal - Ordinal representation (bigint or structured object)
 * @param params - Function parameters (FParams)
 * @returns The mapped value as a plain number
 * 
 * @example
 * const result = f(5n, DEFAULT_F_PARAMS); // f(5)
 * const result2 = f({ type: "pow", k: 2n }, DEFAULT_F_PARAMS); // f(ω^2)
 */
export function f(
    ordinal: OrdinalRepresentation,
    params: FParams<DoubleNumericValue>
): number {
    const result = fTyped(ordinal, params);
    return result.toNumber();
}

/**
 * Backward-compatible fInverse function.
 * 
 * Computes the inverse ordinal mapping, finding α such that f(α) ≈ x.
 * 
 * @param x - Target value (plain number)
 * @param params - Function parameters (FParams)
 * @param threshold - Interval threshold for ambiguity resolution (default 1e-13)
 * @returns Ordinal representation
 * 
 * @example
 * const ord = fInverse(0.5, DEFAULT_F_PARAMS); // Returns 3n (since f(3) ≈ 0.5 with scale 3)
 * const ord2 = fInverse(1.0, DEFAULT_F_PARAMS); // Returns { type: "pow", k: 1n } (ω)
 */
export function fInverse(
    x: number,
    params: FParams<DoubleNumericValue>,
    threshold: number = 1e-14
): OrdinalRepresentation {
    return fInverseWrapper(x, params, threshold);
}

/**
 * Converts an OrdinalBase instance to OrdinalRepresentation format (f-format).
 * 
 * This uses the OrdinalBase.toFFormat() method if available, which converts
 * the ordinal to the structured representation expected by f().
 * 
 * @param ordinal - OrdinalBase instance
 * @returns OrdinalRepresentation
 */
export function convertOrdinalInstanceToFFormat(ordinal: any): OrdinalRepresentation {
    if (!ordinal) {
        throw new Error('convertOrdinalInstanceToFFormat: ordinal is null/undefined');
    }

    if (typeof ordinal.toFFormat === 'function') {
        return ordinal.toFFormat();
    }

    // Fallback: try to extract from the ordinal structure
    if (typeof ordinal === 'bigint') {
        return ordinal;
    }

    throw new Error(
        'convertOrdinalInstanceToFFormat: ordinal does not have toFFormat() method. ' +
        'Make sure OrdinalBase subclasses implement toFFormat().'
    );
}

/**
 * Converts an OrdinalRepresentation (f-format) back to an OrdinalBase instance.
 * 
 * This creates the appropriate OrdinalBase subclass instance from the
 * structured representation.
 * 
 * @param fFormat - OrdinalRepresentation
 * @returns OrdinalBase instance
 */
export function convertFFormatToOrdinalInstance(fFormat: OrdinalRepresentation): any {
    // We need to import ordinal types dynamically or have them passed in
    // For now, we'll use the window globals that should be available in the browser

    if (typeof window === 'undefined') {
        throw new Error('convertFFormatToOrdinalInstance: window is not defined. This function requires browser environment.');
    }

    const { FiniteOrdinal, CNFOrdinal, EpsilonNumber, WTowerOrdinal, OmegaOrdinal } = window as any;

    if (!FiniteOrdinal || !CNFOrdinal) {
        throw new Error('convertFFormatToOrdinalInstance: Required ordinal classes not available on window.');
    }

    // Recursive helper to convert nested representations
    function convert(rep: OrdinalRepresentation): any {
        // Finite ordinal
        if (typeof rep === 'bigint') {
            return new FiniteOrdinal(rep);
        }

        // Power: ω^k
        if (typeof rep === 'object' && rep !== null && rep.type === 'pow') {
            const k = convert(rep.k);
            // ω^k is represented as CNF with single term: ω^k * 1
            const terms = [{ exponent: k, coefficient: 1n }];
            return new CNFOrdinal(terms);
        }

        // Sum: ω^β * c + δ
        if (typeof rep === 'object' && rep !== null && rep.type === 'sum') {
            const beta = convert(rep.beta);
            const c = rep.c;
            const delta = convert(rep.delta);

            // Create CNF with the leading term
            const term = { exponent: beta, coefficient: c };

            // Add delta terms if non-zero
            if (delta && !delta.isZero()) {
                // Convert delta to CNF and merge terms
                const deltaCNF = delta.toCNF ? delta.toCNF() : delta;
                if (deltaCNF instanceof CNFOrdinal && deltaCNF.terms) {
                    const allTerms = [term, ...deltaCNF.terms];
                    return new CNFOrdinal(allTerms);
                } else {
                    // Delta is not CNF, use addition
                    const leadingOrdinal = new CNFOrdinal([term]);
                    return leadingOrdinal.add(delta);
                }
            }

            return new CNFOrdinal([term]);
        }

        // Epsilon number: ε_k
        if (typeof rep === 'object' && rep !== null && rep.type === 'epsilon') {
            const k = convert(rep.index);
            if (EpsilonNumber) {
                return new EpsilonNumber(k);
            }
            throw new Error('EpsilonNumber class not available');
        }

        // W-tower: ω↑↑h
        if (typeof rep === 'object' && rep !== null && rep.type === 'w_tower') {
            const h = rep.height;
            if (typeof h !== 'bigint') {
                throw new Error(`WTowerOrdinal height must be bigint, got ${typeof h}: ${String(h)}`);
            }
            if (WTowerOrdinal) {
                return new WTowerOrdinal(h);
            }
            throw new Error('WTowerOrdinal class not available');
        }

        // Legacy ε₀
        if (rep === 'E0_TYPE') {
            if (EpsilonNumber) {
                return new EpsilonNumber(new FiniteOrdinal(0n));
            }
            throw new Error('EpsilonNumber class not available for E0_TYPE');
        }

        throw new Error(`convertFFormatToOrdinalInstance: Unknown representation format: ${typeof rep === 'object' ? `type=${(rep as any)?.type}` : String(rep)}`);
    }

    return convert(fFormat);
}// Re-export for convenience
export { ORDINAL_ZERO, ORDINAL_ONE } from './OrdinalMapping.js';
export { FParams } from './FParams.js';
export type { OrdinalRepresentation } from './OrdinalMapping.js';
