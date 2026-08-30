# AI Structuring V1 (Mission 3)

Converts a preserved raw idea into a schema-valid normalized concept while
preserving provenance, uncertainty, and full audit history. `ideas.raw_input`
is never read into any write payload produced by this subsystem.

## Architecture

```
raw_input (immutable)
  -> buildStructuringPrompt()            packages/ai-structuring/src/prompt.ts
  -> StructuringProvider.call()          packages/ai-structuring/src/providers/*
  -> safeJsonParse() + validateStructuredIdea()   src/json.ts, src/schema.ts
  -> (invalid) one bounded repair call -> validate again -> fail cleanly
  -> buildIdeaUpdatePayload() / buildAiRunLogRow()  src/mapping.ts, src/ai-run-log.ts
  -> apps/web/lib/ai/structure-idea.ts (Supabase persistence, RLS-scoped)
```

`packages/ai-structuring` is a plain TypeScript workspace package with **no
Next.js or Supabase dependency** — the structuring domain (prompt, schema,
provider contract, pipeline, mapping) is fully provider-neutral and
independently testable. `apps/web/lib/ai/structure-idea.ts` is the only file
that touches Supabase; it fetches/writes through the caller's own
RLS-scoped session client, never a service-role client.

The package ships TypeScript source directly (`package.json` `main`/`types`/
`exports` point at `./src`, not a `dist` build) so that CI's fixed step
order — `pnpm typecheck` → `pnpm test` → `pnpm build` — never races a
compile step. `apps/web/next.config.ts` adds it to `transpilePackages` so
Next's own build pipeline compiles it; `apps/web/vitest.config.ts` inlines it
so Vitest does too. The package's own `build` script is `tsc --noEmit`
(there is no separate emitted artifact — the real build output is the Next
app that imports it).

## Provider adapters

`packages/ai-structuring/src/providers/`:

- `types.ts` — `StructuringProvider` interface (`isConfigured()`, `call()`),
  `ProviderCallError` with a closed set of `ProviderErrorKind`s
  (`missing_credentials`, `timeout`, `network_error`, `provider_error`,
  `malformed_payload`, `refusal`).
- `openai-compatible.ts` — shared transport for any OpenAI-chat-completions-
  compatible endpoint (fetch-based, no vendor SDK dependency). Handles
  timeout via `AbortController`, JSON parsing, token usage extraction, and
  refusal detection (`finish_reason === "content_filter"`).
- `openai.ts` — `OpenAiProvider`, reads `OPENAI_API_KEY`.
- `openrouter.ts` — `OpenRouterProvider`, reads `OPENROUTER_API_KEY`, same
  wire format via OpenRouter's OpenAI-compatible endpoint.
- `testing.ts` — `ScriptedProvider` (deterministic, scripted responses, for
  unit tests) and `DeterministicHeuristicProvider` (offline stand-in used by
  the fixture harness when no live credentials exist — see below). Neither
  is wired into production routing.

Adding Gemini or a direct Anthropic/Claude route means implementing the same
three-method `StructuringProvider` interface — the pipeline, schema, and
prompt code never change.

## Provider/model routing & economics

`src/router.ts` — `resolveDefaultRoute()`:

- `AI_STRUCTURING_PROVIDER` (`openai` | `openrouter`) forces a provider.
- `AI_STRUCTURING_MODEL` overrides the model for whichever provider is
  selected.
- Otherwise auto-selects by whichever API key is actually present
  (`OPENAI_API_KEY` preferred, `OPENROUTER_API_KEY` fallback).
- Default model: **`gpt-4o-mini`** direct on OpenAI, or
  **`openai/gpt-4o-mini`** via OpenRouter — a low-cost, JSON-mode-capable
  model appropriate for bulk structuring, not a frontier model.

`estimateCostUsd(model, inputTokens, outputTokens)` uses a small published
approximate-pricing table (USD/1K tokens) and returns `undefined` for any
model not in the table rather than guessing — callers must treat the result
as an audit estimate, never a billing figure.

## Structured output schema

`src/schema.ts` — `StructuredIdeaSchema` (Zod, `.strict()` at every object
level, so the model cannot smuggle extra keys like a fabricated
`estimated_revenue_usd` past validation):

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `summary` | string | |
| `problem` | string | |
| `solution` | string | |
| `target_user` | string | |
| `revenue_model` | `{ mechanism: string, confidence: low\|medium\|high }` | never a bare number |
| `distribution` | `{ concept: string, confidence: low\|medium\|high }` | |
| `tags` | string[] (≤12) | |
| `key_assumptions` | string[] (≤10) | |
| `open_questions` | string[] (≤10) | |
| `missing_evidence` | string[] (≤10) | |
| `uncertainties` | string[] (≤10) | |

