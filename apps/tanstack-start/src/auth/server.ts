import type { AuthHandlerConfig } from "@acme/auth/server";

import { env } from "~/env";
import { getBaseUrl } from "~/lib/url";

export function getAuthHandlerConfig(): AuthHandlerConfig {
  return {
    issuerBaseUrl: getBaseUrl(),
    authSecret: env.AUTH_SECRET,
    secureCookies: env.NODE_ENV === "production",
    demoEmail: env.AUTH_DEMO_EMAIL,
    demoPassword: env.AUTH_DEMO_PASSWORD,
    demoUserName: env.AUTH_DEMO_NAME,
  };
}
