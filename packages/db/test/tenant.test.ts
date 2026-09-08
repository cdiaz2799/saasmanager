import { afterAll, beforeAll, expect, test } from "bun:test";
import { createORPCClient } from "@orpc/client";
import { call } from "@orpc/server";
import { file, SQL } from "bun";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { z } from "zod";
import type { AppRouterClient } from "../../api/src/routers/index";

// This suite only targets the documented disposable local database.
const adminUrl =
  "postgres://postgres:local-isolation-test@127.0.0.1:55439/isolation";
const runtimeUrl =
  "postgres://isolation_runtime:local-runtime-test@127.0.0.1:55439/isolation";
Object.assign(process.env, {
  BETTER_AUTH_SECRET: "local-isolation-test-secret-at-least-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
  CORS_ORIGIN: "http://localhost:3001",
  DATABASE_URL: runtimeUrl,
  NODE_ENV: "test",
});
const { createDb } = await import("../src/index");
const { createAuth } = await import("../../auth/src/index");
const { assertRuntimeDatabase } = await import("../src/runtime");
const {
  provisionOrganizationTenant,
  resolveTenantMembership,
  withTenantTransaction,
} = await import("../src/tenant");
const {
  organizations: organization,
  members: member,
  users: user,
} = await import("../src/schema/auth.generated");
const { domainScopes } = await import("../../auth/src/permissions");
const { organizationTenant } = await import(
  "../src/schema/organization-tenant"
);
const { tenants } = await import("../src/schema/shared");
const { entityRegistry, vendors, products } = await import(
  "../src/schema/catalog"
);

const admin = createDb(adminUrl);
const database = createDb();
const auth = createAuth(database);
const suffix = crypto.randomUUID();
let ownerId: string;
let otherId: string;
let headers: Headers;
let otherHeaders: Headers;
let organizationId: string;
let tenantA: string;
let tenantB: string;
let otherOrganizationId: string;

async function signUp(label: string) {
  const response = await auth.api.signUpEmail({
    asResponse: true,
    body: {
      email: `${label}-${suffix}@example.com`,
      name: label,
      password: "test-only-password-123!",
    },
  });
  expect(response.status).toBe(200);
  const body = z
    .object({ user: z.object({ id: z.string() }) })
    .parse(await response.json());
  const requestHeaders = new Headers({
    cookie: response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  });
  return { headers: requestHeaders, userId: body.user.id };
}

