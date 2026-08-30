import { describe, expect, it } from "vitest";
import { estimateCostUsd, resolveDefaultRoute } from "./router";

describe("resolveDefaultRoute", () => {
  it("defaults to openai/gpt-4o-mini when no credentials or overrides are present", () => {
    const route = resolveDefaultRoute({} as NodeJS.ProcessEnv);
    expect(route).toEqual({ providerId: "openai", model: "gpt-4o-mini" });
  });

  it("auto-selects openrouter when only its credential is present", () => {
    const route = resolveDefaultRoute({ OPENROUTER_API_KEY: "key" } as NodeJS.ProcessEnv);
    expect(route.providerId).toBe("openrouter");
    expect(route.model).toBe("openai/gpt-4o-mini");
  });

  it("prefers openai when both credentials are present", () => {
    const route = resolveDefaultRoute({
      OPENAI_API_KEY: "a",
      OPENROUTER_API_KEY: "b",
    } as NodeJS.ProcessEnv);
    expect(route.providerId).toBe("openai");
  });

  it("honors an explicit provider override even without its credential present", () => {
    const route = resolveDefaultRoute({ AI_STRUCTURING_PROVIDER: "openrouter" } as NodeJS.ProcessEnv);
    expect(route.providerId).toBe("openrouter");
  });

  it("honors an explicit model override", () => {
    const route = resolveDefaultRoute({
      OPENAI_API_KEY: "a",
      AI_STRUCTURING_MODEL: "gpt-custom",
    } as NodeJS.ProcessEnv);
    expect(route.model).toBe("gpt-custom");
  });
});

describe("estimateCostUsd", () => {
  it("computes an approximate cost for a known model", () => {
    const cost = estimateCostUsd("gpt-4o-mini", 1000, 1000);
    expect(cost).toBeCloseTo(0.00015 + 0.0006, 6);
  });

  it("returns undefined when token counts are unavailable", () => {
    expect(estimateCostUsd("gpt-4o-mini", undefined, undefined)).toBeUndefined();
  });

  it("returns undefined for an unrecognized model rather than guessing", () => {
    expect(estimateCostUsd("some-other-model", 100, 100)).toBeUndefined();
  });
});
