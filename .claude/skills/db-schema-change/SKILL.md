---
name: db-schema-change
description: Change the Drizzle/Postgres schema in this monorepo (packages/db) and run the correct migration workflow, including Better Auth and Supabase considerations
disable-model-invocation: true
---

# DB Schema Change

Workflow for changing the database schema in this repo. This wraps the generic
`supabase-postgres-best-practices` skill with **this project's** exact package
layout and commands — load that skill too for general Postgres/RLS guidance.

## Where things live

- Schema files: `packages/db/src/schema/*.ts` (e.g. `auth.ts` holds the Better
  Auth tables: `user`, `session`, `account`, `verification`)
- Relations: `defineRelations(...)` exported per schema file (e.g.
  `authRelations`), wired into `drizzle()` in `packages/db/src/index.ts` via
  the `relations` option — **any new schema file with relations must be
  imported and merged there or the query API won't see it**
- Migrations output: `packages/db/src/migrations/`
- Config: `packages/db/drizzle.config.ts` — loads `DATABASE_URL` from
  `apps/server/.env` (not `packages/db/.env`)
- The Postgres instance is Supabase-hosted (see `supabase/config.toml`)

## Workflow

1. Edit or add a table in `packages/db/src/schema/*.ts` using `pgTable` from
   `drizzle-orm/pg-core`, following the existing style: `text("...")` id
   columns (not serial), explicit `createdAt`/`updatedAt` timestamps with
   `.$onUpdate(() => new Date())`, indexes/unique constraints declared in the
   third `pgTable` argument, foreign keys via `.references(() => table.id, {
   onDelete: "cascade" })`.
2. If the table needs relations, extend an existing `defineRelations(...)`
   call or add a new one, then make sure it's merged into the `relations`
   passed to `drizzle()` in `packages/db/src/index.ts`.
3. Generate the migration from the package: `bun run db:generate -F
   @saasmanager/db` (or `cd packages/db && bun run db:generate`). Review the
   generated SQL in `packages/db/src/migrations/` before applying — don't hand
   edit generated migration files after the fact; regenerate instead.
4. Apply it locally: `bun run db:migrate`. Never use `db:push` against a
   Supabase project with real data — it's for local prototyping only, since it
   skips the migration history Supabase's dashboard and pooler expect.
5. If the table will be queried directly by end users through Supabase's
   PostgREST/Realtime layer (not just through the oRPC server), add Row Level
   Security policies — tables reached only through `apps/server` (service-role
   Postgres connection) don't strictly need RLS, but default to enabling it
   for defense in depth. Use the `supabase-postgres-best-practices` skill for
   policy patterns.
6. If the change touches `user`, `session`, `account`, or `verification`,
   cross-check `packages/auth/src/index.ts` — Better Auth's Drizzle adapter
   expects specific column names/shapes, and a mismatch fails silently at
   runtime rather than at compile time.
7. Run `bun run check-types -F @saasmanager/db` (the PostToolUse hook does
   this automatically on edit) and confirm `apps/server` and `apps/web` still
   type-check, since both consume `@saasmanager/db` types transitively through
   `@saasmanager/api`.

## Don't

- Don't add a schema file without registering its relations in
  `packages/db/src/index.ts` — queries silently lose the `with: {...}` join
  capability instead of erroring.
- Don't run `db:push` in place of `db:generate` + `db:migrate` for anything
  destined for the shared Supabase database.
- Don't hand-write SQL migrations in `src/migrations/` — always generate from
  the schema so drift can't creep in between the TS types and the DB.
