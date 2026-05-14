import { z } from "zod/v4";

import { err, ok, type Result } from "../result";

const frameworks = ["nextjs", "tanstack-start", "react-router"] as const;

/** Frameworks represented by apps in this monorepo (used for typed demos). */
export const WebFrameworkSchema = z.enum(frameworks);

export type WebFramework = z.infer<typeof WebFrameworkSchema>;

export const WEB_FRAMEWORKS: readonly WebFramework[] = [...frameworks];

export function parseWebFramework(
  value: unknown,
): Result<WebFramework, z.ZodError> {
  const parsed = WebFrameworkSchema.safeParse(value);
  return parsed.success ? ok(parsed.data) : err(parsed.error);
}
