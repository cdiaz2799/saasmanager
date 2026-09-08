# RBAC foundation

This release maps the 16 capabilities in `permissions.md` to authenticated human
sessions through Better Auth organizations. It does not implement OAuth clients,
bearer tokens, or the resource-specific authorization rules in the OpenAPI
proposal. Domain handlers must use `permissionProcedure()` and still enforce any
linked-resource, field, or visibility policy required by their contract.

| Role | Domain capabilities | Organization administration |
| --- | --- | --- |
| `owner` | All 16 | Full administration and custom-role management |
| `admin` | None | Organization settings, invitations, and ordinary-member management |
| `member` | None | None |
| tenant-defined role | Explicit domain capabilities only | None |

Custom roles are organization-scoped. Owners create, update, delete, and assign
them. They may contain only the nine domain resources and their declared
`read`/`write` actions. A role cannot be renamed or deleted while a member or
pending invitation references it.

`permissionProcedure(requiredScope, ...additionalScopes)` resolves current
membership and permissions on every request. It requires every supplied scope;
do not use `tenantProcedure` alone for a domain operation. Client permission
checks are presentation hints only.

After applying the generated migration, rerun `packages/db/sql/001-runtime-role.sql`
before restarting the server so the runtime login can access Better Auth's
`organization_roles` table while browser roles remain revoked.
