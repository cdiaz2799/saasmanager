# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Code style/quality standards live in `.claude/CLAUDE.md` (Ultracite/Biome preset) — that file is loaded automatically; this one covers architecture and workflow.

`AGENTS.md` at the repo root is a symlink to this file, so other agents read the same guidance.

## Project Overview

This project is a multi-tenant SaaS system of record: a software catalog, commercial ledger, observed access and usage, and explainable reconciliation.
Read `saas-system-of-record-design.md` and the API contract at
`docs/saas-system-of-record.openapi.yaml`. `docs/permissions.md` derives the 16
capabilities from that contract; `docs/rbac.md` records what the current release
actually implements; `docs/tenant-isolation.md` covers provisioning and testing.

When implementation and design disagree, identify the discrepancy and document
the chosen resolution; do not silently redefine the domain.

## Domain invariants

- A platform tenant is a customer organization. A SaaS instance is a workspace inside a vendor product. Never interchange their identifiers.
- Preserve vendor → product → application → instance. An application is the customer's managed use of a product; product resolution may be unknown.
- Inventory people, service principals, and SaaS accounts are distinct from Better Auth users, provider accounts, and sessions. Email is not an identity key.
- Catalog ownership, organizational membership, namespaces, and vendor roles do not grant access to this platform. Authorization requires an explicit policy.
- Separate contracts, subscriptions, purchased entitlements, observed license assignments, and usage. A bundle's cost is stored once.
- Keep committed, invoiced, and paid amounts separate. Use exact decimal values and decimal strings at JSON boundaries. Never aggregate mixed currencies or count unresolved duplicate financial events as settled spend.
- Unknown, zero, and unlimited are different states. Stale evidence is not proof of inactivity. Preserve coverage and freshness in reports.
- Use half-open effective intervals `[start, end)`. Preserve source timestamps, observation time, and ingestion time as different facts.
- Local record changes do not provision vendor accounts, revoke vendor access, cancel subscriptions, or execute purchases. Such operations need explicit, separately designed workflows.

## Isolation and trustworthy changes

Derive tenant context from a verified principal and an authorized tenant selection.
Never trust a body field, URL, header, or active-organization selector by itself.
Enforce tenant-qualified references in PostgreSQL and tenant filters in queries;
RLS is an additional boundary, not a replacement for resource authorization.

Commit canonical state, provenance where applicable, revision/history, audit,
and outbox events atomically. Perform external calls after commit through durable
work. Consumers must tolerate redelivery. Do not publish events from an uncommitted
transaction or hold database transactions open during vendor network calls.

Ingestion preserves immutable observations and source identity/version deduplication.
Reconciliation applies explicit field authority and retains conflicts and override
history. Absence in a partial or failed sync cannot imply deletion. A deletion
inference requires a complete authoritative snapshot and documented source semantics.

### Tenant control plane

Better Auth's `organization` is the customer org; the domain `tenants` table
(`packages/db/src/schema/shared.ts`) is the RLS isolation unit. They are linked by
`organization_tenant` (`packages/db/src/schema/organization-tenant.ts`), a
server-only mapping — never returned to a client.

`packages/db/src/tenant.ts` holds the helpers — `resolveTenantMembership()` to turn
a requested org selection into an authorized `tenantId`, `withTenantTransaction()`
for all tenant-scoped work, and `provisionOrganizationTenant()` for trusted server
provisioning only. Signatures and rules are in `packages/db/CLAUDE.md`.

Keep credentials in approved secret storage. Domain records contain secret
references, never credential values. Auth-managed credential fields follow the
auth package rules. Logs, fixtures, audit metadata, and outbox payloads must not
contain tokens, passwords, session cookies, or unredacted source payloads.

## Stack & layout

Bun + Turborepo monorepo. `bun` is the package manager and runtime (`packageManager: bun@1.3.14`); there is no npm/pnpm lockfile. Shared dependency versions are pinned in the root `package.json` `workspaces.catalog` and referenced as `"catalog:"` in each package — bump versions there, not per-package.

