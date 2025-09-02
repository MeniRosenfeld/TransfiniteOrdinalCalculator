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
        const n = height.getFinitePart(); // BigInt
        // Always return a WTowerOrdinal for finite n>10
        if (n > 10n) {
            const n_num = Number(n);
            if (this._tracer) this._tracer.consume();
            return new WTowerOrdinal(n_num, this._tracer);
        }
        // For n==0,1: handled by earlier rules
    }

    // Rule 5: β is finite m > 1 (α is CNFOrdinal >= 2)
    // α^^m = α^(α^^(m-1))
    if (height.isFinite()) { // m > 1 because m=0 and m=1 are handled.
        const m = height.getFinitePart();
        if (m < 2n) throw new Error("Finite height < 2 should have been handled.");

        // Recursive calculation: base tetrated to (m-1)
        // Finite recursion replaced by iterative loop to avoid deep recursion
        let result = CNFOrdinal.ONEStatic().clone(this._tracer);
        let current = CNFOrdinal.ONEStatic().clone(this._tracer); // placeholder
        // Start from height 2: α^^2 = α^α
        result = base.clone();
        for (let k = 2n; k <= m; k++) {
            if (this._tracer) this._tracer.consume();
            current = result; // α^^(k-1)
            result = base.power(current);
        }
        return result;
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
    if (base && base._tracer) base._tracer.consume();

    // Helpers
    const toCNF = (ord) => {
        if (ord instanceof CNFOrdinal) return ord;
        if (typeof ENFOrdinal !== 'undefined' && ord instanceof ENFOrdinal) return ord.toCNFOrdinal();
        if (ord instanceof EpsilonOrdinal) return new CNFOrdinal(ord, ord._tracer || null);
        if (typeof WTowerOrdinal !== 'undefined' && ord instanceof WTowerOrdinal) return ord.toCNFOrdinal();
        if (typeof EpsilonTowerOrdinal !== 'undefined' && ord instanceof EpsilonTowerOrdinal) return ord.toCNFOrdinal();
        if (typeof ord === 'string') {
            const tr = new OperationTracer(100000);
            return new OrdinalParser(ord, tr).parse();
        }
        return new CNFOrdinal(ord, ord && ord._tracer);
    };
    const cnfHasEps = (cnf) => {
        // Prefer global helper if available
        if (typeof cnfHasEpsilonStructure === 'function') return cnfHasEpsilonStructure(cnf);
        for (const t of cnf.terms) if (t.exponent instanceof EpsilonOrdinal) return true;
        return false;
    };
    const power = (a, b) => powerOrdinals(a, b);

    // 0 ^^ n: even→1, odd→0; 0 ^^ (infinite) undefined
    if (base instanceof CNFOrdinal && base.isZero()) {
        const hCNF = toCNF(height);
        if (hCNF.isFinite()) {
            const n = hCNF.getFinitePart();
            if (n === 0n) return CNFOrdinal.ONEStatic().clone(base._tracer || null);
            return (n % 2n === 0n) ? CNFOrdinal.ONEStatic().clone(base._tracer || null) : CNFOrdinal.ZEROStatic().clone(base._tracer || null);
        }
        throw new Error(`Operation 0 ^^ ${hCNF.toStringCNF()} is undefined when CNFOrdinal is infinite.`);
    }

    // 1 ^^ k = 1
    if (base instanceof CNFOrdinal && base.equals(CNFOrdinal.ONEStatic())) {
        return CNFOrdinal.ONEStatic().clone(base._tracer || null);
    }

    // Finite base m≥2
    if (base instanceof CNFOrdinal && base.isFinite()) {
        const hCNF = toCNF(height);
        if (hCNF.isFinite()) {
            let n = hCNF.getFinitePart();
            if (n === 0n) return CNFOrdinal.ONEStatic().clone(base._tracer || null);
            let res = base.clone(); // m^^1
            for (let k = 2n; k <= n; k++) res = power(base, res);
            return res;
        }
        // m ^^ b = w for m>1
        return CNFOrdinal.OMEGAStatic().clone(base._tracer || null);
    }

    // Base is epsilon e_k OR any base ≥ e_0 represented in ENF
    if (base instanceof EpsilonOrdinal) {
        const hCNF = toCNF(height);
        if (hCNF.isFinite()) {
            const n = hCNF.getFinitePart();
            if (n === 0n) return CNFOrdinal.ONEStatic().clone(base._tracer || null);
            if (n > 10n) return new EpsilonTowerOrdinal(base.index.clone ? base.index.clone(base._tracer || null) : base.index, Number(n), base._tracer || null);
            // recursive for n ≤ 10: res = 1; repeat n times: res = e_k^res
            let res = CNFOrdinal.ONEStatic().clone(base._tracer || null);
            for (let i = 0; i < Number(n); i++) res = power(base, res);
            return res;
        }
        // Infinite height: base ≥ e_0 ⇒ next rank e_(k+1)
        if (typeof ENFOrdinal !== 'undefined') {
            const k_enf = ENFOrdinal.fromCNF(base.index);
            const k_plus_one_enf = k_enf.add(ENFOrdinal.one());
            const k_plus_one_cnf = k_plus_one_enf.toCNFOrdinal();
            return new EpsilonOrdinal(k_plus_one_cnf, base._tracer || null);
        }
        // Fallback
        return EpsilonOrdinal.E_ZEROStatic().clone(base._tracer || null);
    }

    if (typeof ENFOrdinal !== 'undefined' && base instanceof ENFOrdinal) {
        const hCNF = toCNF(height);
        if (hCNF.isFinite()) {
            // Use CNF recursion for finite heights
            return toCNF(base).tetrateCNF(hCNF);
        }
        // Infinite height: find largest epsilon index in ENF base
        let maxIdx = null;
        for (const term of base.terms) {
            if (!term.epsilonFactors) continue;
            for (const f of term.epsilonFactors) {
                const idx = f.base;
                if (maxIdx === null || idx.compareTo(maxIdx) > 0) maxIdx = idx.clone();
            }
        }
        if (maxIdx) {
            const idxPlusOne = maxIdx.add(ENFOrdinal.one());
            const idxPlusOneCNF = idxPlusOne.toCNFOrdinal();
            return new EpsilonOrdinal(idxPlusOneCNF, base._tracer || null);
        }
        // No epsilon factors -> treat as < e_0
        return EpsilonOrdinal.E_ZEROStatic().clone(base._tracer || null);
    }

    // General case for other bases
    const aCNF = toCNF(base);
    const hCNF = toCNF(height);

    if (hCNF.isFinite()) {
        // Finite height recursion handled by CNF method (includes ω threshold >10)
        return aCNF.tetrateCNF(hCNF);
    }

    // Infinite height:
    // If base has epsilon structure (≥ e_0), return e_(k+1) where k is the largest epsilon index appearing in a;
    // otherwise (< e_0) return e_0.
    if (typeof ENFOrdinal !== 'undefined') {
        const aENF = (base instanceof ENFOrdinal) ? base.clone() : ENFOrdinal.fromCNF(aCNF);
        let maxIdx = null;
        for (const term of aENF.terms) {
            if (!term.epsilonFactors) continue;
            for (const f of term.epsilonFactors) {
                const idx = f.base; // ENFOrdinal
                if (maxIdx === null || idx.compareTo(maxIdx) > 0) maxIdx = idx.clone();
            }
        }
        if (maxIdx !== null) {
            const idxPlusOne = maxIdx.add(ENFOrdinal.one());
            const idxPlusOneCNF = idxPlusOne.toCNFOrdinal();
            return new EpsilonOrdinal(idxPlusOneCNF, aCNF._tracer || null);
        }
        // No epsilon factors found → base < e_0
        return EpsilonOrdinal.E_ZEROStatic().clone(aCNF._tracer || null);
    }
    return EpsilonOrdinal.E_ZEROStatic().clone(aCNF._tracer || null);
}

// Public API for tetration on prototypes (central registry)
CNFOrdinal.prototype.tetrate = function (otherOrdinal) { return tetrateOrdinals(this, otherOrdinal); };
EpsilonOrdinal.prototype.tetrate = function (otherOrdinal) { return tetrateOrdinals(this, otherOrdinal); };
if (typeof WTowerOrdinal !== 'undefined') { WTowerOrdinal.prototype.tetrate = function (otherOrdinal) { return tetrateOrdinals(this, otherOrdinal); }; }
if (typeof ENFOrdinal !== 'undefined') { ENFOrdinal.prototype.tetrate = function (otherOrdinal) { return tetrateOrdinals(this, otherOrdinal); }; }
if (typeof EpsilonTowerOrdinal !== 'undefined') { EpsilonTowerOrdinal.prototype.tetrate = function (otherOrdinal) { return tetrateOrdinals(this, otherOrdinal); }; }
if (typeof EpsilonTowerOrdinal !== 'undefined') { EpsilonTowerOrdinal.prototype.tetrate = function (otherOrdinal) { return tetrateOrdinals(this, otherOrdinal); }; }