import { z } from "zod/v4";

import type { Caller } from "@acme/caller";
import { CallerError } from "@acme/caller";

import type {
  CreatePostInput,
  Post,
  PostId,
  UpdatePostInput,
} from "../schema/post";
import {
  CreatePostSchema,
  PostIdSchema,
  PostSchema,
  UpdatePostSchema,
} from "../schema/post";

const JsonPlaceholderCreatePostSchema = CreatePostSchema.transform((post) => ({
  title: post.title,
  body: post.content,
  userId: 1,
}));

const JsonPlaceholderUpdatePostSchema = UpdatePostSchema.transform((post) => ({
  id: post.id,
  title: post.title,
  body: post.content,
  userId: 1,
}));

const demoPosts = new Map<PostId, Post>();
const deletedPostIds = new Set<PostId>();

function createDemoPostId() {
  return Date.now();
}

function applyDemoState(posts: Post[]) {
  const mergedPosts = posts
    .filter((post) => !deletedPostIds.has(post.id))
    .map((post) => demoPosts.get(post.id) ?? post);

  const createdPosts = [...demoPosts.values()].filter(
    (post) => !posts.some((sourcePost) => sourcePost.id === post.id),
  );

  return [...createdPosts.reverse(), ...mergedPosts];
}

export function createPostsRouter(caller: Caller) {
  return {
    getAll: async () => {
      const body = await caller.get("/posts");
      return applyDemoState(z.array(PostSchema).parse(body).slice(0, 12));
    },
    create: async (input: CreatePostInput) => {
      const body = JsonPlaceholderCreatePostSchema.parse(input);
      const res = await caller.post("/posts", { json: body });
      const post = PostSchema.parse(res);
      const demoPost = { ...post, id: createDemoPostId() };
      demoPosts.set(demoPost.id, demoPost);
      deletedPostIds.delete(demoPost.id);
      return demoPost;
    },
    update: async (input: UpdatePostInput) => {
      const body = JsonPlaceholderUpdatePostSchema.parse(input);
      const existingDemoPost = demoPosts.get(body.id);
      if (existingDemoPost) {
        const post = PostSchema.parse(body);
        demoPosts.set(post.id, post);
        deletedPostIds.delete(post.id);
        return post;
      }

      const path = `/posts/${encodeURIComponent(body.id)}`;
      const res = await caller.patch(path, { json: body }).catch((error) => {
        if (error instanceof CallerError && error.status === 404) {
          return body;
        }
        throw error;
      });
      const post = PostSchema.parse(res);
      demoPosts.set(post.id, post);
      deletedPostIds.delete(post.id);
      return post;
    },
    delete: async (id: PostId) => {
      const postId = PostIdSchema.parse(id);
      if (demoPosts.delete(postId)) {
        deletedPostIds.add(postId);
        return;
      }

      await caller.delete(`/posts/${encodeURIComponent(postId)}`);
      deletedPostIds.add(postId);
    },
  };
}
