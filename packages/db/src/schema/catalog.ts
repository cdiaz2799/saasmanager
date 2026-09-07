import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  accountStatus,
  accountType,
  activeStatus,
  applicationLifecycle,
  criticality,
  dataClassification,
  entityKind,
  groupType,
  instanceEnvironment,
  instanceStatus,
  managementStatus,
  membershipRole,
  ownershipRole,
  personStatus,
  personType,
  sanctionStatus,
} from "./enum";
import {
  type JsonObject,
  type RecordColumns,
  recordColumns,
  recordConstraints,
} from "./shared";

// Shared catalog identity. Enforcement of exactly one matching typed row is pending.
export const entityRegistry = pgTable.withRLS(
  "entity_registry",
  {
    ...recordColumns(),
    kind: entityKind("kind").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("entity_registry", t),
    unique("entity_registry_tenant_id_kind").on(t.tenantId, t.id, t.kind),
    index("entity_registry_kind_idx").on(t.tenantId, t.kind, t.id),
  ]
);
export const entityConstraints = (
  name: string,
  t: RecordColumns & { kind: AnyPgColumn },
  kind: (typeof entityKind.enumValues)[number]
): PgTableExtraConfigValue[] => [
  ...recordConstraints(name, t),
  check(`${name}_kind`, sql`${t.kind} = ${kind}`),
  foreignKey({
    columns: [t.tenantId, t.id, t.kind],
    foreignColumns: [
      entityRegistry.tenantId,
      entityRegistry.id,
      entityRegistry.kind,
    ],
    name: `${name}_registry_fk`,
  }).onDelete("restrict"),
];

