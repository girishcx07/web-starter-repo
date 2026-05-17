"use server";

import { revalidatePath } from "next/cache";

import type { CreatePostInput, PostId, UpdatePostInput } from "@acme/api";
import { CreatePostSchema, PostIdSchema, UpdatePostSchema } from "@acme/api";

import { api } from "~/api";
import { getSession } from "~/auth/server";

async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function createPostAction(input: CreatePostInput) {
  await requireSession();
  const body = CreatePostSchema.parse(input);
  const post = await api.posts.create(body);
  revalidatePath("/");
  return post;
}

export async function deletePostAction(id: PostId) {
  await requireSession();
  const postId = PostIdSchema.parse(id);
  await api.posts.delete(postId);
  revalidatePath("/");
  return postId;
}

export async function updatePostAction(input: UpdatePostInput) {
  await requireSession();
  const post = await api.posts.update(UpdatePostSchema.parse(input));
  revalidatePath("/");
  return post;
}
