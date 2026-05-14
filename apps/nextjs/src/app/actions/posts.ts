"use server";

import { revalidatePath } from "next/cache";

import type { CreatePostInput, PostId, UpdatePostInput } from "@acme/api";
import { CreatePostSchema, PostIdSchema, UpdatePostSchema } from "@acme/api";

import { api } from "~/api";

export async function createPostAction(input: CreatePostInput) {
  const body = CreatePostSchema.parse(input);
  const post = await api.posts.create(body);
  revalidatePath("/");
  return post;
}

export async function deletePostAction(id: PostId) {
  const postId = PostIdSchema.parse(id);
  await api.posts.delete(postId);
  revalidatePath("/");
  return postId;
}

export async function updatePostAction(input: UpdatePostInput) {
  const post = await api.posts.update(UpdatePostSchema.parse(input));
  revalidatePath("/");
  return post;
}
