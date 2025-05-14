// ordinal_multiplication.js

// Assumes CNFOrdinal, EpsilonNaughtOrdinal, WTowerOrdinal classes and their helpers are defined.
// Assumes comparison, addition, and potentially other ops are defined.

/**
 * Multiplies this CNFOrdinal by another CNFOrdinal. ( α · β )
 * This is the specific implementation for CNF * CNF.
 */
CNFOrdinal.prototype.multiplyCNF = function(otherCNF) {
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

    // Case 0: Multiplication by zero
    if (this.isZero() || otherCNF.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer);
    }

    // Case 1: Multiplication by a finite number (other is n)
    if (otherCNF.isFinite()) {
        const n = otherCNF.getFinitePart();
        if (n === 0n) return CNFOrdinal.ZEROStatic().clone(this._tracer); // Should be caught by otherCNF.isZero but good check
        if (n === 1n) return this.clone();

        // Optimized multiplication by integer n
        if (this.isZero()) return CNFOrdinal.ZEROStatic().clone(this._tracer);

        const newTerms = this.terms.map(t => ({ // Deep clone terms for modification
            exponent: t.exponent.clone(this._tracer),
            coefficient: t.coefficient
        }));

        if (newTerms.length > 0) {
            // Multiply the coefficient of the leading term by n
            newTerms[0].coefficient *= n;
        }
        // The rest of the terms (delta part) remain unchanged if this was a sum a*m = (w^b*c * m) + delta
        // If this.terms.length was 1, newTerms also has length 1, and this logic is fine.

        const result = new CNFOrdinal(newTerms, this._tracer);
        // result._normalize(); // Normalization happens in constructor if an array is passed
        return result;
    }

    // General case: otherCNF is infinite or a sum involving infinite parts.
    // α · (β₁ + β₂ + ...) = α·β₁ + α·β₂ + ...
    // where βᵢ are terms of otherCNF like ω^e*k
    let totalSum = CNFOrdinal.ZEROStatic().clone(this._tracer);

    for (const betaTerm of otherCNF.terms) {
        let productTermResult;
        const alphaLimitPart = this.getLimitPart();
        const alphaFinitePartVal = this.getFinitePart();

        // betaTerm is of the form { exponent: CNFOrdinal, coefficient: BigInt }
        // Since otherCNF is not finite here, at least one betaTerm must have exponent > 0.

        if (!betaTerm.exponent.isZero()) { // Current term of β is ω^e*coeff (e > 0)
            if (alphaLimitPart.isZero()) { // α is finite n (n > 0 as α.isZero is handled)
                // n · (ω^e · k_β) = ω^e · k_β (where k_β is betaTerm.coefficient)
                productTermResult = new CNFOrdinal([{
                    exponent: betaTerm.exponent.clone(this._tracer),
                    coefficient: betaTerm.coefficient
                }], this._tracer);
            } else { // α is infinite A+n. (A+n) · (ω^e · k_β) = A · (ω^e · k_β)
                const leadingTerm_A_alpha = alphaLimitPart.getLeadingTerm();
                if (!leadingTerm_A_alpha) throw new Error("Infinite alphaLimitPart has no leading term in multiplication.");
                const alpha1_exp = leadingTerm_A_alpha.exponent;
                
                if (this._tracer) this._tracer.consume(); // for the + in alpha1+e
                const newExponent = alpha1_exp.add(betaTerm.exponent); // Ordinal addition for exponents

                productTermResult = new CNFOrdinal([{
                    exponent: newExponent,
                    coefficient: betaTerm.coefficient // Coefficient comes from betaTerm
                }], this._tracer);
            }
        } else { 
            // This case should not be reached if otherCNF is infinite, because otherCNF.isFinite() check
            // would have handled it. If otherCNF is a sum including a finite part, e.g. w+2, this term is the '2'.
            // Let betaTerm be k' (a finite number). α · k' needs to be handled by the sum property.
            // α·(X + k') = α·X + α·k'.
            // The term α·k' is α + α + ... + α (k' times).
            const k_prime_val = betaTerm.coefficient;
            let termResultForFiniteKPrime = CNFOrdinal.ZEROStatic().clone(this._tracer);
            for (let i = 0n; i < k_prime_val; i++) {
                if (this._tracer) this._tracer.consume();
                termResultForFiniteKPrime = termResultForFiniteKPrime.add(this);
            }
            productTermResult = termResultForFiniteKPrime;
        }
        if (this._tracer) this._tracer.consume(); // for the totalSum.add
        totalSum = totalSum.add(productTermResult); // Ordinal addition
    }
    return totalSum;
};

/**
 * Multiplies this EpsilonNaughtOrdinal by another ordinal.
 * This is the specific implementation for e_0 * other.
 */
EpsilonNaughtOrdinal.prototype.multiplyE0 = function(otherOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (otherOrdinal instanceof CNFOrdinal) {
        if (otherOrdinal.isZero()) return CNFOrdinal.ZEROStatic().clone(this._tracer); // e_0 * 0 = 0
        if (otherOrdinal.equals(CNFOrdinal.ONEStatic())) return this.clone(this._tracer); // e_0 * 1 = e_0
        throw new Error("e_0 * CNFOrdinal (where CNFOrdinal is not 0 or 1) is unsupported in this implementation.");
    }
    if (otherOrdinal instanceof EpsilonNaughtOrdinal) {
        throw new Error("e_0 * e_0 is unsupported in this implementation.");
    }
    throw new Error("EpsilonNaughtOrdinal.multiplyE0: Cannot multiply with unknown or unconverted ordinal type.");
};

/**
 * General ordinal multiplication dispatcher.
 */
function multiplyOrdinals(alpha, beta) {
    if (alpha instanceof WTowerOrdinal) alpha = alpha.toCNFOrdinal();
    if (beta instanceof WTowerOrdinal) beta = beta.toCNFOrdinal();

    if (alpha instanceof CNFOrdinal) {
        if (beta instanceof CNFOrdinal) return alpha.multiplyCNF(beta);
        if (beta instanceof EpsilonNaughtOrdinal) { // x * e_0
            if (alpha.isZero()) return CNFOrdinal.ZEROStatic().clone(alpha._tracer);
            return beta.clone(alpha._tracer); // e_0
        }
    } else if (alpha instanceof EpsilonNaughtOrdinal) { // e_0 * x
        return alpha.multiplyE0(beta);
    }
    throw new Error(`multiplyOrdinals: Unsupported ordinal types for multiplication: ${alpha?.constructor?.name} and ${beta?.constructor?.name}`);
}

// Public API for multiplication on prototypes
CNFOrdinal.prototype.multiply = function(otherOrdinal) {
    return multiplyOrdinals(this, otherOrdinal);
};
EpsilonNaughtOrdinal.prototype.multiply = function(otherOrdinal) {
    return multiplyOrdinals(this, otherOrdinal);
};
if (typeof WTowerOrdinal !== 'undefined') {
    WTowerOrdinal.prototype.multiply = function(otherOrdinal) {
        return multiplyOrdinals(this, otherOrdinal);
    };
}

// ordinal_multiplication.js