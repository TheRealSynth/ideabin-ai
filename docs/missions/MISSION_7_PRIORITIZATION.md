# Mission 7 — Portfolio Prioritization, Decision Queue, and Today

## Preferred owner
Claude Code

## Dependency
Mission 6 merged.

## Objective
Answer IdeaBin's primary question: `What should I work on next, why, what will it require, and what is the cheapest credible validation test?`

## Required surfaces

### Portfolio
- ranked table/cards
- opportunity score and confidence shown separately
- filters for score, confidence, capital, time, status, tags, revenue model, strategic asset/leverage where data exists
- saved views where practical: Highest ROI, Fastest tests, Under $1k, Existing leverage, Needs research
- clear explanation of why #1 outranks #2

### Decision Queue
One idea at a time with recommendation, confidence, strongest reasons, biggest uncertainty, cheapest reversible test, and explicit user decision: BUILD / VALIDATE / RESEARCH / INCUBATE / ARCHIVE / KILL. Record override reason when the user rejects the recommendation.

### Home / Today
- top 3 recommended actions
- decision queue count
- recently captured ideas
- high-value shared capability opportunities
- changed signals only when signal data exists; do not fake empty external research

## Ranking rules
- Reuse canonical deterministic evaluation data.
- Do not hide confidence inside one unexplained composite number.
- Any confidence-adjusted or leverage-adjusted ranking must have a named/versioned formula and an explanation.
- Do not overwrite historical evaluations when ranking logic changes.
- Cheapest validation tests must be concrete, reversible, and proportionate. AI may draft them through a validated adapter path, but the score itself stays deterministic.

## Acceptance
- same inputs produce same baseline ordering
- user can explain #1 vs #2 from displayed factors
- decision writes are auditable and preserve recommendation history
- override reason persists
- under-$1k / fastest-test queries work when relevant fields exist
- mobile Today and Decision Queue are usable without horizontal scrolling
- tests/typecheck/build pass
