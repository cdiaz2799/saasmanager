import { and, eq, sql } from "drizzle-orm";

import type { createDb } from "./index";
import { members, organizations } from "./schema/auth.generated";
import { organizationTenant } from "./schema/organization-tenant";
import { tenants } from "./schema/shared";

export type Database = ReturnType<typeof createDb>;
export type TenantTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export async function withTenantTransaction<T>(
  database: Database,
  tenantId: string,
  callback: (tx: TenantTransaction) => Promise<T>
): Promise<T> {
  return await database.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.tenant_id', ${tenantId}, true)`
    );
    return await callback(tx);
  });
}

// Trusted server operations only. Never expose this helper as a public endpoint.
// The auth hook is not atomic with organization creation, so retries are supported.
export async function provisionOrganizationTenant(
  database: Database,
  organizationId: string
): Promise<string> {
  return await database.transaction(async (tx) => {
    const [org] = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .for("update");
    if (!org) {
      throw new Error("Cannot provision a tenant for a missing organization");
    }
    const [existing] = await tx
      .select()
      .from(organizationTenant)
      .where(eq(organizationTenant.organizationId, organizationId));
    if (existing) {
      return existing.tenantId;
    }
    const tenantId = crypto.randomUUID();
    await tx.execute(
      sql`select set_config('app.tenant_id', ${tenantId}, true)`
    );
    await tx.insert(tenants).values({ id: tenantId });
    await tx.insert(organizationTenant).values({ organizationId, tenantId });
    return tenantId;
  });
}

export async function resolveTenantMembership(
  database: Database,
  userId: string,
  organizationId: string
) {
  const [membership] = await database
    .select()
    .from(members)
    .where(
      and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId)
      )
    );
  if (!membership) {
    return { status: "forbidden" } as const;
  }
  const [mapping] = await database
    .select()
    .from(organizationTenant)
    .where(eq(organizationTenant.organizationId, organizationId));
  if (!mapping) {
    return { status: "unavailable" } as const;
  }
  return { membership, status: "ready", tenantId: mapping.tenantId } as const;
}
