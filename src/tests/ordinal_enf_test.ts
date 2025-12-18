import { OperationTracer } from "../OperationTracer.js";
import { OPERATIONS } from "../operations/Operations.js";
import type { OrdinalBase } from "../types/OrdinalBase.js";
import { ENFOrdinal } from "../types/ENFOrdinal.js";
import { ENFTerm } from "../types/ENFTerm.js";
import { ENFFactor } from "../types/ENFFactor.js";
import { OmegaOrdinal } from "../types/OmegaOrdinal.js";
import { CNFOrdinal } from "../types/CNFOrdinal.js";
import { EpsilonZero } from "../types/EpsilonZero.js";
import { EpsilonNumber } from "../types/EpsilonNumber.js";
import { ZeroOrdinal } from "../types/ZeroOrdinal.js";
import { FiniteOrdinal } from "../types/FiniteOrdinal.js";
import { WTowerOrdinal } from "../types/WTowerOrdinal.js";
import { EpsilonTowerOrdinal } from "../types/EpsilonTowerOrdinal.js";
import { OneOrdinal } from "../types/OneOrdinal.js";
import { SimpleParser } from "../SimpleParser.js";
import { requireElementById } from "./testUtils.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import {
    ordinalLabels,
    expectedAdditionResults,
    expectedMultiplicationResults,
    expectedExponentiationResults,
} from "./data/ordinalEnfExpectedResults.js";

type MutationRecord = {
    index: number;
    original: string;
    current: string;
    ordinal?: unknown;
};

type MutationReport = {
    mutated: boolean;
    mutationCount: number;
    mutations: MutationRecord[];
};

let mutabilityTest: {
    checkMutations: () => MutationReport;
} | null = null;

type TestKind =
    | "BASIC"
    | "CONSTRUCTION"
    | "ADDITION"
    | "MULTIPLICATION"
    | "EXPONENTIATION"
    | "EPSILON_TOWER"
    | "TETRATION"
    | "RANDOM"
    | "ENF_CALC";

type TestResultEntry = {
    passed: boolean;
    node: HTMLElement | null;
};

type TestKindStats = {
    total: number;
    passed: number;
    failed: number;
    containerId: string;
    previewId: string;
    summaryId: string;
    results: TestResultEntry[];
};

const createKindStats = (config: {
    containerId: string;
    previewId: string;
    summaryId: string;
}): TestKindStats => ({
    total: 0,
    passed: 0,
    failed: 0,
    containerId: config.containerId,
    previewId: config.previewId,
    summaryId: config.summaryId,
    results: [],
});

// Extracted from ordinal_enf_test.html

