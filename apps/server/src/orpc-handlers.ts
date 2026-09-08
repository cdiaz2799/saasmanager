import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { appRouter } from "@saasmanager/api/routers/index";

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [onError((error) => console.error(error))],
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  interceptors: [onError((error) => console.error(error))],
  plugins: [
    new OpenAPIReferenceHandlerPlugin({
      provider: "scalar",
      spec: () =>
        generator.generate(appRouter, {
          base: {
            info: { title: "saasmanager API", version: "0.0.0" },
            servers: [{ url: "/api-reference" }],
          },
          version: "3.1.1",
        }),
    }),
  ],
});
