import type { Session } from "../shared/session";
import { SessionSchema } from "../shared/session";
import { getSessionTokenFromCookieHeader } from "./cookies";
import { decodeSession, payloadToSession } from "./signed-session";

export interface GetServerSessionOptions {
  authSecret?: string;
  verifyBearerToken?: (
    token: string,
  ) => Promise<Session | null> | Session | null;
}

export class AuthRequiredError extends Error {
  readonly status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthRequiredError";
  }
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
  let bearerToken: string | null = null;

  if (
    typeof headersOrCookie !== "string" &&
    typeof headersOrCookie?.get === "function"
  ) {
    const authHeader =
      headersOrCookie.get("authorization") ??
      headersOrCookie.get("Authorization");
    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      bearerToken = authHeader.slice(7);
    }
  }

  if (bearerToken && options?.verifyBearerToken) {
    const session = await options.verifyBearerToken(bearerToken);
    if (session) return session;
  }

  const cookie =
    typeof headersOrCookie === "string" || headersOrCookie == null
      ? headersOrCookie
      : headersOrCookie.get("cookie");
  const token = getSessionTokenFromCookieHeader(cookie ?? null) ?? bearerToken;
  const secret = resolveSecret(options?.authSecret);
  if (!token || !secret) return null;
  const payload = decodeSession(secret, token);
  if (!payload) return null;
  const parsed = SessionSchema.safeParse(payloadToSession(payload));
  return parsed.success ? parsed.data : null;
}

export const verifySession = getServerSession;

export async function requireAuth(
  headersOrCookie: Headers | string | null | undefined,
  options?: GetServerSessionOptions,
): Promise<Session> {
  const session = await getServerSession(headersOrCookie, options);
  if (!session) {
    throw new AuthRequiredError();
  }
  return session;
}
