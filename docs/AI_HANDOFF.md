# AI Handoff Ledger

## Current production

Base branch: `main`
Mission 1 merge SHA: `d7d9728456016f3840ed09bf7027f98ce88011c2`

Mission 1 status: **MERGED / COMPLETE**

Validated foundation now includes:
- dedicated IdeaBin Supabase project
- live schema + pgvector
- owner-scoped RLS and foreign keys
- private Next.js/Supabase SSR authentication
- immutable raw idea input
- append-only history/audit records
- repeatable two-user RLS regression test

## Active missions

### Mission 2 — Idea Inbox V1
Owner: Codex
Branch: `codex/idea-inbox-v1`
Issue: #2

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

### Mission 4 — Deterministic Scoring V1
Owner: ChatGPT / Codex review
Branch: `chatgpt/scoring-engine-v1`
PR: #5

Status: implementation reviewed; CI repair applied; latest validation pending/green check. Independent of Missions 2 and 3 except it must be rebased onto current `main` before eventual merge.

Owns:
- `packages/core/**` scoring implementation/tests

Must not modify:
- migrations
- auth
- Inbox
- AI provider/router

## High-conflict ownership

Until the current missions merge, no agent may alter without separate authorization:
- `supabase/migrations/**`
- `apps/web/lib/supabase/**`
- `apps/web/proxy.ts`
- core scoring formula outside Mission 4
- root package/workspace configuration unless required to unblock its owned mission and documented in handoff

## Merge queue

1. Mission 4 scoring-engine-v1 after rebase + green CI
2. Mission 2 idea-inbox-v1
3. Mission 3 ai-structuring-v1

Missions 2 and 3 may execute concurrently because their ownership is intentionally separated. If either needs a shared contract change, stop and document the requested contract instead of editing the other mission's files.

## Pending product decisions

- public signup timing (V1 remains private/sign-in-only)
- scheduled web-research provider
- OpenRouter fallback at launch
- when project conversion becomes a first-class execution integration
