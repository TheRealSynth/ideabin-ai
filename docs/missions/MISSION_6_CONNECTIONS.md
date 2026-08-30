# Mission 6 — Connections / Semantic Graph V1

## Preferred owner
Codex

## Dependency
Mission 5 merged.

## Objective
Generate useful related/duplicate/merge/shared-capability suggestions across a user's ideas using the existing Postgres + pgvector architecture, while preserving explainability and owner isolation.

## Required flow
`structured idea -> embedding -> nearest candidates -> bounded relationship classification -> typed relationship rows -> Connections UI`

## Requirements

1. Use `idea_embeddings` and pgvector already present in the schema unless measured evidence requires a migration.
2. Put embedding providers behind an adapter and record model/input hash so stale embeddings can be detected.
3. Candidate retrieval must be owner-scoped and bounded; do not compare every idea to every idea indefinitely.
4. Relationship types must align with the product model: overlaps, complements, depends_on, conflicts_with, can_merge_with, shares_capability, shares_distribution, shares_customer. Normalize names consistently.
5. Relationship classification must return strength, confidence, and rationale; uncertainty is allowed.
6. Avoid duplicate symmetric rows where one canonical representation is sufficient.
7. Build Connections views for Related ideas, Merge candidates, and Shared capabilities.
8. A useful shared-capability card must identify the capability, dependent ideas, and build-once rationale. Do not invent financial uplift without evidence; label estimates clearly if included.
9. A provider failure must not corrupt ideas or existing relationships.
10. No cross-owner candidate retrieval or relationship creation.

## Cheapest validation test
Seed at least 30 representative ideas containing known duplicates, near-duplicates, unrelated items, shared distribution, and shared capability cases. Measure precision/utility manually on a labeled subset before adding complexity.

## Acceptance
- deterministic candidate retrieval test
- cross-owner isolation test
- stale input hash triggers re-embedding
- known duplicate/related fixtures rank near the top
- relationship classifier output schema validated
- Connections UI links to source ideas and explains why they are connected
- tests/typecheck/build pass
- provider/model/cost observations recorded
