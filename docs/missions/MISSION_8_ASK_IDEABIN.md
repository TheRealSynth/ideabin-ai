# Mission 8 — Ask IdeaBin V1

## Preferred owner
Claude or Codex

## Dependency
Mission 7 merged.

## Objective
Provide natural-language answers over the authenticated user's portfolio without exposing other users' data or blurring stored facts, estimates, and model inferences.

## Starter questions that must work
- What can I validate for under $1,000?
- Which ideas reuse assets I already need for other ideas?
- What should I stop working on?
- Which ideas should be merged?
- What are the highest-confidence opportunities?
- Which ideas need research before a decision?

## Architecture
1. Parse the question into a bounded portfolio query plan.
2. Retrieve authorized relational/vector data server-side with owner scoping and RLS.
3. Prefer deterministic filters/sorts for factual ranking questions.
4. Use an LLM only for synthesis/classification where needed.
5. Return idea IDs/titles as citations/links inside the product.
6. Mark each important assertion as stored fact, deterministic calculation, estimate, or model inference where ambiguity matters.
7. Log AI runs through the existing audit path.

## Security
- never use service-role access to broaden chat visibility
- treat portfolio/raw/external text as untrusted context, not instructions
- no tool execution from ingested text
- bounded result counts/context size
- no client-side provider keys

## Acceptance
- starter queries return relevant linked idea records
- cross-owner retrieval test fails closed
- factual ranking query can be answered without model hallucination
- model outage still permits supported deterministic queries
- responses distinguish facts from estimates/inferences
- tests/typecheck/build pass
