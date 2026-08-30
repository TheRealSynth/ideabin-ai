import { safeJsonParse } from "./json";
import { buildRepairPrompt, buildStructuringPrompt, STRUCTURING_PROMPT_VERSION } from "./prompt";
import { ProviderCallError, type ProviderErrorKind, type StructuringProvider } from "./providers/types";
import {
  validateStructuredIdea,
  type StructuredIdea,
  type StructuredIdeaValidationResult,
} from "./schema";

export interface StructuringAttempt {
  attempt: number;
  rawText: string;
  validation: StructuredIdeaValidationResult;
  tokens: { input?: number; output?: number };
  latencyMs: number;
}

interface StructuringResultBase {
  attempts: StructuringAttempt[];
  provider: string;
  model: string;
  promptVersion: string;
}

export interface StructuringSuccess extends StructuringResultBase {
  status: "success";
  data: StructuredIdea;
  repairUsed: boolean;
}

export interface StructuringFailure extends StructuringResultBase {
  status: "failed";
  reason: "validation_failed" | "provider_error";
  errorKind?: ProviderErrorKind;
  errorMessage?: string;
}

export type StructuringResult = StructuringSuccess | StructuringFailure;

export interface StructureRawIdeaOptions {
  rawInput: string;
  provider: StructuringProvider;
  model: string;
  promptVersion?: string;
  /** Bounded, explicit repair attempts. Default 1 (initial call + one repair call, max). */
  maxRepairAttempts?: number;
}

/**
 * Runs the full structuring pipeline for one raw idea against one provider
 * call: build prompt -> call provider -> parse JSON -> validate against the
 * schema -> if invalid, one bounded repair round -> validate again -> fail
 * cleanly. Never loops beyond maxRepairAttempts; never mutates its input.
 */
export async function structureRawIdea(options: StructureRawIdeaOptions): Promise<StructuringResult> {
  const promptVersion = options.promptVersion ?? STRUCTURING_PROMPT_VERSION;
  const maxRepairAttempts = Math.max(0, options.maxRepairAttempts ?? 1);
  const attempts: StructuringAttempt[] = [];

  const initialPrompt = buildStructuringPrompt(options.rawInput);
  const initialCall = await callProvider(options.provider, options.model, initialPrompt);
  if (!initialCall.ok) {
    return {
      status: "failed",
      reason: "provider_error",
      attempts,
      errorKind: initialCall.error.kind,
      errorMessage: initialCall.error.message,
      provider: options.provider.id,
      model: options.model,
      promptVersion,
    };
  }

  let lastRawText = initialCall.result.text;
  let validation = parseAndValidate(lastRawText);
  attempts.push({
    attempt: 1,
    rawText: lastRawText,
    validation,
    tokens: { input: initialCall.result.inputTokens, output: initialCall.result.outputTokens },
    latencyMs: initialCall.result.latencyMs,
  });

  let repairRound = 0;
  while (!validation.ok && repairRound < maxRepairAttempts) {
    repairRound += 1;
    const repairPrompt = buildRepairPrompt(options.rawInput, lastRawText, validation.errors);
    const repairCall = await callProvider(options.provider, options.model, repairPrompt);
    if (!repairCall.ok) {
      return {
        status: "failed",
        reason: "provider_error",
        attempts,
        errorKind: repairCall.error.kind,
        errorMessage: repairCall.error.message,
        provider: options.provider.id,
        model: options.model,
        promptVersion,
      };
    }
    lastRawText = repairCall.result.text;
    validation = parseAndValidate(lastRawText);
    attempts.push({
      attempt: repairRound + 1,
      rawText: lastRawText,
      validation,
      tokens: { input: repairCall.result.inputTokens, output: repairCall.result.outputTokens },
      latencyMs: repairCall.result.latencyMs,
    });
  }

  if (!validation.ok) {
    return {
      status: "failed",
      reason: "validation_failed",
      attempts,
      provider: options.provider.id,
      model: options.model,
      promptVersion,
    };
  }

  return {
    status: "success",
    data: validation.data,
    attempts,
    repairUsed: repairRound > 0,
    provider: options.provider.id,
    model: options.model,
    promptVersion,
  };
}

function parseAndValidate(rawText: string): StructuredIdeaValidationResult {
  const parsed = safeJsonParse(rawText);
  if (!parsed.ok) {
    return { ok: false, errors: [parsed.error] };
  }
  return validateStructuredIdea(parsed.value);
}

type ProviderCallOutcome =
  | { ok: true; result: Awaited<ReturnType<StructuringProvider["call"]>> }
  | { ok: false; error: ProviderCallError };

async function callProvider(
  provider: StructuringProvider,
  model: string,
  prompt: { systemPrompt: string; userPrompt: string },
): Promise<ProviderCallOutcome> {
  try {
    const result = await provider.call({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      model,
    });
    return { ok: true, result };
  } catch (error) {
    if (error instanceof ProviderCallError) {
      return { ok: false, error };
    }
    // Unexpected programming error inside a provider adapter — do not
    // silently swallow it as a "provider_error"; classify it distinctly so
    // it surfaces during development rather than masquerading as a normal
    // recoverable failure.
    return {
      ok: false,
      error: new ProviderCallError(
        "network_error",
        error instanceof Error ? error.message : String(error),
        error,
      ),
    };
  }
}
