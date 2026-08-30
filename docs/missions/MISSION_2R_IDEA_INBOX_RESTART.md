# Mission 2R — Idea Inbox V1 Restart

## Preferred owner
Codex

## Branch
Use a fresh branch: `codex/idea-inbox-v2` from current `origin/main`. Do not continue the stale `codex/idea-inbox-v1` branch unless a comparison proves it contains unique useful implementation work.

## Objective
Create the fastest reliable authenticated idea-capture path. The user must be able to preserve raw text in under 15 seconds with no AI dependency and without losing a draft on failure.

## Scope ownership
- `apps/web/app/inbox/**`
- capture-specific components
- idea creation server action/API
- draft/double-submit protection
- focused capture tests

## Forbidden without separate authorization
- Supabase migrations
- auth/proxy changes
- deterministic scoring formula
- AI provider/router internals
- weakening RLS or historical immutability

## Required behavior

1. Authenticated user can create a text idea.
2. `raw_input` round-trips exactly as entered; do not trim or rewrite stored raw text except rejecting an actually empty submission according to a separately computed validation value.
3. Optional source label and source URL stay in metadata, not appended into raw input.
4. `Save Raw` works with no AI key configured.
5. Failed save never clears the local draft.
6. Double-submit protection prevents duplicate rows from one user action.
7. Mobile capture is primary; desktop remains functional.
8. Keep first save lightweight—no mandatory analysis wizard.
9. `Save + Structure` may expose the UI action, but Mission 5 owns final wiring to Mission 3's structuring service after both branches merge. If the service is already on current main by implementation time, use its public contract without editing its internals.
10. Explicitly owner-scope reads/writes where appropriate in addition to RLS.

## Minimum UI
- raw idea text area
- optional source label
- optional source URL
- Save Raw
- Save + Structure
- clear success/error state
- preserve draft after error

File upload and remote URL extraction are not prerequisites for this mission; they may be added later only if they do not delay the under-15-second text path.

## Acceptance
- manual mobile-flow capture under 15 seconds
- exact raw string persistence test
- empty/invalid submission preserves draft
- Save Raw works without provider credentials
- unauthorized route behavior remains correct
- duplicate-submit regression test
- tests/typecheck/build pass
- no migration/auth/scoring/AI-internal files changed

## Handoff
Return branch/base/head, changed files, exact tests/results, manual mobile timing, database assumptions, preview status, risks, and merge safety.
