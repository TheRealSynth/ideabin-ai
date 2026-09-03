import { createSupabaseServerClient } from "../supabase/server";
import {
  prepareEvaluation,
  type EvaluationInput,
  type PreparedEvaluation,
} from "./evaluation";

export type EvaluateIdeaOutcome =
  | {
      status: "evaluated";
      ideaId: string;
      evaluationId: string;
      recommendationId: string;
      prepared: PreparedEvaluation;
    }
  | { status: "unauthorized"; ideaId: string }
  | { status: "not_found"; ideaId: string }
  | { status: "invalid_state"; ideaId: string; currentStatus: string }
  | { status: "invalid_input"; ideaId: string; message: string; fieldErrors: Record<string, string> }
  | { status: "persist_failed"; ideaId: string; stage: "evaluation" | "recommendation" | "idea_status" };

export async function evaluateIdea(ideaId: string, input: EvaluationInput): Promise<EvaluateIdeaOutcome> {
  const validation = prepareEvaluation(input);
  if (!validation.ok) {
    return {
      status: "invalid_input",
      ideaId,
      message: validation.message,
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const ownerId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!ownerId) {
    return { status: "unauthorized", ideaId };
  }

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, status")
    .eq("id", ideaId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!idea) {
    return { status: "not_found", ideaId };
  }

  if (idea.status !== "structured" && idea.status !== "evaluated") {
    return { status: "invalid_state", ideaId, currentStatus: idea.status };
  }

  const prepared = validation.prepared;

  const { data: evaluation, error: evaluationError } = await supabase
    .from("evaluations")
    .insert({
      idea_id: ideaId,
      owner_id: ownerId,
      scoring_model_version: prepared.scoringModelVersion,
      dimensions: prepared.dimensions,
      opportunity_score: prepared.opportunityScore,
      confidence: prepared.confidence,
      rationale: prepared.rationale,
      assumptions: prepared.assumptions,
    })
    .select("id")
    .single();

  if (evaluationError || !evaluation) {
    return { status: "persist_failed", ideaId, stage: "evaluation" };
  }

  const { data: recommendation, error: recommendationError } = await supabase
    .from("recommendations")
    .insert({
      idea_id: ideaId,
      owner_id: ownerId,
      recommendation: prepared.recommendation,
      confidence: prepared.confidence,
      rationale: prepared.recommendationRationale,
      accepted: null,
      override_reason: null,
      decided_at: null,
    })
    .select("id")
    .single();

  if (recommendationError || !recommendation) {
    return { status: "persist_failed", ideaId, stage: "recommendation" };
  }

  const { error: statusError } = await supabase
    .from("ideas")
    .update({ status: "evaluated" })
    .eq("id", ideaId)
    .eq("owner_id", ownerId);

  if (statusError) {
    return { status: "persist_failed", ideaId, stage: "idea_status" };
  }

  return {
    status: "evaluated",
    ideaId,
    evaluationId: evaluation.id,
    recommendationId: recommendation.id,
    prepared,
  };
}
