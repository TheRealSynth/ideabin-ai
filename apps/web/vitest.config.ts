import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    // @ideabin/ai-structuring ships TS source (no build step); tell Vite to
    // transform it instead of treating it as a pre-built external module.
    server: {
      deps: {
        inline: ["@ideabin/ai-structuring"],
      },
    },
  },
});
