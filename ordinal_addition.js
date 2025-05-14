// ordinal_addition.js

// Assumes CNFOrdinal, EpsilonNaughtOrdinal, WTowerOrdinal classes are defined.
// Assumes tetrateOrdinals (used by WTowerOrdinal.toCNFOrdinal) is defined.

/**
 * Adds a CNFOrdinal to this CNFOrdinal. ( α + β )
 * This is the specific implementation for CNF + CNF.
 */
CNFOrdinal.prototype.addCNF = function(otherCNF) {
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
 * Adds an ordinal to this EpsilonNaughtOrdinal.
 * This is the specific implementation for e_0 + other.
 */
EpsilonNaughtOrdinal.prototype.addE0 = function(otherOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (otherOrdinal instanceof CNFOrdinal) {
        if (otherOrdinal.isZero()) {
            // Rule: e_0 + 0 = e_0
            return this.clone(this._tracer);
        } else {
            // Rules: e_0 + non-zero CNFOrdinal is unsupported
            throw new Error(`Operation e_0 + non-zero CNFOrdinal (${otherOrdinal.toStringCNF()}) is unsupported.`);
        }
    }
    if (otherOrdinal instanceof EpsilonNaughtOrdinal) {
        // Rule: e_0 + e_0 is unsupported
        throw new Error("Operation e_0 + e_0 is unsupported.");
    }
    // WTowerOrdinal should have been converted by the dispatcher
    throw new Error("EpsilonNaughtOrdinal.addE0: Cannot add with unknown or unconverted ordinal type.");
};

/**
 * General ordinal addition dispatcher.
 * @param {Ordinal} alpha - The first ordinal.
 * @param {Ordinal} beta - The second ordinal.
 * @returns {Ordinal} The sum of alpha and beta.
 */
function addOrdinals(alpha, beta) {
    // Convert WTowerOrdinal to CNFOrdinal before proceeding
    if (alpha instanceof WTowerOrdinal) {
        alpha = alpha.toCNFOrdinal();
    }
    if (beta instanceof WTowerOrdinal) {
        beta = beta.toCNFOrdinal();
    }

    if (alpha instanceof CNFOrdinal) {
        if (beta instanceof CNFOrdinal) {
            return alpha.addCNF(beta);
        } else if (beta instanceof EpsilonNaughtOrdinal) {
            // x + e_0 = e_0
            return beta.clone(alpha._tracer); // effectively beta.addE0(alpha) but e_0 is absorbing
        }
    } else if (alpha instanceof EpsilonNaughtOrdinal) {
        // e_0 + x
        return alpha.addE0(beta); // beta can be CNFOrdinal or EpsilonNaughtOrdinal
    }
    throw new Error(`addOrdinals: Unsupported ordinal types for addition: ${alpha?.constructor?.name} and ${beta?.constructor?.name}`);
}

// Public API for addition on prototypes, calling the dispatcher
CNFOrdinal.prototype.add = function(otherOrdinal) {
    return addOrdinals(this, otherOrdinal);
};

EpsilonNaughtOrdinal.prototype.add = function(otherOrdinal) {
    return addOrdinals(this, otherOrdinal);
};

// WTowerOrdinal.prototype.add will also call addOrdinals
// This will be added in ordinal_types.js or here. For consistency, let's add it here.
if (typeof WTowerOrdinal !== 'undefined') { // Check if WTowerOrdinal is loaded
    WTowerOrdinal.prototype.add = function(otherOrdinal) {
        return addOrdinals(this, otherOrdinal);
    };
}

// ordinal_addition.js