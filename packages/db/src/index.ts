import { env } from "@saasmanager/env/server";
import { drizzle } from "drizzle-orm/bun-sql";

import { relations } from "./relations";
import { authRelations } from "./schema/auth.generated";

export function createDb(url: string = env.DATABASE_URL) {
  return drizzle(url, { relations: { ...relations, ...authRelations } });
}

export const db = createDb();
