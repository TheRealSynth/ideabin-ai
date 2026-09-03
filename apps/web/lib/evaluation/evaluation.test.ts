import { describe, expect, it } from "vitest";
import {
  DIMENSION_KEYS,
  prepareEvaluation,
  reproduceStoredScore,
  type EvaluationInput,
} from "./evaluation";

function validInput(overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return {
    dimensions: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 90])),
    confidence: 75,
    rationale: "User-confirmed evaluation.",
    assumptions: ["Demand exists"],
    context: {
      hasCheapValidationTest: false,
      informationGapPrimaryBlocker: false,
      timingOrDependencyBlocked: false,
      structurallyWeakOrDominated: false,
    },
    ...overrides,
  };
}

describe("prepareEvaluation", () => {
  it("requires all eight dimensions", () => {
    const dimensions = Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 80]));
    delete dimensions.revenuePotential;

    const result = prepareEvaluation(validInput({ dimensions }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.revenuePotential).toBeDefined();
    }
  });

  it("rejects NaN and out-of-range values instead of relying on scorer clamping", () => {
    const result = prepareEvaluation(
      validInput({
        dimensions: {
          ...validInput().dimensions,
          marketTiming: Number.NaN,
          strategicReuse: 101,
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.marketTiming).toBeDefined();
      expect(result.fieldErrors.strategicReuse).toBeDefined();
    }
  });

  it("stores explicit user-confirmed provenance and keeps confidence separate", () => {
    const result = prepareEvaluation(validInput({ confidence: 67 }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prepared.opportunityScore).toBe(90);
      expect(result.prepared.confidence).toBe(67);
      for (const key of DIMENSION_KEYS) {
        expect(result.prepared.dimensions.inputs[key].source).toBe("user_confirmed");
      }
    }
  });

  it("reproduces the stored score from the immutable dimension snapshot", () => {
    const result = prepareEvaluation(
      validInput({
        dimensions: {
          revenuePotential: 90,
          speedToValidation: 80,
          capitalEfficiency: 70,
          executionFeasibility: 60,
          existingAssetLeverage: 50,
          distributionAdvantage: 40,
          marketTiming: 30,
          strategicReuse: 20,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prepared.opportunityScore).toBe(57);
      expect(reproduceStoredScore(result.prepared.dimensions)).toBe(result.prepared.opportunityScore);
    }
  });

  it("keeps recommendation logic separate and honors blocker precedence", () => {
    const result = prepareEvaluation(
      validInput({
        context: {
          hasCheapValidationTest: true,
          informationGapPrimaryBlocker: true,
          timingOrDependencyBlocked: true,
          structurallyWeakOrDominated: true,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prepared.recommendation).toBe("KILL");
    }
  });

  it("creates independent prepared snapshots for re-evaluation", () => {
    const first = prepareEvaluation(validInput());
    const second = prepareEvaluation(
      validInput({ dimensions: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 60])) }),
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.prepared.opportunityScore).toBe(90);
      expect(second.prepared.opportunityScore).toBe(60);
      expect(first.prepared.dimensions.inputs.revenuePotential.value).toBe(90);
    }
  });
});
