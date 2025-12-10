// EpsilonTunnelOrdinal.ts
// Represents epsilon tunnels: e__n where n is a finite depth
// Defined recursively as: e__0 = 0, e__(k+1) = e_(e__k)

import { OrdinalBase } from './OrdinalBase.js';
import { OperationTracer } from '../OperationTracer.js';
import { FiniteOrdinal } from './FiniteOrdinal.js';
import { ZeroOrdinal } from './ZeroOrdinal.js';
import { OneOrdinal } from './OneOrdinal.js';
import { EpsilonZero } from './EpsilonZero.js';
import { EpsilonNumber } from './EpsilonNumber.js';
import { ENFOrdinal } from './ENFOrdinal.js';
import { RenderingComponents } from '../RenderingComponents.js';
import type { SimplifyResult } from '../parser-types.js';
import { getOperations } from '../operations/OperationsSingleton.js';

export class EpsilonTunnelOrdinal extends OrdinalBase {
    readonly depth: bigint;

    constructor(depth: bigint | number | FiniteOrdinal = 0) {
        super();

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
            return ZeroOrdinal.instance();
        }
        // For depth > 0, the rank is quite complex - it's essentially the ordinal itself
        // but we'll approximate with a high epsilon number
        return new EpsilonNumber(EpsilonZero.instance());
    }

    log() {
        if (this.depth === 0n) {
            throw new Error('Log of 0 is undefined.');
        }
        return new EpsilonTunnelOrdinal(this.depth - 1n);
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
        return RenderingComponents.renderTunnel(this.depth.toString());
    }

    clone() {
        return new EpsilonTunnelOrdinal(this.depth);
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
            return ZeroOrdinal.instance();
        }

        // Build e_e_e_..._0 structure
        let result: OrdinalBase = ZeroOrdinal.instance();
        for (let i = 0n; i < this.depth; i++) {
            result = new EpsilonNumber(result) as OrdinalBase;
        }
        return result;
    }

    simplify(complexityBudget: number, skipMyOwnMPTFCheck = false): SimplifyResult {
        OperationTracer.consume();
        const myComplexity = this.complexity();
        if (myComplexity <= complexityBudget) {
            return {
                simplifiedOrdinal: this,
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
        const zero = ZeroOrdinal.instance();
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
        return ZeroOrdinal.instance(); // e__1 = e_0
    }

    // === CONVERSION SYSTEM ===

    static getTypeName() { return 'EpsilonTunnel'; }

    static getDirectConversions() {
        return ['ENF'];
    }

    convertTo(targetTypeName: string): OrdinalBase {
        switch (targetTypeName) {
            case 'ENF': {
                if (this.depth === 0n) {
                    return new ENFOrdinal([]);
                }

                // Convert to the expanded epsilon number structure
                const expanded = this.expand();
                // Use the conversion engine to find a path to ENF
                return getOperations().conversionEngine.convert(expanded, 'ENF');
            }
            default:
                throw new Error(`EpsilonTunnelOrdinal cannot convert directly to ${targetTypeName}`);
        }
    }

    nextRank(): OrdinalBase {
        if (this.depth === 0n) {
            return OneOrdinal.instance();
        }
        // For epsilon tunnels, next rank is complex - approximate with successor tunnel
        return new EpsilonTunnelOrdinal(this.depth + 1n);
    }
}
