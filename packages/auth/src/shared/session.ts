import { z } from "zod/v4";

export const SessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable().optional(),
});

export const SessionSchema = z.object({
  user: SessionUserSchema,
  expiresAt: z.string(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type Session = z.infer<typeof SessionSchema>;

export const SESSION_COOKIE_NAME = "acme_session";