beforeAll(async () => {
  await admin.execute(sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'isolation_runtime') THEN
      CREATE ROLE isolation_runtime LOGIN PASSWORD 'local-runtime-test' NOSUPERUSER NOBYPASSRLS NOCREATEROLE;
    END IF;
  END $$`);
  await admin.execute(
    sql`grant create on database isolation to isolation_runtime`
  );
  await admin.execute(
    sql`grant usage, create on schema public to isolation_runtime`
  );
  await migrate(database, {
    migrationsFolder: new URL("../src/migrations", import.meta.url).pathname,
  });
  await database.execute(
    sql.raw(
      await file(new URL("../sql/001-runtime-role.sql", import.meta.url)).text()
    )
  );
  const owner = await signUp("owner");
  ownerId = owner.userId;
  ({ headers } = owner);
  const other = await signUp("other");
  otherId = other.userId;
  otherHeaders = other.headers;
  const first = await auth.api.createOrganization({
    body: { name: "First", slug: `first-${suffix}`, userId: ownerId },
  });
  const second = await auth.api.createOrganization({
    body: { name: "Second", slug: `second-${suffix}`, userId: otherId },
  });
  if (!(first && second)) {
    throw new Error("Organization setup failed");
  }
  organizationId = first.id;
  otherOrganizationId = second.id;
  tenantA = await provisionOrganizationTenant(database, first.id);
  tenantB = await provisionOrganizationTenant(database, second.id);
}, 30_000);

afterAll(async () => {
  await database.$client.close();
  await admin.$client.close();
});

test("table-owning runtime role is safe with forced RLS; superuser is rejected", async () => {
  await assertRuntimeDatabase(database);
  await expect(assertRuntimeDatabase(admin)).rejects.toThrow("elevated roles");
});

test("provisioning creates one mapping and owner membership, including concurrent retries", async () => {
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      provisionOrganizationTenant(database, organizationId)
    )
  );
  expect(new Set(results)).toEqual(new Set([tenantA]));
  const resolved = await resolveTenantMembership(
    database,
    ownerId,
    organizationId
  );
  expect(resolved.status).toBe("ready");
  if (resolved.status === "ready") {
    expect(resolved.membership.role).toBe("owner");
  }
});

test("client creation and organization deletion are disabled", async () => {
  await expect(
    auth.api.createOrganization({
      body: { name: "Blocked", slug: `blocked-${suffix}` },
      headers,
    })
  ).rejects.toThrow();
  await expect(
    auth.api.deleteOrganization({ body: { organizationId }, headers })
  ).rejects.toThrow();
});

test("list and switch organizations work without a tenant GUC", async () => {
  const organizations = await auth.api.listOrganizations({ headers });
  expect(organizations.map((org) => org.id)).toEqual([organizationId]);
  await auth.api.setActiveOrganization({ body: { organizationId }, headers });
  const current = await auth.api.getSession({ headers });
  expect(current?.session.activeOrganizationId).toBe(organizationId);
  await expect(
    auth.api.setActiveOrganization({
      body: { organizationId: otherOrganizationId },
      headers,
    })
  ).rejects.toThrow();
  await auth.api.setActiveOrganization({ body: { organizationId }, headers });
});

test("invitations grant access only after acceptance", async () => {
  const [invitee] = await database
    .select()
    .from(user)
    .where(eq(user.id, otherId));
  if (!invitee) {
    throw new Error("Missing invitee");
  }
  const invitation = await auth.api.createInvitation({
    body: { email: invitee.email, organizationId, role: "member" },
    headers,
  });
  expect(
    (await resolveTenantMembership(database, otherId, organizationId)).status
  ).toBe("forbidden");
  await auth.api.acceptInvitation({
    body: { invitationId: invitation.id },
    headers: otherHeaders,
  });
  expect(
    (await resolveTenantMembership(database, otherId, organizationId)).status
  ).toBe("ready");
  await auth.api.setActiveOrganization({
    body: { organizationId },
    headers: otherHeaders,
  });
  await auth.api.removeMember({
    body: { memberIdOrEmail: invitee.email, organizationId },
    headers,
  });
  expect((await auth.api.getSession({ headers: otherHeaders }))?.user.id).toBe(
    otherId
  );
  expect(
    (await resolveTenantMembership(database, otherId, organizationId)).status
  ).toBe("forbidden");
});

test("auth and inventory account relations coexist", async () => {
  const providerAccounts = await database.query.authAccounts.findMany({
    where: { userId: ownerId },
    with: { user: true },
  });
  expect(providerAccounts).toHaveLength(1);
  expect(providerAccounts[0]?.user?.id).toBe(ownerId);
  const inventoryAccounts = await withTenantTransaction(
    database,
    tenantA,
    (tx) =>
      tx.query.accounts.findMany({ with: { instance: true, principal: true } })
  );
  expect(inventoryAccounts).toEqual([]);
});

test("unscoped queries fail closed and scoped queries see only their tenant", async () => {
  expect(await database.select().from(tenants)).toEqual([]);
  await expect(database.insert(tenants).values({}).execute()).rejects.toThrow();
  await withTenantTransaction(database, tenantA, async (tx) => {
    const rows = await tx.select().from(tenants);
    expect(rows.map((row) => row.id)).toEqual([tenantA]);
    expect(
      await tx
        .update(tenants)
        .set({ timezone: "UTC" })
        .where(eq(tenants.id, tenantB))
        .returning()
    ).toEqual([]);
    expect(
      await tx.delete(tenants).where(eq(tenants.id, tenantB)).returning()
    ).toEqual([]);
  });
  await expect(
    withTenantTransaction(database, tenantA, async (tx) => {
      await tx.insert(tenants).values({ id: crypto.randomUUID() });
    })
  ).rejects.toThrow();
});

test("domain relations work and tenant-qualified foreign keys reject cross-tenant links", async () => {
  const vendorId = crypto.randomUUID();
  await withTenantTransaction(database, tenantB, async (tx) => {
    await tx
      .insert(entityRegistry)
      .values({ id: vendorId, kind: "vendor", tenantId: tenantB });
    await tx
      .insert(vendors)
      .values({ id: vendorId, name: "Vendor B", tenantId: tenantB });
  });
  await expect(
    withTenantTransaction(database, tenantA, async (tx) => {
      const productId = crypto.randomUUID();
      await tx
        .insert(entityRegistry)
        .values({ id: productId, kind: "product", tenantId: tenantA });
      await tx.insert(products).values({
        id: productId,
        name: "Product",
        slug: "product",
        tenantId: tenantA,
        vendorId,
      });
    })
  ).rejects.toThrow();
  await withTenantTransaction(database, tenantA, async (tx) => {
    expect(
      await tx.query.vendors.findMany({ with: { products: true } })
    ).toEqual([]);
  });
  await expect(
    withTenantTransaction(database, tenantB, async (tx) => {
      await tx
        .update(vendors)
        .set({ tenantId: tenantA })
        .where(and(eq(vendors.id, vendorId), eq(vendors.tenantId, tenantB)));
    })
  ).rejects.toThrow();
});

test("one pooled connection clears context after commit and rollback", async () => {
  const client = new SQL(runtimeUrl, { max: 1 });
  const pooled = drizzle({ client });
  for (const tenantId of [tenantA, tenantB]) {
    // biome-ignore lint/performance/noAwaitInLoops: Verify sequential reuse of the same connection.
    await pooled.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.tenant_id', ${tenantId}, true)`
      );
      expect((await tx.select().from(tenants)).map((row) => row.id)).toEqual([
        tenantId,
      ]);
    });
    expect(await pooled.select().from(tenants)).toEqual([]);
  }
  await expect(
    pooled.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.tenant_id', ${tenantA}, true)`
      );
      throw new Error("rollback fixture");
    })
  ).rejects.toThrow("rollback fixture");
  expect(await pooled.select().from(tenants)).toEqual([]);
  await client.close();
});

