import path from "node:path";
import { defineConfig } from "vitest/config";
import "dotenv/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: process.env,
    globalSetup: "vitest.globalSetup.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
