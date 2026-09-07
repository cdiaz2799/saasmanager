import { rm } from "node:fs/promises";
import { build, file } from "bun";

const { dependencies }: { dependencies: Record<string, string> } = await file(
  new URL("./package.json", import.meta.url)
).json();

const external = Object.entries(dependencies)
  .filter(([, version]) => !version.startsWith("workspace:"))
  .map(([name]) => name);

await rm(new URL("./dist", import.meta.url), { force: true, recursive: true });

await build({
  entrypoints: [new URL("./src/index.ts", import.meta.url).pathname],
  external,
  format: "esm",
  naming: "index.mjs",
  outdir: new URL("./dist", import.meta.url).pathname,
  target: "bun",
});
