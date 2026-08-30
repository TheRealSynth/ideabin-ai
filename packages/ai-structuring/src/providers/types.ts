export interface ProviderCallRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface ProviderCallResult {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  finishReason?: string;
}

export type ProviderErrorKind =
  | "missing_credentials"
  | "timeout"
  | "network_error"
  | "provider_error"
  | "malformed_payload"
  | "refusal";

export class ProviderCallError extends Error {
  readonly kind: ProviderErrorKind;
  readonly cause?: unknown;

  constructor(kind: ProviderErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "ProviderCallError";
    this.kind = kind;
    this.cause = cause;
  }
}

export interface StructuringProvider {
  readonly id: string;
  isConfigured(): boolean;
  call(request: ProviderCallRequest): Promise<ProviderCallResult>;
}