test("incomplete provisioning is denied and can be repaired", async () => {
  const orgId = crypto.randomUUID();
  await database.insert(organization).values({
    createdAt: new Date(),
    id: orgId,
    name: "Incomplete",
    slug: orgId,
  });
  await database.insert(member).values({
    createdAt: new Date(),
    id: crypto.randomUUID(),
    organizationId: orgId,
    role: "owner",
    userId: ownerId,
  });
  expect((await resolveTenantMembership(database, ownerId, orgId)).status).toBe(
    "unavailable"
  );
  await provisionOrganizationTenant(database, orgId);
  expect((await resolveTenantMembership(database, ownerId, orgId)).status).toBe(
    "ready"
  );
  await expect(
    database
      .update(organizationTenant)
      .set({ tenantId: tenantB })
      .where(eq(organizationTenant.organizationId, orgId))
      .execute()
  ).rejects.toThrow();
});

test("startup rejects SELECT-only roles and disabled RLS", async () => {
  await admin.transaction(async (tx) => {
    await tx.execute(sql`create role isolation_readonly nologin`);
    await tx.execute(sql`grant usage on schema public to isolation_readonly`);
    await tx.execute(
      sql`grant select on all tables in schema public to isolation_readonly`
    );
    await tx.execute(sql`set local role isolation_readonly`);
    await expect(assertRuntimeDatabase(tx)).rejects.toThrow(
      "limited DML grants"
    );
    await tx.execute(sql`reset role`);
    await tx.execute(sql`drop owned by isolation_readonly`);
    await tx.execute(sql`drop role isolation_readonly`);
  });
  await admin.transaction(async (tx) => {
    await tx.execute(sql`alter table tenants disable row level security`);
    await tx.execute(sql`set local role isolation_runtime`);
    await expect(assertRuntimeDatabase(tx)).rejects.toThrow("tenant RLS");
    await tx.execute(sql`reset role`);
    await tx.execute(sql`alter table tenants enable row level security`);
  });
});

test("provisioning rolls back the tenant when mapping creation fails", async () => {
  const orgId = crypto.randomUUID();
  await database
    .insert(organization)
    .values({ createdAt: new Date(), id: orgId, name: "Failed", slug: orgId });
  const before = await admin.select({ id: tenants.id }).from(tenants);
  await admin.execute(sql`create function public.reject_test_mapping() returns trigger language plpgsql as $$
    begin raise exception 'provisioning fixture failure'; end $$`);
  await admin.execute(sql`create trigger reject_test_mapping before insert on organization_tenant
    for each row execute function public.reject_test_mapping()`);
  try {
    await expect(
      provisionOrganizationTenant(database, orgId)
    ).rejects.toThrow();
    expect(await admin.select({ id: tenants.id }).from(tenants)).toEqual(
      before
    );
    expect(
      await database
        .select()
        .from(organizationTenant)
        .where(eq(organizationTenant.organizationId, orgId))
    ).toEqual([]);
  } finally {
    await admin.execute(
      sql`drop trigger reject_test_mapping on organization_tenant`
    );
    await admin.execute(sql`drop function public.reject_test_mapping()`);
  }
  await provisionOrganizationTenant(database, orgId);
  expect(
    (
      await database
        .select()
        .from(organizationTenant)
        .where(eq(organizationTenant.organizationId, orgId))
    ).length
  ).toBe(1);
});

