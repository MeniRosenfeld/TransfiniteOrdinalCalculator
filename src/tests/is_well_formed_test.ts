import { CNFOrdinal } from "../types/CNFOrdinal.js";
import type { CNFTerm } from "../types/CNFOrdinal.js";
import type { OrdinalBase } from "../types/OrdinalBase.js";
import { EpsilonZero } from "../types/EpsilonZero.js";
import { ZeroOrdinal } from "../types/ZeroOrdinal.js";
import { OneOrdinal } from "../types/OneOrdinal.js";
import { FiniteOrdinal } from "../types/FiniteOrdinal.js";
import { OmegaOrdinal } from "../types/OmegaOrdinal.js";
import { WTowerOrdinal } from "../types/WTowerOrdinal.js";
import { OPERATIONS } from "../operations/Operations.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import { requireElementById } from "./testUtils.js";

// Extracted from is_well_formed_test.html

// Original <scripttype="module">

        initializeTestEnvironment();
        console.log('[Test] isWellFormed tests initialized');

        const resultsContainer = requireElementById<HTMLDivElement>('results');
        const summaryElement = requireElementById<HTMLDivElement>('summary');

        function addCase(desc: string, got: unknown, expected: unknown): boolean {
            const div = document.createElement('div');
            const passed = got === expected;
            div.className = 'case ' + (passed ? 'pass' : 'fail');
            div.textContent = `${passed ? 'PASS' : 'FAIL'} - ${desc} → got ${got}, expected ${expected}`;
            resultsContainer.appendChild(div);
            return passed;
        }

        (function runTests() {
            // OPERATIONS already initialized above
            let passed = 0, total = 0;

            function check(desc: string, fn: () => boolean) {
                total++;
                let ok = false;
                try { ok = !!fn(); } catch (e) { ok = false; }
                if (addCase(desc, ok, true)) passed++;
            }

            function checkFalse(desc: string, fn: () => boolean) {
                total++;
                let actual = false;
                try { actual = !!fn(); } catch (e) { actual = false; }
                if (addCase(desc, actual, false)) passed++;
            }

            check('CNF w^2+w+1 well formed', () => {
                const terms = [
                    { exponent: CNFOrdinal.fromInt(2), coefficient: 1n },
                    { exponent: CNFOrdinal.ONEStatic(), coefficient: 1n },
                    { exponent: CNFOrdinal.ZEROStatic(), coefficient: 1n }
                ];
                return new CNFOrdinal(terms).isWellFormed();
            });


            // FiniteOrdinal
            check('FiniteOrdinal(0) well formed', () => new FiniteOrdinal(0).isWellFormed());
            check('FiniteOrdinal(123) well formed', () => new FiniteOrdinal(123).isWellFormed());
            checkFalse('FiniteOrdinal(-1) not well formed (constructor throws)', () => new FiniteOrdinal(-1).isWellFormed());

            // ZeroOrdinal / OneOrdinal / Omega / EpsilonZero
            check('ZeroOrdinal well formed', () => ZeroOrdinal.instance().isWellFormed());
            check('OneOrdinal well formed', () => OneOrdinal.instance().isWellFormed());
            check('OmegaOrdinal well formed', () => OmegaOrdinal.instance().isWellFormed());
            check('EpsilonZero well formed', () => EpsilonZero.instance().isWellFormed());

            // WTowerOrdinal
            check('WTowerOrdinal(-1) well formed (semantic 0)', () => new WTowerOrdinal(-1).isWellFormed());
            check('WTowerOrdinal(0) well formed', () => new WTowerOrdinal(0).isWellFormed());
            check('WTowerOrdinal(2) well formed', () => new WTowerOrdinal(2).isWellFormed());
            checkFalse('WTowerOrdinal(-2) not well formed (constructor throws)', () => new WTowerOrdinal(-2).isWellFormed());

            // CNFOrdinal - valid constructions
            // 0
            check('CNF 0 well formed', () => new CNFOrdinal(0).isWellFormed());
            // Finite 5
            check('CNF 5 well formed', () => new CNFOrdinal(5).isWellFormed());
            // w = ω^1 * 1
            check('CNF w well formed', () => new CNFOrdinal([{ exponent: CNFOrdinal.ONEStatic(), coefficient: 1n }]).isWellFormed());
            // w^2 + w + 1
            check('CNF w^2+w+1 well formed', () => {
                const terms = [
                    { exponent: CNFOrdinal.fromInt(2), coefficient: 1n },
                    { exponent: CNFOrdinal.ONEStatic(), coefficient: 1n },
                    { exponent: CNFOrdinal.ZEROStatic(), coefficient: 1n }
                ];
                return new CNFOrdinal(terms).isWellFormed();
            });
            // w^w + w + 1 (original construction)
            check('CNF w^w+w+1 well formed', () => {
                const expW = new CNFOrdinal([{ exponent: CNFOrdinal.ONEStatic(), coefficient: 1n }]); // ω
                const terms = [
                    { exponent: expW, coefficient: 1n },
                    { exponent: CNFOrdinal.ONEStatic(), coefficient: 1n },
                    { exponent: CNFOrdinal.ZEROStatic(), coefficient: 1n }
                ];
                return new CNFOrdinal(terms).isWellFormed();
            });

            // CNFOrdinal - broken cases
            // Non-decreasing exponents
            checkFalse('CNF exponents non-decreasing (invalid)', () => {
                const terms = [
                    { exponent: CNFOrdinal.ONEStatic(), coefficient: 1n },
                    { exponent: CNFOrdinal.ONEStatic(), coefficient: 1n }
                ];
                return new CNFOrdinal(terms).isWellFormed();
            });

            // Negative coefficient
            checkFalse('CNF negative coefficient (invalid)', () => {
                const terms = [{ exponent: CNFOrdinal.ONEStatic(), coefficient: -1n }];
                return new CNFOrdinal(terms).isWellFormed();
            });

            // Exponent not < e0 (use EpsilonZero)
            checkFalse('CNF exponent is ε₀ (invalid)', () => {
                const terms = [{ exponent: EpsilonZero.instance(), coefficient: 1n }];
                return new CNFOrdinal(terms).isWellFormed();
            });

            // Exponent not ordinal
            checkFalse('CNF exponent not ordinal object (invalid)', () => {
                const terms: CNFTerm[] = [{ exponent: 42 as unknown as OrdinalBase, coefficient: 1n }];
                return new CNFOrdinal(terms).isWellFormed();
            });

            // Report
            summaryElement.textContent = `${passed}/${total} tests passed`;
        })();
