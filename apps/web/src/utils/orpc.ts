import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "@saasmanager/api/routers/index";
import { env } from "@saasmanager/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createRpcLink } from "./rpc-link";
import { getServerUrl } from "./server-url";

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error(`Error: ${error.message}`, {
          action: {
            label: "retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
  });
}

export const queryClient = createQueryClient();

export const link = createRpcLink(getServerUrl(env.VITE_SERVER_URL));

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
