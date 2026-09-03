import styles from "./inbox.module.css";
import { CaptureForm } from "./capture-form";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Inbox</p>
          <h1 className={styles.title}>Capture the raw idea before it disappears.</h1>
          <p className={styles.lede}>
            Fastest path first: paste the exact thought, optionally add where it came from, and preserve it without
            waiting on AI.
          </p>
        </header>

        <CaptureForm />
      </div>
    </main>
  );
}
