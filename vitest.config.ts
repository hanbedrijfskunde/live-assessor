import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Default to jsdom for component/integration tests. API tests opt into the
    // Node environment with a `// @vitest-environment node` docblock per file.
    environment: "jsdom",
    // Playwright specs live under e2e/ and must not be picked up by Vitest.
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "app.ts"],
      exclude: ["src/main.tsx", "**/*.d.ts"],
    },
  },
});
