# Mission 3G — AI Structuring PR #8 Review Gate

## Preferred owner
Claude Code reviewer. A different agent may review if Claude is unavailable.

## Target
PR #8, `claude/ai-structuring-v1-mq9y75`, current verified head `eb6f6e18be7fbe34642d9cbcb39350e066cee283`.

## Objective
Decide whether PR #8 is safe to merge into current `main`. This is a review/integration gate, not a redesign mission.

## Required checks

1. Fetch current `origin/main`, PR #8 metadata, changed files, and CI status.
2. Confirm the PR remains mergeable and CI is green at the reviewed head.
3. Review for RLS bypass, service-role use, client secret leakage, mutation of `ideas.raw_input`, unbounded retries, silent malformed-output persistence, or scoring/auth/migration scope creep.
4. Run package/web tests, typecheck, and production build locally when the environment permits.
5. Confirm the structuring service can be called later by Mission 5 without requiring a UI rewrite.
6. Record the unresolved live-model fixture caveat precisely.

## Live-model policy

Lack of provider credentials does not invalidate deterministic plumbing tests. It does mean the product acceptance target of >=90% schema-valid output on 100 live-model fixtures remains unverified. Treat that as a launch/default-enable gate unless a genuine correctness defect appears.

If credentials are available, run the documented 100-fixture live command and record model, provider, success rate, repairs, failures, approximate cost, and latency. Never commit credentials.

## Allowed changes
Only minimal correctness/security/integration fixes required to make PR #8 merge-safe. No feature expansion.

## Merge rule
Do not merge unless the owner has explicitly authorized merging. If authorization is absent, finish with `MERGE RECOMMENDED` or `MERGE NOT RECOMMENDED` plus exact blockers.

## Done
- reviewed exact PR head identified
- CI/test/build evidence recorded
- security and immutability checks complete
- live-model caveat classified as blocking or non-blocking for merge and separately for default enablement
- merge recommendation returned
