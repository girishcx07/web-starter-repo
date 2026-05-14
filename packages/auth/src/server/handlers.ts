import { z } from "zod/v4";

import type { Session } from "../shared/session";
import { SESSION_COOKIE_NAME, SessionSchema } from "../shared/session";
import {
  buildClearCookieHeader,
  buildSetCookieHeader,
  getSessionTokenFromCookieHeader,
} from "./cookies";
import {
  decodeSession,
  encodeSession,
  payloadToSession,
} from "./signed-session";

export interface AuthHandlerConfig {
  issuerBaseUrl: string;
  authSecret?: string;
  secureCookies: boolean;
  sessionMaxAgeDays?: number;
  /** Optional demo login (no external IdP, no database). */
  demoEmail?: string;
  demoPassword?: string;
  demoUserId?: string;
  demoUserName?: string;
  verifyBearerToken?: (
    token: string,
  ) => Promise<Session | null> | Session | null;
}

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

function resolveSecret(config: AuthHandlerConfig): string | null {
  if (config.authSecret) return config.authSecret;
  if (process.env.NODE_ENV !== "production") {
    return "dev-insecure-auth-secret-change-me";
  }
  return null;
}

export function createAuthHandlers(config: AuthHandlerConfig) {
  const days = config.sessionMaxAgeDays ?? 30;
  const maxAge = days * 86400;

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    const isAuth =
      parts[0] === "api" && parts[1] === "auth" ? parts.slice(2) : null;
    if (!isAuth) {
      return json({ error: "not_found" }, { status: 404 });
    }

    const [seg] = isAuth;
    const method = request.method;
    const secret = resolveSecret(config);

    if ((seg === "session" || seg === "verify") && method === "GET") {
      const authHeader =
        request.headers.get("authorization") ??
        request.headers.get("Authorization");
      if (
        authHeader?.toLowerCase().startsWith("bearer ") &&
        config.verifyBearerToken
      ) {
        const session = await config.verifyBearerToken(authHeader.slice(7));
        return json({ session });
      }

      const token = getSessionTokenFromCookieHeader(
        request.headers.get("cookie"),
      );
      if (!token || !secret) return json({ session: null });
      const payload = decodeSession(secret, token);
      if (!payload) return json({ session: null });
      const session = SessionSchema.parse(payloadToSession(payload));
      return json({ session });
    }

    if (seg === "logout" && method === "POST") {
      const h = new Headers();
      h.append(
        "Set-Cookie",
        buildClearCookieHeader({
          name: SESSION_COOKIE_NAME,
          secure: config.secureCookies,
        }),
      );
      return json({ ok: true }, { headers: h });
    }

    if (seg === "refresh" && method === "POST") {
      if (!secret) {
        return json({ error: "auth_secret_missing" }, { status: 503 });
      }
      const token = getSessionTokenFromCookieHeader(
        request.headers.get("cookie"),
      );
      if (!token) return json({ error: "unauthorized" }, { status: 401 });
      const payload = decodeSession(secret, token);
      if (!payload) return json({ error: "unauthorized" }, { status: 401 });

      const exp = Date.now() + days * 86400_000;
      const nextToken = encodeSession(secret, payload.user, exp);
      const h = new Headers();
      h.append(
        "Set-Cookie",
        buildSetCookieHeader({
          name: SESSION_COOKIE_NAME,
          value: nextToken,
          maxAgeSeconds: maxAge,
          secure: config.secureCookies,
        }),
      );
      const session = SessionSchema.parse(
        payloadToSession({ ...payload, exp }),
      );
      return json({ session }, { headers: h });
    }

    if (seg === "login" && method === "POST") {
      if (!secret) {
        return json(
          {
            error: "auth_secret_missing",
            message: "AUTH_SECRET is required in production.",
          },
          { status: 503 },
        );
      }
      const demoEmail = config.demoEmail?.trim();
      const demoPassword = config.demoPassword;
      if (!demoEmail || !demoPassword) {
        return json(
          {
            error: "login_unconfigured",
            message:
              "Demo login is not configured. Set AUTH_DEMO_EMAIL and AUTH_DEMO_PASSWORD.",
          },
          { status: 503 },
        );
      }

      let body: z.infer<typeof LoginBodySchema>;
      try {
        const raw: unknown = await request.json();
        body = LoginBodySchema.parse(raw);
      } catch {
        return json({ error: "invalid_body" }, { status: 400 });
      }

      if (body.email !== demoEmail || body.password !== demoPassword) {
        return json({ error: "invalid_credentials" }, { status: 401 });
      }

      const user = {
        id: config.demoUserId ?? "demo-user",
        name: config.demoUserName ?? "Demo user",
        email: demoEmail,
        image: undefined as string | undefined,
      };
      const exp = Date.now() + days * 86400_000;
      const sessionToken = encodeSession(secret, user, exp);
      const h = new Headers();
      h.append(
        "Set-Cookie",
        buildSetCookieHeader({
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
          maxAgeSeconds: maxAge,
          secure: config.secureCookies,
        }),
      );
      const session = SessionSchema.parse(payloadToSession({ user, exp }));
      return json({ session }, { headers: h });
    }

    if (seg === "login" && method === "GET") {
      return json(
        {
          error: "use_post",
          message: "Use POST /api/auth/login with JSON { email, password }.",
        },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    return json({ error: "not_found" }, { status: 404 });
  }

  return { handle };
}
