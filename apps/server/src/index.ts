import { cors } from "@elysiajs/cors";
import { createContext } from "@saasmanager/api/context";
import { auth } from "@saasmanager/auth";
import { db } from "@saasmanager/db";
import { env } from "@saasmanager/env/server";
import { Elysia } from "elysia";
import { initLogger } from "evlog";
import {
  type BetterAuthInstance,
  createAuthMiddleware,
} from "evlog/better-auth";
import { evlog } from "evlog/elysia";
import { createFsDrain } from "evlog/fs";
import { apiHandler, rpcHandler } from "./orpc-handlers";
import { guardOrganizationRoleManagement } from "./role-management-guard";

initLogger({
  env: { service: "saasmanager-server" },
});

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
  exclude: ["/api/auth/**"],
  maskEmail: true,
});

new Elysia()
  .use(
    evlog({
      drain:
        process.env.NODE_ENV === "production" ? undefined : createFsDrain(),
    })
  )
  .derive(async ({ request, log }) => {
    await identifyUser(log, request.headers, new URL(request.url).pathname);
    return {};
  })
  .use(
    cors({
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      origin: env.CORS_ORIGIN,
    })
  )
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      const denied = await guardOrganizationRoleManagement({
        auth,
        database: db,
        request,
      });
      if (denied) {
        return denied;
      }
      return auth.handler(request);
    }
    return status(405);
  })
  .all(
    "/rpc*",
    async (context) => {
      const { response } = await rpcHandler.handle(context.request, {
        context: await createContext({ context }),
        prefix: "/rpc",
      });
      return response ?? new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    }
  )
  .all(
    "/api-reference*",
    async (context) => {
      const { response } = await apiHandler.handle(context.request, {
        context: await createContext({ context }),
        prefix: "/api-reference",
      });
      return response ?? new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    }
  )
  .get("/", () => "OK")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
