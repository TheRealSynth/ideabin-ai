# Mission 5 — Usable Vertical Slice

## Preferred owner
Claude Code

## Branch
When the dependency is satisfied, create fresh branch `claude/vertical-slice-v1` from current `origin/main`.

## Runtime dependency
Mission 3 is already merged via PR #8. Start this mission immediately after Mission 2R — Idea Inbox — is merged into `main`.

Do not rely only on a stale queue label. At startup, inspect actual `origin/main`. If the Mission 2R Inbox implementation is present on `main` and no open PR already owns Mission 5, this mission is READY.

## Objective
Make IdeaBin usable end-to-end for one idea:

`capture -> structure -> explicit evaluation inputs -> deterministic score -> recommendation -> inspect`

This mission converts the merged foundations into the first coherent product slice without inventing scoring data or weakening provenance.

## Required reads before coding

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/AI_HANDOFF.md`
4. `docs/AGENT_QUEUE.md`
5. `docs/PRODUCT_SPEC.md`
6. `docs/ARCHITECTURE.md`
7. `docs/SCREEN_SPEC.md`
8. `docs/SCORING_MODEL.md`
9. `docs/AI_STRUCTURING.md`
10. current Mission 2R Inbox implementation on `main`
11. `apps/web/lib/ai/structure-idea.ts`
12. `packages/core/src/scoring.ts`
13. relevant schema/RLS definitions for `ideas`, `evaluations`, `recommendations`, `idea_versions`, and `ai_runs`

## Already-merged contracts — do not duplicate them

### Structuring
Use the merged application contract:

`structureIdea(ideaId): Promise<StructureIdeaOutcome>`

Current outcomes:
- `{ status: "structured", ideaId }`
- `{ status: "not_found", ideaId }`
- `{ status: "failed", ideaId, reason: "validation_failed" | "provider_error" | "persist_failed" }`

Do not call provider adapters directly from UI code. Do not reimplement the structuring schema or prompt.

### Deterministic scoring
Use the canonical exports in `packages/core/src/scoring.ts`:
- `opportunityScore(input: ScoreInputs)`
- `recommendationFor(context: RecommendationContext)`
- `SCORE_WEIGHTS`

The eight canonical dimensions are:
1. revenuePotential
2. speedToValidation
3. capitalEfficiency
4. executionFeasibility
5. existingAssetLeverage
6. distributionAdvantage
7. marketTiming
8. strategicReuse

Do not fork, reweight, or copy the formula into app code.

## Critical scoring boundary

The formula is deterministic; **the eight numeric inputs are not.** The current structuring schema does not produce those eight 0-100 values. Therefore:

- do not derive numeric dimensions from raw/structured text using undocumented keyword heuristics;
- do not silently treat missing values as zero;
- do not present AI/model guesses as deterministic facts;
- every dimension used in a score must have explicit provenance.

Create the smallest application-level evaluation-input contract that supplies all eight 0-100 values plus overall confidence and recommendation context flags/rationale before calling `opportunityScore()` / `recommendationFor()`.

For this first vertical slice, the reliable fallback is a compact authenticated **Evaluate** form where the user can enter/confirm the eight values and confidence. If AI-suggested inputs are added, they must be clearly labeled as suggestions with provider/model/prompt provenance and must not be silently default-enabled while the live-model >=90% fixture gate remains unverified.

Persist an immutable evaluation snapshot to the existing `evaluations` table. Store dimension values and their source/provenance in `evaluations.dimensions`/supporting existing fields without requiring a migration unless a real blocker is demonstrated.

Insert a recommendation record derived from the canonical deterministic gates. Do **not** automatically treat the recommendation as the user's decision. Keep `ideas.status` at `evaluated` after scoring; Mission 7 owns the later decision/override workflow and status transition to BUILD/VALIDATE/etc.

## Required product behavior

1. Inbox `Save Raw` creates an inbox idea with zero AI dependency.
2. `Save + Structure` always persists raw first, then invokes `structureIdea(ideaId)`.
3. A structuring failure leaves the saved raw idea visible and retryable; draft/source data is not lost.
4. Successful structuring preserves the merged AI audit/version behavior and produces a structured idea.
5. A structured idea can be evaluated only after all required scoring inputs are explicit and validated.
6. Scoring calls the canonical `opportunityScore()` exactly once per submitted evaluation input snapshot and persists the resulting immutable evaluation.
7. Recommendation calls the canonical `recommendationFor()` and is stored/displayed separately from opportunity score and confidence.
8. Add the minimum Idea Library and Idea Detail surfaces needed to inspect:
   - exact raw input
   - normalized AI-derived fields
   - structured/evaluated status
   - eight scoring dimensions
   - opportunity score
   - confidence
   - recommendation
   - assumptions/open questions
   - idea version history
   - AI audit/run state
9. Add explicit retry for structuring. Retrying must never mutate original raw input or old versions/evaluations.
10. Re-evaluation creates a new evaluation snapshot; it never edits an old evaluation.
11. No provider credential may reach the browser.
12. Mobile capture remains fast; evaluation/detail can be denser but must remain usable on mobile.

## Suggested application service boundary

Prefer a service such as `evaluateIdea(ideaId, evaluationInput)` rather than embedding persistence/scoring logic in page components.

The service should:
1. fetch the caller-owned structured idea through the existing RLS-scoped server client;
2. validate all eight dimensions and confidence as finite 0-100 values;
3. transform explicit dimension values into canonical `ScoreInputs`;
4. call `opportunityScore()`;
5. call `recommendationFor()` using explicit context flags;
6. insert an immutable `evaluations` snapshot;
7. insert the derived recommendation suggestion;
8. update only allowed current-state fields such as `ideas.status = 'evaluated'`;
9. never touch `raw_input` or old evaluation/version rows.

Exact function/file naming may follow the existing app conventions; preserve this boundary even if names differ.

## Live-AI enablement gate

PR #8 is merged, but the >=90% live-provider fixture target has not yet been demonstrated. Mission 5 may wire the service and recoverable UI path, but must not claim live structuring quality is validated. If a production feature flag/config is needed to prevent silent default enablement, implement the smallest server-only gate and document it. `Save Raw` must remain independent of that gate.

## Architecture constraints

- no duplicate structuring logic in UI code
- no direct provider calls from components
- no fork or silent alteration of canonical scoring
- preserve append-only versions/evaluations/audit records
- preserve RLS owner isolation
- prefer application services over route-specific business logic
- no schema migration unless a demonstrated blocker requires it; if required, isolate it and document forward effect, rollback, RLS, backfill, and compatibility
- no automatic user decision/override workflow; Mission 7 owns that

## Acceptance

- authenticated user can capture one idea and reach a structured detail screen when structuring is available
- `Save Raw` succeeds with no AI credentials/config
- `Save + Structure` persists raw before any AI call and failure is recoverable
- raw-input immutability regression remains green
- user can supply/confirm explicit evaluation inputs for a structured idea
- missing/invalid scoring dimensions cannot generate an evaluation
- deterministic score is reproducible from the stored dimension values using the canonical scoring version
- opportunity score, confidence, recommendation, and input provenance are visibly distinct
- a second evaluation creates a second immutable snapshot
- Idea Library shows newly captured/processed ideas
- Idea Detail distinguishes user-authored, AI-derived, and deterministic evaluation data
- no existing migrations/auth/proxy/scoring formula modified without a documented blocker
- focused tests + full tests + typecheck + build pass
- preview/manual flow verified on mobile and desktop when preview infrastructure is available

## Required regression cases

At minimum test:
1. Save Raw with no provider credentials
2. Save + Structure where provider fails after raw save
3. structure success does not alter raw input
4. evaluation rejects one missing dimension
5. evaluation rejects NaN/out-of-range values
6. stored evaluation reproduces the canonical score
7. recommendation is stored separately from score/confidence
8. second evaluation does not mutate first
9. cross-owner idea cannot be structured/evaluated/read through these services
10. provider key names never appear in client components or `NEXT_PUBLIC_*`

## Non-goals

Connections/embeddings, portfolio ranking, Decision Queue acceptance/override, Ask IdeaBin, project conversion, outcome calibration, external signal research, autonomous scoring-input generation, or scoring-weight changes.

## Handoff

Return:
1. mission and readiness evidence
2. branch
3. base `main` SHA
4. head SHA
5. files changed
6. exact capture -> structure -> evaluate -> score -> inspect flow implemented
7. scoring-input provenance design
8. exact tests/results
9. typecheck/build results
10. preview/mobile+desktop verification
11. schema/RLS/security impact
12. live-AI enablement state
13. remaining risks
14. whether merge is safe
15. next mission that becomes READY after merge
