import { createApiClient } from "@acme/api";
import { createCaller } from "@acme/caller";

import { env } from "./env";

export const caller = createCaller({
  baseUrl:
    typeof window !== "undefined" ? env.VITE_PUBLIC_API_URL : env.API_URL,
  credentials: "include",
});

export const api = createApiClient(caller);
export type ApiClient = typeof api;
