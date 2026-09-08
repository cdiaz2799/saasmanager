import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { createDb } from "@saasmanager/db";
import { authSchema, createAuthDb } from "@saasmanager/db/auth";
import { provisionOrganizationTenant } from "@saasmanager/db/tenant";
import { env } from "@saasmanager/env/server";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins/organization";

export function createAuth(db = createDb()) {
  return betterAuth({
    account: { modelName: "authAccount" },
    advanced: {
      database: {
        generateId: "uuid",
        joins: true,
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(createAuthDb(db.$client), {
      provider: "pg",

      schema: authSchema,
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: false,
        disableOrganizationDeletion: true,
        organizationHooks: {
          afterCreateOrganization: async ({
            organization: createdOrganization,
          }) => {
            await provisionOrganizationTenant(db, createdOrganization.id);
          },
        },
      }),
    ],
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CORS_ORIGIN],
  });
}

export const auth = createAuth();
