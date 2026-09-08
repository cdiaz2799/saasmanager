# API package instructions

Applies to `packages/api/**`, in addition to the root instructions.

## Current state

Authorization uses `permissionProcedure(scope, ...)` from `src/index.ts`
(`tenantProcedure` + `auth.api.hasPermission`). `test/tenant-handler.ts` mounts the
router for HTTP-level tests; run them with `bun test`.

## Ownership and public exports

Own oRPC contracts, their implementation, domain services, resource authorization,
REST mapping, and generated OpenAPI. Export browser-safe contracts/client types
separately from server routers and services. Do not expose Drizzle rows as public
DTOs or import auth server configuration through a client entry point.

Use the installed oRPC version's documentation and APIs. Define contracts before implementations: explicit input/output schemas,
typed errors, route metadata, operation IDs, and authorization requirements.
Keep validation active at runtime; TypeScript inference is not input validation.

Once the proposed API is implemented, oRPC contracts are its executable source
of truth. Generate OpenAPI from them and review the diff. Migrate the existing
OpenAPI proposal deliberately; do not maintain two independently edited contracts.
Contract generation does not prove the HTTP handler implements its semantics.

## Request boundary

1. Verify the human session or supported machine credential through `packages/auth`.
2. Resolve an authorized tenant, current membership or machine grant, and required
   capability. A supplied tenant/organization ID is only a selection request.
3. Validate and normalize input; bound page size, batch size, filters, and payloads.
4. Enter the tenant transaction, load resources within that tenant, and enforce
   action/resource policy before reading sensitive output or mutating state.
5. Execute the domain service and map its result to an explicitly validated DTO.

Checks needed before the transaction must not permit a time-of-check/time-of-use
authorization bypass. Define the revocation consistency policy; recheck or lock
authorization state for sensitive writes as required by that policy.

Authenticate once per request, but authorize each operation, batch item, linked
resource, and nested result. Use a consistent not-found policy to avoid revealing
another tenant's resource existence. Never spread client input into an ORM update.
Allowlist writable fields; reject attempts to mutate tenant, revision, provenance,
source-managed access state, or immutable commercial facts.

Handlers should be thin. Put domain decisions in transport-independent services
that accept a verified actor, authorized tenant context, and transaction handle.
Keep middleware focused on shared boundaries; it cannot replace entity-specific
authorization. Internal callers and workers must not bypass these rules.

## REST and contract semantics

- Preserve explicit `/v1` resource routes, stable operation IDs, status codes,
  content types, and documented compatibility. Expose an RPC transport only if
  it preserves the same validation and policy checks.
- Use decimal strings for exact money/quantities, ISO date or timestamp strings
  as appropriate, and explicit nullability. Never serialize raw bigint or rely
  on an RPC-specific serializer to define ordinary REST JSON.
- PATCH uses typed partial input. Omitted means unchanged; null clears only
  nullable fields. Do not silently adopt JSON Merge Patch semantics.
- Versioned writes require strong ETags and `If-Match`. Perform the revision check
  atomically in SQL. Return 428 for a missing required precondition and 412 for a
  failed one, consistently with the resource contract.
- For POSTs covered by the contract, implement durable idempotency scoped to
  tenant, authenticated client, method, route, and key. Retain receipts for the
  documented 24-hour window. Hash normalized semantic input, reject key reuse
  with different input, and handle simultaneous requests without duplicate writes.
  Replays still require current authorization and must not leak a prior response.
- Cursor pagination binds a snapshot, tenant, filters, and stable sort with an ID
  tie-breaker. Authenticate cursors and recheck current permissions on every page.
  Apply a documented expiry; never trust client-provided cursor internals.
- Return durable operation receipts for asynchronous work with 202, including the
  polling location. A successful enqueue is not proof of successful reconciliation.
- Normalize REST failures to the proposed RFC 9457 Problem Details shape, including
  request correlation. Explicitly implement and test the HTTP error adapter;
  oRPC typed errors alone do not guarantee this wire format. Hide SQL, stack traces,
  credential material, and internal provider responses.

Model human-session and machine-auth security schemes accurately in OpenAPI.
Do not document OAuth2 scopes or bearer flows that the configured auth system does
not implement. Cookie authentication requires the corresponding CSRF protection.

## System-of-record services

Canonical changes include revision/history, audit, and outbox in one transaction.
Ingestion follows observation → identity resolution → field authority → canonical
state, retaining provenance and conflicts. Do not create a shortcut CRUD path
that overwrites source-managed facts or rewrites immutable evidence.

Enforce rules beyond SQL constraints: relationship endpoint kinds and cycles,
entitlement coverage and effective scope, source authority, lifecycle transitions,
and aggregate report definitions. Coordinate cross-row checks against concurrent
writes. Use explicit report basis, currency, coverage, and unresolved totals.

Idempotency receipts and committed mutations must remain consistent across crashes.
Emit external work through the outbox after commit. Bound retries and make workers
idempotent; never retry a vendor side effect merely because an HTTP response timed out.

## Verification

Test actual HTTP requests through the mounted oRPC OpenAPI handler, not only direct
procedure calls. Cover validation, decimal/date serialization, error envelopes,
ETag/If-Match, cursor behavior, and idempotent concurrent requests when affected.
Check the generated OpenAPI for breaking changes and security scheme accuracy.

Use at least two tenants and multiple capability levels for authorization tests.
Cover forged tenant selectors, foreign linked IDs, revoked membership, nested
data exposure, and service/worker entry points. Test domain rollback also removes
its audit/outbox/receipt changes. Run affected consumers' typechecks when changing
contracts. Keep mocks at external boundaries, not at the authorization decision.
