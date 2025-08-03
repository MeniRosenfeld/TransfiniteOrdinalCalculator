// ordinal_tetration.js

// Assumes CNFOrdinal, EpsilonOrdinal, WTowerOrdinal classes and their helpers are defined.
// Assumes comparison, all arithmetic ops (add, multiply, power) are defined.

/**
 * Tetrates this CNFOrdinal by another CNFOrdinal. ( α ↑↑ β )
 * This is the specific implementation for CNFOrdinal ↑↑ CNFOrdinal.
 */
CNFOrdinal.prototype.tetrateCNF = function (heightCNF) {
    if (!(heightCNF instanceof CNFOrdinal)) {
        throw new Error("Height must be a CNFOrdinal for tetrateCNF.");
    }
    if (this._tracer) this._tracer.consume();

    const base = this;
    const height = heightCNF;

    // Rule 1: β = 0  => α^^0 = 1 (for any α)
    if (height.isZero()) {
        return CNFOrdinal.ONEStatic().clone(this._tracer);
    }

    // Rule 2: β = 1 => α^^1 = α (for any α)
    if (height.equals(CNFOrdinal.ONEStatic())) {
        return base.clone();
    }

    // Rule 3: α = 0
    if (base.isZero()) {
        // 0^^β is 0 if β is odd finite, 1 if β is even finite and > 0.
        // 0^^β is undefined/error if β is infinite.
        if (height.isFinite()) {
            const hVal = height.getFinitePart();
            if (hVal % 2n === 1n) return CNFOrdinal.ZEROStatic().clone(this._tracer); // 0^^(odd) = 0
            else return CNFOrdinal.ONEStatic().clone(this._tracer); // 0^^(even>0) = 1
        } else {
            throw new Error(`Operation 0 ^^ CNFOrdinal (${height.toStringCNF()}) is undefined when CNFOrdinal is infinite.`);
        }
    }

    // Rule 4: α = 1 => 1^^β = 1 (for any β)
    if (base.equals(CNFOrdinal.ONEStatic())) {
        return CNFOrdinal.ONEStatic().clone(this._tracer);
    }

    // NEW Rule: Special handling for w^^n where n is finite integer > 10
    // This check should come before the general recursive rule for finite heights.
    // It applies only if the base is exactly omega.
    if (base.equals(CNFOrdinal.OMEGAStatic()) && height.isFinite()) {
        const n = height.getFinitePart(); // n is a BigInt
        if (n > 10n) { // Check if n > 10
            // WTowerOrdinal expects height as a Number.
            // We should ensure n is within Number.MAX_SAFE_INTEGER range for WTowerOrdinal height if it has such limits.
            // For now, assuming n will be reasonably small if it comes from user input or typical calculations.
            // If Number(n) could lose precision for very large n, a check or different WTowerOrdinal handling would be needed.
            try {
                const n_num = Number(n);
                if (n_num > Number.MAX_SAFE_INTEGER) {
                    console.warn(`WTowerOrdinal height ${n.toString()}n exceeds MAX_SAFE_INTEGER. Precision loss may occur or lead to issues if WTowerOrdinal expects standard Numbers for height.`);
                    // Decide if to proceed with potentially imprecise Number(n) or throw/fallback to CNF.
                    // For now, proceed, but this is a potential issue for extremely large n.
                }
                if (this._tracer) this._tracer.consume(); // For creating WTowerOrdinal
                return new WTowerOrdinal(n_num, this._tracer);
            } catch (e) {
                console.error("Error converting height to Number for WTowerOrdinal:", e);
                // Fallback to standard calculation if conversion fails, though it shouldn't for BigInts unless they are astronomically large.
            }
        }
        // If base is omega, height is finite, but height <= 10, it will fall through to Rule 5.
        // Heights 0 and 1 are already handled above.
    }

    // Rule 5: β is finite m > 1 (α is CNFOrdinal >= 2)
    // α^^m = α^(α^^(m-1))
    if (height.isFinite()) { // m > 1 because m=0 and m=1 are handled.
        const m = height.getFinitePart();
        if (m < 2n) throw new Error("Finite height < 2 should have been handled.");

        // Recursive calculation: base tetrated to (m-1)
        const mMinus1 = new CNFOrdinal(m - 1n, this._tracer);
        if (this._tracer) this._tracer.consume(); // for the recursive tetrate call
        const tetratedHeightPart = base.tetrate(mMinus1); // Call general dispatcher

        if (this._tracer) this._tracer.consume(); // for the power call
        return base.power(tetratedHeightPart); // Call general dispatcher
    }

    // Rule 6: β is infinite (height_inf), α = k (finite base >= 2)
    if (base.isFinite() && !height.isFinite()) { // α is k (finite >=2), height is infinite
        // k^^Inf = ω
        return CNFOrdinal.OMEGAStatic().clone(this._tracer);
    }

    // Rule 7: β is infinite (height_inf), α is infinite base
    if (!base.isFinite() && !height.isFinite()) {
        // Inf^^Inf = ε₀
        const height_pred = height.exponentPredecessor();
        if (height_pred) {
            // This is complex. The rule a^^(b+1) = a^(a^^b) is the general case.
            // For Inf^^Inf, it typically goes to the next fixed point.
            // w^^w = e_0.  w^^(w+1) = w^(w^^w) = w^(e_0) = e_0.
            // Heuristic: If height is a limit ordinal, result is e_0.
            // A better rule would involve finding the fixed point.
            // For now, Inf^^Inf -> e_0.
        }
        return EpsilonOrdinal.E_ZEROStatic().clone(this._tracer);
    }

    throw new Error(`Unhandled case in CNFOrdinal.tetrateCNF: base=${base.toStringCNF()}, height=${height.toStringCNF()}`);
};

/**
 * General ordinal tetration dispatcher.
 */
function tetrateOrdinals(base, height) {
    if (base._tracer) base._tracer.consume();

    // Convert all operands to CNFOrdinal to unify logic first.
    const baseCNF = (base instanceof CNFOrdinal) ? base : new CNFOrdinal(base, base._tracer);
    const heightCNF = (height instanceof CNFOrdinal) ? height : new CNFOrdinal(height, height._tracer);

    return baseCNF.tetrateCNF(heightCNF);
}

// Public API for tetration on prototypes
CNFOrdinal.prototype.tetrate = function (otherOrdinal) {
    return tetrateOrdinals(this, otherOrdinal);
};
EpsilonOrdinal.prototype.tetrate = function (otherOrdinal) {
    return tetrateOrdinals(this, otherOrdinal);
};
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.tetrate = function (otherOrdinal) {
        return tetrateOrdinals(this, otherOrdinal);
    };
} 