# Organization-backed tenant isolation

A Better Auth organization represents one customer tenant. Its `members` table is
our platform membership authority. Inventory people, groups, SaaS accounts,
provider tenant keys, and catalog ownership do not grant platform access.

Better Auth organization IDs are UUIDs with database-generated defaults. Domain tenant IDs are UUIDs. The
server-only `organization_tenant` table maps them one-to-one, with foreign keys
and uniqueness on both sides. Never cast an organization ID to a tenant UUID,
even when the generated organization ID happens to be a UUID string.

The organization owns the display name. The domain `tenants` row owns currency,
timezone, and retention settings. This deliberately normalizes the design
proposal's tenant name into the organization table instead of maintaining two
mutable copies. The proposal's tenant-bound machine OAuth tokens are not
implemented here; this foundation authenticates Better Auth human sessions.

## Request boundary

`tenantProcedure` authenticates the session, reads its active organization,
checks current database membership, and resolves the mapping. Selection alone
never authorizes access. The procedure supplies `context.tenantId`,
`context.organizationId`, `context.membership`, and the transaction as
`context.db`.

| Condition | oRPC error |
| --- | --- |
| No authenticated session | `UNAUTHORIZED` |
| No active organization | `BAD_REQUEST` |
| Current membership absent | `FORBIDDEN` |
| Organization provisioning incomplete | `SERVICE_UNAVAILABLE` |

Every domain handler must use `tenantProcedure`, explicitly filter queries by
`context.tenantId`, and use `context.db` for all database work. Apply action,
resource, and field authorization separately; membership and default organization
roles do not grant blanket domain permissions. `protectedProcedure` remains
available for user-level operations that do not touch domain data.

`withTenantTransaction(database, tenantId, callback)` is a trusted server helper,
not an authorization API. It sets `app.tenant_id` using parameterized,
transaction-local `set_config(..., true)`. All callback work must be awaited and
results must be materialized before returning. Do not return database iterators,
streams, or deferred queries, use the global DB inside the callback, or hold the
transaction open for external network calls. Handler failures roll back writes;
commit and rollback both clear the connection's tenant context.

RLS applies the same tenant condition to reads and writes. Composite foreign
keys prevent linking rows across tenants. Missing tenant context exposes no
rows and rejects inserts. RLS protects against omitted query filters within the
trusted server; it does not make arbitrary SQL or runtime database credentials
safe to expose to clients. Runtime credentials can choose the GUC, access auth tables, and administer their
owned schema. FORCE RLS constrains ordinary domain queries, not malicious DDL
executed by a compromised server. These credentials remain a server trust boundary.

Membership revocation affects requests whose membership check happens after the
removal commits. Requests already authorized may finish. Future sensitive writes
requiring stricter revocation consistency must lock or recheck membership inside
their transaction. Cached session roles are never used as membership authority.

## Organization lifecycle

Self-service creation and organization deletion are disabled. Default Better Auth
owner/admin/member semantics remain enabled; teams and dynamic roles are off.
The client plugin supports listing and selecting organizations before any tenant
GUC is set. Better Auth owns invitation acceptance and membership changes; email
delivery and an invitation UI are outside this foundation.

Trusted server provisioning uses the Better Auth server API without request
headers:

```ts
const organization = await auth.api.createOrganization({
  body: { name, slug, userId: ownerUserId },
});
```

The `afterCreateOrganization` hook calls
`provisionOrganizationTenant(database, organizationId)`. It locks the organization
row, checks for an existing mapping, and atomically creates the tenant and mapping
under the new tenant's transaction context. Concurrent retries reuse the mapping.
The application login has insert/read grants on mappings. As table owner it can
regrant privileges during migrations, so the credentials remain trusted.

The hook is not atomic with Better Auth's preceding organization/member writes.
If it fails, the organization may exist without a tenant; domain requests fail
closed. After correcting the database failure, trusted server code retries:

```ts
await provisionOrganizationTenant(db, organizationId);
```

Use the existing organization ID rather than retrying creation with a new slug.
Do not expose this repair helper through an unauthenticated or tenant-selected
endpoint. Do not delete organization rows as a recovery shortcut: mapping foreign
keys intentionally restrict deletion. No automatic retry loop or deletion API is
provided.

