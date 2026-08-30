import { OpenAiCompatibleProvider } from "./openai-compatible";

export interface OpenAiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class OpenAiProvider extends OpenAiCompatibleProvider {
  readonly id = "openai";

  constructor(config: OpenAiProviderConfig = {}) {
    super({
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
      baseUrl: config.baseUrl ?? "https://api.openai.com/v1",
      fetchImpl: config.fetchImpl,
      timeoutMs: config.timeoutMs,
    });
  }
}
