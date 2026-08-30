export {
  CONFIDENCE_LEVELS,
  StructuredIdeaSchema,
  validateStructuredIdea,
  type ConfidenceLevel,
  type StructuredIdea,
  type StructuredIdeaValidationFailure,
  type StructuredIdeaValidationResult,
  type StructuredIdeaValidationSuccess,
} from "./schema";

export {
  STRUCTURING_PROMPT_VERSION,
  buildRepairPrompt,
  buildStructuringPrompt,
  type StructuringPrompt,
} from "./prompt";

export {
  ProviderCallError,
  type ProviderCallRequest,
  type ProviderCallResult,
  type ProviderErrorKind,
  type StructuringProvider,
} from "./providers/types";
export { OpenAiProvider, type OpenAiProviderConfig } from "./providers/openai";
export { OpenRouterProvider, type OpenRouterProviderConfig } from "./providers/openrouter";

export {
  createProvider,
  estimateCostUsd,
  resolveDefaultRoute,
  type StructuringProviderId,
  type StructuringRouteConfig,
} from "./router";

export {
  structureRawIdea,
  type StructureRawIdeaOptions,
  type StructuringAttempt,
  type StructuringFailure,
  type StructuringResult,
  type StructuringSuccess,
} from "./pipeline";

export {
  buildIdeaUpdatePayload,
  formatDistribution,
  formatRevenueModel,
  mergeIdeaMetadata,
  type AiStructuringMetadata,
  type BuildIdeaUpdatePayloadOptions,
  type IdeaUpdatePayload,
} from "./mapping";

export { buildAiRunLogRow, type AiRunLogRow, type BuildAiRunLogRowOptions } from "./ai-run-log";

export { hashRawInput } from "./hash";

export { safeJsonParse, type JsonParseResult } from "./json";
