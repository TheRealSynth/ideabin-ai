"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./idea-detail.module.css";

type Props = {
  ideaId: string;
};

export function StructureAction({ ideaId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    if (busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/inbox/structure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      const payload = (await response.json()) as { message?: string; structuringStatus?: string };
      setMessage(payload.message ?? "Structuring request finished.");
      if (response.ok && payload.structuringStatus === "structured") {
        router.refresh();
      }
    } catch {
      setMessage("Structuring could not reach the server. The raw idea remains unchanged.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.actionRow}>
      <button className={styles.primaryButton} disabled={busy} onClick={() => void retry()} type="button">
        {busy ? "Structuring..." : "Structure / retry"}
      </button>
      {message ? <p className={styles.statusMessage} role="status">{message}</p> : null}
    </div>
  );
}
