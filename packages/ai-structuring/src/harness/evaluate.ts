import { structureRawIdea, type StructuringResult } from "../pipeline";
import type { StructuringProvider } from "../providers/types";
import type { RawIdeaFixture } from "../../fixtures/raw-ideas";

export interface FixtureOutcome {
  id: string;
  tags: string[];
  firstPassValid: boolean;
  finalValid: boolean;
  repairUsed: boolean;
  failureReason?: string;
}

export interface HarnessReport {
  mode: "live" | "offline";
  providerId: string;
  model: string;
  totalFixtures: number;
  firstPassValidCount: number;
  repairPassValidCount: number;
  finalValidCount: number;
  finalValidPercent: number;
  failures: FixtureOutcome[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number | undefined;
  totalLatencyMs: number;
}

export interface RunFixtureHarnessOptions {
  fixtures: RawIdeaFixture[];
  provider: StructuringProvider;
  model: string;
  mode: "live" | "offline";
  estimateCostUsd?: (model: string, inputTokens?: number | null, outputTokens?: number | null) => number | undefined;
  /** Optional throttle between calls, useful only for live runs against rate-limited APIs. */
  delayMs?: number;
}

/**
 * Runs every fixture through the real structuring pipeline (prompt -> call
 * -> validate -> bounded repair) and tabulates first-pass vs. repair-pass
 * vs. final validity, exactly like production would. The only thing that
 * differs between "live" and "offline" mode is which StructuringProvider is
 * injected — the pipeline code under test is identical either way.
 */
export async function runFixtureHarness(options: RunFixtureHarnessOptions): Promise<HarnessReport> {
  const outcomes: FixtureOutcome[] = [];
  let firstPassValidCount = 0;
  let finalValidCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalLatencyMs = 0;
  let costKnown = false;
  let totalEstimatedCostUsd = 0;

  for (const fixture of options.fixtures) {
    const result: StructuringResult = await structureRawIdea({
      rawInput: fixture.text,
      provider: options.provider,
      model: options.model,
    });

    const firstAttempt = result.attempts[0];
    const firstPassValid = firstAttempt?.validation.ok ?? false;
    const finalValid = result.status === "success";
    if (firstPassValid) firstPassValidCount += 1;
    if (finalValid) finalValidCount += 1;

    for (const attempt of result.attempts) {
      totalInputTokens += attempt.tokens.input ?? 0;
      totalOutputTokens += attempt.tokens.output ?? 0;
      totalLatencyMs += attempt.latencyMs;
    }

    if (options.estimateCostUsd) {
      const inputSum = result.attempts.reduce((sum, a) => sum + (a.tokens.input ?? 0), 0);
      const outputSum = result.attempts.reduce((sum, a) => sum + (a.tokens.output ?? 0), 0);
      const cost = options.estimateCostUsd(options.model, inputSum, outputSum);
      if (cost !== undefined) {
        costKnown = true;
        totalEstimatedCostUsd += cost;
      }
    }

    outcomes.push({
      id: fixture.id,
      tags: fixture.tags,
      firstPassValid,
      finalValid,
      repairUsed: result.status === "success" ? result.repairUsed : result.attempts.length > 1,
      failureReason:
        result.status === "failed"
          ? result.reason === "provider_error"
            ? `provider_error:${result.errorKind}`
            : "validation_failed"
          : undefined,
    });

    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }

  const repairPassValidCount = finalValidCount - firstPassValidCount;

  return {
    mode: options.mode,
    providerId: options.provider.id,
    model: options.model,
    totalFixtures: options.fixtures.length,
    firstPassValidCount,
    repairPassValidCount,
    finalValidCount,
    finalValidPercent: (finalValidCount / options.fixtures.length) * 100,
    failures: outcomes.filter((o) => !o.finalValid),
    totalInputTokens,
    totalOutputTokens,
    totalEstimatedCostUsd: costKnown ? totalEstimatedCostUsd : undefined,
    totalLatencyMs,
  };
}