## Database setup and deployment

This is a fresh-database baseline. It is not an upgrade/backfill for an existing
shared database. Generated Drizzle migrations define tables and RLS; the versioned
`packages/db/sql/001-runtime-role.sql` defines runtime privileges.

1. Use the same `DATABASE_URL` for migrations and the server. The login must be
   `NOSUPERUSER NOBYPASSRLS NOCREATEROLE` and must not belong to an elevated role.
   It may own the application tables and needs schema creation rights for
   migrations. Existing superuser or BYPASSRLS credentials must be replaced with
   a normal login; FORCE RLS cannot constrain those roles.
2. Apply migrations from `packages/db`: `bun run db:migrate`. Review generated
   SQL first. Use `db:generate` from that package for future schema changes;
   this avoids Turbo's interactive-task restriction in noninteractive shells.
3. Apply `001-runtime-role.sql` using the same login and `psql` with
   `ON_ERROR_STOP=1`. It assumes the public schema belongs to this app. It forces
   RLS on domain tables, revokes public and Supabase browser-role table
   privileges, and grants the current login DML on application tables. It
   removes ordinary TRUNCATE and mapping update/delete privileges. Table owners
   retain schema administration authority and can regrant privileges.
4. Start the server. Before listening, it rejects elevated roles, missing RLS or
   policy setup, unforced RLS on owned tables, missing DML grants, and TRUNCATE
   privileges. A failed check prevents startup; correct the setup instead of
   disabling the checks.
5. Provision organizations and owners through trusted server operations. Existing
   user-level login and health endpoints remain separate from tenant data access.

After future migrations, rerun the grants script before restarting the server.
It is idempotent; new owned tables must have FORCE RLS and restricted privileges
before they pass startup validation.
Generated migrations remain the schema source of truth. The grants script is
separate because FORCE RLS and privilege setup are not represented by these Drizzle tables.
Do not use `db:push` against a shared database. Rolling back the app must not drop
tenant data or relax RLS; fix forward or restore a database backup through the
normal deployment process.

The auth adapter preserves `generateId: "uuid"`, `joins: true`, and
`usePlural: true`. Better Auth owns `packages/db/src/schema/auth.generated.ts`;
regenerate it with `bun run --cwd packages/auth auth:generate`. The account model
is configured as `authAccount`, producing `auth_accounts` and `authAccounts`,
so provider credentials cannot collide with inventory `accounts`. Both database
clients use the generated auth relations; domain relations use only domain tables.

The generated UUID auth IDs supersede the earlier text-ID design. The mapping's
organization foreign key is also UUID; organization IDs and tenant IDs remain
separate identities. Direct test inserts must supply UUID IDs and required timestamps.

Migration `20260907211128_chunky_silver_samurai` renames the old auth tables and
converts their identifiers to UUIDs. Existing IDs must contain valid UUID strings.
Drizzle rc.4 generated the conversion without detaching existing foreign keys;
the migration includes a targeted correction to drop and restore those constraints
around the conversion, retaining their cascade/restrict behavior. This is an
exception to the usual unedited generated-migration workflow, verified against
PostgreSQL. Apply the migration and rerun the grants script before restarting.
The generated schema also supersedes the earlier custom provider-account and
organization-membership unique indexes with Better Auth's generated indexes.

## Local verification

Start the isolated PostgreSQL fixture (Docker required):

```sh
docker run --detach --rm --name saasmanager-isolation-test \
  --publish 127.0.0.1:55439:5432 \
  --env POSTGRES_PASSWORD=local-isolation-test \
  --env POSTGRES_DB=isolation postgres:17
bun test packages/db/test/tenant.test.ts
bun x tsc --noEmit -p packages/db/test/tsconfig.json
bun run check-types
bun run check
docker stop saasmanager-isolation-test
```

The integration suite deliberately uses only the fixed loopback fixture address
and test credentials; it ignores application database environment values. It
applies migrations and role setup, creates unique fixture users/organizations,
and tests real Better Auth operations, membership revocation, RLS, foreign keys,
provisioning failure recovery, scoped procedures, and pooled connection reuse.
Stop the container to discard fixtures. Run this suite serially against its
container because privilege and failure-injection cases alter fixture DB state.
