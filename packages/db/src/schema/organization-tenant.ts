import { pgTable, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./auth.generated";
import { tenants } from "./shared";

// Server-only control-plane lookup; membership is verified before using it.
export const organizationTenant = pgTable("organization_tenant", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "restrict" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "restrict" }),
});