- `apps/server` — Elysia HTTP server (port 3000). `src/index.ts` is the entrypoint; `src/role-management-guard.ts` gates Better Auth org role/member endpoints. Mounts Better Auth, the oRPC RPC handler, and the oRPC OpenAPI handler. Request logging is `evlog` (`initLogger`, `evlog/elysia`); non-prod writes structured NDJSON to `.evlog/logs/` via `createFsDrain` (see the `analyze-logs` skill). The `identifyUser` middleware from `evlog/better-auth` enriches logs with the session.
- `apps/web` — React 19 + Vite 8 + TanStack Router (file-based routes in `src/routes`) + TanStack Query. Dev on port 3001, talks to the server over `/rpc` and `/api/auth`.
- `packages/api` — oRPC procedure definitions (the API contract). No build; consumed as TS source via `exports`.
- `packages/auth` — Better Auth instance config (`createAuth()` / `auth`).
- `packages/db` — Drizzle schema (`src/schema/`), the domain relations-v2 set (`src/relations.ts`), plural Better Auth aliases (`src/auth.ts`), tenant helpers (`src/tenant.ts`), runtime privilege checks (`src/runtime.ts`), `createDb()` (`src/index.ts`), and drizzle-kit migration scripts. Drizzle is `1.0.0-rc.4` (relations v2 API).
- `packages/env` — `@t3-oss/env-core` schemas: `@saasmanager/env/server` and `@saasmanager/env/web`. Import env only through these.
- `packages/ui` — shared shadcn/ui primitives, imported as `@saasmanager/ui/components/*`. Tailwind v4.
- `packages/config` — shared `tsconfig.base.json` only.

Internal packages are imported by source (`@saasmanager/api/routers/index`, etc.), so a type change in `packages/db` propagates to `apps/server` and `apps/web` through `packages/api` with no build step.

## Commands

Run from the repo root; Turbo fans out to workspaces.

- `bun install` — install
- `bun run dev` — run web + server together (`bun run dev:web` / `bun run dev:server` for one)
- `bun run build` — build all (`apps/server` bundles via `build.ts`, `apps/web` via `vite build`)
- `bun run check-types` — `tsc` across all packages (also runs automatically on file edit via a PostToolUse hook that type-checks the touched package and its dependents)
- `bun run check` / `bun run fix` — Ultracite (Biome) lint / autofix. `fix` also runs automatically on every Write/Edit.
- `bun run auth:generate` — regenerate `packages/db/src/schema/auth.generated.ts` from the Better Auth config. That file is generated; never hand-edit it.
- `bun run docker:up` / `docker:down` / `docker:logs` / `docker:build` — full stack via `docker-compose.yml` (web :3001, server :3000).
- `bun test packages/db/test/tenant.test.ts` — integration coverage for organizations, membership, provisioning, RLS, scoped transactions, and OpenAPI boundaries; requires the disposable PostgreSQL fixture described in `docs/tenant-isolation.md`.

### Database (drizzle-kit, from `packages/db`)

- `bun run db:generate` — generate a SQL migration from schema changes
  (output goes to `packages/db/src/migrations`, not the drizzle default)
- `bun run db:migrate` — apply migrations
- `bun run db:push` — push schema directly; **local prototyping only**, never against the shared Supabase DB
- `bun run db:studio` — Drizzle Studio

`drizzle.config.ts` reads `DATABASE_URL` from `apps/server/.env` (not `packages/db/.env`).
Postgres is Supabase-hosted (`supabase/config.toml`). A trusted server-only
database login, including Supabase's `postgres` login, is supported; a restricted
runtime role is optional defense in depth. After migrations, apply
`packages/db/sql/001-runtime-role.sql` to retain RLS and browser-role grant
hardening. When changing schema, use the `db-schema-change` skill
(`.claude/skills/db-schema-change/SKILL.md`).

## API layer (oRPC)

- `packages/api/src/index.ts` defines `publicProcedure`, `protectedProcedure`, and `tenantProcedure`. `tenantProcedure` derives the active organization from the server-side session, verifies current membership and the organization-to-tenant mapping, then runs the handler inside a tenant-scoped transaction. It returns `UNAUTHORIZED`, `BAD_REQUEST`, `FORBIDDEN`, or `SERVICE_UNAVAILABLE` for the corresponding boundary failures.
- `packages/api/src/context.ts` builds `Context` by calling `auth.api.getSession({ headers })` per request.
- `packages/api/src/routers/index.ts` exports `appRouter` (a plain object of procedures) plus `AppRouter` / `AppRouterClient` types. Add procedures here or in new router files merged into `appRouter`.
- `apps/server/src/index.ts` wraps the router in both `RPCHandler` (mounted at `/rpc`) and `OpenAPIHandler` (mounted at `/api-reference`, with a Scalar reference UI). Both have `onError` interceptors that `console.error`.
- Web consumes it via `@orpc/client` + `@orpc/tanstack-query`: `apps/web/src/utils/orpc.ts` exports `client` and `orpc` (query utils); `__root.tsx` also creates a per-render client into router context.
- Use the `orpc-api-reviewer` agent after changing procedures, context, or handler wiring.

