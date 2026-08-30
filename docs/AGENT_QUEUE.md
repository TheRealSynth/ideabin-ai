# IdeaBin.ai V1 Agent Queue

This file is the canonical execution queue. Agents must also obey `AGENTS.md`, `CLAUDE.md` when applicable, `docs/AI_HANDOFF.md`, and the relevant mission file.

## Operating rule

Resolve `origin/main` at mission start. Never assume a SHA in an old chat is still current. One mission = one branch = one PR. Do not merge without explicit owner authorization.

The table state is a coordination hint, not a stale lock. **Runtime dependency truth wins:** if a mission is shown as BLOCKED but every dependency listed for it is already merged into current `origin/main`, treat that mission as READY immediately. If a task is blocked by an unmet dependency, do not improvise around it; move to the next eligible READY mission.

## Current verified state

- `main` after Mission 3 merge: `dffbfbd9430a2a84f1c1097eb98174af4369cc0e`
- Mission 1 — Database/Auth Foundation: MERGED / COMPLETE
- Mission 4 — Deterministic Scoring: MERGED / COMPLETE
- Mission 3 — AI Structuring: MERGED / COMPLETE via PR #8
- Mission 3G — PR #8 review gate: COMPLETE; 65/65 tests, typecheck, build, and security/RLS review passed
- Live-model >=90% fixture quality: UNVERIFIED; this is a default-enablement gate for live AI structuring, not a merge blocker for the deterministic/service plumbing
- Mission 2R — Idea Inbox restart: READY; no fresh `codex/idea-inbox-v2` branch existed at the last verification
- stale `codex/idea-inbox-v1`: do not reuse unless it is first proven to contain unique wanted implementation work

## Queue

| Priority | Mission | Preferred owner | State | Dependency |
|---|---|---|---|---|
| 0A | Mission 3G — PR #8 review gate | Claude | COMPLETE | none |
| 0B | Mission 2R — Idea Inbox restart | Codex | READY | none |
| 1 | Mission 5 — Usable vertical slice | Claude | BLOCKED | Mission 2R merged; Mission 3 is already merged |
| 2 | Mission 6 — Connections / semantic graph | Codex | BLOCKED | Mission 5 merged |
| 3 | Mission 7 — Portfolio prioritization / decision queue / Today | Claude | BLOCKED | Mission 6 merged |
| 4 | Mission 8 — Ask IdeaBin | Claude or Codex | BLOCKED | Mission 7 merged |
| 5 | Mission 9 — Idea-to-project execution | Codex | BLOCKED | Mission 7 merged |
| 6 | Mission 10 — Outcomes / calibration | Claude | BLOCKED | Mission 9 merged |
| 7 | Mission 11 — 100-idea V1 commissioning | Claude + Codex verification | BLOCKED | Missions 8 and 10 merged |

## Mission documents

- `docs/missions/MISSION_3G_STRUCTURING_REVIEW_GATE.md`
- `docs/missions/MISSION_2R_IDEA_INBOX_RESTART.md`
- `docs/missions/MISSION_5_VERTICAL_SLICE.md`
- `docs/missions/MISSION_6_CONNECTIONS.md`
- `docs/missions/MISSION_7_PRIORITIZATION.md`
- `docs/missions/MISSION_8_ASK_IDEABIN.md`
- `docs/missions/MISSION_9_EXECUTION.md`
- `docs/missions/MISSION_10_LEARNING.md`
- `docs/missions/MISSION_11_COMMISSIONING.md`

## Claim protocol

1. Fetch `origin/main` and inspect open PRs/branches before choosing work.
2. Resolve each listed dependency against actual merged `origin/main` state.
3. Choose the highest-priority READY mission compatible with the current agent. A BLOCKED row becomes READY automatically when all of its dependencies are actually merged.
4. Confirm no open PR already owns that mission/branch namespace.
5. Create the mission branch from current `origin/main` unless the mission file explicitly says otherwise.
6. Work only the owned scope.
7. Push, open/update one PR, and leave the mission handoff in the PR body.
8. Never begin a genuinely blocked mission merely to stay busy. If no task is READY, review/test the earliest dependency without changing unrelated production code.

## V1 exit definition

V1 is not complete until 100 real ideas can complete `capture -> structure -> connect -> prioritize`, related/duplicate suggestions are materially useful, ranking is explainable, a selected idea converts to a project, predictions can be compared with actual outcomes, and portfolio-level questions work without opening ideas individually.
