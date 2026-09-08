# SaaS System of Record: Permissions & Authorization Specification

> **Source:** Extracted from [`docs/saas-system-of-record.openapi.yaml`](file:///home/cdiaz/code/saasmanager/docs/saas-system-of-record.openapi.yaml)
>
> This document specifies all coarse-grained OAuth 2.0 scopes, endpoint-to-scope bindings, fine-grained multi-entity authorization constraints, dynamic filtering rules, and negative authorization boundaries defined in the SaaS System of Record OpenAPI 3.1.1 contract.

## 1. Core Authorization Architecture

The SaaS System of Record employs a multi-layered, capability-based security model:

1. **Tenant Isolation:**
   - All resource IDs, natural keys, and foreign keys are strictly scoped by `tenant_id`.
   - Bearer tokens are issued for and bound to exactly one tenant. Cross-tenant access is rejected at the protocol boundary.
   - Inaccessible or non-existent IDs return `404 Not Found` (never `403 Forbidden` or leaky exists checks) to prevent enumeration of tenant resources.

2. **Coarse-Grained OAuth 2.0 Scopes vs. Fine-Grained Domain Policy:**
   - The 16 listed OAuth 2.0 scopes act as coarse functional gates (e.g., `catalog:read`, `financial:write`).
   - Possessing a coarse scope is necessary but not sufficient: the platform enforces tenant isolation, row-level security (RLS), referenced-object permissions, and field-level authority before permitting reads or mutations.

3. **Dynamic & Contextual Authorization:**
   - Cross-domain projections (such as `/entities` search and `/events` replay) re-evaluate read permissions for each underlying entity type returned.
   - Graph edges (`/relationships`) require authorization on both endpoint entities.
   - Ingestion links and overrides require permissions in both the integration/provenance domain and the target entity domain.

4. **Snapshot Consistency and Paging Revocation:**
   - Cursor-based list endpoints bind query filters, tenant authorization, and a consistent 15-minute point-in-time snapshot.
   - **Revoked permissions are enforced on every page**: client authorization is rechecked on every cursor traversal. Expired cursors return `410 Gone`.

5. **Separation of Catalog vs. Vendor Execution:**
   - Changing local records never provisions vendor accounts, revokes vendor access, cancels subscriptions, or executes vendor purchases. Record management remains strictly separated from external execution.

---

## 2. OAuth 2.0 Security Schemes & Scopes

Defined under `components.securitySchemes.OAuth2`:

- **Machine-to-Machine Clients:** `clientCredentials` flow (`tokenUrl: https://auth.saas-record.example/oauth/token`).
- **Interactive Clients:** `authorizationCode` flow with PKCE (`authorizationUrl: https://auth.saas-record.example/oauth/authorize`, `tokenUrl: https://auth.saas-record.example/oauth/token`).
- **Token Validation:** Servers must validate token issuer, audience, expiry, and the single-tenant binding claim. Tenant administrative provisioning and credential exchange are out-of-band.

### Scopes Catalog

| Scope | Domain | Access | Description | Operation Count |
| :--- | :--- | :--- | :--- | :---: |
| `audit:read` | Audit Trail | Read | Read authorized audit records. | 2 |
| `catalog:read` | Catalog & Architecture & Governance | Read | Read authorized catalog records. | 16 |
| `catalog:write` | Catalog & Architecture & Governance | Write | Manage authorized catalog records. | 14 |
| `events:read` | Events & Webhooks | Read | Read authorized events records. | 3 |
| `events:write` | Events & Webhooks | Write | Manage authorized events records. | 2 |
| `financial:read` | Commercial & Spend | Read | Read authorized financial records. | 8 |
| `financial:write` | Commercial & Spend | Write | Manage authorized financial records. | 6 |
| `identity:read` | Identity & Access | Read | Read authorized identity records. | 12 |
| `identity:write` | Identity & Access | Write | Manage authorized identity records. | 8 |
| `integrations:read` | Integrations & Sync | Read | Read authorized integrations records. | 9 |
| `integrations:write` | Integrations & Sync | Write | Manage authorized integrations records. | 6 |
| `observations:read` | Source Observations | Read | Read authorized observations records. | 2 |
| `provenance:read` | Provenance & Overrides | Read | Read authorized provenance records. | 3 |
| `provenance:write` | Provenance & Overrides | Write | Manage authorized provenance records. | 2 |
| `usage:read` | Usage & Telemetry | Read | Read authorized usage records. | 4 |
| `usage:write` | Usage & Telemetry | Write | Manage authorized usage records. | 2 |

---

## 3. Operations-to-Permission Mapping

The OpenAPI contract specifies **99 operations** across **61 paths**. Every operation requires a specific OAuth 2.0 scope.

### Scope: `audit:read` (2 operations)
*Read authorized audit records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/audit-events` | `listAuditEvents` | List audit events | — |
| `GET` | `/audit-events/{id}` | `getAuditEvent` | Get AuditEvent | — |

### Scope: `catalog:read` (16 operations)
*Read authorized catalog records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/applications` | `listApplications` | List applications | — |
| `GET` | `/applications/{id}` | `getApplication` | Get Application | — |
| `GET` | `/entities` | `listEntities` | Search authorized catalog entities | Requires read permission for each returned entity type. Unauthorized entities are omitted without leaking total counts. |
| `GET` | `/entities/{id}` | `getEntity` | Get catalog entity projection | — |
| `GET` | `/instances` | `listInstances` | List instances | — |
| `GET` | `/instances/{id}` | `getInstance` | Get Instance | — |
| `GET` | `/ownerships` | `listOwnerships` | List ownerships | — |
| `GET` | `/ownerships/{id}` | `getOwnership` | Get Ownership | — |
| `GET` | `/products` | `listProducts` | List products | — |
| `GET` | `/products/{id}` | `getProduct` | Get Product | — |
| `GET` | `/relationships` | `listRelationships` | List relationships | Requires authorization on both source and target endpoint entities for read and write. |
| `GET` | `/relationships/{id}` | `getRelationship` | Get Relationship | Requires authorization on both source and target endpoint entities for read and write. |
| `GET` | `/technical-assets` | `listTechnicalAssets` | List technical assets | — |
| `GET` | `/technical-assets/{id}` | `getTechnicalAsset` | Get TechnicalAsset | — |
| `GET` | `/vendors` | `listVendors` | List vendors | — |
| `GET` | `/vendors/{id}` | `getVendor` | Get Vendor | — |

### Scope: `catalog:write` (14 operations)
*Manage authorized catalog records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/applications` | `createApplication` | Create Application | — |
| `PATCH` | `/applications/{id}` | `updateApplication` | Update Application | — |
| `POST` | `/instances` | `createInstance` | Create Instance | — |
| `PATCH` | `/instances/{id}` | `updateInstance` | Update Instance | — |
| `POST` | `/ownerships` | `createOwnership` | Create Ownership | — |
| `PATCH` | `/ownerships/{id}` | `updateOwnership` | Update Ownership | — |
| `POST` | `/products` | `createProduct` | Create Product | — |
| `PATCH` | `/products/{id}` | `updateProduct` | Update Product | — |
| `POST` | `/relationships` | `createRelationship` | Create Relationship | Requires authorization on both source and target endpoint entities for read and write. |
| `PATCH` | `/relationships/{id}` | `updateRelationship` | Update Relationship | Requires authorization on both source and target endpoint entities for read and write. |
| `POST` | `/technical-assets` | `createTechnicalAsset` | Create TechnicalAsset | — |
| `PATCH` | `/technical-assets/{id}` | `updateTechnicalAsset` | Update TechnicalAsset | — |
| `POST` | `/vendors` | `createVendor` | Create Vendor | — |
| `PATCH` | `/vendors/{id}` | `updateVendor` | Update Vendor | — |

### Scope: `events:read` (3 operations)
*Read authorized events records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/events` | `listEvents` | Replay authorized entity events | Event stream is filtered dynamically by the caller's current read permissions on each underlying entity type. |
| `GET` | `/webhook-subscriptions` | `listWebhookSubscriptions` | List webhook subscriptions | — |
| `GET` | `/webhook-subscriptions/{id}` | `getWebhookSubscription` | Get WebhookSubscription | — |

### Scope: `events:write` (2 operations)
*Manage authorized events records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/webhook-subscriptions` | `createWebhookSubscription` | Create WebhookSubscription | — |
| `PATCH` | `/webhook-subscriptions/{id}` | `updateWebhookSubscription` | Update WebhookSubscription | — |

### Scope: `financial:read` (8 operations)
*Read authorized financial records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/contracts` | `listContracts` | List contracts | — |
| `GET` | `/contracts/{id}` | `getContract` | Get Contract | — |
| `GET` | `/entitlements` | `listEntitlements` | List entitlements | — |
| `GET` | `/entitlements/{id}` | `getEntitlement` | Get Entitlement | — |
| `GET` | `/spend-records` | `listSpendRecords` | List spend records | — |
| `GET` | `/spend-records/{id}` | `getSpendRecord` | Get SpendRecord | — |
| `GET` | `/subscriptions` | `listSubscriptions` | List subscriptions | — |
| `GET` | `/subscriptions/{id}` | `getSubscription` | Get Subscription | — |

### Scope: `financial:write` (6 operations)
*Manage authorized financial records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/contracts` | `createContract` | Create Contract | — |
| `PATCH` | `/contracts/{id}` | `updateContract` | Update Contract | — |
| `POST` | `/entitlements` | `createEntitlement` | Create Entitlement | — |
| `PATCH` | `/entitlements/{id}` | `updateEntitlement` | Update Entitlement | — |
| `POST` | `/subscriptions` | `createSubscription` | Create Subscription | — |
| `PATCH` | `/subscriptions/{id}` | `updateSubscription` | Update Subscription | — |

### Scope: `identity:read` (12 operations)
*Read authorized identity records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/accounts` | `listAccounts` | List accounts | — |
| `GET` | `/accounts/{id}` | `getAccount` | Get Account | — |
| `GET` | `/groups` | `listGroups` | List groups | — |
| `GET` | `/groups/{id}` | `getGroup` | Get Group | — |
| `GET` | `/license-assignments` | `listLicenseAssignments` | List license assignments | — |
| `GET` | `/license-assignments/{id}` | `getLicenseAssignment` | Get LicenseAssignment | — |
| `GET` | `/memberships` | `listMemberships` | List memberships | — |
| `GET` | `/memberships/{id}` | `getMembership` | Get Membership | — |
| `GET` | `/people` | `listPersons` | List people | — |
| `GET` | `/people/{id}` | `getPerson` | Get Person | — |
| `GET` | `/service-principals` | `listServicePrincipals` | List service principals | — |
| `GET` | `/service-principals/{id}` | `getServicePrincipal` | Get ServicePrincipal | — |

### Scope: `identity:write` (8 operations)
*Manage authorized identity records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/groups` | `createGroup` | Create Group | — |
| `PATCH` | `/groups/{id}` | `updateGroup` | Update Group | — |
| `POST` | `/memberships` | `createMembership` | Create Membership | — |
| `PATCH` | `/memberships/{id}` | `updateMembership` | Update Membership | — |
| `POST` | `/people` | `createPerson` | Create Person | — |
| `PATCH` | `/people/{id}` | `updatePerson` | Update Person | — |
| `POST` | `/service-principals` | `createServicePrincipal` | Create ServicePrincipal | — |
| `PATCH` | `/service-principals/{id}` | `updateServicePrincipal` | Update ServicePrincipal | — |

### Scope: `integrations:read` (9 operations)
*Read authorized integrations records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/connections` | `listConnections` | List connections | — |
| `GET` | `/connections/{id}` | `getConnection` | Get Connection | — |
| `GET` | `/external-object-links` | `listExternalObjectLinks` | List external object links | — |
| `GET` | `/external-object-links/{id}` | `getExternalObjectLink` | Get ExternalObjectLink | — |
| `GET` | `/ingestion-batches` | `listIngestionBatchs` | List ingestion batches | — |
| `GET` | `/ingestion-batches/{id}` | `getIngestionBatch` | Get IngestionBatch | — |
| `GET` | `/ingestion-batches/{id}/items` | `listIngestionBatchItems` | List per-record ingestion results | — |
| `GET` | `/sync-runs` | `listSyncRuns` | List sync runs | — |
| `GET` | `/sync-runs/{id}` | `getSyncRun` | Get SyncRun | — |

### Scope: `integrations:write` (6 operations)
*Manage authorized integrations records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/connections` | `createConnection` | Create Connection | Token access to ingestion is additionally bound to permitted connection IDs. |
| `PATCH` | `/connections/{id}` | `updateConnection` | Update Connection | — |
| `POST` | `/connections/{id}/ingestion-batches` | `startIngestionBatch` | Create IngestionBatch | Token access to ingestion is additionally bound to permitted connection IDs. |
| `POST` | `/connections/{id}/sync-runs` | `startSyncRun` | Create SyncRun | Token access to ingestion is additionally bound to permitted connection IDs. |
| `POST` | `/external-object-links` | `createExternalObjectLink` | Create ExternalObjectLink | Requires target entity read/write authorization in addition to `integrations:write`. |
| `PATCH` | `/external-object-links/{id}` | `updateExternalObjectLink` | Update ExternalObjectLink | Requires target entity read/write authorization in addition to `integrations:write`. |

### Scope: `observations:read` (2 operations)
*Read authorized observations records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/observations` | `listObservations` | List observations | Requires underlying data domain permission; `observations:read` alone never reveals financial or identity source data. Raw payloads remain in restricted storage. |
| `GET` | `/observations/{id}` | `getObservation` | Get Observation | Requires underlying data domain permission; `observations:read` alone never reveals financial or identity source data. Raw payloads remain in restricted storage. |

### Scope: `provenance:read` (3 operations)
*Read authorized provenance records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/entities/{id}/provenance` | `getEntityProvenance` | Explain accepted entity fields | — |
| `GET` | `/field-overrides` | `listFieldOverrides` | List field overrides | — |
| `GET` | `/field-overrides/{id}` | `getFieldOverride` | Get FieldOverride | — |

### Scope: `provenance:write` (2 operations)
*Manage authorized provenance records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/field-overrides` | `createFieldOverride` | Create FieldOverride | Requires target entity write scope in addition to `provenance:write`. |
| `PATCH` | `/field-overrides/{id}` | `updateFieldOverride` | Update FieldOverride | Requires target entity write scope in addition to `provenance:write`. |

### Scope: `usage:read` (4 operations)
*Read authorized usage records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/metric-definitions` | `listMetricDefinitions` | List metric definitions | — |
| `GET` | `/metric-definitions/{id}` | `getMetricDefinition` | Get MetricDefinition | — |
| `GET` | `/usage-records` | `listUsageRecords` | List usage records | — |
| `GET` | `/usage-records/{id}` | `getUsageRecord` | Get UsageRecord | — |

### Scope: `usage:write` (2 operations)
*Manage authorized usage records.*

| Method | Path | Operation ID | Summary | Special Authorization Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/metric-definitions` | `createMetricDefinition` | Create MetricDefinition | — |
| `PATCH` | `/metric-definitions/{id}` | `updateMetricDefinition` | Update MetricDefinition | — |

---

## 4. Fine-Grained & Contextual Permission Rules

The OpenAPI specification explicitly notates several granular, multi-entity, and contextual authorization rules that extend beyond coarse OAuth2 scopes:

### 4.1 Cross-Entity Projections (`GET /entities`)
- **Coarse Scope:** `catalog:read`
- **Rule:** In addition to `catalog:read`, caller **must possess the read permission for each returned entity type** (e.g., `identity:read` for returned Person/Account entities, `financial:read` for Contract/Subscription entities).
- **Filtering Behavior:** Unauthorized entities must be omitted from results without leaking total counts.
- **Pagination:** Snapshot and filters are bound to an opaque 15-minute cursor; expired cursors return `410 Gone`.

### 4.2 Dynamic Event Stream Filtering (`GET /events`)
- **Coarse Scope:** `events:read`
- **Rule:** The ascending tenant event sequence is **dynamically filtered by the caller's current underlying entity permissions**.
- **Safety Guarantee:** A client granted `events:read` cannot observe mutation events for entity types (e.g., financial contracts or identity records) they are not currently authorized to read.
- **Replay Constraints:** Event replay retention is 30 days. Cursors bind the replay start position and snapshot; expired replay positions return `410 Gone`.

### 4.3 Webhook Subscription Delivery (`Event` Schema & `entityChanged` Webhook)
- **Coarse Scope:** `events:read` (read subscriptions), `events:write` (create/modify subscriptions).
- **Outbound Webhook Security:** Subscriptions inherit the creating service identity's permissions, but permissions **must be re-evaluated upon every delivery**.
- **Payload Integrity:** Outbound requests are signed using HMAC-SHA256 over `timestamp + "." + raw_body`.

### 4.4 Graph Edge Authorization (`/relationships`)
- **Coarse Scopes:** `catalog:read` (query edges), `catalog:write` (create/update edges).
- **Rule:** The caller must be authorized to access **both source and target endpoints** (`from_entity_id` and `to_entity_id`) on both read and write operations.
- **Boundary Protection:** Relationship edges cannot be used to bridge or bypass entity-level visibility restrictions.

### 4.5 External Object Linking (`/external-object-links`)
- **Coarse Scopes:** `integrations:read`, `integrations:write`
- **Rule:** Creating or updating a link requires **authorization on the target entity (`canonical_entity`) in addition to `integrations:write`**.
- Linking maps external source observations to canonical records; it cannot be used by an integrations caller to associate records with an entity they do not have rights to manage.

### 4.6 Field Overrides (`/field-overrides`)
- **Coarse Scopes:** `provenance:read`, `provenance:write`
- **Rule:** Creating or patching a curated field override requires **write permission for the target entity's domain** (e.g., `catalog:write`, `identity:write`, `financial:write`) in addition to `provenance:write`.

### 4.7 Observation Payloads & Evidence Isolation (`/observations`)
- **Coarse Scope:** `observations:read`
- **Rule:** Callers must be authorized for **both the observation capability and the underlying data domain**. `observations:read` alone never reveals financial or identity source data.
- **Evidence Boundary:** Raw connector payloads remain in restricted evidence storage and are not returned through the public resource API.

### 4.8 Ingestion Connection Scoping (`/connections`)
- **Coarse Scopes:** `integrations:read`, `integrations:write`
- **Rule:** Token access to ingestion operations (`/connections/{id}/sync-runs`, `/connections/{id}/ingestion-batches`) is strictly bound to permitted connection IDs.

---

## 5. Negative Authorization Boundaries (Non-Granting Roles)

The contract explicitly defines boundaries where roles, organizational attributes, or namespaces **do not** confer API permissions:

| Role / Attribute | Context | Explicit Constraint |
| :--- | :--- | :--- |
| **Ownership Roles** (`business`, `technical`, `procurement`, `security`, `billing`) | `Ownership` / `OwnershipCreate` | *"Ownership does not confer API permission."* Catalog ownership is an inventory assignment, not an authorization grant. |
| **Group Membership Roles** (`member`, `manager`) | `Membership` / `MembershipCreate` | Inventory group membership does not grant platform permissions. Authorization requires an explicit policy. |
| **Technical Asset Namespaces** | `TechnicalAsset` / `TechnicalAssetCreate` | *"A namespace is not an authorization boundary."* Asset namespaces are logical organization prefixes only. |
| **Inaccessible Resource IDs** | All resource endpoints | If an entity exists but is inaccessible to the caller/tenant, the API returns `404 Not Found` (never `403 Forbidden`) to prevent resource existence enumeration. |
| **Audit Trail Inspection** | `AuditEvent` | Audit permissions are separately controlled (`audit:read`). Before/after revision history remains governed by the underlying field permissions. |

---

## 6. HTTP Authorization Status Codes

| HTTP Status | Response Component | Description & Semantic Rule |
| :--- | :--- | :--- |
| `401 Unauthorized` | `#/components/responses/Unauthorized` | Missing or invalid credentials. Includes `WWW-Authenticate: Bearer` challenge header. |
| `403 Forbidden` | `#/components/responses/Forbidden` | Insufficient capability/scope for the requested operation or tenant context. |
| `404 Not Found` | `#/components/responses/NotFound` | Resource does not exist **or is not visible to this tenant/caller**. Used intentionally to enforce boundary privacy. |
| `410 Gone` | `#/components/responses/Gone` | Cursor expired (15-minute window) or event replay position (> 30 days) expired. |

---

## 7. Machine-Readable Permissions Catalog (YAML)

```yaml
securityScheme:
  name: OAuth2
  type: oauth2
  flows:
  - clientCredentials
  - authorizationCode
  validation:
  - issuer
  - audience
  - expiry
  - tenant_claim
scopes:
  audit:read:
    description: Read authorized audit records.
    operationsCount: 2
  catalog:read:
    description: Read authorized catalog records.
    operationsCount: 16
  catalog:write:
    description: Manage authorized catalog records.
    operationsCount: 14
  events:read:
    description: Read authorized events records.
    operationsCount: 3
  events:write:
    description: Manage authorized events records.
    operationsCount: 2
  financial:read:
    description: Read authorized financial records.
    operationsCount: 8
  financial:write:
    description: Manage authorized financial records.
    operationsCount: 6
  identity:read:
    description: Read authorized identity records.
    operationsCount: 12
  identity:write:
    description: Manage authorized identity records.
    operationsCount: 8
  integrations:read:
    description: Read authorized integrations records.
    operationsCount: 9
  integrations:write:
    description: Manage authorized integrations records.
    operationsCount: 6
  observations:read:
    description: Read authorized observations records.
    operationsCount: 2
  provenance:read:
    description: Read authorized provenance records.
    operationsCount: 3
  provenance:write:
    description: Manage authorized provenance records.
    operationsCount: 2
  usage:read:
    description: Read authorized usage records.
    operationsCount: 4
  usage:write:
    description: Manage authorized usage records.
    operationsCount: 2
rules:
- id: cross_entity_projection
  endpoint: GET /entities
  requiredScopes:
  - catalog:read
  rule: Requires read permission for each returned entity type. Omit unauthorized
    entities.
- id: dynamic_event_replay_filtering
  endpoint: GET /events
  requiredScopes:
  - events:read
  rule: Event sequence filtered dynamically by caller current underlying entity permissions.
- id: webhook_delivery_reevaluation
  endpoint: POST (webhook) entityChanged
  requiredScopes:
  - events:write
  rule: Subscriptions inherit creating identity permissions; re-evaluated on delivery.
- id: graph_edge_authorization
  endpoint: GET/POST/PATCH /relationships
  requiredScopes:
  - catalog:read
  - catalog:write
  rule: Requires authorization on both source and target endpoints on read and write.
- id: external_object_link_authorization
  endpoint: POST/PATCH /external-object-links
  requiredScopes:
  - integrations:write
  rule: Requires target entity read/write authorization as well as integrations:write.
- id: field_override_authorization
  endpoint: POST/PATCH /field-overrides
  requiredScopes:
  - provenance:write
  rule: Requires target entity write scope as well as provenance:write.
- id: observation_domain_authorization
  endpoint: GET /observations
  requiredScopes:
  - observations:read
  rule: Requires underlying data domain permission; observations:read alone never
    reveals financial/identity facts.
- id: cursor_permission_recheck
  scope: All cursor-paginated endpoints
  rule: Revoked permissions enforced on every page. Expired cursors return 410.
negativeBoundaries:
- Ownership roles do not confer API permission.
- Group membership roles do not confer API permission.
- Technical asset namespaces are not authorization boundaries.
- Inaccessible resources return 404 Not Found to prevent enumeration.
```
