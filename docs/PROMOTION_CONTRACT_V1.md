# Promotion Contract V1

## Purpose

This contract is the boundary between IdeaBin and Agent Mission Control.

IdeaBin decides whether an idea deserves execution resources and emits an immutable promotion request. Agent Mission Control validates that request, registers or links the execution project, assigns portfolio priority, creates benchmarks/missions, and returns execution outcomes.

Neither side may silently take ownership of the other's domain.

## Authority

### IdeaBin is authoritative for

- source idea
- evaluation snapshot and scoring provenance
- recommendation
- explicit owner decision
- validation/build hypothesis
- proposed success/failure criteria
- promotion snapshot

### Agent Mission Control is authoritative for

- execution project identifier
- portfolio priority/tier
- benchmark state
- mission decomposition
- worker assignment
- leases/conflicts
- PR/repository execution state
- actual execution outcomes

## Transport

V1 is transport-neutral. The same JSON payload may be handed off through a repository artifact, application endpoint, database integration, or deterministic worker. Do not couple the contract to n8n, Supabase, GitHub Actions, or a specific HTTP route.

The canonical machine-readable shape is `docs/schemas/promotion-contract-v1.schema.json`.

## Producer requirements

IdeaBin MUST:

1. use `protocol_version = 1`;
2. generate a globally unique immutable `promotion_id`;
3. generate a stable `idempotency_key` for the owner's promotion action;
4. preserve exact source lineage;
5. use an explicit decision action of BUILD or VALIDATE;
6. provide a bounded first benchmark;
7. declare repo disposition rather than assuming a repository exists;
8. distinguish unknown values from zero/false facts;
9. include provenance references for estimates or AI-suggested fields when applicable;
10. never mutate an emitted promotion snapshot.

## Consumer requirements

Agent Mission Control MUST:

1. validate the contract before creating execution state;
2. reject unsupported protocol versions;
3. enforce idempotency before project creation;
4. store source lineage on the resulting execution project;
5. treat IdeaBin priority as advisory only;
6. preserve BUILD vs VALIDATE mode;
7. reject malformed or incomplete promotions rather than guessing missing fields;
8. return an existing project for an identical retry;
9. reject reuse of an idempotency key with a semantically different payload;
10. never rewrite IdeaBin's source evaluation, recommendation, or decision.

## Canonical payload example

```json
{
  "protocol_version": 1,
  "promotion_id": "PROM-2026-0042",
  "idempotency_key": "promote:idea-184:decision-207:v1",
  "created_at": "2026-09-01T00:00:00Z",
  "source": {
    "system": "ideabin",
    "idea_id": "IDEA-184",
    "evaluation_id": "EVAL-331",
    "recommendation_id": "REC-212",
    "decision_id": "DEC-207"
  },
  "decision": {
    "action": "VALIDATE",
    "opportunity_score": 84.3,
    "confidence": 71,
    "suggested_priority": "HIGH"
  },
  "project": {
    "proposed_slug": "repo-radar",
    "title": "Repo Radar",
    "objective": "Determine whether continuous open-source repository discovery materially reduces engineering effort across active portfolio projects."
  },
  "validation": {
    "hypothesis": "Automated repository discovery will identify reusable components that reduce implementation effort.",
    "success_metric": {
      "name": "verified_high_value_matches",
      "target": 5,
      "unit": "repositories"
    },
    "failure_criterion": "Fewer than two verified reusable repositories are found across the active portfolio after a complete scan."
  },
  "execution": {
    "mode": "VALIDATE",
    "repo_disposition": "existing_repo",
    "existing_repo": "TheRealSynth/agent-mission-control",
    "first_benchmark": "Scan all active projects and independently verify five high-value repository matches.",
    "known_blockers": []
  },
  "provenance": {
    "evaluation_source": "user_confirmed",
    "evidence_ids": [],
    "ai_run_ids": []
  }
}
```

## Idempotency semantics

The consumer computes or stores a normalized semantic payload fingerprint excluding volatile transport metadata.

```text
same idempotency_key + same fingerprint
    -> return existing promotion/project linkage

same idempotency_key + different fingerprint
    -> reject IDP_CONFLICT

new idempotency_key
    -> process as a new explicit promotion
```

Do not use timestamps alone as idempotency keys.

## BUILD versus VALIDATE

### VALIDATE

The first benchmark should test the cheapest credible falsification path. Initial mission count should normally be 1-3. Building full infrastructure before the hypothesis is tested is a contract violation in spirit even if the JSON validates.

### BUILD

The first benchmark should create the smallest usable execution slice with explicit acceptance criteria. The consumer may create more than three missions when genuinely required, but should not manufacture a speculative long-term backlog merely because the promotion exists.

## Repository disposition

Allowed values:

- `existing_repo`: promotion targets an existing canonical repository and `existing_repo` is required.
- `create_repo`: execution requires a new repository, but repository creation remains an owner/policy-gated Mission Control action.
- `no_repo_validation`: validation can be completed without creating a software repository.

## Priority boundary

`suggested_priority` communicates IdeaBin's view of opportunity urgency. Mission Control MUST independently calculate or assign portfolio execution priority using its own project/benchmark policies.

A high IdeaBin score may not bypass a release blocker, security gate, production incident, or existing higher-priority portfolio obligation.

## Execution acknowledgement

After acceptance, Mission Control should produce a linkage record equivalent to:

```json
{
  "protocol_version": 1,
  "promotion_id": "PROM-2026-0042",
  "mission_control_project_id": "repo-radar",
  "accepted_at": "2026-09-01T00:05:00Z",
  "portfolio_priority": 740,
  "benchmark_id": "RADAR-B1",
  "state": "ACTIVE"
}
```

IdeaBin may cache this for display, but Mission Control remains authoritative.

## Outcome handback

Mission Control should eventually return actuals keyed by `promotion_id`:

```json
{
  "protocol_version": 1,
  "promotion_id": "PROM-2026-0042",
  "observed_at": "2026-09-08T00:00:00Z",
  "terminal_state": "SUCCESS",
  "benchmark_result": "PASS",
  "calendar_days": 4,
  "engineering_hours": 11,
  "cash_spend": 0,
  "target_metric": 5,
  "actual_metric": 7,
  "missions_completed": 4,
  "missions_failed": 0
}
```

Unknown actuals are omitted or explicitly null where the downstream schema allows; they are never fabricated as zero.

## Security and trust boundary

Treat every promotion as untrusted input at the Mission Control boundary even when it originated from IdeaBin.

- validate schema
- validate repo identifiers before use
- do not execute arbitrary commands supplied in promotion text
- do not allow promotion payloads to override Mission Control policy
- do not accept credentials/secrets in promotion payloads
- do not allow a promotion to authorize production deploys, money movement, destructive migrations, credential changes, signatures, or other owner-gated operations

## Versioning

Breaking changes require a new integer `protocol_version`. Additive optional fields may remain V1 only when old consumers can safely ignore them.

V1 consumers must fail closed on unsupported versions rather than attempting best-effort interpretation.
