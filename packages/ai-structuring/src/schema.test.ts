import { describe, expect, it } from "vitest";
import { validateStructuredIdea } from "./schema";

const VALID_CANDIDATE = {
  title: "Roofer lead-gen service",
  summary: "Helps small roofing companies get more inbound leads.",
  problem: "Small roofers struggle to find consistent, qualified leads.",
  solution: "A local-search-optimized lead capture and routing service.",
  target_user: "Independent and small-team roofing contractors.",
  revenue_model: { mechanism: "Per-lead fee, amount unknown", confidence: "low" },
  distribution: { concept: "Local SEO and contractor referral network", confidence: "medium" },
  tags: ["local-business", "lead-generation"],
  key_assumptions: ["Roofers will pay per qualified lead."],
  open_questions: ["What is a fair price per lead?"],
  missing_evidence: ["No data on roofer willingness to pay."],
  uncertainties: ["Target geography is unspecified."],
};

describe("validateStructuredIdea", () => {
  it("accepts a well-formed candidate", () => {
    const result = validateStructuredIdea(VALID_CANDIDATE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe(VALID_CANDIDATE.title);
      expect(result.data.revenue_model.confidence).toBe("low");
    }
  });

  it("rejects a candidate missing a required field", () => {
    const { title, ...withoutTitle } = VALID_CANDIDATE;
    const result = validateStructuredIdea(withoutTitle);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((err) => err.startsWith("title"))).toBe(true);
    }
  });

  it("rejects an invalid confidence enum value", () => {
    const result = validateStructuredIdea({
      ...VALID_CANDIDATE,
      revenue_model: { mechanism: "unknown", confidence: "certain" },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects fabricated numeric precision fields not in the schema", () => {
    const result = validateStructuredIdea({
      ...VALID_CANDIDATE,
      estimated_revenue_usd: 147000,
      tam_usd: 1_200_000_000,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-object candidate (e.g. a bare string)", () => {
    const result = validateStructuredIdea("not an object");
    expect(result.ok).toBe(false);
  });

  it("rejects an empty-string required field", () => {
    const result = validateStructuredIdea({ ...VALID_CANDIDATE, problem: "" });
    expect(result.ok).toBe(false);
  });

  it("accepts empty arrays for optional-content list fields", () => {
    const result = validateStructuredIdea({
      ...VALID_CANDIDATE,
      tags: [],
      key_assumptions: [],
      open_questions: [],
      missing_evidence: [],
      uncertainties: [],
    });
    expect(result.ok).toBe(true);
  });
});
