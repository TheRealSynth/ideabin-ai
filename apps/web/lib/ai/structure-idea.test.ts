import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScriptedProvider } from "@ideabin/ai-structuring/testing";
import { ProviderCallError } from "@ideabin/ai-structuring";

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

let scriptedProvider: ScriptedProvider;

vi.mock("@ideabin/ai-structuring", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ideabin/ai-structuring")>();
  return {
    ...actual,
    resolveDefaultRoute: () => ({ providerId: "openai", model: "test-model" }),
    createProvider: () => scriptedProvider,
  };
});

class FakeQueryBuilder {
  constructor(private readonly result: { data?: unknown; error: unknown }) {}
  select() {
    return this;
  }
  eq() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  update(_payload: unknown) {
    updateCalls.push(_payload);
    return this;
  }
  insert(payload: unknown) {
    insertCalls.push(payload);
    return this;
  }
  maybeSingle() {
    return Promise.resolve(this.result);
  }
  then(onfulfilled: (value: { data?: unknown; error: unknown }) => unknown, onrejected?: (reason: unknown) => unknown) {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

let fromCallCounts: Record<string, number>;
let updateCalls: unknown[];
let insertCalls: unknown[];
let fakeResponses: {
  ideasSelect: { data?: unknown; error: unknown };
  ideasUpdate: { error: unknown };
  ideaVersionsSelect: { data?: unknown; error: unknown };
  ideaVersionsInsert: { error: unknown };
};

vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from(table: string) {
      fromCallCounts[table] = (fromCallCounts[table] ?? 0) + 1;
      const callIndex = fromCallCounts[table];
      if (table === "ideas") {
        return new FakeQueryBuilder(callIndex === 1 ? fakeResponses.ideasSelect : fakeResponses.ideasUpdate);
      }
      if (table === "ai_runs") {
        return new FakeQueryBuilder({ error: null });
      }
      if (table === "idea_versions") {
        return new FakeQueryBuilder(
          callIndex === 1 ? fakeResponses.ideaVersionsSelect : fakeResponses.ideaVersionsInsert,
        );
      }
      throw new Error(`unexpected table in test: ${table}`);
    },
  }),
}));

const { structureIdea } = await import("./structure-idea");

beforeEach(() => {
  fromCallCounts = {};
  updateCalls = [];
  insertCalls = [];
  fakeResponses = {
    ideasSelect: { data: { id: "idea-1", raw_input: "Roofer lead-gen idea", metadata: {} }, error: null },
    ideasUpdate: { error: null },
    ideaVersionsSelect: { data: null, error: null },
    ideaVersionsInsert: { error: null },
  };
});

describe("structureIdea", () => {
  it("returns not_found and performs no writes when the RLS-scoped select finds nothing", async () => {
    fakeResponses.ideasSelect = { data: null, error: null };

    const outcome = await structureIdea("idea-missing");

    expect(outcome).toEqual({ status: "not_found", ideaId: "idea-missing" });
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("structures successfully, updates the idea, and logs a success ai_run without touching raw_input", async () => {
    scriptedProvider = new ScriptedProvider(
      [{ type: "text", text: VALID_JSON, inputTokens: 80, outputTokens: 40 }],
      { id: "openai" },
    );

    const outcome = await structureIdea("idea-1");

    expect(outcome).toEqual({ status: "structured", ideaId: "idea-1" });
    expect(updateCalls).toHaveLength(1);

    const updatePayload = updateCalls[0] as Record<string, unknown>;
    expect(updatePayload).not.toHaveProperty("raw_input");
    expect(updatePayload.title).toBe("Idea title");
    expect(updatePayload.status).toBe("structured");

    const aiRunRow = insertCalls.find((row) => (row as any).task_type === "idea_structuring") as any;
    expect(aiRunRow.status).toBe("success");
    expect(aiRunRow.provider).toBe("openai");
    expect(aiRunRow.prompt_version).toBe("idea-structure-v1");

    const versionRow = insertCalls.find((row) => (row as any).snapshot) as any;
    expect(versionRow.snapshot.raw_input).toBe("Roofer lead-gen idea");
    expect(versionRow.version_no).toBe(1);
  });

  it("leaves the idea completely untouched and logs a failed ai_run on a provider outage", async () => {
    scriptedProvider = new ScriptedProvider([
      { type: "error", error: new ProviderCallError("network_error", "simulated outage") },
    ]);

    const outcome = await structureIdea("idea-1");

    expect(outcome).toEqual({ status: "failed", ideaId: "idea-1", reason: "provider_error" });
    // Only the initial select touched the ideas table — no update call.
    expect(fromCallCounts.ideas).toBe(1);
    expect(updateCalls).toHaveLength(0);
    expect(fromCallCounts.idea_versions ?? 0).toBe(0);

    const aiRunRow = insertCalls[0] as any;
    expect(aiRunRow.status).toBe("error_network_error");
  });

  it("reports persist_failed and still logs the ai_run when the idea update itself fails", async () => {
    scriptedProvider = new ScriptedProvider([{ type: "text", text: VALID_JSON }]);
    fakeResponses.ideasUpdate = { error: { message: "db unavailable" } };

    const outcome = await structureIdea("idea-1");

    expect(outcome).toEqual({ status: "failed", ideaId: "idea-1", reason: "persist_failed" });
    const aiRunRow = insertCalls.find((row) => (row as any).task_type === "idea_structuring") as any;
    expect(aiRunRow.status).toBe("persist_failed");
    // No version snapshot is written when persistence failed.
    expect(fromCallCounts.idea_versions ?? 0).toBe(0);
  });

  it("fails cleanly on invalid model output without ever calling ideas.update", async () => {
    scriptedProvider = new ScriptedProvider([
      { type: "text", text: "{}" },
      { type: "text", text: "{}" },
    ]);

    const outcome = await structureIdea("idea-1");

    expect(outcome).toEqual({ status: "failed", ideaId: "idea-1", reason: "validation_failed" });
    expect(updateCalls).toHaveLength(0);
  });
});
