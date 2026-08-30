import {
  ProviderCallError,
  type ProviderCallRequest,
  type ProviderCallResult,
  type StructuringProvider,
} from "./types";

export interface OpenAiCompatibleConfig {
  apiKey?: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
}

/**
 * Shared transport for any provider that speaks the OpenAI chat-completions
 * wire format (OpenAI itself, OpenRouter, and most self-hosted-compatible
 * gateways). Provider-specific adapters only supply id/env var/base URL —
 * the structuring domain never imports a vendor SDK.
 */
export abstract class OpenAiCompatibleProvider implements StructuringProvider {
  abstract readonly id: string;

  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly extraHeaders: Record<string, string>;

  constructor(config: OpenAiCompatibleConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.extraHeaders = config.extraHeaders ?? {};
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async call(request: ProviderCallRequest): Promise<ProviderCallResult> {
    if (!this.apiKey) {
      throw new ProviderCallError(
        "missing_credentials",
        `${this.id} provider has no API key configured`,
      );
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
          ...this.extraHeaders,
        },
        body: JSON.stringify({
          model: request.model,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxOutputTokens ?? 1400,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderCallError(
          "timeout",
          `${this.id} request timed out after ${this.timeoutMs}ms`,
          error,
        );
      }
      throw new ProviderCallError("network_error", `${this.id} request failed`, error);
    } finally {
      clearTimeout(timeoutHandle);
    }

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const body = await safeReadText(response);
      throw new ProviderCallError(
        "provider_error",
        `${this.id} responded ${response.status}: ${body.slice(0, 500)}`,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new ProviderCallError(
        "malformed_payload",
        `${this.id} response was not valid JSON`,
        error,
      );
    }

    const choice = (payload as any)?.choices?.[0];
    const text = choice?.message?.content;
    if (typeof text !== "string") {
      throw new ProviderCallError(
        "malformed_payload",
        `${this.id} response is missing message content`,
      );
    }

    if (choice?.finish_reason === "content_filter") {
      throw new ProviderCallError("refusal", `${this.id} refused the request (content_filter)`);
    }

    const usage = (payload as any)?.usage;

    return {
      text,
      inputTokens: typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
      outputTokens:
        typeof usage?.completion_tokens === "number" ? usage.completion_tokens : undefined,
      latencyMs,
      finishReason: choice?.finish_reason,
    };
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
