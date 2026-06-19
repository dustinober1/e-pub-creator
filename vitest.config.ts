import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    },
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["packages/**/tests/**/*.test.ts", "apps/local-server/tests/**/*.test.ts"]
        }
      },
      {
        test: {
          name: "web",
          environment: "jsdom",
          setupFiles: ["./apps/web/tests/setup.ts"],
          include: ["apps/web/tests/**/*.test.tsx"]
        }
      }
    ]
  }
});
