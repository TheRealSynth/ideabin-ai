"use client";

import { useReducer, useRef } from "react";
import styles from "./inbox.module.css";
import {
  canStartSubmission,
  createInitialCaptureUiState,
  inboxCaptureReducer,
} from "./capture";

type CaptureResponseSuccess = {
  createdAt: string;
  ideaId: string;
  message: string;
  structuringPending: boolean;
};

type CaptureResponseFailure = {
  fieldErrors?: Partial<{
    rawInput: string;
    sourceLabel: string;
    sourceUrl: string;
  }>;
  message: string;
};

export function CaptureForm() {
  const [state, dispatch] = useReducer(inboxCaptureReducer, undefined, createInitialCaptureUiState);
  const inFlight = useRef(false);
  const rawInputRef = useRef<HTMLTextAreaElement | null>(null);

  async function submitCapture(intent: "raw" | "structure") {
    if (inFlight.current || state.isSubmitting) {
      return;
    }

    const draft = state.draft;
    inFlight.current = true;
    dispatch({ type: "submission-started" });

    try {
      const response = await fetch("/api/inbox", {
        body: JSON.stringify({
          intent,
          rawInput: draft.rawInput,
          sourceLabel: draft.sourceLabel,
          sourceUrl: draft.sourceUrl,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as CaptureResponseFailure;
        dispatch({
          fieldErrors: payload.fieldErrors,
          message: payload.message,
          type: "submission-failed",
        });
        return;
      }

      const payload = (await response.json()) as CaptureResponseSuccess;
      dispatch({
        message: payload.message,
        savedIdeaId: payload.ideaId,
        type: "submission-succeeded",
      });
    } catch {
      dispatch({
        message: "Network error. Your draft is still here.",
        type: "submission-failed",
      });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <section className={styles.card} aria-label="Inbox capture">
      <div className={styles.cardInner}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
            const intent =
              submitter instanceof HTMLButtonElement && submitter.value === "structure"
                ? "structure"
                : "raw";
            void submitCapture(intent);
          }}
        >
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="raw-input">
              Raw idea
              <span className={styles.hint}>No rewriting. No required classification.</span>
            </label>
            <textarea
              ref={rawInputRef}
              id="raw-input"
              name="rawInput"
              className={styles.textarea}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="done"
              placeholder="Paste the exact idea here..."
              spellCheck={false}
              value={state.draft.rawInput}
              onChange={(event) =>
                dispatch({
                  field: "rawInput",
                  type: "draft-updated",
                  value: event.target.value,
                })
              }
            />

            <div className={styles.sourceGrid}>
              <label className={styles.label} htmlFor="source-label">
                <span className={styles.optionalLabel}>
                  Source label
                  <span className={styles.hint}>Optional</span>
                </span>
                <input
                  id="source-label"
                  name="sourceLabel"
                  className={styles.input}
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect="off"
                  placeholder="Podcast, email, meeting..."
                  value={state.draft.sourceLabel}
                  onChange={(event) =>
                    dispatch({
                      field: "sourceLabel",
                      type: "draft-updated",
                      value: event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.label} htmlFor="source-url">
                <span className={styles.optionalLabel}>
                  Source URL
                  <span className={styles.hint}>Optional</span>
                </span>
                <input
                  id="source-url"
                  name="sourceUrl"
                  className={styles.input}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  inputMode="url"
                  placeholder="https://..."
                  value={state.draft.sourceUrl}
                  onChange={(event) =>
                    dispatch({
                      field: "sourceUrl",
                      type: "draft-updated",
                      value: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              disabled={!canStartSubmission(state)}
              type="submit"
              value="raw"
            >
              Save Raw
            </button>
            <button
              className={styles.secondaryButton}
              disabled={!canStartSubmission(state)}
              type="submit"
              value="structure"
            >
              Save + Structure
            </button>
          </div>
        </form>

        <p className={styles.hint} style={{ margin: 0 }}>
          Raw input is stored exactly as entered. Source metadata stays separate. AI is not required for preservation.
        </p>

        {state.message ? (
          <div
            className={`${styles.status} ${state.status === "error" ? styles.statusError : styles.statusSuccess}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            <p className={styles.statusTitle}>{state.status === "error" ? "Capture needs one more pass" : "Captured"}</p>
            <p className={styles.statusBody}>{state.message}</p>
            {state.status === "success" ? (
              <div className={styles.statusActions}>
                <button
                  className={styles.ghostButton}
                  onClick={() => {
                    dispatch({ type: "reset" });
                    rawInputRef.current?.focus();
                  }}
                  type="button"
                >
                  Capture another idea
                </button>
              </div>
            ) : null}
            {state.status === "error" && state.fieldErrors.rawInput ? (
              <p className={styles.statusBody}>{state.fieldErrors.rawInput}</p>
            ) : null}
            {state.status === "error" && state.fieldErrors.sourceUrl ? (
              <p className={styles.statusBody}>{state.fieldErrors.sourceUrl}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
