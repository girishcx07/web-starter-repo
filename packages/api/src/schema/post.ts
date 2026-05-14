import { z } from "zod/v4";

export const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(256),
  content: z.string().max(256),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

export const CreatePostSchema = z.object({
  title: z.string().max(256),
  content: z.string().max(256),
});

export type Post = z.infer<typeof PostSchema>;
