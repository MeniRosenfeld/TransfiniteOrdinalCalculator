import { OperationTracer } from "../OperationTracer.js";
import { OPERATIONS } from "../operations/Operations.js";
import { CNFOrdinal } from "../types/CNFOrdinal.js";
import { WTowerOrdinal } from "../types/WTowerOrdinal.js";
import type { OrdinalBase } from "../types/OrdinalBase.js";
import { SimpleParser } from "../SimpleParser.js";
import {
  f,
  fInverse,
  DEFAULT_F_PARAMS,
  OLD_F_PARAMS,
  convertFFormatToOrdinalInstance,
  convertOrdinalInstanceToFFormat,
} from "../ordinal_mapping/OrdinalMappingCompat.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import { requireElementById } from "./testUtils.js";

// Extracted from ordinal_calculator_test.html

// Original <scripttype="module">

      initializeTestEnvironment(1_000_000);
      console.log("[Test] Ordinal calculator tests initialized");

      type TestKind =
        | "CNF"
        | "WTOWER"
        | "SIMPLIFY"
        | "COMPLEXITY"
        | "INVERSE_MAPPING"
        | "MONOTONICITY";

      type TestResult = {
        passed: boolean;
        detailsElements: HTMLElement[];
      };

      type StandardTestStats = {
        total: number;
        passed: number;
        failed: number;
        total_pairs: number;
        passed_pairs: number;
        failed_pairs: number;
        containerId: string;
        previewId: string;
        summaryId: string;
        results: TestResult[];
      };

      type MonotonicityTestStats = StandardTestStats;

      type TestStatsMap = {
        CNF: StandardTestStats;
        WTOWER: StandardTestStats;
        SIMPLIFY: StandardTestStats;
        COMPLEXITY: StandardTestStats;
        INVERSE_MAPPING: StandardTestStats;
        MONOTONICITY: MonotonicityTestStats;
        [key: string]: StandardTestStats | MonotonicityTestStats;
      };

      // Stats for each test kind
      const testStats: TestStatsMap = {
        CNF: {
          total: 0,
          passed: 0,
          failed: 0,
          total_pairs: 0,
          passed_pairs: 0,
          failed_pairs: 0,
          containerId: "cnf-results-output",
          previewId: "cnf-failed-preview",
          summaryId: "cnf-summary",
          results: [],
        },
        WTOWER: {
          total: 0,
          passed: 0,
          failed: 0,
          total_pairs: 0,
          passed_pairs: 0,
          failed_pairs: 0,
          containerId: "wtower-results-output",
          previewId: "wtower-failed-preview",
          summaryId: "wtower-summary",
          results: [],
        },
        SIMPLIFY: {
          total: 0,
          passed: 0,
          failed: 0,
          total_pairs: 0,
          passed_pairs: 0,
          failed_pairs: 0,
          containerId: "simplify-results-output",
          previewId: "simplify-failed-preview",
          summaryId: "simplify-summary",
          results: [],
        },
        COMPLEXITY: {
          total: 0,
          passed: 0,
          failed: 0,
          total_pairs: 0,
          passed_pairs: 0,
          failed_pairs: 0,
          containerId: "complexity-results-output",
          previewId: "complexity-failed-preview",
          summaryId: "complexity-summary",
          results: [],
        },
        INVERSE_MAPPING: {
          total: 0,
          passed: 0,
          failed: 0,
          total_pairs: 0,
          passed_pairs: 0,
          failed_pairs: 0,
          containerId: "inverse-mapping-results-output",
          previewId: "inverse-mapping-failed-preview",
          summaryId: "inverse-mapping-summary",
          results: [],
        },
        MONOTONICITY: {
          total: 0,
          passed: 0,
          failed: 0,
          total_pairs: 0,
          passed_pairs: 0,
          failed_pairs: 0,
          containerId: "monotonicity-results-output",
          previewId: "monotonicity-failed-preview",
          summaryId: "monotonicity-summary",
          results: [],
        },
      };

      const successfulCNFTestResultsForMapping: Array<{
        input: string;
        ordinal: OrdinalBase;
        mappedValue: number;
        cnf: string;
      }> = [];

      function toCnfString(
        ordinalLike:
          | OrdinalBase
          | { toString?: () => string }
          | null
          | undefined
      ): string {
        try {
          if (ordinalLike && typeof ordinalLike.toString === "function") {
            return ordinalLike.toString();
          }
        } catch (e: unknown) {
          /* fall back below */
        }
        return String(ordinalLike);
      }

      const overallStatusIndicatorDiv =
        requireElementById<HTMLDivElement>("overall-status-indicator");
      // Create a specific div for the lines in the overall summary if it doesn't exist
      let overallSummaryDetailsDiv = document.getElementById(
        "overall-summary-details"
      ) as HTMLDivElement | null;
      if (!overallSummaryDetailsDiv) {
        overallSummaryDetailsDiv = document.createElement("div");
        overallSummaryDetailsDiv.id = "overall-summary-details";
        // Insert it after overallStatusIndicatorDiv
        overallStatusIndicatorDiv.parentNode?.insertBefore(
          overallSummaryDetailsDiv,
          overallStatusIndicatorDiv.nextSibling
        );
      }

      // Generic logToPage, parentElement must be provided
      function logToPage(
        message: string,
        className = "",
        parentElement?: HTMLElement | null
      ): void {
        if (!parentElement) {
          console.warn(
            "logToPage called without parentElement for message:",
            message
          );
          return;
        }
        const entry = document.createElement("div");
        entry.textContent = message;
        if (className) entry.classList.add(className); // logToPage seems to expect single class, or needs same fix
        parentElement.appendChild(entry);
      }

      const toErrorMessage = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);

      function parseOrdinal(expr: string): OrdinalBase {
        const parsed = new SimpleParser(expr).parse() as OrdinalBase;
        if (typeof parsed.compareTo !== "function") {
          throw new Error(`Parsed value is not an ordinal: ${expr}`);
        }
        return parsed;
      }

      type CalculateAndSimplifyResult =
        | { cnfString: string; ordinalObject: OrdinalBase; error: null }
        | { error: string; cnfString?: undefined; ordinalObject?: undefined };

      let testCount = 0;

      // Refactored testOrdinalCalc
      function testOrdinalCalc(input: string, expectedCNF: string): void {
        testStats.CNF.total++;
        const outputElements: HTMLElement[] = [];

        const addDetailElement = (text: string, classNameString = ""): void => {
          const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (classNameString) {
            const classes = classNameString.trim().split(/\s+/);
            classes.forEach((cls) => {
              if (cls) {
                p.classList.add(cls);
              }
            });
          }
          outputElements.push(p);
        };

        let overallTestPassed = false;
        let mainStatusMessage = "";
        let mainStatusClass = "";
        let calcResult: CalculateAndSimplifyResult;

        const fInverseThreshold = 1e-14;

        addDetailElement(`Input: "${input}"`);

        try {
          calcResult = calculateAndSimplify(input);

          if (calcResult.error) {
            const actualOutput = calcResult.error;
            addDetailElement(
              `Output (Error): "${actualOutput}"`,
              "error-message"
            );
            overallTestPassed = actualOutput === expectedCNF;
            if (overallTestPassed) {
              mainStatusMessage = `Status: PASSED (Expected Error Matched: "${expectedCNF}")`;
              mainStatusClass = "status-passed";
            } else {
              mainStatusMessage = `Status: FAILED. Expected: "${expectedCNF}", Got Error: "${actualOutput}"`;
              mainStatusClass = "status-failed";
            }
          } else {
            const originalOrdinalObject = calcResult.ordinalObject;
            const actualCNF = calcResult.cnfString!;
            addDetailElement(`Output CNF: "${actualCNF}"`);

            // --- BEGIN MODIFICATION ---
            if (originalOrdinalObject && !calcResult.error) {
              try {
                const fFormattedOriginal = convertOrdinalInstanceToFFormat(
                  originalOrdinalObject
                );
                const mappedValue = f(fFormattedOriginal, DEFAULT_F_PARAMS);
                successfulCNFTestResultsForMapping.push({
                  input: input,
                  ordinal: originalOrdinalObject,
                  mappedValue: mappedValue, // f() now returns plain number
                  cnf: actualCNF,
                });
              } catch (mapErr: unknown) {
                addDetailElement(
                  `Could not add to successfulCNFTestResultsForMapping: f() or conversion error - ${toErrorMessage(
                    mapErr
                  )}`,
                  "error-message"
                );
              }
            }
            // --- END MODIFICATION ---

            const cnfCheckPassed = actualCNF === expectedCNF;
            // Well-formedness check for the resulting ordinal
            let wellFormedCheckPassed = true;
            if (
              originalOrdinalObject &&
              typeof originalOrdinalObject.isWellFormed === "function"
            ) {
              try {
                wellFormedCheckPassed = !!originalOrdinalObject.isWellFormed();
              } catch (wfErr: unknown) {
                wellFormedCheckPassed = false;
                addDetailElement(
                  `Well-formed check error: ${toErrorMessage(wfErr)}`,
                  "error-message"
                );
              }
              addDetailElement(
                `Well-formed: ${wellFormedCheckPassed ? "PASSED" : "FAILED"}`
              );
            }
            // New: equality check by parsing Expected CNF and comparing ordinals (when expected is not an error)
            const expectedLooksLikeError =
              typeof expectedCNF === "string" &&
              expectedCNF.startsWith("Error:");
            let eqCheckPassed = true;
            if (!expectedLooksLikeError && originalOrdinalObject) {
              try {
                OperationTracer.setGlobalTracer(10000);
                const expectedParsedOrdinal = parseOrdinal(expectedCNF);
                eqCheckPassed = expectedParsedOrdinal.equals(
                  originalOrdinalObject
                );
                addDetailElement(
                  `Equality with Parsed(Expected CNF): ${
                    eqCheckPassed ? "PASSED" : "FAILED"
                  }`
                );
                addDetailElement(
                  `  Parsed(Expected CNF): "${toCnfString(
                    expectedParsedOrdinal
                  )}"`
                );
                addDetailElement(
                  `  Computed Ordinal:    "${toCnfString(
                    originalOrdinalObject
                  )}"`
                );
              } catch (eqErr: unknown) {
                eqCheckPassed = false;
                addDetailElement(
                  `Equality check error (parsing Expected CNF): ${toErrorMessage(
                    eqErr
                  )}`,
                  "error-message"
                );
              }
            }

            let fRoundTripCheckPassed = false;
            const fTripDetailsLogs: string[] = [];
            let mappedValueOriginalNum = Number.NaN;

            if (!originalOrdinalObject) {
              fTripDetailsLogs.push(
                "f()/fInverse()/f() Check: SKIPPED (originalOrdinalObject is null/undefined)."
              );
              overallTestPassed = cnfCheckPassed && wellFormedCheckPassed;
            } else {
              try {
                if (typeof convertOrdinalInstanceToFFormat !== "function")
                  throw new Error(
                    "convertOrdinalInstanceToFFormat is not defined"
                  );
                if (typeof f !== "function")
                  throw new Error("f function is not defined");
                if (typeof fInverse !== "function")
                  throw new Error("fInverse function is not defined");
                if (typeof convertFFormatToOrdinalInstance !== "function")
                  throw new Error(
                    "convertFFormatToOrdinalInstance is not defined"
                  );

                const fFormattedOriginal = convertOrdinalInstanceToFFormat(
                  originalOrdinalObject
                );
                const mappedValueOriginal = f(
                  fFormattedOriginal,
                  DEFAULT_F_PARAMS
                );
                mappedValueOriginalNum = mappedValueOriginal; // f() now returns plain number

                fTripDetailsLogs.push(
                  `f(original: "${actualCNF}") = ${mappedValueOriginalNum.toPrecision(
                    15
                  )}`
                );

                const inverseMappedFFormat = fInverse(
                  mappedValueOriginalNum,
                  DEFAULT_F_PARAMS,
                  fInverseThreshold
                );
                const inverseOrdinalObject =
                  convertFFormatToOrdinalInstance(inverseMappedFFormat);
                const inverseCNFForLog = toCnfString(inverseOrdinalObject);
                fTripDetailsLogs.push(
                  `fInverse(${mappedValueOriginalNum.toPrecision(
                    15
                  )}) -> "${inverseCNFForLog}"`
                );

                const fFormattedInverse =
                  convertOrdinalInstanceToFFormat(inverseOrdinalObject);
                const mappedValueOfInverse = f(
                  fFormattedInverse,
                  DEFAULT_F_PARAMS
                );
                const mappedValueOfInverseNum = mappedValueOfInverse; // f() now returns plain number
                fTripDetailsLogs.push(
                  `f(inverse: "${inverseCNFForLog}") = ${mappedValueOfInverseNum.toPrecision(
                    15
                  )}`
                );

                const difference = Math.abs(
                  mappedValueOriginalNum - mappedValueOfInverseNum
                );
                fRoundTripCheckPassed = difference < fInverseThreshold;

                if (fRoundTripCheckPassed) {
                  fTripDetailsLogs.push(
                    `f() Round Trip Check: PASSED. |f(orig) - f(fInv(f(orig)))| = ${difference.toExponential(
                      5
                    )} (threshold: ${fInverseThreshold})`
                  );
                } else {
                  fTripDetailsLogs.push(
                    `f() Round Trip Check: FAILED. |f(orig) - f(fInv(f(orig)))| = ${difference.toExponential(
                      5
                    )} (threshold: ${fInverseThreshold})`
                  );
                  fTripDetailsLogs.push(
                    `  Original Ordinal: ${originalOrdinalObject.toString()}`
                  );
                  fTripDetailsLogs.push(
                    `  Inverse Ordinal:  ${inverseOrdinalObject.toString()}`
                  );
                }
              } catch (err: unknown) {
                fRoundTripCheckPassed = false;
                const errMsg = `f()/fInverse()/f() Check: CRITICAL ERROR - ${toErrorMessage(
                  err
                )}`;
                fTripDetailsLogs.push(errMsg);
                console.error(
                  `Critical error during f()/fInverse()/f() for input "${input}":`,
                  err
                );
              }
              // Include equality check unless the expected is an error string
              let limitCheckPassed = true; // Default to true for non-ordinal results or errors
              if (originalOrdinalObject && !originalOrdinalObject.isZero()) {
                const limitDetailsLogs: string[] = [];
                try {
                  const limitEpsilon = 1e-12;
                  const isLim = originalOrdinalObject.isLimit();
                  const fA = mappedValueOriginalNum;
                  const fA_minus_epsilon = fA - limitEpsilon;

                  const b_rep = fInverse(
                    fA_minus_epsilon,
                    DEFAULT_F_PARAMS,
                    1e-14
                  );
                  const b = convertFFormatToOrdinalInstance(b_rep);
                  const fB = f(b.toFFormat(), DEFAULT_F_PARAMS); // f() now returns plain number

                  const isClose = fB > fA - 3 * limitEpsilon;
                  const isSmaller = b.compareTo(originalOrdinalObject) < 0;

                  limitDetailsLogs.push(
                    `Limit property check: isLimit() = ${isLim}`
                  );
                  limitDetailsLogs.push(`  f(a) = ${fA}`);
                  limitDetailsLogs.push(
                    `  b = fInverse(f(a) - epsilon) = ${b.toString()}`
                  );
                  limitDetailsLogs.push(`  f(b) = ${fB}`);
                  limitDetailsLogs.push(`  b < a? ${isSmaller}`);
                  limitDetailsLogs.push(`  f(b) > f(a) - 3epsilon? ${isClose}`);

                  const proximityTestResult = isSmaller && isClose;
                  limitCheckPassed = proximityTestResult || !isLim;

                  limitDetailsLogs.forEach((detailMsg) =>
                    addDetailElement(detailMsg, "log-output-detail")
                  );
                  addDetailElement(
                    `Limit Check Status: ${
                      limitCheckPassed ? "PASSED" : "FAILED"
                    }`,
                    limitCheckPassed ? "status-passed" : "status-failed"
                  );
                } catch (limitErr: unknown) {
                  limitCheckPassed = false;
                  addDetailElement(
                    `Limit Check CRITICAL ERROR: ${toErrorMessage(limitErr)}`,
                    "error-message"
                  );
                }
              }
              overallTestPassed =
                cnfCheckPassed &&
                (expectedLooksLikeError || eqCheckPassed) &&
                fRoundTripCheckPassed &&
                limitCheckPassed;
            }

            fTripDetailsLogs.forEach((detailMsg) => {
              let detailClass = "log-output-detail";
              if (detailMsg.includes("FAILED") || detailMsg.includes("ERROR"))
                detailClass += " error-message status-failed-detail";
              else if (detailMsg.includes("PASSED"))
                detailClass += " status-passed-detail";
              addDetailElement(detailMsg, detailClass);
            });

            if (overallTestPassed) {
              mainStatusMessage = "Status: PASSED (CNF & f-round-trip OK)";
              mainStatusClass = "status-passed";
            } else {
              mainStatusClass = "status-failed";
              if (
                !cnfCheckPassed &&
                !fRoundTripCheckPassed &&
                originalOrdinalObject
              ) {
                mainStatusMessage = `Status: FAILED. Expected CNF: "${expectedCNF}". f-round-trip check also failed.`;
              } else if (!cnfCheckPassed) {
                mainStatusMessage = `Status: FAILED. Expected CNF: "${expectedCNF}", Got: "${actualCNF}".`;
                if (originalOrdinalObject)
                  mainStatusMessage +=
                    " (f-round-trip check status was based on this incorrect CNF result).";
              } else if (!expectedLooksLikeError && !eqCheckPassed) {
                mainStatusMessage =
                  "Status: FAILED. Parsed(Expected CNF) is not equal to computed ordinal.";
              } else if (!wellFormedCheckPassed) {
                mainStatusMessage =
                  "Status: FAILED. Resulting ordinal is not well-formed.";
              } else {
                mainStatusMessage = `Status: FAILED. CNF OK ("${actualCNF}"), but f-round-trip or limit check failed.`;
              }
            }
          }
        } catch (criticalError: unknown) {
          addDetailElement(
            `CRITICAL TEST ERROR: ${toErrorMessage(criticalError)}`,
            "error-message status-failed"
          );
          console.error(
            `Critical error running testOrdinalCalc for input "${input}":`,
            criticalError
          );
          overallTestPassed = false;
          mainStatusMessage = "Status: FAILED (Critical test execution error)";
          mainStatusClass = "status-failed";
        }

        addDetailElement(mainStatusMessage, mainStatusClass);

        if (overallTestPassed) {
          testStats.CNF.passed++;
        } else {
          testStats.CNF.failed++;
        }
        testStats.CNF.results.push({
          passed: overallTestPassed,
          detailsElements: outputElements,
        });
      }

      // --- MINIMALLY MODIFIED OTHER TEST FUNCTIONS ---
      function testWTowerOrdinal(
        description: string,
        height: number,
        expectedCNFString: string,
        budget = 10000000
      ): void {
        testStats.WTOWER.total++;
        const outputElements: HTMLElement[] = [];
        const addDetailElement = (text: string, className = ""): void => {
          const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (className) p.classList.add(className);
          outputElements.push(p);
        };

        OperationTracer.setGlobalTracer(budget);
        addDetailElement(`Test (WTower): ${description}`);

        let actualCNF = "",
          statusMsg = "",
          sClass = "",
          currentTestPassed = false,
          cnfOrdForMapping: WTowerOrdinal | null = null;

        try {
          const inst = new WTowerOrdinal(height);
          addDetailElement(`Input WTower: w^^${height}`);
          const cnfOrd = inst.toCNFOrdinal();
          cnfOrdForMapping = inst; // Store original WTower for mapping (not CNF expansion)
          actualCNF = toCnfString(cnfOrd);

          if (actualCNF === expectedCNFString) {
            currentTestPassed = true;
            statusMsg = "Status: PASSED";
            sClass = "status-passed";
            if (
              typeof f === "function" &&
              typeof convertOrdinalInstanceToFFormat === "function" &&
              cnfOrdForMapping
            ) {
              try {
                const fFormatted =
                  convertOrdinalInstanceToFFormat(cnfOrdForMapping);
                successfulCNFTestResultsForMapping.push({
                  input: `w^^${height}`,
                  ordinal: cnfOrdForMapping,
                  mappedValue: f(fFormatted, DEFAULT_F_PARAMS),
                  cnf: actualCNF,
                });
              } catch (mapErr: unknown) {
                addDetailElement(
                  `Mapped Value f(α): Error - ${toErrorMessage(mapErr)}`,
                  "error-message"
                );
              }
            }
          } else {
            statusMsg = `Status: FAILED. Exp: "${expectedCNFString}"`;
            sClass = "status-failed";
          }
        } catch (e: unknown) {
          actualCNF = `Crit Error: ${toErrorMessage(e)}`;
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
        testStats.WTOWER.results.push({
          passed: currentTestPassed,
          detailsElements: outputElements,
        });
      }

      function testOrdinalSimplify(
        description: string,
        inputStr: string,
        budget: number,
        expectedStr: string,
        expectedRem: number,
        opBudget = 100000
      ): void {
        testStats.SIMPLIFY.total++;
        const outputElements: HTMLElement[] = [];
        const addDetailElement = (text: string, className = ""): void => {
          const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (className) p.classList.add(className);
          outputElements.push(p);
        };

        OperationTracer.setGlobalTracer(opBudget);
        addDetailElement(`Test (Simplify): ${description} [Budget: ${budget}]`);

        let actualStr = "",
          actRem = -1,
          sMsg = "",
          sCls = "",
          currentTestPassed = true,
          notes: string[] = [],
          simpG: number | "N/A" = "N/A",
          originalOrdinalStr = "N/A";

        try {
          const origOrd = parseOrdinal(inputStr);
          originalOrdinalStr = origOrd.toString(); // Get string form for comparison
          addDetailElement(
            `Input Ordinal: "${inputStr}" (g=${origOrd.complexity()})`
          );
          const simpRes = origOrd.simplify(budget, false);
          const simpOrd = simpRes.simplifiedOrdinal;
          actRem = simpRes.remainingBudget;
          actualStr = simpOrd.toString();
          simpG = simpOrd.complexity();

          if (actualStr !== expectedStr) {
            currentTestPassed = false;
            notes.push(
              `Form Mismatch: Got "${actualStr}", Exp "${expectedStr}"`
            );
          }
          if (actRem !== expectedRem) {
            currentTestPassed = false;
            notes.push(`Budget Mismatch: Got ${actRem}, Exp ${expectedRem}`);
          }
          if (simpG > budget) {
            currentTestPassed = false;
            notes.push(`Sanity Fail: Simp g ${simpG} > budget ${budget}`);
          }

          // Perform comparison using string representations if simplify didn't error
          if (origOrd.compareTo(simpOrd) < 0) {
            currentTestPassed = false;
            notes.push(
              `Sanity Fail: Simp "${actualStr}" > orig "${originalOrdinalStr}"`
            );
          }

          if (currentTestPassed) {
            sMsg = "Status: PASSED";
            sCls = "status-passed";
          } else {
            sMsg = "Status: FAILED";
            sCls = "status-failed";
          }
        } catch (e: unknown) {
          currentTestPassed = false;
          actualStr = `Crit Error: ${toErrorMessage(e)}`;
          sMsg = "Status: FAILED (Crit Error)";
          sCls = "status-failed";
          console.error(`Crit simplify test "${description}":`, e);
        }

        if (currentTestPassed) testStats.SIMPLIFY.passed++;
        else testStats.SIMPLIFY.failed++;

        addDetailElement(
          `Simplified Form: "${actualStr}"${
            simpG !== "N/A" && !Number.isNaN(simpG) ? ` (g=${simpG})` : ""
          }`
        );
        addDetailElement(
          `Remaining Budget: ${actRem === -1 ? "N/A" : actRem}`
        );
        if (notes.length > 0)
          notes.forEach((n) => addDetailElement(n, "error-message"));
        addDetailElement(sMsg, sCls);
        testStats.SIMPLIFY.results.push({
          passed: currentTestPassed,
          detailsElements: outputElements,
        });
      }

      function testOrdinalComplexity(
        inputStr: string,
        expectedComp: number,
        opBudget = 100000
      ): void {
        testStats.COMPLEXITY.total++;
        const outputElements: HTMLElement[] = [];
        const addDetailElement = (text: string, className = ""): void => {
          const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (className) p.classList.add(className);
          outputElements.push(p);
        };
        addDetailElement(`Test (Complexity): "${inputStr}"`);

        let actComp = -1,
          sMsg = "",
          sCls = "",
          currentTestPassed = false;
        try {
          OperationTracer.setGlobalTracer(opBudget);
          const ord = parseOrdinal(inputStr);
          actComp = ord.complexity();
          if (actComp === expectedComp) {
            currentTestPassed = true;
            sMsg = "Status: PASSED";
            sCls = "status-passed";
          } else {
            sMsg = `Status: FAILED. Expected Comp: ${expectedComp}, Got: ${actComp}`;
            sCls = "status-failed";
          }
        } catch (e: unknown) {
          actComp = -1; // Indicate error in actual complexity
          sMsg = `Status: FAILED (Crit Error: ${toErrorMessage(
            e
          )}). Expected Comp: ${expectedComp}`;
          sCls = "status-failed";
          console.error(`Crit complexity test "${inputStr}":`, e);
        }

        if (currentTestPassed) testStats.COMPLEXITY.passed++;
        else testStats.COMPLEXITY.failed++;

        if (actComp !== -1) addDetailElement(`Actual Comp: ${actComp}`);
        addDetailElement(sMsg, sCls);
        testStats.COMPLEXITY.results.push({
          passed: currentTestPassed,
          detailsElements: outputElements,
        });
      }
      function testManualComplexity(
        desc: string,
        ordInst: OrdinalBase,
        exp: number
      ): void {
        testStats.COMPLEXITY.total++;
        const outputElements: HTMLElement[] = [];
        const addDetailElement = (text: string, className = ""): void => {
          /* as above */ const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (className) p.classList.add(className);
          outputElements.push(p);
        };
        addDetailElement(`Test (Manual Complexity): ${desc}`);
        let actualComplexity: number | undefined,
          currentTestPassed = false,
          statusMsg = "",
          statusClass = "";
        try {
          actualComplexity = ordInst.complexity();
          if (actualComplexity === exp) {
            currentTestPassed = true;
            statusMsg = "Status: PASSED";
            statusClass = "status-passed";
          } else {
            statusMsg = `Status: FAILED. Expected: ${exp}, Got: ${actualComplexity}`;
            statusClass = "status-failed";
          }
        } catch (e: unknown) {
          statusMsg = `Status: FAILED (Error: ${toErrorMessage(e)})`;
          statusClass = "status-failed";
        }
        if (currentTestPassed) testStats.COMPLEXITY.passed++;
        else testStats.COMPLEXITY.failed++;
        if (actualComplexity !== undefined)
          addDetailElement(`Actual Complexity: ${actualComplexity}`);
        addDetailElement(statusMsg, statusClass);
        testStats.COMPLEXITY.results.push({
          passed: currentTestPassed,
          detailsElements: outputElements,
        });
      }
      function testManualSimplify(
        desc: string,
        ordInst: OrdinalBase,
        bud: number,
        expectedStr: string,
        expRem: number
      ): void {
        testStats.SIMPLIFY.total++;
        const outputElements: HTMLElement[] = [];
        const addDetailElement = (text: string, className = ""): void => {
          /* as above */ const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (className) p.classList.add(className);
          outputElements.push(p);
        };
        addDetailElement(`Test (Manual Simplify): ${desc} [Budget: ${bud}]`);
        addDetailElement(
          `Input Ordinal (direct): ${ordInst.toString()} (g=${ordInst.complexity()})`
        );
        let actualStr: string | undefined = undefined,
          actualRem: number | undefined = undefined,
          currentTestPassed = true,
          notes: string[] = [],
          statusMsg = "",
          statusClass = "",
          simpG = Number.NaN;
        try {
          const simpRes = ordInst.simplify(bud, false);
          const simpOrd = simpRes.simplifiedOrdinal;
          actualRem = simpRes.remainingBudget;
          actualStr = simpOrd.toString();
          simpG = simpOrd.complexity();

          if (actualStr !== expectedStr) {
            currentTestPassed = false;
            notes.push(
              `Form Mismatch: Got "${actualStr}", Exp "${expectedStr}"`
            );
          }
          if (actualRem !== expRem) {
            currentTestPassed = false;
            notes.push(`Budget Mismatch: Got ${actualRem}, Exp ${expRem}`);
          }
          if (simpG > bud) {
            currentTestPassed = false;
            notes.push(`Sanity Fail: Simp g ${simpG} > budget ${bud}`);
          }
          if (ordInst.compareTo(simpOrd) < 0) {
            currentTestPassed = false;
            notes.push(
              `Sanity Fail: Simp "${actualStr}" > orig "${ordInst.toString()}"`
            );
          }
          if (currentTestPassed) {
            statusMsg = "Status: PASSED";
            statusClass = "status-passed";
          } else {
            statusMsg = "Status: FAILED";
            statusClass = "status-failed";
          }
        } catch (e: unknown) {
          currentTestPassed = false;
          statusMsg = `Status: FAILED (Error: ${toErrorMessage(e)})`;
          statusClass = "status-failed";
          console.error(`Crit simplify test "${desc}":`, e);
        }
        if (currentTestPassed) testStats.SIMPLIFY.passed++;
        else testStats.SIMPLIFY.failed++;
        if (actualStr !== undefined)
          addDetailElement(
            `Simplified Form: "${actualStr}"${
              !Number.isNaN(simpG) ? ` (g=${simpG})` : ""
            }`
          );
        if (actualRem !== undefined)
          addDetailElement(
            `Remaining Budget: ${actualRem ?? "N/A"}`
          );
        if (notes.length > 0)
          notes.forEach((n) => addDetailElement(n, "error-message"));
        addDetailElement(statusMsg, statusClass);
        testStats.SIMPLIFY.results.push({
          passed: currentTestPassed,
          detailsElements: outputElements,
        });
      }

      // Helper function for fInverse test output formatting
      function formatFInverseOutput(result: unknown): string {
        if (typeof result === "bigint") {
          return toCnfString(new CNFOrdinal(result));
        }
        if (result === "E0_TYPE") {
          return "e_0";
        }
        if (typeof result === "object" && result !== null && "type" in result) {
          // This is the f-format. We need to convert it to an Ordinal instance then to string.
          // Assuming a function convertFFormatToOrdinalInstance exists (it was in ordinal_mapping_inverse.js)
          // If not, this part needs to be implemented or adjusted.
          try {
            const ordinalInstance = convertFFormatToOrdinalInstance(
              result as any
            ); // This function needs to be available
            return toCnfString(ordinalInstance);
          } catch (e: unknown) {
            console.error(
              "Error converting f-format to ordinal for display:",
              result,
              e
            );
            // Avoid JSON.stringify BigInt errors by converting bigints to strings
            const safeString = ((obj) => {
              try {
                return JSON.stringify(obj, (k, v) =>
                  typeof v === "bigint" ? v.toString() : v
                );
              } catch (jsonError: unknown) {
                console.error("Error in JSON.stringify:", jsonError);
                return String(obj);
              }
            })(result);
            return "ErrorInConversion: " + safeString;
          }
        }
        if (typeof result === "string") {
          // Might be an error message already
          return result;
        }
        return String(result); // Fallback
      }

      // Test function for fInverse
      function testFInverse(
        description: string,
        inputValue: number,
        expectedOutput: string | number,
        expectError = false
      ): void {
        const kindKey = "INVERSE_MAPPING";
        testStats[kindKey].total++;
        const outputElements: HTMLElement[] = [];

        const addDetailElement = (text: string, className = ""): void => {
          const p = document.createElement("p");
          p.textContent = text;
          p.classList.add("log-output");
          if (className) p.classList.add(className);
          outputElements.push(p);
        };

        let actualOutput: string | number | undefined,
          statusClass = "",
          statusMessage = "",
          currentTestPassed = false;

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
              statusMessage = "Status: PASSED";
              statusClass = "status-passed";
            } else {
              currentTestPassed = false;
              statusMessage = `Status: FAILED. Expected: "${expectedOutput}"`;
              statusClass = "status-failed";
            }
          }
        } catch (e: unknown) {
          actualOutput = `Error: ${toErrorMessage(e)}`;
          if (expectError) {
            // Compare error message string. For simplicity, we can check if e.message contains expectedOutput.
            // For more precise matching, ensure expectedOutput is the exact error message or a well-defined part of it.
            if (toErrorMessage(e).includes(String(expectedOutput))) {
              currentTestPassed = true;
              statusMessage = `Status: PASSED (Correctly caught error: "${toErrorMessage(
                e
              )}")`;
              statusClass = "status-passed";
            } else {
              currentTestPassed = false;
              statusMessage = `Status: FAILED. Expected error containing "${expectedOutput}", but got "${toErrorMessage(
                e
              )}"`;
              statusClass = "status-failed";
            }
          } else {
            currentTestPassed = false;
            statusMessage = `Status: FAILED (Unexpected Error). Expected: "${expectedOutput}"`;
            statusClass = "status-failed";
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
        testStats[kindKey].results.push({
          passed: currentTestPassed,
          detailsElements: outputElements,
        });
      }

      // Main test orchestrator
      function runAllTestsAndRender(): void {
        console.log("runAllTestsAndRender: Started");
        // Initialize/Clear all stats and containers
        for (const kindKey of Object.keys(testStats) as TestKind[]) {
          const kind = testStats[kindKey];
          kind.results = [];
          kind.total = 0;
          kind.passed = 0;
          kind.failed = 0;
          if (kindKey === "MONOTONICITY") {
            kind.total_pairs = 0;
            kind.passed_pairs = 0;
            kind.failed_pairs = 0;
          }
          const summaryDiv = document.getElementById(kind.summaryId);
          if (summaryDiv) summaryDiv.textContent = "Pending...";
          // const containerDiv = document.getElementById(kind.containerId);
          // if(containerDiv) containerDiv.innerHTML = ''; // DO NOT CLEAR THE MAIN CONTAINER HERE
        }
        successfulCNFTestResultsForMapping.length = 0;
        overallStatusIndicatorDiv.textContent =
          "Overall Status: Running tests...";
        overallStatusIndicatorDiv.className = "status-overall-pending";
        if (overallSummaryDetailsDiv) overallSummaryDetailsDiv.innerHTML = "";

        // --- ORIGINAL TEST CASES START ---
        console.log("runAllTestsAndRender: Starting CNF tests...");
        testOrdinalCalc("0", "0");
        testOrdinalCalc("1+2*3", "7");
        testOrdinalCalc("w", "w");
        testOrdinalCalc("w+5", "w+5");
        testOrdinalCalc("5+w", "w");
        testOrdinalCalc("w+w", "w*2");

        testOrdinalCalc("w*3", "w*3");
        testOrdinalCalc("3*w", "w");
        testOrdinalCalc("w*w", "w^2");
        testOrdinalCalc("(w+1)*2", "w*2+1");
        testOrdinalCalc("(w+1)*(w+1)", "w^2+w+1");
        testOrdinalCalc("(w+1)*(w+2)", "w^2+w*2+1");

        testOrdinalCalc("2^w", "w");
        testOrdinalCalc("w^3", "w^3");
        testOrdinalCalc("w^w", "w^w");
        testOrdinalCalc("(w+1)^2", "w^2+w+1");
        testOrdinalCalc("2^(w+1)", "w*2");
        testOrdinalCalc("w^(w+1)", "w^(w+1)");
        testOrdinalCalc("(w^2)^w", "w^w");
        testOrdinalCalc("(w^w)^2", "w^(w*2)");
        testOrdinalCalc("(w^w)^w", "w^w^2");

        testOrdinalCalc("(w^2+w*3+5)*w + (w+1)", "w^3+w+1");
        testOrdinalCalc("2^(w^2)", "w^w");
        testOrdinalCalc(" (w+5)^0 ", "1");
        testOrdinalCalc(" 0^(w+1) ", "0");
        testOrdinalCalc(" 1^w ", "1");
        testOrdinalCalc("w^(w+1)+2", "w^(w+1)+2");
        testOrdinalCalc("w^2", "w^2");
        testOrdinalCalc("w^w", "w^w");

        testOrdinalCalc("(w*2+1)*(w*3+5)", "w^2*3+w*10+1");

        testOrdinalCalc("w + w * w ^ w + w", "w^w+w");
        testOrdinalCalc(
          "( (w+1) * (w+2) + (w*3+4) ) ^ 2",
          "w^4+w^3*5+w^2*4+w*5+4"
        );
        testOrdinalCalc("w ^ (w ^ (w+1) + 1)", "w^(w^(w+1)+1)");
        testOrdinalCalc("2 ^ (w^w)", "w^w^w");
        testOrdinalCalc("3 ^ (w^2*5 + w*4 + 3)", "w^(w*5+4)*27");
        testOrdinalCalc("2 ^ ( (w+1)^2 )", "w^(w+1)*2");
        testOrdinalCalc("(w^w + w + 1)^2", "w^(w*2)+w^(w+1)+w^w+w+1");
        testOrdinalCalc("(w*2+3)^3", "w^3*2+w^2*6+w*6+3");

        testOrdinalCalc("(w^2+1) ^ (w*2+1)", "w^(w*2+2)+w^(w*2)");
        testOrdinalCalc("(w^w) ^ (w^w)", "w^w^w");
        testOrdinalCalc("(w+1) ^ (w^2)", "w^w^2");
        testOrdinalCalc("(w^0+1)^(w*0+1)", "2");
        testOrdinalCalc("(w * ( (w^0 * 0) + 1) ) ^ ( ( (w+1)^0 ) * w )", "w^w");
        testOrdinalCalc(
          "(w^2*2 + w*3 + 4) * (w^3*5 + w*6 + 7)",
          "w^5*5+w^3*6+w^2*14+w*3+4"
        );

        testOrdinalCalc("w^w^w", "w^w^w");
        testOrdinalCalc("2^w^w^w", "w^w^w^w");
        testOrdinalCalc("(w+1)^(w+1)^(w+1)", "w^(w^(w+1)+w^w)");
        testOrdinalCalc("2^(w*2)", "w^2");
        testOrdinalCalc("4^(w^7+3)", "w^w^6*64");
        testOrdinalCalc(
          "(w^(w^w+1)*2+3)^(w^(w^2+w*2)*3+2)",
          "w^(w^(w^2+w*2)*3+w^w*2+1)*2+w^(w^(w^2+w*2)*3+w^w+1)*6+w^(w^(w^2+w*2)*3)*3"
        );

        testOrdinalCalc("w^100", "w^100");
        testOrdinalCalc("(w+1)^10", "w^10+w^9+w^8+w^7+w^6+w^5+w^4+w^3+w^2+w+1");
        testOrdinalCalc(
          "(w^(w^2*2+1)+w^2)^(w+5)",
          "w^(w^3+w^2*10+1)+w^(w^3+w^2*8+3)"
        );
        testOrdinalCalc(
          "(w^(w^2+4)+3)^(w+10)",
          "w^(w^3+w^2*10+4)+w^(w^3+w^2*9+4)*3+w^(w^3+w^2*8+4)*3+w^(w^3+w^2*7+4)*3+w^(w^3+w^2*6+4)*3+w^(w^3+w^2*5+4)*3+w^(w^3+w^2*4+4)*3+w^(w^3+w^2*3+4)*3+w^(w^3+w^2*2+4)*3+w^(w^3+w^2+4)*3+w^w^3*3"
        );
        /*
            testOrdinalCalc("e_0 + w", "w^e_0+w");
            testOrdinalCalc("w + e_0", "e_0");
            testOrdinalCalc("e_0 + e_0", "w^e_0*2");
            testOrdinalCalc("e_0 + w^w", "w^e_0+w^w");
            testOrdinalCalc("w^w + e_0", "e_0");
            testOrdinalCalc("e_0 * w^w^w", "w^(w^e_0+w^w)");
            testOrdinalCalc("w^w^w + e_0", "e_0");
            testOrdinalCalc("e_0^w^w^w^w", "w^(w^e_0+w^w^w)");
            testOrdinalCalc("w^w^w^w + e_0", "e_0");
            testOrdinalCalc("(w+1)^e_0", "e_0");
            testOrdinalCalc("2^e_0", "e_0");
            testOrdinalCalc("e_0^2", "w^(w^e_0*2)");
            */

        // --- Tetration Tests --- (from original)
        testOrdinalCalc("e_0^^0", "1");
        testOrdinalCalc("e_0^^1", "e_0");

        testOrdinalCalc("0^^0", "1");
        testOrdinalCalc("1^^0", "1");
        testOrdinalCalc("2^^0", "1");
        testOrdinalCalc("w^^0", "1");

        testOrdinalCalc("0^^1", "0");
        testOrdinalCalc("1^^1", "1");
        testOrdinalCalc("2^^1", "2");
        testOrdinalCalc("w^^1", "w");

        testOrdinalCalc("2^^2", "4");
        testOrdinalCalc("2^^3", "16");
        testOrdinalCalc("2^^4", "65536");
        testOrdinalCalc("3^^2", "27");
        testOrdinalCalc("w^^2", "w^w");

        testOrdinalCalc("0^^w", "Operation 0 ^^ w is undefined.");
        testOrdinalCalc("0^^(w*2)", "Operation 0 ^^ w*2 is undefined.");

        testOrdinalCalc("1^^w", "1");
        testOrdinalCalc("1^^(w^w)", "1");

        testOrdinalCalc("2^^w", "w");
        testOrdinalCalc("3^^(w+1)", "w");
        testOrdinalCalc("10^^(w^2)", "w");

        testOrdinalCalc("w^^w", "e_0");
        testOrdinalCalc("(w+1)^^w", "e_0");
        testOrdinalCalc("(w^2)^^(w*2)", "e_0");
        testOrdinalCalc("(w^w)^^w", "e_0");

        testOrdinalCalc("1^^e_0", "1");
        testOrdinalCalc("2^^e_0", "w");
        testOrdinalCalc("100^^e_0", "w");
        testOrdinalCalc("w^^e_0", "e_0");
        testOrdinalCalc("(w+5)^^e_0", "e_0");
        testOrdinalCalc("(w^w)^^e_0", "e_0");

        testOrdinalCalc("2^^3+1", "17");
        testOrdinalCalc("1+2^^3", "17");
        testOrdinalCalc("2*3^^2", "54");
        testOrdinalCalc("2^^2*3", "12");
        testOrdinalCalc("2^3^^2", "16777216");
        testOrdinalCalc("(2^^3)^2", "256");
        testOrdinalCalc("2^^3^2", "BigInt is too large to allocate");
        testOrdinalCalc("3^^3", "7625597484987");
        testOrdinalCalc("2^^4", "65536");
        testOrdinalCalc("2^^w+1", "w+1");
        testOrdinalCalc("w^^(w+1)", "e_0");
        testOrdinalCalc("(w+1)^^(w+1)", "e_0");

        testOrdinalCalc("", "0");

        // --- WTowerOrdinal Tests (Manual Instantiation from original) ---
        console.log("runAllTestsAndRender: Starting WTower tests...");
        testWTowerOrdinal("w^^0 toCNF", 0, "1");
        testWTowerOrdinal("w^^1 toCNF", 1, "w");
        testWTowerOrdinal("w^^2 toCNF", 2, "w^w");
        // testWTowerOrdinal("w^^3 toCNF", 3, "w^(w^w)"); // This can be very slow

        try {
          /* WTower ops that use testOrdinalCalc */
          OperationTracer.setGlobalTracer(1000000);
          let wt0_cnf_str = toCnfString(new WTowerOrdinal(0).toCNFOrdinal());
          let wt1_cnf_str = toCnfString(new WTowerOrdinal(1).toCNFOrdinal());
          let wt2_cnf_str = toCnfString(new WTowerOrdinal(2).toCNFOrdinal());
          testOrdinalCalc("(" + wt1_cnf_str + ") + 1", "w+1");
          testOrdinalCalc("(" + wt0_cnf_str + ") * w", "w");
          testOrdinalCalc("2 + (" + wt1_cnf_str + ")", "w");
          testOrdinalCalc(
            "(" + wt1_cnf_str + ") * (" + wt1_cnf_str + ")",
            "w^2"
          );
          testOrdinalCalc("(" + wt2_cnf_str + ") + 0", "w^w");
          testOrdinalCalc("(" + wt1_cnf_str + ")^2", "w^2");
        } catch (e: unknown) {
          testStats.CNF.failed++;
          testStats.CNF.total++;
          const cnfContainer = document.getElementById(
            testStats.CNF.containerId
          );
          if (cnfContainer) {
            logToPage(
              "Error setting up WTowerOrdinal operation tests (counted as CNF failure): " +
                toErrorMessage(e),
              "error-message",
              cnfContainer
            );
          }
        }

        // --- Simplify Tests (from original) ---
        console.log("runAllTestsAndRender: Starting Simplify tests...");
        // Finite Ordinals
        testOrdinalSimplify("Finite fits", "123", 10, "123", 7);
        testOrdinalSimplify(
          "Finite does not fit, fallback to 0",
          "12345",
          3,
          "0",
          3
        );
        testOrdinalSimplify("Finite cannot fit 0", "123", 0, "0", 0);

        // EpsilonNaughtOrdinal
        testOrdinalSimplify("e_0 fits", "e_0", 8, "e_0", 2);
        testOrdinalSimplify(
          "e_0 does not fit, fallback to 0",
          "e_0",
          2,
          "0",
          2
        );
        testOrdinalSimplify("e_0 cannot fit 0", "e_0", 0, "0", 0);

        // WTowerOrdinal (manual simplify tests from original)
        try {
          OperationTracer.setGlobalTracer(100000);
          let wt0 = new WTowerOrdinal(0);
          let wt1 = new WTowerOrdinal(1);
          let wt2 = new WTowerOrdinal(2);
          testManualSimplify("w^^0 fits", wt0, 10, "w^^0", 6);
          testManualSimplify("w^^1 fits", wt1, 10, "w^^1", 6);
          testManualSimplify("w^^2 fits", wt2, 5, "w^^2", 1);
          testManualSimplify(
            "w^^0 does not fit, fallback to 1",
            wt0,
            2,
            "1",
            1
          );
          testManualSimplify(
            "w^^0 does not fit, fallback to 0",
            wt0,
            0,
            "0",
            0
          );
          testManualSimplify(
            "w^^1 does not fit, fallback to w",
            wt1,
            3,
            "w",
            2
          );
          testManualSimplify(
            "w^^1 does not fit, fallback to w",
            wt1,
            1,
            "w",
            0
          );
          testManualSimplify(
            "w^^1 does not fit, fallback to 0",
            wt1,
            0,
            "0",
            0
          );
          testManualSimplify("w^^2 cannot fit", wt2, 2, "0", 2);
        } catch (e: unknown) {
          testStats.SIMPLIFY.failed++;
          testStats.SIMPLIFY.total++;
          const simplifyContainer = document.getElementById(
            testStats.SIMPLIFY.containerId
          );
          if (simplifyContainer) {
            logToPage(
              "Error in manual WTower simplify tests setup (counted as SIMPLIFY failure): " +
                toErrorMessage(e),
              "error-message",
              simplifyContainer
            );
          }
        }

        // CNFOrdinal - Sums (from original)
        testOrdinalSimplify("Sum: w+1 fits", "w+1", 10, "w+1", 7);
        testOrdinalSimplify("Sum: w+1 too small budget", "w+1", 2, "w", 1);
        testOrdinalSimplify("Sum: w*2+w+5, budget 7", "w*2+w+5", 7, "w*3+5", 2);
        testOrdinalSimplify(
          "Sum: w*2+w+5, budget 5 (truncates last term)",
          "w*2+w+5",
          5,
          "w*3+5",
          0
        );
        testOrdinalSimplify(
          "Sum: w*2+w+5, budget 4 (truncates more)",
          "w*2+w+5",
          4,
          "w*3",
          1
        );
        testOrdinalSimplify(
          "Sum: w*2+w+5, budget 2 (truncates to first possible)",
          "w*2+w+5",
          2,
          "w",
          1
        );
        testOrdinalSimplify("Sum: w*2+w+5, budget 0", "w*2+w+5", 0, "0", 0);

        // CNFOrdinal - MPT Fallback to WTower (from original)
        testOrdinalSimplify("MPT: w^(w^w) fits", "w^(w^w)", 10, "w^w^w", 1);
        testOrdinalSimplify(
          "MPT: w^(w^w) too costly, fallback WTower",
          "w^(w^w)",
          8,
          "w^^3",
          4
        );
        testOrdinalSimplify(
          "MPT: w^(w^w) WTower fallback too costly, fallback 0",
          "w^(w^w)",
          3,
          "0",
          3
        );

        // CNFOrdinal - w^b*m rule (from original)
        testOrdinalSimplify("w^b*m: w^w*2, budget 10", "w^w*2", 10, "w^w*2", 3);
        testOrdinalSimplify(
          "w^b*m: w^w*2, budget 8 (MPT fail for term)",
          "w^w*2",
          8,
          "w^w*2",
          1
        );
        testOrdinalSimplify(
          "w^b*m: w^2*10, budget 10",
          "w^2*10",
          10,
          "w^2*10",
          2
        );
        testOrdinalSimplify(
          "w^b*m: w^2*10, budget 7 (MPT fail for term)",
          "w^2*10",
          7,
          "w^2",
          2
        );

        testOrdinalSimplify(
          "Skip MPTF interaction",
          "w^(w^2+w)",
          10,
          "w^w^2",
          1
        );

        testOrdinalSimplify("", "w^w^w^w^w^w^2", 15, "w^^6", 11);
        testOrdinalSimplify("", "w^^5", 15, "w^^5", 11);
        testOrdinalSimplify("", "w^(w^2*20+w*2+5)", 15, "w^(w^2*20+w)", 1);
        testOrdinalSimplify("", "w^(w^(w+100000)*20+w*2+5)", 15, "w^w^w", 6);
        testOrdinalSimplify(
          "",
          "(w^(w^3*2+4)+w^2+100)*2",
          15,
          "w^(w^3*2+4)*2",
          0
        );
        testOrdinalSimplify("", "w^(w^3+10)+w*2+100000", 15, "w^(w^3+10)+w", 1);
        testOrdinalSimplify("", "w^(w^3)+w^22*2+10", 15, "w^w^3", 6);
        // --- End of Simplify Tests (as per original) ---

        // --- Complexity Tests (from original) ---
        console.log("runAllTestsAndRender: Starting Complexity tests...");
        testOrdinalComplexity("0", 0);
        testOrdinalComplexity("5", 1);
        testOrdinalComplexity("123", 3);

        testOrdinalComplexity("w", 1);
        testOrdinalComplexity("w*7", 1 + 2);
        testOrdinalComplexity("w*789", 3 + 2);

        testOrdinalComplexity("w^2", 1 + 4);
        testOrdinalComplexity("w^10", 2 + 4);
        testOrdinalComplexity("w^w", 1 + 4);

        testOrdinalComplexity("w^2*3", 1 + 1 + 5);
        testOrdinalComplexity("w^w*12", 1 + 2 + 5);

        testOrdinalComplexity("w+1", 1 + 1 + 1);
        testOrdinalComplexity("w^2+w*3+5", 11); // Pre-calculated: (1+4)+(1+2)+1+(1)+1 = 11

        testOrdinalComplexity("w^w^w", 9);
        testOrdinalComplexity("w^^4", 13);
        testOrdinalComplexity("w^^20", 5);

        testOrdinalComplexity("e_0", 6);

        try {
          /* Manual complexity tests for WTowerOrdinal from original */
          OperationTracer.setGlobalTracer(100000);
          let wtHeight0 = new WTowerOrdinal(0);
          let wtHeight7 = new WTowerOrdinal(7);
          let wtHeight123 = new WTowerOrdinal(123);

          testManualComplexity("w^^0", wtHeight0, 1 + 3);
          testManualComplexity("w^^7", wtHeight7, 1 + 3);
          testManualComplexity("w^^123", wtHeight123, 3 + 3);
        } catch (e: unknown) {
          testStats.COMPLEXITY.failed++;
          testStats.COMPLEXITY.total++;
          const complexityContainer = document.getElementById(
            testStats.COMPLEXITY.containerId
          );
          if (complexityContainer) {
            logToPage(
              "Error setting up/running manual WTowerOrdinal complexity tests (counted as COMPLEXITY failure): " +
                toErrorMessage(e),
              "error-message",
              complexityContainer
            );
          }
        }
        // --- End of Complexity Tests (as per original) ---
        // --- ORIGINAL TEST CASES END ---

        // --- Inverse Mapping Tests ---
        console.log("runAllTestsAndRender: Starting Inverse Mapping tests...");
        testFInverse("Finite ordinal 0", 0, "0");
        testFInverse("Finite ordinal 0.5", 0.5, "1");
        testFInverse("Finite ordinal 0.9", 0.9, "9");
        testFInverse("ω", 1, "w");
        testFInverse("ω + 1", 1.25, "w+1"); // Assuming convertFFormatToOrdinalInstance and sum handling works
        testFInverse("ω * 2", 1.5, "w*2");
        testFInverse("ω^2", 2, "w^2");
        testFInverse("ω^2 + ω", 2.0833333333333335, "w^2+w");
        testFInverse("ω^ω", 3.6666666666666665, "w^w^w");
        testFInverse("ω^ω^3", 3.4, "w^w^3");
        testFInverse("ω^3", 2.3333333333333335, "w^3");
        testFInverse("ω^4", 2.5, "w^4");
        testFInverse("ω^4*4", 2.575, "w^4*4");
        testFInverse("ω^4*4", 2.575, "w^4*4");
        testFInverse("ω^4*5+3", 2.581, "w^4*5+3");
        testFInverse("ω^ω + 1", 3.0053763440860215, "w^w+1");
        testFInverse("ω^(ω+1)", 3.064516129032258, "w^(w+1)");
        testFInverse("10/3", 3.333333333333333, "w^(w^2+w*3+1)+w^13*26");
        testFInverse(
          "Arbitrary",
          4.9216738286475129,
          "w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^w^(w^w^(w+1)*15+w^10*7+2)"
        );
        testFInverse("w^^400", 4.99, "w^^400");
        testFInverse("w^^4000", 4.999, "w^^4000");
        testFInverse("w^^40000", 4.9999, "w^^40000");
        testFInverse("w^^444", 4.991, "w^^444");
        testFInverse("ε₀", 5, "e_0");
        testFInverse("Threshold test (just below 1)", 0.99999999999999, "w"); // f(9) = 0.9. This test might need adjustment based on fInverse precision for values very close to 1.
        testFInverse("Threshold test (just above 1)", 1.00000000000001, "w");
        // Error cases: Expected error message should be based on what fInverse actually throws.
        // Let's assume it throws "Input value X is outside the valid range [0,5]"
        testFInverse(
          "Error case: negative input",
          -1,
          "Input value -1 is outside the valid range [0,5]",
          true
        );
        testFInverse(
          "Error case: input > 5",
          5.1,
          "Input value 5.1 is outside the valid range [0,5]",
          true
        );

        // --- Monotonicity Checks ---
        performSanityChecks();

        // --- Render all results ---
        renderAllKindResults();
        updateOverallPageSummary();

        // Add event listeners for collapsibles
        document
          .querySelectorAll<HTMLDetailsElement>("details.test-kind-section")
          .forEach((detailsElement) => {
            detailsElement.addEventListener("toggle", () => {
              const kindKey = detailsElement.id.replace(
                "details-",
                ""
              ) as TestKind;
              renderSingleKindOutput(kindKey);
              // No need to call updateKindSummary here, it's done initially
              // and doesn't change based on collapse/expand, only on test re-runs.
            });
          });
        console.log(
          "runAllTestsAndRender: Finished, event listeners attached."
        );
      }

      function renderSingleKindOutput(kindKey: TestKind): void {
        const detailsElementForLog = document.getElementById(
          "details-" + kindKey
        ) as HTMLDetailsElement | null;
        console.log(
          `[${kindKey}] renderSingleKindOutput: START. Details open: ${
            detailsElementForLog
              ? detailsElementForLog.open
              : "details_element_not_found"
          }`
        );
        const kindData = testStats[kindKey];
        const detailsElement = document.getElementById(
          "details-" + kindKey
        ) as HTMLDetailsElement | null;

        // Correctly select the preview container using its ID
        const previewContainer = document.getElementById(
          kindData.previewId
        ) as HTMLElement | null;
        // The main container for when 'details' is open (this is the div with class 'test-results-output')
        const mainResultsOutputContainer = document.getElementById(
          kindData.containerId
        ) as HTMLElement | null;
        // Inside mainResultsOutputContainer, there's a div with class 'passed-tests-container'
        // This will be used to hold ALL tests when the details section is expanded.
        const allTestsContainerWhenOpen =
          mainResultsOutputContainer?.querySelector<HTMLElement>(
            ".passed-tests-container"
          ) ?? null;

        if (!kindData) {
          console.error(
            `[${kindKey}] renderSingleKindOutput: kindData is missing.`
          );
          return;
        }
        if (!detailsElement) {
          console.warn(
            `[${kindKey}] renderSingleKindOutput: Details element #details-${kindKey} NOT FOUND.`
          );
          return;
        } // Critical
        if (!previewContainer) {
          console.error(
            `[${kindKey}] renderSingleKindOutput: previewContainer (#${kindData.previewId}) NOT FOUND.`
          );
          return;
        } // Critical
        if (!mainResultsOutputContainer) {
          console.error(
            `[${kindKey}] renderSingleKindOutput: Main results output container #${kindData.containerId} NOT FOUND.`
          );
          return;
        } // Critical
        if (!allTestsContainerWhenOpen) {
          console.error(
            `[${kindKey}] renderSingleKindOutput: allTestsContainerWhenOpen (.passed-tests-container) NOT FOUND within #${kindData.containerId}.`
          );
          return;
        } // Critical

        console.log(
          `[${kindKey}] renderSingleKindOutput: Clearing containers. Preview: ${
            previewContainer.id
          }, AllWhenOpen: ${allTestsContainerWhenOpen.id || "N/A"}`
        );
        previewContainer.innerHTML = "";
        allTestsContainerWhenOpen.innerHTML = "";

        const isExpanded = detailsElement.open;
        const allKindResults = kindData.results;
        const failedTests = allKindResults.filter((result) => !result.passed);
        const passedTests = allKindResults.filter((result) => result.passed);

        console.log(
          `[${kindKey}] renderSingleKindOutput: Expanded: ${isExpanded}. Total: ${allKindResults.length}, Failed: ${failedTests.length}, Passed: ${passedTests.length}`
        );

        if (isExpanded) {
          // EXPANDED STATE: Show all tests (failed then passed) in allTestsContainerWhenOpen
          previewContainer.style.display = "none"; // Hide the separate failed preview
          // mainResultsOutputContainer itself is part of <details>, so its display is handled by <details>
          // allTestsContainerWhenOpen is inside mainResultsOutputContainer

          if (allKindResults.length === 0) {
            logToPage(
              `No ${kindKey} tests were run or recorded results.`,
              "",
              allTestsContainerWhenOpen
            );
          } else {
            if (failedTests.length > 0) {
              const failedHeader = document.createElement("h4");
              failedHeader.textContent = `Failed ${kindKey} Tests:`;
              failedHeader.className = "status-failed";
              allTestsContainerWhenOpen.appendChild(failedHeader);
              failedTests.forEach((result) => {
                const testCaseDiv = document.createElement("div");
                testCaseDiv.className = "test-case status-failed"; // Add status class for styling
                result.detailsElements.forEach((element) =>
                  testCaseDiv.appendChild(element.cloneNode(true))
                );
                allTestsContainerWhenOpen.appendChild(testCaseDiv);
              });
            }
            if (passedTests.length > 0) {
              const passedHeader = document.createElement("h4");
              passedHeader.textContent = `Passed ${kindKey} Tests:`;
              passedHeader.className = "status-passed";
              allTestsContainerWhenOpen.appendChild(passedHeader);
              passedTests.forEach((result) => {
                const testCaseDiv = document.createElement("div");
                testCaseDiv.className = "test-case status-passed"; // Add status class for styling
                result.detailsElements.forEach((element) =>
                  testCaseDiv.appendChild(element.cloneNode(true))
                );
                allTestsContainerWhenOpen.appendChild(testCaseDiv);
              });
            }
            if (
              failedTests.length === 0 &&
              passedTests.length > 0 &&
              allKindResults.length > 0
            ) {
              // If only passed tests, and some tests exist, give a summary message.
              // This might be redundant if headers are added as above. Consider if needed.
              // logToPage(`All ${passedTests.length} ${kindKey} tests passed.`, 'status-passed', allTestsContainerWhenOpen);
            }
            if (
              failedTests.length === 0 &&
              passedTests.length === 0 &&
              allKindResults.length > 0
            ) {
              // This case implies results exist but neither failed nor passed, which is odd.
              logToPage(
                `Found ${allKindResults.length} ${kindKey} results, but none are marked as passed or failed. Check test logic.`,
                "error-message",
                allTestsContainerWhenOpen
              );
            }
          }
        } else {
          // COLLAPSED STATE: Show only failed tests in previewContainer
          // mainResultsOutputContainer and its child allTestsContainerWhenOpen are hidden by <details> being closed.

          if (failedTests.length > 0) {
            previewContainer.style.display = "block"; // Ensure failed preview is visible
            const failedPreviewHeader = document.createElement("h4");
            failedPreviewHeader.textContent = `Failed ${kindKey} Tests (${failedTests.length} of ${allKindResults.length} total):`;
            failedPreviewHeader.className = "status-failed";
            previewContainer.appendChild(failedPreviewHeader);

            failedTests.forEach((result) => {
              const testCaseDiv = document.createElement("div");
              testCaseDiv.className = "test-case status-failed"; // Add status class for styling
              result.detailsElements.forEach((element) =>
                testCaseDiv.appendChild(element.cloneNode(true))
              );
              previewContainer.appendChild(testCaseDiv);
            });
            // Add a note to expand for all tests
            const expandNote = document.createElement("p");
            expandNote.textContent = `(Expand to see all ${allKindResults.length} tests)`;
            expandNote.style.fontStyle = "italic";
            previewContainer.appendChild(expandNote);
          } else if (allKindResults.length > 0) {
            // All passed
            previewContainer.style.display = "block";
            const allPassedMessage = document.createElement("p");
            allPassedMessage.textContent = `All ${passedTests.length} ${kindKey} tests passed.`;
            allPassedMessage.className = "status-passed";
            previewContainer.appendChild(allPassedMessage);
            // Add a note to expand for details
            const expandNote = document.createElement("p");
            expandNote.textContent = `(Expand to see details)`;
            expandNote.style.fontStyle = "italic";
            previewContainer.appendChild(expandNote);
          } else {
            // No tests for this kind
            previewContainer.style.display = "block";
            logToPage(
              `No ${kindKey} tests were run or recorded results.`,
              "",
              previewContainer
            );
          }
        }

        console.log(`[${kindKey}] renderSingleKindOutput: END.`);
      }

      function renderAllKindResults(): void {
        console.log("renderAllKindResults: Started");
        for (const kindKey of Object.keys(testStats) as TestKind[]) {
          console.log(`renderAllKindResults: Processing kind: ${kindKey}`);
          updateKindSummary(kindKey); // Update the summary line in the <summary> tag
          renderSingleKindOutput(kindKey); // Render the output based on initial (collapsed) state
        }
      }

      function updateKindSummary(kindKey: TestKind): void {
        console.log(`updateKindSummary: Updating summary for ${kindKey}`);
        console.log(
          `Stats for ${kindKey}: Total=${
            kindKey === "MONOTONICITY"
              ? testStats[kindKey].total_pairs
              : testStats[kindKey].total
          }, Passed=${
            kindKey === "MONOTONICITY"
              ? testStats[kindKey].passed_pairs
              : testStats[kindKey].passed
          }, Failed=${
            kindKey === "MONOTONICITY"
              ? testStats[kindKey].failed_pairs
              : testStats[kindKey].failed
          }`
        );
        const stats = testStats[kindKey];
        const summaryDiv = document.getElementById(stats.summaryId);
        if (summaryDiv) {
          let text = "";
          if (kindKey === "MONOTONICITY") {
            text = `Monotonicity: ${stats.total_pairs} pairs, ${stats.passed_pairs} passed, ${stats.failed_pairs} failed.`;
            summaryDiv.className =
              stats.failed_pairs > 0
                ? "kind-summary status-failed"
                : "kind-summary status-passed";
          } else {
            text = `${kindKey} Tests: ${stats.total} run, ${stats.passed} passed, ${stats.failed} failed.`;
            summaryDiv.className =
              stats.failed > 0
                ? "kind-summary status-failed"
                : "kind-summary status-passed";
          }
          summaryDiv.textContent = text;
          summaryDiv.style.display =
            stats.total > 0 || stats.total_pairs > 0 ? "block" : "none";
        }
      }

      function updateOverallPageSummary(): void {
        console.log("updateOverallPageSummary: Started");
        if (!overallSummaryDetailsDiv) {
          console.warn(
            "updateOverallPageSummary: overall summary container not found."
          );
          return;
        }
        let overallPass = true;
        let totalTestsActuallyRun = 0;
        overallSummaryDetailsDiv.innerHTML = ""; // Clear previous summary lines

        for (const kindKey of Object.keys(testStats) as TestKind[]) {
          const stats = testStats[kindKey];
          const numRunThisKind =
            kindKey === "MONOTONICITY" ? stats.total_pairs : stats.total;
          totalTestsActuallyRun += numRunThisKind;

          if (numRunThisKind > 0) {
            // Only include kinds that ran tests in summary
            const kindSummaryLineDiv = document.createElement("div");
            kindSummaryLineDiv.className = "summary-line";
            if (kindKey === "MONOTONICITY") {
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
          overallStatusIndicatorDiv.className = "status-overall-pass";
        } else if (totalTestsActuallyRun === 0) {
          overallStatusIndicatorDiv.textContent = "No tests were run.";
          overallStatusIndicatorDiv.className = "status-overall-pending";
        } else {
          overallStatusIndicatorDiv.textContent = "FAILURES DETECTED!";
          overallStatusIndicatorDiv.className = "status-overall-fail";
        }
        console.log("updateOverallPageSummary: Completed");
      }

      function performSanityChecks(): void {
        // Refactored slightly for new stats structure
        console.log("performSanityChecks: Started");
        const kindKey = "MONOTONICITY";
        const stats = testStats[kindKey];
        stats.total_pairs = 0;
        stats.passed_pairs = 0;
        stats.failed_pairs = 0;
        stats.results = [];

        const outputContainer = document.getElementById(
          stats.containerId
        ) as HTMLElement | null; // Keep for reference, though direct logging is removed
        if (!outputContainer) {
          console.error("Monotonicity output container not found");
          return;
        }

        const numResults = successfulCNFTestResultsForMapping.length;
        const EPSILON = 1e-12;
        const fInverseThreshold = 1e-14;

        if (numResults < 2) {
          console.log(
            "performSanityChecks: Completed (not enough results for pairwise comparison)"
          );
          return;
        }
        stats.total_pairs = (numResults * (numResults - 1)) / 2;

        for (let i = 0; i < numResults; i++) {
          for (let j = i + 1; j < numResults; j++) {
            const resA = successfulCNFTestResultsForMapping[i];
            const resB = successfulCNFTestResultsForMapping[j];
            const ordA = resA.ordinal;
            const ordB = resB.ordinal;
            const fA = resA.mappedValue;
            const fB = resB.mappedValue;
            let detailMsg = `Comparing ("${resA.input}" -> ${resA.cnf}) vs ("${resB.input}" -> ${resB.cnf}):\n`;
            let pairCheckPassed = true;
            const ordinalComparison = ordA.compareTo(ordB);
            if (ordinalComparison < 0) {
              detailMsg += `  Ord: A < B. Map: f(A)=${fA.toFixed(
                8
              )}, f(B)=${fB.toFixed(8)}. `;
              if (!(fA - EPSILON < fB)) {
                pairCheckPassed = false;
                detailMsg += `Monotonicity FAIL (exp f(A) < f(B))`;
              } else {
                detailMsg += `Monotonicity PASS`;
              }
            } else if (ordinalComparison > 0) {
              detailMsg += `  Ord: A > B. Map: f(A)=${fA.toFixed(
                8
              )}, f(B)=${fB.toFixed(8)}. `;
              if (!(fA + EPSILON > fB)) {
                pairCheckPassed = false;
                detailMsg += `Monotonicity FAIL (exp f(A) > f(B))`;
              } else {
                detailMsg += `Monotonicity PASS`;
              }
            } else {
              detailMsg += `  Ord: A == B. Map: f(A)=${fA.toFixed(
                8
              )}, f(B)=${fB.toFixed(8)}. `;
              if (!(Math.abs(fA - fB) < EPSILON)) {
                pairCheckPassed = false;
                detailMsg += `Monotonicity FAIL (exp f(A) == f(B))`;
              } else {
                detailMsg += `Monotonicity PASS`;
              }
            }

            const pElement = document.createElement("p");
            pElement.textContent = detailMsg;
            pElement.classList.add("log-output");
            if (!pairCheckPassed) pElement.classList.add("comparison-fail");
            stats.results.push({
              passed: pairCheckPassed,
              detailsElements: [pElement],
            });

            if (pairCheckPassed) stats.passed_pairs++;
            else stats.failed_pairs++;
          }
        }

        console.log("performSanityChecks: Completed");
        console.log(
          "Current MONOTONICITY stats after checks:",
          JSON.stringify(testStats.MONOTONICITY)
        );
      }

      // Global error handler to catch test failures
      let hasUnhandledErrors = false;
      window.addEventListener("error", (event: ErrorEvent) => {
        console.error("UNHANDLED ERROR during testing:", event.error);
        hasUnhandledErrors = true;
        // Force all test sections to show failure if there are unhandled errors
        for (const kindKey of Object.keys(testStats) as TestKind[]) {
          if (testStats[kindKey].total === 0) {
            testStats[kindKey].failed = 1;
            testStats[kindKey].total = 1;
          }
        }
      });

      // Wrapper function to safely execute test sections
      function executeTestSection(
        sectionName: string,
        testFunction: () => void
      ): void {
        try {
          testFunction();
        } catch (error: unknown) {
          console.error(
            `CRITICAL ERROR in ${sectionName} test section:`,
            error
          );
          hasUnhandledErrors = true;

          // Force a failed test to be recorded
          const kindKey = sectionName
            .toUpperCase()
            .replace(/\s+/g, "_") as TestKind;
          const maybeStats = testStats[kindKey];
          if (maybeStats) {
            maybeStats.failed++;
            maybeStats.total++;
          }
        }
      }

      // Initialize global tracer for calculator tests
      OperationTracer.setGlobalTracer(2000000); // 2M operations budget
      console.log(
        "[GlobalTracer] Calculator test suite initialized with budget:",
        OperationTracer.getBudget()
      );

      try {
        runAllTestsAndRender();
      } catch (error: unknown) {
        console.error("CRITICAL ERROR during test execution:", error);
        document.body.innerHTML += `<div style="background: red; color: white; padding: 20px; margin: 20px;"><h2>CRITICAL TEST FAILURE</h2><p>Test execution failed: ${toErrorMessage(
          error
        )}</p></div>`;
      }

      // --- Test Runner ---

      function calculateAndSimplify(expr: string): CalculateAndSimplifyResult {
        try {
          OperationTracer.setGlobalTracer(1000000);
          const ord = parseOrdinal(expr);
          const simplified =
            typeof ord.simplify === "function"
              ? ord.simplify(1000)
              : { simplifiedOrdinal: ord };
          const simpOrd = simplified.simplifiedOrdinal || ord;
          let cnfCandidate: OrdinalBase = simpOrd;
          try {
            if (
              OPERATIONS.isInitialized() &&
              typeof cnfCandidate.isLessThanEpsilon0 === "function" &&
              cnfCandidate.isLessThanEpsilon0() &&
              OPERATIONS.canConvert(cnfCandidate, "CNF")
            ) {
              cnfCandidate = OPERATIONS.convert(cnfCandidate, "CNF");
            }
          } catch (convErr: unknown) {
            // keep simpOrd
          }
          const cnfString = toCnfString(cnfCandidate);
          return { cnfString, ordinalObject: cnfCandidate, error: null };
        } catch (e: unknown) {
          return { error: toErrorMessage(e) };
        }
      }

      function runTest(
        input: string,
        expected: string,
        simplifyOptions?: unknown
      ): { pass: boolean; message: string } {
        testCount++;
        const startTime = performance.now();
        try {
          const result = calculateAndSimplify(input);

          if (result.error) {
            return {
              pass: false,
              message: `Failed - Input: "${input}", Expected: "${expected}", Got Error: "${result.error}"`,
            };
          }
          const resultStr = result.cnfString;

          if (resultStr === expected) {
            return {
              pass: true,
              message: `Passed - Input: "${input}", Got: "${resultStr}"`,
            };
          } else {
            return {
              pass: false,
              message: `Failed - Input: "${input}", Expected: "${expected}", Got: "${resultStr}"`,
            };
          }
        } catch (e: unknown) {
          return {
            pass: false,
            message: `Failed - Input: "${input}", Expected: "${expected}", Got Exception: "${toErrorMessage(
              e
            )}"`,
          };
        }
      }

      // --- Test Cases ---
      const testCases = [
        // ... existing code ...
      ];
