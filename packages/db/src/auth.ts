import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";

import type { createDb } from "./index";
import {
  authAccounts,
  authRelations,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from "./schema/auth.generated";

// Use the generated auth models and relations without inventory tables.
// Keep these separate from inventory accounts and memberships.
export const authSchema = {
  authAccounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
};

const relations = { ...defineRelations(authSchema), ...authRelations };

export function createAuthDb(client: ReturnType<typeof createDb>["$client"]) {
  return drizzle({ client, relations });
}
