import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const servicePath = fileURLToPath(new URL("./evaluate-idea.ts", import.meta.url));

async function source() {
  return readFile(servicePath, "utf8");
}

describe("evaluation service security invariants", () => {
  it("explicitly owner-scopes idea reads and status writes", async () => {
    const text = await source();
    const ownerFilters = text.match(/\.eq\("owner_id", ownerId\)/g) ?? [];
    expect(ownerFilters.length).toBeGreaterThanOrEqual(2);
  });

  it("only inserts immutable evaluation snapshots", async () => {
    const text = await source();
    expect(text).toContain('.from("evaluations")\n    .insert(');
    expect(text).not.toContain('.from("evaluations")\n    .update(');
    expect(text).not.toContain('.from("evaluations")\n    .delete(');
  });

  it("does not expose provider credentials or service-role access", async () => {
    const text = await source();
    expect(text).not.toMatch(/OPENAI_API_KEY|OPENROUTER_API_KEY|NEXT_PUBLIC_.*KEY|service[_-]?role/i);
  });
});
