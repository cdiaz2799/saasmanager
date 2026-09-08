import { areDomainPermissions } from "@saasmanager/auth/permissions";
import type { Database } from "@saasmanager/db/tenant";

const roleManagementPaths = new Set([
  "/api/auth/organization/create-role",
  "/api/auth/organization/delete-role",
  "/api/auth/organization/get-role",
  "/api/auth/organization/list-roles",
  "/api/auth/organization/update-role",
]);

const membershipPaths = new Set([
  "/api/auth/organization/add-member",
  "/api/auth/organization/invite-member",
  "/api/auth/organization/remove-member",
  "/api/auth/organization/update-member-role",
]);

interface RequestBody {
  data?: { permission?: Record<string, string[]>; roleName?: string };
  memberId?: string;
  memberIdOrEmail?: string;
  organizationId?: string;
  permission?: Record<string, string[]>;
  role?: string | string[];
  roleId?: string;
  roleName?: string;
}

function isOwner(role: string) {
  return role.split(",").some((entry) => entry.trim() === "owner");
}

function isAdmin(role: string) {
  return role.split(",").some((entry) => entry.trim() === "admin");
}

function isOrdinaryMember(role: string | string[] | undefined) {
  const roles = (Array.isArray(role) ? role : [role])
    .flatMap((entry) => entry?.split(",") ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);
  return roles.length === 1 && roles[0] === "member";
}

async function parseBody(request: Request): Promise<RequestBody | null> {
  try {
    return (await request.clone().json()) as RequestBody;
  } catch {
    return null;
  }
}

async function guardRoleManagement({
  body,
  database,
  organizationId,
  pathname,
  role,
}: {
  body: RequestBody;
  database: Database;
  organizationId: string;
  pathname: string;
  role: string;
}): Promise<Response | null> {
  if (!isOwner(role)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  const permissions = body.permission ?? body.data?.permission;
  if (permissions && !areDomainPermissions(permissions)) {
    return Response.json(
      { message: "Custom roles may contain only domain permissions" },
      { status: 400 }
    );
  }
  if (body.data?.roleName !== undefined) {
    return Response.json(
      { message: "Custom role names are immutable" },
      { status: 400 }
    );
  }
  if (
    pathname === "/api/auth/organization/delete-role" &&
    (body.roleId || body.roleName)
  ) {
    const organizationRole = await database.query.organizationRoles.findFirst({
      where: {
        id: body.roleId,
        organizationId,
        role: body.roleName,
      },
    });
    if (organizationRole) {
      const invitations = await database.query.invitations.findMany({
        where: { organizationId, status: "pending" },
      });
      if (
        invitations.some((invitation) =>
          invitation.role
            ?.split(",")
            .some(
              (invitationRole) =>
                invitationRole.trim() === organizationRole.role
            )
        )
      ) {
        return Response.json(
          { message: "Cannot delete a role assigned to a pending invitation" },
          { status: 400 }
        );
      }
    }
  }
  return null;
}

async function findTargetMembership(
  database: Database,
  organizationId: string,
  memberIdOrEmail: string
) {
  const targetUser = memberIdOrEmail.includes("@")
    ? await database.query.users.findFirst({
        where: { email: memberIdOrEmail },
      })
    : undefined;
  const memberToRemove = await database.query.members.findFirst({
    where: {
      id: targetUser ? undefined : memberIdOrEmail,
      organizationId,
      userId: targetUser?.id,
    },
  });
  return memberToRemove;
}

async function guardMembershipManagement({
  body,
  database,
  organizationId,
  pathname,
  role,
}: {
  body: RequestBody;
  database: Database;
  organizationId: string;
  pathname: string;
  role: string;
}): Promise<Response | null> {
  if (isOwner(role)) {
    return null;
  }
  if (!isAdmin(role)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  if (
    [
      "/api/auth/organization/add-member",
      "/api/auth/organization/invite-member",
    ].includes(pathname) &&
    isOrdinaryMember(body.role)
  ) {
    return null;
  }
  const memberId = body.memberIdOrEmail ?? body.memberId;
  if (memberId && isOrdinaryMember(body.role)) {
    const targetMembership = await findTargetMembership(
      database,
      organizationId,
      memberId
    );
    if (targetMembership && isOrdinaryMember(targetMembership.role)) {
      return null;
    }
  }
  return Response.json({ message: "Forbidden" }, { status: 403 });
}

export async function guardOrganizationRoleManagement({
  auth,
  database,
  request,
}: {
  auth: typeof import("@saasmanager/auth").auth;
  database: Database;
  request: Request;
}): Promise<Response | null> {
  const { url } = request;
  const { pathname } = new URL(url);
  const managesRoles = roleManagementPaths.has(pathname);
  const managesMembership = membershipPaths.has(pathname);
  if (!(managesRoles || managesMembership) || request.method !== "POST") {
    return null;
  }

  const body = await parseBody(request);
  if (!body) {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  const organizationId =
    body.organizationId ?? session?.session.activeOrganizationId;
  if (!(session && organizationId)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const membership = await database.query.members.findFirst({
    where: { organizationId, userId: session.user.id },
  });
  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  if (managesRoles) {
    return await guardRoleManagement({
      body,
      database,
      organizationId,
      pathname,
      role: membership.role,
    });
  }
  return await guardMembershipManagement({
    body,
    database,
    organizationId,
    pathname,
    role: membership.role,
  });
}
