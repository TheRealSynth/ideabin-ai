# Mission 9 — Idea-to-Project Execution V1

## Preferred owner
Codex

## Dependency
Mission 7 merged. Mission 8 may run in parallel if file ownership is kept separate.

## Objective
Convert an accepted BUILD or VALIDATE decision into an executable project in one flow without turning IdeaBin into a general-purpose task manager.

## Required behavior

1. From Idea Detail or Decision Queue, promote an idea into a project.
2. Persist linked idea/evaluation/recommendation context.
3. Project includes validation hypothesis, target metrics, milestones or ordered tasks, status, and actuals entry points.
4. Generate the smallest credible first plan; avoid dozens of speculative tasks.
5. Preserve the original decision/evaluation snapshot even if the project plan changes.
6. Prevent duplicate project creation from accidental double-submit; support intentional multiple experiments only through an explicit action.
7. Projects screen lists active projects and links back to source ideas.
8. Project Detail supports task status changes and target metric editing with owner isolation.

## AI use
AI may draft milestones/tasks from stored idea context through the existing adapter/audit system. Validate outputs and allow user edits. Project creation must still work with a manual minimal plan if AI is unavailable.

## Acceptance
- selected idea converts to a project in one flow
- source idea/evaluation remains traceable
- no-AI fallback works
- duplicate-submit protection works
- cross-owner access fails closed
- mobile project detail is usable
- tests/typecheck/build pass
