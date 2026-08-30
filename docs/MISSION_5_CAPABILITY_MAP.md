# IdeaBin.ai — Capability Map After Mission 5

## Definition of the milestone

Mission 5 is the point where IdeaBin becomes a usable single-idea decision product rather than a collection of foundations.

Target vertical slice:

`capture -> structure -> explicit/confirmed evaluation inputs -> deterministic score -> recommendation -> inspect`

## What a user will be able to do

### 1. Capture an idea quickly

- authenticate and open the Inbox;
- enter raw idea text without an analysis wizard;
- optionally attach source label and source URL metadata;
- save the raw text exactly as entered;
- preserve the idea even when AI is unavailable;
- avoid duplicate rows from one submission action;
- use the capture flow on mobile and desktop.

### 2. Preserve the original source permanently

- `ideas.raw_input` remains immutable;
- source metadata is stored separately;
- later AI processing does not overwrite the original text;
- retries never replace the original input.

### 3. Structure a saved idea

- `Save + Structure` saves raw first, then invokes the provider-neutral structuring service;
- AI converts raw input into normalized title/summary/problem/solution/target user/revenue model/distribution/tags/assumptions/open questions;
- malformed output is schema-rejected;
- one bounded repair attempt is allowed;
- provider failure leaves the raw idea intact and retryable;
- successful and failed AI runs are auditable with provider/model/prompt/input-version metadata.

### 4. Evaluate an idea against the eight canonical dimensions

The user can provide or confirm explicit 0–100 inputs for:

1. revenue potential;
2. speed to validation;
3. capital efficiency;
4. execution feasibility;
5. existing asset leverage;
6. distribution advantage;
7. market timing;
8. strategic reuse.

Mission 5 must not invent missing values or silently treat absent evidence as zero.

AI-generated suggestions may later prefill these fields if provenance and confidence are visible, but the guaranteed V1 path is explicit user confirmation.

### 5. Generate a deterministic opportunity score

- validated dimension values are passed to the canonical `opportunityScore()` function;
- the weighted formula is not duplicated in UI code;
- the stored evaluation snapshot contains the exact dimension values used;
- the same stored inputs reproduce the same opportunity score;
- scoring weights remain versioned and unchanged unless a later dedicated mission changes them.

### 6. Get a deterministic recommendation

The system can produce one of:

- BUILD
- VALIDATE
- RESEARCH
- INCUBATE
- ARCHIVE
- KILL

using the canonical `recommendationFor()` gates.

The recommendation remains separate from:

- opportunity score;
- confidence;
- user acceptance/override.

Mission 5 does not automatically turn the recommendation into the user's final decision.

### 7. Inspect the idea in a library/detail experience

Minimum usable Idea Library:

- newly captured ideas;
- current processing status;
- score/confidence/recommendation where available;
- updated time and basic filtering/sorting as needed for the first slice.

Minimum Idea Detail:

- exact user-authored raw input;
- AI-derived normalized fields;
- assumptions/open questions;
- structuring state;
- eight evaluation inputs;
- scoring-input provenance;
- opportunity score;
- confidence;
- deterministic recommendation;
- idea version history;
- evaluation history;
- AI run/audit state.

The UI must visually distinguish user-authored facts, AI-derived content, and deterministic outputs.

### 8. Retry safely

- retry structuring after provider/validation failure;
- preserve old AI audit/version history;
- re-evaluate with new inputs;
- create a new immutable evaluation rather than editing the previous evaluation;
- never mutate raw input.

### 9. Maintain owner isolation and secret safety

- authenticated owner-scoped RLS remains the security boundary;
- cross-owner idea reads/writes are denied;
- no service-role bypass is introduced into user-facing flows;
- provider API keys remain server-only;
- no provider credential appears in client components or `NEXT_PUBLIC_*` variables.

## What Mission 5 does NOT yet provide

Mission 5 is a usable vertical slice, not the full IdeaBin operating system.

Still deferred:

### Connections / semantic graph — Mission 6

- embeddings across the idea portfolio;
- duplicate/near-duplicate detection;
- related ideas;
- merge candidates;
- shared capabilities;
- typed idea relationships.

### Portfolio prioritization / Today / Decision Queue — Mission 7

- ranking all ideas against one another;
- explaining why #1 outranks #2;
- decision queue;
- user acceptance/override of BUILD/VALIDATE/etc.;
- highest-leverage next actions;
- portfolio-level shared-asset prioritization.

### Ask IdeaBin — Mission 8

- natural-language questions over the authorized portfolio;
- "What should I work on next?";
- "What can I validate under $1,000?";
- "Which ideas should be merged?";
- "What should I stop?".

### Idea -> project execution — Mission 9

- promote an accepted idea into a project;
- validation hypothesis;
- milestones;
- tasks;
- target metrics;
- execution tracking.

### Outcomes / calibration — Mission 10

- actual cost/time/revenue/demand;
- prediction-vs-actual comparisons;
- lessons learned;
- calibration analytics;
- scoring-quality feedback.

### 100-real-idea commissioning — Mission 11

- full portfolio commissioning;
- measured capture/structure/connect/prioritize quality;
- usability and reliability evidence at realistic volume.

### Fully autonomous scoring-input generation

Mission 5 should support a safe manual/confirmed path. Evidence-first automated scoring-input suggestions are defined separately in `docs/SCORING_INPUT_AUTOMATION.md` and should not silently auto-accept until calibrated.

## Practical product classification after Mission 5

### Before Mission 5

IdeaBin is infrastructure plus disconnected services.

### After Mission 5

IdeaBin is a usable authenticated **idea capture + analysis + scoring application for individual ideas**.

A user can enter an idea, preserve it, structure it, evaluate it, receive a reproducible score/recommendation, and inspect its history in one coherent workflow.

### After Missions 6–7

IdeaBin becomes a true **portfolio prioritization system** capable of deciding which idea deserves attention next and identifying reusable leverage across ideas.

### After Missions 8–10

IdeaBin becomes the intended **idea operating system**: portfolio Q&A, execution conversion, outcome tracking, and calibration.

## Mission 5 release test

The milestone is real only if an authenticated user can complete this sequence without developer intervention:

1. open Inbox;
2. save exact raw idea;
3. optionally structure it;
4. recover cleanly if AI fails;
5. inspect the structured idea;
6. supply/confirm all eight evaluation inputs;
7. create an immutable evaluation;
8. see reproducible score + separate confidence + recommendation;
9. re-evaluate without overwriting history;
10. find the idea again in the library/detail surfaces.

If that flow works on both mobile and desktop with tests/typecheck/build green, Mission 5 has delivered the first usable IdeaBin product slice.
