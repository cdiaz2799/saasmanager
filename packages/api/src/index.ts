import { ORPCError, os } from "@orpc/server";
import { db } from "@saasmanager/db";
import {
  resolveTenantMembership,
  withTenantTransaction,
} from "@saasmanager/db/tenant";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export const tenantProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    const organizationId = context.session.session.activeOrganizationId;
    if (!organizationId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Select an active organization",
      });
    }
    const tenant = await resolveTenantMembership(
      db,
      context.session.user.id,
      organizationId
    );
    if (tenant.status === "forbidden") {
      throw new ORPCError("FORBIDDEN");
    }
    if (tenant.status === "unavailable") {
      throw new ORPCError("SERVICE_UNAVAILABLE", {
        message: "Tenant is unavailable",
      });
    }
    return await withTenantTransaction(
      db,
      tenant.tenantId,
      async (tx) =>
        await next({
          context: {
            db: tx,
            membership: tenant.membership,
            organizationId,
            tenantId: tenant.tenantId,
          },
        })
    );
  }
);
