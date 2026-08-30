import { describe, expect, it } from "vitest";
import { structureRawIdea } from "./pipeline";
import { ProviderCallError } from "./providers/types";
import { ScriptedProvider } from "./providers/testing";

const VALID_JSON = JSON.stringify({
  title: "Idea title",
  summary: "Summary",
  problem: "Problem",
  solution: "Solution",
  target_user: "Target user",
  revenue_model: { mechanism: "unknown", confidence: "low" },
  distribution: { concept: "unknown", confidence: "low" },
  tags: ["tag"],
  key_assumptions: [],
  open_questions: [],
  missing_evidence: [],
  uncertainties: [],
});

const INVALID_JSON = JSON.stringify({ title: "" });

describe("structureRawIdea", () => {
  it("accepts a valid first-attempt model output with no repair", async () => {
    const provider = new ScriptedProvider([{ type: "text", text: VALID_JSON, inputTokens: 100, outputTokens: 50 }]);
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "test-model" });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.repairUsed).toBe(false);
      expect(result.data.title).toBe("Idea title");
    }
    expect(provider.calls).toHaveLength(1);
  });

  it("rejects invalid output and fails cleanly when repair is disabled", async () => {
    const provider = new ScriptedProvider([{ type: "text", text: INVALID_JSON }]);
    const result = await structureRawIdea({
      rawInput: "raw idea",
      provider,
      model: "test-model",
      maxRepairAttempts: 0,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("validation_failed");
    }
    expect(provider.calls).toHaveLength(1);
  });

  it("recovers via one bounded repair attempt when the first output is invalid", async () => {
    const provider = new ScriptedProvider([
      { type: "text", text: INVALID_JSON },
      { type: "text", text: VALID_JSON },
    ]);
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "test-model" });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.repairUsed).toBe(true);
    }
    expect(provider.calls).toHaveLength(2);
  });

  it("fails cleanly when both the initial output and the repair output are invalid", async () => {
    const provider = new ScriptedProvider([
      { type: "text", text: INVALID_JSON },
      { type: "text", text: INVALID_JSON },
    ]);
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "test-model" });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("validation_failed");
    }
    // Exactly initial + one repair call — never more.
    expect(provider.calls).toHaveLength(2);
  });

  it("never exceeds maxRepairAttempts even if every response stays invalid (bounded retries)", async () => {
    const provider = new ScriptedProvider([
      { type: "text", text: INVALID_JSON },
      { type: "text", text: INVALID_JSON },
      { type: "text", text: INVALID_JSON },
      { type: "text", text: INVALID_JSON },
    ]);
    const result = await structureRawIdea({
      rawInput: "raw idea",
      provider,
      model: "test-model",
      maxRepairAttempts: 2,
    });

    expect(result.status).toBe("failed");
    // initial attempt + 2 repair attempts = 3 total, never 4.
    expect(provider.calls).toHaveLength(3);
    if (result.status === "failed") {
      expect(result.attempts).toHaveLength(3);
    }
  });

  it("surfaces a provider_error immediately without attempting repair", async () => {
    const provider = new ScriptedProvider([
      { type: "error", error: new ProviderCallError("provider_error", "boom") },
    ]);
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "test-model" });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("provider_error");
      expect(result.errorKind).toBe("provider_error");
    }
    expect(provider.calls).toHaveLength(1);
  });

  it("surfaces missing_credentials as a provider_error failure, never as a crash", async () => {
    const provider = new ScriptedProvider([{ type: "text", text: VALID_JSON }], { configured: false });
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "test-model" });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errorKind).toBe("missing_credentials");
    }
  });

  it("records prompt version and provider/model identity on every result", async () => {
    const provider = new ScriptedProvider([{ type: "text", text: VALID_JSON }], { id: "my-provider" });
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "my-model" });

    expect(result.provider).toBe("my-provider");
    expect(result.model).toBe("my-model");
    expect(result.promptVersion).toBe("idea-structure-v1");
  });

  it("never mutates the raw input string passed in", async () => {
    const provider = new ScriptedProvider([{ type: "text", text: VALID_JSON }]);
    const rawInput = "original raw text";
    const before = rawInput.slice();
    await structureRawIdea({ rawInput, provider, model: "test-model" });
    expect(rawInput).toBe(before);
  });
});
