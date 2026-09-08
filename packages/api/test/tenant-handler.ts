import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { auth } from "@saasmanager/auth";
import { z } from "zod";

import { permissionProcedure, tenantProcedure } from "../src/index";

let permissionHandlerCalls = 0;

// Test-only route exercises the same OpenAPI handler used by the server.
const handler = new OpenAPIHandler({
  permission: permissionProcedure("catalog:write")
    .meta(openapi({ method: "GET", path: "/permission-test" }))
    .output(z.string())
    .handler(() => {
      permissionHandlerCalls += 1;
      return "allowed";
    }),
  tenant: tenantProcedure
    .meta(openapi({ method: "GET", path: "/tenant-test" }))
    .output(z.array(z.string()))
    .handler(async ({ context }) => {
      const rows = await context.db.query.tenants.findMany({
        where: { id: context.tenantId },
      });
      return rows.map((row) => row.id);
    }),
});

export function getPermissionHandlerCalls() {
  return permissionHandlerCalls;
}

export async function handleTenantTestRequest(request: Request) {
  return await handler.handle(request, {
    context: {
      auth: null,
      headers: request.headers,
      session: await auth.api.getSession({ headers: request.headers }),
    },
  });
}

import { openapi } from "@orpc/openapi";
