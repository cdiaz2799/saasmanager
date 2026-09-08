import { expect, test } from "bun:test";
import { createORPCClient } from "@orpc/client";
import { os, type RouterClient } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { createRpcLink } from "./rpc-link";
import { getServerUrl } from "./server-url";

test("server URL resolution preserves browser and server fallbacks", () => {
  expect(getServerUrl("https://api.example.com/", {})).toBe(
    "https://api.example.com"
  );
  expect(getServerUrl("/backend/", {}, "https://web.example.com")).toBe(
    "https://web.example.com/backend"
  );
  expect(getServerUrl("/backend", { SERVER_URL: "http://server:3000/" })).toBe(
    "http://server:3000"
  );
  expect(
    getServerUrl(
      "/backend",
      { SERVER_URL: "http://server:3000" },
      "https://web.example.com"
    )
  ).toBe("https://web.example.com/backend");
  expect(
    getServerUrl("/backend", {
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.example.com",
      VERCEL_URL: "preview.example.com",
    })
  ).toBe("https://prod.example.com/backend");
  expect(
    getServerUrl("/backend", {
      VERCEL_ENV: "preview",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.example.com",
      VERCEL_URL: "preview.example.com",
    })
  ).toBe("https://preview.example.com/backend");
  expect(
    getServerUrl("/backend", {
      VERCEL_PROJECT_PRODUCTION_URL: "https://prod.example.com",
    })
  ).toBe("https://prod.example.com/backend");
  expect(getServerUrl("/backend", {})).toBe("http://localhost:3000/backend");
});

test.each([
  ["http://localhost:3000", "http://localhost:3000/rpc/health"],
  ["https://example.com/", "https://example.com/rpc/health"],
  ["https://example.com/backend", "https://example.com/backend/rpc/health"],
  ["https://example.com/backend/", "https://example.com/backend/rpc/health"],
])(
  "RPC preserves the server origin and base path: %s",
  async (serverUrl, expectedUrl) => {
    const router = { health: os.handler(() => "OK") };
    const handler = new RPCHandler(router);
    const client: RouterClient<typeof router> = createORPCClient(
      createRpcLink(serverUrl, async (url, options) => {
        expect(url).toBe(expectedUrl);
        expect(options.method).toBe("POST");
        expect(options.credentials).toBe("include");
        const { response } = await handler.handle(new Request(url, options), {
          prefix: `/${new URL(expectedUrl).pathname.slice(1, -"/health".length)}`,
        });
        if (!response) {
          throw new Error("RPC URL did not match");
        }
        return response;
      })
    );
    expect(await client.health()).toBe("OK");
  }
);
