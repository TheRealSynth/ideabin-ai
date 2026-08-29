# CLAUDE.md

Claude Code operates under `AGENTS.md` plus these rules.

Before each mission run or determine `git status`, `git rev-parse HEAD`, and `git branch --show-current`. Read `AGENTS.md`, `docs/AI_HANDOFF.md`, and the relevant spec before modifying files.

Use `claude/<mission>-v1`. Never reuse another AI's active branch.

If adjacent defects are found, fix only blockers/correctness/security problems; otherwise record them for follow-up.

Never modify a merged migration. Any new migration must document forward effect, rollback strategy, RLS impact, backfill need, and compatibility.

AI outputs must be schema-validated. Preserve uncertainty instead of manufacturing precision.

Completion report must include: mission, branch, base SHA, head SHA, changed files, features, tests, deployment/preview status, schema changes, risks, next mission, and whether merge is safe. Do not merge unless explicitly authorized.