// Original <scripttype="module">

        initializeTestEnvironment(2000000);
        console.log('[Test] ENF tests initialized');

        // Declare all variables and functions first, then run tests at the end
        const testStats: Record<TestKind, TestKindStats> = {
            BASIC: createKindStats({ containerId: 'basic-results-output', previewId: 'basic-failed-preview', summaryId: 'basic-summary' }),
            CONSTRUCTION: createKindStats({ containerId: 'construction-results-output', previewId: 'construction-failed-preview', summaryId: 'construction-summary' }),
            ADDITION: createKindStats({ containerId: 'addition-results-output', previewId: 'addition-failed-preview', summaryId: 'addition-summary' }),
            MULTIPLICATION: createKindStats({ containerId: 'multiplication-results-output', previewId: 'multiplication-failed-preview', summaryId: 'multiplication-summary' }),
            EXPONENTIATION: createKindStats({ containerId: 'exponentiation-results-output', previewId: 'exponentiation-failed-preview', summaryId: 'exponentiation-summary' }),
            EPSILON_TOWER: createKindStats({ containerId: 'epsilon-tower-results-output', previewId: 'epsilon-tower-failed-preview', summaryId: 'epsilon-tower-summary' }),
            TETRATION: createKindStats({ containerId: 'tetration-results-output', previewId: 'tetration-failed-preview', summaryId: 'tetration-summary' }),
            RANDOM: createKindStats({ containerId: 'random-results-output', previewId: 'random-failed-preview', summaryId: 'random-summary' }),
            ENF_CALC: createKindStats({ containerId: 'enf-calc-results-output', previewId: 'enf-calc-failed-preview', summaryId: 'enf-calc-summary' })
        };
        let CURRENT_KIND: TestKind = 'BASIC';
        let __renderScheduled = false;
        function scheduleRender(): void {
            if (__renderScheduled) return;
            __renderScheduled = true;
            setTimeout(() => {
                __renderScheduled = false;
                try {
                    renderAllKindResults();
                } catch (renderError) {
                    console.error('CRITICAL: renderAllKindResults failed:', renderError);
                    hasUnhandledErrors = true;
                }
                try {
                    updateOverallPageSummary();
                } catch (summaryError) {
                    console.error('CRITICAL: updateOverallPageSummary failed:', summaryError);
                    hasUnhandledErrors = true;
                }
            }, 0);
        }

        function recordTestResult(kindKey: TestKind, passed: boolean, containerNode: HTMLElement | null): void {
            const stats = testStats[kindKey];
            if (!stats) { console.warn('[ENF TEST] Unknown kindKey in recordTestResult:', kindKey); return; }
            stats.total++;
            if (passed) stats.passed++; else stats.failed++;
            stats.results.push({ passed, node: containerNode });
            console.log(`[DEBUG] Recorded test for ${kindKey}: passed=${passed}, total results now=${stats.results.length}`);
            scheduleRender();
        }

        // Wrapper function to safely execute test sections and ensure errors are recorded
        function executeTestSection(sectionName: string, testFunction: () => void): void {
            try {
                testFunction();
            } catch (error) {
                console.error(`CRITICAL ERROR in ${sectionName} test section:`, error);

                // Create error container
                const container = document.createElement('div');
                container.className = 'test-case';
                const title = document.createElement('h3');
                title.textContent = `${sectionName} - Critical Error`;
                container.appendChild(title);
                const p = document.createElement('p');
                p.className = 'log-output status-failed';
                p.textContent = `CRITICAL ERROR: ${error.message}`;
                container.appendChild(p);

                // Force record as failed
                try {
                    recordTestResult(CURRENT_KIND, false, container);
                } catch (recordError) {
                    console.error('CRITICAL: Failed to record error for', sectionName, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Manually update stats to ensure failure is recorded
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }

                // Set global error flag
                hasUnhandledErrors = true;
            }
        }

        function updateKindSummary(kindKey: TestKind): void {
            const stats = testStats[kindKey];
            const summaryDiv = document.getElementById(stats.summaryId);
            if (!summaryDiv) return;
            summaryDiv.textContent = `${kindKey} Tests: ${stats.total} run, ${stats.passed} passed, ${stats.failed} failed.`;
            summaryDiv.className = 'kind-summary ' + (stats.failed > 0 ? 'status-failed' : 'status-passed');
        }

        function renderSingleKindOutput(kindKey: TestKind): void {
            const stats = testStats[kindKey];
            if (!stats) return;
            const detailsElement = document.getElementById('details-' + kindKey) as HTMLDetailsElement | null;
            const previewContainer = document.getElementById(stats.previewId);
            const mainResultsOutputContainer = document.getElementById(stats.containerId);
            const allTestsContainerWhenOpen = mainResultsOutputContainer ? mainResultsOutputContainer.querySelector<HTMLElement>('.passed-tests-container') : null;

            console.log(`[DEBUG] renderSingleKindOutput(${kindKey}): stats.results.length=${stats.results.length}, isExpanded=${detailsElement?.open}`);
            if (!detailsElement || !previewContainer || !allTestsContainerWhenOpen) {
                console.warn(`[DEBUG] Missing elements for ${kindKey}: details=${!!detailsElement}, preview=${!!previewContainer}, container=${!!allTestsContainerWhenOpen}`);
                return;
            }

            previewContainer.innerHTML = '';
            allTestsContainerWhenOpen.innerHTML = '';

            const isExpanded = detailsElement.open;
            const failed = stats.results.filter(r => !r.passed);
            const passed = stats.results.filter(r => r.passed);

            if (isExpanded) {
                previewContainer.style.display = 'none';
                if (stats.results.length === 0) {
                    const p = document.createElement('p'); p.textContent = `No ${kindKey} tests recorded.`; allTestsContainerWhenOpen.appendChild(p);
                } else {
                    let htmlContent = '';
                    if (failed.length > 0) {
                        htmlContent += `<h4 class="status-failed">Failed ${kindKey} Tests:</h4>`;
                        failed.forEach(res => {
                            if (res.node) htmlContent += `<div class="test-case status-failed">${res.node.innerHTML}</div>`;
                        });
                    }
                    if (passed.length > 0) {
                        htmlContent += `<h4 class="status-passed">Passed ${kindKey} Tests:</h4>`;
                        passed.forEach(res => {
                            if (res.node) htmlContent += `<div class="test-case status-passed">${res.node.innerHTML}</div>`;
                        });
                    }
                    console.log(`[DEBUG] Setting innerHTML for ${kindKey} expanded view, length=${htmlContent.length}`);
                    allTestsContainerWhenOpen.innerHTML = htmlContent;
                }
            } else {
                if (failed.length > 0) {
                    previewContainer.style.display = 'block';
                    let htmlContent = `<h4 class="status-failed">Failed ${kindKey} Tests (${failed.length} of ${stats.results.length} total):</h4>`;
                    failed.forEach(res => {
                        if (res.node) htmlContent += `<div class="test-case status-failed">${res.node.innerHTML}</div>`;
                    });
                    htmlContent += `<p style="font-style: italic;">(Expand to see all ${stats.results.length} tests)</p>`;
                    previewContainer.innerHTML = htmlContent;
                } else if (stats.results.length > 0) {
                    previewContainer.style.display = 'block';
                    previewContainer.innerHTML = `
                        <p class="status-passed">All ${stats.results.length} ${kindKey} tests passed.</p>
                        <p style="font-style: italic;">(Expand to see details)</p>`;
                } else {
                    previewContainer.style.display = 'block';
                    previewContainer.innerHTML = `<p>No ${kindKey} tests recorded.</p>`;
                }
            }
        }

        function renderAllKindResults(): void {
            (Object.keys(testStats) as TestKind[]).forEach((key) => {
                updateKindSummary(key);
                renderSingleKindOutput(key);
            });
        }

        function updateOverallPageSummary(): void {
            const overallStatusIndicator = requireElementById<HTMLDivElement>('overall-status-indicator');
            const overallSummaryDetails = requireElementById<HTMLDivElement>('overall-summary-details');
            overallSummaryDetails.innerHTML = '';
            let overallPass = true; let totalRun = 0;
            let grandTotal = 0; let grandPassed = 0; let grandFailed = 0;
            (Object.keys(testStats) as TestKind[]).forEach((key) => {
                const stats = testStats[key];
                const num = stats.total;
                grandTotal += num;
                grandPassed += stats.passed;
                grandFailed += stats.failed;

                if (num > 0) {
                    const line = document.createElement('div'); line.className = 'summary-line';
                    line.textContent = `${key}: ${stats.total} run, ${stats.passed} passed, ${stats.failed} failed.`;
                    if (stats.failed > 0) overallPass = false;
                    overallSummaryDetails.appendChild(line);
                }
            });
            if (grandTotal === 0) { overallStatusIndicator.textContent = 'No tests were run.'; overallStatusIndicator.className = 'status-overall-pending'; return; }
            // Check for unhandled errors and force failure if any occurred
            const finalOverallPass = overallPass && !hasUnhandledErrors;
            if (finalOverallPass) {
                overallStatusIndicator.textContent = 'ALL TESTS PASSED!';
                overallStatusIndicator.className = 'status-overall-pass';
            } else {
                const errorSuffix = hasUnhandledErrors ? ' (INCLUDES UNHANDLED ERRORS)' : '';
                overallStatusIndicator.textContent = `FAILURES DETECTED! (${grandPassed} / ${grandTotal} passed)${errorSuffix}`;
                overallStatusIndicator.className = 'status-overall-fail';
            }
        }
        const testResults: boolean[] = [];
        let totalTests = 0;
        let passedTests = 0;

        function runComparisonTest(testName: string, ordinals: OrdinalBase[], expectedOrder: string[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';
            const title = document.createElement('h3');
            title.textContent = `Test: ${testName}`;
            container.appendChild(title);

            try {
                const sortedOrdinals = [...ordinals].sort((a, b) => a.compareTo(b));
                const sortedStrings = sortedOrdinals.map(o => o.toString());

                const passed = JSON.stringify(sortedStrings) === JSON.stringify(expectedOrder);

                const status = document.createElement('p');
                status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`;
                status.className = passed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                const originalOrderP = document.createElement('p');
                originalOrderP.className = 'log-output';
                originalOrderP.textContent = `Original Order: ${ordinals.map(o => o.toString()).join(', ')}`;
                container.appendChild(originalOrderP);

                const sortedOrderP = document.createElement('p');
                sortedOrderP.className = 'log-output';
                sortedOrderP.textContent = `Actual Sorted:  ${sortedStrings.join(', ')}`;
                container.appendChild(sortedOrderP);

                if (!passed) {
                    const expectedOrderP = document.createElement('p');
                    expectedOrderP.className = 'log-output status-failed';
                    expectedOrderP.textContent = `Expected Sorted: ${expectedOrder.join(', ')}`;
                    container.appendChild(expectedOrderP);
                } else {
                    passedTests++;
                }

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                console.error(`Error in test "${testName}":`, e);
            }
            const finalPassed = container.querySelector('.status-failed') === null;
            try { recordTestResult(CURRENT_KIND, finalPassed, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runAdditionTest(testName: string, ordA: OrdinalBase, ordB: OrdinalBase, expectedString: string): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';
            const title = document.createElement('h3');
            title.textContent = `Test: ${testName}`;
            container.appendChild(title);

            try {
                const result = ordA.add(ordB);
                const resultString = result.toString();
                const passed = resultString === expectedString;

                const status = document.createElement('p');
                status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`;
                status.className = passed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                const inputP = document.createElement('p');
                inputP.className = 'log-output';
                inputP.textContent = `Input: (${ordA.toString()}) + (${ordB.toString()})`;
                container.appendChild(inputP);

                const actualP = document.createElement('p');
                actualP.className = 'log-output';
                actualP.textContent = `Actual:   ${resultString}`;
                container.appendChild(actualP);

                if (!passed) {
                    const expectedP = document.createElement('p');
                    expectedP.className = 'log-output status-failed';
                    expectedP.textContent = `Expected: ${expectedString}`;
                    container.appendChild(expectedP);
                } else {
                    passedTests++;
                }

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                console.error(`Error in test "${testName}":`, e);
            }
            const finalPassed = container.querySelector('.status-failed') === null;
            try { recordTestResult(CURRENT_KIND, finalPassed, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runEqualityTest(testName: string, actualOrdinal: OrdinalBase, expectedOrdinal: OrdinalBase): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';
            const title = document.createElement('h3');
            title.textContent = `Test: ${testName}`;
            container.appendChild(title);

            try {
                const passed = actualOrdinal.equals(expectedOrdinal);
                const status = document.createElement('p');
                status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`;
                status.className = passed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                const actualP = document.createElement('p');
                actualP.className = 'log-output';
                actualP.textContent = `Actual:   ${actualOrdinal.toString()}`;
                container.appendChild(actualP);

                const expectedP = document.createElement('p');
                expectedP.className = passed ? 'log-output' : 'log-output status-failed';
                expectedP.textContent = `Expected: ${expectedOrdinal.toString()}`;
                container.appendChild(expectedP);

                if (passed) { passedTests++; }
            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                console.error(`Error in equality test "${testName}":`, e);
            }
            const finalPassed = container.querySelector('.status-failed') === null;
            try { recordTestResult(CURRENT_KIND, finalPassed, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runENFCalculationTest(testName: string, inputString: string, expectedString: string): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';
            const title = document.createElement('h3');
            title.textContent = `Test: ${testName}`;
            container.appendChild(title);

            const inputP = document.createElement('p');
            inputP.className = 'log-output';
            inputP.textContent = `Input: "${inputString}"`;
            container.appendChild(inputP);

            const expectError = expectedString.startsWith('Error:');
            let passed = false;

            try {
                // Parse and calculate using new architecture only
                OperationTracer.setGlobalTracer(10000000);
                const parser = new SimpleParser(inputString);
                const result = { ordinalObject: parser.parse() };

                if (result.error) {
                    // Got an error - check if we expected one
                    if (expectError) {
                        const actualError = result.error.startsWith('Error:') ? result.error : `Error: ${result.error}`;
                        passed = actualError === expectedString;

                        const actualP = document.createElement('p');
                        actualP.className = 'log-output';
                        actualP.textContent = `Actual:   "${actualError}"`;
                        container.appendChild(actualP);

                        if (!passed) {
                            const expectedP = document.createElement('p');
                            expectedP.className = 'log-output status-failed';
                            expectedP.textContent = `Expected: "${expectedString}"`;
                            container.appendChild(expectedP);
                        }
                    } else {
                        // Got unexpected error
                        passed = false;
                        const actualP = document.createElement('p');
                        actualP.className = 'log-output status-failed';
                        actualP.textContent = `Unexpected Error: "${result.error}"`;
                        container.appendChild(actualP);

                        const expectedP = document.createElement('p');
                        expectedP.className = 'log-output status-failed';
                        expectedP.textContent = `Expected: "${expectedString}"`;
                        container.appendChild(expectedP);
                    }
                } else {
                    // Got a successful result - check if we expected success
                    if (expectError) {
                        // Expected error but got success
                        passed = false;
                        const actualString = result.ordinalObject.toDisplayString
                            ? result.ordinalObject.toDisplayString({ format: 'ENF' })
                            : result.ordinalObject.toString();

                        const actualP = document.createElement('p');
                        actualP.className = 'log-output status-failed';
                        actualP.textContent = `Unexpected Success: "${actualString}"`;
                        container.appendChild(actualP);

                        const expectedP = document.createElement('p');
                        expectedP.className = 'log-output status-failed';
                        expectedP.textContent = `Expected: "${expectedString}"`;
                        container.appendChild(expectedP);
                    } else {
                        // Expected success and got success
                        const actualString = result.ordinalObject.toDisplayString
                            ? result.ordinalObject.toDisplayString({ format: 'ENF' })
                            : result.ordinalObject.toString();

                        const stringCheckPassed = actualString === expectedString;

                        const actualP = document.createElement('p');
                        actualP.className = 'log-output';
                        actualP.textContent = `Actual:   "${actualString}"`;
                        container.appendChild(actualP);

                        if (!stringCheckPassed) {
                            const expectedP = document.createElement('p');
                            expectedP.className = 'log-output status-failed';
                            expectedP.textContent = `Expected: "${expectedString}"`;
                            container.appendChild(expectedP);
                        }

                        // Round-trip test: parse the result string and check ordinal equality
                        let roundTripPassed = false;
                        let roundTripError = '';
                        try {
                            OperationTracer.setGlobalTracer(10000000);
                            const roundTripParser = new SimpleParser(actualString);
                            const roundTripOrdinal = roundTripParser.parse();

                            const B = result.ordinalObject;  // Original ordinal
                            const D = roundTripOrdinal;  // Re-parsed ordinal
                            roundTripPassed = B.equals(D);
                            if (!roundTripPassed) {
                                roundTripError = `Round-trip inequality: B="${B.toString()}" ≠ D="${D.toString()}"`;
                            }
                        } catch (e) {
                            roundTripError = `Round-trip exception: ${e.message}`;
                        }

                        const roundTripP = document.createElement('p');
                        roundTripP.className = 'log-output';
                        if (roundTripPassed) {
                            roundTripP.textContent = `Round-trip: PASSED (B = parse(string(B)))`;
                        } else {
                            roundTripP.textContent = `Round-trip: FAILED (${roundTripError})`;
                            roundTripP.classList.add('status-failed');
                        }
                        container.appendChild(roundTripP);

                        passed = stringCheckPassed && roundTripPassed;
                    }
                }

                const status = document.createElement('p');
                status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`;
                status.className = passed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                if (passed) {
                    passedTests++;
                }

            } catch (e) {
                // Handle exceptions - check if we expected an error
                if (expectError) {
                    const actualError = `Error: ${e.message}`;
                    passed = actualError === expectedString;

                    const actualP = document.createElement('p');
                    actualP.className = 'log-output';
                    actualP.textContent = `Actual:   "${actualError}"`;
                    container.appendChild(actualP);

                    if (!passed) {
                        const expectedP = document.createElement('p');
                        expectedP.className = 'log-output status-failed';
                        expectedP.textContent = `Expected: "${expectedString}"`;
                        container.appendChild(expectedP);
                    }

                    const status = document.createElement('p');
                    status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`;
                    status.className = passed ? 'status-passed' : 'status-failed';
                    container.appendChild(status);

                    if (passed) {
                        passedTests++;
                    }
                } else {
                    // Unexpected exception
                    const status = document.createElement('p');
                    status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                    status.className = 'status-failed';
                    container.appendChild(status);
                    console.error(`Error in ENF calculation test "${testName}":`, e);
                }
            }

            const finalPassed = container.querySelector('.status-failed') === null;
            try { recordTestResult(CURRENT_KIND, finalPassed, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runComprehensiveAdditionTest(ordinals: ENFOrdinal[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';
            const title = document.createElement('h3');
            title.textContent = 'Test: Comprehensive Pairwise Addition';
            container.appendChild(title);

            try {
                let allPassed = true;
                let failureCount = 0;
                const maxFailuresToShow = 5; // Limit output for readability

                // Verify ordinals match expected labels
                const actualLabels = ordinals.map(o => o.toString());
                const expectedLabelsMatch = JSON.stringify(actualLabels) === JSON.stringify(ordinalLabels);

                if (!expectedLabelsMatch) {
                    throw new Error(`Ordinal labels don't match expected. Expected: ${ordinalLabels.length} ordinals, got: ${actualLabels.length}`);
                }

                for (let i = 0; i < ordinals.length; i++) {
                    for (let j = 0; j < ordinals.length; j++) {
                        const result = ordinals[i].add(ordinals[j]);
                        const actualResult = result.toString();
                        const expectedResult = expectedAdditionResults[i][j];

                        if (actualResult !== expectedResult) {
                            allPassed = false;
                            failureCount++;

                            if (failureCount <= maxFailuresToShow) {
                                const failureP = document.createElement('p');
                                failureP.className = 'log-output status-failed';
                                failureP.textContent = `FAIL [${i},${j}]: (${ordinals[i].toString()}) + (${ordinals[j].toString()}) = ${actualResult}, expected ${expectedResult}`;
                                container.appendChild(failureP);
                            }
                        }
                    }
                }

                if (failureCount > maxFailuresToShow) {
                    const moreFailuresP = document.createElement('p');
                    moreFailuresP.className = 'log-output status-failed';
                    moreFailuresP.textContent = `... and ${failureCount - maxFailuresToShow} more failures (showing first ${maxFailuresToShow})`;
                    container.appendChild(moreFailuresP);
                }

                const status = document.createElement('p');
                status.textContent = allPassed ? 'Status: PASSED' : `Status: FAILED (${failureCount} out of ${ordinals.length * ordinals.length} additions failed)`;
                status.className = allPassed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                const summaryP = document.createElement('p');
                summaryP.className = 'log-output';
                summaryP.textContent = `Tested ${ordinals.length}×${ordinals.length} = ${ordinals.length * ordinals.length} pairwise additions`;
                container.appendChild(summaryP);

                if (allPassed) {
                    passedTests++;
                }

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in comprehensive addition test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runAdditionMonotonicityTest(ordinals: ENFOrdinal[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = 'Addition Monotonicity Sanity Test';
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = 'Testing: if b<c then a+b<a+c and b+a≤c+a for all entries in table';
            container.appendChild(description);

            try {
                let violations = 0;
                const violationMessages = [];

                // Test right monotonicity: if b < c then a + b < a + c
                for (let a = 0; a < ordinals.length; a++) {
                    for (let b = 0; b < ordinals.length; b++) {
                        for (let c = 0; c < ordinals.length; c++) {
                            if (b < c) { // b appears before c in sorted order, so b < c
                                const ab_result = expectedAdditionResults[a][b];
                                const ac_result = expectedAdditionResults[a][c];

                                const ab_ord = new SimpleParser(ab_result).parse();
                                const ac_ord = new SimpleParser(ac_result).parse();

                                if (ab_ord.compareTo(ac_ord) >= 0) {
                                    violations++;
                                    violationMessages.push(`Right monotonicity: ${ordinalLabels[a]}+${ordinalLabels[b]} = ${ab_result} should be < ${ordinalLabels[a]}+${ordinalLabels[c]} = ${ac_result}`);
                                }
                            }
                        }
                    }
                }

                // Test left monotonicity: if b ≤ c then b + a ≤ c + a
                for (let a = 0; a < ordinals.length; a++) {
                    for (let b = 0; b < ordinals.length; b++) {
                        for (let c = 0; c < ordinals.length; c++) {
                            if (b <= c) { // b appears before or at same position as c in sorted order
                                const ba_result = expectedAdditionResults[b][a];
                                const ca_result = expectedAdditionResults[c][a];

                                const ba_ord = new SimpleParser(ba_result).parse();
                                const ca_ord = new SimpleParser(ca_result).parse();

                                if (ba_ord.compareTo(ca_ord) > 0) {
                                    violations++;
                                    violationMessages.push(`Left monotonicity: ${ordinalLabels[b]}+${ordinalLabels[a]} = ${ba_result} should be ≤ ${ordinalLabels[c]}+${ordinalLabels[a]} = ${ca_result}`);
                                }
                            }
                        }
                    }
                }

                const status = document.createElement('p');
                if (violations === 0) {
                    status.textContent = 'Status: PASSED';
                    status.className = 'status-passed';
                    testResults.push(true);
                    passedTests++;
                } else {
                    status.textContent = `Status: FAILED (${violations} monotonicity violations)`;
                    status.className = 'status-failed';
                    testResults.push(false);

                    // Show first few violations
                    for (let i = 0; i < Math.min(5, violationMessages.length); i++) {
                        const violation = document.createElement('p');
                        violation.className = 'log-output';
                        violation.textContent = violationMessages[i];
                        container.appendChild(violation);
                    }
                    if (violationMessages.length > 5) {
                        const more = document.createElement('p');
                        more.className = 'log-output';
                        more.textContent = `... and ${violationMessages.length - 5} more violations`;
                        container.appendChild(more);
                    }
                }
                container.appendChild(status);

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in addition monotonicity test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runMultiplicationMonotonicityTest(ordinals: ENFOrdinal[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = 'Multiplication Monotonicity Sanity Test';
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = 'Testing: if b<c then a*b<a*c (for a>0) and b*a≤c*a for all entries in table';
            container.appendChild(description);

            try {
                let violations = 0;
                const violationMessages = [];

                // Test right monotonicity: if b < c then a * b < a * c (for a > 0)
                for (let a = 1; a < ordinals.length; a++) { // Skip a=0 since 0*anything = 0
                    for (let b = 0; b < ordinals.length; b++) {
                        for (let c = 0; c < ordinals.length; c++) {
                            if (b < c) { // b appears before c in sorted order, so b < c
                                const ab_result = expectedMultiplicationResults[a][b];
                                const ac_result = expectedMultiplicationResults[a][c];

                                const ab_ord = new SimpleParser(ab_result).parse();
                                const ac_ord = new SimpleParser(ac_result).parse();

                                if (ab_ord.compareTo(ac_ord) >= 0) {
                                    violations++;
                                    violationMessages.push(`Right monotonicity: ${ordinalLabels[a]}*${ordinalLabels[b]} = ${ab_result} should be < ${ordinalLabels[a]}*${ordinalLabels[c]} = ${ac_result}`);
                                }
                            }
                        }
                    }
                }

                // Test left monotonicity: if b ≤ c then b * a ≤ c * a
                for (let a = 0; a < ordinals.length; a++) {
                    for (let b = 0; b < ordinals.length; b++) {
                        for (let c = 0; c < ordinals.length; c++) {
                            if (b <= c) { // b appears before or at same position as c in sorted order
                                const ba_result = expectedMultiplicationResults[b][a];
                                const ca_result = expectedMultiplicationResults[c][a];

                                const ba_ord = new SimpleParser(ba_result).parse();
                                const ca_ord = new SimpleParser(ca_result).parse();

                                if (ba_ord.compareTo(ca_ord) > 0) {
                                    violations++;
                                    violationMessages.push(`Left monotonicity: ${ordinalLabels[b]}*${ordinalLabels[a]} = ${ba_result} should be ≤ ${ordinalLabels[c]}*${ordinalLabels[a]} = ${ca_result}`);
                                }
                            }
                        }
                    }
                }

                const status = document.createElement('p');
                if (violations === 0) {
                    status.textContent = 'Status: PASSED';
                    status.className = 'status-passed';
                    testResults.push(true);
                    passedTests++;
                } else {
                    status.textContent = `Status: FAILED (${violations} monotonicity violations)`;
                    status.className = 'status-failed';
                    testResults.push(false);

                    // Show first few violations
                    for (let i = 0; i < Math.min(5, violationMessages.length); i++) {
                        const violation = document.createElement('p');
                        violation.className = 'log-output';
                        violation.textContent = violationMessages[i];
                        container.appendChild(violation);
                    }
                    if (violationMessages.length > 5) {
                        const more = document.createElement('p');
                        more.className = 'log-output';
                        more.textContent = `... and ${violationMessages.length - 5} more violations`;
                        container.appendChild(more);
                    }
                }
                container.appendChild(status);

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in multiplication monotonicity test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runExponentiationMonotonicityTest(ordinals: ENFOrdinal[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = 'Exponentiation Monotonicity Sanity Test';
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = 'Testing: if b<c then a^b<a^c (for a>1) and if b≤c then b^a≤c^a (for a>0)';
            container.appendChild(description);

            try {
                let violations = 0;
                const violationMessages = [];

                // Right monotonicity in exponent: if b < c then a^b < a^c for a > 1
                for (let a = 0; a < ordinals.length; a++) {
                    if (ordinals[a].compareTo(OneOrdinal.instance()) <= 0) continue; // skip a <= 1
                    for (let b = 0; b < ordinals.length; b++) {
                        for (let c = 0; c < ordinals.length; c++) {
                            if (b < c) {
                                const ab = ordinals[a].power(ordinals[b]);
                                const ac = ordinals[a].power(ordinals[c]);
                                if (ab.compareTo(ac) >= 0) {
                                    violations++;
                                    violationMessages.push(`Right monotonicity: ${ordinalLabels[a]}^${ordinalLabels[b]} = ${ab.toString()} should be < ${ordinalLabels[a]}^${ordinalLabels[c]} = ${ac.toString()}`);
                                }
                            }
                        }
                    }
                }

                // Left monotonicity in base: if b ≤ c then b^a ≤ c^a for a > 0
                for (let a = 0; a < ordinals.length; a++) {
                    if (ordinals[a].isZero()) continue; // skip a = 0
                    for (let b = 0; b < ordinals.length; b++) {
                        for (let c = 0; c < ordinals.length; c++) {
                            if (b <= c) {
                                const ba = ordinals[b].power(ordinals[a]);
                                const ca = ordinals[c].power(ordinals[a]);
                                if (ba.compareTo(ca) > 0) {
                                    violations++;
                                    violationMessages.push(`Left monotonicity: ${ordinalLabels[b]}^${ordinalLabels[a]} = ${ba.toString()} should be ≤ ${ordinalLabels[c]}^${ordinalLabels[a]} = ${ca.toString()}`);
                                }
                            }
                        }
                    }
                }

                const status = document.createElement('p');
                if (violations === 0) {
                    status.textContent = 'Status: PASSED';
                    status.className = 'status-passed';
                    passedTests++;
                } else {
                    status.textContent = `Status: FAILED (${violations} monotonicity violations)`;
                    status.className = 'status-failed';

                    for (let i = 0; i < Math.min(5, violationMessages.length); i++) {
                        const violation = document.createElement('p');
                        violation.className = 'log-output';
                        violation.textContent = violationMessages[i];
                        container.appendChild(violation);
                    }
                    if (violationMessages.length > 5) {
                        const more = document.createElement('p');
                        more.className = 'log-output';
                        more.textContent = `... and ${violationMessages.length - 5} more violations`;
                        container.appendChild(more);
                    }
                }
                container.appendChild(status);

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                console.error('Error in exponentiation monotonicity test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runComprehensiveMultiplicationTest(ordinals: ENFOrdinal[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = 'Comprehensive Multiplication Test';
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = `Testing ${ordinals.length}×${ordinals.length} = ${ordinals.length * ordinals.length} pairwise multiplications against expected results`;
            container.appendChild(description);

            try {
                let allPassed = true;
                let failureCount = 0;

                for (let i = 0; i < ordinals.length; i++) {
                    for (let j = 0; j < ordinals.length; j++) {
                        const computed = ordinals[i].multiply(ordinals[j]);
                        const expected = expectedMultiplicationResults[i][j];

                        if (computed.toString() !== expected) {
                            allPassed = false;
                            failureCount++;

                            if (failureCount <= 5) { // Show first 5 failures
                                const failure = document.createElement('p');
                                failure.className = 'log-output';
                                failure.textContent = `FAIL: ${ordinalLabels[i]} * ${ordinalLabels[j]} = ${computed.toString()}, expected ${expected}`;
                                container.appendChild(failure);
                            }
                        }
                    }
                }

                if (failureCount > 5) {
                    const moreFailures = document.createElement('p');
                    moreFailures.className = 'log-output';
                    moreFailures.textContent = `... and ${failureCount - 5} more failures`;
                    container.appendChild(moreFailures);
                }

                const status = document.createElement('p');
                status.textContent = allPassed ? 'Status: PASSED' : `Status: FAILED (${failureCount} out of ${ordinals.length * ordinals.length} multiplications failed)`;
                status.className = allPassed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                const summaryP = document.createElement('p');
                summaryP.className = 'log-output';
                summaryP.textContent = `Tested ${ordinals.length}×${ordinals.length} = ${ordinals.length * ordinals.length} pairwise multiplications`;
                container.appendChild(summaryP);

                if (allPassed) {
                    testResults.push(true);
                    passedTests++;
                } else {
                    testResults.push(false);
                }

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in comprehensive multiplication test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runRandomTripleAssociativityAdditionTest(ordinals: ENFOrdinal[], sampleCount = 100): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = `Associativity of Addition on Random Triples (${sampleCount} samples)`;
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = 'Check (a+b)+c = a+(b+c) for randomly selected triples from the ordinal list.';
            container.appendChild(description);

            try {
                const n = ordinals.length;
                const triples = [];
                for (let s = 0; s < sampleCount; s++) {
                    const i = Math.floor(Math.random() * n);
                    const j = Math.floor(Math.random() * n);
                    const k = Math.floor(Math.random() * n);
                    triples.push([i, j, k]);
                }

                let failures = 0;
                const failureMessages = [];

                // Show up to 5 example triples tested
                const examplesToShow = Math.min(5, triples.length);
                for (let e = 0; e < examplesToShow; e++) {
                    const [i, j, k] = triples[e];
                    const a = ordinals[i], b = ordinals[j], c = ordinals[k];
                    const left = a.add(b).add(c);
                    const right = a.add(b.add(c));
                    const ex = document.createElement('p');
                    ex.className = 'log-output';
                    ex.textContent = `Example ${e + 1}: (${a.toString()}+${b.toString()})+${c.toString()} = ${left.toString()}  |  ${a.toString()}+(${b.toString()}+${c.toString()}) = ${right.toString()}`;
                    container.appendChild(ex);
                }

                for (let idx = 0; idx < triples.length; idx++) {
                    const [i, j, k] = triples[idx];
                    try {
                        // Reset global tracer to avoid budget conflicts
                        OperationTracer.setGlobalTracer(500000); // Fresh budget for each triple
                        const a = ordinals[i].clone(), b = ordinals[j].clone(), c = ordinals[k].clone();
                        const left = a.add(b).add(c);
                        const right = a.add(b.add(c));
                        if (!left.equals(right)) {
                            failures++;
                            if (failureMessages.length < 5) {
                                failureMessages.push(`FAIL @ [${i},${j},${k}] (${ordinalLabels[i]} , ${ordinalLabels[j]} , ${ordinalLabels[k]}): left=${left.toString()}, right=${right.toString()}`);
                            }
                        }
                    } catch (e) {
                        failures++;
                        if (failureMessages.length < 5) {
                            failureMessages.push(`ERROR @ [${i},${j},${k}] (${ordinalLabels[i]} , ${ordinalLabels[j]} , ${ordinalLabels[k]}): ${e.message}`);
                        }
                    }
                }

                if (failureMessages.length > 0) {
                    for (const msg of failureMessages) {
                        const p = document.createElement('p');
                        p.className = 'log-output status-failed';
                        p.textContent = msg;
                        container.appendChild(p);
                    }
                    if (failures > failureMessages.length) {
                        const more = document.createElement('p');
                        more.className = 'log-output status-failed';
                        more.textContent = `... and ${failures - failureMessages.length} more failures`;
                        container.appendChild(more);
                    }
                }

                const status = document.createElement('p');
                if (failures === 0) {
                    status.textContent = 'Status: PASSED';
                    status.className = 'status-passed';
                    testResults.push(true);
                    passedTests++;
                } else {
                    status.textContent = `Status: FAILED (${failures} of ${sampleCount} samples failed)`;
                    status.className = 'status-failed';
                    testResults.push(false);
                }
                container.appendChild(status);

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in associativity test (addition):', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runRandomTripleAlgebraRulesTest(ordinals: ENFOrdinal[], sampleCount = 100): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = `Algebraic Laws on Random Triples (${sampleCount} samples)`;
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = 'Rules checked per triple: (a*b)*c = a*(b*c); a*(b+c)=a*b+a*c; a^(b+c)=a^b*a^c; a^(b*c)=(a^b)^c';
            container.appendChild(description);

            try {
                const n = ordinals.length;
                const triples = [];
                for (let s = 0; s < sampleCount; s++) {
                    triples.push([
                        Math.floor(Math.random() * n),
                        Math.floor(Math.random() * n),
                        Math.floor(Math.random() * n)
                    ]);
                }

                // Show 5 example triples (by labels)
                for (let e = 0; e < Math.min(5, triples.length); e++) {
                    const [i, j, k] = triples[e];
                    const ex = document.createElement('p');
                    ex.className = 'log-output';
                    ex.textContent = `Example ${e + 1}: a=${ordinalLabels[i]}, b=${ordinalLabels[j]}, c=${ordinalLabels[k]}`;
                    container.appendChild(ex);
                }

                const lawResults = [
                    { key: 'mul_assoc', label: '(a*b)*c = a*(b*c)', failures: 0, messages: [] },
                    { key: 'left_dist', label: 'a*(b+c) = a*b + a*c', failures: 0, messages: [] },
                    { key: 'exp_add', label: 'a^(b+c) = a^b * a^c', failures: 0, messages: [] },
                    { key: 'exp_mul', label: 'a^(b*c) = (a^b)^c', failures: 0, messages: [] },
                ];

                for (let t = 0; t < triples.length; t++) {
                    const [i, j, k] = triples[t];
                    // Reset global tracer to avoid budget conflicts
                    OperationTracer.setGlobalTracer(500000); // Fresh budget for each triple
                    const a = ordinals[i].clone(), b = ordinals[j].clone(), c = ordinals[k].clone();
                    try {
                        // Multiplication associativity
                        const ab = a.multiply(b);
                        const bc = b.multiply(c);
                        const left_mul_assoc = ab.multiply(c);
                        const right_mul_assoc = a.multiply(bc);
                        if (!left_mul_assoc.equals(right_mul_assoc)) {
                            const entry = lawResults[0];
                            entry.failures++;
                            if (entry.messages.length < 5) entry.messages.push(`@ [${i},${j},${k}] ${entry.label} FAIL: left=${left_mul_assoc.toString()}, right=${right_mul_assoc.toString()}`);
                        }

                        // Left distributivity
                        const b_plus_c = b.add(c);
                        const left_left_dist = a.multiply(b_plus_c);
                        const right_left_dist = a.multiply(b).add(a.multiply(c));
                        if (!left_left_dist.equals(right_left_dist)) {
                            const entry = lawResults[1];
                            entry.failures++;
                            if (entry.messages.length < 5) entry.messages.push(`@ [${i},${j},${k}] ${entry.label} FAIL: left=${left_left_dist.toString()}, right=${right_left_dist.toString()}`);
                        }

                        // Exponent add law
                        const left_exp_add = a.power(b.add(c));
                        const right_exp_add = a.power(b).multiply(a.power(c));
                        if (!left_exp_add.equals(right_exp_add)) {
                            const entry = lawResults[2];
                            entry.failures++;
                            if (entry.messages.length < 5) entry.messages.push(`@ [${i},${j},${k}] ${entry.label} FAIL: left=${left_exp_add.toString()}, right=${right_exp_add.toString()}`);
                        }

                        // Exponent mul law
                        const left_exp_mul = a.power(b.multiply(c));
                        const right_exp_mul = a.power(b).power(c);
                        if (!left_exp_mul.equals(right_exp_mul)) {
                            const entry = lawResults[3];
                            entry.failures++;
                            if (entry.messages.length < 5) entry.messages.push(`@ [${i},${j},${k}] ${entry.label} FAIL: left=${left_exp_mul.toString()}, right=${right_exp_mul.toString()}`);
                        }
                    } catch (e) {
                        // Count as failures for the relevant operations if exception arises; attach generic error
                        const errMsg = `ERROR @ [${i},${j},${k}] (${ordinalLabels[i]}, ${ordinalLabels[j]}, ${ordinalLabels[k]}): ${e.message}`;
                        // Attribute error to a generic bucket (append to each for visibility)
                        for (const entry of lawResults) {
                            entry.failures++;
                            if (entry.messages.length < 5) entry.messages.push(errMsg);
                        }
                    }
                }

                // Report per-law results
                for (const entry of lawResults) {
                    const statusP = document.createElement('p');
                    const failed = entry.failures;
                    statusP.textContent = failed === 0
                        ? `Status: PASSED — ${entry.label}`
                        : `Status: FAILED — ${entry.label} (${failed} of ${sampleCount} samples failed)`;
                    statusP.className = failed === 0 ? 'status-passed' : 'status-failed';
                    container.appendChild(statusP);
                    for (const msg of entry.messages) {
                        const p = document.createElement('p');
                        p.className = 'log-output status-failed';
                        p.textContent = msg;
                        container.appendChild(p);
                    }
                }

                // Aggregate pass/fail for overall test accounting
                const anyFailures = lawResults.some(l => l.failures > 0);
                if (anyFailures) {
                    testResults.push(false);
                } else {
                    testResults.push(true);
                    passedTests++;
                }

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in algebraic laws test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function runComprehensiveExponentiationTest(ordinals: ENFOrdinal[]): void {
            totalTests++;
            const container = document.createElement('div');
            container.className = 'test-case';

            const titleH3 = document.createElement('h3');
            titleH3.textContent = 'Comprehensive Exponentiation Test';
            container.appendChild(titleH3);

            const description = document.createElement('p');
            description.className = 'log-output';
            description.textContent = `Testing ${ordinals.length}×${ordinals.length} = ${ordinals.length * ordinals.length} pairwise exponentiations against expected results`;
            container.appendChild(description);

            try {
                // Verify ordinals match expected labels
                const actualLabels = ordinals.map(o => o.toString());
                const expectedLabelsMatch = JSON.stringify(actualLabels) === JSON.stringify(ordinalLabels);
                if (!expectedLabelsMatch) {
                    throw new Error(`Ordinal labels don't match expected. Expected: ${ordinalLabels.length} ordinals, got: ${actualLabels.length}`);
                }

                let allPassed = true;
                let failureCount = 0;

                for (let i = 0; i < ordinals.length; i++) {
                    for (let j = 0; j < ordinals.length; j++) {
                        let computedStr;
                        try {
                            const computed = ordinals[i].power(ordinals[j]);
                            computedStr = computed.toString();
                        } catch (e) {
                            computedStr = `ERROR: ${e.message}`;
                            console.error(`Power calculation error for ${ordinalLabels[i]} ^ ${ordinalLabels[j]}:`, e);
                        }
                        const expected = expectedExponentiationResults[i][j];

                        if (computedStr !== expected) {
                            allPassed = false;
                            failureCount++;

                            if (failureCount <= 5) { // Show first 5 failures
                                const failure = document.createElement('p');
                                failure.className = 'log-output';
                                failure.textContent = `FAIL: ${ordinalLabels[i]} ^ ${ordinalLabels[j]} = ${computedStr}, expected ${expected}`;
                                container.appendChild(failure);
                            }
                        }
                    }
                }

                if (failureCount > 5) {
                    const moreFailures = document.createElement('p');
                    moreFailures.className = 'log-output';
                    moreFailures.textContent = `... and ${failureCount - 5} more failures`;
                    container.appendChild(moreFailures);
                }

                const status = document.createElement('p');
                status.textContent = allPassed ? 'Status: PASSED' : `Status: FAILED (${failureCount} out of ${ordinals.length * ordinals.length} exponentiations failed)`;
                status.className = allPassed ? 'status-passed' : 'status-failed';
                container.appendChild(status);

                if (allPassed) {
                    testResults.push(true);
                    passedTests++;
                } else {
                    testResults.push(false);
                }

            } catch (e) {
                const status = document.createElement('p');
                status.textContent = `Status: CRITICAL ERROR - ${e.message}`;
                status.className = 'status-failed';
                container.appendChild(status);
                testResults.push(false);
                console.error('Error in comprehensive exponentiation test:', e);
            }

            try { recordTestResult(CURRENT_KIND, container.querySelector('.status-failed') === null, container); } catch (recordError) {
                console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                document.getElementById('test-details-container').appendChild(container);
                // Force test section to be marked as failed
                if (testStats[CURRENT_KIND]) {
                    testStats[CURRENT_KIND].failed++;
                    testStats[CURRENT_KIND].total++;
                }
            }
        }

        function defineTests(): void {
            // Use global tracer - no need for local tracer
            OperationTracer.setGlobalTracer(2000000); // Ensure fresh budget for test definitions

            const enf_zero = new ENFOrdinal([]);
            const enf_one = new ENFOrdinal([new ENFTerm([], 1n)]);
            const enf_w = ENFOrdinal.fromCNF(OmegaOrdinal.instance());
            const enf_e0 = new ENFOrdinal([new ENFTerm([new ENFFactor(EpsilonZero.instance(), enf_one)], 1n)]);
            const e0_base = new EpsilonNumber(ZeroOrdinal.instance());
            const e1_base = new EpsilonNumber(OneOrdinal.instance());
            const w_cnf = OPERATIONS.convert(OmegaOrdinal.instance(), 'CNF');
            const one_cnf = OPERATIONS.convert(OneOrdinal.instance(), 'CNF');
            // Additional ordinals referenced in tests
            const ord_zero = enf_zero;
            const ord_one = enf_one;
            const ord_five = new ENFOrdinal([new ENFTerm([], 5n)]);
            const ord_w = enf_w;
            const ord_e0 = enf_e0;
            const ord_e0_plus_1 = OPERATIONS.add(enf_e0, enf_one);
            const ord_w_times_2 = OPERATIONS.multiply(enf_w, new FiniteOrdinal(2));
            const ord_w_plus_1 = OPERATIONS.add(enf_w, enf_one);
            const ord_w_squared = OPERATIONS.power(enf_w, new FiniteOrdinal(2));


            // Complex test cases
            const ord_w_w = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), OmegaOrdinal.instance())], 1n)]);
            const ord_w_w_plus_1 = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), OmegaOrdinal.instance())], 1n), new ENFTerm([], 1n)]);
            const ord_w_w_times_2 = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), OmegaOrdinal.instance())], 2n)]);
            const ord_w_w2 = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new SimpleParser("w^2").parse())], 1n)]);

            const ord_e0_plus_w = new ENFOrdinal([ord_e0.terms[0].clone(), ord_w.terms[0].clone()]);
            const ord_e0_plus_w_w = new ENFOrdinal([ord_e0.terms[0].clone(), ord_w_w.terms[0].clone()]);
            const ord_e0_times_2 = new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, enf_one)], 2n)]);
            const ord_e0_times_w = new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, enf_one), new ENFFactor(OmegaOrdinal.instance(), enf_one)], 1n)]);
            const ord_e0_squared = new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, new FiniteOrdinal(2))], 1n)]);

            const ord_e1 = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, enf_one)], 1n)]);
            const ord_e1_times_2 = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, enf_one)], 2n)]);
            const ord_e1_times_w = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, enf_one), new ENFFactor(OmegaOrdinal.instance(), enf_one)], 1n)]);
            const ord_e1_times_e0 = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, enf_one), new ENFFactor(e0_base, enf_one)], 1n)]);
            const ord_e2 = new ENFOrdinal([new ENFTerm([new ENFFactor(new EpsilonNumber(new FiniteOrdinal(2)), enf_one)], 1n)]);

            // --- Very Complex Test Case ---
            const ord_e0_pow_w = new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, ord_w)], 1n)]);
            // New ordinal: e_0^(w+1)
            const ord_e0_pow_w_plus_1 = (function () {
                const w_plus_1_cnf = new SimpleParser("w+1").parse();
                return new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, ENFOrdinal.fromCNF(w_plus_1_cnf))], 1n)]);
            })();
            const ord_e1_plus_e0 = new ENFOrdinal([ord_e1.terms[0].clone(), ord_e0.terms[0].clone()]);
            const ord_e_w_base = new EpsilonNumber(enf_w);
            const ord_e_w = new ENFOrdinal([new ENFTerm([new ENFFactor(ord_e_w_base, enf_one)], 1n)]);
            const ord_e_e0_base = new EpsilonNumber(ord_e0);
            const ord_e_e0 = new ENFOrdinal([new ENFTerm([new ENFFactor(ord_e_e0_base, enf_one)], 1n)]);
            const ord_e1_pow_e0 = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, ord_e0)], 1n)]);

            // Build w^3+2 as an ordinal: w^3 + 2
            const w_cubed_plus_2 = new ENFOrdinal([
                new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new FiniteOrdinal(3))], 1n),
                new ENFTerm([], 2n)
            ]);

            const multi_term_1 = new ENFOrdinal([
                new ENFTerm([new ENFFactor(e1_base, ord_w), new ENFFactor(e0_base, ord_five), new ENFFactor(OmegaOrdinal.instance(), w_cubed_plus_2)], 3n),
                new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new SimpleParser("w^2").parse())], 5n),
                new ENFTerm([], 10n)
            ]);
            const multi_term_2 = new ENFOrdinal([
                new ENFTerm([new ENFFactor(e1_base, ord_w), new ENFFactor(e0_base, ord_five), new ENFFactor(OmegaOrdinal.instance(), w_cubed_plus_2)], 2n)
            ]);


            // === MUTABILITY TEST SETUP ===
            console.log('[MUTABILITY] Setting up mutation detection...');

            // --- All Ordinals for Tables ---
            const allOrdinals = [
                ord_zero, ord_one, ord_five, ord_w, ord_w_plus_1, ord_w_times_2, ord_w_squared,
                ord_w_w, ord_w_w_plus_1, ord_w_w_times_2, ord_w_w2,
                ord_e0, ord_e0_plus_1, ord_e0_plus_w, ord_e0_plus_w_w, ord_e0_times_2, ord_e0_times_w, ord_e0_squared, ord_e0_pow_w, ord_e0_pow_w_plus_1,
                ord_e1, ord_e1_plus_e0, ord_e1_times_2, ord_e1_times_w, ord_e1_times_e0, ord_e1_pow_e0,
                ord_e2, ord_e_w, ord_e_e0,
                multi_term_1, multi_term_2
            ].sort((a, b) => a.compareTo(b));

            // Store immutable string representations for mutation detection
            const originalStrings = allOrdinals.map(ord => {
                try {
                    return ord.toString();
                } catch (error) {
                    console.error('[MUTABILITY] Error getting toString for ordinal:', error);
                    return `ERROR: ${error.message}`;
                }
            });

            console.log('[MUTABILITY] Captured', allOrdinals.length, 'ordinal string representations');
            console.log('[MUTABILITY] Sample strings:', originalStrings.slice(0, 5));

            // Store mutation detection data for debugging
            mutabilityTest = {
                ordinals: allOrdinals,
                originalStrings: originalStrings,
                checkMutations: function (): MutationReport {
                    console.log('[MUTABILITY] Checking for mutations...');
                    let mutationCount = 0;
                    const mutations: MutationRecord[] = [];

                    for (let i = 0; i < allOrdinals.length; i++) {
                        const ordinal = allOrdinals[i];
                        const originalString = originalStrings[i];

                        try {
                            const currentString = ordinal.toString();
                            if (currentString !== originalString) {
                                mutationCount++;
                                const mutation = {
                                    index: i,
                                    original: originalString,
                                    current: currentString,
                                    ordinal: ordinal
                                };
                                mutations.push(mutation);
                                console.error(`[MUTABILITY] MUTATION DETECTED at index ${i}:`, mutation);
                            }
                        } catch (error) {
                            mutationCount++;
                            const mutation = {
                                index: i,
                                original: originalString,
                                current: `ERROR: ${error.message}`,
                                ordinal: ordinal
                            };
                            mutations.push(mutation);
                            console.error(`[MUTABILITY] MUTATION ERROR at index ${i}:`, mutation);
                        }
                    }

                    if (mutationCount > 0) {
                        console.error(`[MUTABILITY] FOUND ${mutationCount} MUTATIONS!`);
                        hasUnhandledErrors = true;

                        // Create mutation report container
                        const mutationContainer = document.createElement('div');
                        mutationContainer.style.cssText = 'background: red; color: white; padding: 20px; margin: 20px; border-radius: 10px;';
                        mutationContainer.innerHTML = `
                            <h2>🚨 IMMUTABILITY VIOLATIONS DETECTED</h2>
                            <p><strong>${mutationCount} ordinal objects were mutated during testing!</strong></p>
                            <details>
                                <summary>Show Mutation Details</summary>
                                ${mutations.map(m => `
                                    <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1);">
                                        <strong>Index ${m.index}:</strong><br>
                                        Original: <code>${m.original}</code><br>
                                        Current: <code>${m.current}</code>
                                    </div>
                                `).join('')}
                            </details>
                        `;
                        document.body.appendChild(mutationContainer);

                        return {
                            mutated: true,
                            mutationCount,
                            mutations
                        };
                    }

                    console.log('[MUTABILITY] ✅ No mutations detected - all ordinals remain immutable!');
                    return {
                        mutated: false,
                        mutationCount: 0,
                        mutations: []
                    };
                }
            };

            // --- Construction Tests ---
            CURRENT_KIND = 'CONSTRUCTION';

            function runConstructionTest(testName: string, ordinal: OrdinalBase, expectedString: string): void {
                totalTests++;
                const container = document.createElement('div');
                container.className = 'test-case';
                const title = document.createElement('h3');
                title.textContent = `Construction: ${testName}`;
                container.appendChild(title);

                const actualString = ordinal.toString();
                const passed = actualString === expectedString;

                const actualP = document.createElement('p');
                actualP.className = 'log-output';
                actualP.textContent = `Actual:   "${actualString}"`;
                container.appendChild(actualP);

                if (!passed) {
                    const expectedP = document.createElement('p');
                    expectedP.className = 'log-output status-failed';
                    expectedP.textContent = `Expected: "${expectedString}"`;
                    container.appendChild(expectedP);
                } else {
                    passedTests++;
                }

                try { recordTestResult(CURRENT_KIND, passed, container); } catch (recordError) {
                    console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Force test section to be marked as failed
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }
            }

            // Basic ordinals
            runConstructionTest("Zero", ord_zero, "0");
            runConstructionTest("One", ord_one, "1");
            runConstructionTest("Five", ord_five, "5");
            runConstructionTest("Omega", ord_w, "w");
            runConstructionTest("Omega plus one", ord_w_plus_1, "w+1");
            runConstructionTest("Omega times two", ord_w_times_2, "w*2");
            runConstructionTest("Omega squared", ord_w_squared, "w^2");
            runConstructionTest("Epsilon zero", ord_e0, "e_0");
            runConstructionTest("Epsilon zero plus one", ord_e0_plus_1, "e_0+1");

            // Complex ordinals from Very Complex section
            runConstructionTest("e_0^w", ord_e0_pow_w, "e_0^w");
            runConstructionTest("e_1", ord_e1, "e_1");
            runConstructionTest("e_1+e_0", ord_e1_plus_e0, "e_1+e_0");
            runConstructionTest("e_1^e_0", ord_e1_pow_e0, "e_1^e_0");
            runConstructionTest("e_w", ord_e_w, "e_w");
            runConstructionTest("e_e_0", ord_e_e0, "e_e_0");

            // Omega powers
            runConstructionTest("w^w", ord_w_w, "w^w");
            runConstructionTest("w^w+1", ord_w_w_plus_1, "w^w+1");
            runConstructionTest("w^w*2", ord_w_w_times_2, "w^w*2");

            // Stress test parentheses - simple exponents
            const simple_exp_test = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new FiniteOrdinal(2))], 1n)]);
            runConstructionTest("w^2 (simple exponent)", simple_exp_test, "w^2");

            // Stress test parentheses - complex exponent with addition
            const complex_exp_test1 = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(),
                new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new FiniteOrdinal(2))], 1n), new ENFTerm([], 3n)]))], 1n)]);
            runConstructionTest("w^(w^2+3) (complex exponent)", complex_exp_test1, "w^(w^2+3)");

            // Stress test parentheses - exponent with coefficient
            const coeff_exp_test = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(),
                new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new FiniteOrdinal(2))], 3n)]))], 1n)]);
            runConstructionTest("w^(w^2*3) (exponent with coefficient)", coeff_exp_test, "w^(w^2*3)");

            // Stress test parentheses - exponent with multiple factors
            const multi_factor_exp_test = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(),
                new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, enf_one), new ENFFactor(e0_base, new FiniteOrdinal(2))], 1n)]))], 1n)]);
            runConstructionTest("w^(e_1*e_0^2) (exponent with multiple factors)", multi_factor_exp_test, "w^(e_1*e_0^2)");

            // Stress test parentheses - exponent with multiple factors AND coefficient
            const multi_factor_coeff_exp_test = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(),
                new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, enf_one), new ENFFactor(e0_base, new FiniteOrdinal(2))], 5n)]))], 1n)]);
            runConstructionTest("w^(e_1*e_0^2*5) (exponent with multiple factors and coefficient)", multi_factor_coeff_exp_test, "w^(e_1*e_0^2*5)");

            // Stress test parentheses - nested complex exponents
            const nested_exp_test = new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(),
                new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(),
                    new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), new FiniteOrdinal(2))], 1n), new ENFTerm([], 1n)]))], 1n)]))], 1n)]);
            runConstructionTest("w^(w^(w^2+1)) (nested complex exponents)", nested_exp_test, "w^w^(w^2+1)");

            // Test the problematic case from Very Complex section
            runConstructionTest("e_1^w*e_0^5*w^(w^3+2)*2", multi_term_2, "e_1^w*e_0^5*w^(w^3+2)*2");
            runConstructionTest("e_1^w*e_0^5*w^(w^3+2)*3+w^w^2*5+10", multi_term_1, "e_1^w*e_0^5*w^(w^3+2)*3+w^w^2*5+10");


            // --- Comparison Tests ---
            CURRENT_KIND = 'BASIC';

            runComparisonTest(

                "Basic Comparison",

                [ord_w_plus_1, ord_w, ord_five, ord_one, ord_zero, ord_w_times_2, ord_w_squared, ord_e0, ord_e0_plus_1],

                ["0", "1", "5", "w", "w+1", "w*2", "w^2", "e_0", "e_0+1"]

            );

            runComparisonTest(
                "Complex Comparison",
                [ord_e1_times_2, ord_e0_plus_w, ord_e0_squared, ord_e1_times_e0, ord_w_w_plus_1, ord_e1, ord_e2, ord_w_w_times_2, ord_e0_plus_1, ord_e0_times_w, ord_e1_times_w, ord_e0_plus_w_w, ord_w_w, ord_e0, ord_w_w2, ord_e0_times_2],
                ["w^w", "w^w+1", "w^w*2", "w^w^2", "e_0", "e_0+1", "e_0+w", "e_0+w^w", "e_0*2", "e_0*w", "e_0^2", "e_1", "e_1*2", "e_1*w", "e_1*e_0", "e_2"]
            );


            runComparisonTest(
                "Very Complex Comparison",
                [multi_term_2, ord_e_w, ord_e1, ord_e0_pow_w, multi_term_1, ord_e_e0, ord_e1_plus_e0, ord_e1_pow_e0],
                ["e_0^w", "e_1", "e_1+e_0", "e_1^w*e_0^5*w^(w^3+2)*2", "e_1^w*e_0^5*w^(w^3+2)*3+w^w^2*5+10", "e_1^e_0", "e_w", "e_e_0"]
            );

            // --- Addition Tests ---
            CURRENT_KIND = 'ADDITION';
            runAdditionTest("w + 1", ord_w, ord_one, "w+1");
            runAdditionTest("1 + w", ord_one, ord_w, "w");
            runAdditionTest("w*2 + w*3", ord_w_times_2, new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), enf_one)], 3n)]), "w*5");
            runAdditionTest("(w^2*3 + w*5) + (w*8 + 1)", new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), OPERATIONS.convert(new FiniteOrdinal(2), 'CNF'))], 3n), new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), enf_one)], 5n)]), new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), enf_one)], 8n), new ENFTerm([], 1n)]), "w^2*3+w*13+1");
            runAdditionTest("(w^2 + 5) + (w+3)", new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), OPERATIONS.convert(new FiniteOrdinal(2), 'CNF'))], 1n), new ENFTerm([], 5n)]), new ENFOrdinal([new ENFTerm([new ENFFactor(OmegaOrdinal.instance(), enf_one)], 1n), new ENFTerm([], 3n)]), "w^2+w+3");
            runAdditionTest("e_0 + w^w", ord_e0, ord_w_w, "e_0+w^w");
            runAdditionTest("w^w + e_0", ord_w_w, ord_e0, "e_0");

            // --- Targeted Regression: w^(e_1^(w+1)) should be e_1^e_1^(w+1) ---
            CURRENT_KIND = 'EXPONENTIATION';
            try {
                const exp_w_plus_1 = new SimpleParser("w+1").parse();
                const e1_pow_w_plus_1 = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, ENFOrdinal.fromCNF(exp_w_plus_1))], 1n)]);
                const actual = enf_w.power(e1_pow_w_plus_1);
                const expected = new ENFOrdinal([new ENFTerm([new ENFFactor(e1_base, e1_pow_w_plus_1)], 1n)]);

                // Probe division behavior used by power split: x from b.ordinalDivision(rank(b))
                const k_rank = e1_pow_w_plus_1.rank();
                const split = e1_pow_w_plus_1.ordinalDivision(k_rank);
                const probe = document.createElement('p');
                probe.className = 'log-output';
                probe.textContent = `Probe: rank(b)=${k_rank.toString()}, quotient x=${split.quotient.toString()}, remainder r=${split.remainder.toString()}`;
                const container = document.createElement('div');
                container.className = 'test-case';
                const t = document.createElement('h3'); t.textContent = 'Regression Probe: division in power'; container.appendChild(t);
                container.appendChild(probe);
                try { recordTestResult(CURRENT_KIND, true, container); } catch (recordError) {
                    console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Force test section to be marked as failed
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }

                runEqualityTest("Regression: w^(e_1^(w+1))", actual, expected);
            } catch (e) {
                const container = document.createElement('div');
                container.className = 'test-case';
                const title = document.createElement('h3');
                title.textContent = 'Regression setup error';
                container.appendChild(title);
                const p = document.createElement('p');
                p.className = 'log-output status-failed';
                p.textContent = e.message;
                container.appendChild(p);
                try { recordTestResult(CURRENT_KIND, false, container); } catch (recordError) {
                    console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Force test section to be marked as failed
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }
            }

            // --- EpsilonTowerOrdinal Tests ---
            CURRENT_KIND = 'EPSILON_TOWER';
            try {
                const k0_cnf = CNFOrdinal.ZEROStatic().clone();
                const epsTower0 = new EpsilonTowerOrdinal(k0_cnf, 0);
                const epsTower1 = new EpsilonTowerOrdinal(k0_cnf, 1);
                const epsTower2 = new EpsilonTowerOrdinal(k0_cnf, 2);

                // Check ENF conversion matches recursion: e_0^^0 = 1
                runEqualityTest("EpsTower: e_0^^0 = 1", epsTower0.toENFOrdinal(), enf_one);

                // e_0^^1 = e_0
                const e0_enf = new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, enf_one)], 1n)]);
                runEqualityTest("EpsTower: e_0^^1 = e_0", epsTower1.toENFOrdinal(), e0_enf);

                // e_0^^2 = e_0^e_0
                const e0_pow_e0 = e0_enf.power(e0_enf);
                runEqualityTest("EpsTower: e_0^^2 = e_0^e_0", epsTower2.toENFOrdinal(), e0_pow_e0);

                // String representation: e_0^^n
                (function () {
                    const container = document.createElement('div');
                    container.className = 'test-case';
                    const title = document.createElement('h3');
                    title.textContent = 'EpsTower: String Representation';
                    container.appendChild(title);
                    const str0 = epsTower0.toDisplayString ? epsTower0.toDisplayString() : epsTower0.toString();
                    const str1 = epsTower1.toDisplayString ? epsTower1.toDisplayString() : epsTower1.toString();
                    const str2 = epsTower2.toDisplayString ? epsTower2.toDisplayString() : epsTower2.toString();
                    const ok = (str0 === 'e_0^^0') && (str1 === 'e_0^^1') && (str2 === 'e_0^^2');
                    const p0 = document.createElement('p'); p0.className = 'log-output'; p0.textContent = `e_0^^0 -> ${str0}`; container.appendChild(p0);
                    const p1 = document.createElement('p'); p1.className = 'log-output'; p1.textContent = `e_0^^1 -> ${str1}`; container.appendChild(p1);
                    const p2 = document.createElement('p'); p2.className = 'log-output'; p2.textContent = `e_0^^2 -> ${str2}`; container.appendChild(p2);
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) { passedTests++; } else { /* count in total only */ }
                    totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // Special-case power: e_0^(e_0^^n) = e_0^^(n+1)
                const base_e0_cnf = EpsilonZero.instance();
                const lhs = base_e0_cnf.power(new EpsilonTowerOrdinal(k0_cnf, 2));
                const rhs = new EpsilonTowerOrdinal(k0_cnf, 3);
                runEqualityTest("EpsTower: e_0^(e_0^^2) = e_0^^3", lhs, rhs);

            } catch (e) {
                const container = document.createElement('div');
                container.className = 'test-case';
                const title = document.createElement('h3');
                title.textContent = 'EpsTower setup error';
                container.appendChild(title);
                const p = document.createElement('p');
                p.className = 'log-output status-failed';
                p.textContent = e.message;
                container.appendChild(p);
                try { recordTestResult(CURRENT_KIND, false, container); } catch (recordError) {
                    console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Force test section to be marked as failed
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }
            }

            // --- EpsilonTowerOrdinal (complex k and arithmetic via ENF conversion) ---
            try {
                // k = 1
                const k1 = CNFOrdinal.ONEStatic().clone();
                const e1_t3 = new EpsilonTowerOrdinal(k1, 3);
                const e1_base_enf = ENFOrdinal.fromCNF(new EpsilonNumber(k1));
                const e1_pow2 = e1_base_enf.power(e1_base_enf);
                const e1_pow3 = e1_base_enf.power(e1_pow2);
                runEqualityTest("EpsTower(k=1): e_1^^3 = e_1^(e_1^e_1)", e1_t3.toENFOrdinal(), e1_pow3);
                // Addition example: e_1^^3 + w
                const add_enf = e1_t3.toENFOrdinal().add(enf_w);
                const expected_add_enf = e1_pow3.add(enf_w);
                runEqualityTest("EpsTower(k=1): (e_1^^3)+w equals (e_1^(e_1^e_1))+w", add_enf, expected_add_enf);

                // k = w
                const kw = CNFOrdinal.OMEGAStatic().clone();
                const ew_t2 = new EpsilonTowerOrdinal(kw, 2);
                const ew_base_enf = ENFOrdinal.fromCNF(new EpsilonNumber(kw));
                const ew_pow2 = ew_base_enf.power(ew_base_enf);
                runEqualityTest("EpsTower(k=w): e_w^^2 = e_w^e_w", ew_t2.toENFOrdinal(), ew_pow2);
                // Multiplication by 2 (finite)
                const mult2_enf = ew_t2.toENFOrdinal().multiply(new FiniteOrdinal(2));
                const expected_mult2_enf = ew_pow2.multiply(new FiniteOrdinal(2));
                runEqualityTest("EpsTower(k=w): (e_w^^2)*2 equals (e_w^e_w)*2", mult2_enf, expected_mult2_enf);

                // k = (w+1)
                const k_w_plus_1_cnf = new SimpleParser("w+1").parse();
                const e_w1_t2 = new EpsilonTowerOrdinal(k_w_plus_1_cnf, 2);
                const e_w1_base_enf = ENFOrdinal.fromCNF(new EpsilonNumber(k_w_plus_1_cnf));
                const e_w1_pow2 = e_w1_base_enf.power(e_w1_base_enf);
                runEqualityTest("EpsTower(k=w+1): e_(w+1)^^2 = e_(w+1)^e_(w+1)", e_w1_t2.toENFOrdinal(), e_w1_pow2);
                // String check for parenthesized index
                (function () {
                    const container = document.createElement('div');
                    container.className = 'test-case';
                    const title = document.createElement('h3');
                    title.textContent = 'EpsTower(k=w+1): String Representation';
                    container.appendChild(title);
                    const s = e_w1_t2.toDisplayString ? e_w1_t2.toDisplayString() : e_w1_t2.toString();
                    const ok = (s === 'e_(w+1)^^2');
                    const p = document.createElement('p'); p.className = 'log-output'; p.textContent = `e_(w+1)^^2 -> ${s}`; container.appendChild(p);
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) { passedTests++; } else { /* count only */ }
                    totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // k = e_0 (so base is e_{e_0})
                const k_e0 = EpsilonZero.instance();
                const e_e0_t2 = new EpsilonTowerOrdinal(k_e0, 2);
                const e_e0_base_enf = ENFOrdinal.fromCNF(new EpsilonNumber(k_e0));
                const e_e0_pow2 = OPERATIONS.power(e_e0_base_enf, e_e0_base_enf);
                runEqualityTest("EpsTower(k=e_0): e_e_0^^2 = e_e_0^e_e_0", e_e0_t2.toENFOrdinal(), e_e0_pow2);
            } catch (e) {
                const container = document.createElement('div');
                container.className = 'test-case';
                const title = document.createElement('h3');
                title.textContent = 'EpsTower complex/arithmetic setup error';
                container.appendChild(title);
                const p = document.createElement('p');
                p.className = 'log-output status-failed';
                p.textContent = e.message;
                container.appendChild(p);
                try { recordTestResult(CURRENT_KIND, false, container); } catch (recordError) {
                    console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Force test section to be marked as failed
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }
            }

            // --- Extended tetration rules tests ---
            CURRENT_KIND = 'TETRATION';
            try {
                // 0^^n parity (finite n)
                const zero = CNFOrdinal.ZEROStatic().clone();
                const one = CNFOrdinal.ONEStatic().clone();
                const two = CNFOrdinal.fromInt(2);
                function expectEqual(title: string, a: OrdinalBase, b: OrdinalBase): void {
                    runEqualityTest(title, a, b);
                }
                expectEqual('0^^0 = 1', zero.tetrate(CNFOrdinal.fromInt(0)), one);
                expectEqual('0^^1 = 0', zero.tetrate(CNFOrdinal.fromInt(1)), zero);
                expectEqual('0^^2 = 1', zero.tetrate(CNFOrdinal.fromInt(2)), one);

                // 0^^(infinite) should error
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = '0^^w throws'; container.appendChild(title);
                    let passed = false;
                    try {
                        zero.tetrate(CNFOrdinal.OMEGAStatic().clone());
                        // If no error thrown, test failed
                        passed = false;
                    } catch (expectedError) {
                        // Error was expected, so test passed
                        passed = true;
                        console.log('Expected tetration error caught:', expectedError.message);
                    }
                    const status = document.createElement('p'); status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`; status.className = passed ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (passed) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, passed, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // 1^^k = 1 (finite and infinite)
                expectEqual('1^^5 = 1', one.tetrate(CNFOrdinal.fromInt(5)), one);
                expectEqual('1^^w = 1', one.tetrate(CNFOrdinal.OMEGAStatic().clone()), one);

                // m>1 ^^ infinite -> w
                expectEqual('2^^w = w', CNFOrdinal.fromInt(2).tetrate(CNFOrdinal.OMEGAStatic().clone()), CNFOrdinal.OMEGAStatic().clone());

                // w^^n threshold (n>10 -> WTower)
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = 'w^^11 produces WTower'; container.appendChild(title);
                    const omega = OmegaOrdinal.instance();
                    const eleven = new FiniteOrdinal(11);
                    const res = omega.tetrate(eleven);
                    const ok = (typeof WTowerOrdinal !== 'undefined') && (res instanceof WTowerOrdinal) && res.height === 11n;
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // e_k^^n threshold (n>10 -> EpsilonTower)
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = 'e_0^^11 produces EpsilonTower'; container.appendChild(title);
                    const e0 = EpsilonZero.instance();
                    const eleven = new FiniteOrdinal(11);
                    const res = e0.tetrate(eleven);
                    let ok = false;
                    if (typeof EpsilonTowerOrdinal !== 'undefined' && res instanceof EpsilonTowerOrdinal) {
                        const s = res.toString();
                        ok = res.height === 11n && s === 'e_0^^11';
                    }
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // Finite height with base > e_0 but not pure epsilon: (e_0+1)^^3 computed recursively
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = '(e_0+1)^^3 is recursive (no error)'; container.appendChild(title);
                    const a = new ENFOrdinal([new ENFTerm([new ENFFactor(e0_base, enf_one)], 1n), new ENFTerm([], 1n)]);
                    let passed = true; let res; let errMsg = '';
                    try { res = a.tetrate(CNFOrdinal.fromInt(3)); } catch (e) { passed = false; errMsg = e && e.message ? e.message : String(e); }
                    if (!passed) { const pErr = document.createElement('p'); pErr.className = 'log-output'; pErr.textContent = `Error: ${errMsg}`; container.appendChild(pErr); }
                    const status = document.createElement('p'); status.textContent = `Status: ${passed ? 'PASSED' : 'FAILED'}`; status.className = passed ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (passed) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, passed, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // EpsilonTower for e_5^^12
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = 'e_5^^12 returns EpsilonTowerOrdinal'; container.appendChild(title);
                    const five = new FiniteOrdinal(5);
                    const e5 = new EpsilonNumber(five);
                    const twelve = new FiniteOrdinal(12);
                    const res = e5.tetrate(twelve);
                    let ok = false; let s = '';
                    if (typeof EpsilonTowerOrdinal !== 'undefined' && res instanceof EpsilonTowerOrdinal) {
                        s = res.toString();
                        ok = (res.height === 12n && s === 'e_5^^12');
                    }
                    const pStr = document.createElement('p'); pStr.className = 'log-output'; pStr.textContent = `Got: ${s || '[non-string]'}`; container.appendChild(pStr);
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // a (not w or e_k) ^^ 2 = a^a
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = 'a^^2 = a^a for a=w^2'; container.appendChild(title);
                    const a = new CNFOrdinal([{ exponent: CNFOrdinal.fromInt(2), coefficient: 1n }]);
                    const left = a.tetrate(CNFOrdinal.fromInt(2));
                    const right = a.power(a);
                    const ok = left.equals(right);
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

                // a (CNF infinite epsilon-free) ^^ infinite = e_0
                expectEqual('w^2 ^^ w = e_0', new CNFOrdinal([{ exponent: CNFOrdinal.fromInt(2), coefficient: 1n }]).tetrate(CNFOrdinal.OMEGAStatic().clone()), EpsilonZero.instance());

                // a ≥ e_0: (e_1^e_0) ^^ e_4 = e_2
                (function () {
                    const container = document.createElement('div'); container.className = 'test-case';
                    const title = document.createElement('h3'); title.textContent = '(e_1^e_0) ^^ e_4 = e_2'; container.appendChild(title);
                    const e1 = new EpsilonNumber(CNFOrdinal.fromInt(1));
                    const e0 = EpsilonZero.instance();
                    const base = ENFOrdinal.fromCNF(e1).power(ENFOrdinal.fromCNF(e0));
                    const height = new EpsilonNumber(CNFOrdinal.fromInt(4));
                    const actual = base.tetrate(height);
                    const expected = new EpsilonNumber(CNFOrdinal.fromInt(2));
                    const ok = actual.equals(expected);
                    const ordStr = (o) => {
                        try {
                            if (o && typeof o.toDisplayString === 'function') return o.toDisplayString({ format: 'ENF' });
                            if (o && typeof o.toStringCNF === 'function') return o.toStringCNF();
                            if (o && typeof o.toString === 'function') return o.toString();
                        } catch (stringError) {
                            console.error('Error converting ordinal to string:', stringError);
                            /* Continue with fallback */
                        }
                        return String(o);
                    };
                    const actualStr = ordStr(actual);
                    const expectedStr = ordStr(expected);
                    const pAct = document.createElement('p'); pAct.className = 'log-output'; pAct.textContent = `Actual:   ${actualStr}`; container.appendChild(pAct);
                    const pExp = document.createElement('p'); pExp.className = 'log-output'; pExp.textContent = `Expected: ${expectedStr}`; container.appendChild(pExp);
                    const status = document.createElement('p'); status.textContent = `Status: ${ok ? 'PASSED' : 'FAILED'}`; status.className = ok ? 'status-passed' : 'status-failed'; container.appendChild(status);
                    if (ok) passedTests++; totalTests++;
                    try { recordTestResult(CURRENT_KIND, ok, container); } catch (recordError) {
                        console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                        document.getElementById('test-details-container').appendChild(container);
                        // Force test section to be marked as failed
                        if (testStats[CURRENT_KIND]) {
                            testStats[CURRENT_KIND].failed++;
                            testStats[CURRENT_KIND].total++;
                        }
                    }
                })();

            } catch (e) {
                const container = document.createElement('div');
                container.className = 'test-case';
                const title = document.createElement('h3'); title.textContent = 'Extended tetration setup error'; container.appendChild(title);
                const p = document.createElement('p'); p.className = 'log-output status-failed'; p.textContent = e.message; container.appendChild(p);
                try { recordTestResult(CURRENT_KIND, false, container); } catch (recordError) {
                    console.error('CRITICAL: Failed to record test result for', CURRENT_KIND, recordError);
                    document.getElementById('test-details-container').appendChild(container);
                    // Force test section to be marked as failed
                    if (testStats[CURRENT_KIND]) {
                        testStats[CURRENT_KIND].failed++;
                        testStats[CURRENT_KIND].total++;
                    }
                }
            }



            // Run comprehensive tests against expected results
            CURRENT_KIND = 'ADDITION';
            runComprehensiveAdditionTest(allOrdinals);
            CURRENT_KIND = 'MULTIPLICATION';
            runComprehensiveMultiplicationTest(allOrdinals);
            CURRENT_KIND = 'EXPONENTIATION';
            runComprehensiveExponentiationTest(allOrdinals);
            /*
                        // Run monotonicity sanity tests
                        CURRENT_KIND = 'ADDITION';
                        OperationTracer.reset(1000000);
                        runAdditionMonotonicityTest(allOrdinals);
                        CURRENT_KIND = 'MULTIPLICATION';
                        OperationTracer.reset(1000000);
                        runMultiplicationMonotonicityTest(allOrdinals);
                        CURRENT_KIND = 'EXPONENTIATION';
                        OperationTracer.reset(1000000);
                        runExponentiationMonotonicityTest(allOrdinals);
            */
            // Random triple associativity tests
            CURRENT_KIND = 'RANDOM';
            OperationTracer.reset(1000000);
            runRandomTripleAssociativityAdditionTest(allOrdinals, 100);
            OperationTracer.reset(1000000);
            runRandomTripleAlgebraRulesTest(allOrdinals, 100);

            // --- ENF Calculation Tests ---
            CURRENT_KIND = 'ENF_CALC';
            runENFCalculationTest("Basic finite", "5", "5");
            runENFCalculationTest("Basic omega", "w", "w");
            runENFCalculationTest("Omega plus one", "w+1", "w+1");
            runENFCalculationTest("Omega squared", "w^2", "w^2");
            runENFCalculationTest("Omega to omega", "w^w", "w^w");
            runENFCalculationTest("Epsilon zero", "e_0", "e_0");
            runENFCalculationTest("Complex expression", "w^2*3+w*5+7", "w^2*3+w*5+7");
            runENFCalculationTest("Omega tetration", "w^^3", "w^w^w");
            runENFCalculationTest("Epsilon tetration", "e_w^^2", "e_w^e_w");
            runENFCalculationTest("Infinite tetration 1", "w^^(w^2)", "e_0");
            runENFCalculationTest("Infinite tetration 2", "e_0^^w", "e_1");
            runENFCalculationTest("Infinite tetration 3", "e_3^^e_6", "e_4");
            runENFCalculationTest("Omega tower", "w^^12", "w^^12");
            runENFCalculationTest("Epsilon tower", "e_4^^20", "e_4^^20");
            runENFCalculationTest("Debug: w^w*w", "w^w*w", "w^(w+1)");
            runENFCalculationTest("Debug: 2^(w^2)", "2^(w^2)", "w^w");
            runENFCalculationTest("Debug: 2^(w^3)", "2^(w^3)", "w^w^2");
            runENFCalculationTest("Exp test 1 (fixed)", "2^(w^w*w)", "w^w^(w+1)");
            runENFCalculationTest("Exp test 2", "2^(e_1^e_1*e_1)", "e_1^e_1^(e_1+1)");
            runENFCalculationTest("Invalid tetration", "0^^e_8", "Error: Operation 0 ^^ e_8 is undefined.");
            runENFCalculationTest("Parentheses check 1", "(e_w)^w", "e_w^w");
            runENFCalculationTest("Parentheses check 2", "e_(w^w)", "e_(w^w)");
            runENFCalculationTest("Parentheses check 3", "e_(e_0+1)", "e_(e_0+1)");
            runENFCalculationTest("Parentheses check 4", "e_e_0+1", "e_e_0+1");

            // Tunnel tests
            runENFCalculationTest("Tunnel 0", "e__0", "0");
            runENFCalculationTest("Tunnel 1", "e__1", "e_0");
            runENFCalculationTest("Tunnel 2", "e__2", "e_e_0");
            runENFCalculationTest("Tunnel 3", "e__3", "e_e_e_0");
            runENFCalculationTest("Tunnel 11", "e__11", "e__11"); // Should stay as tunnel for n>10

            // Generate Tables
            generateAdditionTable(allOrdinals);
            generateMultiplicationTable(allOrdinals);
            generateExponentiationTable(allOrdinals);
            generateOrdinalIndexLegend(allOrdinals);
        }

        function generateExponentiationTable(ordinals: ENFOrdinal[]): void {
            const container = document.getElementById('exponentiation-table-container');
            container.innerHTML = '<h2>Comprehensive Exponentiation Table</h2>';

            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';

            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            let tsvContent = "α \\ β\t" + ordinals.map(o => o.toString()).join('\t') + '\n';
            const arrayRows = [];

            // Header Row
            const headerRow = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = 'α \\ β';
            th.classList.add('sticky-col');
            headerRow.appendChild(th);
            ordinals.forEach(o => {
                const th = document.createElement('th');
                th.textContent = o.toString();
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Body Rows
            ordinals.forEach(ordA => {
                const row = document.createElement('tr');
                const th = document.createElement('th');
                const aStr = ordA.toString();
                th.textContent = aStr;
                th.classList.add('sticky-col');
                row.appendChild(th);
                let tsvRow = aStr + '\t';
                const arrayRow = [];

                ordinals.forEach(ordB => {
                    const cell = document.createElement('td');
                    try {
                        const result = ordA.power(ordB);
                        const resultStr = result.toString();
                        cell.textContent = resultStr;
                        tsvRow += resultStr + '\t';
                        arrayRow.push(resultStr);
                    } catch (e) {
                        cell.textContent = "ERROR";
                        cell.style.color = 'red';
                        tsvRow += 'ERROR\t';
                        arrayRow.push('ERROR');
                        console.error(`Error exponentiating ${aStr} ^ ${ordB.toString()}:`, e);
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
                tsvContent += tsvRow.slice(0, -1) + '\n';
                arrayRows.push(arrayRow);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            wrapper.appendChild(table);
            container.appendChild(wrapper);

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Copy Exponentiation TSV';
            container.appendChild(copyButton);

            // Build array literal content
            const arrayContent = '[\n' + arrayRows.map(r => '  [' + r.map(v => JSON.stringify(v)).join(', ') + ']').join(',\n') + '\n]';

            const copyArrayButton = document.createElement('button');
            copyArrayButton.className = 'copy-btn';
            copyArrayButton.textContent = 'Copy Exponentiation Array';
            container.appendChild(copyArrayButton);

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(tsvContent).then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => copyButton.textContent = 'Copy Exponentiation TSV', 2000);
                }).catch(err => {
                    console.error('Failed to copy TSV: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });

            copyArrayButton.addEventListener('click', () => {
                navigator.clipboard.writeText(arrayContent).then(() => {
                    copyArrayButton.textContent = 'Copied!';
                    setTimeout(() => copyArrayButton.textContent = 'Copy Exponentiation Array', 2000);
                }).catch(err => {
                    console.error('Failed to copy Array: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });
        }

        function generateOrdinalIndexLegend(ordinals: ENFOrdinal[]): void {
            let container = document.getElementById('ordinal-index-legend-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'ordinal-index-legend-container';
                const summary = document.getElementById('overall-summary-container');
                summary.parentNode.insertBefore(container, summary.nextSibling);
            }
            container.innerHTML = '<h2>Ordinal Index Legend</h2>';

            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            const headerRow = document.createElement('tr');
            const hIdx = document.createElement('th'); hIdx.textContent = '#'; hIdx.classList.add('sticky-col');
            const hStr = document.createElement('th'); hStr.textContent = 'Ordinal';
            headerRow.appendChild(hIdx); headerRow.appendChild(hStr);
            thead.appendChild(headerRow);

            let tsv = '#\tOrdinal\n';
            for (let i = 0; i < ordinals.length; i++) {
                const row = document.createElement('tr');
                const th = document.createElement('th'); th.textContent = String(i); th.classList.add('sticky-col');
                const td = document.createElement('td'); td.textContent = ordinals[i].toString();
                row.appendChild(th); row.appendChild(td);
                tbody.appendChild(row);
                tsv += `${i}\t${ordinals[i].toString()}\n`;
            }

            table.appendChild(thead); table.appendChild(tbody);
            wrapper.appendChild(table);
            container.appendChild(wrapper);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy Index Legend TSV';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(tsv).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy Index Legend TSV', 2000);
                }).catch(err => {
                    console.error('Failed to copy TSV: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });
            container.appendChild(copyBtn);
        }


        function generateAdditionTable(ordinals: ENFOrdinal[]): void {
            const container = document.getElementById('addition-table-container');
            container.innerHTML = '<h2>Comprehensive Addition Table</h2>';

            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';

            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            let tsvContent = "α \\ β\t" + ordinals.map(o => o.toString()).join('\t') + '\n';
            const arrayRows = [];

            // Header Row
            const headerRow = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = 'α \\ β';
            th.classList.add('sticky-col');
            headerRow.appendChild(th);
            ordinals.forEach(o => {
                const th = document.createElement('th');
                th.textContent = o.toString();
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Body Rows
            ordinals.forEach(ordA => {
                const row = document.createElement('tr');
                const th = document.createElement('th');
                const aStr = ordA.toString();
                th.textContent = aStr;
                th.classList.add('sticky-col');
                row.appendChild(th);
                let tsvRow = aStr + '\t';
                const arrayRow = [];

                ordinals.forEach(ordB => {
                    const cell = document.createElement('td');
                    const result = ordA.add(ordB);
                    const resultStr = result.toString();
                    cell.textContent = resultStr;
                    row.appendChild(cell);
                    tsvRow += resultStr + '\t';
                    arrayRow.push(resultStr);
                });
                tbody.appendChild(row);
                tsvContent += tsvRow.slice(0, -1) + '\n';
                arrayRows.push(arrayRow);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            wrapper.appendChild(table);
            container.appendChild(wrapper);

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Copy Addition TSV';
            container.appendChild(copyButton);

            const arrayContent = '[\n' + arrayRows.map(r => '  [' + r.map(v => JSON.stringify(v)).join(', ') + ']').join(',\n') + '\n]';

            const copyArrayButton = document.createElement('button');
            copyArrayButton.className = 'copy-btn';
            copyArrayButton.textContent = 'Copy Addition Array';
            container.appendChild(copyArrayButton);

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(tsvContent).then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => copyButton.textContent = 'Copy Addition TSV', 2000);
                }).catch(err => {
                    console.error('Failed to copy TSV: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });

            copyArrayButton.addEventListener('click', () => {
                navigator.clipboard.writeText(arrayContent).then(() => {
                    copyArrayButton.textContent = 'Copied!';
                    setTimeout(() => copyArrayButton.textContent = 'Copy Addition Array', 2000);
                }).catch(err => {
                    console.error('Failed to copy Array: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });
        }

        function generateMultiplicationTable(ordinals: ENFOrdinal[]): void {
            const container = document.getElementById('multiplication-table-container');
            container.innerHTML = '<h2>Comprehensive Multiplication Table</h2>';

            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';

            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            let tsvContent = "α \\ β\t" + ordinals.map(o => o.toString()).join('\t') + '\n';
            const arrayRows = [];

            // Header Row
            const headerRow = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = 'α \\ β';
            th.classList.add('sticky-col');
            headerRow.appendChild(th);
            ordinals.forEach(o => {
                const th = document.createElement('th');
                th.textContent = o.toString();
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Body Rows
            ordinals.forEach(ordA => {
                const row = document.createElement('tr');
                const th = document.createElement('th');
                const aStr = ordA.toString();
                th.textContent = aStr;
                th.classList.add('sticky-col');
                row.appendChild(th);
                let tsvRow = aStr + '\t';
                const arrayRow = [];

                ordinals.forEach(ordB => {
                    const cell = document.createElement('td');
                    try {
                        const result = ordA.multiply(ordB);
                        const resultStr = result.toString();
                        cell.textContent = resultStr;
                        tsvRow += resultStr + '\t';
                        arrayRow.push(resultStr);
                    } catch (e) {
                        cell.textContent = "ERROR";
                        cell.style.color = 'red';
                        tsvRow += 'ERROR\t';
                        arrayRow.push('ERROR');
                        console.error(`Error multiplying ${aStr} * ${ordB.toString()}:`, e);
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
                tsvContent += tsvRow.slice(0, -1) + '\n';
                arrayRows.push(arrayRow);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            wrapper.appendChild(table);
            container.appendChild(wrapper);

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Copy Multiplication TSV';
            container.appendChild(copyButton);

            const arrayContent = '[\n' + arrayRows.map(r => '  [' + r.map(v => JSON.stringify(v)).join(', ') + ']').join(',\n') + '\n]';

            const copyArrayButton = document.createElement('button');
            copyArrayButton.className = 'copy-btn';
            copyArrayButton.textContent = 'Copy Multiplication Array';
            container.appendChild(copyArrayButton);

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(tsvContent).then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => copyButton.textContent = 'Copy Multiplication TSV', 2000);
                }).catch(err => {
                    console.error('Failed to copy TSV: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });
            copyArrayButton.addEventListener('click', () => {
                navigator.clipboard.writeText(arrayContent).then(() => {
                    copyArrayButton.textContent = 'Copied!';
                    setTimeout(() => copyArrayButton.textContent = 'Copy Multiplication Array', 2000);
                }).catch(err => {
                    console.error('Failed to copy Array: ', err);
                    alert('Failed to copy. See console for details.');
                });
            });
        }

        function finalizeSummary(): void { /* replaced by updateOverallPageSummary */ }

        // Global error handler to catch test failures
        let hasUnhandledErrors = false;
        window.addEventListener('error', (event) => {
            console.error('UNHANDLED ERROR during testing:', event.error);
            hasUnhandledErrors = true;
            // Force all test sections to show failure if there are unhandled errors
            for (const kindKey in testStats) {
                if (testStats[kindKey].total === 0) {
                    testStats[kindKey].failed = 1;
                    testStats[kindKey].total = 1;
                }
            }
            updateOverallPageSummary();
        });

        // Add toggle listeners with debug logging
        document.querySelectorAll('details.test-kind-section').forEach(detailsElement => {
            detailsElement.addEventListener('toggle', () => {
                const kindKey = detailsElement.id.replace('details-', '');
                console.log(`[DEBUG] Toggle event for ${kindKey}, now open=${detailsElement.open}`);
                renderSingleKindOutput(kindKey);
                updateKindSummary(kindKey);
                updateOverallPageSummary();
            });
        });

        // Force initial render of all sections to ensure they work
        setTimeout(() => {
            console.log('[DEBUG] Force-rendering all sections after initial load');
            renderAllKindResults();

            // === MUTABILITY CHECK AT END OF ALL TESTS ===
            setTimeout(() => {
                console.log('[MUTABILITY] All tests completed, checking for mutations...');

                if (mutabilityTest && typeof mutabilityTest.checkMutations === 'function') {
                    // Perform mutation check
                    const mutabilityResult = mutabilityTest.checkMutations();

                    // Update overall test status based on mutability
                    if (mutabilityResult.mutated) {
                        console.error('[MUTABILITY] Test suite FAILED due to immutability violations');
                        hasUnhandledErrors = true;
                        updateOverallPageSummary();
                    } else {
                        console.log('[MUTABILITY] ✅ Immutability test PASSED - no mutations detected');
                    }
                } else {
                    console.warn('[MUTABILITY] Mutation test not available - mutabilityTest not defined');
                }
            }, 500); // Give tests time to complete
        }, 100);

        // Test runner for individual expressions
        function calculateAndSimplify(expr: string, options: { budget?: number } = {}): { ordinal: OrdinalBase | null; error: string | null } {
            try {
                // Reset global tracer for each test with specified budget
                OperationTracer.setGlobalTracer(options.budget || 200000);
                const parser = new SimpleParser(expr);
                let ord = parser.parse();
                return { ordinal: ord, error: null };
            } catch (e) {
                return { ordinal: null, error: e.message };
            }
        }

        function testENFEquality(aStr: string, bStr: string, expected: boolean): void {
            // ... implementation ...
        }

        function testENFComparison(aStr: string, bStr: string, expected: string): void {
            // ... implementation ...
        }

        function testENFAddition(aStr: string, bStr: string, expectedStr: string): void {
            // ... implementation ...
        }

        function testENFMultiplication(aStr: string, bStr: string, expectedStr: string): void {
            // ... implementation ...
        }

        function testENFExponentiation(aStr: string, bStr: string, expectedStr: string): void {
            // ... implementation ...
        }

        function runAllTests(): void {
            // ... existing test calls ...
        }

        // Execute tests now that all functions and variables are declared
        try {
            defineTests();
            renderAllKindResults();
            updateOverallPageSummary();
            console.log('[Test] Tests completed successfully');
        } catch (error) {
            console.error('CRITICAL ERROR during test initialization:', error);
            document.body.innerHTML += `<div style="background: red; color: white; padding: 20px; margin: 20px;"><h2>CRITICAL TEST FAILURE</h2><p>Test initialization failed: ${error.message}</p><pre>${error.stack}</pre></div>`;
        }

        // Add toggle listeners and mutation checks
        document.querySelectorAll('details.test-kind-section').forEach(detailsElement => {
            detailsElement.addEventListener('toggle', () => {
                const kindKey = detailsElement.id.replace('details-', '');
                console.log(`[DEBUG] Toggle event for ${kindKey}, now open=${detailsElement.open}`);
                renderSingleKindOutput(kindKey);
                updateKindSummary(kindKey);
                updateOverallPageSummary();
            });
        });

        // Force initial render of all sections to ensure they work
        setTimeout(() => {
            console.log('[DEBUG] Force-rendering all sections after initial load');
            renderAllKindResults();

            // === MUTABILITY CHECK AT END OF ALL TESTS ===
            setTimeout(() => {
                console.log('[MUTABILITY] All tests completed, checking for mutations...');

                if (mutabilityTest && typeof mutabilityTest.checkMutations === 'function') {
                    // Perform mutation check
                    const mutabilityResult = mutabilityTest.checkMutations();

                    // Update overall test status based on mutability
                    if (mutabilityResult.mutated) {
                        console.error('[MUTABILITY] Test suite FAILED due to immutability violations');
                        hasUnhandledErrors = true;
                        updateOverallPageSummary();
                    } else {
                        console.log('[MUTABILITY] ✅ Immutability test PASSED - no mutations detected');
                    }
                } else {
                    console.warn('[MUTABILITY] Mutation test not available - mutabilityTest not defined');
                }
            }, 500); // Give tests time to complete
        }, 100);
