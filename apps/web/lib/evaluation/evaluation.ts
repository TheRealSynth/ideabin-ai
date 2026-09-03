import {
  opportunityScore,
  recommendationFor,
  type Recommendation,
  type RecommendationContext,
  type ScoreInputs,
} from "../../../../packages/core/src/scoring";

export const SCORING_MODEL_VERSION = "opportunity-v1";

export const DIMENSION_KEYS = [
  "revenuePotential",
  "speedToValidation",
  "capitalEfficiency",
  "executionFeasibility",
  "existingAssetLeverage",
  "distributionAdvantage",
  "marketTiming",
  "strategicReuse",
] as const satisfies readonly (keyof ScoreInputs)[];

export type EvaluationDimensionKey = (typeof DIMENSION_KEYS)[number];

export type EvaluationDimensionInput = {
  value: number;
  source: "user_confirmed";
};

export type PersistedEvaluationDimensions = {
  version: 1;
  inputs: Record<EvaluationDimensionKey, EvaluationDimensionInput>;
  recommendationContext: {
    hasCheapValidationTest: boolean;
    informationGapPrimaryBlocker: boolean;
    timingOrDependencyBlocked: boolean;
    structurallyWeakOrDominated: boolean;
  };
};

export type EvaluationInput = {
  dimensions: Partial<Record<EvaluationDimensionKey, unknown>>;
  confidence: unknown;
  rationale?: unknown;
  assumptions?: unknown;
  context?: Partial<Record<keyof PersistedEvaluationDimensions["recommendationContext"], unknown>>;
};

export type PreparedEvaluation = {
  scoringModelVersion: typeof SCORING_MODEL_VERSION;
  dimensions: PersistedEvaluationDimensions;
  opportunityScore: number;
  confidence: number;
  rationale: string | null;
  assumptions: string[];
  recommendation: Recommendation;
  recommendationRationale: string;
};

export type EvaluationValidationFailure = {
  ok: false;
  message: string;
  fieldErrors: Record<string, string>;
};

export type EvaluationValidationSuccess = {
  ok: true;
  prepared: PreparedEvaluation;
};

export type EvaluationValidationResult = EvaluationValidationFailure | EvaluationValidationSuccess;

function finiteScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    return null;
  }
  return value;
}

function bool(value: unknown): boolean {
  return value === true;
}

function normalizeAssumptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export function prepareEvaluation(input: EvaluationInput): EvaluationValidationResult {
  const fieldErrors: Record<string, string> = {};
  const scoreInputs = {} as ScoreInputs;
  const persistedInputs = {} as PersistedEvaluationDimensions["inputs"];

  for (const key of DIMENSION_KEYS) {
    const value = finiteScore(input.dimensions[key]);
    if (value === null) {
      fieldErrors[key] = "Enter a finite value from 0 to 100.";
      continue;
    }
    scoreInputs[key] = value;
    persistedInputs[key] = { value, source: "user_confirmed" };
  }

  const confidence = finiteScore(input.confidence);
  if (confidence === null) {
    fieldErrors.confidence = "Enter confidence from 0 to 100.";
  }

  if (Object.keys(fieldErrors).length > 0 || confidence === null) {
    return {
      ok: false,
      message: "Complete all eight scoring dimensions and confidence before evaluating.",
      fieldErrors,
    };
  }

  const recommendationContext = {
    hasCheapValidationTest: bool(input.context?.hasCheapValidationTest),
    informationGapPrimaryBlocker: bool(input.context?.informationGapPrimaryBlocker),
    timingOrDependencyBlocked: bool(input.context?.timingOrDependencyBlocked),
    structurallyWeakOrDominated: bool(input.context?.structurallyWeakOrDominated),
  };

  // Canonical scoring is called once for this immutable input snapshot.
  const score = opportunityScore(scoreInputs);
  const context: RecommendationContext = {
    opportunityScore: score,
    confidence,
    ...recommendationContext,
  };
  const recommendation = recommendationFor(context);
  const rationale = typeof input.rationale === "string" ? input.rationale.trim().slice(0, 4000) : "";

  return {
    ok: true,
    prepared: {
      scoringModelVersion: SCORING_MODEL_VERSION,
      dimensions: {
        version: 1,
        inputs: persistedInputs,
        recommendationContext,
      },
      opportunityScore: score,
      confidence,
      rationale: rationale || null,
      assumptions: normalizeAssumptions(input.assumptions),
      recommendation,
      recommendationRationale:
        rationale ||
        `Deterministic ${recommendation} recommendation from opportunity score ${score.toFixed(1)}, confidence ${confidence.toFixed(1)}, and the confirmed context flags.`,
    },
  };
}

export function scoreInputsFromPersistedDimensions(dimensions: PersistedEvaluationDimensions): ScoreInputs {
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, dimensions.inputs[key].value]),
  ) as ScoreInputs;
}

export function reproduceStoredScore(dimensions: PersistedEvaluationDimensions): number {
  return opportunityScore(scoreInputsFromPersistedDimensions(dimensions));
}
