// @ts-nocheck

// Extracted from fTyped_test.html

// Original <scripttype="module">

        import { fTyped, ORDINAL_ZERO, ORDINAL_ONE } from "../ordinal_mapping/OrdinalMapping.js";
        import { DoubleContext } from "../ordinal_mapping/Contexts.js";
        import { RationalContext } from "../ordinal_mapping/Contexts.js";
        import { FParams } from "../ordinal_mapping/FParams.js";

        const resultsDiv = document.getElementById('test-results');
        const summaryDiv = document.getElementById('summary');
        
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        function addTestResult(testName, passed, message = '') {
            totalTests++;
            if (passed) {
                passedTests++;
            } else {
                failedTests++;
            }
            
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-result ${passed ? 'pass' : 'fail'}`;
            resultDiv.textContent = `${passed ? '✓' : '✗'} ${testName}${message ? ': ' + message : ''}`;
            resultsDiv.appendChild(resultDiv);
        }

        function addSection(title) {
            const section = document.createElement('div');
            section.className = 'test-section';
            section.innerHTML = `<h2>${title}</h2>`;
            resultsDiv.appendChild(section);
            return section;
        }

        function updateSummary() {
            const allPassed = failedTests === 0;
            summaryDiv.className = `summary ${allPassed ? 'all-pass' : 'some-fail'}`;
            summaryDiv.innerHTML = `
                <div>Total Tests: ${totalTests}</div>
                <div>Passed: ${passedTests}</div>
                <div>Failed: ${failedTests}</div>
                <div>Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%</div>
            `;
        }

        function approxEqual(a, b, tolerance = 1e-10) {
            return Math.abs(a - b) < tolerance;
        }

        // Test Suite
        try {
            // Section 1: Basic Double Context Tests
            const section1 = addSection('1. Basic Tests with Double Context');
            const doubleCtx = new DoubleContext();
            // Use all 3s to match DEFAULT_F_PARAMS in ordinal_mapping.js
            const doubleParams = FParams.default(doubleCtx);

            // Test 1.1: f(0) = 0
            const f0 = fTyped(ORDINAL_ZERO, doubleParams);
            addTestResult('f(0) = 0', approxEqual(f0.toNumber(), 0), `got ${f0.toNumber()}`);

            // Test 1.2: f(1) > 0
            const f1 = fTyped(ORDINAL_ONE, doubleParams);
            addTestResult('f(1) > 0', f1.toNumber() > 0, `got ${f1.toNumber()}`);

            // Test 1.3: f is monotonic for finite ordinals
            let monotonic = true;
            let prevVal = 0;
            for (let n = 0n; n <= 10n; n++) {
                const fn = fTyped(n, doubleParams).toNumber();
                if (fn < prevVal) {
                    monotonic = false;
                    break;
                }
                prevVal = fn;
            }
            addTestResult('f is monotonic on finite ordinals [0..10]', monotonic);

            // Test 1.4: f(n) < 1 for all finite n
            let bounded = true;
            for (let n = 0n; n <= 100n; n += 10n) {
                const fn = fTyped(n, doubleParams).toNumber();
                if (fn >= 1) {
                    bounded = false;
                    break;
                }
            }
            addTestResult('f(n) < 1 for finite n', bounded);

            // Test 1.5: f(n) approaches 1 as n → ∞
            const f100 = fTyped(100n, doubleParams).toNumber();
            const f1000 = fTyped(1000n, doubleParams).toNumber();
            addTestResult('f(100) > 0.9', f100 > 0.9, `got ${f100}`);
            addTestResult('f(1000) > f(100)', f1000 > f100);

            // Section 2: Ordinal Powers (ω^k)
            const section2 = addSection('2. Ordinal Powers (ω^k)');

            // Test 2.1: f(ω^0) = f(1)
            const fOmega0 = fTyped({ type: 'pow', k: ORDINAL_ZERO }, doubleParams);
            addTestResult('f(ω^0) = f(1)', approxEqual(fOmega0.toNumber(), f1.toNumber()));

            // Test 2.2: f(ω) = f(ω^1) > f(any finite)
            const fOmega = fTyped({ type: 'pow', k: ORDINAL_ONE }, doubleParams).toNumber();
            addTestResult('f(ω) > f(1000)', fOmega > f1000, `f(ω) = ${fOmega}`);

            // Test 2.3: f(ω^2) > f(ω)
            const fOmega2 = fTyped({ type: 'pow', k: 2n }, doubleParams).toNumber();
            addTestResult('f(ω^2) > f(ω)', fOmega2 > fOmega, `f(ω^2) = ${fOmega2}`);

            // Test 2.4: f(ω^n) is monotonic
            const fOmega3 = fTyped({ type: 'pow', k: 3n }, doubleParams).toNumber();
            const fOmega4 = fTyped({ type: 'pow', k: 4n }, doubleParams).toNumber();
            addTestResult('f(ω^3) > f(ω^2)', fOmega3 > fOmega2);
            addTestResult('f(ω^4) > f(ω^3)', fOmega4 > fOmega3);

            // Test 2.5: f(ω^ω)
            const fOmegaOmega = fTyped({ type: 'pow', k: { type: 'pow', k: ORDINAL_ONE } }, doubleParams).toNumber();
            addTestResult('f(ω^ω) > f(ω^4)', fOmegaOmega > fOmega4, `f(ω^ω) = ${fOmegaOmega}`);

            // Section 3: CNF Sum Type (ω^β * c + δ)
            const section3 = addSection('3. CNF Sum Type (ω^β * c + δ)');

            // Test 3.1: f(ω * 2) = f(ω^1 * 2 + 0)
            const fOmegaTimes2 = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 2n, delta: ORDINAL_ZERO },
                doubleParams
            ).toNumber();
            addTestResult('f(ω * 2) > f(ω)', fOmegaTimes2 > fOmega, `f(ω * 2) = ${fOmegaTimes2}`);

            // Test 3.2: f(ω + 1)
            const fOmegaPlus1 = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 1n, delta: ORDINAL_ONE },
                doubleParams
            ).toNumber();
            addTestResult('f(ω) < f(ω + 1) < f(ω * 2)', fOmega < fOmegaPlus1 && fOmegaPlus1 < fOmegaTimes2, 
                `f(ω + 1) = ${fOmegaPlus1}`);

            // Test 3.3: f(ω + 5)
            const fOmegaPlus5 = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 1n, delta: 5n },
                doubleParams
            ).toNumber();
            addTestResult('f(ω + 1) < f(ω + 5)', fOmegaPlus1 < fOmegaPlus5, `f(ω + 5) = ${fOmegaPlus5}`);

            // Test 3.4: f(ω^2 * 3 + ω * 5 + 7) - complex CNF
            const fComplex = fTyped(
                { 
                    type: 'sum', 
                    beta: 2n, 
                    c: 3n, 
                    delta: { type: 'sum', beta: ORDINAL_ONE, c: 5n, delta: 7n }
                },
                doubleParams
            ).toNumber();
            addTestResult('f(ω^2 * 3 + ω * 5 + 7) computed', !isNaN(fComplex) && isFinite(fComplex), 
                `got ${fComplex}`);

            // Section 4: Omega Towers (ω↑↑n)
            const section4 = addSection('4. Omega Towers (ω↑↑n)');

            // Test 4.1: f(ω↑↑1) = f(ω)
            const fTower1 = fTyped({ type: 'w_tower', height: 1n }, doubleParams).toNumber();
            addTestResult('f(ω↑↑1) = f(ω)', approxEqual(fTower1, fOmega), `got ${fTower1}`);

            // Test 4.2: f(ω↑↑2) = f(ω^ω) > f(ω↑↑1)
            const fTower2 = fTyped({ type: 'w_tower', height: 2n }, doubleParams).toNumber();
            addTestResult('f(ω↑↑2) > f(ω↑↑1)', fTower2 > fTower1, `got ${fTower2}`);

            // Test 4.3: f(ω↑↑3) > f(ω↑↑2)
            const fTower3 = fTyped({ type: 'w_tower', height: 3n }, doubleParams).toNumber();
            addTestResult('f(ω↑↑3) > f(ω↑↑2)', fTower3 > fTower2);

            // Section 5: Epsilon Numbers (ε_k)
            const section5 = addSection('5. Epsilon Numbers (ε_k)');

            // Test 5.1: f(ε_0) computed
            const fEpsilon0 = fTyped({ type: 'epsilon', index: ORDINAL_ZERO }, doubleParams).toNumber();
            addTestResult('f(ε_0) computed', !isNaN(fEpsilon0) && isFinite(fEpsilon0), `f(ε_0) = ${fEpsilon0}`);

            // Test 5.2: f(ε_0) > f(ω^ω)
            addTestResult('f(ε_0) > f(ω^ω)', fEpsilon0 > fOmegaOmega);

            // Test 5.3: Legacy E0_TYPE format
            const fE0Legacy = fTyped('E0_TYPE', doubleParams).toNumber();
            addTestResult('f(E0_TYPE) = f(ε_0)', approxEqual(fE0Legacy, fEpsilon0));

            // Section 6: Rational Context Tests
            const section6 = addSection('6. Rational Context Tests (Exact Arithmetic)');
            const rationalCtx = new RationalContext();
            // Use all 3s to match DEFAULT_F_PARAMS
            const rationalParams = FParams.default(rationalCtx);

            // Test 6.1: f(0) = 0
            const f0Rat = fTyped(ORDINAL_ZERO, rationalParams);
            addTestResult('[Rational] f(0) = 0', f0Rat.toNumber() === 0);

            // Test 6.2: f(1) is exact fraction
            const f1Rat = fTyped(ORDINAL_ONE, rationalParams);
            addTestResult('[Rational] f(1) > 0', f1Rat.toNumber() > 0, `got ${f1Rat.toString()}`);

            // Test 6.3: f(5) is exact fraction
            const f5Rat = fTyped(5n, rationalParams);
            addTestResult('[Rational] f(5) computed', f5Rat.toNumber() > 0, `got ${f5Rat.toString()}`);

            // Test 6.4: f(ω) with rationals
            const fOmegaRat = fTyped({ type: 'pow', k: ORDINAL_ONE }, rationalParams);
            addTestResult('[Rational] f(ω) > f(5)', fOmegaRat.greaterThan(f5Rat), 
                `f(ω) = ${fOmegaRat.toString()}`);

            // Test 6.5: Rational vs Double consistency
            const f10Double = fTyped(10n, doubleParams).toNumber();
            const f10Rat = fTyped(10n, rationalParams).toNumber();
            addTestResult('[Rational] f(10) ≈ double f(10)', approxEqual(f10Double, f10Rat, 1e-9),
                `double: ${f10Double}, rational: ${f10Rat}`);

            // Section 7: Memoization Tests
            const section7 = addSection('7. Memoization Tests');

            // Test 7.1: Calling f twice on same ordinal should be fast
            const start1 = performance.now();
            fTyped({ type: 'pow', k: { type: 'pow', k: 5n } }, doubleParams);
            const time1 = performance.now() - start1;
            
            const start2 = performance.now();
            fTyped({ type: 'pow', k: { type: 'pow', k: 5n } }, doubleParams);
            const time2 = performance.now() - start2;
            
            addTestResult('[Memo] Second call faster', time2 <= time1 * 1.5, 
                `first: ${time1.toFixed(2)}ms, second: ${time2.toFixed(2)}ms`);

            // Section 8: Edge Cases
            const section8 = addSection('8. Edge Cases');

            // Test 8.1: Large finite ordinal
            const fLarge = fTyped(10000n, doubleParams).toNumber();
            addTestResult('f(10000) < 1', fLarge < 1, `got ${fLarge}`);
            addTestResult('f(10000) > 0.99', fLarge > 0.99, `got ${fLarge}`);

            // Test 8.2: ω^0 = 1
            const fOne = fTyped({ type: 'pow', k: ORDINAL_ZERO }, doubleParams).toNumber();
            addTestResult('f(ω^0) = f(1)', approxEqual(fOne, f1.toNumber()));

            // Test 8.3: ω * 1 + 0 = ω
            const fOmegaAlt = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 1n, delta: ORDINAL_ZERO },
                doubleParams
            ).toNumber();
            addTestResult('f(ω * 1 + 0) = f(ω)', approxEqual(fOmegaAlt, fOmega));

            // Section 9: Parameter Scaling Tests
            const section9 = addSection('9. Parameter Scaling Tests');

            // Test 9.1: Different scaleAdd affects finite ordinals
            const customParams = FParams.uniform(doubleCtx, doubleCtx.fromNumber(2.0));
            const f10Custom = fTyped(10n, customParams).toNumber();
            const f10Default = fTyped(10n, doubleParams).toNumber();
            addTestResult('Different scaleAdd changes f(10)', Math.abs(f10Custom - f10Default) > 1e-6,
                `custom: ${f10Custom}, default: ${f10Default}`);

            // Test 9.2: Parameter validation
            let validationFailed = false;
            try {
                const invalidParams = new FParams(
                    doubleCtx,
                    doubleCtx.fromNumber(-1.0),  // Invalid: negative
                    doubleCtx.ONE,
                    doubleCtx.ONE,
                    doubleCtx.ONE,
                    doubleCtx.ONE
                );
                invalidParams.validateOrThrow();
            } catch (e) {
                validationFailed = true;
            }
            addTestResult('Parameter validation catches negative scale', validationFailed);

            // Update summary
            updateSummary();

        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'test-result fail';
            errorDiv.textContent = `✗ Test suite crashed: ${error.message}`;
            resultsDiv.appendChild(errorDiv);
            console.error('Test error:', error);
            updateSummary();
        }
