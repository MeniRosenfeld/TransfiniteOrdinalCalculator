// ordinal_multiplication.js

// Assumes CNFOrdinal class, its helpers (isZero, isFinite, getLeadingTerm, getRest, etc.),
// CNFOrdinal.prototype.add, CNFOrdinal.prototype.compareTo are defined.
// Assumes EpsilonNaughtOrdinal class is defined.

/**
 * General ordinal multiplication function.
 * Dispatches to the correct multiplication method based on the types of the operands.
 * @param {Ordinal} alpha - The first ordinal.
 * @param {Ordinal} beta - The second ordinal.
 * @returns {Ordinal} The product of alpha and beta.
 */
function multiplyOrdinals(alpha, beta) {
    if (alpha instanceof EpsilonNaughtOrdinal) {
        if (beta instanceof EpsilonNaughtOrdinal) {
            // e_0 * e_0 is unsupported
            throw new Error("e_0 * e_0 is unsupported in this implementation.");
        } else if (beta instanceof CNFOrdinal) {
            // e_0 * x (where x is CNFOrdinal)
            if (beta.isZero()) return CNFOrdinal.ZEROStatic().clone(alpha._tracer); // e_0 * 0 = 0
            if (beta.equals(CNFOrdinal.ONEStatic())) return new EpsilonNaughtOrdinal(alpha._tracer); // e_0 * 1 = e_0
            // e_0 * m (m finite > 1) or e_0 * a (a infinite) are unsupported
            throw new Error("e_0 * CNFOrdinal (where CNFOrdinal is not 0 or 1) is unsupported in this implementation.");
        } else {
            throw new Error("Unsupported ordinal type for multiplication with EpsilonNaughtOrdinal.");
        }
    } else if (alpha instanceof CNFOrdinal) {
        if (beta instanceof EpsilonNaughtOrdinal) {
            // x * e_0 (where x is CNFOrdinal)
            if (alpha.isZero()) return CNFOrdinal.ZEROStatic().clone(alpha._tracer); // 0 * e_0 = 0
            // For any other CNFOrdinal x, x * e_0 = e_0
            return new EpsilonNaughtOrdinal(alpha._tracer);
        } else if (beta instanceof CNFOrdinal) {
            // CNFOrdinal * CNFOrdinal
            return alpha.multiplyCNF(beta); // Call the original CNF-specific multiplication
        } else {
            throw new Error("Unsupported ordinal type for multiplication with CNFOrdinal.");
        }
    } else {
        throw new Error("Unsupported first ordinal type for multiplication.");
    }
}

/**
 * Multiplies this ordinal by another ordinal. ( α · β )
 * Returns a new CNFOrdinal instance representing the product.
 * Implements accurate multiplication using right-distributivity:
 * α·β = α · (Σ β_i) = Σ (α · β_i), where β_i are terms of β.
 *
 * For each α · β_i:
 * Let α = A+n (A = limit part, n = finite part).
 * Let β_i = ω^e*k (an infinite term) OR β_i = k' (a finite term).
 *
 * Sub-rules for α · β_i:
 * 1. If β_i = ω^e*k (infinite term):
 *    (A+n) · (ω^e*k) = A · (ω^e*k)  (finite part 'n' of α is absorbed).
 *    If A = ω^α₁*c₁ + R_A (α₁ is leading exponent of A),
 *    Then A · (ω^e*k) = ω^(α₁+e)*k (coefficient c₁ and R_A of A are absorbed).
 *    If A = 0 (α is finite n): n · (ω^e*k) = ω^e*k (for n>0).
 *
 * 2. If β_i = k' (finite term, i.e., the finite part of β):
 *    (A+n) · k' :
 *      If A = 0 (α is finite n): n · k' (BigInt multiplication).
 *      If A ≠ 0 (α is infinite A+n): (A+n)·k' = A·k' + n·k' (distribute k' over A and n).
 *          A·k' = (ω^α₁*c₁ + R_A)·k' = ω^α₁*(c₁*k') + R_A  (k' multiplies only leading coeff of A).
 *          n·k' is BigInt multiplication.
 *          The sum (A·k') + (n·k') is ordinal addition.
 */
CNFOrdinal.prototype.multiplyCNF = function(otherOrdinal) {
    if (!(otherOrdinal instanceof CNFOrdinal)) {
        throw new Error("Cannot multiply CNFOrdinal with non-CNFOrdinal type.");
    }
    if (this._tracer) this._tracer.consume();

    // Case 1: α = 0 or β = 0
    if (this.isZero() || otherOrdinal.isZero()) {
        return CNFOrdinal.ZEROStatic().clone(this._tracer);
    }

    // Case 2: α = 1
    if (this.equals(CNFOrdinal.ONEStatic())) {
        return otherOrdinal.clone();
    }

    // Case 3: β = 1
    if (otherOrdinal.equals(CNFOrdinal.ONEStatic())) {
        return this.clone();
    }

    let totalSum = CNFOrdinal.ZEROStatic().clone(this._tracer);

    for (const betaTerm of otherOrdinal.terms) {
        let productTerm;

        const A_alpha = this.getLimitPart();
        const n_alpha_val = this.getFinitePart();

        if (!betaTerm.exponent.isZero()) {
            if (A_alpha.isZero()) {
                if (n_alpha_val === 0n) {
                    productTerm = CNFOrdinal.ZEROStatic().clone(this._tracer);
                } else {
                    productTerm = new CNFOrdinal([{
                        exponent: betaTerm.exponent.clone(this._tracer),
                        coefficient: betaTerm.coefficient
                    }], this._tracer);
                }
            } else {
                const leadingTerm_A_alpha = A_alpha.getLeadingTerm();
                const alpha1 = leadingTerm_A_alpha.exponent;

                if (this._tracer) this._tracer.consume();
                const newExponent = alpha1.add(betaTerm.exponent);

                productTerm = new CNFOrdinal([{
                    exponent: newExponent,
                    coefficient: betaTerm.coefficient
                }], this._tracer);
            }
       } else {
            const k_prime = betaTerm.coefficient;

            if (A_alpha.isZero()) {
                productTerm = new CNFOrdinal(n_alpha_val * k_prime, this._tracer);
            } else {
                const original_alpha_terms = this.terms.map(t => ({
                    exponent: t.exponent.clone(this._tracer),
                    coefficient: t.coefficient
                }));

                if (original_alpha_terms.length > 0) {
                    original_alpha_terms[0].coefficient *= k_prime;
                }
                productTerm = new CNFOrdinal(original_alpha_terms, this._tracer);
            }
        }
        
        if (this._tracer) this._tracer.consume();
        totalSum = totalSum.add(productTerm);
    }

    return totalSum;
};

// Add a general multiply method to CNFOrdinal prototype that calls the dispatcher
CNFOrdinal.prototype.multiply = function(otherOrdinal) {
    return multiplyOrdinals(this, otherOrdinal);
};

// Add a general multiply method to EpsilonNaughtOrdinal prototype that calls the dispatcher
EpsilonNaughtOrdinal.prototype.multiply = function(otherOrdinal) {
    return multiplyOrdinals(this, otherOrdinal);
};

// ordinal_multiplication.js