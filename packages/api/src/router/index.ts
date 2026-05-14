import type { Caller } from "@acme/caller";

import { createPostsRouter } from "./posts";

export function createApiClient(caller: Caller) {
  return {
    posts: createPostsRouter(caller),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
