import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canStartSubmission,
  createEmptyCaptureDraft,
  createInitialCaptureUiState,
  deriveInboxIdeaTitle,
  getAuthenticatedOwnerId,
  inboxCaptureReducer,
  type InboxCaptureStoreRecord,
  normalizeSourceUrlForStorage,
  parseInboxCaptureInput,
  saveInboxCapture,
  validateInboxCaptureInput,
} from "./capture";

test("rejects empty submission without changing the draft contract", () => {
  const draft = parseInboxCaptureInput({
    intent: "raw",
    rawInput: "   \n\t  ",
    sourceLabel: "Podcast",
    sourceUrl: "example.com",
  });

  const result = validateInboxCaptureInput(draft);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.fieldErrors.rawInput, "Paste or type the raw idea before saving.");
    assert.equal(draft.rawInput, "   \n\t  ");
  }
});

test("valid raw input is preserved exactly, including whitespace and newlines", async () => {
  const rawInput = "  First line stays exact.\n\nSecond line follows.\n  ";
  const stored: InboxCaptureStoreRecord[] = [];

  const result = await saveInboxCapture({
    claims: { sub: "user-123" },
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput,
      sourceLabel: "Newsletter",
      sourceUrl: "https://example.com/piece",
    }),
    now: new Date("2026-08-30T00:00:00.000Z"),
    store: {
      async createIdea(record) {
        stored.push(record);
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-1" };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(stored.length, 1);
  const record = stored[0];
  if (!record) {
    throw new Error("Expected capture record to be stored.");
  }

  assert.equal(record.raw_input, rawInput);
  assert.equal(record.owner_id, "user-123");
});

test("long realistic idea text saves successfully", async () => {
  const rawInput = Array.from({ length: 220 }, (_, index) => `Idea line ${index + 1}: build a faster capture lane.`).join(
    "\n",
  );

  const result = await saveInboxCapture({
    claims: { sub: "user-456" },
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput,
      sourceLabel: "Brain dump",
      sourceUrl: "",
    }),
    store: {
      async createIdea(record) {
        assert.equal(record.raw_input, rawInput);
        assert.equal(record.title.startsWith("Idea line 1"), true);
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-2" };
      },
    },
  });

  assert.equal(result.ok, true);
});

test("source metadata stays separate from raw input", async () => {
  const stored: InboxCaptureStoreRecord[] = [];

  const result = await saveInboxCapture({
    claims: { sub: "user-789" },
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput: "Ship the simplest inbox possible.",
      sourceLabel: "Podcast episode",
      sourceUrl: "www.example.com/episode",
    }),
    now: new Date("2026-08-30T00:00:00.000Z"),
    store: {
      async createIdea(input) {
        stored.push(input);
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-3" };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(stored.length, 1);
  const record = stored[0];
  if (!record) {
    throw new Error("Expected capture record to be stored.");
  }

  assert.equal(record.raw_input, "Ship the simplest inbox possible.");
  assert.equal((record.metadata as Record<string, unknown>).capture !== undefined, true);
  const metadata = (record.metadata as Record<string, unknown>).capture as Record<string, unknown>;
  const source = metadata.source as Record<string, string>;
  assert.equal(source.label, "Podcast episode");
  assert.equal(source.url, "https://www.example.com/episode");
});

test("Save Raw works without AI environment variables", async () => {
  const savedEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  };

  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  const result = await saveInboxCapture({
    claims: { sub: "user-999" },
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput: "No model keys required for preservation.",
      sourceLabel: "",
      sourceUrl: "",
    }),
    store: {
      async createIdea() {
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-4" };
      },
    },
  });

  process.env.OPENAI_API_KEY = savedEnv.OPENAI_API_KEY;
  process.env.OPENROUTER_API_KEY = savedEnv.OPENROUTER_API_KEY;

  assert.equal(result.ok, true);
});

test("Save + Structure marks a pending structuring request without blocking raw capture", async () => {
  const stored: InboxCaptureStoreRecord[] = [];

  const result = await saveInboxCapture({
    claims: { sub: "user-structure" },
    draft: parseInboxCaptureInput({
      intent: "structure",
      rawInput: "Queue this for future structuring.",
      sourceLabel: "",
      sourceUrl: "",
    }),
    now: new Date("2026-08-30T00:00:00.000Z"),
    store: {
      async createIdea(input) {
        stored.push(input);
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-5" };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(stored.length, 1);
  const record = stored[0];
  if (!record) {
    throw new Error("Expected capture record to be stored.");
  }

  const capture = (record.metadata as Record<string, unknown>).capture as Record<string, unknown>;
  assert.equal((capture.requested_structuring as Record<string, unknown>).status, "pending");
});

test("duplicate-submit protection keeps the submission lock engaged", () => {
  const first = inboxCaptureReducer(createInitialCaptureUiState(), {
    type: "submission-started",
  });
  const second = inboxCaptureReducer(first, {
    type: "submission-started",
  });

  assert.equal(canStartSubmission(first), false);
  assert.deepEqual(second, first);
});

test("validation errors keep the draft in place for a retry", () => {
  const initial = {
    ...createInitialCaptureUiState(),
    draft: {
      rawInput: "Need to keep this draft.",
      sourceLabel: "Slack",
      sourceUrl: "https://example.com/thread",
    },
  };

  const failed = inboxCaptureReducer(initial, {
    type: "submission-failed",
    fieldErrors: { rawInput: "Fix it." },
    message: "Fix the highlighted fields and try again.",
  });

  assert.equal(failed.draft.rawInput, "Need to keep this draft.");
  assert.equal(failed.status, "error");
  assert.equal(failed.fieldErrors.rawInput, "Fix it.");
});

test("unauthorized path requires an authenticated owner", async () => {
  assert.equal(getAuthenticatedOwnerId(null), null);
  assert.equal(getAuthenticatedOwnerId({}), null);
  assert.equal(getAuthenticatedOwnerId({ sub: "user-1" }), "user-1");

  const result = await saveInboxCapture({
    claims: null,
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput: "This should not save.",
      sourceLabel: "",
      sourceUrl: "",
    }),
    store: {
      async createIdea() {
        throw new Error("should not be called");
      },
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("utility helpers remain stable", () => {
  assert.equal(createEmptyCaptureDraft().rawInput, "");
  assert.equal(deriveInboxIdeaTitle("A short title"), "A short title");
  assert.equal(normalizeSourceUrlForStorage("example.com"), "https://example.com/");
});
