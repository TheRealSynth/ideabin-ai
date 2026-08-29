# Scoring Model V1

Each dimension is 0-100.

| Dimension | Weight |
|---|---:|
| Revenue potential | 15% |
| Speed to validation | 15% |
| Capital efficiency | 10% |
| Execution feasibility | 10% |
| Existing asset leverage | 15% |
| Distribution advantage | 15% |
| Market timing | 10% |
| Strategic reuse | 10% |

Opportunity score and confidence are separate.

Initial recommendation gates:
- BUILD: score >=80 and confidence >=65
- VALIDATE: score >=65, or confidence <65 with a cheap test
- RESEARCH: information gap is primary blocker
- INCUBATE: strong potential but timing/dependency blocks execution
- ARCHIVE: weak current fit but preserve
- KILL: structurally weak or clearly dominated

Calibrate against actual outcomes; do not implement reinforcement learning in V1.