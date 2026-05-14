export {
  CreatePostSchema,
  PostIdSchema,
  PostSchema,
  UpdatePostSchema,
  type CreatePostInput,
  type Post,
  type PostId,
  type UpdatePostInput,
} from "./schema/post";
export { createApiClient, type ApiClient } from "./router";

export const POSTS_LIST_QUERY_KEY = ["posts", "list"] as const;
