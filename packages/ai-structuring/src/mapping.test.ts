import { describe, expect, it } from "vitest";
import { buildIdeaUpdatePayload, mergeIdeaMetadata } from "./mapping";
import type { StructuredIdea } from "./schema";

const STRUCTURED: StructuredIdea = {
  title: "Title",
  summary: "Summary",
  problem: "Problem",
  solution: "Solution",
  target_user: "Target user",
  revenue_model: { mechanism: "per-lead fee, amount unknown", confidence: "low" },
  distribution: { concept: "local SEO", confidence: "medium" },
  tags: ["local-business"],
  key_assumptions: ["assumption"],
  open_questions: ["question"],
  missing_evidence: ["evidence gap"],
  uncertainties: ["uncertainty"],
};

describe("buildIdeaUpdatePayload", () => {
  it("never includes a raw_input key — original text stays untouched by structuring", () => {
    const payload = buildIdeaUpdatePayload({
      structured: STRUCTURED,
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "idea-structure-v1",
      repairUsed: false,
    });

    expect(payload).not.toHaveProperty("raw_input");
    expect(JSON.stringify(payload)).not.toContain("raw_input");
  });

  it("keeps user-facing normalized columns and AI provenance metadata distinguishable", () => {
    const payload = buildIdeaUpdatePayload({
      structured: STRUCTURED,
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "idea-structure-v1",
      repairUsed: true,
      now: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(payload.title).toBe("Title");
    expect(payload.status).toBe("structured");

    const aiMeta = payload.metadata_patch.ai_structuring;
    expect(aiMeta.provider).toBe("openai");
    expect(aiMeta.model).toBe("gpt-4o-mini");
    expect(aiMeta.prompt_version).toBe("idea-structure-v1");
    expect(aiMeta.repair_used).toBe(true);
    expect(aiMeta.structured_at).toBe("2026-01-01T00:00:00.000Z");
    expect(aiMeta.key_assumptions).toEqual(["assumption"]);
  });

  it("formats revenue_model/distribution text columns with an explicit confidence marker", () => {
    const payload = buildIdeaUpdatePayload({
      structured: STRUCTURED,
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "idea-structure-v1",
      repairUsed: false,
    });

    expect(payload.revenue_model).toBe("per-lead fee, amount unknown (confidence: low)");
    expect(payload.distribution).toBe("local SEO (confidence: medium)");
  });
});

describe("mergeIdeaMetadata", () => {
  it("preserves unrelated existing metadata keys written by another subsystem", () => {
    const payload = buildIdeaUpdatePayload({
      structured: STRUCTURED,
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "idea-structure-v1",
      repairUsed: false,
    });

    const merged = mergeIdeaMetadata({ scoring: { some: "value" } }, payload);
    expect(merged.scoring).toEqual({ some: "value" });
    expect(merged.ai_structuring).toBeDefined();
  });

  it("handles null/undefined existing metadata", () => {
    const payload = buildIdeaUpdatePayload({
      structured: STRUCTURED,
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "idea-structure-v1",
      repairUsed: false,
    });

    expect(mergeIdeaMetadata(null, payload).ai_structuring).toBeDefined();
    expect(mergeIdeaMetadata(undefined, payload).ai_structuring).toBeDefined();
  });
});
