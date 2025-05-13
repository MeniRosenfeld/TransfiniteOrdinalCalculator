// ordinal_addition.js

// Assumes CNFOrdinal class, CNFOrdinal.prototype.compareTo, and helper methods
// (isZero, clone, etc.) are defined.

/**
 * Adds another ordinal to this ordinal. ( α + β )
 * Returns a new CNFOrdinal instance representing the sum.
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
CNFOrdinal.prototype.add = function(otherOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (otherOrdinal instanceof EpsilonNaughtOrdinal) {
        // Rule: x + e_0 = e_0 (for any CNFOrdinal x)
        return otherOrdinal.clone(this._tracer);
    }

    if (!(otherOrdinal instanceof CNFOrdinal)) {
        throw new Error("CNFOrdinal.add: Cannot add with unknown ordinal type.");
    }

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
        const newTerms = this.terms.map(t => ({ 
            exponent: t.exponent.clone(this._tracer),
            coefficient: t.coefficient 
        }));
        const thisFinitePart = this.getFinitePart(); 
        const otherFinitePart = otherOrdinal.getFinitePart(); 
        const combinedFinitePart = thisFinitePart + otherFinitePart; 

        if (thisFinitePart > 0n) { 
            newTerms[newTerms.length - 1].coefficient = combinedFinitePart;
            if (combinedFinitePart === 0n) { 
                newTerms.pop(); 
            }
        } else if (combinedFinitePart > 0n) { 
            newTerms.push({ exponent: CNFOrdinal.ZEROStatic().clone(this._tracer), coefficient: combinedFinitePart });
        }
        return new CNFOrdinal(newTerms, this._tracer);
    }

    // Case 5: `this` is finite, `otherOrdinal` is finite (both non-zero)
    if (this.isFinite() && otherOrdinal.isFinite()) {
        return new CNFOrdinal(this.getFinitePart() + otherOrdinal.getFinitePart(), this._tracer);
    }

    // Case 6: Both `this` and `otherOrdinal` are infinite. This is the core CNF addition logic.
    const firstTermOther = otherOrdinal.terms[0];
    const firstExpOther = firstTermOther.exponent;

    const newTerms = [];
    let i = 0; 

    while (i < this.terms.length && this.terms[i].exponent.compareTo(firstExpOther) > 0) {
        newTerms.push({
            exponent: this.terms[i].exponent.clone(this._tracer),
            coefficient: this.terms[i].coefficient 
        });
        i++;
    }

    if (i < this.terms.length) {
        const currentThisTermExp = this.terms[i].exponent;

        if (currentThisTermExp.equals(firstExpOther)) {
            newTerms.push({
                exponent: currentThisTermExp.clone(this._tracer),
                coefficient: this.terms[i].coefficient + firstTermOther.coefficient 
            });
            for (let j = 1; j < otherOrdinal.terms.length; j++) {
                newTerms.push({
                    exponent: otherOrdinal.terms[j].exponent.clone(this._tracer),
                    coefficient: otherOrdinal.terms[j].coefficient 
                });
            }
        } else { 
            for (let j = 0; j < otherOrdinal.terms.length; j++) {
                 newTerms.push({
                    exponent: otherOrdinal.terms[j].exponent.clone(this._tracer),
                    coefficient: otherOrdinal.terms[j].coefficient 
                });
            }
        }
    } else {
        for (let j = 0; j < otherOrdinal.terms.length; j++) {
            newTerms.push({
                exponent: otherOrdinal.terms[j].exponent.clone(this._tracer),
                coefficient: otherOrdinal.terms[j].coefficient 
            });
        }
    }
    
    return new CNFOrdinal(newTerms, this._tracer);
};

EpsilonNaughtOrdinal.prototype.add = function(otherOrdinal) {
    if (this._tracer) this._tracer.consume();

    if (otherOrdinal instanceof CNFOrdinal) {
        if (otherOrdinal.isZero()) {
            // Rule: e_0 + 0 = e_0
            return this.clone(this._tracer);
        } else {
            // Rules: e_0 + 1, e_0 + m, e_0 + a are unsupported
            throw new Error(`Operation e_0 + non-zero CNFOrdinal (${otherOrdinal.toStringCNF()}) is unsupported.`);
        }
    }
    if (otherOrdinal instanceof EpsilonNaughtOrdinal) {
        // Rule: e_0 + e_0 is unsupported
        throw new Error("Operation e_0 + e_0 is unsupported.");
    }
    throw new Error("EpsilonNaughtOrdinal.add: Cannot add with unknown ordinal type.");
};

// ordinal_addition.js