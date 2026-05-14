import type { Session } from "../shared/session";
import { SessionSchema } from "../shared/session";
import { getSessionTokenFromCookieHeader } from "./cookies";
import { decodeSession, payloadToSession } from "./signed-session";

export interface GetServerSessionOptions {
  authSecret?: string;
}

function resolveSecret(explicit?: string): string | null {
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== "production") {
    return "dev-insecure-auth-secret-change-me";
  }
  return null;
}

export async function getServerSession(
  headersOrCookie: Headers | string | null | undefined,
  options?: GetServerSessionOptions,
): Promise<Session | null> {
  let token: string | null = null;
  
  if (headersOrCookie && typeof headersOrCookie !== "string" && typeof headersOrCookie.get === "function") {
    const authHeader = headersOrCookie.get("authorization") ?? headersOrCookie.get("Authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    const cookie =
      typeof headersOrCookie === "string" || headersOrCookie == null
        ? headersOrCookie
        : headersOrCookie.get("cookie");
    token = getSessionTokenFromCookieHeader(cookie ?? null);
  }

  const secret = resolveSecret(options?.authSecret);
  if (!token || !secret) return null;
  const payload = decodeSession(secret, token);
  if (!payload) return null;
  const parsed = SessionSchema.safeParse(payloadToSession(payload));
  return parsed.success ? parsed.data : null;
}

export const verifySession = getServerSession;
