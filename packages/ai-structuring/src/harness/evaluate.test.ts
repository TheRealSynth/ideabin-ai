import { describe, expect, it } from "vitest";
import { RAW_IDEA_FIXTURES } from "../../fixtures/raw-ideas";
import { DeterministicHeuristicProvider } from "../providers/testing";
import { runFixtureHarness } from "./evaluate";

describe("runFixtureHarness (offline deterministic provider)", () => {
  it("has exactly 100 fixtures with no duplicate ids", () => {
    expect(RAW_IDEA_FIXTURES).toHaveLength(100);
    const ids = new Set(RAW_IDEA_FIXTURES.map((f) => f.id));
    expect(ids.size).toBe(100);
  });

  it(
    "the offline heuristic path (pipeline plumbing, not live model quality) reaches " +
      "the >=90% schema-valid target across all 100 fixtures",
    async () => {
      const report = await runFixtureHarness({
        fixtures: RAW_IDEA_FIXTURES,
        provider: new DeterministicHeuristicProvider(),
        model: "offline-heuristic-v1",
        mode: "offline",
      });

      expect(report.mode).toBe("offline");
      expect(report.totalFixtures).toBe(100);
      expect(report.finalValidCount).toBeGreaterThanOrEqual(90);
      expect(report.failures.length).toBeLessThanOrEqual(10);
    },
  );

  it("never mutates any fixture's raw text while processing all 100", async () => {
    const snapshot = RAW_IDEA_FIXTURES.map((f) => f.text);
    await runFixtureHarness({
      fixtures: RAW_IDEA_FIXTURES,
      provider: new DeterministicHeuristicProvider(),
      model: "offline-heuristic-v1",
      mode: "offline",
    });
    expect(RAW_IDEA_FIXTURES.map((f) => f.text)).toEqual(snapshot);
  });
});
