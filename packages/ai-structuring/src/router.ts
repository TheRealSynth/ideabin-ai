import { OpenAiProvider } from "./providers/openai";
import { OpenRouterProvider } from "./providers/openrouter";
import type { StructuringProvider } from "./providers/types";

export type StructuringProviderId = "openai" | "openrouter";

export interface StructuringRouteConfig {
  providerId: StructuringProviderId;
  model: string;
}

/**
 * Cheapest-competent default per provider. Override via AI_STRUCTURING_MODEL
 * for a different model, or AI_STRUCTURING_PROVIDER to force a provider.
 * Do not upgrade these to a frontier model without a documented reason —
 * this task is bulk JSON structuring, not creative reasoning.
 */
const DEFAULT_MODEL_BY_PROVIDER: Record<StructuringProviderId, string> = {
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
};

export function resolveDefaultRoute(env: NodeJS.ProcessEnv = process.env): StructuringRouteConfig {
  const configuredProvider = env.AI_STRUCTURING_PROVIDER?.trim().toLowerCase();
  const configuredModel = env.AI_STRUCTURING_MODEL?.trim();

  if (configuredProvider === "openrouter" || configuredProvider === "openai") {
    const providerId = configuredProvider as StructuringProviderId;
    return { providerId, model: configuredModel || DEFAULT_MODEL_BY_PROVIDER[providerId] };
  }

  // Auto-select by whichever credential is actually present, preferring
  // OpenAI direct (fewer hops) and falling back to OpenRouter.
  if (env.OPENAI_API_KEY) {
    return { providerId: "openai", model: configuredModel || DEFAULT_MODEL_BY_PROVIDER.openai };
  }
  if (env.OPENROUTER_API_KEY) {
    return { providerId: "openrouter", model: configuredModel || DEFAULT_MODEL_BY_PROVIDER.openrouter };
  }

  // Nothing configured. Default to OpenAI so the caller gets an explicit
  // ProviderCallError("missing_credentials", ...) instead of a silent,
  // unexplained failure further down the pipeline.
  return { providerId: "openai", model: configuredModel || DEFAULT_MODEL_BY_PROVIDER.openai };
}

export function createProvider(providerId: StructuringProviderId): StructuringProvider {
  switch (providerId) {
    case "openai":
      return new OpenAiProvider();
    case "openrouter":
      return new OpenRouterProvider();
    default: {
      const exhaustive: never = providerId;
      throw new Error(`Unknown structuring provider: ${exhaustive}`);
    }
  }
}

/**
 * Approximate published per-token pricing (USD per 1K tokens), current as of
 * this mission's authoring. These are estimates for audit/reporting only —
 * never billing-accurate, and must be treated as such by callers.
 */
const APPROX_USD_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
};

export function estimateCostUsd(
  model: string,
  inputTokens?: number | null,
  outputTokens?: number | null,
): number | undefined {
  const rate = APPROX_USD_PER_1K_TOKENS[model];
  if (!rate || inputTokens == null || outputTokens == null) return undefined;
  return (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
}
