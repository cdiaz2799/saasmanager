import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { accounts, entityRegistry } from "./catalog";
import { licenseAssignments, spendRecords, usageRecords } from "./commercial";
import {
  batchStatus,
  fieldAuthority,
  freshness,
  ingestionItemStatus,
  observationOperation,
  overrideStatus,
  resolutionStatus,
  syncMode,
  syncStatus,
} from "./enum";
import { connections } from "./integrations";
import {
  type JsonObject,
  type JsonValue,
  type ResourceLocator,
  recordColumns,
  recordConstraints,
} from "./shared";

// Append-only enforcement is pending. Payload is stored by opaque reference; no credentials or full provider payload in this table.
export const observations = pgTable.withRLS(
  "observations",
  {
    ...recordColumns(),
    connectionId: uuid("connection_id").notNull(),
    effectiveAt: timestamp("effective_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    externalId: text("external_id").notNull(),
    observedAt: timestamp("observed_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    operation: observationOperation("operation").notNull(),
    payloadRef: text("payload_ref").notNull(),
    payloadSha256: text("payload_sha256").notNull(),
    receivedAt: timestamp("received_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    sourceObjectType: text("source_object_type").notNull(),
    sourceSchemaVersion: text("source_schema_version").notNull(),
    sourceSequence: numeric("source_sequence", { precision: 39, scale: 0 }),
    sourceVersion: text("source_version").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("observations", t),
    unique("observations_id_connection_uq").on(
      t.tenantId,
      t.id,
      t.connectionId
    ),
    foreignKey({
      columns: [t.tenantId, t.connectionId],
      foreignColumns: [connections.tenantId, connections.id],
      name: "observations_connection_fk",
    }).onDelete("restrict"),
    unique("observations_source_version_uq").on(
      t.tenantId,
      t.connectionId,
      t.sourceObjectType,
      t.externalId,
      t.sourceVersion
    ),
    check("observations_sha256", sql`${t.payloadSha256} ~ '^[0-9a-f]{64}$'`),
    check(
      "observations_source_sequence_finite",
      sql`${t.sourceSequence} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check(
      "observations_source_sequence_nonnegative",
      sql`${t.sourceSequence} >= 0`
    ),
  ]
);

// Append-only enforcement is pending. Locators may refer to historical/non-catalog resource rows.
export const observationResolutions = pgTable.withRLS(
  "observation_resolutions",
  {
    ...recordColumns(),
    canonicalEntityId: uuid("canonical_entity_id"),
    details: jsonb("details").$type<JsonObject>().notNull().default({}),
    observationId: uuid("observation_id").notNull(),
    resolutionVersion: integer("resolution_version").notNull(),
    resolvedResources: jsonb("resolved_resources")
      .$type<ResourceLocator[]>()
      .notNull()
      .default([]),
    ruleVersion: text("rule_version").notNull(),
    status: resolutionStatus("status").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("observation_resolutions", t),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "observation_resolutions_observation_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.canonicalEntityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "observation_resolutions_canonical_entity_fk",
    }).onDelete("restrict"),
    index("observation_resolutions_canonical_entity_idx").on(
      t.tenantId,
      t.canonicalEntityId
    ),
    unique("observation_resolutions_observation_version_uq").on(
      t.tenantId,
      t.observationId,
      t.resolutionVersion
    ),
    check(
      "observation_resolutions_positive_version",
      sql`${t.resolutionVersion} >= 1`
    ),
    check(
      "observation_resolutions_resolved_resources_json",
      sql`jsonb_typeof(${t.resolvedResources}) = 'array'`
    ),
    check(
      "observation_resolutions_details_json",
      sql`jsonb_typeof(${t.details}) = 'object'`
    ),
  ]
);

// Pending: revoke expired active rows under a per-field lock during creation and in an expiry worker.
export const fieldOverrides = pgTable.withRLS(
  "field_overrides",
  {
    ...recordColumns(),
    actorId: text("actor_id").notNull(),
    entityId: uuid("entity_id").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }),
    fieldPath: text("field_path").notNull(),
    reason: text("reason").notNull(),
    status: overrideStatus("status").notNull().default("active"),
    value: jsonb("value").$type<JsonValue>().notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("field_overrides", t),
    unique("field_overrides_id_entity_field_uq").on(
      t.tenantId,
      t.id,
      t.entityId,
      t.fieldPath
    ),
    foreignKey({
      columns: [t.tenantId, t.entityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "field_overrides_entity_fk",
    }).onDelete("restrict"),
    index("field_overrides_entity_idx").on(t.tenantId, t.entityId),
    uniqueIndex("field_overrides_active_field_uq")
      .on(t.tenantId, t.entityId, t.fieldPath)
      .where(sql`${t.status} = 'active'`),
    check("field_overrides_whole_field", sql`${t.fieldPath} ~ '^/[^/]+$'`),
    check("field_overrides_reason", sql`length(trim(${t.reason})) > 0`),
  ]
);

export const fieldProvenance = pgTable.withRLS(
  "field_provenance",
  {
    ...recordColumns(),
    authority: fieldAuthority("authority").notNull(),
    connectionId: uuid("connection_id"),
    effectiveAt: timestamp("effective_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    entityId: uuid("entity_id").notNull(),
    fieldPath: text("field_path").notNull(),
    freshness: freshness("freshness").notNull(),
    overrideId: uuid("override_id"),
    recordedAt: timestamp("recorded_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    ruleVersion: text("rule_version").notNull(),
    winningObservationId: uuid("winning_observation_id"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("field_provenance", t),
    foreignKey({
      columns: [t.tenantId, t.entityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "field_provenance_entity_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.connectionId],
      foreignColumns: [connections.tenantId, connections.id],
      name: "field_provenance_connection_fk",
    }).onDelete("restrict"),
    index("field_provenance_connection_idx").on(t.tenantId, t.connectionId),
    foreignKey({
      columns: [t.tenantId, t.winningObservationId, t.connectionId],
      foreignColumns: [
        observations.tenantId,
        observations.id,
        observations.connectionId,
      ],
      name: "field_provenance_winning_observation_fk",
    }).onDelete("restrict"),
    index("field_provenance_winning_observation_idx").on(
      t.tenantId,
      t.winningObservationId,
      t.connectionId
    ),
    foreignKey({
      columns: [t.tenantId, t.overrideId, t.entityId, t.fieldPath],
      foreignColumns: [
        fieldOverrides.tenantId,
        fieldOverrides.id,
        fieldOverrides.entityId,
        fieldOverrides.fieldPath,
      ],
      name: "field_provenance_override_fk",
    }).onDelete("restrict"),
    index("field_provenance_override_idx").on(
      t.tenantId,
      t.overrideId,
      t.entityId,
      t.fieldPath
    ),
    unique("field_provenance_field_uq").on(t.tenantId, t.entityId, t.fieldPath),
    check(
      "field_provenance_observation_connection",
      sql`${t.winningObservationId} is null or ${t.connectionId} is not null`
    ),
    check(
      "field_provenance_source_required",
      sql`${t.authority} <> 'source' or (${t.connectionId} is not null and ${t.winningObservationId} is not null)`
    ),
    check(
      "field_provenance_override_required",
      sql`(${t.authority} = 'override' and ${t.overrideId} is not null) or (${t.authority} <> 'override' and ${t.overrideId} is null)`
    ),
  ]
);

export const provenanceConflicts = pgTable.withRLS(
  "provenance_conflicts",
  {
    ...recordColumns(),
    fieldProvenanceId: uuid("field_provenance_id").notNull(),
    observationId: uuid("observation_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("provenance_conflicts", t),
    foreignKey({
      columns: [t.tenantId, t.fieldProvenanceId],
      foreignColumns: [fieldProvenance.tenantId, fieldProvenance.id],
      name: "provenance_conflicts_field_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "provenance_conflicts_observation_fk",
    }).onDelete("restrict"),
    index("provenance_conflicts_observation_idx").on(
      t.tenantId,
      t.observationId
    ),
    unique("provenance_conflicts_pair_uq").on(
      t.tenantId,
      t.fieldProvenanceId,
      t.observationId
    ),
  ]
);

export const accountObservations = pgTable.withRLS(
  "account_observations",
  {
    ...recordColumns(),
    accountId: uuid("account_id").notNull(),
    observationId: uuid("observation_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("account_observations", t),
    foreignKey({
      columns: [t.tenantId, t.accountId],
      foreignColumns: [accounts.tenantId, accounts.id],
      name: "account_observations_record_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "account_observations_observation_fk",
    }).onDelete("restrict"),
    index("account_observations_observation_idx").on(
      t.tenantId,
      t.observationId
    ),
    unique("account_observations_pair_uq").on(
      t.tenantId,
      t.accountId,
      t.observationId
    ),
  ]
);

export const assignmentObservations = pgTable.withRLS(
  "assignment_observations",
  {
    ...recordColumns(),
    assignmentId: uuid("assignment_id").notNull(),
    observationId: uuid("observation_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("assignment_observations", t),
    foreignKey({
      columns: [t.tenantId, t.assignmentId],
      foreignColumns: [licenseAssignments.tenantId, licenseAssignments.id],
      name: "assignment_observations_record_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "assignment_observations_observation_fk",
    }).onDelete("restrict"),
    index("assignment_observations_observation_idx").on(
      t.tenantId,
      t.observationId
    ),
    unique("assignment_observations_pair_uq").on(
      t.tenantId,
      t.assignmentId,
      t.observationId
    ),
  ]
);

export const usageObservations = pgTable.withRLS(
  "usage_observations",
  {
    ...recordColumns(),
    observationId: uuid("observation_id").notNull(),
    usageRecordId: uuid("usage_record_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("usage_observations", t),
    foreignKey({
      columns: [t.tenantId, t.usageRecordId],
      foreignColumns: [usageRecords.tenantId, usageRecords.id],
      name: "usage_observations_record_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "usage_observations_observation_fk",
    }).onDelete("restrict"),
    index("usage_observations_observation_idx").on(t.tenantId, t.observationId),
    unique("usage_observations_pair_uq").on(
      t.tenantId,
      t.usageRecordId,
      t.observationId
    ),
  ]
);

export const spendObservations = pgTable.withRLS(
  "spend_observations",
  {
    ...recordColumns(),
    observationId: uuid("observation_id").notNull(),
    spendRecordId: uuid("spend_record_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("spend_observations", t),
    foreignKey({
      columns: [t.tenantId, t.spendRecordId],
      foreignColumns: [spendRecords.tenantId, spendRecords.id],
      name: "spend_observations_record_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "spend_observations_observation_fk",
    }).onDelete("restrict"),
    index("spend_observations_observation_idx").on(t.tenantId, t.observationId),
    unique("spend_observations_pair_uq").on(
      t.tenantId,
      t.spendRecordId,
      t.observationId
    ),
  ]
);

export const syncRuns = pgTable.withRLS(
  "sync_runs",
  {
    ...recordColumns(),
    checkpoint: jsonb("checkpoint").$type<JsonObject>(),
    collections: text("collections").array().notNull(),
    connectionId: uuid("connection_id").notNull(),
    error: jsonb("error").$type<JsonObject>(),
    errorCount: integer("error_count").notNull().default(0),
    finishedAt: timestamp("finished_at", {
      mode: "string",
      withTimezone: true,
    }),
    mode: syncMode("mode").notNull(),
    processedCount: integer("processed_count").notNull().default(0),
    startedAt: timestamp("started_at", { mode: "string", withTimezone: true }),
    status: syncStatus("status").notNull().default("queued"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("sync_runs", t),
    foreignKey({
      columns: [t.tenantId, t.connectionId],
      foreignColumns: [connections.tenantId, connections.id],
      name: "sync_runs_connection_fk",
    }).onDelete("restrict"),
    index("sync_runs_connection_idx").on(t.tenantId, t.connectionId),
    uniqueIndex("sync_runs_active_connection_uq")
      .on(t.tenantId, t.connectionId)
      .where(sql`${t.status} in ('queued','running')`),
    check(
      "sync_runs_processed_count_nonnegative",
      sql`${t.processedCount} >= 0`
    ),
    check("sync_runs_error_count_nonnegative", sql`${t.errorCount} >= 0`),
    check(
      "sync_runs_terminal_finished_at",
      sql`${t.status} not in ('succeeded','partial','failed') or ${t.finishedAt} is not null`
    ),
    check("sync_runs_time_order", sql`${t.finishedAt} >= ${t.startedAt}`),
    check(
      "sync_runs_checkpoint_json",
      sql`jsonb_typeof(${t.checkpoint}) = 'object'`
    ),
    check("sync_runs_error_json", sql`jsonb_typeof(${t.error}) = 'object'`),
  ]
);

export const ingestionBatches = pgTable.withRLS(
  "ingestion_batches",
  {
    ...recordColumns(),
    acceptedCount: integer("accepted_count").notNull().default(0),
    connectionId: uuid("connection_id").notNull(),
    finishedAt: timestamp("finished_at", {
      mode: "string",
      withTimezone: true,
    }),
    receivedCount: integer("received_count").notNull(),
    rejectedCount: integer("rejected_count").notNull().default(0),
    status: batchStatus("status").notNull().default("queued"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("ingestion_batches", t),
    foreignKey({
      columns: [t.tenantId, t.connectionId],
      foreignColumns: [connections.tenantId, connections.id],
      name: "ingestion_batches_connection_fk",
    }).onDelete("restrict"),
    index("ingestion_batches_connection_idx").on(t.tenantId, t.connectionId),
    check(
      "ingestion_batches_batch_size",
      sql`${t.receivedCount} between 1 and 500`
    ),
    check(
      "ingestion_batches_accepted_count_nonnegative",
      sql`${t.acceptedCount} >= 0`
    ),
    check(
      "ingestion_batches_rejected_count_nonnegative",
      sql`${t.rejectedCount} >= 0`
    ),
    check(
      "ingestion_batches_counts",
      sql`${t.acceptedCount} + ${t.rejectedCount} <= ${t.receivedCount}`
    ),
    check(
      "ingestion_batches_terminal_counts",
      sql`${t.status} not in ('succeeded','partial','failed') or (${t.acceptedCount} + ${t.rejectedCount} = ${t.receivedCount} and ${t.finishedAt} is not null)`
    ),
  ]
);

export const ingestionItems = pgTable.withRLS(
  "ingestion_items",
  {
    ...recordColumns(),
    batchId: uuid("batch_id").notNull(),
    clientRecordId: text("client_record_id").notNull(),
    error: jsonb("error").$type<JsonObject>(),
    inputIndex: integer("input_index").notNull(),
    observationId: uuid("observation_id"),
    resolvedResources: jsonb("resolved_resources")
      .$type<ResourceLocator[]>()
      .notNull()
      .default([]),
    status: ingestionItemStatus("status").notNull().default("pending"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("ingestion_items", t),
    foreignKey({
      columns: [t.tenantId, t.batchId],
      foreignColumns: [ingestionBatches.tenantId, ingestionBatches.id],
      name: "ingestion_items_batch_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.observationId],
      foreignColumns: [observations.tenantId, observations.id],
      name: "ingestion_items_observation_fk",
    }).onDelete("restrict"),
    index("ingestion_items_observation_idx").on(t.tenantId, t.observationId),
    unique("ingestion_items_input_uq").on(t.tenantId, t.batchId, t.inputIndex),
    unique("ingestion_items_client_key_uq").on(
      t.tenantId,
      t.batchId,
      t.clientRecordId
    ),
    check(
      "ingestion_items_index_range",
      sql`${t.inputIndex} between 0 and 499`
    ),
    check(
      "ingestion_items_resolved_resources_json",
      sql`jsonb_typeof(${t.resolvedResources}) = 'array'`
    ),
    check(
      "ingestion_items_error_json",
      sql`jsonb_typeof(${t.error}) = 'object'`
    ),
  ]
);
