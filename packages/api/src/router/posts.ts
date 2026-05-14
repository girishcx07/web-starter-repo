import type { Caller } from "@acme/caller";
import { z } from "zod/v4";

import {
  CreatePostSchema,
  PostIdSchema,
  PostSchema,
  type CreatePostInput,
  type PostId,
} from "../schema/post";

const JsonPlaceholderCreatePostSchema = CreatePostSchema.transform((post) => ({
  title: post.title,
  body: post.content,
  userId: 1,
}));

export function createPostsRouter(caller: Caller) {
  return {
    getAll: async () => {
      const body = await caller.get("/posts");
      return z.array(PostSchema).parse(body).slice(0, 12);
    },
    create: async (input: CreatePostInput) => {
      const body = JsonPlaceholderCreatePostSchema.parse(input);
      const res = await caller.post("/posts", body);
      return PostSchema.parse(res);
    },
    delete: async (id: PostId) => {
      const postId = PostIdSchema.parse(id);
      await caller.delete(`/posts/${encodeURIComponent(postId)}`);
    },
  };
}
