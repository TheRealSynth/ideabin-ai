# Mission 10 — Outcomes and Calibration V1

## Preferred owner
Claude Code

## Dependency
Mission 9 merged.

## Objective
Close the loop from prediction to actual result without rewriting history or pretending to have reinforcement learning.

## Required behavior

1. Outcome Review compares immutable predicted values/assumptions available at decision time with actual cost, time, demand, revenue, and outcome label.
2. User can record lessons and contextual notes.
3. Historical evaluations and recommendations are never overwritten.
4. Produce calibration analytics such as score/confidence bucket vs observed success, predicted vs actual cost/time where comparable, and common failure assumptions.
5. Generate proposed scoring-model adjustments as recommendations only. Never automatically change canonical weights.
6. Any proposed calibration must cite sample size and uncertainty; suppress confident conclusions on tiny samples.
7. Maintain owner isolation and append-only history semantics.

## Acceptance
- project/idea outcome can be entered and reviewed
- original prediction remains unchanged
- prediction-vs-actual comparison is reproducible
- calibration view handles sparse data honestly
- no automatic scoring weight mutation
- tests/typecheck/build pass
