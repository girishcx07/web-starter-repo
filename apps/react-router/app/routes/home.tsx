import { useForm } from "@tanstack/react-form";
import { useFetcher, useLoaderData } from "react-router";
import { z } from "zod/v4";

import type { Post } from "@acme/api";
import { CreatePostSchema, PostIdSchema } from "@acme/api";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import type { Route } from "./+types/home";
import { api } from "../api";
import { AuthShowcase } from "../components/auth-showcase";
import { SharedPackagesDemo } from "../components/shared-packages-demo";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Create T3 Turbo" },
    { name: "description", content: "React Router web app demo" },
  ];
}

export async function loader() {
  return { posts: await api.posts.getAll() };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = z.string().catch("").parse(formData.get("intent"));

  try {
    if (intent === "create") {
      const input = CreatePostSchema.parse({
        title: formData.get("title"),
        content: formData.get("content"),
      });
      await api.posts.create(input);
      return { ok: true };
    }

    if (intent === "delete") {
      const id = PostIdSchema.parse(formData.get("id"));
      await api.posts.delete(id);
      return { ok: true };
    }
  } catch (error) {
    return {
      ok: false,
      message: isUnauthorized(error)
        ? "You must be logged in"
        : "Request failed",
    };
  }

  return { ok: false, message: "Unknown form intent" };
}

function isUnauthorized(e: unknown) {
  return e instanceof Error && e.message === "UNAUTHORIZED";
}

export default function Home() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>
        <AuthShowcase />

        <SharedPackagesDemo framework="react-router" />

        <CreatePostForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          <PostList posts={posts} />
        </div>
      </div>
    </main>
  );
}

function CreatePostForm() {
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== "idle";

  const form = useForm({
    defaultValues: {
      content: "",
      title: "",
    },
    validators: {
      onSubmit: CreatePostSchema,
    },
    onSubmit: (data) => {
      void fetcher.submit(
        { ...data.value, intent: "create" },
        { method: "post" },
      );
      form.reset();
    },
  });

  return (
    <form
      className="w-full max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Post Title</FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Title"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Body"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      {fetcher.data && "ok" in fetcher.data && !fetcher.data.ok ? (
        <p className="text-destructive text-sm">{fetcher.data.message}</p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}

function PostList(props: { posts: Post[] }) {
  if (props.posts.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {props.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function PostCard(props: { post: Post }) {
  const fetcher = useFetcher<typeof action>();
  const isDeleting = fetcher.state !== "idle";

  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2 className="text-primary text-2xl font-bold">{props.post.title}</h2>
        <p className="mt-2 text-sm">{props.post.content}</p>
      </div>
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={props.post.id} />
        <Button
          type="submit"
          variant="ghost"
          className="text-primary cursor-pointer text-sm font-bold uppercase hover:bg-transparent hover:text-white"
          disabled={isDeleting}
          onClick={() => {
            if (isDeleting) toast.info("Deleting post...");
          }}
        >
          Delete
        </Button>
      </fetcher.Form>
    </div>
  );
}

function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2
          className={cn(
            "bg-primary w-1/4 rounded-sm text-2xl font-bold",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </h2>
        <p
          className={cn(
            "mt-2 w-1/3 rounded-sm bg-current text-sm",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}
