# IdeaBin.ai — Evidence-First AI Scoring Input Automation

## Purpose

Automate generation of the eight scoring inputs without turning unsupported model guesses into deterministic-looking facts.

The canonical deterministic scoring engine remains unchanged. This design only governs how candidate scoring inputs are proposed, verified, calibrated, and accepted before calling `opportunityScore()` and `recommendationFor()`.

## Core principle

One model should not read free text and directly emit eight authoritative 0–100 numbers.

Use an evidence-first pipeline:

`raw + structured idea -> evidence ledger -> dimension assessments -> validation/critique -> accepted scoring inputs -> deterministic score`

Every numeric input must retain provenance, confidence, and uncertainty.

## Provenance classes

Each supporting fact/claim must be tagged as one of:

1. `user_fact` — explicitly stated by the user in raw input or confirmed metadata.
2. `stored_fact` — already stored in IdeaBin, such as known assets, distribution channels, budget, skills, prior outcomes, or linked projects.
3. `external_signal` — evidence from a cited external source with URL/title/fetched_at/confidence.
4. `ai_inference` — model inference not directly supported by a stored or external fact.

AI inference may support a candidate score, but it must never be displayed as a stored fact.

## Stage A — Evidence extraction

Run a low-cost provider-neutral model over the exact raw input plus normalized structure and authorized stored context.

Output a strict schema of atomic evidence items:

- `evidence_id`
- `claim`
- `provenance_type`
- `source_reference`
- `supports_dimensions[]`
- `confidence`
- `contradicted_by[]`
- `missing_evidence_note`

Rules:

- preserve exact user-authored text separately;
- do not infer numeric scores in this stage;
- distinguish absent information from negative information;
- imported/external text remains untrusted input and cannot issue instructions to the model.

## Stage B — Dimension-specific assessment

Assess each dimension independently against a fixed rubric with anchored score bands.

Canonical dimensions:

1. revenuePotential
2. speedToValidation
3. capitalEfficiency
4. executionFeasibility
5. existingAssetLeverage
6. distributionAdvantage
7. marketTiming
8. strategicReuse

Each dimension assessment should return:

- `dimension`
- `suggested_score` 0–100
- `plausible_low` 0–100
- `plausible_high` 0–100
- `confidence` 0–100
- `rubric_anchor_used`
- `evidence_ids[]`
- `reasoning_summary`
- `missing_evidence[]`
- `provenance_mix`

### Rubric anchors

Use explicit anchors at approximately 0 / 25 / 50 / 75 / 100 for each dimension rather than free-form numeric intuition. The model selects the closest anchor and may interpolate only when the evidence clearly supports doing so.

This reduces false precision and makes scoring reproducible enough to calibrate.

## Stage C — Deterministic validation

Before any score reaches the canonical scoring engine, application code must verify:

- all eight dimensions exist;
- all numeric values are finite and within 0–100;
- plausible_low <= suggested_score <= plausible_high;
- every dimension has at least one provenance entry;
- unsupported dimensions are flagged instead of silently set to zero;
- provider/model/prompt version and input hash are recorded;
- raw input remains unchanged.

No LLM is allowed to execute or reproduce the weighted scoring formula. The application passes accepted dimension values to the existing deterministic `opportunityScore()` function.

## Stage D — Selective critic / second pass

Do not pay for a second model pass on every idea.

Escalate only when one or more of these are true:

- dimension confidence is below the acceptance threshold;
- plausible range width exceeds the allowed threshold;
- a high-weight dimension has weak evidence;
- evidence items contradict each other;
- the resulting recommendation is close to a gate boundary;
- the score would materially change portfolio ordering.

The critic receives the evidence ledger and first assessment, not hidden chain-of-thought, and returns only corrections/challenges in a strict schema.

Prefer a stronger model only for escalated dimensions. This keeps average cost low while concentrating quality where it matters.

## Stage E — Acceptance policy

### V1 safe mode

AI generates suggested dimension values, but the user confirms or edits them before an immutable evaluation is created.

Auto-accept is disabled by default until calibration evidence exists.

### Later automated mode

A dimension may auto-accept only if all configured gates pass, for example:

