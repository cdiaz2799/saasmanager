import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// The Better Auth CLI (`auth generate`) loads this module to read the auth
// instance. Loading `./src/index.ts` pulls in `@saasmanager/env/server`, which
// validates the runtime env, so seed `process.env` from the server app's `.env`
// first — mirrors what `packages/db/drizzle.config.ts` does for drizzle-kit.
config({
  path: fileURLToPath(new URL("../../apps/server/.env", import.meta.url)),
});

export const { auth } = await import("./src/index");
