import assert from "node:assert/strict";
import { afterEach, test } from "vitest";
import {
  canStartSubmission,
  createInitialCaptureUiState,
  getAuthenticatedOwnerId,
  inboxCaptureReducer,
  type InboxCaptureStoreRecord,
  parseInboxCaptureInput,
  saveInboxCapture,
  validateInboxCaptureInput,
} from "./capture";

const originalOpenAiKey = process.env.OPENAI_API_KEY;
const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;

afterEach(() => {
  if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAiKey;

  if (originalOpenRouterKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
});

test("rejects empty submission without changing the raw draft", () => {
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

test("persists raw input exactly and keeps source metadata separate", async () => {
  const rawInput = "  First line stays exact.\n\nSecond line follows.\n  ";
  const stored: InboxCaptureStoreRecord[] = [];

  const result = await saveInboxCapture({
    claims: { sub: "user-123" },
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput,
      sourceLabel: "Newsletter",
      sourceUrl: "example.com/piece",
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
  assert.ok(record);
  assert.equal(record.raw_input, rawInput);

  const capture = record.metadata.capture as Record<string, unknown>;
  const source = capture.source as Record<string, string>;
  assert.equal(source.label, "Newsletter");
  assert.equal(source.url, "https://example.com/piece");
});

test("Save Raw has zero AI credential dependency", async () => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  const result = await saveInboxCapture({
    claims: { sub: "user-raw" },
    draft: parseInboxCaptureInput({
      intent: "raw",
      rawInput: "Preserve this without AI.",
      sourceLabel: "",
      sourceUrl: "",
    }),
    store: {
      async createIdea() {
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-raw" };
      },
    },
  });

  assert.equal(result.ok, true);
});

test("Save + Structure records a generic pending request without the obsolete placeholder contract", async () => {
  const stored: InboxCaptureStoreRecord[] = [];

  const result = await saveInboxCapture({
    claims: { sub: "user-structure" },
    draft: parseInboxCaptureInput({
      intent: "structure",
      rawInput: "Persist me before structuring.",
      sourceLabel: "",
      sourceUrl: "",
    }),
    now: new Date("2026-08-30T00:00:00.000Z"),
    store: {
      async createIdea(record) {
        stored.push(record);
        return { created_at: "2026-08-30T00:00:00.000Z", id: "idea-structure" };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.structuringPending, true);
  const record = stored[0];
  assert.ok(record);
  const capture = record.metadata.capture as Record<string, unknown>;
  const pending = capture.requested_structuring as Record<string, unknown>;
  assert.equal(pending.status, "pending");
  assert.equal("contract" in pending, false);
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