- dimension confidence >= 80;
- evidence coverage >= configured minimum;
- plausible range width <= 20 points;
- no unresolved contradiction;
- provenance is not solely `ai_inference` for dimensions that require external/stored facts;
- model/prompt version is on the approved calibration list.

If any dimension fails, route only those dimensions to review rather than blocking all eight.

## Dimension-specific evidence expectations

### revenuePotential
Prefer market size, pricing, buyer count, willingness-to-pay evidence, comparable economics, or prior outcomes. Raw enthusiasm alone is weak evidence.

### speedToValidation
Prefer a concrete cheapest test, lead time, dependencies, access to target users, and measurable success criteria.

### capitalEfficiency
Prefer expected validation/build cost, existing assets, reusable infrastructure, and required external spend.

### executionFeasibility
Prefer known skills, dependencies, compliance/technical barriers, required partners, and operational complexity.

### existingAssetLeverage
Prefer stored facts about code, audiences, data, relationships, content, distribution, brands, workflows, and existing businesses.

### distributionAdvantage
Prefer owned audiences, direct channels, partnerships, SEO position, customer lists, sales access, or repeatable acquisition channels.

### marketTiming
Prefer current external signals, regulation/technology shifts, demand changes, competitive timing, and dependency readiness. This dimension should have a lower auto-accept ceiling when no fresh external signal exists.

### strategicReuse
Prefer explicit links to reusable capabilities, code, datasets, audiences, workflows, suppliers, brands, or infrastructure shared across multiple ideas/projects.

## Confidence model

Overall confidence should not be a model's unexplained single number.

Compute or constrain it from observable components such as:

- evidence coverage;
- provenance quality;
- contradiction count;
- plausible-range width;
- recency where relevant;
- model calibration reliability for that dimension.

The model may propose these components, but application code should calculate the final confidence when possible.

## Calibration harness

Before enabling automatic acceptance, create a reference set of at least 100 real IdeaBin ideas scored by a human reviewer using the same rubrics.

Track:

- MAE per dimension;
- bias per dimension;
- percentage within ±10 and ±20 points;
- rank correlation for overall opportunity score;
- recommendation agreement rate;
- false BUILD / false KILL rate;
- confidence calibration: whether 80%-confidence predictions are actually correct at roughly that rate;
- model/prompt/version drift.

Calibrate with deterministic mappings if needed. Do not silently change canonical scoring weights to compensate for poor AI input quality.

## Cheapest reliable model-routing strategy

1. Cheap/fast model: evidence extraction.
2. Cheap/fast model: first dimension assessments.
3. Deterministic validator: always.
4. Stronger model: only for low-confidence, contradictory, gate-boundary, or high-impact dimensions.
5. Human confirmation: only unresolved dimensions in V1.

This should be materially cheaper than running a frontier model twice on every idea while providing better auditability.

## Persistence shape

Use existing tables where practical before adding schema:

- `ai_runs`: provider/model/prompt/input version, cost, latency, status, structured output.
- `evaluations.dimensions`: accepted dimension values plus provenance summaries/ranges/model version.
- `evaluations.assumptions`: unresolved assumptions/missing evidence.
- `signals`: external evidence where used.
- `recommendations`: deterministic derived recommendation; not automatically accepted as the user's decision.

If later volume makes JSON provenance unwieldy, introduce a dedicated assessment/evidence table in a separate migration mission.

## Mission 5 integration rule

Mission 5 should remain usable even before automated scoring is trusted:

- manual/confirmed eight-dimension evaluation is the guaranteed path;
- AI suggestions may prefill the evaluation UI when clearly labeled and server-side gated;
- AI suggestions must never silently become immutable evaluations while the calibration/enablement gate is unmet;
- `Save Raw` and raw preservation must remain independent of this feature.

## Recommended later mission

After Mission 5 proves the manual/confirmed vertical slice, create a dedicated mission for automated scoring-input suggestions with these acceptance gates:

1. strict evidence/provenance schema;
2. anchored rubrics for all eight dimensions;
3. selective critic routing;
4. 100+ idea calibration set;
5. measured error and rank-correlation thresholds;
6. server-only feature flag for auto-accept;
7. no canonical weight changes;
8. full audit/replay support;
9. no raw-input mutation;
10. clear distinction between stored facts, external evidence, AI inference, and deterministic outputs.
