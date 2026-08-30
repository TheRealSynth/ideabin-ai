export type ScoreInputs = {
  revenuePotential: number;
  speedToValidation: number;
  capitalEfficiency: number;
  executionFeasibility: number;
  existingAssetLeverage: number;
  distributionAdvantage: number;
  marketTiming: number;
  strategicReuse: number;
};

export type Recommendation =
  | "BUILD"
  | "VALIDATE"
  | "RESEARCH"
  | "INCUBATE"
  | "ARCHIVE"
  | "KILL";

export type RecommendationContext = {
  opportunityScore: number;
  confidence: number;
  hasCheapValidationTest?: boolean;
  informationGapPrimaryBlocker?: boolean;
  timingOrDependencyBlocked?: boolean;
  structurallyWeakOrDominated?: boolean;
};

export const SCORE_WEIGHTS = Object.freeze({
  revenuePotential: 0.15,
  speedToValidation: 0.15,
  capitalEfficiency: 0.1,
  executionFeasibility: 0.1,
  existingAssetLeverage: 0.15,
  distributionAdvantage: 0.15,
  marketTiming: 0.1,
  strategicReuse: 0.1,
});

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function opportunityScore(input: ScoreInputs): number {
  const score =
    clampScore(input.revenuePotential) * SCORE_WEIGHTS.revenuePotential +
    clampScore(input.speedToValidation) * SCORE_WEIGHTS.speedToValidation +
    clampScore(input.capitalEfficiency) * SCORE_WEIGHTS.capitalEfficiency +
    clampScore(input.executionFeasibility) * SCORE_WEIGHTS.executionFeasibility +
    clampScore(input.existingAssetLeverage) * SCORE_WEIGHTS.existingAssetLeverage +
    clampScore(input.distributionAdvantage) * SCORE_WEIGHTS.distributionAdvantage +
    clampScore(input.marketTiming) * SCORE_WEIGHTS.marketTiming +
    clampScore(input.strategicReuse) * SCORE_WEIGHTS.strategicReuse;

  return Math.round(score * 10) / 10;
}

export function recommendationFor(context: RecommendationContext): Recommendation {
  const score = clampScore(context.opportunityScore);
  const confidence = clampScore(context.confidence);

  if (context.structurallyWeakOrDominated) return "KILL";
  if (context.informationGapPrimaryBlocker) return "RESEARCH";
  if (context.timingOrDependencyBlocked && score >= 65) return "INCUBATE";
  if (score >= 80 && confidence >= 65) return "BUILD";
  if (score >= 65 || (confidence < 65 && context.hasCheapValidationTest)) return "VALIDATE";
  return "ARCHIVE";
}
