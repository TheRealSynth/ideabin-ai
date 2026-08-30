import { ProviderCallError, type ProviderCallRequest, type ProviderCallResult, type StructuringProvider } from "./types";

export type ScriptedResponse =
  | { type: "text"; text: string; inputTokens?: number; outputTokens?: number }
  | { type: "error"; error: ProviderCallError };

/**
 * Deterministic provider for tests: returns a pre-scripted sequence of
 * responses (one per call), never touches the network. Never wire this into
 * production routing.
 */
export class ScriptedProvider implements StructuringProvider {
  readonly id: string;
  private readonly script: ScriptedResponse[];
  private cursor = 0;
  private configured: boolean;
  public readonly calls: ProviderCallRequest[] = [];

  constructor(script: ScriptedResponse[], options: { id?: string; configured?: boolean } = {}) {
    this.script = script;
    this.id = options.id ?? "scripted";
    this.configured = options.configured ?? true;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async call(request: ProviderCallRequest): Promise<ProviderCallResult> {
    this.calls.push(request);
    if (!this.configured) {
      throw new ProviderCallError("missing_credentials", `${this.id} has no credentials configured`);
    }
    const step = this.script[this.cursor];
    this.cursor = Math.min(this.cursor + 1, this.script.length - 1);
    if (!step) {
      throw new ProviderCallError("provider_error", `${this.id} script exhausted`);
    }
    if (step.type === "error") {
      throw step.error;
    }
    return {
      text: step.text,
      inputTokens: step.inputTokens,
      outputTokens: step.outputTokens,
      latencyMs: 1,
      finishReason: "stop",
    };
  }
}

/**
 * Offline, fully deterministic stand-in for a live model. It never calls a
 * network and never fabricates numeric precision — every field is either
 * quoted/derived directly from the raw input or explicitly marked as
 * unstated. Used to exercise the full structuring pipeline (prompt shape is
 * ignored; only the raw idea matters) when no provider credentials are
 * configured, and to validate the pipeline's plumbing independent of any
 * particular vendor's output quality.
 *
 * Results produced by this provider are NOT a measurement of live model
 * quality and must never be reported as such.
 */
export class DeterministicHeuristicProvider implements StructuringProvider {
  readonly id = "offline-heuristic";

  isConfigured(): boolean {
    return true;
  }

  async call(request: ProviderCallRequest): Promise<ProviderCallResult> {
    const rawInputMatch = /<raw_idea>\n([\s\S]*?)\n<\/raw_idea>/.exec(request.userPrompt);
    const rawInput = (rawInputMatch ? rawInputMatch[1] : request.userPrompt).trim();
    const structured = deriveHeuristicStructure(rawInput);
    return {
      text: JSON.stringify(structured),
      inputTokens: Math.ceil(request.userPrompt.length / 4),
      outputTokens: Math.ceil(JSON.stringify(structured).length / 4),
      latencyMs: 1,
      finishReason: "stop",
    };
  }
}

function deriveHeuristicStructure(rawInput: string) {
  const normalized = rawInput.replace(/\s+/g, " ").trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const firstSentence = sentences[0] ?? normalized;
  const title = truncateWords(firstSentence, 12) || "Untitled idea";
  const summary = normalized.length > 0 ? normalized.slice(0, 500) : "No summary available.";
  const urlMatch = normalized.match(/https?:\/\/\S+/);

  return {
    title,
    summary,
    problem: sentences[1] ? truncateWords(sentences[1], 60) : "Not explicitly stated in the raw idea.",
    solution: firstSentence ? truncateWords(firstSentence, 60) : "Not explicitly stated in the raw idea.",
    target_user: "Not explicitly stated in the raw idea; requires clarification.",
    revenue_model: {
      mechanism: "Pricing/monetization not stated in the raw idea.",
      confidence: "low" as const,
    },
    distribution: {
      concept: urlMatch
        ? `Referenced source: ${urlMatch[0]} — acquisition channel not stated.`
        : "Distribution channel not stated in the raw idea.",
      confidence: "low" as const,
    },
    tags: inferTags(normalized),
    key_assumptions: ["Derived offline without a live model; treat as a structural placeholder."],
    open_questions: ["What customer segment is this really for?", "What would the first paid version look like?"],
    missing_evidence: ["No market or cost research has been performed on this idea yet."],
    uncertainties: ["Everything not explicitly present in the raw text is unknown, not zero."],
  };
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function inferTags(normalized: string): string[] {
  const lower = normalized.toLowerCase();
  const tags: string[] = [];
  const keywordMap: Array<[string, string]> = [
    ["app", "software"],
    ["software", "software"],
    ["marketplace", "marketplace"],
    ["nonprofit", "nonprofit"],
    ["service", "service"],
    ["ai", "ai"],
    ["data", "data"],
    ["local", "local-business"],
    ["subscription", "subscription"],
    ["community", "community"],
  ];
  for (const [keyword, tag] of keywordMap) {
    if (lower.includes(keyword) && !tags.includes(tag)) tags.push(tag);
  }
  if (tags.length === 0) tags.push("uncategorized");
  return tags.slice(0, 6);
}
