"use server";

import { revalidatePath } from "next/cache";

import {
  CreatePostSchema,
  PostIdSchema,
  type CreatePostInput,
  type PostId,
} from "@acme/api";

import { api } from "~/api";

export async function createPostAction(input: CreatePostInput) {
  const body = CreatePostSchema.parse(input);
  await api.posts.create(body);
  revalidatePath("/");
}

export async function deletePostAction(id: PostId) {
  await api.posts.delete(PostIdSchema.parse(id));
  revalidatePath("/");
}
