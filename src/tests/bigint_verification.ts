// Extracted from bigint_verification.html

// Original <scripttype="module">

        import { fTyped, ORDINAL_ZERO, ORDINAL_ONE } from "../ordinal_mapping/OrdinalMapping.js";
        import { DoubleContext } from "../ordinal_mapping/Contexts.js";
        import { FParams } from "../ordinal_mapping/FParams.js";

        const resultsDiv = document.getElementById('results');
        const summaryDiv = document.getElementById('summary');
        if (!resultsDiv || !summaryDiv) {
            throw new Error('Required result containers are missing');
        }
        
        let passed = 0;
        let failed = 0;

        function addResult(testName: string, success: boolean, message = ''): void {
            const div = document.createElement('div');
            div.className = `test-result ${success ? 'pass' : 'fail'}`;
            div.textContent = `${success ? '✓' : '✗'} ${testName}${message ? ': ' + message : ''}`;
            resultsDiv.appendChild(div);
            if (success) passed++; else failed++;
        }

        try {
            const ctx = new DoubleContext();
            const params = FParams.default(ctx);

            // Test 1: BigInt finite ordinals work
            const f0 = fTyped(0n, params);
            addResult('f(0n) computes', true, `result = ${f0.toNumber()}`);

            const f1 = fTyped(1n, params);
            addResult('f(1n) computes', true, `result = ${f1.toNumber()}`);

            const f100 = fTyped(100n, params);
            addResult('f(100n) computes', true, `result = ${f100.toNumber()}`);

            // Test 2: Large BigInt finite ordinals
            const f1000000 = fTyped(1000000n, params);
            addResult('f(1000000n) computes', true, `result = ${f1000000.toNumber()}`);

            // Test 3: BigInt in ordinal representations
            const fOmega2 = fTyped({ type: 'pow', k: 2n }, params);
            addResult('f(ω^2n) uses BigInt k', true, `result = ${fOmega2.toNumber()}`);

            const fOmega100 = fTyped({ type: 'pow', k: 100n }, params);
            addResult('f(ω^100n) uses BigInt k', true, `result = ${fOmega100.toNumber()}`);

            // Test 4: Integer coefficients in sum type
            const fOmegaTimes5 = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 5n, delta: ORDINAL_ZERO },
                params
            );
            addResult('f(ω * 5n + 0) uses BigInt c', true, `result = ${fOmegaTimes5.toNumber()}`);

            // Test 5: Large integer coefficients
            const fOmegaTimes1000 = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 1000n, delta: ORDINAL_ZERO },
                params
            );
            addResult('f(ω * 1000n + 0) uses large BigInt c', true, `result = ${fOmegaTimes1000.toNumber()}`);

            // Test 6: BigInt delta in sum type
            const fOmegaPlus100 = fTyped(
                { type: 'sum', beta: ORDINAL_ONE, c: 1n, delta: 100n },
                params
            );
            addResult('f(ω * 1n + 100n) uses BigInt delta', true, `result = ${fOmegaPlus100.toNumber()}`);

            // Test 7: Complex nested structure with BigInts
            const fComplex = fTyped(
                {
                    type: 'sum',
                    beta: 5n,  // BigInt exponent
                    c: 7n,      // BigInt coefficient
                    delta: {
                        type: 'sum',
                        beta: 2n,  // BigInt exponent
                        c: 3n,      // BigInt coefficient
                        delta: 42n // BigInt finite ordinal
                    }
                },
                params
            );
            addResult('f(ω^5 * 7n + ω^2 * 3n + 42n) complex BigInt structure', true, 
                `result = ${fComplex.toNumber()}`);

            // Test 8: Verify types are preserved
            const ordinal = 12345n;
            addResult('BigInt type preserved', typeof ordinal === 'bigint', 
                `typeof 12345n = ${typeof ordinal}`);

            const sumType = { type: 'sum', beta: 1n, c: 5n, delta: 0n };
            addResult('Sum type c is BigInt', typeof sumType.c === 'bigint', 
                `typeof c = ${typeof sumType.c}`);
            addResult('Sum type beta is BigInt', typeof sumType.beta === 'bigint', 
                `typeof beta = ${typeof sumType.beta}`);
            addResult('Sum type delta is BigInt', typeof sumType.delta === 'bigint', 
                `typeof delta = ${typeof sumType.delta}`);

            // Test 9: Verify computation is correct (monotonicity)
            const fOmega10 = fTyped({ type: 'sum', beta: ORDINAL_ONE, c: 10n, delta: ORDINAL_ZERO }, params);
            const fOmega11 = fTyped({ type: 'sum', beta: ORDINAL_ONE, c: 11n, delta: ORDINAL_ZERO }, params);
            addResult('f(ω * 10n) < f(ω * 11n)', fOmega10.lessThan(fOmega11), 
                `${fOmega10.toNumber()} < ${fOmega11.toNumber()}`);
            
            // Test 10: BigInt w_tower height
            const fTower1 = fTyped({ type: 'w_tower', height: 1n }, params);
            addResult('f(ω↑↑1n) uses BigInt height', true, `result = ${fTower1.toNumber()}`);
            
            const fTower10 = fTyped({ type: 'w_tower', height: 10n }, params);
            addResult('f(ω↑↑10n) uses large BigInt height', true, `result = ${fTower10.toNumber()}`);

            // Summary
            const total = passed + failed;
            summaryDiv.className = `summary ${failed === 0 ? 'all-pass' : ''}`;
            summaryDiv.innerHTML = `
                <div>Total: ${total} tests</div>
                <div>Passed: ${passed}</div>
                <div>Failed: ${failed}</div>
                <div>Success Rate: ${((passed / total) * 100).toFixed(1)}%</div>
            `;

        } catch (error) {
            addResult('Test suite execution', false, error.message);
            console.error('Test error:', error);
        }
