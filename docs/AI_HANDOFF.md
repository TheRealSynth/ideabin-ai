# AI Handoff Ledger

## Current production
Base branch: `main`
Baseline SHA: `b1301e8ede657b0361d9254dd05d0f0fdd9f1411`

## Active missions
Mission 1 owns database schema, Supabase helpers, and auth foundation on `chatgpt/database-core-v1`.

## Reserved future missions
- Mission 2 `codex/idea-inbox-v1`: capture UI/API after Mission 1 schema contract is stable.
- Mission 3 `claude/ai-structuring-v1`: AI structuring adapter/schema after Mission 1 merge.
- Mission 4 `chatgpt/scoring-engine-v1`: deterministic scoring may run in parallel from baseline if it does not touch Mission 1 files.

## High-conflict ownership
Mission 1: `supabase/migrations/**`, `apps/web/lib/supabase/**`, auth middleware/config.
Mission 4: `packages/core/scoring/**` only.

## Merge queue
1. Mission 1 database-core-v1
2. Mission 4 scoring-engine-v1 (independent; rebase if needed)
3. Mission 2 idea-inbox-v1
4. Mission 3 ai-structuring-v1

## Pending decisions
Authentication UX; scheduled web research provider; OpenRouter fallback at launch.
