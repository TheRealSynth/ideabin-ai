# Scoring Engine V1 Validation

PR: #5
Branch: `chatgpt/scoring-engine-v1`

## Contract checked

The deterministic formula matches `docs/SCORING_MODEL.md`:

- revenue potential: 15%
- speed to validation: 15%
- capital efficiency: 10%
- execution feasibility: 10%
- existing asset leverage: 15%
- distribution advantage: 15%
- market timing: 10%
- strategic reuse: 10%

Opportunity score and confidence remain separate inputs.

Recommendation precedence is deterministic:

1. KILL for structurally weak/dominated opportunities.
2. RESEARCH when an information gap is the primary blocker.
3. INCUBATE for otherwise strong opportunities blocked by timing/dependency.
4. BUILD at score >= 80 and confidence >= 65.
5. VALIDATE at score >= 65, or for lower-confidence ideas with a cheap test.
6. ARCHIVE otherwise.

## Validation repair

Initial CI revealed that the core test package omitted Node type declarations. `@types/node` was added and the tests were expanded so every scoring dimension independently proves its documented weight.

Additional boundary coverage verifies:
- score clamping to 0-100,
- BUILD confidence threshold,
- BUILD score threshold,
- blocker precedence,
- non-finite values cannot create false high scores.

## Merge discipline

Mission 4 was refreshed directly onto the current post-Mission-1 `main` coordination SHA before final merge validation. The scoring implementation remains isolated to `packages/core/**` plus this validation document.
