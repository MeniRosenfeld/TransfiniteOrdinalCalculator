// @ts-nocheck

// Extracted from finverse_debug.html

// Original <scripttype="module">

        // Wait for module to finish loading and exporting to window
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify globals are available
        if (typeof OperationTracer === 'undefined' || typeof OPERATIONS === 'undefined' || 
            typeof fInverse === 'undefined' || typeof DEFAULT_F_PARAMS === 'undefined') {
            document.body.innerHTML = '<h1 style="color: red;">ERROR: Module not loaded. Required globals missing!</h1>' +
                '<p>OperationTracer: ' + typeof OperationTracer + '</p>' +
                '<p>OPERATIONS: ' + typeof OPERATIONS + '</p>' +
                '<p>fInverse: ' + typeof fInverse + '</p>' +
                '<p>DEFAULT_F_PARAMS: ' + typeof DEFAULT_F_PARAMS + '</p>';
            throw new Error('Module loading failed');
        }

        console.log('[Test] Module loaded successfully, starting fInverse debug...');

        // Initialize the new operations system
        if (window.OPERATIONS) {
            try {
                OPERATIONS.initialize();
                console.log('[Test] OPERATIONS initialized');
                // Also reinitialize the singleton to point to this OPERATIONS instance
                if (typeof initializeOperations === 'function') {
                    initializeOperations(OPERATIONS);
                    console.log('[Test] Operations singleton initialized');
                }
            } catch (e) {
                console.error('Failed to initialize OPERATIONS', e);
            }
        }

        // Initialize global tracer
        OperationTracer.setGlobalTracer(500000); // 500K operations budget
        console.log('[GlobalTracer] Finverse debug initialized with budget:', OperationTracer.getBudget());

        // Run the fInverse calculation
        // Module scripts are deferred, so DOM is already loaded - run immediately
        // --- CONFIGURATION ---
        const inputValue = 46.445219999999985; // Hardcoded input value (e.g., f(w+1))
        // ---------------------

        document.getElementById('input-value').textContent = inputValue;
        const outputEl = document.getElementById('output');
        const timeEl = document.getElementById('time');
        const fEl = document.getElementById('f');

        try {
            const startTime = performance.now();

            // Use the OLD_F_PARAMS as requested
            //const fParams = OLD_F_PARAMS;
            const fParams = DEFAULT_F_PARAMS;

            const resultRep = fInverse(inputValue, fParams, 1e-14);
            const ordinalResult = convertFFormatToOrdinalInstance(resultRep);

            const endTime = performance.now();

            outputEl.textContent = ordinalResult.toString();
            timeEl.textContent = `${(endTime - startTime).toFixed(3)} ms`;
            fEl.textContent = (f(resultRep, fParams) - inputValue).toString();

        } catch (e) {
            outputEl.textContent = `Error: ${e.message}`;
            console.error("Error during fInverse calculation:", e);
        }
