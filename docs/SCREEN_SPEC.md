# V1 Screen Specification

## Product shell
Desktop: left rail + top command/search bar + content workspace. Mobile: bottom nav for Inbox, Ideas, Portfolio, Ask; overflow for Connections/Projects/Settings.

Global quick action: **Capture idea**. Global command/search accepts natural language and exact filtering.

## 1. Home / Today
Primary question: **What should I work on next?**

Sections:
- Top 3 recommended actions with score, confidence, why-now, cheapest test.
- Decision queue count.
- Recently captured ideas.
- Portfolio leverage opportunities: shared capabilities worth building once.
- Changed signals since last review.

## 2. Inbox
Fast capture first, analysis second.
Fields/actions:
- large raw text input
- paste URL
- upload file
- source label
- Save raw
- Save + Structure

Raw input must never be lost or silently rewritten.

## 3. Idea Library
Default table on desktop, cards on mobile.
Columns: title, status, opportunity score, confidence, validation cost, time to validation, updated.
Filters: score, confidence, capital, time, status, tags, revenue model, strategic asset.
Saved views: Highest ROI, Fastest tests, Under $1k, Existing leverage, Needs research.

## 4. Idea Detail
Header: title, status, score/confidence, recommendation, primary CTA.
Tabs:
- Thesis: raw idea, normalized summary, problem, user, solution, business model, distribution.
- Evidence: assumptions, signals, sources, contradictions.
- Feasibility: cost/time/skills/dependencies/risks.
- Connections: related ideas, reusable assets, merge candidates.
- History: immutable versions/evaluations/decisions.

Primary actions: Validate, Build, Research, Incubate, Archive, Kill.

## 5. Portfolio
Ranked portfolio table plus 2x2 optional visualization.
Sort by opportunity, confidence-adjusted score, speed, capital efficiency, asset leverage, distribution advantage, strategic reuse.
Top panel must explain why current #1 outranks #2.

## 6. Decision Queue
One idea at a time. Show recommendation, confidence, three strongest reasons, biggest uncertainty, cheapest reversible test. User chooses BUILD/VALIDATE/RESEARCH/INCUBATE/ARCHIVE/KILL and may record override reason.

## 7. Connections
Three views:
- Related ideas
- Merge candidates
- Shared capabilities

High-value card: capability name, dependent ideas, estimated portfolio uplift, build-once rationale.

## 8. Ask IdeaBin
Chat over authorized portfolio data. Responses should link to idea records and distinguish stored facts from estimates/inferences.
Starter queries: under-$1k tests; strongest reused assets; what to stop; ideas worth merging; ideas whose timing improved.

## 9. Projects
Ideas promoted to execution. Project detail contains validation hypothesis, milestones, tasks, target metrics, actuals, linked idea/evaluation.

## 10. Outcome Review
Compare predicted vs actual cost, time, demand, revenue, result. Original prediction is immutable. Capture lessons and propose scoring calibration without automatically changing weights.

## UX constraints
- Mobile-first capture under 15 seconds.
- Never hide confidence behind one composite score.
- Every recommendation has rationale and next cheapest test.
- AI never silently mutates user-authored source text.
- Avoid decorative dashboards that do not change decisions.