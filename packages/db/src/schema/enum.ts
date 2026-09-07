import { pgEnum } from "drizzle-orm/pg-core";

export const entityKind = pgEnum("entity_kind", [
  "vendor",
  "product",
  "application",
  "instance",
  "person",
  "group",
  "service_principal",
  "account",
  "contract",
  "subscription",
  "entitlement",
  "technical_asset",
]);
export const applicationLifecycle = pgEnum("application_lifecycle", [
  "proposed",
  "active",
  "retiring",
  "retired",
]);
export const managementStatus = pgEnum("management_status", [
  "discovered",
  "managed",
  "ignored",
]);
export const sanctionStatus = pgEnum("sanction_status", [
  "unreviewed",
  "approved",
  "restricted",
  "blocked",
]);
export const criticality = pgEnum("criticality", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const dataClassification = pgEnum("data_classification", [
  "public",
  "internal",
  "confidential",
  "restricted",
]);
export const instanceEnvironment = pgEnum("instance_environment", [
  "production",
  "sandbox",
  "development",
  "test",
  "unknown",
]);
export const instanceStatus = pgEnum("instance_status", [
  "active",
  "inactive",
  "unknown",
]);
export const personType = pgEnum("person_type", [
  "employee",
  "contractor",
  "external",
]);
export const personStatus = pgEnum("person_status", [
  "active",
  "leave",
  "departed",
  "unknown",
]);
export const groupType = pgEnum("group_type", [
  "team",
  "department",
  "cost_center",
  "legal_entity",
  "access_group",
]);
export const activeStatus = pgEnum("active_status", ["active", "retired"]);
export const membershipRole = pgEnum("membership_role", ["member", "manager"]);
export const ownershipRole = pgEnum("ownership_role", [
  "business",
  "technical",
  "procurement",
  "security",
  "billing",
]);
export const accountType = pgEnum("account_type", [
  "human",
  "service",
  "shared",
  "unknown",
]);
export const accountStatus = pgEnum("account_status", [
  "invited",
  "active",
  "suspended",
  "deprovisioned",
  "unknown",
]);
export const contractStatus = pgEnum("contract_status", [
  "draft",
  "executed",
  "terminated",
  "expired",
]);
export const autoRenew = pgEnum("auto_renew", ["yes", "no", "unknown"]);
export const pricingModel = pgEnum("pricing_model", [
  "seat",
  "flat",
  "metered",
  "hybrid",
  "free",
]);
export const billingCadence = pgEnum("billing_cadence", [
  "monthly",
  "quarterly",
  "annual",
  "one_time",
  "custom",
  "none",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trial",
  "active",
  "canceled",
  "expired",
]);
export const entitlementType = pgEnum("entitlement_type", [
  "seat",
  "usage",
  "feature",
]);
export const capacityType = pgEnum("capacity_type", [
  "fixed",
  "unlimited",
  "unknown",
]);
export const consumptionBasis = pgEnum("consumption_basis", [
  "account",
  "principal",
  "instance",
  "usage",
]);
export const scopeType = pgEnum("scope_type", [
  "all_covered_applications",
  "instances",
]);
export const meteringPeriod = pgEnum("metering_period", [
  "none",
  "day",
  "month",
  "year",
  "contract_term",
]);
export const assignmentState = pgEnum("assignment_state", [
  "assigned",
  "revoked",
  "unknown",
]);
export const metricAggregation = pgEnum("metric_aggregation", [
  "sum",
  "max",
  "latest",
  "distinct_subjects",
]);
export const metricSignal = pgEnum("metric_signal", [
  "product_activity",
  "authentication",
  "billing_meter",
]);
export const metricStatus = pgEnum("metric_status", ["active", "deprecated"]);
export const coverage = pgEnum("coverage", ["complete", "partial", "unknown"]);
export const reconciliationStatus = pgEnum("reconciliation_status", [
  "canonical",
  "duplicate",
  "unresolved",
]);
export const spendType = pgEnum("spend_type", [
  "invoice_line",
  "payment_line",
  "expense_line",
  "credit_line",
  "refund_line",
]);
export const spendBasis = pgEnum("spend_basis", ["invoiced", "paid"]);
export const technicalAssetType = pgEnum("technical_asset_type", [
  "domain",
  "system",
  "component",
  "api",
  "resource",
]);
export const technicalLifecycle = pgEnum("technical_lifecycle", [
  "experimental",
  "production",
  "deprecated",
  "retired",
]);
export const relationType = pgEnum("relation_type", [
  "depends_on",
  "uses",
  "provides_api",
  "consumes_api",
  "part_of",
]);
export const connectionStatus = pgEnum("connection_status", [
  "enabled",
  "disabled",
]);
export const connectionHealth = pgEnum("connection_health", [
  "healthy",
  "degraded",
  "error",
  "never_synced",
]);
export const sourceLinkStatus = pgEnum("source_link_status", [
  "linked",
  "ignored",
]);
export const observationOperation = pgEnum("observation_operation", [
  "upsert",
  "delete",
]);
export const resolutionStatus = pgEnum("resolution_status", [
  "applied",
  "unresolved",
  "conflict",
  "superseded",
]);
export const syncMode = pgEnum("sync_mode", ["incremental", "full"]);
export const syncStatus = pgEnum("sync_status", [
  "queued",
  "running",
  "succeeded",
  "partial",
  "failed",
]);
export const batchStatus = pgEnum("batch_status", [
  "queued",
  "validating",
  "reconciling",
  "succeeded",
  "partial",
  "failed",
]);
export const ingestionItemStatus = pgEnum("ingestion_item_status", [
  "pending",
  "applied",
  "duplicate",
  "conflict",
  "rejected",
]);
export const fieldAuthority = pgEnum("field_authority", [
  "manual",
  "source",
  "override",
  "derived",
]);
export const freshness = pgEnum("freshness", ["fresh", "stale", "unknown"]);
export const overrideStatus = pgEnum("override_status", ["active", "revoked"]);
export const webhookStatus = pgEnum("webhook_status", [
  "active",
  "paused",
  "retired",
]);
export const eventType = pgEnum("event_type", [
  "entity.created",
  "entity.updated",
  "entity.retired",
]);
export const deliveryStatus = pgEnum("delivery_status", [
  "pending",
  "delivered",
  "exhausted",
]);
