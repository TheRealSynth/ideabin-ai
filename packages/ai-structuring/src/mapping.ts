import type { StructuredIdea } from "./schema";

export interface AiStructuringMetadata {
  prompt_version: string;
  provider: string;
  model: string;
  repair_used: boolean;
  revenue_model: StructuredIdea["revenue_model"];
  distribution: StructuredIdea["distribution"];
  key_assumptions: string[];
  open_questions: string[];
  missing_evidence: string[];
  uncertainties: string[];
  structured_at: string;
}

/**
 * Shape of the update sent to the `ideas` row. Intentionally contains no
 * `raw_input` key — nothing in this module can touch the original text.
 * AI-derived detail (confidence-qualified fields, assumptions, questions)
 * is nested under `metadata_patch.ai_structuring`, kept distinct from the
 * user-authored columns above it.
 */
export interface IdeaUpdatePayload {
  title: string;
  summary: string;
  problem: string;
  solution: string;
  target_user: string;
  revenue_model: string;
  distribution: string;
  tags: string[];
  status: "structured";
  metadata_patch: {
    ai_structuring: AiStructuringMetadata;
  };
}

export interface BuildIdeaUpdatePayloadOptions {
  structured: StructuredIdea;
  provider: string;
  model: string;
  promptVersion: string;
  repairUsed: boolean;
  now?: Date;
}

export function buildIdeaUpdatePayload(options: BuildIdeaUpdatePayloadOptions): IdeaUpdatePayload {
  const { structured, provider, model, promptVersion, repairUsed } = options;
  const now = options.now ?? new Date();

  return {
    title: structured.title,
    summary: structured.summary,
    problem: structured.problem,
    solution: structured.solution,
    target_user: structured.target_user,
    revenue_model: formatRevenueModel(structured.revenue_model),
    distribution: formatDistribution(structured.distribution),
    tags: structured.tags,
    status: "structured",
    metadata_patch: {
      ai_structuring: {
        prompt_version: promptVersion,
        provider,
        model,
        repair_used: repairUsed,
        revenue_model: structured.revenue_model,
        distribution: structured.distribution,
        key_assumptions: structured.key_assumptions,
        open_questions: structured.open_questions,
        missing_evidence: structured.missing_evidence,
        uncertainties: structured.uncertainties,
        structured_at: now.toISOString(),
      },
    },
  };
}

export function formatRevenueModel(revenueModel: StructuredIdea["revenue_model"]): string {
  return `${revenueModel.mechanism} (confidence: ${revenueModel.confidence})`;
}

export function formatDistribution(distribution: StructuredIdea["distribution"]): string {
  return `${distribution.concept} (confidence: ${distribution.confidence})`;
}

/**
 * Merges the ai_structuring patch into an existing metadata jsonb blob
 * without clobbering unrelated keys another subsystem may have written.
 */
export function mergeIdeaMetadata(
  existingMetadata: Record<string, unknown> | null | undefined,
  payload: IdeaUpdatePayload,
): Record<string, unknown> {
  return {
    ...(existingMetadata ?? {}),
    ...payload.metadata_patch,
  };
}
