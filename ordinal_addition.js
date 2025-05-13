// ordinal_addition.js

// Assumes Ordinal class, Ordinal.prototype.compareTo, and helper methods
// (isZero, clone, etc.) are defined.

/**
 * Adds another ordinal to this ordinal. ( α + β )
 * Returns a new Ordinal instance representing the sum.
 * Based on the rules for adding ordinals in Cantor Normal Form.
 *
 * Let α = ω^α₁a₁ + ... + ω^αₖaₖ + n
 * Let β = ω^β₁b₁ + ... + ω^βₗbₗ + m
 *
 * 1. If β = 0, α + β = α.
 * 2. If α = 0, α + β = β.
 * 3. If α is finite (n), β is infinite (B+m), then n + β = β.
 * 4. If α is infinite (A+n), β is finite (m), then (A+n) + m = A + (n+m).
 * 5. If α, β infinite:
 *    Find smallest αⱼ in α such that αⱼ ≥ β₁.
 *    - If no such αⱼ (all exp in α < β₁): α + β = β.
 *    - If αⱼ > β₁: α + β = (terms of α up to and including ω^αⱼaⱼ) + β.
 *                  More accurately: (terms of α with exp > first_exp(β)) + β.
 *                  The tail of α from αⱼ onwards gets absorbed if its exponent is smaller.
 *                  If α = X + ω^αⱼaⱼ + Y and β = ω^β₁b₁ + Z, where exp(Y) < αⱼ.
 *                  If αⱼ > β₁, then α+β = X + ω^αⱼaⱼ + β.
 *    - If αⱼ = β₁: α + β = (terms of α before ω^αⱼaⱼ) + ω^β₁(aⱼ+b₁) + (rest of β after its first term).
 */
