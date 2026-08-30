import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAW_IDEA_FIXTURES } from "../../fixtures/raw-ideas";
import { estimateCostUsd, resolveDefaultRoute, createProvider } from "../router";
import { DeterministicHeuristicProvider } from "../providers/testing";
import { runFixtureHarness } from "./evaluate";

async function main() {
  const route = resolveDefaultRoute();
  const liveProvider = createProvider(route.providerId);
  const hasLiveCredentials = liveProvider.isConfigured();

  if (!hasLiveCredentials) {
    console.log(
      "No live provider credentials found (OPENAI_API_KEY / OPENROUTER_API_KEY unset).\n" +
        "Running the OFFLINE deterministic-heuristic pass only. These results measure\n" +
        "pipeline plumbing validity (schema/validation/repair/bounded-retry), NOT the\n" +
        "quality of any live language model. Zero live provider calls were executed.",
    );

    const offlineReport = await runFixtureHarness({
      fixtures: RAW_IDEA_FIXTURES,
      provider: new DeterministicHeuristicProvider(),
      model: "offline-heuristic-v1",
      mode: "offline",
    });

    printReport("OFFLINE (deterministic heuristic — plumbing check only)", offlineReport);
    writeReport("offline", offlineReport);
    return;
  }

  console.log(`Live credentials found. Running ${RAW_IDEA_FIXTURES.length} fixtures against ${route.providerId}/${route.model}.`);
  const liveReport = await runFixtureHarness({
    fixtures: RAW_IDEA_FIXTURES,
    provider: liveProvider,
    model: route.model,
    mode: "live",
    estimateCostUsd,
    delayMs: 250,
  });

  printReport(`LIVE (${route.providerId}/${route.model})`, liveReport);
  writeReport("live", liveReport);
}

function printReport(label: string, report: Awaited<ReturnType<typeof runFixtureHarness>>) {
  console.log(`\n=== Fixture harness report: ${label} ===`);
  console.log(`Total fixtures:        ${report.totalFixtures}`);
  console.log(`First-pass valid:      ${report.firstPassValidCount}`);
  console.log(`Repair-pass valid:     ${report.repairPassValidCount}`);
  console.log(`Final valid:           ${report.finalValidCount} (${report.finalValidPercent.toFixed(1)}%)`);
  console.log(`Failures:              ${report.failures.length}`);
  if (report.failures.length > 0) {
    console.log("Failure detail:");
    for (const failure of report.failures) {
      console.log(`  - ${failure.id} [${failure.tags.join(",")}]: ${failure.failureReason}`);
    }
  }
  console.log(`Total input tokens:    ${report.totalInputTokens}`);
  console.log(`Total output tokens:   ${report.totalOutputTokens}`);
  console.log(
    `Estimated cost (USD):  ${report.totalEstimatedCostUsd !== undefined ? report.totalEstimatedCostUsd.toFixed(4) : "unknown (model not in pricing table)"}`,
  );
  console.log(`Total latency (ms):    ${report.totalLatencyMs}`);
}

function writeReport(kind: "live" | "offline", report: unknown) {
  const outPath = join(__dirname, "..", "..", "fixtures", `results.${kind}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
