import { z } from "zod";

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

const confidenceLevel = z.enum(CONFIDENCE_LEVELS);

function boundedStringArray(max: number) {
  return z.array(z.string().trim().min(1).max(400)).max(max);
}

/**
 * Strict by design: the model cannot smuggle extra keys (e.g. a fabricated
 * "estimated_revenue_usd") past validation. Every economics/feasibility slot
 * that exists here is a {value/confidence-qualified} concept, never a bare
 * number, so honest uncertainty has somewhere to live instead of being
 * rounded away into false precision.
 */
export const StructuredIdeaSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(2000),
    problem: z.string().trim().min(1).max(2000),
    solution: z.string().trim().min(1).max(2000),
    target_user: z.string().trim().min(1).max(1000),
    revenue_model: z
      .object({
        mechanism: z.string().trim().min(1).max(1000),
        confidence: confidenceLevel,
      })
      .strict(),
    distribution: z
      .object({
        concept: z.string().trim().min(1).max(1000),
        confidence: confidenceLevel,
      })
      .strict(),
    tags: boundedStringArray(12),
    key_assumptions: boundedStringArray(10),
    open_questions: boundedStringArray(10),
    missing_evidence: boundedStringArray(10),
    uncertainties: boundedStringArray(10),
  })
  .strict();

export type StructuredIdea = z.infer<typeof StructuredIdeaSchema>;

export interface StructuredIdeaValidationSuccess {
  ok: true;
  data: StructuredIdea;
}

export interface StructuredIdeaValidationFailure {
  ok: false;
  errors: string[];
}

export type StructuredIdeaValidationResult =
  | StructuredIdeaValidationSuccess
  | StructuredIdeaValidationFailure;

export function validateStructuredIdea(candidate: unknown): StructuredIdeaValidationResult {
  const result = StructuredIdeaSchema.safeParse(candidate);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    ),
  };
}
