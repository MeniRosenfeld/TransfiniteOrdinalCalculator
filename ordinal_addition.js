// ordinal_addition.js

// Assumes CNFOrdinal, EpsilonOrdinal, WTowerOrdinal classes are defined.
// Assumes tetrateOrdinals (used by WTowerOrdinal.toCNFOrdinal) is defined.

/**
 * Adds a CNFOrdinal to this CNFOrdinal. ( α + β )
 * This is the specific implementation for CNF + CNF.
 */
CNFOrdinal.prototype.addCNF = function (otherCNF) {
    if (this._tracer) this._tracer.consume();

    if (!(otherCNF instanceof CNFOrdinal)) {
        throw new Error("CNFOrdinal.addCNF: Argument must be a CNFOrdinal.");
    }

    // Case 1: otherCNF is 0
    if (otherCNF.isZero()) {
        return this.clone();
    }

    // Case 2: this ordinal is 0
    if (this.isZero()) {
        return otherCNF.clone();
    }

    // Case 3: `this` is finite, `otherCNF` is infinite
    if (this.isFinite() && !otherCNF.isFinite()) {
        return otherCNF.clone();
    }

    // Case 4: `this` is infinite, `otherCNF` is finite
    if (!this.isFinite() && otherCNF.isFinite()) {
        const newTerms = this.terms.map(t => ({
            exponent: t.exponent.clone(this._tracer),
            coefficient: t.coefficient
        }));
        const thisFinitePart = this.getFinitePart();
        const otherFinitePart = otherCNF.getFinitePart();
        const combinedFinitePart = thisFinitePart + otherFinitePart;

        if (thisFinitePart > 0n) {
            newTerms[newTerms.length - 1].coefficient = combinedFinitePart;
            if (combinedFinitePart === 0n && newTerms[newTerms.length - 1].exponent.isZero()) { // only pop if it was the finite term
                newTerms.pop();
            }
        } else if (combinedFinitePart > 0n) {
            newTerms.push({ exponent: CNFOrdinal.ZEROStatic().clone(this._tracer), coefficient: combinedFinitePart });
        }
        return new CNFOrdinal(newTerms, this._tracer);
    }

    // Case 5: `this` is finite, `otherCNF` is finite (both non-zero)
    if (this.isFinite() && otherCNF.isFinite()) {
        return new CNFOrdinal(this.getFinitePart() + otherCNF.getFinitePart(), this._tracer);
    }

    // Case 6: Both `this` and `otherCNF` are infinite. This is the core CNF addition logic.
    const firstTermOther = otherCNF.terms[0];
    const firstExpOther = firstTermOther.exponent;

    const newTermsResult = [];
    let i = 0;

    // Copy terms from `this` whose exponents are greater than the leading exponent of `otherCNF`
    while (i < this.terms.length && this.terms[i].exponent.compareTo(firstExpOther) > 0) {
        newTermsResult.push({
            exponent: this.terms[i].exponent.clone(this._tracer),
            coefficient: this.terms[i].coefficient
        });
        i++;
    }

    if (i < this.terms.length && this.terms[i].exponent.equals(firstExpOther)) {
        // Exponents are equal: add coefficients and take the rest of `otherCNF`
        newTermsResult.push({
            exponent: this.terms[i].exponent.clone(this._tracer),
            coefficient: this.terms[i].coefficient + firstTermOther.coefficient
        });
        // Add remaining terms from otherCNF
        for (let j = 1; j < otherCNF.terms.length; j++) {
            newTermsResult.push({
                exponent: otherCNF.terms[j].exponent.clone(this._tracer),
                coefficient: otherCNF.terms[j].coefficient
            });
        }
    } else {
        // All remaining exponents in `this` are smaller than `firstExpOther`,
        // or `this` has no more terms.
        // So, all terms of `otherCNF` are appended.
        for (let j = 0; j < otherCNF.terms.length; j++) {
            newTermsResult.push({
                exponent: otherCNF.terms[j].exponent.clone(this._tracer),
                coefficient: otherCNF.terms[j].coefficient
            });
        }
    }
    return new CNFOrdinal(newTermsResult, this._tracer);
};

/**
 * General ordinal addition dispatcher.
 * @param {Ordinal} alpha - The first ordinal.
 * @param {Ordinal} beta - The second ordinal.
 * @returns {Ordinal} The sum of alpha and beta.
 */
function _ensureCNF(x) {
    if (x instanceof CNFOrdinal) return x;
    if (typeof ENFOrdinal !== 'undefined' && x instanceof ENFOrdinal) return x.toCNFOrdinal();
    if (x instanceof EpsilonOrdinal) return new CNFOrdinal(x, x._tracer || null);
    if (typeof WTowerOrdinal !== 'undefined' && x instanceof WTowerOrdinal) return x.toCNFOrdinal();
    if (typeof x === 'string') {
        const tracer = new OperationTracer(10000);
        return new OrdinalParser(x, tracer).parse();
    }
    throw new Error("addOrdinals: unsupported operand type");
}

function addOrdinals(alpha, beta) {
    if (alpha._tracer) alpha._tracer.consume();

    // Handle identity cases first to preserve canonical types.
    if (alpha.isZero()) {
        return beta.clone();
    }
    if (beta.isZero()) {
        return alpha.clone();
    }

    // Prefer ENF for any expressions involving epsilon numbers to preserve structure
    const involvesENF = (typeof ENFOrdinal !== 'undefined' && (alpha instanceof ENFOrdinal || beta instanceof ENFOrdinal))
        || (alpha instanceof EpsilonOrdinal) || (beta instanceof EpsilonOrdinal);

    if (involvesENF) {
        const aENF = (alpha instanceof ENFOrdinal) ? alpha : ENFOrdinal.fromCNF(alpha);
        const bENF = (beta instanceof ENFOrdinal) ? beta : ENFOrdinal.fromCNF(beta);
        return aENF.add(bENF);
    }

    // Otherwise, use CNF addition
    const alphaCNF = _ensureCNF(alpha);
    const betaCNF = _ensureCNF(beta);
    return alphaCNF.addCNF(betaCNF);
}

// Public API for addition on prototypes, calling the dispatcher
CNFOrdinal.prototype.add = function (otherOrdinal) {
    return addOrdinals(this, otherOrdinal);
};

EpsilonOrdinal.prototype.add = function (otherOrdinal) {
    return addOrdinals(this, otherOrdinal);
};

// WTowerOrdinal.prototype.add will also call addOrdinals
if (typeof WTowerOrdinal !== 'undefined') { // Check if WTowerOrdinal is loaded
    WTowerOrdinal.prototype.add = function (otherOrdinal) {
        return addOrdinals(this, otherOrdinal);
    };
}