# AI Handoff Ledger

## Current production

Base branch: `main`
Current main SHA after Mission 4 merge: `ad980881b98b89d62cbd530a7970c10163190d1d`

Mission 1 merge SHA: `d7d9728456016f3840ed09bf7027f98ce88011c2`
Mission 1 status: **MERGED / COMPLETE**

Mission 4 merge SHA: `ad980881b98b89d62cbd530a7970c10163190d1d`
Mission 4 status: **MERGED / COMPLETE**
Mission 4 merge PR: #7 (supersedes closed draft PR #5)

Validated foundation now includes:
- dedicated IdeaBin Supabase project
- live schema + pgvector
- owner-scoped RLS and foreign keys
- private Next.js/Supabase SSR authentication
- immutable raw idea input
- append-only history/audit records
- repeatable two-user RLS regression test
- deterministic opportunity scoring and recommendation gates

## Active missions

### Mission 2 — Idea Inbox V1
Owner: Codex
Branch: `codex/idea-inbox-v1`
Issue: #2
Frozen mission base: `7790953cf0d39924c0082ba8511e961e76910990`

Mission 2 is actively executing. Do **not** rebase or merge current `main` into this branch mid-mission merely because Mission 4 has merged. Complete the owned mission against the frozen base, report the final head, then reconcile during integration review.

Owns:
- `apps/web/app/inbox/**`
- capture-specific components
- idea creation action/API
- capture tests

Must not modify:
- `supabase/migrations/**`
- auth/proxy files
- scoring
- AI provider/router internals

### Mission 3 — AI Structuring V1
Owner: Claude Code
Branch: `claude/ai-structuring-v1`
Issue: #3
Frozen mission base: `7790953cf0d39924c0082ba8511e961e76910990`

Mission 3 is actively executing. Do **not** rebase or merge current `main` into this branch mid-mission merely because Mission 4 has merged. Complete the owned mission against the frozen base, report the final head, then reconcile during integration review.

Status: implementation complete (new `packages/ai-structuring` domain
package + `apps/web/lib/ai/structure-idea.ts` integration); typecheck/tests/
build green; 100-fixture harness built and run offline (no live provider
credentials in the implementing environment — see `docs/AI_STRUCTURING.md`
for the honest breakdown of offline-plumbing vs. live-model results). PR
open, not merged; independent of Mission 2 and Mission 4 per the ownership
split below.

Owns:
- AI provider/router adapters
- structuring schema/service
- prompt/version contract
- `ai_runs` integration
- 100-fixture evaluation harness

Must not modify:
- Inbox UI ownership
- `supabase/migrations/**`
- auth/proxy files
- scoring formula

## Completed Mission 4 — Deterministic Scoring V1
Owner: ChatGPT / Codex review
Merged PR: #7
Merge SHA: `ad980881b98b89d62cbd530a7970c10163190d1d`

Final validation before merge:
- branch refreshed onto then-current `main` SHA `7790953cf0d39924c0082ba8511e961e76910990`
- behind main: 0 commits
- changed files: 5 scoring-only files
- install: PASS
- typecheck: PASS
- tests: PASS
- production build: PASS
- exact tested head: `9128cd6153ec4f1466d69fbffa016c5e04c22303`

Mission 4 owns the canonical scoring formula now merged to `main`. Active agents must not independently alter it.

## High-conflict ownership

Until the active missions merge, no agent may alter without separate authorization:
- `supabase/migrations/**`
- `apps/web/lib/supabase/**`
- `apps/web/proxy.ts`
- canonical core scoring formula
- root package/workspace configuration unless required to unblock its owned mission and documented in handoff

## Merge queue

1. Mission 2 `codex/idea-inbox-v1` after autonomous handoff + review
2. Mission 3 `claude/ai-structuring-v1` after autonomous handoff + review
3. integration/repair pass reconciling both branches with current `main`

Missions 2 and 3 may execute concurrently because their ownership is intentionally separated. Neither should pull a moving `main` during its current mission. If either needs a shared contract change, document the requested contract instead of editing the other mission's files.

## Pending product decisions

- public signup timing (V1 remains private/sign-in-only)
- scheduled web-research provider
- OpenRouter fallback at launch
- when project conversion becomes a first-class execution integration
