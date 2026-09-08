import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

export const domainStatement = {
  audit: ["read"],
  catalog: ["read", "write"],
  events: ["read", "write"],
  financial: ["read", "write"],
  identity: ["read", "write"],
  integrations: ["read", "write"],
  observations: ["read"],
  provenance: ["read", "write"],
  usage: ["read", "write"],
} as const;

export const permissionStatement = {
  ...defaultStatements,
  ...domainStatement,
} as const;

export const ac = createAccessControl(permissionStatement);

const allDomainPermissions = Object.fromEntries(
  Object.entries(domainStatement).map(([resource, actions]) => [
    resource,
    [...actions],
  ])
);

export const owner = ac.newRole({
  ...ownerAc.statements,
  ...allDomainPermissions,
});

export const admin = ac.newRole({
  ...adminAc.statements,
  ac: [],
});

export const member = ac.newRole({
  ...memberAc.statements,
  ac: [],
});

export const roles = { admin, member, owner } as const;

export const domainScopes = [
  "audit:read",
  "catalog:read",
  "catalog:write",
  "events:read",
  "events:write",
  "financial:read",
  "financial:write",
  "identity:read",
  "identity:write",
  "integrations:read",
  "integrations:write",
  "observations:read",
  "provenance:read",
  "provenance:write",
  "usage:read",
  "usage:write",
] as const;

export type DomainScope = (typeof domainScopes)[number];

export function scopeToPermission(scope: DomainScope) {
  const [resource, action] = scope.split(":") as [
    keyof typeof domainStatement,
    string,
  ];
  return { [resource]: [action] };
}

export function areDomainPermissions(
  permissions: Record<string, readonly string[]>
) {
  return Object.entries(permissions).every(([resource, actions]) => {
    const allowedActions = domainStatement[
      resource as keyof typeof domainStatement
    ] as readonly string[] | undefined;
    return (
      allowedActions !== undefined &&
      actions.length > 0 &&
      actions.every((action) => allowedActions.includes(action))
    );
  });
}
