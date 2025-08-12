// ordinal_multiplication.js

// Assumes CNFOrdinal, EpsilonOrdinal, WTowerOrdinal classes and their helpers are defined.
// Assumes comparison, addition, and potentially other ops are defined.

/**
 * Multiplies this CNFOrdinal by another CNFOrdinal. ( α · β )
 * This is the specific implementation for CNF * CNF.
 */
CNFOrdinal.prototype.multiplyCNF = function (otherCNF) {
    if (!(otherCNF instanceof CNFOrdinal)) {
        throw new Error("Cannot multiply CNFOrdinal with non-CNFOrdinal type for multiplyCNF.");
    }
    if (this._tracer) this._tracer.consume();

    if (this.isZero() || otherCNF.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer);
    }
    if (this.equals(CNFOrdinal.ONEStatic())) {
        return otherCNF.clone();
    }
    if (otherCNF.equals(CNFOrdinal.ONEStatic())) {
        return this.clone();
    }

    const a = this;
    const b = otherCNF;

    // From Libor Behounek's Ordinal Calculator paper (Theorem 3)
    // a = sum{i=1..k} omega^{ai}*ni
    // b = sum{j=1..q-1} omega^{bj}*mj + m

    const a1_exp = a.terms[0].exponent;
    const n1_coeff = a.terms[0].coefficient;

    const b_limit_part = b.getLimitPart();
    const m_finite_part = b.getFinitePart();

    const newTerms = [];

    // sum{j=1..q-1} omega^{a1+bj}*mj
    for (const term_b of b_limit_part.terms) {
        const bj_exp = term_b.exponent;
        const mj_coeff = term_b.coefficient;
        // Ensure exponent addition stays in CNF space
        const aExpCNF = (a1_exp instanceof CNFOrdinal) ? a1_exp : new CNFOrdinal(a1_exp, this._tracer);
        const bExpCNF = (bj_exp instanceof CNFOrdinal) ? bj_exp : new CNFOrdinal(bj_exp, this._tracer);
        const new_exp = aExpCNF.addCNF(bExpCNF);
        newTerms.push({ exponent: new_exp, coefficient: mj_coeff });
    }

    if (m_finite_part > 0n) {
        // omega^{a1}*n1*m
        newTerms.push({ exponent: a1_exp.clone(), coefficient: n1_coeff * m_finite_part });
        // sum{i=2..k} omega^{ai}*ni
        for (let i = 1; i < a.terms.length; i++) {
            newTerms.push({ exponent: a.terms[i].exponent.clone(), coefficient: a.terms[i].coefficient });
        }
    }

    return new CNFOrdinal(newTerms, this._tracer);
};

/**
 * General ordinal multiplication dispatcher.
 */
function _ensureCNF_mult(x) {
    if (x instanceof CNFOrdinal) return x;
    if (typeof ENFOrdinal !== 'undefined' && x instanceof ENFOrdinal) return x.toCNFOrdinal();
    if (x instanceof EpsilonOrdinal) return new CNFOrdinal(x, x._tracer || null);
    if (typeof WTowerOrdinal !== 'undefined' && x instanceof WTowerOrdinal) return x.toCNFOrdinal();
    if (typeof x === 'string') {
        const tracer = new OperationTracer(10000);
        return new OrdinalParser(x, tracer).parse();
    }
    throw new Error("multiplyOrdinals: unsupported operand type");
}

function _hasEpsilon(x) {
    if (typeof ENFOrdinal !== 'undefined' && x instanceof ENFOrdinal) return true;
    if (x instanceof EpsilonOrdinal) return true;
    if (x instanceof CNFOrdinal) {
        return x.terms.some(t => (t.exponent instanceof EpsilonOrdinal));
    }
    return false;
}

function multiplyOrdinals(alpha, beta) {
    if (alpha._tracer) alpha._tracer.consume();

    // Handle identity cases first.
    if (alpha.isZero() || beta.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(alpha._tracer || beta._tracer);
    }
    if (alpha.equals(CNFOrdinal.ONEStatic())) {
        return beta.clone();
    }
    if (beta.equals(CNFOrdinal.ONEStatic())) {
        return alpha.clone();
    }

    // If either operand involves epsilon numbers, prefer ENF multiplication
    if (_hasEpsilon(alpha) || _hasEpsilon(beta)) {
        const aENF = (typeof ENFOrdinal !== 'undefined' && alpha instanceof ENFOrdinal) ? alpha : ENFOrdinal.fromCNF(alpha);
        const bENF = (typeof ENFOrdinal !== 'undefined' && beta instanceof ENFOrdinal) ? beta : ENFOrdinal.fromCNF(beta);
        return aENF.multiply(bENF);
    }

    // Otherwise CNF multiplication
    const alphaCNF = _ensureCNF_mult(alpha);
    const betaCNF = _ensureCNF_mult(beta);
    return alphaCNF.multiplyCNF(betaCNF);
}

// Public API for multiplication on prototypes
CNFOrdinal.prototype.multiply = function (otherOrdinal) {
    return multiplyOrdinals(this, otherOrdinal);
};
EpsilonOrdinal.prototype.multiply = function (otherOrdinal) {
    return multiplyOrdinals(this, otherOrdinal);
};
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.multiply = function (otherOrdinal) {
        return multiplyOrdinals(this, otherOrdinal);
    };
}