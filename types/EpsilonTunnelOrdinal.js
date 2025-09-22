// EpsilonTunnelOrdinal.js
// Represents epsilon tunnels: e__n where n is a finite depth
// Defined recursively as: e__0 = 0, e__(k+1) = e_(e__k)

class EpsilonTunnelOrdinal extends OrdinalBase {
    constructor(depth = 0, operationTracer = null) {
        super(operationTracer);
        
        // Validate and set depth
        if (typeof depth === 'bigint') {
            if (depth < 0n) throw new Error('EpsilonTunnelOrdinal depth must be non-negative');
            this.depth = depth;
        } else if (typeof depth === 'number') {
            if (!Number.isInteger(depth) || depth < 0) throw new Error('EpsilonTunnelOrdinal depth must be a non-negative integer');
            this.depth = BigInt(depth);
        } else if (depth instanceof FiniteOrdinal) {
            this.depth = depth.getFiniteBigInt();
        } else {
            throw new Error('EpsilonTunnelOrdinal depth must be a non-negative integer');
        }
    }

    // === REQUIRED UNARY METHODS ===

    isZero() { return this.depth === 0n; }
    isFinite() { return this.depth === 0n; }
    isLessThanEpsilon0() { return this.depth === 0n; }
    isOmega() { return false; }
    isBasic() { return this.depth > 0n; }
    isOne() { return false; }

    isLimit() {
        return this.depth > 0n;
    }

    isWellFormed() {
        return (typeof this.depth === 'bigint') && this.depth >= 0n;
    }

    rank() {
        if (this.depth === 0n) {
            return new ZeroOrdinal(this._tracer);
        }
        // For depth > 0, the rank is quite complex - it's essentially the ordinal itself
        // but we'll approximate with a high epsilon number
        return new EpsilonNumber(new EpsilonZero(this._tracer), this._tracer);
    }

    log() {
        if (this.depth === 0n) {
            throw new Error('Log of 0 is undefined.');
        }
        return new EpsilonTunnelOrdinal(this.depth - 1n, this._tracer);
    }

    logStar() {
        return this.depth;
    }

    isTower() {
        return false; // Tunnels are different from towers
    }

    getFiniteBigInt() {
        if (this.depth === 0n) return 0n;
        throw new Error('EpsilonTunnelOrdinal is not finite');
    }

    complexity() {
        // Rough complexity: "e__" + depth digits
        return 3 + this.depth.toString().length;
    }

    toString() {
        return `e__${this.depth.toString()}`;
    }

    toGraphicalHTML() {
        return `ε<sub><sub>${this.depth.toString()}</sub></sub>`;
    }

    clone(newTracer = null) {
        return new EpsilonTunnelOrdinal(this.depth, newTracer || this._tracer);
    }

    toFFormat() {
        if (this.depth === 0n) return 0n;
        // Represent as { type: 'epsilon_tunnel', depth: Number }
        const asNum = Number(this.depth);
        return { type: 'epsilon_tunnel', depth: asNum };
    }

    // Convenience method: expand to actual epsilon number structure
    expand() {
        if (this.depth === 0n) {
            return new ZeroOrdinal(this._tracer);
        }
        
        // Build e_e_e_..._0 structure
        let result = new ZeroOrdinal(this._tracer);
        for (let i = 0n; i < this.depth; i++) {
            result = new EpsilonNumber(result, this._tracer);
        }
        return result;
    }

    simplify(complexityBudget, skipMyOwnMPTFCheck = false) {
        if (this._tracer) this._tracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this.clone(),
                remainingBudget: complexityBudget - myComplexity
            };
        }

        // If it doesn't fit, try expanding for small depths
        if (this.depth <= 3n) {
            const expanded = this.expand();
            const expandedComplexity = expanded.complexity();
            if (expandedComplexity <= complexityBudget) {
                return {
                    simplifiedOrdinal: expanded,
                    remainingBudget: complexityBudget - expandedComplexity
                };
            }
        }

        // Fall back to 0
        const zero = new ZeroOrdinal(this._tracer);
        const zeroComplexity = zero.complexity();
        return {
            simplifiedOrdinal: zero,
            remainingBudget: (zeroComplexity <= complexityBudget) ? complexityBudget - zeroComplexity : 0
        };
    }

    getFinitePart() {
        if (this.depth === 0n) return 0n;
        return 0n; // Infinite tunnels have no finite part
    }
    
    needsParenthesesAsExponent() { return false; }

    isEpsilonNumber() { 
        return this.depth === 1n; // e__1 = e_0 is an epsilon number
    }

    epsilonIndex() {
        if (!this.isEpsilonNumber()) {
            throw new Error('EpsilonTunnelOrdinal is not an epsilon number');
        }
        return new ZeroOrdinal(this._tracer); // e__1 = e_0
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'EpsilonTunnel'; }

    static getDirectConversions() {
        return ['ENF'];
    }

    convertTo(targetTypeName) {
        switch (targetTypeName) {
            case 'ENF': {
                if (this.depth === 0n) {
                    return new ENFOrdinal([], this._tracer);
                }
                
                // Convert to the expanded epsilon number structure
                const expanded = this.expand();
                // Use the conversion engine to find a path to ENF
                if (typeof OPERATIONS !== 'undefined' && OPERATIONS.conversionEngine) {
                    return OPERATIONS.conversionEngine.convert(expanded, 'ENF');
                } else {
                    // Fallback: try direct conversion
                    return expanded.convertTo('ENF');
                }
            }
            default:
                throw new Error(`EpsilonTunnelOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank() {
        if (this.depth === 0n) return new OneOrdinal(this._tracer);
        // For epsilon tunnels, next rank is complex - approximate with successor tunnel
        return new EpsilonTunnelOrdinal(this.depth + 1n, this._tracer);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpsilonTunnelOrdinal;
} else {
    // Browser global
    window.EpsilonTunnelOrdinal = EpsilonTunnelOrdinal;
}
