# IdeaBin Vercel Deployment Contract

## Purpose

Create one reproducible Vercel deployment surface for IdeaBin so repository CI is supplemented by real browser, authentication, Supabase, and server-route verification.

## Current state

At the latest connected-account check, no Vercel project was linked to `TheRealSynth/ideabin-ai`. Repository CI is green, but preview/production runtime behavior is not yet verified.

## One-time Vercel project setup

Use the existing Vercel team and import the GitHub repository `TheRealSynth/ideabin-ai`.

Recommended project settings:

- Framework Preset: Next.js
- Root Directory: `apps/web`
- Package Manager: pnpm, using the repository `packageManager` declaration
- Install Command: leave framework/monorepo default first; the repository contains the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`
- Build Command: `next build` / package default
- Output Directory: Next.js default
- Production Branch: `main`

The repository workspace includes `apps/*` and `packages/*`, and `@ideabin/web` depends on the workspace package `@ideabin/ai-structuring`. Do not copy that package into the web app to make deployment work; preserve the monorepo dependency.

## Required environment variables

Minimum runtime for capture/auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional server-only structuring configuration:

- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- `AI_STRUCTURING_PROVIDER` (`openai` or `openrouter`) when explicitly forcing a provider
- `AI_STRUCTURING_MODEL` when explicitly overriding the selected model

Other integration configuration:

- `N8N_INGEST_WEBHOOK_SECRET` only when the ingestion workflow is actually enabled

Never expose provider keys through `NEXT_PUBLIC_*` variables.

## Safe deployment sequence

1. Import the repository into Vercel without changing application code.
2. Configure the two Supabase public variables for Preview and Production.
3. Deploy `main` with no AI provider key first.
4. Verify that authentication and **Save Raw** work without AI credentials. This is a required product invariant.
5. Verify **Save + Structure** fails recoverably when no provider is configured: the raw idea must remain saved and retryable.
6. Only after the no-AI path passes, add one server-only provider key to Preview.
7. Run the live 100-fixture structuring quality gate separately before claiming >=90% live-model quality or enabling live structuring by default in production.
8. Promote to Production only after the runtime checklist below passes.

## Runtime verification checklist

### Anonymous/auth

- unauthenticated `/inbox` and `/ideas` access follows the intended login flow
- valid sign-in succeeds
- sign-out succeeds
- no provider key appears in browser source, network responses, or client bundles

### Capture

- Save Raw persists exact `raw_input`
- source label/URL remain metadata, not appended to raw input
- empty/invalid capture preserves the draft
- double-submit protection prevents duplicate saves

### Structuring

- Save + Structure persists raw before the provider call
- provider failure leaves the raw record visible and retryable
- retry can succeed later without modifying original raw input
- structured fields remain distinguishable from user-authored source text

### Evaluation

- all eight dimensions and confidence are required
- missing/out-of-range inputs fail closed
- stored inputs reproduce the displayed deterministic score
- score, confidence, and recommendation are shown separately
- a second evaluation creates another immutable snapshot

### Library/detail

- newly captured ideas appear in Idea Library
- Idea Detail shows raw input, AI-derived fields, evaluations, versions, and AI runs
- cross-owner access fails closed

### Mobile/desktop

- Inbox capture is usable on a phone without horizontal scrolling
- Idea Library and Idea Detail are usable on mobile and desktop
- evaluation controls remain reachable and readable on mobile

## Deployment evidence to record

For each commissioned deployment record:

- Vercel project ID/name
- deployment ID and URL
- Git commit SHA
- environment (Preview or Production)
- build result
- runtime checklist result
- Supabase project identity (not secret credentials)
- provider/model configuration if structuring is tested
- known failures and exact reproduction steps

## Failure policy

Do not fix deployment failures by weakening RLS, raw-input immutability, append-only history, provider-secret isolation, or canonical scoring. If deployment exposes a real incompatibility, repair the smallest root cause on a fresh branch and keep the runtime evidence attached to the change.
