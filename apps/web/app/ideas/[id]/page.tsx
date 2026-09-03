import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { DIMENSION_KEYS, type PersistedEvaluationDimensions } from "../../../lib/evaluation/evaluation";
import { EvaluationForm } from "./evaluation-form";
import { StructureAction } from "./structure-action";
import styles from "./idea-detail.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type IdeaRow = {
  id: string;
  title: string;
  raw_input: string;
  summary: string | null;
  problem: string | null;
  solution: string | null;
  target_user: string | null;
  revenue_model: string | null;
  distribution: string | null;
  tags: string[];
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type EvaluationRow = {
  id: string;
  scoring_model_version: string;
  dimensions: unknown;
  opportunity_score: number | string;
  confidence: number | string;
  rationale: string | null;
  assumptions: unknown;
  created_at: string;
};

type RecommendationRow = {
  id: string;
  recommendation: string;
  confidence: number | string | null;
  rationale: string | null;
  accepted: boolean | null;
  created_at: string;
};

type VersionRow = {
  id: string;
  version_no: number;
  change_reason: string | null;
  created_at: string;
};

type AiRunRow = {
  id: string;
  provider: string;
  model: string;
  prompt_version: string;
  status: string;
  latency_ms: number | null;
  created_at: string;
};

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function structuringMetadata(metadata: Record<string, unknown> | null): Record<string, unknown> {
  if (!metadata || typeof metadata.ai_structuring !== "object" || metadata.ai_structuring === null) return {};
  return metadata.ai_structuring as Record<string, unknown>;
}

function evaluationDimensions(value: unknown): PersistedEvaluationDimensions | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<PersistedEvaluationDimensions>;
  if (record.version !== 1 || !record.inputs || !record.recommendationContext) return null;
  return record as PersistedEvaluationDimensions;
}

function displayNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : "—";
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const ownerId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!ownerId) redirect("/login");

  const { data: ideaData } = await supabase
    .from("ideas")
    .select(
      "id,title,raw_input,summary,problem,solution,target_user,revenue_model,distribution,tags,status,metadata,created_at,updated_at",
    )
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!ideaData) notFound();
  const idea = ideaData as IdeaRow;

  const [evaluationResult, recommendationResult, versionResult, aiRunResult] = await Promise.all([
    supabase
      .from("evaluations")
      .select("id,scoring_model_version,dimensions,opportunity_score,confidence,rationale,assumptions,created_at")
      .eq("idea_id", id)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("recommendations")
      .select("id,recommendation,confidence,rationale,accepted,created_at")
      .eq("idea_id", id)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("idea_versions")
      .select("id,version_no,change_reason,created_at")
      .eq("idea_id", id)
      .eq("owner_id", ownerId)
      .order("version_no", { ascending: false }),
    supabase
      .from("ai_runs")
      .select("id,provider,model,prompt_version,status,latency_ms,created_at")
      .eq("idea_id", id)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
  ]);

  const evaluations = (evaluationResult.data ?? []) as EvaluationRow[];
  const recommendations = (recommendationResult.data ?? []) as RecommendationRow[];
  const versions = (versionResult.data ?? []) as VersionRow[];
  const aiRuns = (aiRunResult.data ?? []) as AiRunRow[];
  const latestEvaluation = evaluations[0];
  const latestRecommendation = recommendations[0];
  const latestDimensions = evaluationDimensions(latestEvaluation?.dimensions);
  const aiMetadata = structuringMetadata(idea.metadata);
  const normalized =
    typeof aiMetadata.normalized === "object" && aiMetadata.normalized !== null
      ? (aiMetadata.normalized as Record<string, unknown>)
      : aiMetadata;
  const keyAssumptions = asArray(normalized.key_assumptions);
  const openQuestions = asArray(normalized.open_questions);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav}>
          <Link href="/inbox">Capture</Link>
          <Link href="/ideas">Idea Library</Link>
        </nav>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Idea detail</p>
            <h1>{idea.title}</h1>
            <p className={styles.muted}>Created {new Date(idea.created_at).toLocaleString()}</p>
          </div>
          <div className={styles.metrics}>
            <span className={styles.statusBadge}>{idea.status}</span>
            <div><strong>{displayNumber(latestEvaluation?.opportunity_score)}</strong><span>Score</span></div>
            <div><strong>{displayNumber(latestEvaluation?.confidence)}</strong><span>Confidence</span></div>
            <div><strong>{latestRecommendation?.recommendation ?? "—"}</strong><span>Recommendation</span></div>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div><p className={styles.eyebrow}>User-authored</p><h2>Original raw idea</h2></div>
            <span className={styles.provenanceBadge}>Immutable</span>
          </div>
          <pre className={styles.raw}>{idea.raw_input}</pre>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div><p className={styles.eyebrow}>AI-derived</p><h2>Structured concept</h2></div>
            <span className={styles.provenanceBadge}>Model output</span>
          </div>
          {idea.status === "inbox" ? <StructureAction ideaId={idea.id} /> : null}
          <div className={styles.detailGrid}>
            <article><h3>Summary</h3><p>{idea.summary ?? "Not structured yet."}</p></article>
            <article><h3>Problem</h3><p>{idea.problem ?? "—"}</p></article>
            <article><h3>Solution</h3><p>{idea.solution ?? "—"}</p></article>
            <article><h3>Target user</h3><p>{idea.target_user ?? "—"}</p></article>
            <article><h3>Revenue model</h3><p>{idea.revenue_model ?? "—"}</p></article>
            <article><h3>Distribution</h3><p>{idea.distribution ?? "—"}</p></article>
          </div>
          {keyAssumptions.length > 0 ? <div><h3>AI assumptions</h3><ul>{keyAssumptions.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
          {openQuestions.length > 0 ? <div><h3>Open questions</h3><ul>{openQuestions.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
        </section>

        <EvaluationForm ideaId={idea.id} enabled={idea.status === "structured" || idea.status === "evaluated"} />

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div><p className={styles.eyebrow}>Deterministic</p><h2>Latest evaluation</h2></div>
            <span className={styles.provenanceBadge}>Canonical scorer</span>
          </div>
          {!latestEvaluation || !latestDimensions ? (
            <p className={styles.muted}>No evaluation yet.</p>
          ) : (
            <>
              <div className={styles.dimensionGrid}>
                {DIMENSION_KEYS.map((key) => (
                  <div className={styles.dimensionCard} key={key}>
                    <span>{key}</span>
                    <strong>{latestDimensions.inputs[key].value}</strong>
                    <small>{latestDimensions.inputs[key].source.replace("_", " ")}</small>
                  </div>
                ))}
              </div>
              <p><strong>Scoring model:</strong> {latestEvaluation.scoring_model_version}</p>
              <p><strong>Recommendation:</strong> {latestRecommendation?.recommendation ?? "—"}</p>
              <p><strong>Rationale:</strong> {latestRecommendation?.rationale ?? latestEvaluation.rationale ?? "—"}</p>
            </>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}><div><p className={styles.eyebrow}>History</p><h2>Immutable record trail</h2></div></div>
          <div className={styles.historyGrid}>
            <div>
              <h3>Evaluations ({evaluations.length})</h3>
              {evaluations.map((row) => <p key={row.id}>{new Date(row.created_at).toLocaleString()} — score {displayNumber(row.opportunity_score)}, confidence {displayNumber(row.confidence)}</p>)}
            </div>
            <div>
              <h3>Idea versions ({versions.length})</h3>
              {versions.map((row) => <p key={row.id}>v{row.version_no} — {row.change_reason ?? "snapshot"}</p>)}
            </div>
            <div>
              <h3>AI runs ({aiRuns.length})</h3>
              {aiRuns.map((row) => <p key={row.id}>{row.status} — {row.provider}/{row.model} — {row.prompt_version}</p>)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
