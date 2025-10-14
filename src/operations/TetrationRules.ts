// TetrationRules.js
// Rule definitions for ordinal tetration (a ^^ b)

import { Rule } from './RuleEngine.js';
import { ConversionEngine } from '../conversions/ConversionEngine.js';
import { OneOrdinal } from '../types/OneOrdinal.js';
import { ZeroOrdinal } from '../types/ZeroOrdinal.js';
import { WTowerOrdinal } from '../types/WTowerOrdinal.js';
import { EpsilonTowerOrdinal } from '../types/EpsilonTowerOrdinal.js';
import { ZetaZero } from '../types/ZetaZero.js';

function tetrateFinite(base: any, heightFinite: any): any {
    const h = heightFinite.getFiniteBigInt();
    if (h === 0n) return OneOrdinal.instance();
    if (h === 1n) return base;
    let result = base;
    // Build right-associative tower: a^(a^(...)) of height h
    for (let i = 2n; i <= h; i++) {
        result = base.power(result);
    }
    return result;
}

export function createTetrationRules(conversionEngine: ConversionEngine): Rule[] {
    return [

        // a ^^ 0 = 1
        new Rule('a^^0 = 1',
            (a, b) => b.isZero(),
            (a, b) => OneOrdinal.instance()),

        // a ^^ 1 = a
        new Rule('a^^1 = a',
            (a, b) => b.isOne(),
            (a, b) => a),

        // 1 ^^ a = 1
        new Rule('1^^a = 1',
            (a, b) => a.isOne(),
            (a, b) => OneOrdinal.instance()),

        // 0 ^^ finite = 1 if even, 0 if odd
        new Rule('0^^finite parity',
            (a, b) => a.isZero() && b.isFinite(),
            (a, b) => {
                const n = b.getFiniteBigInt();
                if (n % 2n === 0n) return OneOrdinal.instance();
                return ZeroOrdinal.instance();
            }),

        // 0 ^^ infinite is undefined
        new Rule('0^^infinite undefined',
            (a, b) => a.isZero() && !b.isFinite(),
            (a, b) => { throw new Error(`Operation 0 ^^ ${b.toString()} is undefined.`); }),

        // finite ^^ finite = repeated exponentiation
        new Rule('finite^^finite',
            (a, b) => a.isFinite() && b.isFinite(),
            (a, b) => tetrateFinite(a, b)),

        // w ^^ finite: if height>10 -> WTower, else repeated exponentiation
        new Rule('omega^^finite',
            (a, b) => a.isOmega() && b.isFinite(),
            (a, b) => {
                const h = b.getFiniteBigInt();
                if (h > 10n) return new WTowerOrdinal(h);
                return tetrateFinite(a, b);
            }),

        // e_k ^^ finite: if height>10 -> EpsilonTower, else repeated exponentiation
        new Rule('epsilon^^finite',
            (a, b) => a.isEpsilonNumber() && b.isFinite(),
            (a, b) => {
                const h = b.getFiniteBigInt();
                if (h > 10n) {
                    const epsilonIndex = a.epsilonIndex();
                    return new EpsilonTowerOrdinal(epsilonIndex, h);
                }
                return tetrateFinite(a, b);
            }),

        // a ^^ finite (general) = repeated exponentiation
        new Rule('general^^finite',
            (a, b) => b.isFinite(),
            (a, b) => tetrateFinite(a, b)),

        // a ^^ infinite = a.nextRank()
        new Rule('a^^infinite = nextRank',
            (a, b) => !b.isFinite(),
            (a, b) => a.nextRank()),

        // ZetaZero rules (lowest precedence)
        // z0^^a is not implemented for a > 1
        new Rule('z0^^a not implemented (a>1)',
            (a, b) => (a instanceof ZetaZero),
            () => { throw new Error('Tetration with z_0 on the left is not implemented'); }),

        // a^^z0 = nextRank
        new Rule('a^^z0 = nextRank',
            (a, b) => (b instanceof ZetaZero),
            (a, b) => a.nextRank())
    ];
}
