import { OperationTracer } from "../OperationTracer.js";
import { SimpleParser } from "../SimpleParser.js";
import type { OrdinalBase } from "../types/OrdinalBase.js";
import { CNFOrdinal } from "../types/CNFOrdinal.js";
import { WTowerOrdinal } from "../types/WTowerOrdinal.js";
import { f, fInverse, DEFAULT_F_PARAMS, OLD_F_PARAMS, convertFFormatToOrdinalInstance, convertOrdinalInstanceToFFormat } from "../ordinal_mapping/OrdinalMappingCompat.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import { requireElementById } from "./testUtils.js";

// Extracted from simplify_test.html

// Original <scripttype="module">

        initializeTestEnvironment(1_000_000);
        console.log('[Test] Simplify tests initialized');

        type TestKind = 'SIMPLIFY' | 'WTOWER' | 'COMPLEXITY' | 'MONOTONICITY' | 'INVERSE_MAPPING';

        type TestResult = {
            passed: boolean;
            detailsElements: HTMLElement[];
        };

        type TestStatsEntry = {
            total?: number;
            passed?: number;
            failed?: number;
            total_pairs?: number;
            passed_pairs?: number;
            failed_pairs?: number;
            containerId?: string;
            previewId?: string;
            summaryId?: string;
            results: TestResult[];
        };

        type TestStatsMap = Record<string, TestStatsEntry>;

        // Stats for each test kind
        const testStats: TestStatsMap = {
            SIMPLIFY: { total: 0, passed: 0, failed: 0, containerId: 'simplify-results-output', previewId: 'simplify-failed-preview', summaryId: 'simplify-summary', results: [] },
            WTOWER: { total: 0, passed: 0, failed: 0, containerId: 'wtower-results-output', previewId: 'wtower-failed-preview', summaryId: 'wtower-summary', results: [] },
            COMPLEXITY: { total: 0, passed: 0, failed: 0, containerId: 'complexity-results-output', previewId: 'complexity-failed-preview', summaryId: 'complexity-summary', results: [] },
            INVERSE_MAPPING: { total: 0, passed: 0, failed: 0, containerId: 'inverse-mapping-results-output', previewId: 'inverse-mapping-failed-preview', summaryId: 'inverse-mapping-summary', results: [] },
            MONOTONICITY: { total_pairs: 0, passed_pairs: 0, failed_pairs: 0, containerId: 'monotonicity-results-output', previewId: 'monotonicity-failed-preview', summaryId: 'monotonicity-summary', results: [] },
        };

        const successfulCNFTestResultsForMapping: Array<{
            input: string;
            ordinal: OrdinalBase;
            mappedValue: number;
            cnf: string;
        }> = [];

        function toCnfString(ordinalLike: OrdinalBase | { toDisplayString?: (...args: any[]) => string; toStringCNF?: () => string } | null | undefined): string {
            try {
                if (ordinalLike && typeof ordinalLike.toDisplayString === 'function') {
                    return ordinalLike.toDisplayString({ format: 'CNF' });
                }
                if (ordinalLike && typeof ordinalLike.toStringCNF === 'function') {
                    return ordinalLike.toStringCNF();
                }
            } catch (e) { /* fall back below */ }
            return String(ordinalLike);
        }

        const overallSummaryContainer = requireElementById<HTMLDivElement>('overall-summary-container');
        const overallStatusIndicatorDiv = requireElementById<HTMLDivElement>('overall-status-indicator');
        // Create a specific div for the lines in the overall summary if it doesn't exist
        let overallSummaryDetailsDiv = document.getElementById('overall-summary-details') as HTMLDivElement | null;
        if (!overallSummaryDetailsDiv) {
            overallSummaryDetailsDiv = document.createElement('div');
            overallSummaryDetailsDiv.id = 'overall-summary-details';
            // Insert it after overallStatusIndicatorDiv
            overallStatusIndicatorDiv.parentNode?.insertBefore(overallSummaryDetailsDiv, overallStatusIndicatorDiv.nextSibling);
        }

        // Generic logToPage, parentElement must be provided
        function logToPage(message: string, className = '', parentElement?: HTMLElement | null): void {
            if (!parentElement) {
                console.warn('logToPage called without parentElement for message:', message);
                return;
            }
            const entry = document.createElement('div');
            entry.textContent = message;
            if (className) entry.classList.add(className); // logToPage seems to expect single class, or needs same fix
            parentElement.appendChild(entry);
        }

        // Refactored addDetailElement for testOrdinalCalc
        function addDetailElement(text: string, classNameString = ''): void { // Renamed for clarity
            const p = document.createElement('p');
            p.textContent = text;
            p.classList.add('log-output'); // Base class for all test details

            if (classNameString) {
                const classes = classNameString.trim().split(/\s+/); // Split by any whitespace
                classes.forEach(cls => {
                    if (cls) { // Make sure token is not empty after split
                        p.classList.add(cls);
                    }
                });
            }
            outputElements.push(p);
        }

        // Refactored testOrdinalCalc
        function testOrdinalCalc(input: string, expectedCNF: string): void {
            testStats.SIMPLIFY.total++;
            const outputElements: HTMLElement[] = [];

            const addDetailElement = (text, classNameString = '') => {
                const p = document.createElement('p');
                p.textContent = text;
                p.classList.add('log-output');
                if (classNameString) {
                    const classes = classNameString.trim().split(/\s+/);
                    classes.forEach(cls => {
                        if (cls) { p.classList.add(cls); }
                    });
                }
                outputElements.push(p);
            };

            let overallTestPassed = false;
            let mainStatusMessage = '';
            let mainStatusClass = '';
            let calcResult;

            const fInverseThreshold = 1e-14;

            addDetailElement(`Input: "${input}"`);

            try {
                calcResult = calculateAndSimplify(input);

                if (calcResult.error) {
                    const actualOutput = calcResult.error;
                    addDetailElement(`Output (Error): "${actualOutput}"`, 'error-message');
                    overallTestPassed = (actualOutput === expectedCNF);
                    if (overallTestPassed) {
                        mainStatusMessage = `Status: PASSED (Expected Error Matched: "${expectedCNF}")`;
                        mainStatusClass = 'status-passed';
                    } else {
                        mainStatusMessage = `Status: FAILED. Expected: "${expectedCNF}", Got Error: "${actualOutput}"`;
                        mainStatusClass = 'status-failed';
                    }
                } else {
                    const originalOrdinalObject = calcResult.ordinalObject;
                    const actualCNF = calcResult.cnfString;
                    addDetailElement(`Output CNF: "${actualCNF}"`);

                    // --- BEGIN MODIFICATION ---
                    if (originalOrdinalObject && !calcResult.error) {
                        try {
                            const fFormattedOriginal = convertOrdinalInstanceToFFormat(originalOrdinalObject);
                            const mappedValue = f(fFormattedOriginal, DEFAULT_F_PARAMS);
                            successfulCNFTestResultsForMapping.push({
                                input: input,
                                ordinal: originalOrdinalObject,
                                mappedValue: mappedValue,
                                cnf: actualCNF
                            });
                        } catch (mapErr) {
                            addDetailElement(`Could not add to successfulCNFTestResultsForMapping: f() or conversion error - ${mapErr.message}`, 'error-message');
                        }
                    }
                    // --- END MODIFICATION ---

                    const cnfCheckPassed = (actualCNF === expectedCNF);
                    let fRoundTripCheckPassed = false;
                    const fTripDetailsLogs = [];

                    if (!originalOrdinalObject) {
                        fTripDetailsLogs.push("f()/fInverse()/f() Check: SKIPPED (originalOrdinalObject is null/undefined).");
                        overallTestPassed = cnfCheckPassed;
                    } else {
                        try {
                            if (typeof convertOrdinalInstanceToFFormat !== 'function') throw new Error("convertOrdinalInstanceToFFormat is not defined");
                            if (typeof f !== 'function') throw new Error("f function is not defined");
                            if (typeof fInverse !== 'function') throw new Error("fInverse function is not defined");
                            if (typeof convertFFormatToOrdinalInstance !== 'function') throw new Error("convertFFormatToOrdinalInstance is not defined");

                            const fFormattedOriginal = convertOrdinalInstanceToFFormat(originalOrdinalObject);
                            const mappedValueOriginal = f(fFormattedOriginal, DEFAULT_F_PARAMS);
                            fTripDetailsLogs.push(`f(original: "${actualCNF}") = ${mappedValueOriginal.toPrecision(15)}`);

                            const inverseMappedFFormat = fInverse(mappedValueOriginal, DEFAULT_F_PARAMS, fInverseThreshold);
                            const inverseOrdinalObject = convertFFormatToOrdinalInstance(inverseMappedFFormat);
                            const inverseCNFForLog = toCnfString(inverseOrdinalObject);
                            fTripDetailsLogs.push(`fInverse(${mappedValueOriginal.toPrecision(15)}) -> "${inverseCNFForLog}"`);

                            const fFormattedInverse = convertOrdinalInstanceToFFormat(inverseOrdinalObject);
                            const mappedValueOfInverse = f(fFormattedInverse, DEFAULT_F_PARAMS);
                            fTripDetailsLogs.push(`f(inverse: "${inverseCNFForLog}") = ${mappedValueOfInverse.toPrecision(15)}`);

                            const difference = Math.abs(mappedValueOriginal - mappedValueOfInverse);
                            fRoundTripCheckPassed = (difference < fInverseThreshold);

                            if (fRoundTripCheckPassed) {
                                fTripDetailsLogs.push(`f() Round Trip Check: PASSED. |f(orig) - f(fInv(f(orig)))| = ${difference.toExponential(5)} (threshold: ${fInverseThreshold})`);
                            } else {
                                fTripDetailsLogs.push(`f() Round Trip Check: FAILED. |f(orig) - f(fInv(f(orig)))| = ${difference.toExponential(5)} (threshold: ${fInverseThreshold})`);
                                fTripDetailsLogs.push(`  Original Ordinal: ${originalOrdinalObject.toString()}`);
                                fTripDetailsLogs.push(`  Inverse Ordinal:  ${inverseOrdinalObject.toString()}`);
                            }
                        } catch (err) {
                            fRoundTripCheckPassed = false;
                            const errMsg = `f()/fInverse()/f() Check: CRITICAL ERROR - ${err.message}`;
                            fTripDetailsLogs.push(errMsg);
                            console.error(`Critical error during f()/fInverse()/f() for input "${input}":`, err);
                        }
                        overallTestPassed = cnfCheckPassed && fRoundTripCheckPassed;
                    }

                    fTripDetailsLogs.forEach(detailMsg => {
                        let detailClass = 'log-output-detail';
                        if (detailMsg.includes("FAILED") || detailMsg.includes("ERROR")) detailClass += ' error-message status-failed-detail';
                        else if (detailMsg.includes("PASSED")) detailClass += ' status-passed-detail';
                        addDetailElement(detailMsg, detailClass);
                    });

                    if (overallTestPassed) {
                        mainStatusMessage = 'Status: PASSED (CNF & f-round-trip OK)';
                        mainStatusClass = 'status-passed';
                    } else {
                        mainStatusClass = 'status-failed';
                        if (!cnfCheckPassed && (!fRoundTripCheckPassed && originalOrdinalObject)) {
                            mainStatusMessage = `Status: FAILED. Expected CNF: "${expectedCNF}". f-round-trip check also failed.`;
                        } else if (!cnfCheckPassed) {
                            mainStatusMessage = `Status: FAILED. Expected CNF: "${expectedCNF}", Got: "${actualCNF}".`;
                            if (originalOrdinalObject) mainStatusMessage += " (f-round-trip check status was based on this incorrect CNF result).";
                        } else {
                            mainStatusMessage = `Status: FAILED. CNF OK ("${actualCNF}"), but f-round-trip check failed.`;
                        }
                    }
                }
            } catch (criticalError) {
                addDetailElement(`CRITICAL TEST ERROR: ${criticalError.message}`, 'error-message status-failed');
                console.error(`Critical error running testOrdinalCalc for input "${input}":`, criticalError);
                overallTestPassed = false;
                mainStatusMessage = 'Status: FAILED (Critical test execution error)';
                mainStatusClass = 'status-failed';
            }

            addDetailElement(mainStatusMessage, mainStatusClass);

            if (overallTestPassed) {
                testStats.SIMPLIFY.passed++;
            } else {
                testStats.SIMPLIFY.failed++;
            }
            testStats.SIMPLIFY.results.push({ passed: overallTestPassed, detailsElements: outputElements } as unknown as TestResult);
        }

        // --- MINIMALLY MODIFIED OTHER TEST FUNCTIONS ---
        function testWTowerOrdinal(description: string, height: number | bigint, expectedCNFString: string, budget = 10000000): void {
            testStats.WTOWER.total++;
            const outputElements: HTMLElement[] = [];
            const addDetailElement = (text: string, className = '') => {
                const p = document.createElement('p');
                p.textContent = text;
                p.classList.add('log-output');
                if (className) p.classList.add(className);
                outputElements.push(p);
            };

            OperationTracer.setGlobalTracer(budget);
            addDetailElement(`Test (WTower): ${description}`);

            let actualCNF = '';
            let statusMsg = '';
            let sClass = '';
            let currentTestPassed = false;
            let cnfOrdForMapping: OrdinalBase | null = null;

            try {
                const inst = new WTowerOrdinal(height);
                addDetailElement(`Input WTower: w^^${height}`);
                const cnfOrd = inst.toCNFOrdinal();
                cnfOrdForMapping = cnfOrd; // Store for mapping
                actualCNF = toCnfString(cnfOrd);

                if (actualCNF === expectedCNFString) {
                    currentTestPassed = true;
                    statusMsg = 'Status: PASSED';
                    sClass = 'status-passed';
                    if (typeof f === 'function' && typeof convertOrdinalInstanceToFFormat === 'function' && cnfOrdForMapping) {
                        try {
                            const fFormatted = convertOrdinalInstanceToFFormat(cnfOrdForMapping);
                            successfulCNFTestResultsForMapping.push({ input: `w^^${height}`, ordinal: cnfOrdForMapping, mappedValue: f(fFormatted, DEFAULT_F_PARAMS), cnf: actualCNF });
                        } catch (mapErr) {
                            addDetailElement(`Mapped Value f(α): Error - ${mapErr.message}`, 'error-message');
                        }
                    }
                } else {
                    statusMsg = `Status: FAILED. Exp: "${expectedCNFString}"`;
                    sClass = "status-failed";
                }
            } catch (e) {
                actualCNF = `Crit Error: ${e.message}`;
                statusMsg = `Status: FAILED (Crit Error). Exp: "${expectedCNFString}"`;
                sClass = "status-failed";
                console.error(`Crit WTower test "${description}":`, e);
            }

            if (currentTestPassed) {
                testStats.WTOWER.passed++;
            } else {
                testStats.WTOWER.failed++;
            }
            addDetailElement(`Actual CNF: "${actualCNF}"`);
            addDetailElement(statusMsg, sClass);
            testStats.WTOWER.results.push({ passed: currentTestPassed, detailsElements: outputElements });
        }

        function testOrdinalSimplify(description: string, inputStr: string, budget: number, expectedCNF: string, expectedRem: string, opBudget = 100000): void {
            testStats.SIMPLIFY.total++;
            const outputElements: HTMLElement[] = [];
            const addDetailElement = (text: string, className = '') => {
                const p = document.createElement('p');
                p.textContent = text;
                p.classList.add('log-output');
                if (className) p.classList.add(className);
                outputElements.push(p);
            };

            const tr = new OperationTracer(opBudget);
            addDetailElement(`Test (Simplify): ${description} [Budget: ${budget}]`);

            let actCNF = '', actRem = -1, sMsg = '', sCls = '', currentTestPassed = true, notes = [], simpG = 'N/A', originalOrdinalStr = 'N/A';

            try {
                // Use SimpleParser instead of OrdinalParser
                const parser = new SimpleParser(inputStr);
                const parseResult = parser.parse();
                
                // ParseResult is a union type - check if it's an OrdinalBase
                if (!parseResult || typeof parseResult.complexity !== 'function') {
                    throw new Error(`Expected ordinal, got ${typeof parseResult}`);
                }
                
                let origOrd = parseResult;
                originalOrdinalStr = toCnfString(origOrd); // Get string form for comparison
                addDetailElement(`Input Ordinal: "${inputStr}" (g=${origOrd.complexity()})`);
                
                const simpRes = origOrd.simplify(budget);
                let simpOrd = simpRes.simplifiedOrdinal;
                actRem = simpRes.remainingBudget;
                actCNF = toCnfString(simpOrd);
                simpG = simpOrd.complexity();

                if (actCNF !== expectedCNF) { currentTestPassed = false; notes.push(`CNF Mismatch: Got "${actCNF}", Exp "${expectedCNF}"`); }
                if (actRem !== expectedRem) { currentTestPassed = false; notes.push(`Budget Mismatch: Got ${actRem}, Exp ${expectedRem}`); }
                if (simpG > budget) { currentTestPassed = false; notes.push(`Sanity Fail: Simp g ${simpG} > budget ${budget}`); }

                // Perform comparison using string representations if simplify didn't error
                if (origOrd.compareTo(simpOrd) < 0) {
                    currentTestPassed = false;
                    notes.push(`Sanity Fail: Simp "${actCNF}" > orig "${originalOrdinalStr}"`);
                }

                if (currentTestPassed) { sMsg = 'Status: PASSED'; sCls = 'status-passed'; } else { sMsg = 'Status: FAILED'; sCls = 'status-failed'; }
            } catch (e) {
                currentTestPassed = false;
                actCNF = `Crit Error: ${e.message}`;
                sMsg = 'Status: FAILED (Crit Error)'; sCls = 'status-failed';
                console.error(`Crit simplify test "${description}":`, e);
            }

            if (currentTestPassed) testStats.SIMPLIFY.passed++; else testStats.SIMPLIFY.failed++;

            addDetailElement(`Simplified CNF: "${actCNF}" (g=${simpG})`);
            addDetailElement(`Remaining Budget: ${actRem}`);
            if (notes.length > 0) notes.forEach(n => addDetailElement(n, 'error-message'));
            addDetailElement(sMsg, sCls);
            testStats.SIMPLIFY.results.push({ passed: currentTestPassed, detailsElements: outputElements });
        }

        function testOrdinalComplexity(inputStr: string, expectedComp: number, opBudget = 100000): void {
            testStats.COMPLEXITY.total++;
            const outputElements: HTMLElement[] = [];
            const addDetailElement = (text, className = '') => {
                const p = document.createElement('p');
                p.textContent = text;
                p.classList.add('log-output');
                if (className) p.classList.add(className);
                outputElements.push(p);
            };
            addDetailElement(`Test (Complexity): "${inputStr}"`);

            let actComp = -1, sMsg = '', sCls = '', currentTestPassed = false;
            try {
                const tr = new OperationTracer(opBudget);
                const p = new OrdinalParser(inputStr, tr);
                let ord = p.parse();
                actComp = ord.complexity();
                if (actComp === expectedComp) {
                    currentTestPassed = true;
                    sMsg = 'Status: PASSED';
                    sCls = 'status-passed';
                } else {
                    sMsg = `Status: FAILED. Expected Comp: ${expectedComp}, Got: ${actComp}`;
                    sCls = "status-failed";
                }
            } catch (e) {
                actComp = -1; // Indicate error in actual complexity
                sMsg = `Status: FAILED (Crit Error: ${e.message}). Expected Comp: ${expectedComp}`;
                sCls = "status-failed";
                console.error(`Crit complexity test "${inputStr}":`, e);
            }

            if (currentTestPassed) testStats.COMPLEXITY.passed++; else testStats.COMPLEXITY.failed++;

            if (actComp !== -1) addDetailElement(`Actual Comp: ${actComp}`);
            addDetailElement(sMsg, sCls);
            testStats.COMPLEXITY.results.push({ passed: currentTestPassed, detailsElements: outputElements });
        }
        function testManualComplexity(desc: string, ordInst: OrdinalBase, exp: number): void {
            testStats.COMPLEXITY.total++;
            const outputElements: HTMLElement[] = [];
            const addDetailElement = (text: string, className = '') => { /* as above */ const p = document.createElement('p'); p.textContent = text; p.classList.add('log-output'); if (className) p.classList.add(className); outputElements.push(p); };
            addDetailElement(`Test (Manual Complexity): ${desc}`);
            let actualComplexity = -1;
            let currentTestPassed = false;
            let statusMsg = '';
            let statusClass = '';
            try {
                actualComplexity = ordInst.complexity();
                if (actualComplexity === exp) {
                    currentTestPassed = true;
                    statusMsg = 'Status: PASSED'; statusClass = 'status-passed';
                } else {
                    statusMsg = `Status: FAILED. Expected: ${exp}, Got: ${actualComplexity}`; statusClass = 'status-failed';
                }
            } catch (e) {
                statusMsg = `Status: FAILED (Error: ${e.message})`; statusClass = 'status-failed';
            }
            if (currentTestPassed) testStats.COMPLEXITY.passed++; else testStats.COMPLEXITY.failed++;
            if (actualComplexity !== undefined) addDetailElement(`Actual Complexity: ${actualComplexity}`);
            addDetailElement(statusMsg, statusClass);
            testStats.COMPLEXITY.results.push({ passed: currentTestPassed, detailsElements: outputElements });
        }
        function testManualSimplify(desc: string, ordInst: OrdinalBase, bud: number, expCNF: string, expRem: number): void {
            testStats.SIMPLIFY.total++;
            const outputElements: HTMLElement[] = [];
            const addDetailElement = (text: string, className = '') => { /* as above */ const p = document.createElement('p'); p.textContent = text; p.classList.add('log-output'); if (className) p.classList.add(className); outputElements.push(p); };
            addDetailElement(`Test (Manual Simplify): ${desc} [Budget: ${bud}]`);
            addDetailElement(`Input Ordinal (direct): ${toCnfString(ordInst)} (g=${ordInst.complexity()})`);
            let actualCNF = '';
            let actualRem = 0;
            let currentTestPassed = true;
            const notes: string[] = [];
            let statusMsg = '';
            let statusClass = '';
            let simpG: number | string = 'N/A';
            try {
                const simpRes = ordInst.simplify(bud, false);
                let simpOrd = simpRes.simplifiedOrdinal;
                actualRem = simpRes.remainingBudget;
                actualCNF = toCnfString(simpOrd);
                simpG = simpOrd.complexity();
                if (actualCNF !== expCNF) { currentTestPassed = false; notes.push(`CNF Mismatch: Got "${actualCNF}", Exp "${expCNF}"`); }
                if (actualRem !== expRem) { currentTestPassed = false; notes.push(`Budget Mismatch: Got ${actualRem}, Exp ${expRem}`); }
                if (simpG > bud) { currentTestPassed = false; notes.push(`Sanity Fail: Simp g ${simpG} > budget ${bud}`); }
                if (ordInst.compareTo(simpOrd) < 0) { currentTestPassed = false; notes.push(`Sanity Fail: Simp \"${actualCNF}\" > orig \"${toCnfString(ordInst)}\"`); }
                if (currentTestPassed) { statusMsg = 'Status: PASSED'; statusClass = 'status-passed'; } else { statusMsg = 'Status: FAILED'; statusClass = 'status-failed'; }
            } catch (e) {
                currentTestPassed = false;
                statusMsg = `Status: FAILED (Error: ${e.message})`; statusClass = 'status-failed';
            }
            if (currentTestPassed) testStats.SIMPLIFY.passed++; else testStats.SIMPLIFY.failed++;
            if (actualCNF !== undefined) addDetailElement(`Simplified CNF: "${actualCNF}" (g=${simpG})`);
            if (actualRem !== undefined) addDetailElement(`Remaining Budget: ${actualRem}`);
            if (notes.length > 0) notes.forEach(n => addDetailElement(n, 'error-message'));
            addDetailElement(statusMsg, statusClass);
            testStats.SIMPLIFY.results.push({ passed: currentTestPassed, detailsElements: outputElements });
        }

        // Helper function for fInverse test output formatting
        function formatFInverseOutput(result: unknown): string {
            if (typeof result === 'bigint') {
                return toCnfString(new CNFOrdinal(result));
            }
            if (result === "E0_TYPE") {
                return "e_0";
            }
            if (typeof result === 'object' && result !== null && result.type) {
                // This is the f-format. We need to convert it to an Ordinal instance then to string.
                // Assuming a function convertFFormatToOrdinalInstance exists (it was in ordinal_mapping_inverse.js)
                // If not, this part needs to be implemented or adjusted.
                try {
                    const ordinalInstance = convertFFormatToOrdinalInstance(result); // This function needs to be available
                    return toCnfString(ordinalInstance);
                } catch (e) {
                    console.error("Error converting f-format to ordinal for display:", result, e);
                    return "ErrorInConversion: " + JSON.stringify(result);
                }
            }
            if (typeof result === 'string') { // Might be an error message already
                return result;
            }
            return String(result); // Fallback
        }

        // Test function for fInverse
        function testFInverse(description: string, inputValue: number, expectedOutput: string | number, expectError = false): void {
            const kindKey = 'INVERSE_MAPPING';
            testStats[kindKey].total++;
            const outputElements: HTMLElement[] = [];

            const addDetailElement = (text: string, className = '') => {
                const p = document.createElement('p');
                p.textContent = text;
                p.classList.add('log-output');
                if (className) p.classList.add(className);
                outputElements.push(p);
            };

            let actualOutput: string | number | undefined;
            let statusClass = '';
            let statusMessage = '';
            let currentTestPassed = false;

            addDetailElement(`Test (fInverse): ${description}`);
            addDetailElement(`Input Value: ${inputValue}`);

            try {
                const rawResult = fInverse(inputValue, OLD_F_PARAMS);
                actualOutput = formatFInverseOutput(rawResult);

                if (expectError) {
                    // This case should not be reached if fInverse throws as expected.
                    // If fInverse did NOT throw, but we expected an error, it's a fail.
                    // However, fInverse throws directly, so this path means error was not thrown.
                    // The actual 'error string' comparison will happen in the catch block.
                    currentTestPassed = false; // Should have been caught by catch block
                    statusMessage = `Status: FAILED. Expected error "${expectedOutput}", but got regular output "${actualOutput}"`;
                    statusClass = "status-failed";
                } else {
                    if (actualOutput === expectedOutput) {
                        currentTestPassed = true;
                        statusMessage = 'Status: PASSED';
                        statusClass = 'status-passed';
                    } else {
                        currentTestPassed = false;
                        statusMessage = `Status: FAILED. Expected: "${expectedOutput}"`;
                        statusClass = "status-failed";
                    }
                }
            } catch (e) {
                actualOutput = `Error: ${e.message}`;
                if (expectError) {
                    // Compare error message string. For simplicity, we can check if e.message contains expectedOutput.
                    // For more precise matching, ensure expectedOutput is the exact error message or a well-defined part of it.
                    if (e.message.includes(expectedOutput)) {
                        currentTestPassed = true;
                        statusMessage = `Status: PASSED (Correctly caught error: "${e.message}")`;
                        statusClass = 'status-passed';
                    } else {
                        currentTestPassed = false;
                        statusMessage = `Status: FAILED. Expected error containing "${expectedOutput}", but got "${e.message}"`;
                        statusClass = 'status-failed';
                    }
                } else {
                    currentTestPassed = false;
                    statusMessage = `Status: FAILED (Unexpected Error). Expected: "${expectedOutput}"`;
                    statusClass = 'status-failed';
                }
                console.error(`Error during fInverse test "${description}":`, e);
            }

            if (currentTestPassed) {
                testStats[kindKey].passed++;
            } else {
                testStats[kindKey].failed++;
            }

            addDetailElement(`Actual Output: "${actualOutput}"`);
            addDetailElement(statusMessage, statusClass);
            testStats[kindKey].results.push({ passed: currentTestPassed, detailsElements: outputElements });
        }

        // Main test orchestrator
        function runAllTestsAndRender(): void {
            console.log("runAllTestsAndRender: Started");
            // Initialize/Clear all stats and containers
            for (const kindKey in testStats) {
                const kind = testStats[kindKey];
                kind.results = []; kind.total = 0; kind.passed = 0; kind.failed = 0;
                if (kindKey === 'MONOTONICITY') { kind.total_pairs = 0; kind.passed_pairs = 0; kind.failed_pairs = 0; }
                if (kind.summaryId) {
                    const summaryDiv = document.getElementById(kind.summaryId);
                    if (summaryDiv) {
                        summaryDiv.textContent = 'Pending...';
                    } else {
                        console.warn(`runAllTestsAndRender: summary element #${kind.summaryId} not found; skipping.`);
                    }
                }
                // const containerDiv = document.getElementById(kind.containerId);
                // if(containerDiv) containerDiv.innerHTML = ''; // DO NOT CLEAR THE MAIN CONTAINER HERE
            }
            successfulCNFTestResultsForMapping.length = 0;
            overallStatusIndicatorDiv.textContent = "Overall Status: Running tests...";
            overallStatusIndicatorDiv.className = 'status-overall-pending';
            if (overallSummaryDetailsDiv) overallSummaryDetailsDiv.innerHTML = '';



            // --- Simplify Tests (from original) ---
            console.log("runAllTestsAndRender: Starting Simplify tests...");
            // Finite Ordinals
            testOrdinalSimplify("Finite fits", "123", 10, "123", 7);
            testOrdinalSimplify("Finite does not fit, fallback to 0", "12345", 3, "0", 3);
            testOrdinalSimplify("Finite cannot fit 0", "123", 0, "0", 0);

            // EpsilonNaughtOrdinal
            testOrdinalSimplify("e_0 fits", "e_0", 5, "e_0", 2);
            testOrdinalSimplify("e_0 does not fit, fallback to 0", "e_0", 2, "0", 2);
            testOrdinalSimplify("e_0 cannot fit 0", "e_0", 0, "0", 0);

            // WTowerOrdinal (manual simplify tests from original)
            try {
                const tracer = new OperationTracer(100000);
                tracer; // tracer retained for budgeting side effects
                const wt0 = new WTowerOrdinal(0);
                const wt1 = new WTowerOrdinal(1);
                const wt2 = new WTowerOrdinal(2);
                testManualSimplify("w^^0 fits", wt0, 10, "w^^0", 6);
                testManualSimplify("w^^2 fits", wt2, 5, "w^^2", 1);
                testManualSimplify("w^^1 does not fit, fallback to 0", wt1, 3, "0", 3);
                testManualSimplify("w^^2 cannot fit 0", wt2, 0, "0", 0);
            } catch (e) {
                testStats.SIMPLIFY.failed++; testStats.SIMPLIFY.total++;
                const simplifyContainer = requireElementById<HTMLDivElement>(testStats.SIMPLIFY.containerId || '');
                if (simplifyContainer) {
                    logToPage("Error in manual WTower simplify tests setup (counted as SIMPLIFY failure): " + e.message, 'error-message', simplifyContainer);
                }
            }

            // CNFOrdinal - Sums (from original)
            testOrdinalSimplify("Sum: w+1 fits", "w+1", 10, "w+1", 7);
            testOrdinalSimplify("Sum: w+1 too small budget", "w+1", 2, "w", 1);
            testOrdinalSimplify("Sum: w*2+w+5, budget 7", "w*2+w+5", 7, "w*3+5", 2);
            testOrdinalSimplify("Sum: w*2+w+5, budget 5 (truncates last term)", "w*2+w+5", 5, "w*3+5", 0);
            testOrdinalSimplify("Sum: w*2+w+5, budget 4 (truncates more)", "w*2+w+5", 4, "w*3", 1);
            testOrdinalSimplify("Sum: w*2+w+5, budget 2 (truncates to first possible)", "w*2+w+5", 2, "w", 1);
            testOrdinalSimplify("Sum: w*2+w+5, budget 0", "w*2+w+5", 0, "0", 0);

            // CNFOrdinal - MPT Fallback to WTower (from original)
            testOrdinalSimplify("MPT: w^(w^w) fits", "w^(w^w)", 10, "w^(w^w)", 1);
            testOrdinalSimplify("MPT: w^(w^w) too costly, fallback WTower", "w^(w^w)", 8, "w^^3", 4);
            testOrdinalSimplify("MPT: w^(w^w) WTower fallback too costly, fallback 0", "w^(w^w)", 3, "0", 3);

            // CNFOrdinal - w^b*m rule (from original)
            testOrdinalSimplify("w^b*m: w^w*2, budget 10", "w^w*2", 10, "w^w*2", 3);
            testOrdinalSimplify("w^b*m: w^w*2, budget 8 (MPT fail for term)", "w^w*2", 8, "w^w*2", 1);
            testOrdinalSimplify("w^b*m: w^2*10, budget 10", "w^2*10", 10, "w^2*10", 2);
            testOrdinalSimplify("w^b*m: w^2*10, budget 7 (MPT fail for term)", "w^2*10", 7, "w^2", 2);

            testOrdinalSimplify("Skip MPTF interaction", "w^(w^2+w)", 10, "w^(w^2)", 1);

            testOrdinalSimplify("", "w^w^w^w^w^w^2", 15, "w^^6", 11);
            testOrdinalSimplify("", "w^^5", 15, "w^^5", 11);
            testOrdinalSimplify("", "w^(w^2*20+w*2+5)", 15, "w^(w^2*20+w)", 1);
            testOrdinalSimplify("", "w^(w^(w+100000)*20+w*2+5)", 15, "w^(w^w)", 6);
            testOrdinalSimplify("", "(w^(w^3*2+4)+w^2+100)*2", 15, "w^(w^3*2+4)*2", 0);
            testOrdinalSimplify("", "w^(w^3+10)+w*2+100000", 15, "w^(w^3+10)+w", 1);
            testOrdinalSimplify("", "w^(w^3)+w^22*2+10", 15, "w^(w^3)", 6);
            // --- End of Simplify Tests (as per original) ---

            // --- New Failing Tests ---
            testOrdinalSimplify("Sum: w*2+w+5, budget 2", "w*2+w+5", 2, "w", 1);
            testOrdinalSimplify("Test w^(w^2*20+w*2+5)", "w^(w^2*20+w*2+5)", 15, "w^(w^2*20+w)", 1);
            testOrdinalSimplify("Test w^(w^(w+100000)*20+w*2+5)", "w^(w^(w+100000)*20+w*2+5)", 15, "w^(w^w)", 6);
            testOrdinalSimplify("Test w^(w^3)+w^22*2+10", "w^(w^3)+w^22*2+10", 15, "w^(w^3)", 6);
            testOrdinalSimplify("MPT: w^(w^w) fallback 0", "w^(w^w)", 3, "0", 3);


            // --- Render all results ---
            renderAllKindResults();
            updateOverallPageSummary();

            // Add event listeners for collapsibles
            document.querySelectorAll<HTMLDetailsElement>('details.test-kind-section').forEach((detailsElement) => {
                detailsElement.addEventListener('toggle', () => {
                    const kindKey = detailsElement.id.replace('details-', '');
                    renderSingleKindOutput(kindKey);
                    // No need to call updateKindSummary here, it's done initially 
                    // and doesn't change based on collapse/expand, only on test re-runs.
                });
            });
            console.log("runAllTestsAndRender: Finished, event listeners attached.");
        }

        function renderSingleKindOutput(kindKey: string): void {
            const detailsElementForLog = document.getElementById('details-' + kindKey) as HTMLDetailsElement | null;
            console.log(`[${kindKey}] renderSingleKindOutput: START. Details open: ${detailsElementForLog ? detailsElementForLog.open : 'details_element_not_found'}`);
            const kindData = testStats[kindKey];
            const detailsElement = document.getElementById('details-' + kindKey) as HTMLDetailsElement | null;

            // Correctly select the preview container using its ID
            const previewContainer = kindData.previewId ? document.getElementById(kindData.previewId) as HTMLDivElement | null : null;
            // The main container for when 'details' is open (this is the div with class 'test-results-output')
            const mainResultsOutputContainer = kindData.containerId ? document.getElementById(kindData.containerId) as HTMLDivElement | null : null;
            // Inside mainResultsOutputContainer, there's a div with class 'passed-tests-container'
            // This will be used to hold ALL tests when the details section is expanded.
            const allTestsContainerWhenOpen = mainResultsOutputContainer?.querySelector('.passed-tests-container') as HTMLDivElement | null;

            if (!kindData) { console.error(`[${kindKey}] renderSingleKindOutput: kindData is missing.`); return; }
            if (!detailsElement) { console.warn(`[${kindKey}] renderSingleKindOutput: Details element #details-${kindKey} NOT FOUND.`); return; }
            if (!previewContainer) { console.error(`[${kindKey}] renderSingleKindOutput: previewContainer (#${kindData.previewId}) NOT FOUND.`); return; }
            if (!mainResultsOutputContainer) { console.error(`[${kindKey}] renderSingleKindOutput: Main results output container #${kindData.containerId} NOT FOUND.`); return; }
            if (!allTestsContainerWhenOpen) { console.error(`[${kindKey}] renderSingleKindOutput: allTestsContainerWhenOpen (.passed-tests-container) NOT FOUND within #${kindData.containerId}.`); return; } // Critical

            console.log(`[${kindKey}] renderSingleKindOutput: Clearing containers. Preview: ${previewContainer.id}, AllWhenOpen: ${allTestsContainerWhenOpen.id || 'N/A'}`);
            previewContainer.innerHTML = '';
            allTestsContainerWhenOpen.innerHTML = '';

            const isExpanded = detailsElement.open;
            let allKindResults = kindData.results || [];
            let failedTests = allKindResults.filter(result => !result.passed);
            let passedTests = allKindResults.filter(result => result.passed);

            console.log(`[${kindKey}] renderSingleKindOutput: Expanded: ${isExpanded}. Total: ${allKindResults.length}, Failed: ${failedTests.length}, Passed: ${passedTests.length}`);

            if (isExpanded) {
                // EXPANDED STATE: Show all tests (failed then passed) in allTestsContainerWhenOpen
                previewContainer.style.display = 'none'; // Hide the separate failed preview
                // mainResultsOutputContainer itself is part of <details>, so its display is handled by <details>
                // allTestsContainerWhenOpen is inside mainResultsOutputContainer

                if (allKindResults.length === 0) {
                    logToPage(`No ${kindKey} tests were run or recorded results.`, '', allTestsContainerWhenOpen);
                } else {
                    if (failedTests.length > 0) {
                        const failedHeader = document.createElement('h4');
                        failedHeader.textContent = `Failed ${kindKey} Tests:`;
                        failedHeader.className = 'status-failed';
                        allTestsContainerWhenOpen.appendChild(failedHeader);
                        failedTests.forEach((result) => {
                            const testCaseDiv = document.createElement('div');
                            testCaseDiv.className = 'test-case status-failed'; // Add status class for styling
                            result.detailsElements.forEach(element => testCaseDiv.appendChild(element.cloneNode(true)));
                            allTestsContainerWhenOpen.appendChild(testCaseDiv);
                        });
                    }
                    if (passedTests.length > 0) {
                        const passedHeader = document.createElement('h4');
                        passedHeader.textContent = `Passed ${kindKey} Tests:`;
                        passedHeader.className = 'status-passed';
                        allTestsContainerWhenOpen.appendChild(passedHeader);
                        passedTests.forEach((result) => {
                            const testCaseDiv = document.createElement('div');
                            testCaseDiv.className = 'test-case status-passed'; // Add status class for styling
                            result.detailsElements.forEach(element => testCaseDiv.appendChild(element.cloneNode(true)));
                            allTestsContainerWhenOpen.appendChild(testCaseDiv);
                        });
                    }
                    if (failedTests.length === 0 && passedTests.length > 0 && allKindResults.length > 0) {
                        // If only passed tests, and some tests exist, give a summary message.
                        // This might be redundant if headers are added as above. Consider if needed.
                        // logToPage(`All ${passedTests.length} ${kindKey} tests passed.`, 'status-passed', allTestsContainerWhenOpen);
                    }
                    if (failedTests.length === 0 && passedTests.length === 0 && allKindResults.length > 0) {
                        // This case implies results exist but neither failed nor passed, which is odd.
                        logToPage(`Found ${allKindResults.length} ${kindKey} results, but none are marked as passed or failed. Check test logic.`, 'error-message', allTestsContainerWhenOpen);
                    }
                }
            } else {
                // COLLAPSED STATE: Show only failed tests in previewContainer
                // mainResultsOutputContainer and its child allTestsContainerWhenOpen are hidden by <details> being closed.

                if (failedTests.length > 0) {
                    previewContainer.style.display = 'block'; // Ensure failed preview is visible
                    const failedPreviewHeader = document.createElement('h4');
                    failedPreviewHeader.textContent = `Failed ${kindKey} Tests (${failedTests.length} of ${allKindResults.length} total):`;
                    failedPreviewHeader.className = 'status-failed';
                    previewContainer.appendChild(failedPreviewHeader);

                    failedTests.forEach((result) => {
                        const testCaseDiv = document.createElement('div');
                        testCaseDiv.className = 'test-case status-failed'; // Add status class for styling
                        result.detailsElements.forEach(element => testCaseDiv.appendChild(element.cloneNode(true)));
                        previewContainer.appendChild(testCaseDiv);
                    });
                    // Add a note to expand for all tests
                    const expandNote = document.createElement('p');
                    expandNote.textContent = `(Expand to see all ${allKindResults.length} tests)`;
                    expandNote.style.fontStyle = 'italic';
                    previewContainer.appendChild(expandNote);

                } else if (allKindResults.length > 0) { // All passed
                    previewContainer.style.display = 'block';
                    const allPassedMessage = document.createElement('p');
                    allPassedMessage.textContent = `All ${passedTests.length} ${kindKey} tests passed.`;
                    allPassedMessage.className = 'status-passed';
                    previewContainer.appendChild(allPassedMessage);
                    // Add a note to expand for details
                    const expandNote = document.createElement('p');
                    expandNote.textContent = `(Expand to see details)`;
                    expandNote.style.fontStyle = 'italic';
                    previewContainer.appendChild(expandNote);
                } else { // No tests for this kind
                    previewContainer.style.display = 'block';
                    logToPage(`No ${kindKey} tests were run or recorded results.`, '', previewContainer);
                }
            }

            console.log(`[${kindKey}] renderSingleKindOutput: END.`);
        }

        function renderAllKindResults(): void {
            console.log("renderAllKindResults: Started");
            for (const kindKey in testStats) {
                console.log(`renderAllKindResults: Processing kind: ${kindKey}`);
                updateKindSummary(kindKey); // Update the summary line in the <summary> tag
                renderSingleKindOutput(kindKey); // Render the output based on initial (collapsed) state
            }
        }

        function updateKindSummary(kindKey: string): void {
            console.log(`updateKindSummary: Updating summary for ${kindKey}`);
            console.log(`Stats for ${kindKey}: Total=${(kindKey === 'MONOTONICITY' ? testStats[kindKey].total_pairs : testStats[kindKey].total)}, Passed=${(kindKey === 'MONOTONICITY' ? testStats[kindKey].passed_pairs : testStats[kindKey].passed)}, Failed=${(kindKey === 'MONOTONICITY' ? testStats[kindKey].failed_pairs : testStats[kindKey].failed)}`);
            const stats = testStats[kindKey];
            const summaryDiv = stats.summaryId ? document.getElementById(stats.summaryId) : null;
            if (summaryDiv) {
                let text = '';
                if (kindKey === 'MONOTONICITY') {
                    text = `Monotonicity: ${stats.total_pairs} pairs, ${stats.passed_pairs} passed, ${stats.failed_pairs} failed.`;
                    summaryDiv.className = stats.failed_pairs > 0 ? 'kind-summary status-failed' : 'kind-summary status-passed';
                } else {
                    text = `${kindKey} Tests: ${stats.total} run, ${stats.passed} passed, ${stats.failed} failed.`;
                    summaryDiv.className = stats.failed > 0 ? 'kind-summary status-failed' : 'kind-summary status-passed';
                }
                summaryDiv.textContent = text;
                summaryDiv.style.display = stats.total > 0 || stats.total_pairs > 0 ? 'block' : 'none';
            }
        }

        function updateOverallPageSummary(): void {
            console.log("updateOverallPageSummary: Started");
            let overallPass = true;
            let totalTestsActuallyRun = 0;
            overallSummaryDetailsDiv.innerHTML = ''; // Clear previous summary lines

            for (const kindKey in testStats) {
                const stats = testStats[kindKey];
                const numRunThisKind = kindKey === 'MONOTONICITY' ? stats.total_pairs : stats.total;
                totalTestsActuallyRun += numRunThisKind;

                if (numRunThisKind > 0) { // Only include kinds that ran tests in summary
                    const kindSummaryLineDiv = document.createElement('div');
                    kindSummaryLineDiv.className = 'summary-line';
                    if (kindKey === 'MONOTONICITY') {
                        kindSummaryLineDiv.textContent = `Monotonicity: ${stats.total_pairs} pairs, ${stats.passed_pairs} passed, ${stats.failed_pairs} failed.`;
                        if (stats.failed_pairs > 0) overallPass = false;
                    } else {
                        kindSummaryLineDiv.textContent = `${kindKey}: ${stats.total} run, ${stats.passed} passed, ${stats.failed} failed.`;
                        if (stats.failed > 0) overallPass = false;
                    }
                    overallSummaryDetailsDiv.appendChild(kindSummaryLineDiv);
                }
                updateKindSummary(kindKey);
            }

            if (overallPass && totalTestsActuallyRun > 0) {
                overallStatusIndicatorDiv.textContent = "ALL TESTS PASSED!";
                overallStatusIndicatorDiv.className = 'status-overall-pass';
            } else if (totalTestsActuallyRun === 0) {
                overallStatusIndicatorDiv.textContent = "No tests were run.";
                overallStatusIndicatorDiv.className = 'status-overall-pending';
            } else {
                overallStatusIndicatorDiv.textContent = "FAILURES DETECTED!";
                overallStatusIndicatorDiv.className = 'status-overall-fail';
            }
            console.log("updateOverallPageSummary: Completed");
        }

        function performSanityChecks(): void { // Refactored slightly for new stats structure
            console.log("performSanityChecks: Started");
            const kindKey = 'MONOTONICITY';
            const stats = testStats[kindKey];
            stats.total_pairs = 0; stats.passed_pairs = 0; stats.failed_pairs = 0; stats.results = [];

            const outputContainer = requireElementById<HTMLDivElement>(stats.containerId || ''); // Keep for reference, though direct logging is removed

            const numResults = successfulCNFTestResultsForMapping.length;
            const EPSILON = 1e-9;
            const fInverseThreshold = 1e-14;

            if (numResults < 2) {
                console.log("performSanityChecks: Completed (not enough results for pairwise comparison)");
                return;
            }
            stats.total_pairs = numResults * (numResults - 1) / 2;

            for (let i = 0; i < numResults; i++) {
                for (let j = i + 1; j < numResults; j++) {
                    const resA = successfulCNFTestResultsForMapping[i]; const resB = successfulCNFTestResultsForMapping[j];
                    const ordA = resA.ordinal; const ordB = resB.ordinal; const fA = resA.mappedValue; const fB = resB.mappedValue;
                    let detailMsg = `Comparing ("${resA.input}" -> ${resA.cnf}) vs ("${resB.input}" -> ${resB.cnf}):\n`;
                    let pairCheckPassed = true; const ordinalComparison = ordA.compareTo(ordB);
                    if (ordinalComparison < 0) {
                        detailMsg += `  Ord: A < B. Map: f(A)=${fA.toFixed(8)}, f(B)=${fB.toFixed(8)}. `;
                        if (!(fA < fB - EPSILON)) { pairCheckPassed = false; detailMsg += `Monotonicity FAIL (exp f(A) < f(B))`; } else { detailMsg += `Monotonicity PASS`; }
                    }
                    else if (ordinalComparison > 0) {
                        detailMsg += `  Ord: A > B. Map: f(A)=${fA.toFixed(8)}, f(B)=${fB.toFixed(8)}. `;
                        if (!(fA > fB + EPSILON)) { pairCheckPassed = false; detailMsg += `Monotonicity FAIL (exp f(A) > f(B))`; } else { detailMsg += `Monotonicity PASS`; }
                    }
                    else {
                        detailMsg += `  Ord: A == B. Map: f(A)=${fA.toFixed(8)}, f(B)=${fB.toFixed(8)}. `;
                        if (!(Math.abs(fA - fB) < EPSILON)) { pairCheckPassed = false; detailMsg += `Monotonicity FAIL (exp f(A) == f(B))`; } else { detailMsg += `Monotonicity PASS`; }
                    }

                    const pElement = document.createElement('p'); pElement.textContent = detailMsg; pElement.classList.add('log-output');
                    if (!pairCheckPassed) pElement.classList.add('comparison-fail');
                    stats.results.push({ passed: pairCheckPassed, detailsElements: [pElement] });

                    if (pairCheckPassed) stats.passed_pairs++; else stats.failed_pairs++;
                }
            }

            console.log("performSanityChecks: Completed");
            console.log("Current MONOTONICITY stats after checks:", JSON.stringify(testStats.MONOTONICITY));
        }

        runAllTestsAndRender();

        // --- Test Runner ---

        function calculateAndSimplify(expr: string): { cnfString: string; ordinalObject: OrdinalBase; error: null } | { error: unknown } {
            const result = calculateOrdinalCNF(expr);
            if (result.error) {
                return result;
            }
            // Use a generous budget to ensure canonical simplification like w^e_0 -> e_0 happens.
            const simplified = result.ordinalObject.simplify(1000);
            return {
                cnfString: toCnfString(simplified.simplifiedOrdinal),
                ordinalObject: simplified.simplifiedOrdinal,
                error: null
            };
        }

        function runTest(input: string, expected: string, simplifyOptions?: unknown): { pass: boolean; message: string } {
            testCount++;
            const startTime = performance.now();
            try {
                const result = calculateAndSimplify(input);

                if (result.error) {
                    return { pass: false, message: `Failed - Input: "${input}", Expected: "${expected}", Got Error: "${result.error}"` };
                }
                const resultStr = result.cnfString;

                if (resultStr === expected) {
                    return { pass: true, message: `Passed - Input: "${input}", Got: "${resultStr}"` };
                } else {
                    return { pass: false, message: `Failed - Input: "${input}", Expected: "${expected}", Got: "${resultStr}"` };
                }
            } catch (e) {
                return { pass: false, message: `Failed - Input: "${input}", Expected: "${expected}", Got Exception: "${e.message}"` };
            }
        }

        // --- Test Cases ---
        const testCases = [
            // ... existing code ...
        ];
