# Mission 11 — V1 100-Idea Commissioning

## Preferred owner
Primary: Claude. Independent verification: Codex or another agent that did not implement the final fixes.

## Dependency
Missions 8 and 10 merged.

## Objective
Prove the V1 works on real usage, not only fixtures.

## Commissioning dataset
Use at least 100 real user ideas spanning business, software, content, nonprofit, research, and mixed-quality raw notes. Never fabricate the commissioning result. If real ideas are unavailable in the environment, create the import harness and report commissioning as blocked rather than substituting synthetic data.

## Required measurements

1. Capture success rate and median mobile capture time.
2. Raw-input fidelity failures: target zero.
3. Live-model structuring validity without manual schema repair: target >=90% on the configured default route.
4. Structuring repair rate and hard-failure rate.
5. Score/recommendation completeness.
6. Related/duplicate suggestion utility on a manually reviewed sample.
7. Portfolio ranking explainability review.
8. Decision Queue completion.
9. Idea-to-project conversion success.
10. Prediction-vs-actual flow verified on available completed/seeded projects; clearly distinguish seeded workflow tests from real outcomes.
11. Ask IdeaBin starter-query correctness and source-linking.
12. Cross-owner isolation regression.
13. Provider cost/latency observations.
14. Mobile/desktop smoke test and production build.

## Exit gate
V1 is releasable only when the Product Spec acceptance gates are evidenced. Any missing gate is listed as an explicit blocker with the cheapest next test/fix.

## Final report
Return exact main SHA tested, deployment/preview tested, test totals, commissioning metrics, defects fixed, remaining blockers, operational costs, security findings, and a binary `V1 EXIT PASS` or `V1 EXIT FAIL`.
