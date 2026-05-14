import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

const defaultApi = "https://jsonplaceholder.typicode.com";
const defaultAppUrl = "http://localhost:3001";

export const env = createEnv({
  clientPrefix: "VITE_",
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
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
    VITE_PUBLIC_API_URL: z.string().url().default(defaultApi),
    VITE_PUBLIC_TANSTACK_APP_URL: z.string().url().default(defaultAppUrl),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    VITE_PUBLIC_API_URL: import.meta.env.VITE_PUBLIC_API_URL,
    VITE_PUBLIC_TANSTACK_APP_URL: import.meta.env.VITE_PUBLIC_TANSTACK_APP_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DEMO_EMAIL: process.env.AUTH_DEMO_EMAIL,
    AUTH_DEMO_PASSWORD: process.env.AUTH_DEMO_PASSWORD,
    AUTH_DEMO_NAME: process.env.AUTH_DEMO_NAME,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
