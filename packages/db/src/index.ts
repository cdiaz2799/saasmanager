import { env } from "@saasmanager/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import { authRelations } from "./schema/auth";

export function createDb() {
  return drizzle(env.DATABASE_URL, { relations: authRelations });
}

export const db = createDb();