## Auth (Better Auth)

- `packages/auth/src/index.ts` — `betterAuth()` with the Drizzle adapter (`@better-auth/drizzle-adapter/relations-v2`), email+password enabled, cookies `sameSite: "none"` + `secure` (cross-site web↔server), `trustedOrigins`/`baseURL` from env.
- Auth tables live in `packages/db/src/schema/auth.generated.ts` (generated — see `bun run auth:generate`): `users`, `sessions`, `authAccounts`, `verifications`, `organizations`, `organizationRoles`, `members`, and `invitations` (Better Auth organization plugin). `packages/db/src/auth.ts` exposes generated auth models and auth-only relations so Better Auth's `usePlural: true` does not collide with the domain `accounts` table. `createDb()` (`packages/db/src/index.ts`) passes domain and auth relations to the general Drizzle client; the auth adapter uses its scoped client. Any new relation must be registered in the appropriate set or `.query` joins silently break.
- Better Auth keeps `generateId: "uuid"` and `joins: true`; the generated auth UUID ID columns use database UUID defaults for direct inserts. Organization self-service creation and deletion are disabled. Trusted server provisioning calls `provisionOrganizationTenant()` from the organization hook and may retry incomplete mappings.
- Server mounts `auth.handler` at `/api/auth/*` (GET/POST only). `evlog/better-auth` middleware (`identifyUser`) enriches request logs with the session; `maskEmail: true`.
- Web: `apps/web/src/lib/auth-client.ts` (`authClient`, base URL `/api/auth`). Route protection is `beforeLoad` in `apps/web/src/routes/_auth/route.tsx`, which redirects to `/login` when there is no session.
- Use the `auth-security-reviewer` agent after touching any of the above.

### Authorization (RBAC)

`packages/auth/src/permissions.ts` defines the access-control statement, the built-in
roles, and `areDomainPermissions`. `permissionProcedure(scope, ...scopes)`
(`packages/api/src/index.ts`) extends `tenantProcedure` with an `auth.api.hasPermission`
check per scope and throws `FORBIDDEN` on any failure — use it, not a hand-rolled check.
`apps/server/src/role-management-guard.ts` intercepts the Better Auth
`/api/auth/organization/*` role and membership endpoints before `auth.handler`, so
custom-role management stays owner-only. Update that guard when adding org endpoints.
`docs/rbac.md` has the role/capability matrix and states what is *not* yet implemented.

## Database schema conventions

`packages/db/CLAUDE.md` has the full conventions: the domain table pattern
(`pgTable.withRLS` + `recordColumns()` + `recordConstraints()`), the
`entity_registry` shared-identity pattern, the `assertRuntimeDatabase()` startup
rules, and the migration sequence. Read it before touching `packages/db`.

What callers outside `packages/db` need to know:

- Domain handlers use `tenantProcedure` and `context.db`; never the global `db` inside a tenant transaction.
- Preserve composite `(tenant_id, referenced_id)` foreign keys and RLS policies when adding domain tables.
- New domain tables need forced RLS and exactly one `tenant_isolation` policy, or startup validation fails.
- `revision` / `updatedAt` are **not** maintained by triggers yet — a write path needing an accurate revision must set it explicitly. See `packages/db/CLAUDE.md`.
- `docs/tenant-isolation.md` covers provisioning, mapping repair, deployment, and the disposable integration tests.

## Guardrails already wired

- PreToolUse hook blocks Write/Edit on any `.env*` file — edit those by hand.
- PostToolUse hooks run `bun run fix` and a scoped `turbo check-types` after edits.
- `.claude/settings.json` and `.mcp.json` are checked in (context7, shadcn, supabase, better-auth, playwright MCP servers).

## Notes

- A `.codex/config.toml` exists (OpenAI Codex) and `~/.codex` / `~/.gemini` are present on this machine. Reply `/import` to scan them for importable MCP servers, commands, subagents, skills, or instructions.
