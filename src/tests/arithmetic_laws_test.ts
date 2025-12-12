// Extracted from arithmetic_laws_test.html

// Original <scripttype="module">

      // Import functions directly from source files for IDE navigation support (F12 Go to Definition)
      import {
        f,
        fInverse,
        DEFAULT_F_PARAMS,
        convertFFormatToOrdinalInstance,
      } from "../ordinal_mapping/OrdinalMappingCompat.js";
      import { FParams } from "../ordinal_mapping/FParams.js";
      import { DoubleContext } from "../ordinal_mapping/Contexts.js";
      import { OperationTracer } from "../OperationTracer.js";
      import { OPERATIONS } from "../operations/Operations.js";
import type { OrdinalBase } from "../types/OrdinalBase.js";
import { ZeroOrdinal } from "../types/ZeroOrdinal.js";
      import { OneOrdinal } from "../types/OneOrdinal.js";
      import { FiniteOrdinal } from "../types/FiniteOrdinal.js";
      import { OmegaOrdinal } from "../types/OmegaOrdinal.js";
      import { CNFOrdinal } from "../types/CNFOrdinal.js";
      import { EpsilonZero } from "../types/EpsilonZero.js";
      import { SimpleParser } from "../SimpleParser.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import { requireElementById } from "./testUtils.js";

type TestCategory = "single" | "pair" | "triple";

interface TestStatsBucket {
  examined: number;
  passed: number;
  aborted: number;
  failed: number;
}

interface ExampleBucket {
  passing: string[];
  aborted: string[];
  failed: string[];
}

interface TestExamples {
  single: ExampleBucket;
  pair: ExampleBucket;
  triple: ExampleBucket;
}

interface TestStats {
  single: TestStatsBucket;
  pair: TestStatsBucket;
  triple: TestStatsBucket;
}

interface TestState {
  running: boolean;
  paused: boolean;
  scaleParams: FParams<any> | null;
  minRange: number;
  maxRange: number;
  samplingExponent: number;
  randomSeed: number;
  skipCycles: number;
  rng: SeededRandom;
  stats: TestStats;
  examples: TestExamples;
}

interface ExecutionResult {
  status: "passed" | "failed" | "aborted";
  reason?: string;
}

interface TestListResult {
  name: string;
  status: "passed" | "failed" | "aborted" | "skipped";
  reason?: string;
}

class SeededRandom {
  seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  setSeed(seed: number): void {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getScaleParams = (): FParams<any> => {
  if (!testState.scaleParams) {
    throw new Error("Scale parameters are not initialized.");
  }
  return testState.scaleParams;
};

const isBudgetOrRecursionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message || "";
  return (
    message.includes("budget exceeded") ||
    message.includes("too much recursion") ||
    message.includes("Maximum call stack")
  );
};

      console.log(
        "[Test] Module loaded successfully, starting Arithmetic Laws tests..."
      );

      initializeTestEnvironment(10000000);
      console.log(
        "[GlobalTracer] Arithmetic Laws test suite initialized with budget:",
        OperationTracer.getBudget()
      );
    

// Original <script> tag

      // Pseudo-random number generator (Linear Congruential Generator)
      class SeededRandom {
        constructor(seed) {
          this.seed = seed % 2147483647;
          if (this.seed <= 0) this.seed += 2147483646;
        }

        next() {
          this.seed = (this.seed * 16807) % 2147483647;
          return (this.seed - 1) / 2147483646;
        }

        setSeed(seed) {
          this.seed = seed % 2147483647;
          if (this.seed <= 0) this.seed += 2147483646;
        }
      }

      // Global test state
      const testState: TestState = {
        running: false,
        paused: false,
        scaleParams: null,
        minRange: 0,
        maxRange: 5,
        samplingExponent: 1,
        randomSeed: 12345,
        skipCycles: 0,
        rng: new SeededRandom(12345),
        stats: {
          single: { examined: 0, passed: 0, aborted: 0, failed: 0 },
          pair: { examined: 0, passed: 0, aborted: 0, failed: 0 },
          triple: { examined: 0, passed: 0, aborted: 0, failed: 0 },
        },
        examples: {
          single: { passing: [], aborted: [], failed: [] },
          pair: { passing: [], aborted: [], failed: [] },
          triple: { passing: [], aborted: [], failed: [] },
        },
      };

      // UI Elements
      const startBtn = requireElementById<HTMLButtonElement>("startBtn");
      const pauseBtn = requireElementById<HTMLButtonElement>("pauseBtn");
      const stepBtn = requireElementById<HTMLButtonElement>("stepBtn");
      const resetBtn = requireElementById<HTMLButtonElement>("resetBtn");
      const statusText = requireElementById<HTMLDivElement>("statusText");

      // Configuration inputs
      const scaleAddInput = requireElementById<HTMLInputElement>("scaleAdd");
      const scaleMultInput = requireElementById<HTMLInputElement>("scaleMult");
      const scaleExpInput = requireElementById<HTMLInputElement>("scaleExp");
      const scaleTetInput = requireElementById<HTMLInputElement>("scaleTet");
      const minRangeInput = requireElementById<HTMLInputElement>("minRange");
      const maxRangeInput = requireElementById<HTMLInputElement>("maxRange");
      const samplingExponentInput = requireElementById<HTMLInputElement>("samplingExponent");
      const randomSeedInput = requireElementById<HTMLInputElement>("randomSeed");
      const skipCyclesInput = requireElementById<HTMLInputElement>("skipCycles");