test("tenantProcedure rejects missing authentication, selection, membership and mapping", async () => {
  const { tenantProcedure } = await import("../../api/src/index");
  const current = await auth.api.getSession({ headers });
  if (!current) {
    throw new Error("Missing test session");
  }
  const procedure = tenantProcedure.handler(({ context }) => ({
    tenantId: context.tenantId,
  }));
  await expect(
    call(procedure, undefined, {
      context: { auth: null, headers, session: null },
    })
  ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  const missingSelection = {
    ...current,
    session: { ...current.session, activeOrganizationId: null },
  };
  await expect(
    call(procedure, undefined, {
      context: { auth: null, headers, session: missingSelection },
    })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  const forbidden = {
    ...current,
    session: { ...current.session, activeOrganizationId: otherOrganizationId },
  };
  await expect(
    call(procedure, undefined, {
      context: { auth: null, headers, session: forbidden },
    })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  const missingId = crypto.randomUUID();
  await database.insert(organization).values({
    createdAt: new Date(),
    id: missingId,
    name: "Unmapped",
    slug: missingId,
  });
  await database.insert(member).values({
    createdAt: new Date(),
    id: crypto.randomUUID(),
    organizationId: missingId,
    role: "owner",
    userId: ownerId,
  });
  const unavailable = {
    ...current,
    session: { ...current.session, activeOrganizationId: missingId },
  };
  await expect(
    call(procedure, undefined, {
      context: { auth: null, headers, session: unavailable },
    })
  ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
});

test("tenantProcedure scopes successful work and rolls back handler failures", async () => {
  const { tenantProcedure } = await import("../../api/src/index");
  await auth.api.setActiveOrganization({ body: { organizationId }, headers });
  const current = await auth.api.getSession({ headers });
  if (!current) {
    throw new Error("Missing test session");
  }
  const context = { auth: null, headers, session: current };
  const read = tenantProcedure.handler(async ({ context: tenant }) => {
    const rows = await tenant.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.tenantId));
    return rows.map((row) => row.id);
  });
  expect(await call(read, undefined, { context })).toEqual([tenantA]);
  const fail = tenantProcedure.handler(async ({ context: tenant }) => {
    await tenant.db
      .update(tenants)
      .set({ timezone: "Europe/London" })
      .where(eq(tenants.id, tenant.tenantId));
    throw new Error("handler fixture failure");
  });
  await expect(call(fail, undefined, { context })).rejects.toThrow(
    "handler fixture failure"
  );
  const [storedTenant] = await admin
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantA));
  expect(storedTenant?.timezone).toBe("UTC");
});

