# IdeaBin.ai

IdeaBin.ai is an AI-powered idea operating system that captures, structures, connects, evaluates, prioritizes, and converts ideas into executable projects.

## V1 objective

Prove that the system can:

1. capture at least 100 real ideas,
2. convert them into consistent structured records,
3. identify useful relationships and shared capabilities,
4. rank them better than an unstructured notes workflow,
5. convert selected ideas into executable plans, and
6. learn from predicted vs. actual outcomes.

## Canonical architecture

- GitHub: source of truth
- Next.js: web application
- Supabase: Postgres, Auth, Storage, pgvector
- OpenAI: primary model + embeddings
- OpenRouter: optional fallback / model comparison
- n8n: background ingestion and scheduled monitoring
- Vercel: production deployment
- ChatGPT Sites: rapid UI / workflow prototypes, not canonical production

## Repository map

```text
apps/web/                    Next.js application
packages/core/               scoring + core domain logic
supabase/migrations/         database schema
docs/                        product, architecture, roadmap, AI governance
.github/workflows/           CI
AGENTS.md                    shared rules for all coding agents
CLAUDE.md                    Claude Code-specific rules
```

## First build order

1. Database schema
2. Authentication
3. Idea inbox / capture
4. Idea library
5. Idea detail page
6. AI structuring
7. Scoring
8. Relationship suggestions
9. Portfolio ranking
10. Decision queue
11. Project conversion
12. Outcome tracking

## Branch rules

- `main` is always releasable.
- Every agent works on a dedicated branch.
- No agent may directly push feature work to `main`.
- Every feature must include tests or a written reason tests do not apply.
- Database migrations are append-only after merge.

See `AGENTS.md`, `CLAUDE.md`, and `docs/AI_WORKFLOW.md`.