Ordinal.prototype.add = function(otherOrdinal) {
    if (!(otherOrdinal instanceof Ordinal)) {
        throw new Error("Cannot add Ordinal with non-Ordinal type.");
    }
    if (this._tracer) this._tracer.consume();

    // Case 1: otherOrdinal is 0
    if (otherOrdinal.isZero()) {
        return this.clone();
    }

    // Case 2: this ordinal is 0
    if (this.isZero()) {
        return otherOrdinal.clone();
    }

    // Case 3: `this` is finite, `otherOrdinal` is infinite
    if (this.isFinite() && !otherOrdinal.isFinite()) {
        return otherOrdinal.clone();
    }

    // Case 4: `this` is infinite, `otherOrdinal` is finite
    if (!this.isFinite() && otherOrdinal.isFinite()) {
        const newTerms = this.terms.map(t => ({ // Deep clone terms
            exponent: t.exponent.clone(this._tracer),
            coefficient: t.coefficient // coefficient is already BigInt
        }));
        const thisFinitePart = this.getFinitePart(); // Returns BigInt
        const otherFinitePart = otherOrdinal.getFinitePart(); // Returns BigInt
        const combinedFinitePart = thisFinitePart + otherFinitePart; // BigInt addition

        if (thisFinitePart > 0n) { // `this` had a finite part, modify it
            newTerms[newTerms.length - 1].coefficient = combinedFinitePart;
            if (combinedFinitePart === 0n) { 
                newTerms.pop(); 
            }
        } else if (combinedFinitePart > 0n) { // `this` had no finite part, add the new one
            newTerms.push({ exponent: Ordinal.ZEROStatic().clone(this._tracer), coefficient: combinedFinitePart });
        }
        // If combinedFinitePart is 0n and this had no finite part, no change needed.
        return new Ordinal(newTerms, this._tracer); // Constructor normalizes (sorts if needed)
    }

    // Case 5: `this` is finite, `otherOrdinal` is finite (both non-zero)
    if (this.isFinite() && otherOrdinal.isFinite()) {
        // Both getFinitePart() return BigInts, their sum is a BigInt.
        // The Ordinal constructor will handle creating a term with this BigInt.
        return new Ordinal(this.getFinitePart() + otherOrdinal.getFinitePart(), this._tracer);
    }

    // Case 6: Both `this` and `otherOrdinal` are infinite. This is the core CNF addition logic.
    // α = A+n, β = B+m. (A, B are limit parts)
    // Let first_exp_beta be the exponent of the leading term of otherOrdinal.
    const firstTermOther = otherOrdinal.terms[0];
    const firstExpOther = firstTermOther.exponent;

    const newTerms = [];
    let i = 0; // Index for this.terms

    // Copy terms from `this` whose exponents are strictly greater than firstExpOther
    while (i < this.terms.length && this.terms[i].exponent.compareTo(firstExpOther) > 0) {
        newTerms.push({
            exponent: this.terms[i].exponent.clone(this._tracer),
            coefficient: this.terms[i].coefficient // coefficient is already BigInt
        });
        i++;
    }

    if (i < this.terms.length) {
        // Now, this.terms[i].exponent <= firstExpOther
        const currentThisTermExp = this.terms[i].exponent;

        if (currentThisTermExp.equals(firstExpOther)) {
            // Exponents are equal: ω^αⱼaⱼ + ω^αⱼb₁ = ω^αⱼ(aⱼ+b₁)
            // Add this combined term
            newTerms.push({
                exponent: currentThisTermExp.clone(this._tracer),
                coefficient: this.terms[i].coefficient + firstTermOther.coefficient // BigInt addition
            });
            // Append the rest of otherOrdinal's terms (after its first term)
            for (let j = 1; j < otherOrdinal.terms.length; j++) {
                newTerms.push({
                    exponent: otherOrdinal.terms[j].exponent.clone(this._tracer),
                    coefficient: otherOrdinal.terms[j].coefficient // coefficient is already BigInt
                });
            }
        } else { // currentThisTermExp.compareTo(firstExpOther) < 0
            // All remaining terms of `this` have exponents smaller than firstExpOther.
            // So, `this` is effectively "smaller" at this junction. The result is `(copied terms from this) + otherOrdinal`.
            // Or, interpreted as: the "tail" of `this` is absorbed by `otherOrdinal`.
            // We have already copied the terms from `this` that are "larger" than `otherOrdinal`.
            // The rest of `this` is "overwritten" by `otherOrdinal`. So, just append all of `otherOrdinal`.
            for (let j = 0; j < otherOrdinal.terms.length; j++) {
                 newTerms.push({
                    exponent: otherOrdinal.terms[j].exponent.clone(this._tracer),
                    coefficient: otherOrdinal.terms[j].coefficient // coefficient is already BigInt
                });
            }
        }
    } else {
        // All terms of `this` had exponents greater than firstExpOther (e.g. w^2 + w).
        // This case is covered by the loop. Or, `this` was exhausted.
        // If `this` is exhausted, it means all its terms were greater than `otherOrdinal`'s first term.
        // This implies something is wrong, or `otherOrdinal` should have been entirely absorbed.
        // Let's re-evaluate: if the loop finishes and `i === this.terms.length`,
        // it means all terms of `this` have exponents > firstExpOther.
        // Example: this = w^2, other = w+1. Loop copies w^2. i=1.
        // Loop finishes. newTerms = [w^2].
        // The current logic then hits "else" because `i < this.terms.length` is false.
        // It should append all of `otherOrdinal`.
        // This means if all terms of `this` are "larger" than `otherOrdinal`'s head,
        // then the result is `this + otherOrdinal` (where the `+` is the complex part).
        // No, the rule is: copy terms from `this` with exp > first_exp(other).
        // If that point is reached, and `this_exp == first_exp(other)`, combine and add rest of `other`.
        // If that point is reached, and `this_exp < first_exp(other)`, add all of `other`.
        // If `this` is exhausted (all its terms copied), then also add all of `other`.
        for (let j = 0; j < otherOrdinal.terms.length; j++) {
            newTerms.push({
                exponent: otherOrdinal.terms[j].exponent.clone(this._tracer),
                coefficient: otherOrdinal.terms[j].coefficient // coefficient is already BigInt
            });
        }
    }
    
    return new Ordinal(newTerms, this._tracer); // Constructor normalizes
};

// ordinal_addition.js