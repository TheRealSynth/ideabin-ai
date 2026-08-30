import { estimateCostUsd } from "./router";
import type { StructuringAttempt, StructuringResult } from "./pipeline";

export interface AiRunLogRow {
  idea_id: string;
  task_type: "idea_structuring";
  provider: string;
  model: string;
  prompt_version: string;
  input_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  latency_ms: number;
  status: string;
  output: Record<string, unknown>;
}

export interface BuildAiRunLogRowOptions {
  ideaId: string;
  inputVersion: string;
  totalLatencyMs: number;
  result: StructuringResult;
}

/**
 * Pure builder for the `ai_runs` audit row for one structuring attempt
 * (initial call plus any bounded repair calls). Called for both success and
 * failure paths — every structuring attempt gets an append-only row,
 * whether or not the idea was ultimately updated.
 */
export function buildAiRunLogRow(options: BuildAiRunLogRowOptions): AiRunLogRow {
  const { ideaId, inputVersion, totalLatencyMs, result } = options;
  const inputTokens = sumTokens(result.attempts, "input");
  const outputTokens = sumTokens(result.attempts, "output");

  return {
    idea_id: ideaId,
    task_type: "idea_structuring",
    provider: result.provider,
    model: result.model,
    prompt_version: result.promptVersion,
    input_version: inputVersion,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimateCostUsd(result.model, inputTokens, outputTokens) ?? null,
    latency_ms: totalLatencyMs,
    status: buildStatus(result),
    output: buildOutputAudit(result),
  };
}

function buildStatus(result: StructuringResult): string {
  if (result.status === "success") {
    return result.repairUsed ? "success_after_repair" : "success";
  }
  if (result.reason === "provider_error") {
    return `error_${result.errorKind ?? "unknown"}`;
  }
  return "invalid_output";
}

function buildOutputAudit(result: StructuringResult): Record<string, unknown> {
  return {
    attempts: result.attempts.map((attempt) => ({
      attempt: attempt.attempt,
      valid: attempt.validation.ok,
      errors: attempt.validation.ok ? [] : attempt.validation.errors,
    })),
    repair_used: result.status === "success" ? result.repairUsed : result.attempts.length > 1,
    error_message: result.status === "failed" ? (result.errorMessage ?? null) : null,
  };
}

function sumTokens(attempts: StructuringAttempt[], key: "input" | "output"): number | null {
  const values = attempts
    .map((attempt) => (key === "input" ? attempt.tokens.input : attempt.tokens.output))
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}
