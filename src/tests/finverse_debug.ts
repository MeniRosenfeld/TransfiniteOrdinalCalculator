import { OperationTracer } from "../OperationTracer.js";
import { OPERATIONS } from "../operations/Operations.js";
import { fInverse, DEFAULT_F_PARAMS } from "../ordinal_mapping/OrdinalMappingCompat.js";
import { initializeTestEnvironment } from "./testEnvironment.js";

// @ts-nocheck

// Extracted from finverse_debug.html

// Original <scripttype="module">

        initializeTestEnvironment(500000);
        console.log('[Test] fInverse debug initialized');

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
