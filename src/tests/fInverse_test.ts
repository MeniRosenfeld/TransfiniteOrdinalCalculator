// Extracted from fInverse_test.html

// Original <scripttype="module">

      import { fTyped } from "../ordinal_mapping/OrdinalMapping.js";
      import {
        fInverseTyped,
        fInverseWrapper,
      } from "../ordinal_mapping/OrdinalMappingInverse.js";
      import { FParams } from "../ordinal_mapping/FParams.js";
      import {
        DoubleContext,
        RationalContext,
      } from "../ordinal_mapping/Contexts.js";
      import { Interval } from "../ordinal_mapping/Interval.js";
      import { requireElementById } from "./testUtils.js";

      type PowRepresentation = { type: "pow"; k: OrdinalRepresentation };
      type SumRepresentation = { type: "sum"; beta: OrdinalRepresentation; c: bigint; delta: OrdinalRepresentation };
      type TowerRepresentation = { type: "w_tower"; height: bigint };
      type EpsilonRepresentation = { type: "epsilon"; index: OrdinalRepresentation };
type OrdinalRepresentation = bigint | PowRepresentation | SumRepresentation | TowerRepresentation | EpsilonRepresentation;
type FInverseResult = OrdinalRepresentation;

const isPowRepresentation = (value: FInverseResult): value is PowRepresentation => {
      return typeof value === "object" && value !== null && "type" in value && value.type === "pow";
};
const isSumRepresentation = (value: FInverseResult): value is SumRepresentation => {
      return typeof value === "object" && value !== null && "type" in value && value.type === "sum";
};
const isEpsilonRepresentation = (value: FInverseResult): value is EpsilonRepresentation => {
      return typeof value === "object" && value !== null && "type" in value && value.type === "epsilon";
};

      const resultsDiv = requireElementById<HTMLDivElement>("results");
      let passCount = 0;
      let failCount = 0;
      let skipCount = 0;

      function addResult(testName: string, passed: boolean, details = "", skipped = false): void {
        const div = document.createElement("div");
        div.className = `test-result ${
          skipped ? "skip" : passed ? "pass" : "fail"
        }`;

        const status = skipped ? "⊘ SKIP" : passed ? "✓ PASS" : "✗ FAIL";
        div.innerHTML = `<strong>${status}:</strong> ${testName}`;

        if (details) {
          const detailsDiv = document.createElement("div");
          detailsDiv.className = passed ? "" : "error-details";
          detailsDiv.innerHTML = details;
          div.appendChild(detailsDiv);
        }

        resultsDiv.appendChild(div);

        if (skipped) skipCount++;
        else if (passed) passCount++;
        else failCount++;
      }

      function addSection(title: string): HTMLDivElement {
        const section = document.createElement("div");
        section.className = "test-section";
        section.innerHTML = `<h2>${title}</h2>`;
        resultsDiv.appendChild(section);
        return section;
      }

      function formatOrdinal(ord: OrdinalRepresentation | number): string {
        if (typeof ord === "bigint") return ord.toString();
        if (typeof ord === "number") return ord.toString();
        if (typeof ord === "object" && ord !== null && "type" in ord) {
          const typed = ord as Exclude<OrdinalRepresentation, bigint>;
          if (typed.type === "pow") {
            return `ω^${formatOrdinal(typed.k)}`;
          } else if (typed.type === "sum") {
            return `ω^${formatOrdinal(typed.beta)} * ${typed.c} + ${formatOrdinal(
              typed.delta
            )}`;
          } else if (typed.type === "w_tower") {
            return `ω↑↑${typed.height}`;
          } else if (typed.type === "epsilon") {
            return `ε_${typed.index}`;
          }
        }
        return String(ord);
      }

      async function runTests(): Promise<void> {
        console.log("Starting fInverse tests...");

        // Create context and parameters
        const ctx = new DoubleContext();
        const params = FParams.default(ctx); // Use default factory method

        // Section 1: Basic finite ordinals
        addSection("Section 1: Finite Ordinals (n < ω)");

        try {
          // Test f(0) = 0
          const x0 = ctx.ZERO;
          const result0 = fInverseWrapper(x0.toNumber(), params);
          const expected0 = 0n;
          const match0 = result0 === expected0;
          addResult(
            `fInverse(0) should return 0`,
            match0,
            `Expected: ${expected0}, Got: ${formatOrdinal(result0)}`
          );
        } catch (e) {
          addResult("fInverse(0) test", false, `Error: ${e.message}`);
        }

        try {
          // Test small finite ordinals
          for (let n = 1n; n <= 5n; n++) {
            const fn = fTyped(n, params);
            const resultN = fInverseWrapper(fn.toNumber(), params);
            const match = resultN === n;
            addResult(
              `fInverse(f(${n})) should return ${n}`,
              match,
              `f(${n}) = ${fn
                .toNumber()
                .toFixed(6)}, fInverse → ${formatOrdinal(resultN)}`
            );
          }
        } catch (e) {
          addResult(
            "Finite ordinal round-trip test",
            false,
            `Error: ${e.message}`
          );
        }

        // Section 2: Power ordinals (ω^k)
        addSection("Section 2: Power Ordinals (ω^k)");

        try {
          // Test f(ω) = 1
          const x1 = ctx.ONE;
          const resultOmega = fInverseWrapper(x1.toNumber(), params);
          const expectedOmega = { type: "pow", k: 1n };
          const matchOmega = isPowRepresentation(resultOmega) && resultOmega.k === 1n;
          addResult(
            `fInverse(1) should return ω`,
            matchOmega,
            `Expected: ω, Got: ${formatOrdinal(resultOmega)}`
          );
        } catch (e) {
          addResult("fInverse(1) → ω test", false, `Error: ${e.message}`);
        }

        try {
          // Test f(ω^2)
          const omegaSquared = { type: "pow", k: 2n };
          const fOmegaSquared = fTyped(omegaSquared, params);
          const resultOmega2 = fInverseWrapper(
            fOmegaSquared.toNumber(),
            params
          );
          const matchOmega2 =
            isPowRepresentation(resultOmega2) && resultOmega2.k === 2n;
          addResult(
            `fInverse(f(ω^2)) should return ω^2`,
            matchOmega2,
            `f(ω^2) = ${fOmegaSquared
              .toNumber()
              .toFixed(6)}, fInverse → ${formatOrdinal(resultOmega2)}`
          );
        } catch (e) {
          addResult("ω^2 round-trip test", false, `Error: ${e.message}`);
        }

        try {
          // Test f(ω^ω) = 3 (using params.precomputed[3])
          const x3 = params.precomputed[3];
          const resultOmegaOmega = fInverseWrapper(x3.toNumber(), params);
          const expectedOmegaOmega = { type: "pow", k: { type: "pow", k: 1n } };
          const matchOmegaOmega =
            isPowRepresentation(resultOmegaOmega) &&
            isPowRepresentation(resultOmegaOmega.k) &&
            resultOmegaOmega.k.k === 1n;
          addResult(
            `fInverse(f(ω^ω)) should return ω^ω`,
            matchOmegaOmega,
            `f(ω^ω) = ${x3.toNumber().toFixed(6)}, fInverse → ${formatOrdinal(
              resultOmegaOmega
            )}`
          );
        } catch (e) {
          addResult("fInverse(3) → ω^ω test", false, `Error: ${e.message}`);
        }

        // Section 3: Interval preference tests
        addSection(
          "Section 3: Interval Preference (simpler ordinals preferred)"
        );

        try {
          // Wide interval containing 0 should return 0
          const interval0 = new Interval(
            ctx.fromNumber(-0.1),
            ctx.fromNumber(0.5)
          );
          const result0Int = fInverseTyped(interval0, params);
          const match0Int = result0Int === 0n;
          addResult(
            `fInverse([-0.1, 0.5]) should prefer 0`,
            match0Int,
            `Interval contains f(0)=0, should return: 0, Got: ${formatOrdinal(
              result0Int
            )}`
          );
        } catch (e) {
          addResult("Interval preference for 0", false, `Error: ${e.message}`);
        }

        try {
          // Wide interval containing 1 should return ω
          const interval1 = new Interval(
            ctx.fromNumber(0.9),
            ctx.fromNumber(1.5)
          );
          const result1Int = fInverseTyped(interval1, params);
          const match1Int = isPowRepresentation(result1Int) && result1Int.k === 1n;
          addResult(
            `fInverse([0.9, 1.5]) should prefer ω`,
            match1Int,
            `Interval contains f(ω)=1, should return: ω, Got: ${formatOrdinal(
              result1Int
            )}`
          );
        } catch (e) {
          addResult("Interval preference for ω", false, `Error: ${e.message}`);
        }

        try {
          // Wide interval containing f(ω^ω) should return ω^ω
          const fOmegaOmega = params.precomputed[3].toNumber();
          const interval3 = new Interval(
            ctx.fromNumber(fOmegaOmega - 0.3),
            ctx.fromNumber(fOmegaOmega + 0.5)
          );
          const result3Int = fInverseTyped(interval3, params);
          const match3Int = isPowRepresentation(result3Int) &&
            isPowRepresentation(result3Int.k) &&
            result3Int.k.k === 1n;
          addResult(
            `fInverse([${(fOmegaOmega - 0.3).toFixed(1)}, ${(
              fOmegaOmega + 0.5
            ).toFixed(1)}]) should prefer ω^ω`,
            match3Int,
            `Interval contains f(ω^ω)=${fOmegaOmega.toFixed(
              1
            )}, should return: ω^ω, Got: ${formatOrdinal(result3Int)}`
          );
        } catch (e) {
          addResult(
            "Interval preference for ω^ω",
            false,
            `Error: ${e.message}`
          );
        }

        // Section 4: Sum ordinals
        addSection("Section 4: Sum Ordinals (ω^β * c + δ)");

        try {
          // Test ω + 1
          const omegaPlus1 = { type: "sum", beta: 1n, c: 1n, delta: 1n };
          const fOmegaPlus1 = fTyped(omegaPlus1, params);
          const resultOmegaPlus1 = fInverseWrapper(
            fOmegaPlus1.toNumber(),
            params
          );

          // Check if result is equivalent to ω + 1
          const isCorrect =
            isSumRepresentation(resultOmegaPlus1) &&
            resultOmegaPlus1.beta === 1n &&
            resultOmegaPlus1.c === 1n &&
            resultOmegaPlus1.delta === 1n;

          addResult(
            `fInverse(f(ω + 1)) should return ω + 1`,
            isCorrect,
            `f(ω + 1) = ${fOmegaPlus1
              .toNumber()
              .toFixed(6)}, fInverse → ${formatOrdinal(resultOmegaPlus1)}`
          );
        } catch (e) {
          addResult("ω + 1 round-trip test", false, `Error: ${e.message}`);
        }

        // Section 5: Epsilon-zero
        addSection("Section 5: Epsilon-Zero (ε₀)");

        try {
          // Test f(ε₀) ≈ 5
          const x5 = params.precomputed[5];
          const resultEpsilon = fInverseWrapper(x5.toNumber(), params);
          const matchEpsilon =
            isEpsilonRepresentation(resultEpsilon) && resultEpsilon.index === 0n;
          addResult(
            `fInverse(${x5.toNumber().toFixed(6)}) should return ε₀`,
            matchEpsilon,
            `Expected: ε₀, Got: ${formatOrdinal(resultEpsilon)}`
          );
        } catch (e) {
          addResult("fInverse → ε₀ test", false, `Error: ${e.message}`);
        }

        // Section 6: Out-of-bounds tests
        addSection("Section 6: Out-of-Bounds Handling");

        try {
          // Test input touching below
          const intervalBelow = new Interval(
            ctx.fromNumber(-1),
            ctx.fromNumber(0)
          );
          fInverseTyped(intervalBelow, params);
          addResult("fInverse([-1, 0]) should not throw", true);
        } catch (e) {
          addResult("fInverse([-1, 0]) should not throw", false);
        }

        try {
          // Test input below valid range
          const intervalBelow = new Interval(
            ctx.fromNumber(-2),
            ctx.fromNumber(-1)
          );
          fInverseTyped(intervalBelow, params);
          addResult("fInverse([-2, -1]) should throw", false);
        } catch (e) {
          addResult("fInverse([-2, -1]) should throw", true);
        }

        try {
          // Test input above valid range
          const intervalAbove = new Interval(
            ctx.fromNumber(49),
            ctx.fromNumber(60)
          );
          fInverseTyped(intervalAbove, params);
          addResult("fInverse([49, 60]) should not throw", true);
        } catch (e) {
          addResult("fInverse([49, 60]) should not throw", false);
        }

        try {
          // Test input above valid range
          const intervalAbove = new Interval(
            ctx.fromNumber(50),
            ctx.fromNumber(60)
          );
          fInverseTyped(intervalAbove, params);
          addResult("fInverse([50, 60]) should throw", false);
        } catch (e) {
          addResult("fInverse([50, 60]) should throw", true);
        }

        // Section 7: BigInt Handling with Rational Context
        addSection("Section 7: BigInt Handling with Rational Context");

        try {
          // Create rational context and params
          const rationalCtx = new RationalContext();
          const rationalParams = FParams.default(rationalCtx);

          // Test with narrow rational interval
          // The interval [0.9999999999999996, 0.9999999999999998] maps to ordinals
          // in range [7499999999999998, 14999999999999997] with scale=3.
          // The implementation returns the first ordinal in this range.
          const expectedN = 7499999999999998n;

          // Create interval [9999999999999996/10000000000000000, 9999999999999998/10000000000000000]
          const lowerBound = rationalCtx.fromBigInts(
            9999999999999996n,
            10000000000000000n
          );
          const upperBound = rationalCtx.fromBigInts(
            9999999999999998n,
            10000000000000000n
          );
          const interval = new Interval(lowerBound, upperBound);

          // Find ordinal in this interval
          const resultN = fInverseTyped(interval, rationalParams);

          // Check if result matches expected
          const match = resultN === expectedN;
          addResult(
            `fInverse([9999999999999996/10^16, 9999999999999998/10^16]) should return ${expectedN}`,
            match,
            `Interval: [${lowerBound.toString()}, ${upperBound.toString()}], fInverse → ${formatOrdinal(
              resultN
            )}`
          );
        } catch (e) {
          addResult("Rational BigInt test", false, `Error: ${e.message}`);
        }

        // Summary
        const summary = document.createElement("div");
        const totalTests = passCount + failCount + skipCount;
        const allPassed = failCount === 0 && skipCount === 0;
        summary.className = `summary ${allPassed ? "pass" : "fail"}`;
        summary.innerHTML = `
                <strong>Test Summary:</strong><br>
                Total: ${totalTests} tests<br>
                ✓ Passed: ${passCount}<br>
                ✗ Failed: ${failCount}<br>
                ⊘ Skipped: ${skipCount}
            `;
        resultsDiv.insertBefore(summary, resultsDiv.firstChild);

        console.log(
          `Tests complete: ${passCount} passed, ${failCount} failed, ${skipCount} skipped`
        );
      }

      // Run tests when page loads
      runTests().catch((e) => {
        console.error("Test suite error:", e);
        addResult("Test Suite Execution", false, `Fatal error: ${e.message}`);
      });
