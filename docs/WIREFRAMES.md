# IdeaBin.ai V1 Wireframes

These are functional wireframes, not visual-brand comps. The goal is to lock information hierarchy before styling.

## Desktop shell

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ IdeaBin.ai   [ Search ideas or ask IdeaBin…                         ]  [+]  │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Today        │                                                               │
│ Inbox    12  │                     WORKSPACE                                 │
│ Ideas        │                                                               │
│ Portfolio    │                                                               │
│ Decisions  7 │                                                               │
│ Connections  │                                                               │
│ Projects     │                                                               │
│ Ask IdeaBin  │                                                               │
│──────────────│                                                               │
│ Settings     │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

## Today / executive dashboard

```text
WHAT SHOULD I WORK ON NEXT?

┌─────────────────────────────────────┐  ┌───────────────────────────────────┐
│ #1 Funeral Planning Lead Platform   │  │ Decision queue                    │
│ Opportunity                91/100   │  │ 7 ideas need a decision           │
│ Confidence                  83/100   │  │ [Review queue →]                  │
│                                     │  └───────────────────────────────────┘
│ Why now                            │
│ • existing distribution            │  ┌───────────────────────────────────┐
│ • low incremental build cost       │  │ Portfolio leverage                │
│ • validated adjacent demand        │  │ Identity Resolution Engine        │
│                                     │  │ strengthens 5 ideas                │
│ Cheapest test: $250 / 100 visits   │  │ leverage score 96                  │
│ [Validate] [Build] [Open idea]      │  └───────────────────────────────────┘
└─────────────────────────────────────┘

NEXT BEST
┌────────────────────┐ ┌────────────────────┐
│ #2 Idea            │ │ #3 Idea            │
│ Score / confidence │ │ Score / confidence │
│ cheapest next test │ │ cheapest next test │
└────────────────────┘ └────────────────────┘

RECENT IDEAS                         CHANGED SIGNALS
…                                    …
```

## Inbox

```text
INBOX                                      [Import ▾]

┌─────────────────────────────────────────────────────────────────────┐
│ What is the idea?                                                   │
│                                                                     │
│                                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Source [Conversation ▾]   URL [optional]   [Attach file]            │
│                                                                     │
│ [Save raw]                              [Save + structure →]         │
└─────────────────────────────────────────────────────────────────────┘

Recent captures
○ raw       Idea title                                     2 min ago
○ structured Idea title                                  18 min ago
```

Design rule: entering an idea never requires choosing tags, categories, scores, or a business model first.

## Idea library

```text
IDEAS  347                                     [+ Capture]

[Search…] [Status ▾] [Score ▾] [Capital ▾] [Time ▾] [More filters]
Saved: [Highest ROI] [Under $1k] [Fastest tests] [Existing leverage]

┌───────────────────────────────────────────────────────────────────────────┐
│ Idea                     Status     Score Conf.  Test cost  Validate in   │
├───────────────────────────────────────────────────────────────────────────┤
│ Funeral Planning…        VALIDATE     91   83      $250       7 days     │
│ Identity Resolution…     BUILD        89   79    $1,200      14 days     │
│ Local Authority Sites    RESEARCH     82   58      $400      10 days     │
└───────────────────────────────────────────────────────────────────────────┘
```

## Idea detail

```text
← Ideas

Funeral Planning Lead Platform                     VALIDATE
Opportunity 91     Confidence 83        [Validate] [Build ▾]

[Thesis] [Evidence] [Feasibility] [Connections] [History]

┌─────────────────────────────────────┐ ┌──────────────────────────────────┐
│ Normalized thesis                   │ │ Recommendation                   │
│ Problem                             │ │ VALIDATE                         │
│ Target user                         │ │                                  │
│ Solution                            │ │ Biggest uncertainty              │
│ Revenue model                       │ │ conversion intent                │
│ Distribution                        │ │                                  │
│                                     │ │ Cheapest credible test           │
│ Original idea                       │ │ $250 / 100 qualified visits      │
│ [view unmodified source]            │ │ [Create validation project]      │
└─────────────────────────────────────┘ └──────────────────────────────────┘
```

## Portfolio

```text
PORTFOLIO

Best overall: Idea A             Best fast test: Idea B
Lowest capital: Idea C           Highest leverage: Capability X

Rank  Idea                 Score Conf. Adj.*  Cost      Time     Recommendation
1     Idea A                 91   83    86    $1.2k     14d      BUILD
2     Idea B                 89   92    87      $250      7d      VALIDATE
3     Idea C                 88   54    72      $400     10d      RESEARCH

*Confidence-adjusted rank is a view, not a replacement for raw opportunity score.

WHY #1 BEATS #2
Idea A has materially greater distribution advantage and shared-asset leverage;
Idea B is cheaper and faster but has lower total upside.
```

## Decision queue

```text
DECISION 3 OF 7

Idea title
Opportunity 86                  Confidence 61

Strongest reasons
1. …
2. …
3. …

Biggest uncertainty
…

Cheapest reversible test
$___ / ___ days / success threshold ___

[BUILD] [VALIDATE] [RESEARCH] [INCUBATE] [ARCHIVE] [KILL]

Override reason appears only when the user chooses against a high-confidence recommendation.
```

## Connections / portfolio leverage

```text
CONNECTIONS
[Related ideas] [Merge candidates] [Shared capabilities]

Identity Resolution Engine                                  96 LEVERAGE
Build once; strengthens five active opportunities.

Idea A   +22 estimated leverage
Idea B   +17
Idea C   +34
Idea D   +11
Idea E    +8

[Open capability] [Create shared project]
```

## Ask IdeaBin

```text
ASK IDEABIN

You: Which ideas can I validate for under $1,000 using assets I already have?

IdeaBin:
1. Idea A — $250 — confidence 83 — reuses nonprofit distribution
2. Idea B — $600 — confidence 76 — reuses enrichment pipeline
3. Idea C — $900 — confidence 69 — reuses existing site templates

Stored facts are labeled separately from estimates/inferences.
[Open comparison →]
```

## Mobile capture

```text
┌──────────────────────────────┐
│ IdeaBin                [+]   │
│                              │
│ Capture idea                 │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │ raw thought…             │ │
│ │                          │ │
│ └──────────────────────────┘ │
│ [Save raw] [Structure →]     │
│                              │
│ Today                        │
│ #1 recommended action        │
│ score 91 | confidence 83     │
│ [Open]                       │
│                              │
├──────────────────────────────┤
│ Inbox  Ideas  Portfolio Ask  │
└──────────────────────────────┘
```

## Interaction priorities
1. Capture must be fastest.
2. Decision context must be second.
3. Detailed analysis is progressive disclosure.
4. Score and confidence are always visually separate.
5. Every important recommendation ends in a concrete next action.
