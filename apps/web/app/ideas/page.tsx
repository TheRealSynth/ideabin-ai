import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import styles from "./ideas.module.css";

export const dynamic = "force-dynamic";

type IdeaRow = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type EvaluationRow = {
  idea_id: string;
  opportunity_score: number | string;
  confidence: number | string;
  created_at: string;
};

function displayNumber(value: number | string | undefined): string {
  if (value === undefined) return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : "—";
}

export default async function IdeasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const ownerId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!ownerId) redirect("/login");

  const { data: ideaData } = await supabase
    .from("ideas")
    .select("id,title,status,tags,created_at,updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  const ideas = (ideaData ?? []) as IdeaRow[];
  const ideaIds = ideas.map((idea) => idea.id);
  const evaluationResult = ideaIds.length
    ? await supabase
        .from("evaluations")
        .select("idea_id,opportunity_score,confidence,created_at")
        .eq("owner_id", ownerId)
        .in("idea_id", ideaIds)
        .order("created_at", { ascending: false })
    : { data: [] as EvaluationRow[] };

  const latestByIdea = new Map<string, EvaluationRow>();
  for (const row of (evaluationResult.data ?? []) as EvaluationRow[]) {
    if (!latestByIdea.has(row.idea_id)) latestByIdea.set(row.idea_id, row);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Idea Library</p>
            <h1>Every captured idea, inspectable.</h1>
            <p>Raw ideas, structured concepts, and immutable evaluation snapshots stay connected.</p>
          </div>
          <Link className={styles.captureButton} href="/inbox">Capture idea</Link>
        </header>

        {ideas.length === 0 ? (
          <section className={styles.empty}>
            <h2>No ideas yet</h2>
            <p>Capture the first raw idea. AI is optional.</p>
            <Link href="/inbox">Open Inbox</Link>
          </section>
        ) : (
          <section className={styles.list} aria-label="Idea library">
            <div className={styles.desktopHeader}>
              <span>Idea</span><span>Status</span><span>Score</span><span>Confidence</span><span>Updated</span>
            </div>
            {ideas.map((idea) => {
              const evaluation = latestByIdea.get(idea.id);
              return (
                <Link className={styles.card} href={`/ideas/${idea.id}`} key={idea.id}>
                  <div className={styles.titleCell}>
                    <strong>{idea.title}</strong>
                    {idea.tags.length ? <small>{idea.tags.slice(0, 4).join(" · ")}</small> : null}
                  </div>
                  <span className={styles.status}>{idea.status}</span>
                  <span data-label="Score">{displayNumber(evaluation?.opportunity_score)}</span>
                  <span data-label="Confidence">{displayNumber(evaluation?.confidence)}</span>
                  <span data-label="Updated">{new Date(idea.updated_at).toLocaleDateString()}</span>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
