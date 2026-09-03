"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./idea-detail.module.css";

const dimensions = [
  ["revenuePotential", "Revenue potential"],
  ["speedToValidation", "Speed to validation"],
  ["capitalEfficiency", "Capital efficiency"],
  ["executionFeasibility", "Execution feasibility"],
  ["existingAssetLeverage", "Existing asset leverage"],
  ["distributionAdvantage", "Distribution advantage"],
  ["marketTiming", "Market timing"],
  ["strategicReuse", "Strategic reuse"],
] as const;

type Props = {
  ideaId: string;
  enabled: boolean;
};

type EvaluationResponse = {
  message?: string;
  fieldErrors?: Record<string, string>;
  opportunityScore?: number;
  confidence?: number;
  recommendation?: string;
};

export function EvaluationForm({ ideaId, enabled }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(formData: FormData) {
    if (isSubmitting || !enabled) return;
    setIsSubmitting(true);
    setMessage(null);
    setFieldErrors({});

    const payload = {
      dimensions: Object.fromEntries(
        dimensions.map(([key]) => [key, Number(formData.get(key))]),
      ),
      confidence: Number(formData.get("confidence")),
      rationale: String(formData.get("rationale") ?? ""),
      assumptions: String(formData.get("assumptions") ?? "")
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean),
      context: {
        hasCheapValidationTest: formData.get("hasCheapValidationTest") === "on",
        informationGapPrimaryBlocker: formData.get("informationGapPrimaryBlocker") === "on",
        timingOrDependencyBlocked: formData.get("timingOrDependencyBlocked") === "on",
        structurallyWeakOrDominated: formData.get("structurallyWeakOrDominated") === "on",
      },
    };

    try {
      const response = await fetch(`/api/ideas/${ideaId}/evaluate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as EvaluationResponse;

      if (!response.ok) {
        setMessage(result.message ?? "Evaluation failed.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setMessage(
        `Saved immutable evaluation: score ${result.opportunityScore}, confidence ${result.confidence}, recommendation ${result.recommendation}.`,
      );
      router.refresh();
    } catch {
      setMessage("Evaluation request could not reach the server. No previous evaluation was changed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="evaluate-title">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Evaluation</p>
          <h2 id="evaluate-title">Confirm the scoring inputs</h2>
        </div>
        <span className={styles.provenanceBadge}>User-confirmed</span>
      </div>

      {!enabled ? (
        <p className={styles.muted}>Structure this idea first. Evaluation is intentionally unavailable for raw-only ideas.</p>
      ) : (
        <form action={(formData) => void submit(formData)} className={styles.evaluationForm}>
          <p className={styles.muted}>
            These values are judgments, not facts generated from the idea text. Every submitted value is stored with
            user-confirmed provenance.
          </p>

          <div className={styles.dimensionGrid}>
            {dimensions.map(([key, label]) => (
              <label className={styles.field} key={key}>
                <span>{label}</span>
                <input name={key} type="number" min="0" max="100" step="1" required inputMode="decimal" />
                {fieldErrors[key] ? <small className={styles.error}>{fieldErrors[key]}</small> : null}
              </label>
            ))}
          </div>

          <label className={styles.field}>
            <span>Confidence</span>
            <input name="confidence" type="number" min="0" max="100" step="1" required inputMode="decimal" />
            {fieldErrors.confidence ? <small className={styles.error}>{fieldErrors.confidence}</small> : null}
          </label>

          <fieldset className={styles.contextBox}>
            <legend>Recommendation context</legend>
            <label><input type="checkbox" name="hasCheapValidationTest" /> A cheap validation test exists</label>
            <label><input type="checkbox" name="informationGapPrimaryBlocker" /> Information gap is the primary blocker</label>
            <label><input type="checkbox" name="timingOrDependencyBlocked" /> Timing or dependency blocks execution</label>
            <label><input type="checkbox" name="structurallyWeakOrDominated" /> Structurally weak or clearly dominated</label>
          </fieldset>

          <label className={styles.field}>
            <span>Rationale</span>
            <textarea name="rationale" rows={3} placeholder="Why these inputs are reasonable..." />
          </label>

          <label className={styles.field}>
            <span>Assumptions</span>
            <textarea name="assumptions" rows={3} placeholder="One assumption per line" />
          </label>

          <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Evaluating..." : "Save evaluation"}
          </button>
          {message ? <p className={styles.statusMessage} role="status">{message}</p> : null}
        </form>
      )}
    </section>
  );
}
