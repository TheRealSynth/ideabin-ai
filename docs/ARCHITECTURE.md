# Architecture

## Principle
GitHub is the canonical software asset. Every UI, model provider, and automation layer is replaceable.

```text
Browser -> Next.js -> application services -> AI router
                   -> Supabase Postgres/Auth/Storage/pgvector
                   -> n8n for long-running/scheduled external workflows
```

## Frontend
Next.js App Router handles capture, views, filters, portfolio UX, chat UX, and explicit decisions.

## Database
Postgres is system of record. Relationships remain relational typed edges in V1. No Neo4j.

## Semantic search
Use pgvector. No dedicated vector DB until measured need.

## AI
All model calls route through an adapter and record provider, model, task, prompt version, token use, latency, estimated cost, and status.

## Ingestion
`source -> raw ingest -> extraction -> idea candidate -> dedupe -> confirmation -> idea -> embedding -> relationships -> evaluation`

## Provenance
User-authored and AI-derived data remain distinguishable. External signals store URL/title/fetched_at/confidence.

## Security
RLS on user-owned tables; keys server-only; imported content treated as untrusted; no execution of ingested content; rate limiting before public launch.

## Deployment
`branch -> CI -> Vercel preview -> review -> merge main -> production`. ChatGPT Sites may prototype UX, but production must be reproducible from GitHub.