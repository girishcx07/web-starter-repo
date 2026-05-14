import { createApiClient } from "@acme/api";
import { createCaller } from "@acme/caller";

import { env } from "./env";

export const caller = createCaller({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  credentials: "include",
});

export const api = createApiClient(caller);
export type ApiClient = typeof api;