export const vendors = pgTable.withRLS(
  "vendors",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    description: text("description"),
    domains: text("domains").array().notNull().default([]),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("vendor"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    name: text("name").notNull(),
    website: text("website"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("vendors", t, "vendor"),
    check("vendors_labels_json", sql`jsonb_typeof(${t.labels}) = 'object'`),
    check(
      "vendors_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "vendors_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

export const products = pgTable.withRLS(
  "products",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    category: text("category"),
    description: text("description"),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("product"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    name: text("name").notNull(),
    parentProductId: uuid("parent_product_id"),
    slug: text("slug").notNull(),
    vendorId: uuid("vendor_id").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("products", t, "product"),
    foreignKey({
      columns: [t.tenantId, t.vendorId],
      foreignColumns: [vendors.tenantId, vendors.id],
      name: "products_vendor_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.parentProductId],
      foreignColumns: [products.tenantId, products.id],
      name: "products_parent_fk",
    }).onDelete("restrict"),
    index("products_parent_idx").on(t.tenantId, t.parentProductId),
    unique("products_vendor_slug_uq").on(t.tenantId, t.vendorId, t.slug),
    check(
      "products_not_own_parent",
      sql`${t.parentProductId} is null or ${t.parentProductId} <> ${t.id}`
    ),
    check("products_labels_json", sql`jsonb_typeof(${t.labels}) = 'object'`),
    check(
      "products_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "products_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

export const applications = pgTable.withRLS(
  "applications",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    criticality: criticality("criticality").notNull(),
    dataClassification: dataClassification("data_classification").notNull(),
    description: text("description"),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("application"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    lifecycle: applicationLifecycle("lifecycle").notNull().default("proposed"),
    managementStatus: managementStatus("management_status")
      .notNull()
      .default("discovered"),
    name: text("name").notNull(),
    productId: uuid("product_id"),
    sanctionStatus: sanctionStatus("sanction_status")
      .notNull()
      .default("unreviewed"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("applications", t, "application"),
    foreignKey({
      columns: [t.tenantId, t.productId],
      foreignColumns: [products.tenantId, products.id],
      name: "applications_product_fk",
    }).onDelete("restrict"),
    index("applications_product_idx").on(t.tenantId, t.productId),
    unique("applications_id_product_uq").on(t.tenantId, t.id, t.productId),
    index("applications_status_idx").on(
      t.tenantId,
      t.managementStatus,
      t.lifecycle
    ),
    check(
      "applications_labels_json",
      sql`jsonb_typeof(${t.labels}) = 'object'`
    ),
    check(
      "applications_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "applications_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

// productId mirrors application.productId for provider identity uniqueness. Exact agreement when NULL is involved still needs deferred enforcement.
export const instances = pgTable.withRLS(
  "instances",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    applicationId: uuid("application_id").notNull(),
    authModes: text("auth_modes").array().notNull().default([]),
    description: text("description"),
    environment: instanceEnvironment("environment")
      .notNull()
      .default("unknown"),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("instance"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    lastObservedAt: timestamp("last_observed_at", {
      mode: "string",
      withTimezone: true,
    }),
    name: text("name").notNull(),
    productId: uuid("product_id"),
    providerTenantKey: text("provider_tenant_key"),
    region: text("region"),
    status: instanceStatus("status").notNull().default("unknown"),
    url: text("url"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("instances", t, "instance"),
    foreignKey({
      columns: [t.tenantId, t.applicationId],
      foreignColumns: [applications.tenantId, applications.id],
      name: "instances_application_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.productId],
      foreignColumns: [products.tenantId, products.id],
      name: "instances_product_fk",
    }).onDelete("restrict"),
    index("instances_product_idx").on(t.tenantId, t.productId),
    foreignKey({
      columns: [t.tenantId, t.applicationId, t.productId],
      foreignColumns: [
        applications.tenantId,
        applications.id,
        applications.productId,
      ],
      name: "instances_application_product_fk",
    }).onDelete("restrict"),
    index("instances_application_product_idx").on(
      t.tenantId,
      t.applicationId,
      t.productId
    ),
    uniqueIndex("instances_provider_identity_uq")
      .on(t.tenantId, t.productId, t.providerTenantKey)
      .where(
        sql`${t.productId} is not null and ${t.providerTenantKey} is not null`
      ),
    check("instances_labels_json", sql`jsonb_typeof(${t.labels}) = 'object'`),
    check(
      "instances_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "instances_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

// Email is deliberately not unique. HR/source identity links determine whether records represent the same person.
export const people = pgTable.withRLS(
  "people",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    description: text("description"),
    displayName: text("display_name").notNull(),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("person"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    managerPersonId: uuid("manager_person_id"),
    personType: personType("person_type").notNull(),
    primaryEmail: text("primary_email"),
    status: personStatus("status").notNull().default("unknown"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("people", t, "person"),
    foreignKey({
      columns: [t.tenantId, t.managerPersonId],
      foreignColumns: [people.tenantId, people.id],
      name: "people_manager_fk",
    }).onDelete("restrict"),
    index("people_manager_idx").on(t.tenantId, t.managerPersonId),
    index("people_email_lookup_idx").on(t.tenantId, t.primaryEmail),
    check(
      "people_not_own_manager",
      sql`${t.managerPersonId} is null or ${t.managerPersonId} <> ${t.id}`
    ),
    check("people_labels_json", sql`jsonb_typeof(${t.labels}) = 'object'`),
    check(
      "people_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "people_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

export const groups = pgTable.withRLS(
  "groups",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    description: text("description"),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    groupType: groupType("group_type").notNull(),
    kind: entityKind("kind").notNull().default("group"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    name: text("name").notNull(),
    status: activeStatus("status").notNull().default("active"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("groups", t, "group"),
    unique("groups_id_type_uq").on(t.tenantId, t.id, t.groupType),
    check("groups_labels_json", sql`jsonb_typeof(${t.labels}) = 'object'`),
    check(
      "groups_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "groups_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

export const servicePrincipals = pgTable.withRLS(
  "service_principals",
  {
    ...recordColumns(),
    annotations: jsonb("annotations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    description: text("description"),
    extensions: jsonb("extensions").$type<JsonObject>().notNull().default({}),
    kind: entityKind("kind").notNull().default("service_principal"),
    labels: jsonb("labels")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    name: text("name").notNull(),
    purpose: text("purpose").notNull(),
    status: activeStatus("status").notNull().default("active"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("service_principals", t, "service_principal"),
    check(
      "service_principals_labels_json",
      sql`jsonb_typeof(${t.labels}) = 'object'`
    ),
    check(
      "service_principals_annotations_json",
      sql`jsonb_typeof(${t.annotations}) = 'object'`
    ),
    check(
      "service_principals_extensions_json",
      sql`jsonb_typeof(${t.extensions}) = 'object'`
    ),
  ]
);

// Nested-group acyclicity and exclusion of overlapping duplicate membership periods are pending.
export const memberships = pgTable.withRLS(
  "memberships",
  {
    ...recordColumns(),
    groupId: uuid("group_id").notNull(),
    memberId: uuid("member_id").notNull(),
    memberKind: entityKind("member_kind").notNull(),
    role: membershipRole("role").notNull().default("member"),
    validFrom: timestamp("valid_from", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    validTo: timestamp("valid_to", { mode: "string", withTimezone: true }),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("memberships", t),
    foreignKey({
      columns: [t.tenantId, t.groupId],
      foreignColumns: [groups.tenantId, groups.id],
      name: "memberships_group_fk",
    }).onDelete("restrict"),
    index("memberships_group_idx").on(t.tenantId, t.groupId),
    foreignKey({
      columns: [t.tenantId, t.memberId, t.memberKind],
      foreignColumns: [
        entityRegistry.tenantId,
        entityRegistry.id,
        entityRegistry.kind,
      ],
      name: "memberships_member_fk",
    }).onDelete("restrict"),
    index("memberships_member_idx").on(t.tenantId, t.memberId, t.memberKind),
    check(
      "memberships_valid_from_before_valid_to",
      sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`
    ),
    check(
      "memberships_member_kind",
      sql`${t.memberKind} in ('person','group','service_principal')`
    ),
    check("memberships_not_self", sql`${t.groupId} <> ${t.memberId}`),
  ]
);

// Pending: temporal exclusion enforcing one primary owner per entity and role at every instant.
export const ownerships = pgTable.withRLS(
  "ownerships",
  {
    ...recordColumns(),
    entityId: uuid("entity_id").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    ownerId: uuid("owner_id").notNull(),
    ownerKind: entityKind("owner_kind").notNull(),
    role: ownershipRole("role").notNull(),
    validFrom: timestamp("valid_from", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    validTo: timestamp("valid_to", { mode: "string", withTimezone: true }),
  },
  (t): PgTableExtraConfigValue[] => [
    ...recordConstraints("ownerships", t),
    foreignKey({
      columns: [t.tenantId, t.entityId],
      foreignColumns: [entityRegistry.tenantId, entityRegistry.id],
      name: "ownerships_entity_fk",
    }).onDelete("restrict"),
    index("ownerships_entity_idx").on(t.tenantId, t.entityId),
    foreignKey({
      columns: [t.tenantId, t.ownerId, t.ownerKind],
      foreignColumns: [
        entityRegistry.tenantId,
        entityRegistry.id,
        entityRegistry.kind,
      ],
      name: "ownerships_owner_fk",
    }).onDelete("restrict"),
    index("ownerships_owner_idx").on(t.tenantId, t.ownerId, t.ownerKind),
    index("ownerships_owner_role_idx").on(t.tenantId, t.ownerId, t.role),
    check(
      "ownerships_valid_from_before_valid_to",
      sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`
    ),
    check("ownerships_owner_kind", sql`${t.ownerKind} in ('person','group')`),
  ]
);

export const accounts = pgTable.withRLS(
  "accounts",
  {
    ...recordColumns(),
    accountType: accountType("account_type").notNull().default("unknown"),
    email: text("email"),
    instanceId: uuid("instance_id").notNull(),
    kind: entityKind("kind").notNull().default("account"),
    lastObservedAt: timestamp("last_observed_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    principalId: uuid("principal_id"),
    principalKind: entityKind("principal_kind"),
    providerAccountKey: text("provider_account_key").notNull(),
    providerRoles: text("provider_roles").array().notNull().default([]),
    status: accountStatus("status").notNull().default("unknown"),
    username: text("username"),
  },
  (t): PgTableExtraConfigValue[] => [
    ...entityConstraints("accounts", t, "account"),
    foreignKey({
      columns: [t.tenantId, t.instanceId],
      foreignColumns: [instances.tenantId, instances.id],
      name: "accounts_instance_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.tenantId, t.principalId, t.principalKind],
      foreignColumns: [
        entityRegistry.tenantId,
        entityRegistry.id,
        entityRegistry.kind,
      ],
      name: "accounts_principal_fk",
    }).onDelete("restrict"),
    index("accounts_principal_idx").on(
      t.tenantId,
      t.principalId,
      t.principalKind
    ),
    unique("accounts_provider_identity_uq").on(
      t.tenantId,
      t.instanceId,
      t.providerAccountKey
    ),
    unique("accounts_id_instance_uq").on(t.tenantId, t.id, t.instanceId),
    check(
      "accounts_principal_pair",
      sql`(${t.principalId} is null and ${t.principalKind} is null) or (${t.principalId} is not null and ${t.principalKind} is not null and ${t.principalKind} in ('person','service_principal'))`
    ),
    check(
      "accounts_principal_type",
      sql`(${t.accountType} not in ('shared','unknown') or ${t.principalId} is null) and (${t.accountType} <> 'human' or ${t.principalKind} is null or ${t.principalKind} = 'person') and (${t.accountType} <> 'service' or ${t.principalKind} is null or ${t.principalKind} = 'service_principal')`
    ),
  ]
);
