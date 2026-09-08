import { getTableName, sql } from "drizzle-orm";

import { tables } from "./schema/tables";
import type { Database } from "./tenant";

export async function assertRuntimeDatabase(
  database: Pick<Database, "execute">
): Promise<void> {
  const roles = await database.execute<{ unsafe: boolean }>(sql`
    select exists (
      select 1 from pg_roles r
      where pg_has_role(current_user, r.oid, 'MEMBER')
        and (r.rolsuper or r.rolbypassrls or r.rolcreaterole)
    ) as unsafe
  `);
  if (roles[0]?.unsafe !== false) {
    throw new Error(
      "Runtime database role must not have access to elevated roles"
    );
  }
  const names = Object.values(tables).map((table) => getTableName(table));
  const rows = await database.execute<{ name: string; safe: boolean }>(sql`
    select c.relname as name,
      c.relrowsecurity
      and (not pg_has_role(current_user, c.relowner, 'MEMBER') or c.relforcerowsecurity)
      and has_table_privilege(current_user, c.oid, 'SELECT')
      and has_table_privilege(current_user, c.oid, 'INSERT')
      and has_table_privilege(current_user, c.oid, 'UPDATE')
      and has_table_privilege(current_user, c.oid, 'DELETE')
      and not has_table_privilege(current_user, c.oid, 'TRUNCATE')
      and (select count(*) = 1 from pg_policy p where p.polrelid = c.oid)
      and exists (select 1 from pg_policy p where p.polrelid = c.oid
        and p.polname = 'tenant_isolation' and p.polcmd = '*'
        and p.polqual is not null and p.polwithcheck is not null)
      as safe
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in (${sql.join(
      names.map((name) => sql`${name}`),
      sql`, `
    )})
  `);
  if (rows.length !== names.length || rows.some((row) => !row.safe)) {
    throw new Error(
      "Runtime database requires tenant RLS (forced for owners) and limited DML grants"
    );
  }
}
