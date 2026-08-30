import { describe, expect, it } from "vitest";
import { safeJsonParse } from "./json";

describe("safeJsonParse", () => {
  it("parses plain JSON", () => {
    const result = safeJsonParse('{"a":1}');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("strips a markdown JSON code fence before parsing", () => {
    const result = safeJsonParse('```json\n{"a":1}\n```');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("strips a bare code fence without a language tag", () => {
    const result = safeJsonParse('```\n{"a":1}\n```');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("returns a structured error for malformed JSON", () => {
    const result = safeJsonParse("{not json");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("invalid JSON");
    }
  });
});
