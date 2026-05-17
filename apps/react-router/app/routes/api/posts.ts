import { z } from "zod/v4";

import { CreatePostSchema, PostIdSchema, UpdatePostSchema } from "@acme/api";
import { AuthRequiredError, requireAuth } from "@acme/auth/server";

import { api } from "../../api";
import { getAuthHandlerConfig } from "../../auth/server";

function isUnauthorized(e: unknown) {
  return (
    e instanceof AuthRequiredError ||
    (e instanceof Error && e.message === "UNAUTHORIZED")
  );
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = z.string().catch("").parse(formData.get("intent"));

  try {
    await requireAuth(request.headers, {
      authSecret: getAuthHandlerConfig().authSecret,
    });

    if (intent === "create") {
      const input = CreatePostSchema.parse({
        title: formData.get("title"),
        content: formData.get("content"),
      });
      const post = await api.posts.create(input);
      return Response.json({
        ok: true,
        post,
      });
    }

    if (intent === "delete") {
      const id = PostIdSchema.parse(formData.get("id"));
      await api.posts.delete(id);
      return Response.json({ ok: true, id });
    }

    if (intent === "update") {
      const input = UpdatePostSchema.parse({
        id: formData.get("id"),
        title: formData.get("title"),
        content: formData.get("content"),
      });
      const post = await api.posts.update(input);
      return Response.json({ ok: true, post });
    }
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: isUnauthorized(error)
          ? "You must be logged in"
          : "Request failed",
      },
      { status: 400 },
    );
  }

  return Response.json(
    { ok: false, message: "Unknown form intent" },
    { status: 400 },
  );
}
