# AI Handoff Ledger

## Canonical rule
`main` is production source of truth. Agents must resolve current `origin/main` at runtime; old frozen SHAs are historical evidence, not permission to work from stale code.

## Current verified production state

Current product `main` after the owner-authorized Mission 5 merge: `e235a7922c80148d85c7558cd863786ef606a289`.

- Mission 1 — Database/Auth Foundation: **MERGED / COMPLETE**
- Mission 4 — Deterministic Scoring: **MERGED / COMPLETE** via PR #7
- Mission 3 — AI Structuring: **MERGED / COMPLETE** via PR #8
- Mission 3G — AI Structuring review gate: **COMPLETE**
- Mission 2R — Idea Inbox restart: **MERGED / COMPLETE** via PR #15; merge commit `79a6d604e1653ee56235a6acc574c5a67a3b6af7`
- Mission 5 — Usable vertical slice: **MERGED / COMPLETE** via PR #16; merge commit `e235a7922c80148d85c7558cd863786ef606a289`
- Mission 6 — Connections / semantic graph: **PRODUCT DEPENDENCY SATISFIED / PREPARED**; activation and worker assignment remain owned by Agent Mission Control

## Foundation now on main

- dedicated Supabase project
- schema + pgvector
- owner-scoped RLS and foreign keys
- private Next.js/Supabase SSR authentication
- immutable `ideas.raw_input`
- append-only idea versions/evaluations/AI audit history
- provider-neutral AI structuring service with schema validation and bounded repair
- `structureIdea(ideaId)` RLS-scoped application integration contract
- raw-first Inbox with Save Raw independent of AI availability
- Save + Structure persists the raw idea before any AI call and leaves failures retryable
- owner-scoped Idea Library and Idea Detail
- explicit user-confirmed eight-dimension evaluation inputs with provenance
- canonical deterministic opportunity scoring and recommendation gates
- score, confidence, recommendation, raw user input, AI-derived fields, evaluation history, version history, and AI run history displayed as distinct data classes
- re-evaluation creates a new evaluation snapshot rather than editing history

## Mission 2R final result

Merged PR: #15
Merged main SHA: `79a6d604e1653ee56235a6acc574c5a67a3b6af7`

The stale/conflicting PR #10 was closed without merge. Mission 2R was rebuilt from then-current `main`, preserving Mission 3 package/test wiring. Fresh PR CI passed before merge and the post-merge main CI also passed.

## Mission 5 final result

Merged PR: #16
Merged main SHA: `e235a7922c80148d85c7558cd863786ef606a289`
PR head validated before merge: `d161c370afaa1a52470704e97d977c44cdaa45df`

Mission 5 delivered:

`capture -> structure -> explicit user-confirmed evaluation inputs -> deterministic score -> recommendation -> inspect`

Fresh PR CI passed install, typecheck, tests, and production build. No Supabase migration, auth/proxy code, canonical scoring formula, or provider/router contract was changed.

### Mission 5 known follow-up
Evaluation persistence is currently multiple server-side writes: evaluation insert -> recommendation insert -> idea status update. Failures are surfaced and immutable rows are not edited, but a late-stage failure can leave a partial durable trail. Treat atomic persistence as a bounded future hardening item rather than silently assuming transactionality.

## Live-model quality gate

The 100-fixture live-provider quality target remains **UNVERIFIED**. Existing offline/deterministic fixture success proves plumbing, not real-model quality. Do not report the >=90% live target as achieved until a real provider run proves it.

## Deployment/runtime gate

Repository CI/build health is verified, but a connected IdeaBin Vercel project was not discoverable in the current hosting account at the latest check. Mobile/desktop browser behavior and the live Supabase/auth flow therefore remain runtime-unverified. See `docs/DEPLOYMENT_VERCEL.md` for the deployment contract and verification checklist.

## Mission 6 — Connections / Semantic Graph

Product dependency is satisfied because Mission 5 is merged. Mission file: `docs/missions/MISSION_6_CONNECTIONS.md`.

Mission 6 should execute only when Agent Mission Control activates/assigns `IDEA-CONNECT-006`. The current portfolio control plane may keep IdeaBin paused while higher-priority CRS work is active; product readiness must not be confused with dispatch authorization.

Required flow:

`structured idea -> embedding -> bounded owner-scoped nearest candidates -> validated relationship classification -> typed relationship rows -> Connections UI`

Do not change canonical scoring, create execution/task-management behavior, or weaken owner isolation.

## Remaining product sequence

1. Mission 6 — Connections / semantic graph
2. Mission 7 — Portfolio prioritization / Decision Queue / Today
3. Mission 8 — Ask IdeaBin
4. Mission 9 — Promote to Execution
5. Mission 10 — Outcomes / calibration
6. Mission 11 — 100-idea V1 commissioning

Canonical product roadmap: `docs/AGENT_QUEUE.md`.

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
