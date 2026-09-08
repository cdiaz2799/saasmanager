import { defineRelations } from "drizzle-orm";
import { tables } from "./schema/tables";

// v1 relational query API. Composite joins preserve tenant boundaries.
export const relations = defineRelations(tables, (r) => ({
  accountObservations: {
    observation: r.one.observations({
      from: [
        r.accountObservations.tenantId,
        r.accountObservations.observationId,
      ],
      to: [r.observations.tenantId, r.observations.id],
    }),
    record: r.one.accounts({
      from: [r.accountObservations.tenantId, r.accountObservations.accountId],
      to: [r.accounts.tenantId, r.accounts.id],
    }),
  },
  accounts: {
    instance: r.one.instances({
      from: [r.accounts.tenantId, r.accounts.instanceId],
      to: [r.instances.tenantId, r.instances.id],
    }),
    licenseAssignments: r.many.licenseAssignments({
      from: [r.accounts.tenantId, r.accounts.id],
      to: [r.licenseAssignments.tenantId, r.licenseAssignments.accountId],
    }),
    principal: r.one.entityRegistry({
      from: [
        r.accounts.tenantId,
        r.accounts.principalId,
        r.accounts.principalKind,
      ],
      to: [
        r.entityRegistry.tenantId,
        r.entityRegistry.id,
        r.entityRegistry.kind,
      ],
    }),
  },
  applications: {
    instances: r.many.instances({
      from: [r.applications.tenantId, r.applications.id],
      to: [r.instances.tenantId, r.instances.applicationId],
    }),
    product: r.one.products({
      from: [r.applications.tenantId, r.applications.productId],
      to: [r.products.tenantId, r.products.id],
    }),
    subscriptionApplications: r.many.subscriptionApplications({
      from: [r.applications.tenantId, r.applications.id],
      to: [
        r.subscriptionApplications.tenantId,
        r.subscriptionApplications.applicationId,
      ],
    }),
  },
  assignmentObservations: {
    observation: r.one.observations({
      from: [
        r.assignmentObservations.tenantId,
        r.assignmentObservations.observationId,
      ],
      to: [r.observations.tenantId, r.observations.id],
    }),
    record: r.one.licenseAssignments({
      from: [
        r.assignmentObservations.tenantId,
        r.assignmentObservations.assignmentId,
      ],
      to: [r.licenseAssignments.tenantId, r.licenseAssignments.id],
    }),
  },
  connections: {
    observations: r.many.observations({
      from: [r.connections.tenantId, r.connections.id],
      to: [r.observations.tenantId, r.observations.connectionId],
    }),
  },
  contracts: {
    buyer: r.one.groups({
      from: [
        r.contracts.tenantId,
        r.contracts.buyingEntityGroupId,
        r.contracts.buyerGroupType,
      ],
      to: [r.groups.tenantId, r.groups.id, r.groups.groupType],
    }),
    parent: r.one.contracts({
      from: [r.contracts.tenantId, r.contracts.parentContractId],
      to: [r.contracts.tenantId, r.contracts.id],
    }),
    renews: r.one.contracts({
      from: [r.contracts.tenantId, r.contracts.renewsContractId],
      to: [r.contracts.tenantId, r.contracts.id],
    }),
    subscriptions: r.many.subscriptions({
      from: [r.contracts.tenantId, r.contracts.id],
      to: [r.subscriptions.tenantId, r.subscriptions.contractId],
    }),
    supersedes: r.one.contracts({
      from: [r.contracts.tenantId, r.contracts.supersedesContractId],
      to: [r.contracts.tenantId, r.contracts.id],
    }),
    supplier: r.one.vendors({
      from: [r.contracts.tenantId, r.contracts.supplierVendorId],
      to: [r.vendors.tenantId, r.vendors.id],
    }),
  },
  entitlementInstances: {
    entitlement: r.one.entitlements({
      from: [
        r.entitlementInstances.tenantId,
        r.entitlementInstances.entitlementId,
      ],
      to: [r.entitlements.tenantId, r.entitlements.id],
    }),
    instance: r.one.instances({
      from: [
        r.entitlementInstances.tenantId,
        r.entitlementInstances.instanceId,
      ],
      to: [r.instances.tenantId, r.instances.id],
    }),
  },
  entitlements: {
    entitlementInstances: r.many.entitlementInstances({
      from: [r.entitlements.tenantId, r.entitlements.id],
      to: [
        r.entitlementInstances.tenantId,
        r.entitlementInstances.entitlementId,
      ],
    }),
    licenseAssignments: r.many.licenseAssignments({
      from: [r.entitlements.tenantId, r.entitlements.id],
      to: [r.licenseAssignments.tenantId, r.licenseAssignments.entitlementId],
    }),
    subscription: r.one.subscriptions({
      from: [r.entitlements.tenantId, r.entitlements.subscriptionId],
      to: [r.subscriptions.tenantId, r.subscriptions.id],
    }),
  },
  externalObjectLinks: {
    canonicalEntity: r.one.entityRegistry({
      from: [
        r.externalObjectLinks.tenantId,
        r.externalObjectLinks.canonicalEntityId,
        r.externalObjectLinks.canonicalEntityKind,
      ],
      to: [
        r.entityRegistry.tenantId,
        r.entityRegistry.id,
        r.entityRegistry.kind,
      ],
    }),
    connection: r.one.connections({
      from: [
        r.externalObjectLinks.tenantId,
        r.externalObjectLinks.connectionId,
      ],
      to: [r.connections.tenantId, r.connections.id],
    }),
  },
  fieldOverrides: {
    entity: r.one.entityRegistry({
      from: [r.fieldOverrides.tenantId, r.fieldOverrides.entityId],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
  },
  fieldProvenance: {
    connection: r.one.connections({
      from: [r.fieldProvenance.tenantId, r.fieldProvenance.connectionId],
      to: [r.connections.tenantId, r.connections.id],
    }),
    entity: r.one.entityRegistry({
      from: [r.fieldProvenance.tenantId, r.fieldProvenance.entityId],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
    override: r.one.fieldOverrides({
      from: [r.fieldProvenance.tenantId, r.fieldProvenance.overrideId],
      to: [r.fieldOverrides.tenantId, r.fieldOverrides.id],
    }),
    winningObservation: r.one.observations({
      from: [
        r.fieldProvenance.tenantId,
        r.fieldProvenance.winningObservationId,
      ],
      to: [r.observations.tenantId, r.observations.id],
    }),
  },
  groups: {
    memberships: r.many.memberships({
      from: [r.groups.tenantId, r.groups.id],
      to: [r.memberships.tenantId, r.memberships.groupId],
    }),
  },
  ingestionBatches: {
    connection: r.one.connections({
      from: [r.ingestionBatches.tenantId, r.ingestionBatches.connectionId],
      to: [r.connections.tenantId, r.connections.id],
    }),
    ingestionItems: r.many.ingestionItems({
      from: [r.ingestionBatches.tenantId, r.ingestionBatches.id],
      to: [r.ingestionItems.tenantId, r.ingestionItems.batchId],
    }),
  },
  ingestionItems: {
    batch: r.one.ingestionBatches({
      from: [r.ingestionItems.tenantId, r.ingestionItems.batchId],
      to: [r.ingestionBatches.tenantId, r.ingestionBatches.id],
    }),
    observation: r.one.observations({
      from: [r.ingestionItems.tenantId, r.ingestionItems.observationId],
      to: [r.observations.tenantId, r.observations.id],
    }),
  },
  instances: {
    accounts: r.many.accounts({
      from: [r.instances.tenantId, r.instances.id],
      to: [r.accounts.tenantId, r.accounts.instanceId],
    }),
    application: r.one.applications({
      from: [r.instances.tenantId, r.instances.applicationId],
      to: [r.applications.tenantId, r.applications.id],
    }),
    applicationProduct: r.one.applications({
      from: [
        r.instances.tenantId,
        r.instances.applicationId,
        r.instances.productId,
      ],
      to: [
        r.applications.tenantId,
        r.applications.id,
        r.applications.productId,
      ],
    }),
    product: r.one.products({
      from: [r.instances.tenantId, r.instances.productId],
      to: [r.products.tenantId, r.products.id],
    }),
  },
  licenseAssignments: {
    account: r.one.accounts({
      from: [r.licenseAssignments.tenantId, r.licenseAssignments.accountId],
      to: [r.accounts.tenantId, r.accounts.id],
    }),
    entitlement: r.one.entitlements({
      from: [r.licenseAssignments.tenantId, r.licenseAssignments.entitlementId],
      to: [r.entitlements.tenantId, r.entitlements.id],
    }),
  },
  memberships: {
    group: r.one.groups({
      from: [r.memberships.tenantId, r.memberships.groupId],
      to: [r.groups.tenantId, r.groups.id],
    }),
    member: r.one.entityRegistry({
      from: [
        r.memberships.tenantId,
        r.memberships.memberId,
        r.memberships.memberKind,
      ],
      to: [
        r.entityRegistry.tenantId,
        r.entityRegistry.id,
        r.entityRegistry.kind,
      ],
    }),
  },
  observationResolutions: {
    canonicalEntity: r.one.entityRegistry({
      from: [
        r.observationResolutions.tenantId,
        r.observationResolutions.canonicalEntityId,
      ],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
    observation: r.one.observations({
      from: [
        r.observationResolutions.tenantId,
        r.observationResolutions.observationId,
      ],
      to: [r.observations.tenantId, r.observations.id],
    }),
  },
  observations: {
    connection: r.one.connections({
      from: [r.observations.tenantId, r.observations.connectionId],
      to: [r.connections.tenantId, r.connections.id],
    }),
    observationResolutions: r.many.observationResolutions({
      from: [r.observations.tenantId, r.observations.id],
      to: [
        r.observationResolutions.tenantId,
        r.observationResolutions.observationId,
      ],
    }),
  },
  outboxEvents: {
    entity: r.one.entityRegistry({
      from: [r.outboxEvents.tenantId, r.outboxEvents.entityId],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
  },
  ownerships: {
    entity: r.one.entityRegistry({
      from: [r.ownerships.tenantId, r.ownerships.entityId],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
    owner: r.one.entityRegistry({
      from: [
        r.ownerships.tenantId,
        r.ownerships.ownerId,
        r.ownerships.ownerKind,
      ],
      to: [
        r.entityRegistry.tenantId,
        r.entityRegistry.id,
        r.entityRegistry.kind,
      ],
    }),
  },
  people: {
    manager: r.one.people({
      from: [r.people.tenantId, r.people.managerPersonId],
      to: [r.people.tenantId, r.people.id],
    }),
  },
  products: {
    applications: r.many.applications({
      from: [r.products.tenantId, r.products.id],
      to: [r.applications.tenantId, r.applications.productId],
    }),
    parent: r.one.products({
      from: [r.products.tenantId, r.products.parentProductId],
      to: [r.products.tenantId, r.products.id],
    }),
    vendor: r.one.vendors({
      from: [r.products.tenantId, r.products.vendorId],
      to: [r.vendors.tenantId, r.vendors.id],
    }),
  },
  provenanceConflicts: {
    field: r.one.fieldProvenance({
      from: [
        r.provenanceConflicts.tenantId,
        r.provenanceConflicts.fieldProvenanceId,
      ],
      to: [r.fieldProvenance.tenantId, r.fieldProvenance.id],
    }),
    observation: r.one.observations({
      from: [
        r.provenanceConflicts.tenantId,
        r.provenanceConflicts.observationId,
      ],
      to: [r.observations.tenantId, r.observations.id],
    }),
  },
  relationships: {
    source: r.one.entityRegistry({
      from: [r.relationships.tenantId, r.relationships.sourceEntityId],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
    target: r.one.entityRegistry({
      from: [r.relationships.tenantId, r.relationships.targetEntityId],
      to: [r.entityRegistry.tenantId, r.entityRegistry.id],
    }),
  },
  spendAllocations: {
    application: r.one.applications({
      from: [r.spendAllocations.tenantId, r.spendAllocations.applicationId],
      to: [r.applications.tenantId, r.applications.id],
    }),
    costCenter: r.one.groups({
      from: [
        r.spendAllocations.tenantId,
        r.spendAllocations.costCenterGroupId,
        r.spendAllocations.costCenterType,
      ],
      to: [r.groups.tenantId, r.groups.id, r.groups.groupType],
    }),
    spendRecord: r.one.spendRecords({
      from: [
        r.spendAllocations.tenantId,
        r.spendAllocations.spendRecordId,
        r.spendAllocations.currency,
      ],
      to: [r.spendRecords.tenantId, r.spendRecords.id, r.spendRecords.currency],
    }),
  },
  spendObservations: {
    observation: r.one.observations({
      from: [r.spendObservations.tenantId, r.spendObservations.observationId],
      to: [r.observations.tenantId, r.observations.id],
    }),
    record: r.one.spendRecords({
      from: [r.spendObservations.tenantId, r.spendObservations.spendRecordId],
      to: [r.spendRecords.tenantId, r.spendRecords.id],
    }),
  },
  spendRecords: {
    canonicalRecord: r.one.spendRecords({
      from: [
        r.spendRecords.tenantId,
        r.spendRecords.canonicalRecordId,
        r.spendRecords.basis,
        r.spendRecords.currency,
      ],
      to: [
        r.spendRecords.tenantId,
        r.spendRecords.id,
        r.spendRecords.basis,
        r.spendRecords.currency,
      ],
    }),
    connection: r.one.connections({
      from: [r.spendRecords.tenantId, r.spendRecords.connectionId],
      to: [r.connections.tenantId, r.connections.id],
    }),
    spendAllocations: r.many.spendAllocations({
      from: [r.spendRecords.tenantId, r.spendRecords.id],
      to: [r.spendAllocations.tenantId, r.spendAllocations.spendRecordId],
    }),
    subscription: r.one.subscriptions({
      from: [r.spendRecords.tenantId, r.spendRecords.subscriptionId],
      to: [r.subscriptions.tenantId, r.subscriptions.id],
    }),
    supplier: r.one.vendors({
      from: [r.spendRecords.tenantId, r.spendRecords.supplierVendorId],
      to: [r.vendors.tenantId, r.vendors.id],
    }),
  },
  subscriptionApplications: {
    application: r.one.applications({
      from: [
        r.subscriptionApplications.tenantId,
        r.subscriptionApplications.applicationId,
      ],
      to: [r.applications.tenantId, r.applications.id],
    }),
    subscription: r.one.subscriptions({
      from: [
        r.subscriptionApplications.tenantId,
        r.subscriptionApplications.subscriptionId,
      ],
      to: [r.subscriptions.tenantId, r.subscriptions.id],
    }),
  },
  subscriptions: {
    contract: r.one.contracts({
      from: [r.subscriptions.tenantId, r.subscriptions.contractId],
      to: [r.contracts.tenantId, r.contracts.id],
    }),
    entitlements: r.many.entitlements({
      from: [r.subscriptions.tenantId, r.subscriptions.id],
      to: [r.entitlements.tenantId, r.entitlements.subscriptionId],
    }),
    renews: r.one.subscriptions({
      from: [r.subscriptions.tenantId, r.subscriptions.renewsSubscriptionId],
      to: [r.subscriptions.tenantId, r.subscriptions.id],
    }),
    subscriptionApplications: r.many.subscriptionApplications({
      from: [r.subscriptions.tenantId, r.subscriptions.id],
      to: [
        r.subscriptionApplications.tenantId,
        r.subscriptionApplications.subscriptionId,
      ],
    }),
    supersedes: r.one.subscriptions({
      from: [
        r.subscriptions.tenantId,
        r.subscriptions.supersedesSubscriptionId,
      ],
      to: [r.subscriptions.tenantId, r.subscriptions.id],
    }),
  },
  syncRuns: {
    connection: r.one.connections({
      from: [r.syncRuns.tenantId, r.syncRuns.connectionId],
      to: [r.connections.tenantId, r.connections.id],
    }),
  },
  usageObservations: {
    observation: r.one.observations({
      from: [r.usageObservations.tenantId, r.usageObservations.observationId],
      to: [r.observations.tenantId, r.observations.id],
    }),
    record: r.one.usageRecords({
      from: [r.usageObservations.tenantId, r.usageObservations.usageRecordId],
      to: [r.usageRecords.tenantId, r.usageRecords.id],
    }),
  },
  usageRecords: {
    account: r.one.accounts({
      from: [
        r.usageRecords.tenantId,
        r.usageRecords.accountId,
        r.usageRecords.instanceId,
      ],
      to: [r.accounts.tenantId, r.accounts.id, r.accounts.instanceId],
    }),
    canonicalRecord: r.one.usageRecords({
      from: [r.usageRecords.tenantId, r.usageRecords.canonicalRecordId],
      to: [r.usageRecords.tenantId, r.usageRecords.id],
    }),
    instance: r.one.instances({
      from: [r.usageRecords.tenantId, r.usageRecords.instanceId],
      to: [r.instances.tenantId, r.instances.id],
    }),
    metric: r.one.metricDefinitions({
      from: [r.usageRecords.tenantId, r.usageRecords.metricDefinitionId],
      to: [r.metricDefinitions.tenantId, r.metricDefinitions.id],
    }),
  },
  vendors: {
    products: r.many.products({
      from: [r.vendors.tenantId, r.vendors.id],
      to: [r.products.tenantId, r.products.vendorId],
    }),
  },
  webhookDeliveries: {
    event: r.one.outboxEvents({
      from: [r.webhookDeliveries.tenantId, r.webhookDeliveries.eventId],
      to: [r.outboxEvents.tenantId, r.outboxEvents.id],
    }),
    subscription: r.one.webhookSubscriptions({
      from: [r.webhookDeliveries.tenantId, r.webhookDeliveries.subscriptionId],
      to: [r.webhookSubscriptions.tenantId, r.webhookSubscriptions.id],
    }),
  },
}));
