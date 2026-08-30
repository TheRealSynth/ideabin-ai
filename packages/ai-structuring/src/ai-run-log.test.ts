import { describe, expect, it } from "vitest";
import { buildAiRunLogRow } from "./ai-run-log";
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
  tags: [],
  key_assumptions: [],
  open_questions: [],
  missing_evidence: [],
  uncertainties: [],
});

describe("buildAiRunLogRow", () => {
  it("logs a success run with provider/model/prompt-version and token totals", async () => {
    const provider = new ScriptedProvider(
      [{ type: "text", text: VALID_JSON, inputTokens: 120, outputTokens: 60 }],
      { id: "openai" },
    );
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "gpt-4o-mini" });

    const row = buildAiRunLogRow({
      ideaId: "idea-1",
      inputVersion: "hash-abc",
      totalLatencyMs: 250,
      result,
    });

    expect(row.idea_id).toBe("idea-1");
    expect(row.task_type).toBe("idea_structuring");
    expect(row.provider).toBe("openai");
    expect(row.model).toBe("gpt-4o-mini");
    expect(row.prompt_version).toBe("idea-structure-v1");
    expect(row.input_version).toBe("hash-abc");
    expect(row.input_tokens).toBe(120);
    expect(row.output_tokens).toBe(60);
    expect(row.status).toBe("success");
    expect(row.latency_ms).toBe(250);
    expect(row.output.attempts).toHaveLength(1);
  });

  it("logs a validation failure run distinctly from a provider-error run", async () => {
    const invalidProvider = new ScriptedProvider(
      [
        { type: "text", text: "{}" },
        { type: "text", text: "{}" },
      ],
      { id: "openai" },
    );
    const invalidResult = await structureRawIdea({ rawInput: "raw idea", provider: invalidProvider, model: "gpt-4o-mini" });
    const invalidRow = buildAiRunLogRow({ ideaId: "idea-1", inputVersion: "hash-abc", totalLatencyMs: 10, result: invalidResult });
    expect(invalidRow.status).toBe("invalid_output");
    expect(invalidRow.output.error_message).toBeNull();

    const errorProvider = new ScriptedProvider(
      [{ type: "error", error: new ProviderCallError("timeout", "too slow") }],
      { id: "openai" },
    );
    const errorResult = await structureRawIdea({ rawInput: "raw idea", provider: errorProvider, model: "gpt-4o-mini" });
    const errorRow = buildAiRunLogRow({ ideaId: "idea-1", inputVersion: "hash-abc", totalLatencyMs: 10, result: errorResult });
    expect(errorRow.status).toBe("error_timeout");
    expect(errorRow.output.error_message).toContain("too slow");
  });

  it("marks repair usage in the logged output audit", async () => {
    const provider = new ScriptedProvider([
      { type: "text", text: "{}" },
      { type: "text", text: VALID_JSON },
    ]);
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "gpt-4o-mini" });
    const row = buildAiRunLogRow({ ideaId: "idea-1", inputVersion: "hash-abc", totalLatencyMs: 10, result });

    expect(row.status).toBe("success_after_repair");
    expect(row.output.repair_used).toBe(true);
    expect(row.output.attempts).toHaveLength(2);
  });

  it("returns null estimated cost for an unrecognized model rather than fabricating one", async () => {
    const provider = new ScriptedProvider([{ type: "text", text: VALID_JSON, inputTokens: 10, outputTokens: 5 }]);
    const result = await structureRawIdea({ rawInput: "raw idea", provider, model: "unlisted-model" });
    const row = buildAiRunLogRow({ ideaId: "idea-1", inputVersion: "hash-abc", totalLatencyMs: 10, result });

    expect(row.estimated_cost_usd).toBeNull();
  });
});
