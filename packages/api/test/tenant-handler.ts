import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { auth } from "@saasmanager/auth";
import { z } from "zod";

import { tenantProcedure } from "../src/index";

// Test-only route exercises the same OpenAPI handler used by the server.
const handler = new OpenAPIHandler({
  tenant: tenantProcedure
    .route({ method: "GET", path: "/tenant-test" })
    .output(z.array(z.string()))
    .handler(async ({ context }) => {
      const rows = await context.db.query.tenants.findMany({
        where: { id: context.tenantId },
      });
      return rows.map((row) => row.id);
    }),
});

export async function handleTenantTestRequest(request: Request) {
  return await handler.handle(request, {
    context: {
      auth: null,
      session: await auth.api.getSession({ headers: request.headers }),
    },
  });
}