      const initializePage = () => {
        console.log("Arithmetic Laws Test Suite loaded");
        initializeDefaults();
        updateUI();
        calculatePresetRanges();

        document
          .querySelectorAll("[data-set-min-range]")
          .forEach((button) => {
            const value = parseFloat(
              (button as HTMLElement).getAttribute("data-set-min-range") || "0"
            );
            button.addEventListener("click", () => setMinRange(value));
          });

        document
          .querySelectorAll("[data-set-max-range]")
          .forEach((button) => {
            const value = parseFloat(
              (button as HTMLElement).getAttribute("data-set-max-range") || "0"
            );
            button.addEventListener("click", () => setMaxRange(value));
          });

        document
          .querySelector('[data-action="min-range-omega-squared"]')
          ?.addEventListener("click", () => setMinRangeToOmegaSquared());
        document
          .querySelector('[data-action="min-range-omega-omega"]')
          ?.addEventListener("click", () => setMinRangeToOmegaOmega());
        document
          .querySelector('[data-action="max-range-omega-squared"]')
          ?.addEventListener("click", () => setMaxRangeToOmegaSquared());
        document
          .querySelector('[data-action="max-range-omega-omega"]')
          ?.addEventListener("click", () => setMaxRangeToOmegaOmega());
        document
          .querySelector('[data-action="max-range-epsilon-zero"]')
          ?.addEventListener("click", () => setMaxRangeToEpsilonZero());
        document
          .getElementById("generateSeedButton")
          ?.addEventListener("click", generateNewSeed);
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializePage, {
          once: true,
        });
      } else {
        initializePage();
      }

      function initializeDefaults(): void {
        // Set max range to DEFAULT_F_PARAMS.precomputed[5] value (f(ε₀))
        try {
          const defaultMaxValue = DEFAULT_F_PARAMS.precomputed[5].toString();
          maxRangeInput.value = defaultMaxValue;
          console.log("Set default max range to:", defaultMaxValue);
        } catch (error: unknown) {
          console.error("Error setting default max range:", error);
          maxRangeInput.value = 91; // fallback
        }

        // Initialize random seed to a random value
        //generateNewSeed();
        randomSeedInput.value = 1761031719;
      }

      function generateNewSeed(): void {
        const newSeed = Math.floor(Math.random() * 2147483647) + 1;
        randomSeedInput.value = newSeed.toString();
        console.log("Generated new random seed:", newSeed);
      }

      // Control button handlers
      startBtn.addEventListener("click", startTesting);
      pauseBtn.addEventListener("click", pauseTesting);
      stepBtn.addEventListener("click", stepTesting);
      resetBtn.addEventListener("click", resetTesting);

      function startTesting(): void {
        if (testState.paused) {
          // Resume testing
          testState.paused = false;
          testState.running = true;
        } else {
          // Start fresh testing
          testState.running = true;
          testState.paused = false;

          // Update configuration from UI
          updateConfiguration();
        }

        updateUI();
        runTestLoop();
      }

      function pauseTesting(): void {
        testState.running = false;
        testState.paused = true;
        updateUI();
      }

      async function stepTesting(): Promise<void> {
        console.log("[STEP] Step button pressed");

        // Always update configuration to ensure RNG is in correct state
        console.log("[STEP] Updating configuration and RNG state");
        updateConfiguration();

        console.log("[STEP] Before step - Stats:", {
          single: testState.stats.single.examined,
          pair: testState.stats.pair.examined,
          triple: testState.stats.triple.examined,
        });

        // Execute a single triple test and wait for it to complete
        await runSingleTripleStep();

        console.log("[STEP] After step - Stats:", {
          single: testState.stats.single.examined,
          pair: testState.stats.pair.examined,
          triple: testState.stats.triple.examined,
        });

        // Update UI to show results
        updateUI();
      }

      function resetTesting(): void {
        testState.running = false;
        testState.paused = false;

        // Reset all statistics
        testState.stats = {
          single: { examined: 0, passed: 0, aborted: 0, failed: 0 },
          pair: { examined: 0, passed: 0, aborted: 0, failed: 0 },
          triple: { examined: 0, passed: 0, aborted: 0, failed: 0 },
        };

        // Reset all examples
        testState.examples = {
          single: { passing: [], aborted: [], failed: [] },
          pair: { passing: [], aborted: [], failed: [] },
          triple: { passing: [], aborted: [], failed: [] },
        };

        updateUI();
      }

      function updateConfiguration(): void {
        // Create FParams object with current scale values using DoubleContext
        const ctx = new DoubleContext();
        testState.scaleParams = new FParams(
          ctx,
          ctx.fromNumber(parseFloat(scaleAddInput.value)),
          ctx.fromNumber(parseFloat(scaleMultInput.value)),
          ctx.fromNumber(parseFloat(scaleExpInput.value)),
          ctx.fromNumber(parseFloat(scaleTetInput.value)),
          ctx.fromNumber(3) // scaleEpsilon default
        );

        testState.minRange = parseFloat(minRangeInput.value);
        testState.maxRange = parseFloat(maxRangeInput.value);
        testState.samplingExponent = parseFloat(samplingExponentInput.value);

        // Update random seed and reinitialize RNG
        testState.randomSeed = parseInt(randomSeedInput.value, 10) || 0;
        testState.skipCycles = parseInt(skipCyclesInput.value, 10) || 0;
        testState.rng.setSeed(testState.randomSeed);

        // Skip the specified number of cycles
        if (testState.skipCycles > 0) {
          console.log(`Skipping ${testState.skipCycles} RNG cycles...`);
          for (let i = 0; i < testState.skipCycles; i++) {
            testState.rng.next();
          }
          console.log(
            `Skipped ${testState.skipCycles} cycles, RNG ready for testing`
          );
        }

        console.log("Updated random seed to:", testState.randomSeed);
      }

      function updateUI() {
        // Update control buttons
        startBtn.disabled = testState.running;
        pauseBtn.disabled = !testState.running;
        stepBtn.disabled = testState.running;
        resetBtn.disabled = testState.running;

        // Update status
        if (testState.running) {
          statusText.textContent = "Testing in progress...";
          statusText.className = "status-running";
        } else if (testState.paused) {
          statusText.textContent = "Testing paused";
          statusText.className = "status-paused";
        } else {
          statusText.textContent = "Ready to start testing";
          statusText.className = "status-stopped";
        }

        // Update statistics
        updateStats("single");
        updateStats("pair");
        updateStats("triple");

        // Update examples
        updateExamples("single");
        updateExamples("pair");
        updateExamples("triple");
      }

      function updateStats(category: TestCategory): void {
        const stats = testState.stats[category];
        requireElementById<HTMLElement>(`${category}Examined`).textContent =
          stats.examined.toString();
        requireElementById<HTMLElement>(`${category}Passed`).textContent =
          stats.passed.toString();
        requireElementById<HTMLElement>(`${category}Aborted`).textContent =
          stats.aborted.toString();
        requireElementById<HTMLElement>(`${category}Failed`).textContent =
          stats.failed.toString();
      }

      function updateExamples(category: TestCategory): void {
        const examples = testState.examples[category];

        const passingDiv = requireElementById<HTMLDivElement>(
          `${category}PassingExamples`
        );
        passingDiv.innerHTML = "";
        examples.passing.slice(0, 1).forEach((example) => {
          const div = document.createElement("div");
          div.className = "example-item passed";
          div.textContent = example;
          passingDiv.appendChild(div);
        });

        const abortedDiv = requireElementById<HTMLDivElement>(
          `${category}AbortedExamples`
        );
        abortedDiv.innerHTML = "";
        examples.aborted.slice(0, 3).forEach((example) => {
          const div = document.createElement("div");
          div.className = "example-item aborted";
          div.textContent = example;
          abortedDiv.appendChild(div);
        });

        const failedDiv =
          requireElementById<HTMLDivElement>(`${category}FailedExamples`);
        failedDiv.innerHTML = "";
        examples.failed.slice(0, 10).forEach((example) => {
          const div = document.createElement("div");
          div.className = "example-item failed";
          div.textContent = example;
          failedDiv.appendChild(div);
        });
      }

      // Range preset functions
      function setMinRange(value: number): void {
        minRangeInput.value = value.toString();
      }

      function setMaxRange(value: number): void {
        maxRangeInput.value = value.toString();
      }

      function calculatePresetRanges(): void {
        // Calculate f-values for common ordinals using current scale parameters
        updateConfiguration();

        try {
          // These will be calculated when preset buttons are clicked
          console.log("Preset ranges will be calculated on demand");
        } catch (error: unknown) {
          console.error("Error calculating preset ranges:", error);
        }
      }

      function setMinRangeToOmegaSquared(): void {
        updateConfiguration();
        try {
          const omegaSquared = new CNFOrdinal(
            [{ exponent: new FiniteOrdinal(2n, null), coefficient: 1n }],
            null
          );
          const fRep = omegaSquared.toFFormat();
          const fValue = f(fRep, getScaleParams());
          setMinRange(fValue);
        } catch (error: unknown) {
          console.error("Error calculating f(ω²):", error);
          setMinRange(2); // fallback
        }
      }

      function setMinRangeToOmegaOmega(): void {
        updateConfiguration();
        try {
          const omegaOmega = new CNFOrdinal(
            [{ exponent: OmegaOrdinal.instance(), coefficient: 1n }],
            null
          );
          const fRep = omegaOmega.toFFormat();
          const fValue = f(fRep, getScaleParams());
          setMinRange(fValue);
        } catch (error: unknown) {
          console.error("Error calculating f(ω^ω):", error);
          setMinRange(3); // fallback
        }
      }

      function setMaxRangeToOmegaSquared(): void {
        updateConfiguration();
        try {
          const omegaSquared = new CNFOrdinal(
            [{ exponent: new FiniteOrdinal(2n, null), coefficient: 1n }],
            null
          );
          const fRep = omegaSquared.toFFormat();
          const fValue = f(fRep, getScaleParams());
          setMaxRange(fValue);
        } catch (error: unknown) {
          console.error("Error calculating f(ω²):", error);
          setMaxRange(2); // fallback
        }
      }

      function setMaxRangeToOmegaOmega(): void {
        updateConfiguration();
        try {
          const omegaOmega = new CNFOrdinal(
            [{ exponent: OmegaOrdinal.instance(), coefficient: 1n }],
            null
          );
          const fRep = omegaOmega.toFFormat();
          const fValue = f(fRep, getScaleParams());
          setMaxRange(fValue);
        } catch (error: unknown) {
          console.error("Error calculating f(ω^ω):", error);
          setMaxRange(3); // fallback
        }
      }

      function setMaxRangeToEpsilonZero(): void {
        updateConfiguration();
        try {
          const epsilonZero = EpsilonZero.instance();
          const fRep = epsilonZero.toFFormat();
          const fValue = f(fRep, getScaleParams());
          setMaxRange(fValue);
        } catch (error: unknown) {
          console.error("Error calculating f(ε₀):", error);
          setMaxRange(91); // fallback - DEFAULT_F_PARAMS.precomputed[5] value
        }
      }

      // Random ordinal generation
      function generateRandomFValue(): number {
        const r = testState.samplingExponent;
        const min = testState.minRange;
        const max = testState.maxRange;

        // Generate uniform random in [0,1] using seeded RNG
        const u = testState.rng.next();

        // Transform to get desired distribution
        const minPowered = Math.pow(min, 1 / r);
        const maxPowered = Math.pow(max, 1 / r);
        const sampledPowered = minPowered + u * (maxPowered - minPowered);

        return Math.pow(sampledPowered, r);
      }

      function generateRandomOrdinal(): OrdinalBase {
        const fValue = generateRandomFValue();
        try {
          const fFormat = fInverse(fValue, getScaleParams());
          const ordinal = convertFFormatToOrdinalInstance(fFormat);
          return ordinal;
        } catch (error: unknown) {
          console.error("Error in fInverse or conversion:", error);
          // Fallback to a simple ordinal
          return new FiniteOrdinal(
            BigInt(Math.floor(testState.rng.next() * 100))
          );
        }
      }

      function generateTriple(): [OrdinalBase, OrdinalBase, OrdinalBase] {
        return [
          generateRandomOrdinal(),
          generateRandomOrdinal(),
          generateRandomOrdinal(),
        ];
      }

      // Single triple step function for debugging
      async function runSingleTripleStep(): Promise<void> {
        try {
          console.log("[STEP] Starting runSingleTripleStep");

          // Generate a random triple
          const triple = generateTriple();
          console.log(
            `[STEP] Generated triple: (${triple[0].toString()}, ${triple[1].toString()}, ${triple[2].toString()})`
          );

          console.log("[STEP] Running single ordinal tests...");
          // Run single ordinal tests (3 tests)
          for (let i = 0; i < 3; i++) {
            console.log(
              `[STEP] Single test ${i + 1}/3 for ordinal: ${triple[
                i
              ].toString()}`
            );
            await runSingleOrdinalTests(triple[i], i);
          }

          console.log("[STEP] Running pair tests...");
          // Run pair tests (6 tests - all ordered pairs)
          const pairs = [
            [triple[0], triple[1]],
            [triple[0], triple[2]],
            [triple[1], triple[0]],
            [triple[1], triple[2]],
            [triple[2], triple[0]],
            [triple[2], triple[1]],
          ];

          for (let i = 0; i < pairs.length; i++) {
            console.log(
              `[STEP] Pair test ${i + 1}/6 for pair: (${pairs[
                i
              ][0].toString()}, ${pairs[i][1].toString()})`
            );
            await runPairTests(pairs[i][0], pairs[i][1], i);
          }

          console.log("[STEP] Running triple tests...");
          // Run triple tests (6 tests - all permutations, but we'll do ordered selection)
          const triplePerms = [
            [triple[0], triple[1], triple[2]],
            [triple[0], triple[2], triple[1]],
            [triple[1], triple[0], triple[2]],
            [triple[1], triple[2], triple[0]],
            [triple[2], triple[0], triple[1]],
            [triple[2], triple[1], triple[0]],
          ];

          for (let i = 0; i < triplePerms.length; i++) {
            console.log(
              `[STEP] Triple test ${i + 1}/6 for triple: (${triplePerms[
                i
              ][0].toString()}, ${triplePerms[i][1].toString()}, ${triplePerms[
                i
              ][2].toString()})`
            );
            await runTripleTests(
              triplePerms[i][0],
              triplePerms[i][1],
              triplePerms[i][2],
              i
            );
          }

          console.log(
            `[STEP] Completed triple step. Stats - Single: ${testState.stats.single.examined}, Pair: ${testState.stats.pair.examined}, Triple: ${testState.stats.triple.examined}`
          );
        } catch (error: unknown) {
          console.error("Error in single triple step:", error);
        }
      }

      // Test execution functions
      async function runTestLoop(): Promise<void> {
        while (testState.running) {
          try {
            await runSingleTripleStep();

            // Update UI periodically
            updateUI();

            // Small delay to prevent UI freezing
            await new Promise((resolve) => setTimeout(resolve, 10));
          } catch (error: unknown) {
            console.error("Error in test loop:", error);
            // Continue testing despite errors
          }
        }
      }

      async function runSingleOrdinalTests(
        ordinal: OrdinalBase,
        index: number
      ): Promise<void> {
        // Placeholder for single ordinal tests
        // For now, all tests pass vacuously
        const testResult = runSingleOrdinalTestsImpl(ordinal);

        testState.stats.single.examined++;

        if (testResult.status === "passed") {
          testState.stats.single.passed++;
          if (testState.examples.single.passing.length < 1) {
            testState.examples.single.passing.push(
              `Test ${testState.stats.single.examined}: ${ordinal.toString()}`
            );
          }
        } else if (testResult.status === "aborted") {
          testState.stats.single.aborted++;
          if (testState.examples.single.aborted.length < 3) {
            testState.examples.single.aborted.push(
              `Test ${
                testState.stats.single.examined
              }: ${ordinal.toString()} - ${
                testResult.reason || "Budget exceeded"
              }`
            );
          }
        } else if (testResult.status === "failed") {
          testState.stats.single.failed++;
          if (testState.examples.single.failed.length < 10) {
            testState.examples.single.failed.push(
              `Test ${
                testState.stats.single.examined
              }: ${ordinal.toString()} - ${testResult.reason || "Test failed"}`
            );
          }
        }
      }

      async function runPairTests(
        ordinal1: OrdinalBase,
        ordinal2: OrdinalBase,
        index: number
      ): Promise<void> {
        // Placeholder for pair tests
        // For now, all tests pass vacuously
        const testResult = runPairTestsImpl(ordinal1, ordinal2);

        testState.stats.pair.examined++;

        if (testResult.status === "passed") {
          testState.stats.pair.passed++;
          if (testState.examples.pair.passing.length < 1) {
            testState.examples.pair.passing.push(
              `Test ${
                testState.stats.pair.examined
              }: (${ordinal1.toString()}, ${ordinal2.toString()})`
            );
          }
        } else if (testResult.status === "aborted") {
          testState.stats.pair.aborted++;
          if (testState.examples.pair.aborted.length < 3) {
            testState.examples.pair.aborted.push(
              `Test ${
                testState.stats.pair.examined
              }: (${ordinal1.toString()}, ${ordinal2.toString()}) - ${
                testResult.reason || "Budget exceeded"
              }`
            );
          }
        } else if (testResult.status === "failed") {
          testState.stats.pair.failed++;
          if (testState.examples.pair.failed.length < 10) {
            testState.examples.pair.failed.push(
              `Test ${
                testState.stats.pair.examined
              }: (${ordinal1.toString()}, ${ordinal2.toString()}) - ${
                testResult.reason || "Test failed"
              }`
            );
          }
        }
      }

      async function runTripleTests(
        ordinal1: OrdinalBase,
        ordinal2: OrdinalBase,
        ordinal3: OrdinalBase,
        index: number
      ): Promise<void> {
        // Placeholder for triple tests
        // For now, all tests pass vacuously
        const testResult = runTripleTestsImpl(ordinal1, ordinal2, ordinal3);

        testState.stats.triple.examined++;

        if (testResult.status === "passed") {
          testState.stats.triple.passed++;
          if (testState.examples.triple.passing.length < 1) {
            testState.examples.triple.passing.push(
              `Test ${
                testState.stats.triple.examined
              }: (${ordinal1.toString()}, ${ordinal2.toString()}, ${ordinal3.toString()})`
            );
          }
        } else if (testResult.status === "aborted") {
          testState.stats.triple.aborted++;
          if (testState.examples.triple.aborted.length < 3) {
            testState.examples.triple.aborted.push(
              `Test ${
                testState.stats.triple.examined
              }: (${ordinal1.toString()}, ${ordinal2.toString()}, ${ordinal3.toString()}) - ${
                testResult.reason || "Budget exceeded"
              }`
            );
          }
        } else if (testResult.status === "failed") {
          testState.stats.triple.failed++;
          if (testState.examples.triple.failed.length < 10) {
            testState.examples.triple.failed.push(
              `Test ${
                testState.stats.triple.examined
              }: (${ordinal1.toString()}, ${ordinal2.toString()}, ${ordinal3.toString()}) - ${
                testResult.reason || "Test failed"
              }`
            );
          }
        }
      }

      // Test implementation functions (currently vacuous)
      function runSingleOrdinalTestsImpl(ordinal: OrdinalBase): ExecutionResult {
        try {
          console.log(`[SINGLE] Testing with a=${ordinal.toString()}`);

          // Create substitution map with direct object
          const substitutions = new Map<string, OrdinalBase>([["a", ordinal]]);

          // Run single ordinal tests
          const results = runTestList(SINGLE_ORDINAL_TESTS, substitutions);

          // Check if any tests failed
          for (const result of results) {
            if (result.status === "failed") {
              return {
                status: "failed",
                reason: `${result.name}: ${result.reason}`,
              };
            } else if (result.status === "aborted") {
              return {
                status: "aborted",
                reason: `${result.name}: ${result.reason}`,
              };
            }
            // Log passed and skipped tests
            if (result.status === "passed") {
              console.log(`[SINGLE] ✓ ${result.name}`);
            } else if (result.status === "skipped") {
              console.log(`[SINGLE] ⊘ ${result.name} (${result.reason})`);
            }
          }

          return { status: "passed" };
        } catch (error: unknown) {
          return {
            status: "failed",
            reason: `Single ordinal test error: ${getErrorMessage(error)}`,
          };
        }
      }

      function runPairTestsImpl(
        ordinal1: OrdinalBase,
        ordinal2: OrdinalBase
      ): ExecutionResult {
        try {
          console.log(
            `[PAIR] Testing with a=${ordinal1.toString()}, b=${ordinal2.toString()}`
          );

          // Create substitution map with direct objects
          const substitutions = new Map<string, OrdinalBase>([
            ["a", ordinal1],
            ["b", ordinal2],
          ]);

          // Run pair ordinal tests
          const results = runTestList(PAIR_ORDINAL_TESTS, substitutions);

          // Check if any tests failed
          for (const result of results) {
            if (result.status === "failed") {
              return {
                status: "failed",
                reason: `${result.name}: ${result.reason}`,
              };
            } else if (result.status === "aborted") {
              return {
                status: "aborted",
                reason: `${result.name}: ${result.reason}`,
              };
            }
            // Log passed and skipped tests
            if (result.status === "passed") {
              console.log(`[PAIR] ✓ ${result.name}`);
            } else if (result.status === "skipped") {
              console.log(`[PAIR] ⊘ ${result.name} (${result.reason})`);
            }
          }

          return { status: "passed" };
        } catch (error: unknown) {
          return {
            status: "failed",
            reason: `Pair ordinal test error: ${getErrorMessage(error)}`,
          };
        }
      }

      // Unified test definition system
      // To add a new test, simply add an object with:
      // - name: descriptive name for the test
      // - lhs: left-hand side expression (can use variable a for single, a,b for pairs, a,b,c for triples)
      // - rhs: right-hand side expression
      // - condition: optional condition that must be true for test to run
      //
      // Examples:
      // {name: "Identity", lhs: "a+0", rhs: "a"}  // Single ordinal test
      // {name: "Commutativity", lhs: "a+b", rhs: "b+a"}  // Pair test
      // {name: "Associativity", lhs: "(a+b)+c", rhs: "a+(b+c)"}  // Triple test

      // Single ordinal tests (use variable 'a')
      const SINGLE_ORDINAL_TESTS: OrdinalTest[] = [
        {
          name: "Less than successor",
          lhs: "a < a'",
          rhs: "true",
        },
        {
          name: "Parsing Round-Trip",
          lhs: "parse[toString[a]]",
          rhs: "a",
        },
      ];

      // Pair ordinal tests (use variables 'a' and 'b')
      const PAIR_ORDINAL_TESTS: OrdinalTest[] = [
        {
          name: "Successor Monotonicity",
          lhs: "a' ? b'",
          rhs: "a ? b",
        },
        {
          name: "Successor addition",
          lhs: "a+(b')",
          rhs: "(a+b)'",
        },
        {
          name: "Successor multiplication",
          lhs: "a*(b')",
          rhs: "(a*b)+a",
        },
        {
          name: "Successor exponentiation",
          lhs: "a^(b')",
          rhs: "(a^b)*a",
        },
      ];

      // Triple ordinal tests (use variables 'a', 'b', and 'c')
      const TRIPLE_ORDINAL_TESTS: OrdinalTest[] = [
        {
          name: "Associativity of Addition",
          lhs: "(a+b)+c",
          rhs: "a+(b+c)",
        },
        {
          name: "Associativity of Multiplication",
          lhs: "(a*b)*c",
          rhs: "a*(b*c)",
        },
        {
          name: "Left Distributivity",
          lhs: "a*(b+c)",
          rhs: "a*b+a*c",
        },

        {
          name: "Addition Monotonicity",
          lhs: "a+b ? a+c",
          rhs: "b ? c",
        },
        {
          name: "Multiplication Monotonicity",
          lhs: "a*b ? a*c",
          rhs: "b ? c",
          condition: "a > 0",
        },
        {
          name: "Exponentiation Monotonicity",
          lhs: "a^b ? a^c",
          rhs: "b ? c",
          condition: "a > 1",
        },
        {
          name: "Addition Weak Monotonicity",
          lhs: "b+a <= c+a",
          rhs: "true",
          condition: "b < c",
        },
        {
          name: "Multiplication Weak Monotonicity",
          lhs: "b*a <= c*a",
          rhs: "true",
          condition: "b < c",
        },
        {
          name: "Exponentiation Weak Monotonicity",
          lhs: "b^a <= c^a",
          rhs: "true",
          condition: "b < c",
        },
        {
          name: "Exponent Addition",
          lhs: "a^(b+c)",
          rhs: "a^b*a^c",
        },
        {
          name: "Exponent Multiplication",
          lhs: "a^(b*c)",
          rhs: "(a^b)^c",
        },
      ];

      // Generic test runner for any test list and substitution map
      function runTestList(
        testList: OrdinalTest[],
        substitutions: Map<string, OrdinalBase>
      ): TestListResult[] {
        const results: TestListResult[] = [];

        for (const test of testList) {
          try {
            OperationTracer.reset(1000000);

            // Check condition if present
            if (test.condition) {
              console.log(`[DEBUG] Evaluating condition: ${test.condition}`);
              const conditionParser = new SimpleParser(test.condition);
              const conditionResult =
                conditionParser.parseWithSubstitution(substitutions);
              console.log(`[DEBUG] Condition result:`, conditionResult);
              console.log(
                `[DEBUG] Condition result type:`,
                conditionResult?.type
              );
              console.log(
                `[DEBUG] Condition result value:`,
                conditionResult?.value
              );

              // Skip test if condition is false
              if (
                !conditionResult ||
                (conditionResult.type === "boolean" && !conditionResult.value)
              ) {
                results.push({
                  name: test.name,
                  status: "skipped",
                  reason: `Condition not met: ${test.condition}`,
                });
                continue;
              }
            }

            // Parse and evaluate LHS with direct substitution
            console.log(`[DEBUG] Parsing LHS: ${test.lhs}`);
            const lhsParser = new SimpleParser(test.lhs);
            const lhsResult = lhsParser.parseWithSubstitution(substitutions);
            console.log(
              `[DEBUG] LHS result:`,
              lhsResult,
              `formatted: ${_formatTestResult(lhsResult)}`
            );

            // Parse and evaluate RHS with direct substitution
            console.log(`[DEBUG] Parsing RHS: ${test.rhs}`);
            const rhsParser = new SimpleParser(test.rhs);
            const rhsResult = rhsParser.parseWithSubstitution(substitutions);
            console.log(
              `[DEBUG] RHS result:`,
              rhsResult,
              `formatted: ${_formatTestResult(rhsResult)}`
            );

            // Check if results are still unresolved
            if (_hasUnresolvedElements(lhsResult)) {
              throw new Error(
                `LHS expression not fully resolved: ${_formatTestResult(
                  lhsResult
                )} from ${test.lhs}`
              );
            }
            if (_hasUnresolvedElements(rhsResult)) {
              throw new Error(
                `RHS expression not fully resolved: ${_formatTestResult(
                  rhsResult
                )} from ${test.rhs}`
              );
            }

            // Compare results using unified comparison function
            const comparison = _compareTestValues(lhsResult, rhsResult);

            if (comparison === 0) {
              results.push({
                name: test.name,
                status: "passed",
              });
            } else {
              // Format variable values for error message
              const varValues = Array.from(substitutions.entries())
                .map(([name, value]) => `${name}=${value.toString()}`)
                .join(", ");

              results.push({
                name: test.name,
                status: "failed",
                reason: `${test.lhs} = ${_formatTestResult(lhsResult)} ≠ ${
                  test.rhs
                } = ${_formatTestResult(rhsResult)} (with ${varValues})`,
              });
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              results.push({
                name: test.name,
                status: "aborted",
                reason: getErrorMessage(error),
              });
            } else {
              results.push({
                name: test.name,
                status: "failed",
                reason: `Error: ${getErrorMessage(error)}`,
              });
            }
          }
        }

        return results;
      }

      function _isOrdinal(value: unknown): value is OrdinalBase {
        return (
          value &&
          typeof value === "object" &&
          typeof (value as OrdinalBase).isZero === "function" &&
          typeof (value as OrdinalBase).add === "function"
        );
      }

      function _hasUnresolvedElements(value: unknown): boolean {
        return (
          value &&
          typeof value === "object" &&
          (value.type === "variable" ||
            value.type === "operation" ||
            value.type === "function" ||
            value.type === "comparison_op" ||
            value.type === "epsilon" ||
            value.type === "successor")
        );
      }

      type ParserNode =
        | { type: "string"; value: string }
        | { type: "boolean"; value: boolean }
        | { type: "comparison"; value: -1 | 0 | 1 }
        | { type: string; value?: unknown };

      function _compareTestValues(left: unknown, right: unknown): number {
        // Both are ordinals
        if (_isOrdinal(left) && _isOrdinal(right)) {
          return OPERATIONS.compare(left, right);
        }

        // Both are strings
        if (
          (left as ParserNode)?.type === "string" &&
          (right as ParserNode)?.type === "string"
        ) {
          const leftNode = left as ParserNode;
          const rightNode = right as ParserNode;
          if ((leftNode.value ?? "") < (rightNode.value ?? "")) return -1;
          if ((leftNode.value ?? "") > (rightNode.value ?? "")) return 1;
          return 0;
        }

        // Both are booleans
        if (
          (left as ParserNode)?.type === "boolean" &&
          (right as ParserNode)?.type === "boolean"
        ) {
          const leftNode = left as ParserNode;
          const rightNode = right as ParserNode;
          if (leftNode.value === rightNode.value) return 0;
          return leftNode.value ? 1 : -1;
        }

        // Both are comparison results
        if (
          (left as ParserNode)?.type === "comparison" &&
          (right as ParserNode)?.type === "comparison"
        ) {
          const leftNode = left as ParserNode;
          const rightNode = right as ParserNode;
          if ((leftNode.value ?? 0) < (rightNode.value ?? 0)) return -1;
          if ((leftNode.value ?? 0) > (rightNode.value ?? 0)) return 1;
          return 0;
        }

        // Mixed types - convert to strings for comparison
        const leftStr = _formatTestResult(left);
        const rightStr = _formatTestResult(right);
        if (leftStr < rightStr) return -1;
        if (leftStr > rightStr) return 1;
        return 0;
      }

      function _formatTestResult(result: unknown): string {
        if (
          result &&
          typeof result.toString === "function" &&
          typeof result.isZero === "function"
        ) {
          return result.toString();
        } else if (result && result.type === "boolean") {
          return result.value.toString();
        } else if (result && result.type === "comparison") {
          switch (result.value) {
            case -1:
              return "<";
            case 0:
              return "=";
            case 1:
              return ">";
            default:
              return result.value.toString();
          }
        } else {
          return String(result);
        }
      }

      function runTripleTestsImpl(
        a: OrdinalBase,
        b: OrdinalBase,
        c: OrdinalBase
      ): ExecutionResult {
        try {
          console.log(
            `[TRIPLE] Testing with a=${a.toString()}, b=${b.toString()}, c=${c.toString()}`
          );

          // Create substitution map with direct objects
          const substitutions = new Map<string, OrdinalBase>([
            ["a", a],
            ["b", b],
            ["c", c],
          ]);

          // Run triple ordinal tests
          const results = runTestList(TRIPLE_ORDINAL_TESTS, substitutions);

          // Check if any tests failed
          for (const result of results) {
            if (result.status === "failed") {
              return {
                status: "failed",
                reason: `${result.name}: ${result.reason}`,
              };
            } else if (result.status === "aborted") {
              return {
                status: "aborted",
                reason: `${result.name}: ${result.reason}`,
              };
            }
            // Log passed and skipped tests
            if (result.status === "passed") {
              console.log(`[TRIPLE] ✓ ${result.name}`);
            } else if (result.status === "skipped") {
              console.log(`[TRIPLE] ⊘ ${result.name} (${result.reason})`);
            }
          }

          // All unified tests passed, now run legacy tests for comparison
          OperationTracer.setGlobalTracer(1000000);

          // Test 1: Associativity of addition: (a+b)+c = a+(b+c) [LEGACY]
          try {
            // Add debugging info about the ordinals
            console.log(
              `[DEBUG] Testing associativity with a=${a.toString()}, b=${b.toString()}, c=${c.toString()}`
            );
            console.log(
              `[DEBUG] a type: ${a.constructor.name}, b type: ${b.constructor.name}, c type: ${c.constructor.name}`
            );

            const ab = OPERATIONS.add(a, b);
            console.log(
              `[DEBUG] a+b = ${ab.toString()} (${ab.constructor.name})`
            );

            const bc = OPERATIONS.add(b, c);
            console.log(
              `[DEBUG] b+c = ${bc.toString()} (${bc.constructor.name})`
            );

            const lhs1 = OPERATIONS.add(ab, c);
            console.log(
              `[DEBUG] (a+b)+c = ${lhs1.toString()} (${lhs1.constructor.name})`
            );

            const rhs1 = OPERATIONS.add(a, bc);
            console.log(
              `[DEBUG] a+(b+c) = ${rhs1.toString()} (${rhs1.constructor.name})`
            );

            const cmp1 = OPERATIONS.compare(lhs1, rhs1);
            console.log(`[DEBUG] Comparison result: ${cmp1}`);

            if (cmp1 !== 0) {
              return {
                status: "failed",
                reason: `Addition associativity failed: (${a}+${b})+${c} = ${lhs1} ≠ ${a}+(${b}+${c}) = ${rhs1}`,
              };
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason: "Addition associativity: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason:
                "Addition associativity error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);

          // Test 2: Associativity of multiplication: (a*b)*c = a*(b*c)
          try {
            const lhs2 = OPERATIONS.multiply(OPERATIONS.multiply(a, b), c);
            const rhs2 = OPERATIONS.multiply(a, OPERATIONS.multiply(b, c));
            const cmp2 = OPERATIONS.compare(lhs2, rhs2);
            if (cmp2 !== 0) {
              return {
                status: "failed",
                reason: `Multiplication associativity failed: (${a}*${b})*${c} = ${lhs2} ≠ ${a}*(${b}*${c}) = ${rhs2}`,
              };
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason:
                  "Multiplication associativity: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason:
                "Multiplication associativity error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);

          // Test 3: Left distributivity: a*(b+c) = a*b+a*c
          try {
            const lhs3 = OPERATIONS.multiply(a, OPERATIONS.add(b, c));
            const rhs3 = OPERATIONS.add(
              OPERATIONS.multiply(a, b),
              OPERATIONS.multiply(a, c)
            );
            const cmp3 = OPERATIONS.compare(lhs3, rhs3);
            if (cmp3 !== 0) {
              return {
                status: "failed",
                reason: `Left distributivity failed: ${a}*(${b}+${c}) = ${lhs3} ≠ ${a}*${b}+${a}*${c} = ${rhs3}`,
              };
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason: "Left distributivity: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason: "Left distributivity error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);

          // Test 4: Exponent addition: a^(b+c) = a^b*a^c
          try {
            const lhs4 = OPERATIONS.power(a, OPERATIONS.add(b, c));
            const rhs4 = OPERATIONS.multiply(
              OPERATIONS.power(a, b),
              OPERATIONS.power(a, c)
            );
            const cmp4 = OPERATIONS.compare(lhs4, rhs4);
            if (cmp4 !== 0) {
              return {
                status: "failed",
                reason: `Exponent addition failed: ${a}^(${b}+${c}) = ${lhs4} ≠ ${a}^${b}*${a}^${c} = ${rhs4}`,
              };
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason: "Exponent addition: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason: "Exponent addition error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);

          // Test 5: Exponent multiplication: a^(b*c) = (a^b)^c
          try {
            const lhs5 = OPERATIONS.power(a, OPERATIONS.multiply(b, c));
            const rhs5 = OPERATIONS.power(OPERATIONS.power(a, b), c);
            const cmp5 = OPERATIONS.compare(lhs5, rhs5);
            if (cmp5 !== 0) {
              return {
                status: "failed",
                reason: `Exponent multiplication failed: ${a}^(${b}*${c}) = ${lhs5} ≠ (${a}^${b})^${c} = ${rhs5}`,
              };
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason: "Exponent multiplication: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason:
                "Exponent multiplication error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);
          // Test 6: Addition monotonicity: a+b ? a+c = b ? c
          try {
            const sum_ab = OPERATIONS.add(a, b);
            const sum_ac = OPERATIONS.add(a, c);
            const cmp_sums = OPERATIONS.compare(sum_ab, sum_ac);
            const cmp_bc = OPERATIONS.compare(b, c);
            if (cmp_sums !== cmp_bc) {
              const sumRelation = cmp_sums > 0 ? ">" : cmp_sums < 0 ? "<" : "=";
              const bcRelation = cmp_bc > 0 ? ">" : cmp_bc < 0 ? "<" : "=";
              return {
                status: "failed",
                reason: `Addition monotonicity failed: ${a}+${b} ${sumRelation} ${a}+${c} but ${b} ${bcRelation} ${c}`,
              };
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason: "Addition monotonicity: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason:
                "Addition monotonicity error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);
          // Test 7: Multiplication monotonicity: a*b ? a*c = b ? c (if a > 0)
          try {
            const zero = ZeroOrdinal.instance();
            if (OPERATIONS.compare(a, zero) > 0) {
              const prod_ab = OPERATIONS.multiply(a, b);
              const prod_ac = OPERATIONS.multiply(a, c);
              const cmp_prods = OPERATIONS.compare(prod_ab, prod_ac);
              const cmp_bc = OPERATIONS.compare(b, c);
              if (cmp_prods !== cmp_bc) {
                const prodRelation =
                  cmp_prods > 0 ? ">" : cmp_prods < 0 ? "<" : "=";
                const bcRelation = cmp_bc > 0 ? ">" : cmp_bc < 0 ? "<" : "=";
                return {
                  status: "failed",
                  reason: `Multiplication monotonicity failed: ${a}*${b} ${prodRelation} ${a}*${c} but ${b} ${bcRelation} ${c} (with ${a} > 0)`,
                };
              }
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason:
                  "Multiplication monotonicity: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason:
                "Multiplication monotonicity error: " + getErrorMessage(error),
            };
          }

          OperationTracer.reset(1000000);
          // Test 8: Exponentiation monotonicity: a^b ? a^c = b ? c (if a > 1)
          try {
            const one = OneOrdinal.instance();
            if (OPERATIONS.compare(a, one) > 0) {
              const pow_ab = OPERATIONS.power(a, b);
              const pow_ac = OPERATIONS.power(a, c);
              const cmp_pows = OPERATIONS.compare(pow_ab, pow_ac);
              const cmp_bc = OPERATIONS.compare(b, c);
              if (cmp_pows !== cmp_bc) {
                const powRelation =
                  cmp_pows > 0 ? ">" : cmp_pows < 0 ? "<" : "=";
                const bcRelation = cmp_bc > 0 ? ">" : cmp_bc < 0 ? "<" : "=";
                return {
                  status: "failed",
                  reason: `Exponentiation monotonicity failed: ${a}^${b} ${powRelation} ${a}^${c} but ${b} ${bcRelation} ${c} (with ${a} > 1)`,
                };
              }
            }
          } catch (error: unknown) {
            if (isBudgetOrRecursionError(error)) {
              return {
                status: "aborted",
                reason:
                  "Exponentiation monotonicity: " + getErrorMessage(error),
              };
            }
            return {
              status: "failed",
              reason:
                "Exponentiation monotonicity error: " + getErrorMessage(error),
            };
          }

          // All tests passed
          return { status: "passed" };
        } catch (error: unknown) {
          if (isBudgetOrRecursionError(error)) {
            return {
              status: "aborted",
              reason: "Overall budget exceeded: " + getErrorMessage(error),
            };
          }
          return {
            status: "failed",
            reason: "Unexpected error: " + getErrorMessage(error),
          };
        }
      }

      // Display test lists in the UI
      function displayTestLists(): void {
        displayTestList("singleTestsList", SINGLE_ORDINAL_TESTS);
        displayTestList("pairTestsList", PAIR_ORDINAL_TESTS);
        displayTestList("tripleTestsList", TRIPLE_ORDINAL_TESTS);
      }

      type OrdinalTest = {
        name: string;
        lhs: string;
        rhs: string;
        condition?: string;
      };

      function displayTestList(
        elementId: string,
        testList: OrdinalTest[]
      ): void {
        const container = requireElementById<HTMLDivElement>(elementId);

        container.innerHTML = "";

        testList.forEach((test) => {
          const testItem = document.createElement("div");
          testItem.className = "test-item";

          const testName = document.createElement("div");
          testName.className = "test-name";
          testName.textContent = test.name;

          const testExpressions = document.createElement("div");
          testExpressions.className = "test-expressions";
          testExpressions.textContent = `${test.lhs} = ${test.rhs}`;

          testItem.appendChild(testName);
          testItem.appendChild(testExpressions);

          if (test.condition) {
            const testCondition = document.createElement("div");
            testCondition.className = "test-condition";
            testCondition.textContent = `Condition: ${test.condition}`;
            testItem.appendChild(testCondition);
          }

          container.appendChild(testItem);
        });
      }

      // Initialize test lists display when page loads
      document.addEventListener("DOMContentLoaded", function () {
        displayTestLists();
      });
