import { OperationTracer } from "../OperationTracer.js";
import { OPERATIONS } from "../operations/Operations.js";
import {
    fTyped,
    convertFFormatToOrdinalInstance,
    type OrdinalRepresentation,
} from "../ordinal_mapping/OrdinalMapping.js";
import { fInverseTyped } from "../ordinal_mapping/OrdinalMappingInverse.js";
import { FParams } from "../ordinal_mapping/FParams.js";
import { DoubleContext } from "../ordinal_mapping/Contexts.js";
import { DoubleNumericValue } from "../ordinal_mapping/DoubleNumericValue.js";
import { Interval } from "../ordinal_mapping/Interval.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import { requireElementById } from "./testUtils.js";

const doubleCtx = new DoubleContext();
const DEFAULT_F_PARAMS = FParams.default(doubleCtx);

function legacyF(rep: OrdinalRepresentation, params = DEFAULT_F_PARAMS): number {
    return fTyped(rep, params).toNumber();
}

function legacyFInverse(
    x: number,
    params = DEFAULT_F_PARAMS,
    threshold = 1e-14
): OrdinalRepresentation {
    const maxValue = params.precomputed[5]!.toNumber();
    if (x < 0 || x > maxValue) {
        throw new Error(`Input value ${x} is outside the valid range [0,${maxValue}]`);
    }
    const lower = Math.max(0, x - threshold);
    const upper = Math.min(maxValue, x + threshold);
    const interval = new Interval(
        DoubleNumericValue.fromNumber(lower),
        DoubleNumericValue.fromNumber(upper)
    );
    return fInverseTyped(interval, params);
}

// Extracted from finverse_debug.html

// Original <scripttype="module">

        initializeTestEnvironment(500000);
        console.log('[Test] fInverse debug initialized');

        // Run the fInverse calculation
        // Module scripts are deferred, so DOM is already loaded - run immediately
        // --- CONFIGURATION ---
        const inputValue = 46.445219999999985; // Hardcoded input value (e.g., f(w+1))
        // ---------------------

        requireElementById<HTMLElement>('input-value').textContent = String(inputValue);
        const outputEl = requireElementById<HTMLElement>('output');
        const timeEl = requireElementById<HTMLElement>('time');
        const fEl = requireElementById<HTMLElement>('f');

        try {
            const startTime = performance.now();

            // Use the OLD_F_PARAMS as requested
            //const fParams = OLD_F_PARAMS;
            const fParams = DEFAULT_F_PARAMS;

            const resultRep = legacyFInverse(inputValue, fParams, 1e-14);
            const ordinalResult = convertFFormatToOrdinalInstance(resultRep);

            const endTime = performance.now();

            outputEl.textContent = ordinalResult.toString();
            timeEl.textContent = `${(endTime - startTime).toFixed(3)} ms`;
            fEl.textContent = (legacyF(resultRep, fParams) - inputValue).toString();

        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            outputEl.textContent = `Error: ${message}`;
            console.error("Error during fInverse calculation:", e);
        }
