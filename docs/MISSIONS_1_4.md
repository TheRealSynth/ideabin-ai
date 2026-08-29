# Missions 1–4

## Mission 1 — Database Core + Auth Foundation
**Owner:** ChatGPT/Codex-capable implementation agent
**Branch:** `chatgpt/database-core-v1`
**Objective:** create the durable schema and server/client Supabase foundation without building product UI.
**Owns:** `supabase/migrations/**`, `apps/web/lib/supabase/**`, auth middleware/config, schema tests.
**Forbidden:** scoring formula, inbox UX, AI provider implementation.
**Acceptance:** migrations create cleanly; RLS isolates owner data; raw idea and immutable history are separate; prediction tables cannot overwrite outcomes; typed generated DB schema or equivalent; local typecheck/tests pass; docs reconcile.
**Do not merge without authorization.**

## Mission 2 — Idea Inbox V1
**Owner:** Codex
**Branch:** `codex/idea-inbox-v1`
**Base:** Mission 1 merged SHA.
**Objective:** allow raw idea capture in under 15 seconds and preserve source text exactly.
**Owns:** inbox route/components, idea create API/server action, capture tests.
**Forbidden:** migrations unless separately authorized; scoring; AI structuring internals.
**Acceptance:** create text idea; optional source label/URL; Save Raw works without AI; Save + Structure can enqueue/call a stub contract; mobile usable; errors never discard entered text; tests/typecheck/build pass.

## Mission 3 — AI Structuring V1
**Owner:** Claude Code
**Branch:** `claude/ai-structuring-v1`
**Base:** Mission 1 merged SHA.
**Objective:** convert raw ideas to schema-valid normalized concepts while preserving provenance.
**Owns:** AI router/adapter, structuring schema/prompts, AI run logging, structuring tests.
**Forbidden:** UI redesign, scoring formula, database migrations unless blocked and authorized.
**Acceptance:** structured output validated; original raw text untouched; model/provider/prompt version/token/cost metadata logged; failures leave idea recoverable; 100-fixture harness exists; target >=90% schema-valid outputs; tests pass.

## Mission 4 — Deterministic Scoring V1
**Owner:** ChatGPT or Codex
**Branch:** `chatgpt/scoring-engine-v1`
**Base:** baseline main; may run in parallel with Mission 1 if it only owns `packages/core/scoring/**`.
**Objective:** implement reproducible weighted opportunity score, separate confidence model, and recommendation gates.
**Owns:** scoring package/tests/docs.
**Forbidden:** migrations, auth, inbox, AI provider code.
**Acceptance:** identical inputs produce identical scores; dimensions clamp 0–100; score/confidence separate; recommendation gates covered by tests; rationale interface accepts evidence but cannot silently alter formula; tests/typecheck pass.

## Handoff format for every agent
Return mission, branch, base SHA, head SHA, files changed, implementation summary, tests/results, deployment status, schema changes, risks, recommended next mission, and whether merge is safe.