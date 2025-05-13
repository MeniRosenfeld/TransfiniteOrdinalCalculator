// ordinal_tetration.js

// Assumes CNFOrdinal, EpsilonNaughtOrdinal classes and their helpers, comparison,
// all arithmetic operations (add, multiply, power) are defined.

/**
 * General ordinal tetration function.
 * Dispatches to the correct tetration method based on the types of the operands.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal} base - The base ordinal.
 * @param {CNFOrdinal | EpsilonNaughtOrdinal} height - The height ordinal for tetration.
 * @returns {CNFOrdinal | EpsilonNaughtOrdinal} The result of base tetrated to the height.
 */
function tetrateOrdinals(base, height) {
    if (!base || !height) {
        throw new Error("Tetration requires both a base and a height.");
    }
    if (base._tracer) base._tracer.consume(); // Count tetration as an operation

    // Rule: e_0^^0=1
    // Rule: e_0^^1=e_0
    // Rule: e_0^^m is unsupported (m CNF > 1)
    // Rule: e_0^^a is unsupported (a CNF infinite)
    // Rule: e_0^^e_0 is unsupported
    if (base instanceof EpsilonNaughtOrdinal) {
        if (height instanceof EpsilonNaughtOrdinal) {
            throw new Error("Operation e_0 ^^ e_0 is unsupported.");
        }
        if (height instanceof CNFOrdinal) {
            if (height.isZero()) return CNFOrdinal.ONEStatic().clone(base._tracer); // e_0^^0 = 1
            if (height.equals(CNFOrdinal.ONEStatic())) return new EpsilonNaughtOrdinal(base._tracer); // e_0^^1 = e_0
            // For any other CNFOrdinal height (finite m > 1, or infinite a)
            throw new Error(`Operation e_0 ^^ CNFOrdinal (${height.toStringCNF()}) is unsupported when CNFOrdinal is not 0 or 1.`);
        }
        throw new Error("Unsupported height type for EpsilonNaughtOrdinal base in tetration.");
    }

    // Rules for CNFOrdinal base:
    if (base instanceof CNFOrdinal) {
        // Rule: x^^0 = 1
        if (height instanceof CNFOrdinal && height.isZero()) {
            return CNFOrdinal.ONEStatic().clone(base._tracer);
        }
        // Rule: x^^1 = x
        if (height instanceof CNFOrdinal && height.equals(CNFOrdinal.ONEStatic())) {
            return base.clone();
        }

        // Rule: 0^^a is undefined (a CNF infinite)
        // Rule: 0^^e_0 is undefined
        if (base.isZero()) {
            if (height instanceof EpsilonNaughtOrdinal) {
                 throw new Error(`Operation 0 ^^ e_0 is undefined.`);
            }
            if (height instanceof CNFOrdinal && !height.isFinite()) {
                throw new Error(`Operation 0 ^^ CNFOrdinal (${height.toStringCNF()}) is undefined when CNFOrdinal is infinite.`);
            }
            // If height is CNF finite > 1, it will be handled by tetrateCNF's recursive rule for x^^m
        }

        // Rule: 1^^a=1 (a CNF infinite)
        // Rule: 1^^e_0=1
        if (base.equals(CNFOrdinal.ONEStatic())) {
            // This covers 1^^CNF (finite m, infinite a) and 1^^e_0
            return CNFOrdinal.ONEStatic().clone(base._tracer);
        }

        // Dispatch to CNF-specific tetration if height is CNF
        if (height instanceof CNFOrdinal) {
            return base.tetrateCNF(height); // Will handle x^^m for m > 1
        }

        // Rules for CNFOrdinal ^^ EpsilonNaughtOrdinal (height is e_0)
        // (0^^e_0 and 1^^e_0 were handled above)
        if (height instanceof EpsilonNaughtOrdinal) {
            if (base.isFinite() && base.compareTo(CNFOrdinal.ONEStatic()) > 0) { // m^^e_0=w (m finite CNF > 1)
                return CNFOrdinal.OMEGAStatic().clone(base._tracer);
            }
            if (!base.isFinite()) { // a^^e_0=e_0 (a infinite CNF)
                return new EpsilonNaughtOrdinal(base._tracer);
            }
        }
    }

    throw new Error(`Unhandled case in tetrateOrdinals: base=${base.constructor.name}, height=${height.constructor.name}`);
}


/**
 * Tetrates this CNFOrdinal by another CNFOrdinal. ( α ^^ β )
 * α, β are CNFOrdinals.
 * @param {CNFOrdinal} heightCNF The height ordinal (must be CNFOrdinal).
 * @returns {CNFOrdinal | EpsilonNaughtOrdinal} The result.
 */
CNFOrdinal.prototype.tetrateCNF = function(heightCNF) {
    if (!(heightCNF instanceof CNFOrdinal)) {
        throw new Error("Height for CNFOrdinal.tetrateCNF must be a CNFOrdinal.");
    }
    // Tracer consumption is handled by the main tetrateOrdinals dispatcher

    const base = this;

    // Cases x^^0 and x^^1 are handled by the main tetrateOrdinals dispatcher.
    // So, heightCNF here is guaranteed to be > 1 if finite, or infinite.

    // Rule: x^^m = x^(x^^(m-1)) (m finite CNF > 1, calculated recursively)
    if (heightCNF.isFinite()) {
        if (heightCNF.compareTo(CNFOrdinal.ONEStatic()) <= 0) {
             throw new Error("Internal error: tetrateCNF called with height <= 1, should be handled by dispatcher.");
        }
        // m-1
        const mMinus1 = new CNFOrdinal(heightCNF.getFinitePart() - 1n, this._tracer);
        if (this._tracer) this._tracer.consume(); // for the subtraction-like step
        
        // x^^(m-1)
        const recursionResult = base.tetrate(mMinus1); // Recursive call via general dispatcher

        if (this._tracer) this._tracer.consume(); // for the power operation
        return base.power(recursionResult); // x ^ (recursionResult)
    }

    // Height is infinite CNF (let's call it 'a')
    const infiniteHeightA = heightCNF;

    // Cases 0^^a and 1^^a are handled by the main tetrateOrdinals dispatcher.

    // Rule: m^^a=w (m finite CNF > 1, a CNF infinite)
    if (base.isFinite() && base.compareTo(CNFOrdinal.ONEStatic()) > 0) {
        return CNFOrdinal.OMEGAStatic().clone(this._tracer);
    }

    // Rule: b^^a=e_0 (b CNF infinite, a CNF infinite)
    if (!base.isFinite()) {
        return new EpsilonNaughtOrdinal(this._tracer);
    }

    throw new Error(`Unhandled case in CNFOrdinal.tetrateCNF: base=${base.toStringCNF()}, height=${heightCNF.toStringCNF()}`);
};

// Add a general tetrate method to CNFOrdinal prototype that calls the dispatcher
CNFOrdinal.prototype.tetrate = function(otherOrdinal) {
    return tetrateOrdinals(this, otherOrdinal);
};

// Add a general tetrate method to EpsilonNaughtOrdinal prototype that calls the dispatcher
EpsilonNaughtOrdinal.prototype.tetrate = function(otherOrdinal) {
    return tetrateOrdinals(this, otherOrdinal);
};

// ordinal_tetration.js 