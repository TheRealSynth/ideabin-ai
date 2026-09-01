# Mission 9 — Promote to Execution V1

## Preferred owner
Claude Code or Codex through Agent Mission Control

## Dependency
Mission 7 merged. Mission 8 may run in parallel if file ownership remains separate.

## Objective
Convert an accepted BUILD or VALIDATE decision into a durable, idempotent promotion request that Agent Mission Control can consume, without turning IdeaBin into a general-purpose task manager.

IdeaBin owns the decision and evidence. Agent Mission Control owns portfolio execution priority, benchmarks, missions, workers, leases, conflicts, PR reconciliation, and execution state.

## Architectural boundary

IdeaBin stops at:

`idea -> evaluation -> recommendation -> explicit decision -> validation/build hypothesis -> success criteria -> promotion`

Agent Mission Control continues with:

`promotion -> project registration -> portfolio priority -> benchmark -> missions -> worker execution -> actual outcomes`

IdeaBin may display execution status returned by Agent Mission Control, but it must not maintain a competing task/mission scheduler.

## Required behavior

1. From Idea Detail or Decision Queue, an explicit BUILD or VALIDATE decision exposes `Promote to execution`.
2. Promotion requires a complete source chain: idea, evaluation, recommendation, explicit user decision, and provenance.
3. Promotion requires a validation/build hypothesis, primary success metric, failure criterion, proposed project title/slug, existing-repo/new-repo decision, known blockers, and a smallest credible first benchmark.
4. IdeaBin creates an immutable promotion snapshot conforming to `docs/PROMOTION_CONTRACT_V1.md`.
5. Every promotion receives a stable `promotion_id` and idempotency key. Retrying the same promotion must not create duplicate execution projects.
6. Promotion works without AI. AI may draft the hypothesis, metric, or first benchmark through the existing audited adapter path, but every promoted value remains editable and provenance-labeled.
7. BUILD and VALIDATE remain distinct:
   - VALIDATE requests the cheapest credible falsification plan and should normally begin with at most three bounded missions.
   - BUILD requests the smallest credible implementation benchmark; it must not generate a speculative long backlog.
8. IdeaBin stores promotion state separately from the source evaluation/decision. Promotion must never rewrite the source idea, historical evaluation, recommendation, or decision snapshot.
9. Agent Mission Control is the authority for execution priority and worker allocation. IdeaBin may include a suggested priority or urgency signal, but it cannot assign final portfolio priority.
10. IdeaBin can display a read-only execution projection returned by Agent Mission Control: project ID, benchmark, progress/status, current blocker, current/next mission, and last activity.
11. Mission Control actuals can be linked back to the promotion so Mission 10 can compare prediction versus reality.
12. Cross-owner promotion read/write must fail closed under the existing RLS model.

## Promotion readiness gate

A promotion cannot be emitted unless all required fields are present and valid:

- structured idea exists
- immutable evaluation exists
- recommendation exists
- explicit decision exists
- decision is BUILD or VALIDATE
- evaluation/provenance references are present
- validation/build hypothesis is non-empty
- primary success metric is explicit
- failure criterion is explicit
- proposed project title/slug is explicit
- repository disposition is explicit: existing repo, create repo, or no repo required for validation
- known blockers are captured, including `none_known` when applicable
- first benchmark is bounded and testable
- duplicate-project check has run
- owner explicitly confirms promotion

## Promotion contract

Use `docs/PROMOTION_CONTRACT_V1.md` and `docs/schemas/promotion-contract-v1.schema.json` as the V1 producer contract.

Minimum lineage:

- `protocol_version`
- `promotion_id`
- `idempotency_key`
- `created_at`
- `source.idea_id`
- `source.evaluation_id`
- `source.recommendation_id`
- `source.decision_id`
- `decision.action`
- `project.proposed_slug`
- `project.title`
- `project.objective`
- `validation.hypothesis`
- `validation.success_metric`
- `validation.failure_criterion`
- `execution.first_benchmark`
- `execution.repo_disposition`

## Idempotency

A promotion retry must resolve as follows:

```text
same idempotency_key + same semantic payload -> return existing promotion
same idempotency_key + changed semantic payload -> reject as conflict
new idempotency_key -> create new promotion snapshot
```

Intentional follow-on experiments require an explicit new promotion action and a new `promotion_id`; they must remain linked to the originating idea/decision.

## Execution-status boundary

IdeaBin may persist a cache/read model of Mission Control execution state for UX, but that cache is not authoritative. At minimum support:

- mission-control project identifier
- current benchmark identifier/title/state
- current mission identifier/state
- blocking reason
- percent/progress only when backed by an explicit Mission Control measure
- last reconciled timestamp

Stale execution status must be labeled stale rather than inferred.

## Outcome handback

Mission Control may return actuals keyed by `promotion_id`, including:

- calendar duration
- engineering effort when known
- cash spend when known
- benchmark result
- target metric and actual metric
- missions completed/failed
- terminal project state

Mission 10 owns calibration and must compare these actuals against the exact immutable evaluation/decision/promotion lineage, not the latest edited idea fields.

## Acceptance

- BUILD or VALIDATE decision promotes in one flow
- non-BUILD/VALIDATE decisions cannot promote through the normal path
- complete lineage is persisted
- no-AI fallback works
- duplicate retry returns the existing promotion rather than creating a second project request
- conflicting reuse of an idempotency key fails closed
- source idea/evaluation/recommendation/decision remain immutable
- suggested priority is distinct from Mission Control portfolio priority
- IdeaBin contains no worker assignment, lease, path-reservation, PR-dispatch, or mission-scheduling authority
- Mission Control execution status can be displayed read-only without becoming a second source of truth
- cross-owner access fails closed
- mobile promotion review is usable
- focused tests + full tests + typecheck + build pass

## Required regression cases

1. BUILD promotion succeeds with all required fields.
2. VALIDATE promotion succeeds and preserves the validation mode.
3. RESEARCH/INCUBATE/ARCHIVE/KILL cannot use the standard promotion action.
4. Missing evaluation/decision lineage rejects promotion.
5. Missing success metric or failure criterion rejects promotion.
6. Same idempotency key and same payload returns the same promotion.
7. Same idempotency key and changed payload rejects with conflict.
8. Second intentional experiment creates a distinct promotion linked to the same source idea.
9. Promotion does not mutate source evaluation, recommendation, or decision rows.
10. Cross-owner promotion creation/read fails closed.
11. Mission Control status cache cannot overwrite canonical IdeaBin decision/evaluation data.
12. AI unavailable still allows manual promotion.

## Non-goals

- general-purpose task management inside IdeaBin
- worker scheduling or worker leases
- portfolio execution priority assignment
- GitHub PR orchestration
- deployment orchestration
- automatic code modification
- automatic production launch
- creating large speculative backlogs

## Handoff

Return:
1. mission/readiness evidence
2. branch
3. base `main` SHA
4. head SHA
5. files changed
6. promotion storage/service boundary
7. idempotency implementation
8. exact BUILD and VALIDATE flows
9. Mission Control consumer compatibility evidence
10. RLS/security impact
11. tests/typecheck/build results
12. remaining risks
13. whether merge is safe
14. next Mission Control integration mission that becomes eligible
