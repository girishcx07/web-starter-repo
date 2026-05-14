import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import type { AuthHandlerConfig } from "@acme/auth/server";
import { getServerSession } from "@acme/auth/server";

import { env } from "~/env";

const baseUrl =
  env.VERCEL_ENV === "production"
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000";

export const getSession = cache(async () => {
  return getServerSession(await headers(), { authSecret: env.AUTH_SECRET });
});

export function getAuthHandlerConfig(): AuthHandlerConfig {
  return {
    issuerBaseUrl: baseUrl,
    authSecret: env.AUTH_SECRET,
    secureCookies: env.NODE_ENV === "production",
    demoEmail: env.AUTH_DEMO_EMAIL,
    demoPassword: env.AUTH_DEMO_PASSWORD,
    demoUserName: env.AUTH_DEMO_NAME,
  };
}
