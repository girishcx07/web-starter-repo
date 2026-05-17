import type { Caller } from "@acme/caller";
import { createCaller } from "@acme/caller";

import type { Session } from "../shared/session";
import { SessionSchema } from "../shared/session";

export interface GetClientSessionOptions {
  caller?: Caller;
  fetchFn?: typeof fetch;
  credentials?: RequestCredentials;
  timeoutMs?: number;
}

/**
 * Browser or SSR client: reads the session JSON from the auth API.
 * Pass `baseUrl` when calling from SSR against an absolute origin (e.g. `http://localhost:3000`).
 */
export async function getClientSession(
  baseUrl = "",
  options?: GetClientSessionOptions,
): Promise<Session | null> {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), options?.timeoutMs ?? 3000)
    : null;
  const api =
    options?.caller ??
    createCaller({
      baseUrl,
      fetch: options?.fetchFn,
      credentials: options?.credentials ?? "include",
    });

  try {
    const data = await api.get("/api/auth/session", {
      signal: controller?.signal,
    });
    return zodSafeSession(data);
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function zodSafeSession(data: unknown): Session | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (!("session" in rec)) return null;
  const s = rec.session;
  if (s === null) return null;
  const r = SessionSchema.safeParse(s);
  return r.success ? r.data : null;
}
