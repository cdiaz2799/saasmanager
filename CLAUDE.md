# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Code style/quality standards live in `.claude/CLAUDE.md` (Ultracite/Biome preset) — that file is loaded automatically; this one covers architecture and workflow.

## Stack & layout

Bun + Turborepo monorepo. `bun` is the package manager and runtime (`packageManager: bun@1.3.14`); there is no npm/pnpm lockfile. Shared dependency versions are pinned in the root `package.json` `workspaces.catalog` and referenced as `"catalog:"` in each package — bump versions there, not per-package.

- `apps/server` — Elysia HTTP server (port 3000). Single entrypoint `src/index.ts`. Mounts Better Auth, the oRPC RPC handler, and the oRPC OpenAPI handler.
- `apps/web` — React 19 + Vite 8 + TanStack Router (file-based routes in `src/routes`) + TanStack Query. Dev on port 3001, talks to the server over `/rpc` and `/api/auth`.
- `packages/api` — oRPC procedure definitions (the API contract). No build; consumed as TS source via `exports`.
- `packages/auth` — Better Auth instance config (`createAuth()` / `auth`).
- `packages/db` — Drizzle schema, `createDb()`, and drizzle-kit migration scripts. Drizzle is `1.0.0-rc.4` (relations v2 API).
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
- No test runner is configured yet. Tests would use `bun test`.

### Database (drizzle-kit, from `packages/db`)

- `bun run db:generate` — generate a SQL migration from schema changes
- `bun run db:migrate` — apply migrations
- `bun run db:push` — push schema directly; **local prototyping only**, never against the shared Supabase DB
- `bun run db:studio` — Drizzle Studio

`drizzle.config.ts` reads `DATABASE_URL` from `apps/server/.env` (not `packages/db/.env`). Postgres is Supabase-hosted (`supabase/config.toml`). When changing schema, use the `db-schema-change` skill (`.claude/skills/db-schema-change/SKILL.md`).

## API layer (oRPC)

- `packages/api/src/index.ts` defines `publicProcedure` and `protectedProcedure` (adds a middleware that throws `ORPCError("UNAUTHORIZED")` when `context.session?.user` is missing).
- `packages/api/src/context.ts` builds `Context` by calling `auth.api.getSession({ headers })` per request.
- `packages/api/src/routers/index.ts` exports `appRouter` (a plain object of procedures) plus `AppRouter` / `AppRouterClient` types. Add procedures here or in new router files merged into `appRouter`.
- `apps/server/src/index.ts` wraps the router in both `RPCHandler` (mounted at `/rpc`) and `OpenAPIHandler` (mounted at `/api-reference`, with a Scalar reference UI). Both have `onError` interceptors that `console.error`.
- Web consumes it via `@orpc/client` + `@orpc/tanstack-query`: `apps/web/src/utils/orpc.ts` exports `client` and `orpc` (query utils); `__root.tsx` also creates a per-render client into router context.
- Use the `orpc-api-reviewer` agent after changing procedures, context, or handler wiring.

## Auth (Better Auth)

- `packages/auth/src/index.ts` — `betterAuth()` with the Drizzle adapter (`@better-auth/drizzle-adapter/relations-v2`), email+password enabled, cookies `sameSite: "none"` + `secure` (cross-site web↔server), `trustedOrigins`/`baseURL` from env.
- Auth tables (`user`, `session`, `account`, `verification`) and `authRelations` live in `packages/db/src/schema/auth.ts`. `authRelations` is the relations set passed to `drizzle()` in `packages/db/src/index.ts` — a new schema file with relations must be merged in there or `.query` joins silently break.
- Server mounts `auth.handler` at `/api/auth/*` (GET/POST only). `evlog/better-auth` middleware (`identifyUser`) enriches request logs with the session; `maskEmail: true`.
- Web: `apps/web/src/lib/auth-client.ts` (`authClient`, base URL `/api/auth`). Route protection is `beforeLoad` in `apps/web/src/routes/_auth/route.tsx`, which redirects to `/login` when there is no session.
- Use the `auth-security-reviewer` agent after touching any of the above.

## Database schema conventions (`packages/db/src/schema`)

Two distinct table families:

1. **Better Auth tables** (`auth.ts`) — `text` ids, plain `timestamp`, shapes dictated by the adapter. Don't restyle them.
2. **Domain tables** (`catalog.ts`, `commercial.ts`, `technical.ts`, `integrations.ts`, `ingestion.ts`, `audit.ts`) — multi-tenant SaaS-inventory model. These use:
   - `pgTable.withRLS(...)` + `tenantPolicy(column)` from `shared.ts` for row-level tenant isolation (`app.tenant_id` GUC). RLS isolates tenants; field-level authz stays in the API.
   - `recordColumns()` / `recordConstraints(name, t)` from `shared.ts` for the standard `id` (uuid) / `tenantId` / `createdAt` / `updatedAt` / `revision` columns, the `(tenant_id, id)` unique, and the standard indexes.
   - `entityRegistry` + `entityConstraints(name, t, kind)` (`catalog.ts`) for the shared-identity pattern: typed entity tables carry a composite FK back to `entity_registry` on `(tenant_id, id, kind)`.
   - All enums are centralized in `enum.ts` (`pgEnum`).
   - `$inferSelect` / `$inferInsert` types are internal persistence types, not public DTOs.
   - `revision` / `updatedAt` are maintained by SQL triggers, not app code. `shared.ts` notes an invariants SQL file to apply after the generated baseline migration — check with the user for out-of-band SQL when setting up a fresh DB.
   - `tables.ts` aggregates every domain table into the `tables` object and re-exports select public types.

## Guardrails already wired

- PreToolUse hook blocks Write/Edit on any `.env*` file — edit those by hand.
- PostToolUse hooks run `bun run fix` and a scoped `turbo check-types` after edits.
- `.claude/settings.json` and `.mcp.json` are checked in (context7, shadcn, supabase, better-auth, playwright MCP servers).

## Notes

- A `.codex/config.toml` exists (OpenAI Codex) and `~/.codex` / `~/.gemini` are present on this machine. Reply `/import` to scan them for importable MCP servers, commands, subagents, skills, or instructions.
