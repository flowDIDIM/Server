import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/app.ts",
  outDir: "dist",
  dts: { sourcemap: true },
  target: false,
});