The prompt (`src/prompt.ts`) explicitly instructs the model not to invent
numeric estimates and to state "unknown"/"unspecified" rather than guess —
the schema itself has no slot for a bare economics number, so even a
non-compliant model response would fail validation if it tried to add one.

## Persistence mapping — provenance separation

`src/mapping.ts` — `buildIdeaUpdatePayload()` is a pure function producing:

- Direct updates to `ideas.title/summary/problem/solution/target_user/tags`
  and formatted `revenue_model`/`distribution` text columns (existing schema,
  no migration).
- Everything AI-derived that doesn't have a dedicated column — confidence
  levels, assumptions, open questions, missing evidence, uncertainties,
  provider/model/prompt-version/repair-used/timestamp — nested under
  `metadata.ai_structuring`, merged non-destructively with `mergeIdeaMetadata()`
  so other subsystems' metadata keys are preserved.
- **No `raw_input` key ever appears in this payload** — `mapping.test.ts`
  asserts this directly (`expect(payload).not.toHaveProperty("raw_input")`).

`apps/web/lib/ai/structure-idea.ts` additionally inserts an append-only
`idea_versions` snapshot (`raw_input` + normalized fields + full
`ai_structuring` metadata, `change_reason: "ai_structuring:<prompt_version>"`)
on every successful structuring pass, and sets `ideas.status = 'structured'`.

## Prompt versioning

`STRUCTURING_PROMPT_VERSION = "idea-structure-v1"`, centralized in
`src/prompt.ts` and recorded on every `ai_runs` row and every `idea_versions`
snapshot. Changing the prompt means bumping this constant — nothing in the
UI or elsewhere hardcodes prompt text.

## Prompt-injection isolation

The raw idea is wrapped in an explicit `<raw_idea>...</raw_idea>` block; the
system prompt states outright that this block is data to analyze, never
instructions, and that phrases like "ignore previous instructions" found
inside it must be treated as idea content. This cannot be proven against a
live model in a unit test, so `prompt.test.ts` verifies the isolation
mechanism structurally (the raw text is tagged, never concatenated into the
system prompt; the system prompt contains the explicit isolation
instruction).

## Bounded repair / retry policy

`src/pipeline.ts` — `structureRawIdea()`:

1. Build prompt → call provider → parse JSON → validate.
2. If invalid: build one repair prompt (includes the validation errors and
   the previous output) → call provider once more → validate again.
3. Still invalid → `{ status: "failed", reason: "validation_failed" }`.
   A provider-level error (timeout, network, missing credentials, malformed
   payload, refusal) short-circuits immediately as
   `{ status: "failed", reason: "provider_error", errorKind }` — no repair
   is attempted against a transport failure.

`maxRepairAttempts` defaults to 1 (bounded: at most 2 total provider calls).
`pipeline.test.ts` proves the loop terminates at exactly `maxRepairAttempts`
even when every response stays invalid — there is no unbounded/infinite
retry path.

## AI run auditability (`ai_runs`)

`src/ai-run-log.ts` — `buildAiRunLogRow()` builds one append-only `ai_runs`
row per structuring call (success or failure), capturing: `idea_id`,
`task_type: "idea_structuring"`, `provider`, `model`, `prompt_version`,
`input_version` (see reproducibility below), summed `input_tokens`/
`output_tokens` across all attempts, `estimated_cost_usd`, `latency_ms`,
a `status` (`success` / `success_after_repair` / `invalid_output` /
`error_<kind>` / `persist_failed`), and an `output` audit blob (per-attempt
validity + errors, repair-used flag, error message). Insert-only, per
Mission 1's append-only privileges on `ai_runs`.

## Reproducibility

`src/hash.ts` — `hashRawInput()` is a stable SHA-256-based fingerprint of the
exact raw text a run analyzed, stored as `ai_runs.input_version` and inside
every `idea_versions.snapshot.raw_input`. Combined with `prompt_version` +
`provider` + `model` on the same rows, a later reader can always answer
"what raw/versioned idea did this model analyze, with what prompt/model?"
without depending on any mutable state.

## Failure safety

A provider outage, timeout, invalid JSON, schema failure, missing API key,
refusal, or network error **never touches the `ideas` row**. Only an
`ai_runs` audit row is written; the idea stays exactly as captured and is
always retryable. `structure-idea.test.ts` proves this directly for a
provider outage, invalid-output, and update-persistence-failure path (in
each case, `ideas.update` is asserted to have been called zero or exactly
the expected number of times, and the returned outcome is always one of
`structured` / `not_found` / `failed`, never a thrown exception).

