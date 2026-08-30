import assert from "node:assert/strict";
import test from "node:test";
import { clampScore, opportunityScore, recommendationFor } from "./scoring";

const all = (value: number) => ({
  revenuePotential: value,
  speedToValidation: value,
  capitalEfficiency: value,
  executionFeasibility: value,
  existingAssetLeverage: value,
  distributionAdvantage: value,
  marketTiming: value,
  strategicReuse: value,
});

test("perfect inputs score 100", () => {
  assert.equal(opportunityScore(all(100)), 100);
});

test("zero inputs score 0", () => {
  assert.equal(opportunityScore(all(0)), 0);
});

test("dimensions clamp to 0-100", () => {
  assert.equal(clampScore(-1), 0);
  assert.equal(clampScore(101), 100);
  assert.equal(clampScore(Number.NaN), 0);
});

test("all documented weights are honored exactly", () => {
  const expectedWeights = {
    revenuePotential: 15,
    speedToValidation: 15,
    capitalEfficiency: 10,
    executionFeasibility: 10,
    existingAssetLeverage: 15,
    distributionAdvantage: 15,
    marketTiming: 10,
    strategicReuse: 10,
  } as const;

  for (const [dimension, expected] of Object.entries(expectedWeights)) {
    const input = all(0);
    input[dimension as keyof typeof input] = 100;
    assert.equal(opportunityScore(input), expected, `${dimension} weight drifted`);
  }
});

test("BUILD requires score >=80 and confidence >=65", () => {
  assert.equal(recommendationFor({ opportunityScore: 80, confidence: 65 }), "BUILD");
  assert.equal(recommendationFor({ opportunityScore: 80, confidence: 64 }), "VALIDATE");
  assert.equal(recommendationFor({ opportunityScore: 79.9, confidence: 100 }), "VALIDATE");
});

test("RESEARCH wins when information gap is primary blocker", () => {
  assert.equal(
    recommendationFor({
      opportunityScore: 90,
      confidence: 90,
      informationGapPrimaryBlocker: true,
    }),
    "RESEARCH",
  );
});

test("INCUBATE covers strong ideas blocked by timing/dependency", () => {
  assert.equal(
    recommendationFor({
      opportunityScore: 75,
      confidence: 80,
      timingOrDependencyBlocked: true,
    }),
    "INCUBATE",
  );
});

test("KILL covers structurally weak or dominated ideas", () => {
  assert.equal(
    recommendationFor({
      opportunityScore: 90,
      confidence: 90,
      structurallyWeakOrDominated: true,
    }),
    "KILL",
  );
});

test("ARCHIVE is default for weak non-dominated ideas", () => {
  assert.equal(recommendationFor({ opportunityScore: 40, confidence: 80 }), "ARCHIVE");
});

test("low confidence with cheap test can VALIDATE", () => {
  assert.equal(
    recommendationFor({ opportunityScore: 50, confidence: 40, hasCheapValidationTest: true }),
    "VALIDATE",
  );
});

test("non-finite score inputs cannot produce a false high score", () => {
  assert.equal(opportunityScore({ ...all(100), revenuePotential: Number.POSITIVE_INFINITY }), 85);
});
