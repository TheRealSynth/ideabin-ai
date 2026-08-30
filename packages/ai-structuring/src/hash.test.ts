import { describe, expect, it } from "vitest";
import { hashRawInput } from "./hash";

describe("hashRawInput", () => {
  it("is deterministic for identical input", () => {
    expect(hashRawInput("same text")).toBe(hashRawInput("same text"));
  });

  it("differs for different input", () => {
    expect(hashRawInput("text a")).not.toBe(hashRawInput("text b"));
  });
});
