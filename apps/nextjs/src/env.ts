import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

const defaultApi = "https://example.com/v1";

export const env = createEnv({
  extends: [vercel()],
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
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
