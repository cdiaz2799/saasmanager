import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: [/@saasmanager\/.*/],
  },
  entry: "./src/index.ts",
  external: ["bun"],
  format: "esm",
  outDir: "./dist",
});
