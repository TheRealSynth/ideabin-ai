# AGENTS.md

These rules apply to every AI or human contributor.

## Mission
Build IdeaBin.ai as an idea-to-execution operating system, not a generic notes app. Preserve the full chain:
`idea -> structure -> prediction -> decision -> execution -> outcome -> learning`.

## Source of truth
1. GitHub `main` is canonical.
2. `docs/PRODUCT_SPEC.md` defines scope.
3. `docs/ARCHITECTURE.md` defines technical boundaries.
4. `docs/SCREEN_SPEC.md` defines V1 UX.
5. `docs/AI_HANDOFF.md` records active work and merge order.

## Required workflow
Before coding: read this file, `docs/AI_HANDOFF.md`, relevant specs, verify base SHA, then work on a dedicated branch.

Branch names: `chatgpt/<mission>-v1`, `claude/<mission>-v1`, `codex/<mission>-v1`, `gemini/<mission>-v1`.

## Conflict avoidance
Only one active mission may own migrations, shared schemas, auth, root package manifests, or scoring formulas. If another mission owns a high-conflict file, do not modify it.

## Engineering rules
- Prefer the smallest working implementation.
- Keep model providers behind adapters.
- Keep scoring deterministic where practical.
- Store AI outputs separately from user-authored facts.
- Store confidence, provenance, model, prompt version, and timestamp for AI-derived fields.
- Never overwrite original idea text or historical predictions.
- Costs/revenue estimates are estimates, not facts.
- Secrets never enter the repo.

## Definition of done
Acceptance criteria pass; tests/typecheck/build pass; docs updated; schema/security effects documented; preview verified for UI changes; handoff includes branch/base SHA/head SHA/files/tests/risks.

Do not merge automatically unless explicitly authorized.