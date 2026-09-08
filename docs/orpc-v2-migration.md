# oRPC v2 migration

All oRPC packages are pinned in the workspace catalog to `2.0.0-beta.34`.
This is a prerelease: the npm `latest` tag still points to v1.15.0.

Deploy the server and web build together. V1 and v2 RPC wire formats are
incompatible; reload existing browser tabs after deployment. Roll back both
artifacts together if needed. No database migration is required.

RPC remains mounted at `/rpc`, uses POST, and includes browser credentials.
OpenAPI remains mounted at `/api-reference`, with Scalar at that prefix and
the generated OpenAPI 3.1.1 document at `/api-reference/spec.json`. Error HTTP
statuses are retained, but the v2 JSON error body no longer has a `status` field.
There is no v1 compatibility adapter or support for independently upgraded clients.

This upgrade preserves the current health/private procedures and tenant/permission
boundaries. The system-of-record YAML remains a proposed API, not the implemented
router; this migration does not implement that proposal or its OAuth/Problem
Details contract.

Verification:

```sh
bun test apps/web/src/utils/rpc-link.test.ts
bun test packages/db/test/tenant.test.ts
bun x tsc --noEmit -p packages/db/test/tsconfig.json
bun run check-types
bun run check
bun run build
```

The tenant suite requires the disposable PostgreSQL fixture documented in
[tenant-isolation.md](tenant-isolation.md). It also exercises the production
RPC/OpenAPI handlers and the web link, including real session authentication.
