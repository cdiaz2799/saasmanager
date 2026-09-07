import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { entityRegistry } from "./catalog";
import { deliveryStatus, eventType, webhookStatus } from "./enum";
import {
  type JsonObject,
  type JsonValue,
  recordColumns,
  recordConstraints,
} from "./shared";

// Append-only enforcement is pending. The historical locator has no FK so retention/purge cannot erase audit identity. Do not store secrets.
export const resourceRevisions = pgTable.withRLS(
  "resource_revisions",
  {
    ...recordColumns(),
    effectiveAt: timestamp("effective_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    recordedAt: timestamp("recorded_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    representation: jsonb("representation").$type<JsonObject>().notNull(),
    resourceId: uuid("resource_id").notNull(),
    resourceRevision: integer("resource_revision").notNull(),
    resourceType: text("resource_type").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("resource_revisions", t),
    unique("resource_revisions_version_uq").on(
      t.tenantId,
      t.resourceType,
      t.resourceId,
      t.resourceRevision
    ),
    index("resource_revisions_history_idx").on(
      t.tenantId,
      t.resourceType,
      t.resourceId,
      t.recordedAt
    ),
    check(
      "resource_revisions_positive_resource_revision",
      sql`${t.resourceRevision} >= 1`
    ),
    check(
      "resource_revisions_representation_json",
      sql`jsonb_typeof(${t.representation}) = 'object'`
    ),
  ]
);

// Append-only enforcement is pending. Resource locator survives retention; values and secrets are not logged here.
export const auditEvents = pgTable.withRLS(
  "audit_events",
  {
    ...recordColumns(),
    action: text("action").notNull(),
    actorId: text("actor_id").notNull(),
    afterRevision: integer("after_revision"),
    beforeRevision: integer("before_revision"),
    changedPaths: text("changed_paths").array().notNull().default([]),
    occurredAt: timestamp("occurred_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    reason: text("reason"),
    requestId: text("request_id").notNull(),
    resourceId: uuid("resource_id").notNull(),
    resourceType: text("resource_type").notNull(),
  },
  (t) => [
    ...recordConstraints("audit_events", t),
    check(
      "audit_events_before_revision_positive",
      sql`${t.beforeRevision} >= 1`
    ),
    check("audit_events_after_revision_positive", sql`${t.afterRevision} >= 1`),
    index("audit_events_resource_idx").on(
      t.tenantId,
      t.resourceId,
      t.occurredAt
    ),
  ]
);

// Pending: increment under a tenant-local lock in the outbox transaction so sequence order follows commit order.
export const tenantEventCounters = pgTable.withRLS(
  "tenant_event_counters",
  {
    ...recordColumns(),
    lastSequence: bigint("last_sequence", { mode: "bigint" })
      .notNull()
      .default(0n),
  },
  (t) => [
    ...recordConstraints("tenant_event_counters", t),
    unique("tenant_event_counters_tenant_uq").on(t.tenantId),
    check(
      "tenant_event_counters_nonnegative_sequence",
      sql`${t.lastSequence} >= 0`
    ),
  ]
);

// Append-only and transactional sequence assignment are pending. Supply eventSequence explicitly; serialize bigint as a decimal string at the API boundary.
export const outboxEvents = pgTable.withRLS(
  "outbox_events",
  {
    ...recordColumns(),
    changedPaths: text("changed_paths").array().notNull().default([]),
    entityId: uuid("entity_id").notNull(),
    entityRevision: integer("entity_revision").notNull(),
    eventSequence: bigint("event_sequence", { mode: "bigint" }).notNull(),
    eventType: eventType("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { mode: "string", withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("outbox_events", t),
    foreignKey({
      columns: [t.tenantId, t.entityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "outbox_events_entity_fk",
    }).onDelete("restrict"),
    unique("outbox_events_sequence_uq").on(t.tenantId, t.eventSequence),
    unique("outbox_events_entity_event_uq").on(
      t.tenantId,
      t.entityId,
      t.entityRevision,
      t.eventType
    ),
    check("outbox_events_positive_sequence", sql`${t.eventSequence} > 0`),
    check(
      "outbox_events_positive_entity_revision",
      sql`${t.entityRevision} >= 1`
    ),
  ]
);

// Re-evaluate deliveryPrincipalId authorization for every delivery. The backend performs URL/DNS egress validation and HMAC signing.
export const webhookSubscriptions = pgTable.withRLS(
  "webhook_subscriptions",
  {
    ...recordColumns(),
    deliveryPrincipalId: text("delivery_principal_id").notNull(),
    eventTypes: eventType("event_types").array().notNull(),
    name: text("name").notNull(),
    secretFingerprint: text("secret_fingerprint").notNull(),
    signingSecretRef: text("signing_secret_ref").notNull(),
    status: webhookStatus("status").notNull().default("active"),
    url: text("url").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("webhook_subscriptions", t),
    check("webhook_subscriptions_https", sql`${t.url} ~ '^https://'`),
    check(
      "webhook_subscriptions_event_types",
      sql`cardinality(${t.eventTypes}) > 0 and array_position(${t.eventTypes}, null) is null`
    ),
  ]
);

export const webhookDeliveries = pgTable.withRLS(
  "webhook_deliveries",
  {
    ...recordColumns(),
    attemptCount: integer("attempt_count").notNull().default(0),
    deliveredAt: timestamp("delivered_at", {
      mode: "string",
      withTimezone: true,
    }),
    eventId: uuid("event_id").notNull(),
    lastAttemptAt: timestamp("last_attempt_at", {
      mode: "string",
      withTimezone: true,
    }),
    lastErrorCode: text("last_error_code"),
    lastHttpStatus: integer("last_http_status"),
    nextAttemptAt: timestamp("next_attempt_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .default(sql`clock_timestamp()`),
    status: deliveryStatus("status").notNull().default("pending"),
    subscriptionId: uuid("subscription_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("webhook_deliveries", t),
    foreignKey({
      columns: [t.tenantId, t.subscriptionId],
      foreignColumns: [webhookSubscriptions.tenantId, webhookSubscriptions.id],
      name: "webhook_deliveries_subscription_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.eventId],
      foreignColumns: [outboxEvents.tenantId, outboxEvents.id],
      name: "webhook_deliveries_event_fk",
    }).onDelete("restrict"),
    index("webhook_deliveries_event_idx").on(t.tenantId, t.eventId),
    unique("webhook_deliveries_delivery_uq").on(
      t.tenantId,
      t.subscriptionId,
      t.eventId
    ),
    index("webhook_deliveries_ready_idx").on(
      t.tenantId,
      t.status,
      t.nextAttemptAt
    ),
    check(
      "webhook_deliveries_attempt_count_nonnegative",
      sql`${t.attemptCount} >= 0`
    ),
    check(
      "webhook_deliveries_http_status",
      sql`${t.lastHttpStatus} between 100 and 599`
    ),
    check(
      "webhook_deliveries_delivered_at",
      sql`(${t.status} = 'delivered') = (${t.deliveredAt} is not null)`
    ),
  ]
);

// Claim by INSERT ... ON CONFLICT in the operation transaction; same key/different semantic hash is 409. Persist queued job receipt, not a synchronous success fiction.
export const idempotencyKeys = pgTable.withRLS(
  "idempotency_keys",
  {
    ...recordColumns(),
    clientId: text("client_id").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    key: text("key").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    requestSha256: text("request_sha256").notNull(),
    responseBody: jsonb("response_body").$type<JsonValue>(),
    responseHeaders: jsonb("response_headers").$type<Record<string, string>>(),
    responseStatus: integer("response_status"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("idempotency_keys", t),
    unique("idempotency_keys_request_uq").on(
      t.tenantId,
      t.clientId,
      t.method,
      t.path,
      t.key
    ),
    index("idempotency_keys_expiry_idx").on(t.tenantId, t.expiresAt),
    check("idempotency_keys_expiration", sql`${t.expiresAt} > ${t.createdAt}`),
    check(
      "idempotency_keys_response_status",
      sql`${t.responseStatus} between 100 and 599`
    ),
    check(
      "idempotency_keys_sha256",
      sql`${t.requestSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "idempotency_keys_response_headers_json",
      sql`jsonb_typeof(${t.responseHeaders}) = 'object'`
    ),
  ]
);
