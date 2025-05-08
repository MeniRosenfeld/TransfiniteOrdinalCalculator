// ordinal_multiplication.js

// Assumes Ordinal class, its helpers (isZero, isFinite, getLeadingTerm, getRest, etc.),
// Ordinal.prototype.add, Ordinal.prototype.compareTo are defined.

/**
 * Multiplies this ordinal by another ordinal. ( α · β )
 * Returns a new Ordinal instance representing the product.
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
 *      If A = 0 (α is finite n): n · k' (integer multiplication).
 *      If A ≠ 0 (α is infinite A+n): (A+n)·k' = A·k' + n·k' (distribute k' over A and n).
 *          A·k' = (ω^α₁*c₁ + R_A)·k' = ω^α₁*(c₁*k') + R_A  (k' multiplies only leading coeff of A).
 *          n·k' is integer multiplication.
 *          The sum (A·k') + (n·k') is ordinal addition.
 */
Ordinal.prototype.multiply = function(otherOrdinal) {
    if (!(otherOrdinal instanceof Ordinal)) {
        throw new Error("Cannot multiply Ordinal with non-Ordinal type.");
    }
    if (this._tracer) this._tracer.consume(); // Base consumption for the multiply call

    // Case 1: α = 0 or β = 0
    if (this.isZero() || otherOrdinal.isZero()) {
        return Ordinal.ZEROStatic().clone(this._tracer);
    }

    // Case 2: α = 1
    if (this.equals(Ordinal.ONEStatic())) {
        return otherOrdinal.clone();
    }

    // Case 3: β = 1
    if (otherOrdinal.equals(Ordinal.ONEStatic())) {
        return this.clone();
    }

    // --- Implementation of α·β = Σ (α · β_i) ---
    let totalSum = Ordinal.ZEROStatic().clone(this._tracer); // Accumulator for the sum

    // Iterate through each term of `otherOrdinal` (β_i)
    for (const betaTerm of otherOrdinal.terms) {
        // betaTerm is { exponent: Ordinal, coefficient: number }
        let productTerm; // This will be α · β_i

        // Let α = this.
        // Deconstruct α into A (limit part) and n (finite part integer value)
        const A_alpha = this.getLimitPart();
        const n_alpha_val = this.getFinitePart();

        if (!betaTerm.exponent.isZero()) {
            // --- Sub-rule 1: β_i = ω^e*k (infinite term) ---
            // (A+n) · (ω^e*k) = A · (ω^e*k)
            // If A = 0 (α is finite n_alpha_val), then n_alpha_val · (ω^e*k) = ω^e*k (for n_alpha_val > 0)
            // If A != 0, (A = ω^α₁*c₁ + R_A), then A · (ω^e*k) = ω^(α₁+e)*k
            
            if (A_alpha.isZero()) { // `this` (α) is finite (n_alpha_val)
                if (n_alpha_val === 0) { // Should have been caught by this.isZero()
                    productTerm = Ordinal.ZEROStatic().clone(this._tracer);
                } else { // n_alpha_val > 0. n_alpha_val * (ω^e*k) = ω^e*k
                    productTerm = new Ordinal([{ // Create the single term ordinal
                        exponent: betaTerm.exponent.clone(this._tracer),
                        coefficient: betaTerm.coefficient
                    }], this._tracer);
                }
            } else { // `this` (α) is infinite (A_alpha + n_alpha_val)
                const leadingTerm_A_alpha = A_alpha.getLeadingTerm();
                const alpha1 = leadingTerm_A_alpha.exponent; // This is an Ordinal object

                // New exponent for productTerm: α₁ + e (ordinal addition)
                if (this._tracer) this._tracer.consume(); // For the exponent addition
                const newExponent = alpha1.add(betaTerm.exponent);

                productTerm = new Ordinal([{
                    exponent: newExponent,
                    coefficient: betaTerm.coefficient // Coefficient comes from β_i
                }], this._tracer);
            }
       } else {
            // --- Sub-rule 2: β_i = k' (finite term, coefficient of β_i) ---
            // (A+n) · k'  OR  (PurelyFinite) · k'
            const k_prime = betaTerm.coefficient;

            if (A_alpha.isZero()) { // `this` (α) is finite (n_alpha_val)
                // n_alpha_val · k' (integer multiplication)
                productTerm = new Ordinal(n_alpha_val * k_prime, this._tracer);
            } else { // `this` (α) is infinite (A_alpha + n_alpha_val)
                     // Rule: (ω^α₁*c₁ + R)·k' = ω^α₁*(c₁*k') + R
                     // where R is the *entire* rest of the original 'this' ordinal.

                const original_alpha_terms = this.terms.map(t => ({ // Clone all terms of 'this'
                    exponent: t.exponent.clone(this._tracer),
                    coefficient: t.coefficient
                }));

                if (original_alpha_terms.length > 0) {
                    // Multiply coefficient of the leading term
                    original_alpha_terms[0].coefficient *= k_prime;
                }
                // The rest of the terms, including the original finite part of 'this', remain unchanged.
                productTerm = new Ordinal(original_alpha_terms, this._tracer);
            }
        }
        
        // Add this (α · β_i) to the totalSum
        if (this._tracer) this._tracer.consume(); // For the main sum accumulation
        totalSum = totalSum.add(productTerm);
    }

    return totalSum;
};

// ordinal_multiplication.js