import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  jsonb,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { entityConstraints, entityRegistry } from "./catalog";
import {
  entityKind,
  relationType,
  technicalAssetType,
  technicalLifecycle,
} from "./enum";
import { type JsonObject, recordColumns, recordConstraints } from "./shared";

export const technicalAssets = pgTable.withRLS(
  "technical_assets",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    apiDefinitionUrl: text("api_definition_url"),
    assetType: technicalAssetType("asset_type").notNull(),
    backstageRef: text("backstage_ref"),
    description: text("description"),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("technical_asset"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    lifecycle: technicalLifecycle("lifecycle").notNull(),
    name: text("name").notNull(),
    namespace: text("namespace").notNull().default("default"),
    subtype: text("subtype"),
    title: text("title").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("technical_assets", t, "technical_asset"),
    unique("technical_assets_catalog_name_uq").on(
      t.tenantId,
      t.assetType,
      t.namespace,
      t.name
    ),
    check(
      "technical_assets_namespace_lower",
      sql`${t.namespace} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
    ),
    check(
      "technical_assets_name_lower",
      sql`${t.name} ~ '^[a-z0-9]+([-_.][a-z0-9]+)*$'`
    ),
    check(
      "technical_assets_api_definition",
      sql`${t.apiDefinitionUrl} is null or ${t.assetType} = 'api'`
    ),
    check(
      "technical_assets_labels_json",
      sql`jsonb_typeof(${t.labels}) = 'object'`
    ),
    check(
      "technical_assets_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "technical_assets_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

// Endpoint FKs are enforced. Endpoint kind rules, temporal DAG checks, and exclusion of overlapping duplicate edges are pending.
export const relationships = pgTable.withRLS(
  "relationships",
  {
    ...recordColumns(),
    description: text("description"),
    relationType: relationType("relation_type").notNull(),
    sourceEntityId: uuid("source_entity_id").notNull(),
    targetEntityId: uuid("target_entity_id").notNull(),
    validFrom: timestamp("valid_from", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    validTo: timestamp("valid_to", { mode: "string", withTimezone: true }),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("relationships", t),
    foreignKey({
      columns: [t.tenantId, t.sourceEntityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "relationships_source_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.targetEntityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "relationships_target_fk",
    }).onDelete("restrict"),
    index("relationships_incoming_idx").on(
      t.tenantId,
      t.targetEntityId,
      t.relationType
    ),
    index("relationships_outgoing_idx").on(
      t.tenantId,
      t.sourceEntityId,
      t.relationType
    ),
    check(
      "relationships_valid_from_before_valid_to",
      sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`
    ),
    check(
      "relationships_not_self",
      sql`${t.sourceEntityId} <> ${t.targetEntityId}`
    ),
  ]
);
