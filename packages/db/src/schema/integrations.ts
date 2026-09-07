import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { entityRegistry } from "./catalog";
import {
  connectionHealth,
  connectionStatus,
  entityKind,
  sourceLinkStatus,
} from "./enum";
import { recordColumns, recordConstraints } from "./shared";

// Only a vault identifier is stored. The API must redact secretRef and apply domain authorization beyond tenant RLS.
export const connections = pgTable.withRLS(
  "connections",
  {
    ...recordColumns(),
    capabilities: text("capabilities").array().notNull().default([]),
    health: connectionHealth("health").notNull().default("never_synced"),
    lastSuccessfulSyncAt: timestamp("last_successful_sync_at", {
      mode: "string",
      withTimezone: true,
    }),
    name: text("name").notNull(),
    provider: text("provider").notNull(),
    secretRef: text("secret_ref").notNull(),
    sourceNamespace: text("source_namespace").notNull(),
    status: connectionStatus("status").notNull().default("disabled"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("connections", t),
    unique("connections_source_uq").on(
      t.tenantId,
      t.provider,
      t.sourceNamespace
    ),
  ]
);

export const externalObjectLinks = pgTable.withRLS(
  "external_object_links",
  {
    ...recordColumns(),
    canonicalEntityId: uuid("canonical_entity_id"),
    canonicalEntityKind: entityKind("canonical_entity_kind"),
    connectionId: uuid("connection_id").notNull(),
    externalId: text("external_id").notNull(),
    reason: text("reason").notNull(),
    sourceObjectType: text("source_object_type").notNull(),
    status: sourceLinkStatus("status").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("external_object_links", t),
    foreignKey({
      columns: [t.tenantId, t.connectionId],
      foreignColumns: [connections.tenantId, connections.id],
      name: "external_object_links_connection_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.canonicalEntityId, t.canonicalEntityKind],
      foreignColumns: [
        entityRegistry.tenantId,
        entityRegistry.id,
        entityRegistry.kind,
      ],
      name: "external_object_links_canonical_entity_fk",
    }).onDelete("restrict"),
    index("external_object_links_canonical_entity_idx").on(
      t.tenantId,
      t.canonicalEntityId,
      t.canonicalEntityKind
    ),
    unique("external_object_links_source_object_uq").on(
      t.tenantId,
      t.connectionId,
      t.sourceObjectType,
      t.externalId
    ),
    check(
      "external_object_links_target",
      sql`(${t.status} = 'linked' and ${t.canonicalEntityId} is not null and ${t.canonicalEntityKind} is not null) or (${t.status} = 'ignored' and ${t.canonicalEntityId} is null and ${t.canonicalEntityKind} is null)`
    ),
  ]
);
