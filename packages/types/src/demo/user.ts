import { z } from "zod/v4";

/** Example domain schema — validate unknown JSON at boundaries. */
export const DemoUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(120),
  role: z.enum(["viewer", "editor", "admin"]).default("viewer"),
});

export type DemoUser = z.infer<typeof DemoUserSchema>;
