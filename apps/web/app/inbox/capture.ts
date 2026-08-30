import { createPendingStructuringRequest } from "./structuring-contract";

export type InboxCaptureIntent = "raw" | "structure";

export type InboxCaptureDraft = {
  rawInput: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type InboxCaptureFieldErrors = Partial<{
  rawInput: string;
  sourceLabel: string;
  sourceUrl: string;
}>;

export type InboxCaptureInput = InboxCaptureDraft & {
  intent: InboxCaptureIntent;
};

export type InboxCaptureValidationFailure = {
  ok: false;
  fieldErrors: InboxCaptureFieldErrors;
  message: string;
};

export type InboxCaptureValidationSuccess = {
  ok: true;
  draft: InboxCaptureInput;
};

export type InboxCaptureValidationResult =
  | InboxCaptureValidationFailure
  | InboxCaptureValidationSuccess;

export type InboxCaptureStoreRecord = {
  owner_id: string;
  title: string;
  raw_input: string;
  metadata: Record<string, unknown>;
  status: "inbox";
};

export type InboxCaptureStoredIdea = {
  id: string;
  created_at: string;
};

export type InboxCaptureStore = {
  createIdea(record: InboxCaptureStoreRecord): Promise<InboxCaptureStoredIdea>;
};

export type InboxCaptureSuccess = {
  ok: true;
  ideaId: string;
  createdAt: string;
  message: string;
  structuringPending: boolean;
};

export type InboxCaptureFailure = {
  ok: false;
  status: 400 | 401 | 500;
  message: string;
  fieldErrors?: InboxCaptureFieldErrors;
};

export type InboxCaptureResult = InboxCaptureSuccess | InboxCaptureFailure;

export type InboxClaims = {
  sub?: string;
} | null;

export type InboxSubmissionState = {
  isSubmitting: boolean;
};

export type InboxCaptureUiState = {
  draft: InboxCaptureDraft;
  isSubmitting: boolean;
  status: "idle" | "error" | "success" | "saving";
  message: string | null;
  fieldErrors: InboxCaptureFieldErrors;
  savedIdeaId: string | null;
};

export function createEmptyCaptureDraft(): InboxCaptureDraft {
  return {
    rawInput: "",
    sourceLabel: "",
    sourceUrl: "",
  };
}

export function createInitialCaptureUiState(): InboxCaptureUiState {
  return {
    draft: createEmptyCaptureDraft(),
    fieldErrors: {},
    isSubmitting: false,
    message: null,
    savedIdeaId: null,
    status: "idle",
  };
}

export type InboxCaptureUiAction =
  | { type: "draft-updated"; field: keyof InboxCaptureDraft; value: string }
  | { type: "submission-started" }
  | {
      type: "submission-failed";
      message: string;
      fieldErrors?: InboxCaptureFieldErrors;
    }
  | {
      type: "submission-succeeded";
      message: string;
      savedIdeaId: string;
    }
  | { type: "reset" };

export function inboxCaptureReducer(
  state: InboxCaptureUiState,
  action: InboxCaptureUiAction,
): InboxCaptureUiState {
  switch (action.type) {
    case "draft-updated":
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.field]: action.value,
        },
        fieldErrors: {},
        message: null,
        savedIdeaId: null,
        status: "idle",
      };
    case "submission-started":
      if (state.isSubmitting) {
        return state;
      }

      return {
        ...state,
        fieldErrors: {},
        isSubmitting: true,
        message: null,
        savedIdeaId: null,
        status: "saving",
      };
    case "submission-failed":
      return {
        ...state,
        fieldErrors: action.fieldErrors ?? {},
        isSubmitting: false,
        message: action.message,
        status: "error",
      };
    case "submission-succeeded":
      return {
        ...createInitialCaptureUiState(),
        message: action.message,
        savedIdeaId: action.savedIdeaId,
        status: "success",
      };
    case "reset":
      return createInitialCaptureUiState();
    default:
      return state;
  }
}

export function canStartSubmission(state: InboxSubmissionState): boolean {
  return !state.isSubmitting;
}

