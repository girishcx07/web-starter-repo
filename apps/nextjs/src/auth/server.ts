import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import type { AuthHandlerConfig } from "@acme/auth/server";
import { getServerSession } from "@acme/auth/server";

import { env } from "~/env";

const demoEmail = "demo@example.com";
const demoPassword = "password";

export const getSession = cache(async () => {
  return getServerSession(await headers(), { authSecret: env.AUTH_SECRET });
});

export function getAuthHandlerConfig(): AuthHandlerConfig {
  return {
    issuerBaseUrl: env.NEXT_PUBLIC_APP_URL,
    authSecret: env.AUTH_SECRET,
    secureCookies: env.NODE_ENV === "production",
    demoEmail: env.AUTH_DEMO_EMAIL ?? demoEmail,
    demoPassword: env.AUTH_DEMO_PASSWORD ?? demoPassword,
    demoUserName: env.AUTH_DEMO_NAME ?? "Demo user",
  };
}
