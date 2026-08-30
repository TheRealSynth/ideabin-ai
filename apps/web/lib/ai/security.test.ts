import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..", "..", "..");
const WEB_APP_DIR = join(REPO_ROOT, "apps", "web", "app");
const WEB_LIB_DIR = join(REPO_ROOT, "apps", "web", "lib");

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next") continue;
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

const SECRET_ENV_NAMES = ["OPENAI_API_KEY", "OPENROUTER_API_KEY"];

describe("no privileged AI credentials leak toward client/browser code", () => {
  it("no client component ('use client') references a provider API key env var", () => {
    const offenders: string[] = [];
    for (const file of walk(WEB_APP_DIR)) {
      const content = readFileSync(file, "utf8");
      const isClientComponent = /^\s*["']use client["'];?/.test(content);
      if (!isClientComponent) continue;
      for (const secretName of SECRET_ENV_NAMES) {
        if (content.includes(secretName)) offenders.push(`${file} references ${secretName}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("provider API keys are never exposed under a NEXT_PUBLIC_ prefix anywhere in apps/web", () => {
    const offenders: string[] = [];
    for (const file of [...walk(WEB_APP_DIR), ...walk(WEB_LIB_DIR)]) {
      const content = readFileSync(file, "utf8");
      for (const secretName of SECRET_ENV_NAMES) {
        if (content.includes(`NEXT_PUBLIC_${secretName}`)) {
          offenders.push(`${file} exposes NEXT_PUBLIC_${secretName}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("provider API key env vars are only read from within the ai-structuring provider adapters", () => {
    const packageProvidersDir = join(REPO_ROOT, "packages", "ai-structuring", "src", "providers");
    const readers: string[] = [];
    for (const file of [...walk(WEB_APP_DIR), ...walk(WEB_LIB_DIR)]) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      const content = readFileSync(file, "utf8");
      for (const secretName of SECRET_ENV_NAMES) {
        if (content.includes(`process.env.${secretName}`)) readers.push(file);
      }
    }
    expect(readers).toEqual([]);
    // Sanity check the assumption itself: the adapters really do read them.
    const openaiAdapter = readFileSync(join(packageProvidersDir, "openai.ts"), "utf8");
    expect(openaiAdapter).toContain("process.env.OPENAI_API_KEY");
  });
});

describe("structuring integration never bypasses RLS for idea access", () => {
  it("structure-idea.ts never constructs a service-role Supabase client", () => {
    const content = readFileSync(join(WEB_LIB_DIR, "ai", "structure-idea.ts"), "utf8");
    expect(content).not.toContain("SERVICE_ROLE");
    expect(content).not.toContain("service_role");
    // The only client it may use is the session-scoped server client, which
    // always filters through Postgres RLS as the authenticated caller.
    expect(content).toContain("createSupabaseServerClient");
  });
});
