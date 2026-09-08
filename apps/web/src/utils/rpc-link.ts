import { RPCLink } from "@orpc/client/fetch";

export function createRpcLink(
  serverUrl: string,
  fetcher: (url: string, options: RequestInit) => Promise<Response> = fetch
) {
  const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  const endpoint = new URL(`${base}/rpc`);
  return new RPCLink({
    fetch(url, options) {
      return fetcher(url, { ...options, credentials: "include" });
    },
    method: "POST",
    origin: endpoint.origin,
    url: `/${endpoint.pathname.slice(1)}`,
  });
}
