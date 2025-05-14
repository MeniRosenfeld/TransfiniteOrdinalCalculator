// ordinal_tetration.js

// Assumes CNFOrdinal, EpsilonNaughtOrdinal, WTowerOrdinal classes and their helpers are defined.
// Assumes comparison, all arithmetic ops (add, multiply, power) are defined.

/**
 * Tetrates this CNFOrdinal by another CNFOrdinal. ( α ↑↑ β )
 * This is the specific implementation for CNFOrdinal ↑↑ CNFOrdinal.
 */
CNFOrdinal.prototype.tetrateCNF = function(heightCNF) {
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
        return new EpsilonNaughtOrdinal(this._tracer);
    }

    throw new Error(`Unhandled case in CNFOrdinal.tetrateCNF: base=${base.toStringCNF()}, height=${height.toStringCNF()}`);
};

/**
 * Tetrates this EpsilonNaughtOrdinal by another ordinal.
 * This is the specific implementation for e_0 ↑↑ other.
 */
EpsilonNaughtOrdinal.prototype.tetrateE0 = function(heightOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (heightOrdinal instanceof CNFOrdinal) {
        if (heightOrdinal.isZero()) return CNFOrdinal.ONEStatic().clone(this._tracer); // e_0^^0 = 1
        if (heightOrdinal.equals(CNFOrdinal.ONEStatic())) return this.clone(this._tracer); // e_0^^1 = e_0
        // e_0^^X where X is CNF and not 0 or 1 is unsupported.
        throw new Error(`Operation e_0 ^^ CNFOrdinal (${heightOrdinal.toStringCNF()}) is unsupported when CNFOrdinal is not 0 or 1.`);
    }
    if (heightOrdinal instanceof EpsilonNaughtOrdinal) {
        // e_0^^e_0 is unsupported
        throw new Error("Operation e_0 ^^ e_0 is unsupported.");
    }
    throw new Error("EpsilonNaughtOrdinal.tetrateE0: Cannot tetrate with unknown or unconverted ordinal type.");
};

/**
 * General ordinal tetration dispatcher.
 */
function tetrateOrdinals(base, height) {
    if (base instanceof WTowerOrdinal) base = base.toCNFOrdinal();
    if (height instanceof WTowerOrdinal) height = height.toCNFOrdinal();

    if (base instanceof CNFOrdinal) {
        if (height instanceof CNFOrdinal) return base.tetrateCNF(height);
        if (height instanceof EpsilonNaughtOrdinal) { // base_CNF ^^ e_0
            if (base.isZero()) throw new Error("Operation 0 ^^ e_0 is undefined.");
            if (base.equals(CNFOrdinal.ONEStatic())) return CNFOrdinal.ONEStatic().clone(base._tracer); // 1^^e_0 = 1
            if (base.isFinite() && base.getFinitePart() > 1n) return CNFOrdinal.OMEGAStatic().clone(base._tracer); // m^^e_0 = w (for m finite > 1)
            if (!base.isFinite()) return new EpsilonNaughtOrdinal(base._tracer); // a^^e_0 = e_0 (for a infinite CNF)
        }
    } else if (base instanceof EpsilonNaughtOrdinal) { // e_0 ^^ height
        return base.tetrateE0(height);
    }
    throw new Error(`tetrateOrdinals: Unsupported ordinal types for tetration: ${base?.constructor?.name} and ${height?.constructor?.name}`);
}

// Public API for tetration on prototypes
CNFOrdinal.prototype.tetrate = function(otherOrdinal) {
    return tetrateOrdinals(this, otherOrdinal);
};
EpsilonNaughtOrdinal.prototype.tetrate = function(otherOrdinal) {
    return tetrateOrdinals(this, otherOrdinal);
};
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.tetrate = function(otherOrdinal) {
        return tetrateOrdinals(this, otherOrdinal);
    };
}

// ordinal_tetration.js 