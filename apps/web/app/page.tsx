import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header>
        <p className="eyebrow">IdeaBin.ai</p>
        <h1>What should you work on next?</h1>
        <p>Capture ideas, structure them, evaluate them with explicit inputs, and inspect the resulting score and recommendation.</p>
      </header>
      <section className="grid">
        <article>
          <h2>Inbox</h2>
          <p>Capture a raw idea without losing the original thought.</p>
          <Link href="/inbox">Capture an idea →</Link>
        </article>
        <article>
          <h2>Idea Library</h2>
          <p>Inspect raw, AI-derived, and deterministic evaluation data separately.</p>
          <Link href="/ideas">Open Idea Library →</Link>
        </article>
        <article>
          <h2>Next</h2>
          <p>Connections and portfolio prioritization follow after this vertical slice is commissioned.</p>
        </article>
      </section>
    </main>
  );
}
