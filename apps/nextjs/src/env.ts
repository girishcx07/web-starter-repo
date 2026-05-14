import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

const defaultApi = "https://jsonplaceholder.typicode.com";
const defaultAppUrl = "http://localhost:3000";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    /** Remote Node API (server-side fetch, SSR, route handlers). */
    API_URL: z.string().url().default(defaultApi),
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    AUTH_DEMO_EMAIL: z.string().email().optional(),
    AUTH_DEMO_PASSWORD: z.string().optional(),
    AUTH_DEMO_NAME: z.string().optional(),
  },
  client: {
    /** Browser-facing same URL; keep in sync with `API_URL` in `.env`. */
    NEXT_PUBLIC_API_URL: z.string().url().default(defaultApi),
    NEXT_PUBLIC_APP_URL: z.string().url().default(defaultAppUrl),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
