import { sql } from "drizzle-orm";
import {
  check,
  date,
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
import {
  accounts,
  applications,
  entityConstraints,
  groups,
  instances,
  vendors,
} from "./catalog";
import {
  assignmentState,
  autoRenew,
  billingCadence,
  capacityType,
  consumptionBasis,
  contractStatus,
  coverage,
  entitlementType,
  entityKind,
  groupType,
  meteringPeriod,
  metricAggregation,
  metricSignal,
  metricStatus,
  pricingModel,
  reconciliationStatus,
  scopeType,
  spendBasis,
  spendType,
  subscriptionStatus,
} from "./enum";
import { connections } from "./integrations";
import { type JsonObject, recordColumns, recordConstraints } from "./shared";

export const contracts = pgTable.withRLS(
  "contracts",
  {
    ...recordColumns(),
    agreementNumber: text("agreement_number"),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    autoRenew: autoRenew("auto_renew").notNull().default("unknown"),
    buyerGroupType: groupType("buyer_group_type")
      .notNull()
      .default("legal_entity"),
    buyingEntityGroupId: uuid("buying_entity_group_id").notNull(),
    committedAmount: numeric("committed_amount", { precision: 30, scale: 9 }),
    contractTimezone: text("contract_timezone").notNull(),
    currency: text("currency"),
    description: text("description"),
    documentRefs: text("document_refs").array().notNull().default([]),
    endDate: date("end_date", { mode: "string" }),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("contract"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    name: text("name").notNull(),
    noticeDeadline: timestamp("notice_deadline", {
      mode: "string",
      withTimezone: true,
    }),
    parentContractId: uuid("parent_contract_id"),
    renewalDate: date("renewal_date", { mode: "string" }),
    renewsContractId: uuid("renews_contract_id"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    status: contractStatus("status").notNull().default("draft"),
    supersedesContractId: uuid("supersedes_contract_id"),
    supplierVendorId: uuid("supplier_vendor_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("contracts", t, "contract"),
    foreignKey({
      columns: [t.tenantId, t.supplierVendorId],
      foreignColumns: [vendors.tenantId, vendors.id],
      name: "contracts_supplier_fk",
    }).onDelete("restrict"),
    index("contracts_supplier_idx").on(t.tenantId, t.supplierVendorId),
    foreignKey({
      columns: [t.tenantId, t.buyingEntityGroupId, t.buyerGroupType],
      foreignColumns: [groups.tenantId, groups.id, groups.groupType],
      name: "contracts_buyer_fk",
    }).onDelete("restrict"),
    index("contracts_buyer_idx").on(
      t.tenantId,
      t.buyingEntityGroupId,
      t.buyerGroupType
    ),
    foreignKey({
      columns: [t.tenantId, t.parentContractId],
      foreignColumns: [contracts.tenantId, contracts.id],
      name: "contracts_parent_fk",
    }).onDelete("restrict"),
    index("contracts_parent_idx").on(t.tenantId, t.parentContractId),
    foreignKey({
      columns: [t.tenantId, t.supersedesContractId],
      foreignColumns: [contracts.tenantId, contracts.id],
      name: "contracts_supersedes_fk",
    }).onDelete("restrict"),
    index("contracts_supersedes_idx").on(t.tenantId, t.supersedesContractId),
    foreignKey({
      columns: [t.tenantId, t.renewsContractId],
      foreignColumns: [contracts.tenantId, contracts.id],
      name: "contracts_renews_fk",
    }).onDelete("restrict"),
    index("contracts_renews_idx").on(t.tenantId, t.renewsContractId),
    index("contracts_renewal_idx").on(t.tenantId, t.renewalDate),
    index("contracts_notice_idx").on(t.tenantId, t.noticeDeadline),
    check(
      "contracts_start_date_before_end_date",
      sql`${t.endDate} is null or ${t.endDate} > ${t.startDate}`
    ),
    check(
      "contracts_committed_amount_pair",
      sql`(${t.committedAmount} is null and ${t.currency} is null) or (${t.committedAmount} is not null and ${t.currency} is not null and ${t.currency} ~ '^[A-Z]{3}$')`
    ),
    check(
      "contracts_committed_amount_finite",
      sql`${t.committedAmount} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check(
      "contracts_committed_amount_nonnegative",
      sql`${t.committedAmount} >= 0`
    ),
    check("contracts_buyer_type", sql`${t.buyerGroupType} = 'legal_entity'`),
    check(
      "contracts_not_self_chain",
      sql`${t.id} is distinct from ${t.parentContractId} and ${t.id} is distinct from ${t.supersedesContractId} and ${t.id} is distinct from ${t.renewsContractId}`
    ),
    check("contracts_labels_json", sql`jsonb_typeof(${t.labels}) = 'object'`),
    check(
      "contracts_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "contracts_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

export const subscriptions = pgTable.withRLS(
  "subscriptions",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    billingCadence: billingCadence("billing_cadence").notNull(),
    commitmentAmount: numeric("commitment_amount", { precision: 30, scale: 9 }),
    commitmentEndDate: date("commitment_end_date", { mode: "string" }),
    commitmentStartDate: date("commitment_start_date", { mode: "string" }),
    contractId: uuid("contract_id"),
    currency: text("currency"),
    description: text("description"),
    endDate: date("end_date", { mode: "string" }),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("subscription"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    name: text("name").notNull(),
    pricingModel: pricingModel("pricing_model").notNull(),
    renewsSubscriptionId: uuid("renews_subscription_id"),
    sku: text("sku"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    status: subscriptionStatus("status").notNull(),
    supersedesSubscriptionId: uuid("supersedes_subscription_id"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("subscriptions", t, "subscription"),
    foreignKey({
      columns: [t.tenantId, t.contractId],
      foreignColumns: [contracts.tenantId, contracts.id],
      name: "subscriptions_contract_fk",
    }).onDelete("restrict"),
    index("subscriptions_contract_idx").on(t.tenantId, t.contractId),
    foreignKey({
      columns: [t.tenantId, t.supersedesSubscriptionId],
      foreignColumns: [subscriptions.tenantId, subscriptions.id],
      name: "subscriptions_supersedes_fk",
    }).onDelete("restrict"),
    index("subscriptions_supersedes_idx").on(
      t.tenantId,
      t.supersedesSubscriptionId
    ),
    foreignKey({
      columns: [t.tenantId, t.renewsSubscriptionId],
      foreignColumns: [subscriptions.tenantId, subscriptions.id],
      name: "subscriptions_renews_fk",
    }).onDelete("restrict"),
    index("subscriptions_renews_idx").on(t.tenantId, t.renewsSubscriptionId),
    check(
      "subscriptions_start_date_before_end_date",
      sql`${t.endDate} is null or ${t.endDate} > ${t.startDate}`
    ),
    check(
      "subscriptions_commitment_amount_pair",
      sql`(${t.commitmentAmount} is null and ${t.currency} is null) or (${t.commitmentAmount} is not null and ${t.currency} is not null and ${t.currency} ~ '^[A-Z]{3}$')`
    ),
    check(
      "subscriptions_commitment_amount_finite",
      sql`${t.commitmentAmount} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check(
      "subscriptions_commitment_amount_nonnegative",
      sql`${t.commitmentAmount} >= 0`
    ),
    check(
      "subscriptions_commitment_period",
      sql`(${t.commitmentAmount} is null and ${t.commitmentStartDate} is null and ${t.commitmentEndDate} is null) or (${t.commitmentAmount} is not null and ${t.commitmentStartDate} is not null and ${t.commitmentEndDate} is not null and ${t.commitmentEndDate} > ${t.commitmentStartDate})`
    ),
    check(
      "subscriptions_not_self_chain",
      sql`${t.id} is distinct from ${t.supersedesSubscriptionId} and ${t.id} is distinct from ${t.renewsSubscriptionId}`
    ),
    check(
      "subscriptions_labels_json",
      sql`jsonb_typeof(${t.labels}) = 'object'`
    ),
    check(
      "subscriptions_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "subscriptions_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

// One bundle can cover several applications. Its commercial amount remains on subscriptions, once.
export const subscriptionApplications = pgTable.withRLS(
  "subscription_applications",
  {
    ...recordColumns(),
    applicationId: uuid("application_id").notNull(),
    subscriptionId: uuid("subscription_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("subscription_applications", t),
    foreignKey({
      columns: [t.tenantId, t.subscriptionId],
      foreignColumns: [subscriptions.tenantId, subscriptions.id],
      name: "subscription_applications_subscription_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.applicationId],
      foreignColumns: [applications.tenantId, applications.id],
      name: "subscription_applications_application_fk",
    }).onDelete("restrict"),
    index("subscription_applications_application_idx").on(
      t.tenantId,
      t.applicationId
    ),
    unique("subscription_applications_pair_uq").on(
      t.tenantId,
      t.subscriptionId,
      t.applicationId
    ),
  ]
);

export const entitlements = pgTable.withRLS(
  "entitlements",
  {
    ...recordColumns(),
    capacityType: capacityType("capacity_type").notNull(),
    consumptionBasis: consumptionBasis("consumption_basis").notNull(),
    entitlementType: entitlementType("entitlement_type").notNull(),
    kind: entityKind("kind").notNull().default("entitlement"),
    meteringPeriod: meteringPeriod("metering_period").notNull(),
    name: text("name").notNull(),
    quantity: numeric("quantity", { precision: 30, scale: 9 }),
    scopeType: scopeType("scope_type").notNull(),
    sku: text("sku"),
    subscriptionId: uuid("subscription_id").notNull(),
    unit: text("unit").notNull(),
    validFrom: timestamp("valid_from", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    validTo: timestamp("valid_to", { mode: "string", withTimezone: true }),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("entitlements", t, "entitlement"),
    foreignKey({
      columns: [t.tenantId, t.subscriptionId],
      foreignColumns: [subscriptions.tenantId, subscriptions.id],
      name: "entitlements_subscription_fk",
    }).onDelete("restrict"),
    index("entitlements_subscription_idx").on(t.tenantId, t.subscriptionId),
    check(
      "entitlements_valid_from_before_valid_to",
      sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`
    ),
    check(
      "entitlements_quantity_finite",
      sql`${t.quantity} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check(
      "entitlements_capacity",
      sql`(${t.capacityType} = 'fixed' and ${t.quantity} is not null and ${t.quantity} >= 0) or (${t.capacityType} in ('unlimited','unknown') and ${t.quantity} is null)`
    ),
    check(
      "entitlements_whole_seats",
      sql`${t.entitlementType} <> 'seat' or ${t.quantity} is null or ${t.quantity} = trunc(${t.quantity})`
    ),
  ]
);

export const entitlementInstances = pgTable.withRLS(
  "entitlement_instances",
  {
    ...recordColumns(),
    entitlementId: uuid("entitlement_id").notNull(),
    instanceId: uuid("instance_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("entitlement_instances", t),
    foreignKey({
      columns: [t.tenantId, t.entitlementId],
      foreignColumns: [entitlements.tenantId, entitlements.id],
      name: "entitlement_instances_entitlement_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.instanceId],
      foreignColumns: [instances.tenantId, instances.id],
      name: "entitlement_instances_instance_fk",
    }).onDelete("restrict"),
    index("entitlement_instances_instance_idx").on(t.tenantId, t.instanceId),
    unique("entitlement_instances_pair_uq").on(
      t.tenantId,
      t.entitlementId,
      t.instanceId
    ),
  ]
);

// assignmentKey is the normalized provider grant/SKU identity within an account, retained even before commercial matching. Missing usage is not zero usage.
export const licenseAssignments = pgTable.withRLS(
  "license_assignments",
  {
    ...recordColumns(),
    accountId: uuid("account_id").notNull(),
    assignmentKey: text("assignment_key").notNull(),
    assignmentState: assignmentState("assignment_state").notNull(),
    entitlementId: uuid("entitlement_id"),
    lastObservedAt: timestamp("last_observed_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    providerSku: text("provider_sku"),
    quantity: numeric("quantity", { precision: 30, scale: 9 })
      .notNull()
      .default("1"),
    validFrom: timestamp("valid_from", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    validTo: timestamp("valid_to", { mode: "string", withTimezone: true }),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("license_assignments", t),
    foreignKey({
      columns: [t.tenantId, t.accountId],
      foreignColumns: [accounts.tenantId, accounts.id],
      name: "license_assignments_account_fk",
    }).onDelete("restrict"),
    index("license_assignments_account_idx").on(t.tenantId, t.accountId),
    foreignKey({
      columns: [t.tenantId, t.entitlementId],
      foreignColumns: [entitlements.tenantId, entitlements.id],
      name: "license_assignments_entitlement_fk",
    }).onDelete("restrict"),
    index("license_assignments_entitlement_idx").on(
      t.tenantId,
      t.entitlementId
    ),
    check(
      "license_assignments_valid_from_before_valid_to",
      sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`
    ),
    check(
      "license_assignments_quantity_finite",
      sql`${t.quantity} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check("license_assignments_quantity_nonnegative", sql`${t.quantity} >= 0`),
  ]
);

export const metricDefinitions = pgTable.withRLS(
  "metric_definitions",
  {
    ...recordColumns(),
    aggregation: metricAggregation("aggregation").notNull(),
    definition: text("definition").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    signalType: metricSignal("signal_type").notNull(),
    status: metricStatus("status").notNull().default("active"),
    unit: text("unit").notNull(),
    version: integer("version").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("metric_definitions", t),
    unique("metric_definitions_key_version_uq").on(
      t.tenantId,
      t.key,
      t.version
    ),
    check("metric_definitions_positive_version", sql`${t.version} >= 1`),
  ]
);

export const usageRecords = pgTable.withRLS(
  "usage_records",
  {
    ...recordColumns(),
    accountId: uuid("account_id"),
    canonicalRecordId: uuid("canonical_record_id"),
    coverage: coverage("coverage").notNull(),
    instanceId: uuid("instance_id").notNull(),
    metricDefinitionId: uuid("metric_definition_id").notNull(),
    observedAt: timestamp("observed_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    reconciliationStatus: reconciliationStatus("reconciliation_status")
      .notNull()
      .default("unresolved"),
    value: numeric("value", { precision: 30, scale: 9 }).notNull(),
    windowEnd: timestamp("window_end", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    windowStart: timestamp("window_start", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("usage_records", t),
    foreignKey({
      columns: [t.tenantId, t.instanceId],
      foreignColumns: [instances.tenantId, instances.id],
      name: "usage_records_instance_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.accountId, t.instanceId],
      foreignColumns: [accounts.tenantId, accounts.id, accounts.instanceId],
      name: "usage_records_account_fk",
    }).onDelete("restrict"),
    index("usage_records_account_idx").on(
      t.tenantId,
      t.accountId,
      t.instanceId
    ),
    foreignKey({
      columns: [t.tenantId, t.metricDefinitionId],
      foreignColumns: [metricDefinitions.tenantId, metricDefinitions.id],
      name: "usage_records_metric_fk",
    }).onDelete("restrict"),
    index("usage_records_metric_idx").on(t.tenantId, t.metricDefinitionId),
    foreignKey({
      columns: [t.tenantId, t.canonicalRecordId],
      foreignColumns: [usageRecords.tenantId, usageRecords.id],
      name: "usage_records_canonical_record_fk",
    }).onDelete("restrict"),
    index("usage_records_canonical_record_idx").on(
      t.tenantId,
      t.canonicalRecordId
    ),
    index("usage_records_measurement_idx").on(
      t.tenantId,
      t.instanceId,
      t.metricDefinitionId,
      t.windowStart
    ),
    check(
      "usage_records_window_start_before_window_end",
      sql`${t.windowEnd} > ${t.windowStart}`
    ),
    check(
      "usage_records_value_finite",
      sql`${t.value} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check("usage_records_value_nonnegative", sql`${t.value} >= 0`),
    check(
      "usage_records_duplicate_pointer",
      sql`(${t.reconciliationStatus} = 'duplicate' and ${t.canonicalRecordId} is not null and ${t.canonicalRecordId} <> ${t.id}) or (${t.reconciliationStatus} <> 'duplicate' and ${t.canonicalRecordId} is null)`
    ),
  ]
);

// Actuals retain source lines; corrections use linked evidence/reversals, not overwrites. Sum canonical rows in one basis/currency only.
export const spendRecords = pgTable.withRLS(
  "spend_records",
  {
    ...recordColumns(),
    accountingDate: date("accounting_date", { mode: "string" }).notNull(),
    amount: numeric("amount", { precision: 30, scale: 9 }).notNull(),
    basis: spendBasis("basis").notNull(),
    canonicalRecordId: uuid("canonical_record_id"),
    connectionId: uuid("connection_id").notNull(),
    currency: text("currency").notNull(),
    economicEventKey: text("economic_event_key"),
    reconciliationStatus: reconciliationStatus("reconciliation_status")
      .notNull()
      .default("unresolved"),
    recordType: spendType("record_type").notNull(),
    serviceEndDate: date("service_end_date", { mode: "string" }),
    serviceStartDate: date("service_start_date", { mode: "string" }),
    sourceDocumentKey: text("source_document_key").notNull(),
    sourceLineKey: text("source_line_key").notNull(),
    subscriptionId: uuid("subscription_id"),
    supplierVendorId: uuid("supplier_vendor_id"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("spend_records", t),
    foreignKey({
      columns: [t.tenantId, t.supplierVendorId],
      foreignColumns: [vendors.tenantId, vendors.id],
      name: "spend_records_supplier_fk",
    }).onDelete("restrict"),
    index("spend_records_supplier_idx").on(t.tenantId, t.supplierVendorId),
    foreignKey({
      columns: [t.tenantId, t.subscriptionId],
      foreignColumns: [subscriptions.tenantId, subscriptions.id],
      name: "spend_records_subscription_fk",
    }).onDelete("restrict"),
    index("spend_records_subscription_idx").on(t.tenantId, t.subscriptionId),
    foreignKey({
      columns: [t.tenantId, t.connectionId],
      foreignColumns: [connections.tenantId, connections.id],
      name: "spend_records_connection_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.canonicalRecordId, t.basis, t.currency],
      foreignColumns: [
        spendRecords.tenantId,
        spendRecords.id,
        spendRecords.basis,
        spendRecords.currency,
      ],
      name: "spend_records_canonical_record_fk",
    }).onDelete("restrict"),
    index("spend_records_canonical_record_idx").on(
      t.tenantId,
      t.canonicalRecordId,
      t.basis,
      t.currency
    ),
    unique("spend_records_source_line_uq").on(
      t.tenantId,
      t.connectionId,
      t.sourceDocumentKey,
      t.sourceLineKey,
      t.basis
    ),
    unique("spend_records_id_basis_currency_uq").on(
      t.tenantId,
      t.id,
      t.basis,
      t.currency
    ),
    unique("spend_records_id_currency_uq").on(t.tenantId, t.id, t.currency),
    index("spend_records_report_idx").on(
      t.tenantId,
      t.basis,
      t.currency,
      t.accountingDate,
      t.reconciliationStatus
    ),
    uniqueIndex("spend_records_canonical_event_uq")
      .on(t.tenantId, t.basis, t.currency, t.economicEventKey)
      .where(
        sql`${t.reconciliationStatus} = 'canonical' and ${t.economicEventKey} is not null`
      ),
    check(
      "spend_records_amount_finite",
      sql`${t.amount} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check("spend_records_currency", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    check(
      "spend_records_service_interval",
      sql`(${t.serviceStartDate} is null and ${t.serviceEndDate} is null) or (${t.serviceStartDate} is not null and ${t.serviceEndDate} is not null and ${t.serviceEndDate} > ${t.serviceStartDate})`
    ),
    check(
      "spend_records_basis_type",
      sql`(${t.recordType} in ('invoice_line','credit_line') and ${t.basis} = 'invoiced') or (${t.recordType} in ('payment_line','refund_line') and ${t.basis} = 'paid') or ${t.recordType} = 'expense_line'`
    ),
    check(
      "spend_records_sign",
      sql`(${t.recordType} in ('credit_line','refund_line') and ${t.amount} < 0) or (${t.recordType} not in ('credit_line','refund_line') and ${t.amount} >= 0)`
    ),
    check(
      "spend_records_duplicate_pointer",
      sql`(${t.reconciliationStatus} = 'duplicate' and ${t.canonicalRecordId} is not null and ${t.canonicalRecordId} <> ${t.id}) or (${t.reconciliationStatus} <> 'duplicate' and ${t.canonicalRecordId} is null)`
    ),
  ]
);

// Pending: deferred exact allocation-sum validation, with the parent locked before child mutation to serialize competing allocations.
export const spendAllocations = pgTable.withRLS(
  "spend_allocations",
  {
    ...recordColumns(),
    amount: numeric("amount", { precision: 30, scale: 9 }).notNull(),
    applicationId: uuid("application_id").notNull(),
    costCenterGroupId: uuid("cost_center_group_id"),
    costCenterType: groupType("cost_center_type")
      .notNull()
      .default("cost_center"),
    currency: text("currency").notNull(),
    spendRecordId: uuid("spend_record_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("spend_allocations", t),
    foreignKey({
      columns: [t.tenantId, t.spendRecordId, t.currency],
      foreignColumns: [
        spendRecords.tenantId,
        spendRecords.id,
        spendRecords.currency,
      ],
      name: "spend_allocations_spend_record_fk",
    }).onDelete("restrict"),
    index("spend_allocations_spend_record_idx").on(
      t.tenantId,
      t.spendRecordId,
      t.currency
    ),
    foreignKey({
      columns: [t.tenantId, t.applicationId],
      foreignColumns: [applications.tenantId, applications.id],
      name: "spend_allocations_application_fk",
    }).onDelete("restrict"),
    index("spend_allocations_application_idx").on(t.tenantId, t.applicationId),
    foreignKey({
      columns: [t.tenantId, t.costCenterGroupId, t.costCenterType],
      foreignColumns: [groups.tenantId, groups.id, groups.groupType],
      name: "spend_allocations_cost_center_fk",
    }).onDelete("restrict"),
    index("spend_allocations_cost_center_idx").on(
      t.tenantId,
      t.costCenterGroupId,
      t.costCenterType
    ),
    check(
      "spend_allocations_amount_finite",
      sql`${t.amount} not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`
    ),
    check(
      "spend_allocations_cost_center_type",
      sql`${t.costCenterType} = 'cost_center'`
    ),
  ]
);
