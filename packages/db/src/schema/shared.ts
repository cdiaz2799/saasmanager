import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  jsonb,
  type PgTableExtraConfigValue,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface ResourceLocator {
  href: string;
  id: string;
  resourceType: string;
}

// RLS isolates tenants; domain/field authorization still belongs to the trusted API.
export const tenantPolicy = (column: AnyPgColumn) =>
  pgPolicy("tenant_isolation", {
    for: "all",
    to: "public",
    using: sql`${column} = nullif(current_setting('app.tenant_id', true), '')::uuid`,
    withCheck: sql`${column} = nullif(current_setting('app.tenant_id', true), '')::uuid`,
  });

export const tenants = pgTable.withRLS(
  "tenants",
  {
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
    defaultCurrency: text("default_currency").notNull().default("USD"),
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    retentionConfig: jsonb("retention_config")
      .$type<JsonObject>()
      .notNull()
      .default({}),
    timezone: text("timezone").notNull().default("UTC"),
  },
  (t) => [
    tenantPolicy(t.id),
    check("tenants_currency", sql`${t.defaultCurrency} ~ '^[A-Z]{3}$'`),
    check(
      "tenants_retention_config_json",
      sql`jsonb_typeof(${t.retentionConfig}) = 'object'`
    ),
  ]
);

// Fresh builders for every table. Database revision/updatedAt maintenance is pending.
export const recordColumns = () => ({
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
  id: uuid("id").defaultRandom().primaryKey(),
  revision: integer("revision").notNull().default(1),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "restrict" }),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
});
export interface RecordColumns {
  createdAt: AnyPgColumn;
  id: AnyPgColumn;
  revision: AnyPgColumn;
  tenantId: AnyPgColumn;
  updatedAt: AnyPgColumn;
}
export const recordConstraints = (
  name: string,
  t: RecordColumns
): PgTableExtraConfigValue[] => [
  unique(`${name}_tenant_id_id`).on(t.tenantId, t.id),
  check(`${name}_revision_positive`, sql`${t.revision} >= 1`),
  index(`${name}_created_idx`).on(t.tenantId, t.createdAt, t.id),
  index(`${name}_updated_idx`).on(t.tenantId, t.updatedAt, t.id),
  tenantPolicy(t.tenantId),
];
