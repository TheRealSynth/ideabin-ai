# IdeaBin.ai V1 Product Mission Roadmap

This file defines IdeaBin product sequencing and dependency intent. It is **not** an independent worker scheduler when Agent Mission Control is active.

Agents must also obey `AGENTS.md`, `CLAUDE.md` when applicable, `docs/AI_HANDOFF.md`, and the relevant mission specification.

## Execution authority

- IdeaBin repository: product requirements, architecture, mission specifications, tests, and implementation source of truth.
- `TheRealSynth/agent-mission-control`: portfolio priority, mission activation, worker assignment, leases, path/resource conflict prevention, and execution reconciliation.
- Agents must not self-select the next IdeaBin mission from this file when an Agent Mission Control mission exists for that work.
- Manual/direct execution from this roadmap requires an explicit owner assignment or a demonstrated Mission Control outage/blocker.
- GitHub `main` remains canonical for IdeaBin implementation state.

This boundary prevents IdeaBin from becoming a second Mission Control scheduler.

## Product dependency rule

Resolve current `origin/main` at mission start. Historical SHAs and stale status labels are evidence only. Product dependencies are satisfied by actual merged capability on `main`, but worker activation/ownership is controlled by Agent Mission Control.

## Current foundation

- Mission 1 — Database/Auth Foundation: MERGED / COMPLETE
- Mission 4 — Deterministic Scoring: MERGED / COMPLETE
- Mission 3 — AI Structuring: MERGED / COMPLETE via PR #8
- Mission 3G — PR #8 review gate: COMPLETE
- live-model >=90% fixture quality: UNVERIFIED; this remains a default-enablement gate for live AI structuring

## V1 product sequence and Mission Control mapping

| Product step | IdeaBin mission spec | Mission Control mission | Dependency |
|---|---|---|---|
| Inbox / idea detail prerequisite | `docs/missions/MISSION_2R_IDEA_INBOX_RESTART.md` | `IDEA-UI-001` | current scoring review/reconciliation completed |
| Mission 5 — usable vertical slice | `docs/missions/MISSION_5_VERTICAL_SLICE.md` | `IDEA-VSLICE-005` | `IDEA-UI-001` |
| Mission 6 — connections / semantic graph | `docs/missions/MISSION_6_CONNECTIONS.md` | `IDEA-CONNECT-006` | `IDEA-VSLICE-005` |
| Mission 7 — prioritization / Decision Queue / Today | `docs/missions/MISSION_7_PRIORITIZATION.md` | `IDEA-PRIORITY-007` | `IDEA-CONNECT-006` |
| Mission 8 — Ask IdeaBin | `docs/missions/MISSION_8_ASK_IDEABIN.md` | `IDEA-ASK-008` | `IDEA-PRIORITY-007` |
| Mission 9 — Promote to Execution | `docs/missions/MISSION_9_EXECUTION.md` | `IDEA-PROMOTE-001` | `IDEA-PRIORITY-007` |
| Mission 10 — outcomes / calibration | `docs/missions/MISSION_10_LEARNING.md` | `IDEA-OUTCOME-010` | `IDEA-PROMOTE-001` |
| Mission 11 — 100-idea V1 commissioning | `docs/missions/MISSION_11_COMMISSIONING.md` | `IDEA-COMMISSION-011` | `IDEA-ASK-008` + `IDEA-OUTCOME-010` |

Mission 8 and Mission 9 may proceed independently after Mission 7 when Mission Control confirms path/resource compatibility. The project-level `max_active_workers` policy may still serialize them.

## Mission 9 architecture change

Mission 9 no longer turns IdeaBin into a project/task execution manager.

IdeaBin owns:

`idea -> evaluation -> recommendation -> explicit decision -> hypothesis -> success/failure criteria -> promotion`

Agent Mission Control owns:

`promotion -> execution project -> portfolio priority -> benchmark -> missions -> workers -> PR/deploy state -> actual outcomes`

Canonical handoff contract:

- `docs/PROMOTION_CONTRACT_V1.md`
- `docs/schemas/promotion-contract-v1.schema.json`

## Agent startup rule

When assigned an IdeaBin mission by Agent Mission Control:

1. fetch current `origin/main`;
2. read the Mission Control mission ID and pinned scope;
3. read the matching IdeaBin product mission specification;
4. inspect open PRs/branches for conflicting or already-completed work;
5. obey the Mission Control-owned path/resource reservation;
6. implement only the product scope;
7. run the mission's required tests/typecheck/build;
8. push one deterministic mission branch/PR;
9. write the required machine-readable result/receipt for Mission Control reconciliation;
10. do not choose the next mission locally after completion.

## V1 exit definition

V1 is not complete until 100 real ideas can complete the product flow, related/duplicate suggestions are materially useful, ranking is explainable, selected BUILD/VALIDATE decisions can promote into Mission Control execution, predictions can be compared with actual outcomes, and portfolio-level questions work without opening ideas individually.

## Architectural invariant

IdeaBin may recommend what deserves resources. It may not independently allocate Claude/Codex seats, manage worker leases, reserve repository paths, choose portfolio execution priority, or reconcile PR execution while Agent Mission Control is the active control plane.