test("permissionProcedure rechecks built-in and tenant-defined roles", async () => {
  const { permissionProcedure } = await import("../../api/src/index");
  await auth.api.setActiveOrganization({ body: { organizationId }, headers });
  const ownerSession = await auth.api.getSession({ headers });
  if (!ownerSession) {
    throw new Error("Missing owner test session");
  }
  const ownerContext = { auth: null, headers, session: ownerSession };
  const allPermissions = permissionProcedure(...domainScopes).handler(
    () => "allowed"
  );
  expect(await call(allPermissions, undefined, { context: ownerContext })).toBe(
    "allowed"
  );

  const [otherMembership] = await database
    .select()
    .from(member)
    .where(
      and(eq(member.organizationId, organizationId), eq(member.userId, otherId))
    );
  if (!otherMembership) {
    await auth.api.addMember({
      body: { organizationId, role: "member", userId: otherId },
      headers,
    });
  }
  const [memberToUpdate] = await database
    .select()
    .from(member)
    .where(
      and(eq(member.organizationId, organizationId), eq(member.userId, otherId))
    );
  if (!memberToUpdate) {
    throw new Error("Missing organization member");
  }
  await auth.api.createOrgRole({
    body: {
      organizationId,
      permission: { catalog: ["read"] },
      role: "catalog_reader",
    },
    headers,
  });
  await auth.api.updateMemberRole({
    body: {
      memberId: memberToUpdate.id,
      organizationId,
      role: "catalog_reader",
    },
    headers,
  });
  await auth.api.setActiveOrganization({
    body: { organizationId },
    headers: otherHeaders,
  });
  const memberSession = await auth.api.getSession({ headers: otherHeaders });
  if (!memberSession) {
    throw new Error("Missing member test session");
  }
  const memberContext = {
    auth: null,
    headers: otherHeaders,
    session: memberSession,
  };
  const catalogRead = permissionProcedure("catalog:read").handler(
    () => "allowed"
  );
  expect(await call(catalogRead, undefined, { context: memberContext })).toBe(
    "allowed"
  );
  const catalogWrite = permissionProcedure("catalog:write").handler(
    () => "denied"
  );
  await expect(
    call(catalogWrite, undefined, { context: memberContext })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  const { getPermissionHandlerCalls, handleTenantTestRequest } = await import(
    "../../api/test/tenant-handler"
  );
  const deniedResponse = await handleTenantTestRequest(
    new Request("http://localhost:3000/permission-test", {
      headers: otherHeaders,
    })
  );
  expect(deniedResponse.response?.status).toBe(403);
  expect(getPermissionHandlerCalls()).toBe(0);
  await auth.api.updateOrgRole({
    body: {
      data: { permission: { catalog: ["write"] } },
      organizationId,
      roleName: "catalog_reader",
    },
    headers,
  });
  await expect(
    call(catalogRead, undefined, { context: memberContext })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  expect(await call(catalogWrite, undefined, { context: memberContext })).toBe(
    "denied"
  );
});

test("only owners may manage domain roles or privileged assignments", async () => {
  const { guardOrganizationRoleManagement } = await import(
    "../../../apps/server/src/role-management-guard"
  );
  const validRoleRequest = new Request(
    "http://localhost:3000/api/auth/organization/create-role",
    {
      body: JSON.stringify({
        organizationId,
        permission: { catalog: ["read"] },
        role: "another_catalog_reader",
      }),
      headers,
      method: "POST",
    }
  );
  await expect(
    guardOrganizationRoleManagement({
      auth,
      database,
      request: validRoleRequest,
    })
  ).resolves.toBeNull();
  const invalidRoleRequest = new Request(
    "http://localhost:3000/api/auth/organization/create-role",
    {
      body: JSON.stringify({
        organizationId,
        permission: { ac: ["create"] },
        role: "escalation",
      }),
      headers,
      method: "POST",
    }
  );
  const invalidResponse = await guardOrganizationRoleManagement({
    auth,
    database,
    request: invalidRoleRequest,
  });
  expect(invalidResponse?.status).toBe(400);

  const ordinaryMemberAdd = await guardOrganizationRoleManagement({
    auth,
    database,
    request: new Request(
      "http://localhost:3000/api/auth/organization/add-member",
      {
        body: JSON.stringify({ organizationId, role: "member" }),
        headers: otherHeaders,
        method: "POST",
      }
    ),
  });
  expect(ordinaryMemberAdd?.status).toBe(403);

  const [memberToUpdate] = await database
    .select()
    .from(member)
    .where(
      and(eq(member.organizationId, organizationId), eq(member.userId, otherId))
    );
  if (!memberToUpdate) {
    throw new Error("Missing organization member");
  }
  await auth.api.updateMemberRole({
    body: { memberId: memberToUpdate.id, organizationId, role: "admin" },
    headers,
  });
  await expect(
    guardOrganizationRoleManagement({
      auth,
      database,
      request: new Request(
        "http://localhost:3000/api/auth/organization/add-member",
        {
          body: JSON.stringify({ organizationId, role: "member" }),
          headers: otherHeaders,
          method: "POST",
        }
      ),
    })
  ).resolves.toBeNull();
  const deniedResponse = await guardOrganizationRoleManagement({
    auth,
    database,
    request: new Request(
      "http://localhost:3000/api/auth/organization/create-role",
      {
        body: JSON.stringify({
          organizationId,
          permission: { catalog: ["read"] },
          role: "admin_escalation",
        }),
        headers: otherHeaders,
        method: "POST",
      }
    ),
  });
  expect(deniedResponse?.status).toBe(403);
});

test("OpenAPI requests enforce session and tenant boundaries", async () => {
  const { handleTenantTestRequest } = await import(
    "../../api/test/tenant-handler"
  );
  const unauthenticated = await handleTenantTestRequest(
    new Request("http://localhost:3000/tenant-test")
  );
  expect(unauthenticated.response?.status).toBe(401);
  await auth.api.setActiveOrganization({ body: { organizationId }, headers });
  const own = await handleTenantTestRequest(
    new Request(`http://localhost:3000/tenant-test?tenantId=${tenantB}`, {
      headers,
    })
  );
  expect(own.response?.status).toBe(200);
  expect(await own.response?.json()).toEqual([tenantA]);
  await auth.api.setActiveOrganization({
    body: { organizationId: null },
    headers,
  });
  const unselected = await handleTenantTestRequest(
    new Request("http://localhost:3000/tenant-test", { headers })
  );
  expect(unselected.response?.status).toBe(400);
});

test("v2 web RPC transport preserves authentication and rejects GET", async () => {
  const { rpcHandler } = await import("../../../apps/server/src/orpc-handlers");
  const { createRpcLink } = await import(
    "../../../apps/web/src/utils/rpc-link"
  );
  let requestHeaders = new Headers();
  const client: AppRouterClient = createORPCClient(
    createRpcLink("http://localhost:3000", async (url, options) => {
      expect(options.credentials).toBe("include");
      expect(options.method).toBe("POST");
      const sentHeaders = new Headers(options.headers);
      for (const [key, value] of requestHeaders) {
        sentHeaders.set(key, value);
      }
      const request = new Request(url, { ...options, headers: sentHeaders });
      const { response } = await rpcHandler.handle(request, {
        context: {
          auth: null,
          headers: request.headers,
          session: await auth.api.getSession({ headers: request.headers }),
        },
        prefix: "/rpc",
      });
      if (!response) {
        throw new Error("RPC request did not match");
      }
      return response;
    })
  );
  expect(await client.healthCheck()).toBe("OK");
  await expect(client.privateData()).rejects.toMatchObject({
    code: "UNAUTHORIZED",
  });
  requestHeaders = headers;
  expect((await client.privateData()).user?.id).toBe(ownerId);
  const get = await rpcHandler.handle(
    new Request("http://localhost:3000/rpc/healthCheck"),
    {
      context: { auth: null, headers: new Headers(), session: null },
      prefix: "/rpc",
    }
  );
  // Disallowed methods fall through to the server's 404 response.
  expect(get.matched).toBe(false);
  expect(get.response).toBeUndefined();
});

test("v2 OpenAPI reference serves Scalar, stable paths and error statuses", async () => {
  const { apiHandler } = await import("../../../apps/server/src/orpc-handlers");
  const context = { auth: null, headers: new Headers(), session: null };
  const handle = async (path: string, method = "GET") => {
    const result = await apiHandler.handle(
      new Request(`http://localhost:3000/api-reference${path}`, { method }),
      {
        context,
        prefix: "/api-reference",
      }
    );
    if (!result.response) {
      throw new Error("OpenAPI request did not match");
    }
    return result.response;
  };
  const docs = await handle("");
  expect(docs.status).toBe(200);
  expect(await docs.text()).toContain("scalar");
  const specResponse = await handle("/spec.json");
  expect(specResponse.status).toBe(200);
  const spec = z
    .object({
      openapi: z.string(),
      paths: z.record(
        z.string(),
        z.object({ post: z.record(z.string(), z.unknown()) })
      ),
      servers: z.array(z.object({ url: z.string() })),
    })
    .parse(await specResponse.json());
  expect(spec.openapi).toBe("3.1.1");
  expect(spec.servers).toEqual([{ url: "/api-reference" }]);
  expect(Object.keys(spec.paths).sort()).toEqual([
    "/healthCheck",
    "/privateData",
  ]);
  expect(spec.paths["/healthCheck"]?.post).toBeDefined();
  expect(spec.paths["/privateData"]?.post).toBeDefined();
  const health = await handle("/healthCheck", "POST");
  expect(health.status).toBe(200);
  expect(await health.json()).toBe("OK");
  const denied = await handle("/privateData", "POST");
  expect(denied.status).toBe(401);
  const error = await denied.json();
  expect(error).toMatchObject({ code: "UNAUTHORIZED" });
  expect(error).not.toHaveProperty("status");
});
