# AI Handoff Ledger

## Canonical rule
`main` is production source of truth. Agents must resolve current `origin/main` at runtime; old frozen SHAs are historical evidence, not permission to work from stale code.

## Current verified production state

Current `main` after Mission 3 merge: `dffbfbd9430a2a84f1c1097eb98174af4369cc0e`

- Mission 1 — Database/Auth Foundation: **MERGED / COMPLETE**
- Mission 4 — Deterministic Scoring: **MERGED / COMPLETE** via PR #7
- Mission 3 — AI Structuring: **MERGED / COMPLETE** via PR #8
- Mission 3G — AI Structuring review gate: **COMPLETE / MERGE RECOMMENDED**, followed by owner-authorized merge of PR #8
- Mission 2R — Idea Inbox restart: **READY / NOT YET CLAIMED** at last verification

## Foundation now on main

- dedicated Supabase project
- schema + pgvector
- owner-scoped RLS and foreign keys
- private Next.js/Supabase SSR authentication
- immutable `ideas.raw_input`
- append-only idea versions/evaluations/AI audit history
- deterministic 0-100 opportunity scoring with eight weighted dimensions
- confidence stored separately from score
- BUILD / VALIDATE / RESEARCH / INCUBATE / ARCHIVE / KILL gates
- provider-neutral AI structuring service
- strict validated structuring schema
- bounded one-repair-attempt AI pipeline
- prompt-injection-isolated structuring prompt
- OpenAI/OpenRouter adapters behind `StructuringProvider`
- `structureIdea(ideaId)` RLS-scoped application integration contract

## Mission 3 — AI Structuring final result

Merged PR: #8
Merged main SHA: `dffbfbd9430a2a84f1c1097eb98174af4369cc0e`
Reviewed head before merge: `eb6f6e18be7fbe34642d9cbcb39350e066cee283`

Mission 3G independently re-verified:
- `pnpm test`: 65/65 passing
- typecheck: pass
- production build: pass
- no RLS bypass/service-role use
- no provider secret leakage to client code
- no `ideas.raw_input` mutation
- bounded retries only
- malformed output cannot silently persist
- no migration/auth/scoring scope creep

### Remaining live-model gate
The 100-fixture live-provider quality test remains unverified because no `OPENAI_API_KEY` or `OPENROUTER_API_KEY` was available in the implementing/review environments. This blocks **default production enablement of live AI structuring**, not the merged service plumbing. Do not report the >=90% target as achieved until a real provider run proves it.

### Known non-blocking follow-ups
- `idea_versions.version_no` is currently client/application-computed and can race under concurrent structuring of the same idea.
- An `idea_versions` insert failure after a successful `ideas` update is not surfaced as a distinct outcome.

These are recorded risks, not permission for unrelated missions to redesign schema.

## Mission 2R — Idea Inbox

Preferred owner: Codex
Mission file: `docs/missions/MISSION_2R_IDEA_INBOX_RESTART.md`
Required branch: fresh `codex/idea-inbox-v2` from current `origin/main`.

At last verification, only stale `codex/idea-inbox-v1` existed; no fresh Mission 2R implementation branch or PR had been created.

Mission 2R is the sole READY implementation mission now.

## Mission 5 — Usable vertical slice

Mission 5 is fully pre-specified in `docs/missions/MISSION_5_VERTICAL_SLICE.md` and should start immediately when Mission 2R is merged.

Runtime dependency rule: agents must derive readiness from actual `origin/main`. Once Mission 2R is merged, Mission 5 becomes READY automatically even if a stale queue table still says BLOCKED.

Mission 5 must connect:
`capture -> structure -> explicit evaluation inputs -> deterministic score -> recommendation -> inspect`

Important scoring boundary: `opportunityScore()` is deterministic, but the eight numeric dimension inputs are not magically derivable from free text. Mission 5 must not invent them through undocumented keyword heuristics. Inputs must have an explicit source/provenance and confidence before the deterministic formula is called.

## Remaining sequence

1. Mission 2R — Idea Inbox restart
2. Mission 5 — Usable vertical slice
3. Mission 6 — Connections / semantic graph
4. Mission 7 — Portfolio prioritization / Decision Queue / Today
5. Mission 8 — Ask IdeaBin
6. Mission 9 — Idea-to-project execution
7. Mission 10 — Outcomes / calibration
8. Mission 11 — 100-idea V1 commissioning

Canonical queue: `docs/AGENT_QUEUE.md`.

## High-conflict ownership

No agent may casually alter:
- `supabase/migrations/**`
- auth/proxy code
- canonical scoring formula
- raw-input immutability contracts
- root workspace/package configuration
- AI provider contracts owned by another active mission

A mission that genuinely requires a high-conflict change must document the blocker, isolate the change, and include RLS/security/backfill/compatibility effects.

## Merge policy

One mission, one branch, one PR. Do not merge automatically unless the owner explicitly authorizes it.
