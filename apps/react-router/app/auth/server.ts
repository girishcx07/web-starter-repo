import type { AuthHandlerConfig } from "@acme/auth/server";

import { env } from "../env";

const demoEmail = "demo@example.com";
const demoPassword = "password";

export function getAuthHandlerConfig(): AuthHandlerConfig {
  return {
    issuerBaseUrl: env.VITE_PUBLIC_REACT_ROUTER_APP_URL,
    authSecret: env.AUTH_SECRET,
    secureCookies: env.NODE_ENV === "production",
    demoEmail: env.AUTH_DEMO_EMAIL ?? demoEmail,
    demoPassword: env.AUTH_DEMO_PASSWORD ?? demoPassword,
    demoUserName: env.AUTH_DEMO_NAME ?? "Demo user",
  };
}
