export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Models frequently wrap JSON in markdown code fences even when asked not
 * to. Strip a single leading/trailing fence before parsing so validation
 * failures reflect real schema problems, not formatting noise.
 */
export function safeJsonParse(text: string): JsonParseResult {
  const stripped = stripCodeFence(text.trim());
  try {
    return { ok: true, value: JSON.parse(stripped) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `invalid JSON: ${message}` };
  }
}

function stripCodeFence(text: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return fenced ? fenced[1] : text;
}