export function parseInboxCaptureInput(payload: unknown): InboxCaptureInput {
  if (!payload || typeof payload !== "object") {
    return {
      intent: "raw",
      rawInput: "",
      sourceLabel: "",
      sourceUrl: "",
    };
  }

  const record = payload as Record<string, unknown>;

  return {
    intent: record.intent === "structure" ? "structure" : "raw",
    rawInput: typeof record.rawInput === "string" ? record.rawInput : "",
    sourceLabel: typeof record.sourceLabel === "string" ? record.sourceLabel : "",
    sourceUrl: typeof record.sourceUrl === "string" ? record.sourceUrl : "",
  };
}

export function validateInboxCaptureInput(
  input: InboxCaptureInput,
): InboxCaptureValidationResult {
  const fieldErrors: InboxCaptureFieldErrors = {};
  const rawInput = input.rawInput;

  if (rawInput.trim().length === 0) {
    fieldErrors.rawInput = "Paste or type the raw idea before saving.";
  } else if (rawInput.length > 100000) {
    fieldErrors.rawInput = "That idea is too long to save in one capture.";
  }

  if (input.sourceLabel.length > 120) {
    fieldErrors.sourceLabel = "Source labels should stay short.";
  }

  if (input.sourceUrl.trim().length > 0) {
    try {
      normalizeSourceUrlForStorage(input.sourceUrl);
    } catch {
      fieldErrors.sourceUrl = "Enter a valid source URL or leave it blank.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      fieldErrors,
      message: "Fix the highlighted fields and try again.",
    };
  }

  return {
    ok: true,
    draft: {
      intent: input.intent,
      rawInput,
      sourceLabel: input.sourceLabel.trim(),
      sourceUrl: input.sourceUrl.trim(),
    },
  };
}

export function normalizeSourceUrlForStorage(sourceUrl: string): string {
  const trimmed = sourceUrl.trim();
  if (!trimmed) {
    return "";
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return new URL(candidate).toString();
}

export function deriveInboxIdeaTitle(rawInput: string): string {
  const firstLine = rawInput.split(/\r?\n/, 1)[0]?.trim() ?? "";
  const collapsed = firstLine.length > 0 ? firstLine : rawInput.trim().replace(/\s+/g, " ");
  if (collapsed.length <= 80) {
    return collapsed;
  }

  return `${collapsed.slice(0, 77).trimEnd()}...`;
}

export function buildInboxCaptureMetadata(
  draft: InboxCaptureInput,
  requestedAt: string,
): Record<string, unknown> {
  const source: Record<string, string> = {};

  if (draft.sourceLabel) {
    source.label = draft.sourceLabel;
  }

  if (draft.sourceUrl) {
    source.url = normalizeSourceUrlForStorage(draft.sourceUrl);
  }

  const captureMetadata: Record<string, unknown> = {
    intent: draft.intent,
    requested_at: requestedAt,
    source,
  };

  if (draft.intent === "structure") {
    captureMetadata.requested_structuring = createPendingStructuringRequest(requestedAt);
  }

  return {
    capture: captureMetadata,
  };
}

export function getAuthenticatedOwnerId(claims: InboxClaims): string | null {
  const sub = claims?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

export async function saveInboxCapture(input: {
  claims: InboxClaims;
  draft: InboxCaptureInput;
  now?: Date;
  store: InboxCaptureStore;
}): Promise<InboxCaptureResult> {
  const ownerId = getAuthenticatedOwnerId(input.claims);
  if (!ownerId) {
    return {
      ok: false,
      status: 401,
      message: "Your session expired. Sign in again to save ideas.",
    };
  }

  const validation = validateInboxCaptureInput(input.draft);
  if (!validation.ok) {
    return {
      ok: false,
      status: 400,
      fieldErrors: validation.fieldErrors,
      message: validation.message,
    };
  }

  const requestedAt = (input.now ?? new Date()).toISOString();
  const storeRecord: InboxCaptureStoreRecord = {
    owner_id: ownerId,
    raw_input: validation.draft.rawInput,
    status: "inbox",
    title: deriveInboxIdeaTitle(validation.draft.rawInput),
    metadata: buildInboxCaptureMetadata(validation.draft, requestedAt),
  };

  try {
    const created = await input.store.createIdea(storeRecord);
    return {
      ok: true,
      createdAt: created.created_at,
      ideaId: created.id,
      message:
        validation.draft.intent === "structure"
          ? "Saved raw idea. Structure request marked pending."
          : "Saved raw idea.",
      structuringPending: validation.draft.intent === "structure",
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Unable to save your idea right now.",
    };
  }
}
