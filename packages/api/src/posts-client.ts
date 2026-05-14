import { z } from "zod/v4";

import { CreatePostSchema, PostSchema, type Post } from "./schema/post";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

const PostListSchema = z.array(PostSchema);

export const POSTS_LIST_QUERY_KEY = ["posts", "list"] as const;

export async function listPosts(
  baseUrl: string,
  init?: RequestInit,
): Promise<Post[]> {
  const res = await fetch(joinUrl(baseUrl, "/posts"), {
    ...init,
    method: "GET",
    headers: {
      Accept: "application/json",
      ...Object.fromEntries(new Headers(init?.headers)),
    },
    credentials: init?.credentials ?? "include",
  });
  if (!res.ok) {
    throw new Error(`GET /posts failed: ${res.status}`);
  }
  const body: unknown = await res.json();
  return PostListSchema.parse(body);
}

export async function createRemotePost(
  baseUrl: string,
  input: z.infer<typeof CreatePostSchema>,
  init?: RequestInit,
): Promise<Post> {
  const body = CreatePostSchema.parse(input);
  const res = await fetch(joinUrl(baseUrl, "/posts"), {
    ...init,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(init?.headers)),
    },
    body: JSON.stringify(body),
    credentials: init?.credentials ?? "include",
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`POST /posts failed: ${res.status}`);
  }
  return PostSchema.parse(await res.json());
}

export async function deleteRemotePost(
  baseUrl: string,
  id: string,
  init?: RequestInit,
): Promise<void> {
  const res = await fetch(joinUrl(baseUrl, `/posts/${encodeURIComponent(id)}`), {
    ...init,
    method: "DELETE",
    headers: {
      ...Object.fromEntries(new Headers(init?.headers)),
    },
    credentials: init?.credentials ?? "include",
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`DELETE /posts/${id} failed: ${res.status}`);
  }
}
