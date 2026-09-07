import {
  auditEvents,
  idempotencyKeys,
  outboxEvents,
  resourceRevisions,
  tenantEventCounters,
  webhookDeliveries,
  webhookSubscriptions,
} from "./audit";
import {
  accounts,
  applications,
  entityRegistry,
  groups,
  instances,
  memberships,
  ownerships,
  people,
  products,
  servicePrincipals,
  vendors,
} from "./catalog";
import {
  contracts,
  entitlementInstances,
  entitlements,
  licenseAssignments,
  metricDefinitions,
  spendAllocations,
  spendRecords,
  subscriptionApplications,
  subscriptions,
  usageRecords,
} from "./commercial";
import {
  accountObservations,
  assignmentObservations,
  fieldOverrides,
  fieldProvenance,
  ingestionBatches,
  ingestionItems,
  observationResolutions,
  observations,
  provenanceConflicts,
  spendObservations,
  syncRuns,
  usageObservations,
} from "./ingestion";
import { connections, externalObjectLinks } from "./integrations";
import { tenants } from "./shared";
import { relationships, technicalAssets } from "./technical";

export const tables = {
  accountObservations,
  accounts,
  applications,
  assignmentObservations,
  auditEvents,
  connections,
  contracts,
  entitlementInstances,
  entitlements,
  entityRegistry,
  externalObjectLinks,
  fieldOverrides,
  fieldProvenance,
  groups,
  idempotencyKeys,
  ingestionBatches,
  ingestionItems,
  instances,
  licenseAssignments,
  memberships,
  metricDefinitions,
  observationResolutions,
  observations,
  outboxEvents,
  ownerships,
  people,
  products,
  provenanceConflicts,
  relationships,
  resourceRevisions,
  servicePrincipals,
  spendAllocations,
  spendObservations,
  spendRecords,
  subscriptionApplications,
  subscriptions,
  syncRuns,
  technicalAssets,
  tenantEventCounters,
  tenants,
  usageObservations,
  usageRecords,
  vendors,
  webhookDeliveries,
  webhookSubscriptions,
};

// Database insert types are internal persistence types, not validated/public request DTOs.
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Instance = typeof instances.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Entitlement = typeof entitlements.$inferSelect;
export type SpendRecord = typeof spendRecords.$inferSelect;
