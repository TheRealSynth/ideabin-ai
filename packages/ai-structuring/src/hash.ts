import { createHash } from "node:crypto";

/**
 * Stable, short fingerprint of the exact raw text a structuring run
 * analyzed. Stored alongside each ai_runs row and idea_versions snapshot so
 * a later reader can answer "what raw/versioned idea did this model
 * analyze?" without re-deriving it from mutable state.
 */
export function hashRawInput(rawInput: string): string {
  return createHash("sha256").update(rawInput, "utf8").digest("hex").slice(0, 32);
}
