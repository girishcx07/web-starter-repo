import { z } from "zod/v4";

export const PostIdSchema = z.coerce.number().int().positive();

const JsonPlaceholderPostSchema = z.object({
  userId: z.number().int().positive().optional(),
  id: PostIdSchema,
  title: z.string().max(256),
  body: z.string().max(2048),
});

export const CreatePostSchema = z.object({
  title: z.string().max(256),
  content: z.string().max(2048),
});

export const PostSchema = JsonPlaceholderPostSchema.transform((post) => ({
  id: post.id,
  title: post.title,
  content: post.body,
  userId: post.userId ?? 1,
}));

export type Post = z.infer<typeof PostSchema>;
export type PostId = z.infer<typeof PostIdSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
