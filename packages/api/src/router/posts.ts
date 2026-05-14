import { Caller } from "@acme/caller";
import { z } from "zod/v4";
import { CreatePostSchema, PostSchema } from "../schema/post";

export function createPostsRouter(caller: Caller) {
  return {
    getAll: async () => {
      const body = await caller.get("/posts");
      return z.array(PostSchema).parse(body);
    },
    create: async (input: z.infer<typeof CreatePostSchema>) => {
      const body = CreatePostSchema.parse(input);
      const res = await caller.post("/posts", { json: body });
      return PostSchema.parse(res);
    },
    delete: async (id: string) => {
      await caller.delete(`/posts/${encodeURIComponent(id)}`);
    },
  };
}
