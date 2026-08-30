import { OpenAiCompatibleProvider } from "./openai-compatible";

export interface OpenRouterProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class OpenRouterProvider extends OpenAiCompatibleProvider {
  readonly id = "openrouter";

  constructor(config: OpenRouterProviderConfig = {}) {
    super({
      apiKey: config.apiKey ?? process.env.OPENROUTER_API_KEY,
      baseUrl: config.baseUrl ?? "https://openrouter.ai/api/v1",
      fetchImpl: config.fetchImpl,
      timeoutMs: config.timeoutMs,
      extraHeaders: {
        "HTTP-Referer": "https://ideabin.ai",
        "X-Title": "IdeaBin Structuring",
      },
    });
  }
}
