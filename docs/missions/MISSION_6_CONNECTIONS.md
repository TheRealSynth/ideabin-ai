# Mission 6 — Connections / Semantic Graph V1

## Execution owner
Agent Mission Control assigns the worker. The current control-plane mission is `IDEA-CONNECT-006`; its current preferred worker is `claude-seat-2` when the IdeaBin project is activated. Do not self-dispatch from this file.

## Dependency
Mission 5 is merged via PR #16. Product dependency is satisfied. Resolve current `origin/main` at execution start rather than using a frozen SHA.

## Objective
Generate useful related/duplicate/merge/shared-capability suggestions across a user's ideas using the existing Postgres + pgvector architecture, while preserving explainability and owner isolation.

## Required flow
`structured idea -> embedding -> nearest candidates -> bounded relationship classification -> typed relationship rows -> Connections UI`

## Requirements

1. Use `idea_embeddings` and pgvector already present in the schema unless measured evidence requires a migration.
2. Put embedding providers behind an adapter and record model/input hash so stale embeddings can be detected.
3. Candidate retrieval must be owner-scoped and bounded; do not compare every idea to every idea indefinitely.
4. Relationship types must align with the product model: overlaps, complements, depends_on, conflicts_with, can_merge_with, shares_capability, shares_distribution, shares_customer. Normalize names consistently.
5. Relationship classification must return strength, confidence, rationale, provider/model/prompt provenance where AI is used, and preserve uncertainty.
6. Avoid duplicate symmetric rows where one canonical representation is sufficient.
7. Build Connections views for Related ideas, Merge candidates, and Shared capabilities.
8. A useful shared-capability card must identify the capability, dependent ideas, and build-once rationale. Do not invent financial uplift without evidence; label estimates clearly if included.
9. A provider failure must not corrupt ideas or existing relationships.
10. No cross-owner candidate retrieval or relationship creation.
11. Do not change canonical scoring or introduce project/task execution behavior.
12. Do not require live structuring quality to be treated as proven; the existing >=90% live-provider structuring fixture gate remains separate and unverified.

## Cheapest validation test
Seed at least 30 representative ideas containing known duplicates, near-duplicates, unrelated items, shared distribution, and shared capability cases. Label a subset before implementation, then measure retrieval/classification utility against those labels before adding complexity.

Prefer a two-stage test:

1. deterministic/offline candidate and relationship-fixture tests that require no paid provider;
2. a small real-provider sample only after the deterministic path passes, recording model, token/cost observations, false positives, and false negatives.

## Startup preflight

Before writing code:

1. confirm Mission 5 capability is present on current `origin/main`;
2. confirm `IDEA-CONNECT-006` is activated/assigned by Agent Mission Control;
3. inspect open IdeaBin PRs for overlapping `apps/web/**` or `packages/**` ownership;
4. inspect the existing `idea_embeddings` and `idea_relationships` schema/RLS instead of assuming a migration is needed;
5. preserve any active higher-priority portfolio pause from Agent Mission Control.

## Acceptance
- deterministic candidate retrieval test
- cross-owner isolation test
- stale input hash triggers re-embedding
- known duplicate/related fixtures rank near the top
- relationship classifier output schema validated
- duplicate symmetric relationships are canonicalized or prevented
- provider failure leaves existing data intact
- Connections UI links to source ideas and explains why they are connected
- shared-capability view identifies dependent ideas and build-once rationale without unsupported economics
- tests/typecheck/build pass
- provider/model/cost observations recorded
- handoff includes exact branch/base/head, changed files, tests, security/RLS impact, remaining risks, and whether merge is safe