## Cross-owner access / secret handling

`structure-idea.ts` only ever uses `createSupabaseServerClient()` (the
existing RLS-scoped, cookie-based session client from Mission 1) — never a
service-role client. A `security.test.ts` suite statically scans the repo to
assert: no `"use client"` file references `OPENAI_API_KEY`/
`OPENROUTER_API_KEY`; neither is ever exposed under a `NEXT_PUBLIC_` prefix;
and outside the provider adapters themselves, nothing in `apps/web` reads
those env vars directly.

## Mission 2 integration contract

```ts
import { structureIdea } from "../lib/ai/structure-idea";

const outcome = await structureIdea(ideaId);
// { status: "structured", ideaId } | { status: "not_found", ideaId }
// | { status: "failed", ideaId, reason: "validation_failed" | "provider_error" | "persist_failed" }
```

One call, one string argument, one of three outcome shapes. Mission 2 needs
no knowledge of providers, prompts, or schemas — "structure this saved
idea." `structureIdea` is a plain async function (no `"use server"`
directive of its own); a caller that needs a literal Server Action
reference (e.g. a form's `action` prop) should wrap it:

```ts
async function structureIdeaAction(formData: FormData) {
  "use server";
  await structureIdea(String(formData.get("ideaId")));
}
```

## 100-fixture harness

`packages/ai-structuring/fixtures/raw-ideas.ts` — 100 fixtures (`f001`–
`f100`), each tagged by category. Composition: one-sentence ideas, very-short
input, rambling multi-paragraph captures, unusually long input, incomplete/
unclear fragments, technical/software products, local businesses,
marketplaces, nonprofits, creator products, data businesses, service
companies, physical products, lead-generation concepts, uncertain-revenue
ideas, missing-customer ideas, duplicate/overlapping concept pairs, ideas
describing multiple possible businesses at once, ideas referencing an
external URL as a separate source, ambitious/moonshot concepts, and
deliberately bad/vague ideas.

`packages/ai-structuring/src/harness/evaluate.ts` runs every fixture through
the **real** pipeline (`structureRawIdea` — identical code path to
production) and tabulates first-pass/repair-pass/final validity, token
totals, and failures. `pnpm --filter @ideabin/ai-structuring fixtures:run`
(`src/harness/run.ts`) auto-detects live credentials via
`resolveDefaultRoute()`/`provider.isConfigured()`:

- If `OPENAI_API_KEY`/`OPENROUTER_API_KEY` is present, it runs all 100
  fixtures against the real configured provider/model.
- Otherwise it runs the **offline deterministic-heuristic pass** instead,
  clearly labeled as such, and writes `fixtures/results.offline.json`.

### Results actually observed in this environment

**No `OPENAI_API_KEY` or `OPENROUTER_API_KEY` is configured in this
execution sandbox.** Zero live provider calls were made or could be made —
this is stated plainly rather than fabricated. The harness therefore ran
its offline pass:

```
mode:                  offline (DeterministicHeuristicProvider, no network)
provider/model:        offline-heuristic / offline-heuristic-v1
total fixtures:        100
first-pass valid:      100
repair-pass valid:     0
final valid:           100 (100.0%)
failures:              0
```

(full output in `packages/ai-structuring/fixtures/results.offline.json`,
also asserted by `src/harness/evaluate.test.ts` as a CI-safe regression
check.)

**This 100% figure measures pipeline plumbing correctness — prompt
construction, JSON parsing, Zod validation, the bounded-repair branch, and
the harness's own bookkeeping — using a fully deterministic, non-LLM stand-in
provider. It is not a measurement of live model quality and must not be read
as satisfying the live ">=90% under the default production model" target.**
That measurement requires whoever holds `OPENAI_API_KEY` (or
`OPENROUTER_API_KEY`) in a real environment to run:

```
OPENAI_API_KEY=... pnpm --filter @ideabin/ai-structuring fixtures:run
```

which will exercise the identical `structureRawIdea()` pipeline against
`gpt-4o-mini` for all 100 fixtures and write `fixtures/results.live.json`
with first-pass/repair-pass/final counts, token totals, and an approximate
cost, using the exact same harness code validated here.

### Provider-error / retry-bound coverage (deterministic, CI-safe)

Separately from the fixture harness, `pipeline.test.ts` and
`providers/openai-compatible.test.ts` deterministically exercise: valid
output accepted, invalid output rejected, one-round bounded repair
succeeding, repeated-invalid output failing cleanly, retry count staying
bounded under a pathological all-invalid script, provider timeout, non-2xx
provider error, missing credentials (no network call attempted), and a
malformed/unparsable provider payload — all without any live API access.

## Tests and results (this environment)

`pnpm test` (`pnpm -r test`), no live credentials required:

- `packages/ai-structuring`: **56 tests passed**, 10 files (schema, JSON
  parsing, prompt isolation, provider adapters, pipeline/repair-bounding,
  mapping/provenance-separation, ai_runs audit-row building, router/cost
  estimation, hash determinism, 100-fixture offline harness).
- `apps/web`: **9 tests passed**, 2 files (`structure-idea.ts` orchestration
  against a fake RLS-scoped Supabase client covering not-found/success/
  provider-outage/persist-failure/invalid-output paths; static security scan
  for credential leakage and RLS-only access).

**65 tests total, all passing.**

`pnpm typecheck` (`pnpm -r typecheck`): both packages pass with no errors.

`pnpm build` (`pnpm -r build`): `packages/ai-structuring` (`tsc --noEmit`)
and `apps/web` (`next build`, Turbopack) both succeed; the Next production
build compiles and statically analyzes `apps/web/lib/ai/structure-idea.ts`
and the transpiled `@ideabin/ai-structuring` package without error.

## Schema deficiencies observed (not applied — documented per mission rules)

No migration was written. These are optional future improvements, not
blockers — V1 proceeds correctly on the current schema using the
`metadata` jsonb column and formatted text columns described above.

1. **`ideas.revenue_model`/`ideas.distribution` are plain `text`.** The
   structured `{mechanism/concept, confidence}` pair is currently persisted
   as a formatted string (`"<value> (confidence: <level>)"`) in those
   columns, with the full structured object duplicated in
   `metadata.ai_structuring`. A cleaner long-term schema would change these
   two columns to `jsonb` (or add two `..._confidence text` columns) so the
   confidence level is directly queryable/filterable without parsing the
   text column. *Minimum proposed migration:* `alter table ideas alter
   column revenue_model type jsonb using ...` (with a backfill parsing the
   existing text) — deferred since it touches a live column read by
   scoring/UI consumers outside this mission's ownership.
2. **`idea_versions.version_no` is computed client-side** (`select max(...)
   + 1` then insert), which is race-prone under concurrent structuring
   calls on the same idea. *Minimum proposed migration:* a `before insert`
   trigger on `idea_versions` computing `version_no` server-side
   (`coalesce(max(version_no), 0) + 1` scoped by `idea_id`), removing the
   client-side read entirely. Low risk in practice for a single-power-user
   V1 with no concurrent structuring of the same idea, but worth fixing
   before multi-session or multi-user use.
3. **No hard FK from `idea_versions` to the `ai_runs` row that produced
   it.** Linkage today is by convention (`change_reason` string tag +
   matching `prompt_version`/timestamp), not a foreign key. *Minimum
   proposed migration:* add a nullable `ai_run_id uuid references
   ai_runs(id)` column to `idea_versions`. Nice-to-have for stricter
   reproducibility queries, not required for V1's stated acceptance
   criteria.

## Known risks / limitations

- Live-model >=90% validity is unverified in this environment (no
  credentials); the harness and offline-plumbing pass are real and green,
  but the actual quality number depends on a real `gpt-4o-mini` run.
- `idea_versions.version_no` race condition described above (schema
  deficiency #2).
- `idea_versions` insert failure after a successful `ideas` update is not
  currently surfaced back to the caller as a distinct outcome (the idea is
  still correctly updated and audited via `ai_runs`; only the supplementary
  version snapshot could silently fail). Acceptable for V1; worth a
  dedicated outcome variant later if this proves to matter in practice.
- OpenRouter adapter is implemented and unit-tested via the shared
  OpenAI-compatible transport, but has not been exercised against a live
  OpenRouter endpoint in this environment (no credentials).

## Package/config footprint

- New workspace package `packages/ai-structuring` (owned entirely by this
  mission).
- `apps/web/package.json`: added `@ideabin/ai-structuring` (workspace
  dependency) and `vitest` (devDependency); changed the placeholder
  `"test": "echo \"web tests pending\""` to `"test": "vitest run"` — this
  was a no-op placeholder before this mission and now runs real tests
  (mine, and any Mission 2 adds later under the same runner).
- `apps/web/next.config.ts`: added `transpilePackages` so Next compiles the
  source-only workspace package (see Architecture above).
- `pnpm-lock.yaml`: committed for the first time (previously absent; CI ran
  with `--frozen-lockfile=false`), now reflects the new dependencies.
- No Supabase migration, auth/proxy file, scoring file, or Inbox UI file was
  touched.
