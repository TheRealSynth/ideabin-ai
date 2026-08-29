# Multi-AI Workflow

## Objective
Allow ChatGPT, Claude, Codex, Gemini, and humans to work concurrently without corrupting shared state.

Every mission starts from a recorded base SHA, owns explicit files, produces a PR, passes CI, gets a preview for UI changes, and merges in declared order.

### Conflict classes
High conflict: migrations, root package manifests, shared schemas, auth, scoring formulas — one active owner only.
Medium: shared UI components, common clients, tokens — coordinate.
Low: isolated pages/tests/docs/adapters — safe in parallel.

### Recommended specialization
- ChatGPT/Codex: architecture, integration, focused implementation, tests.
- Claude Code: long autonomous missions, refactors, repair passes.
- Gemini: independent review and alternative designs.

Use measured results rather than permanent model roles.