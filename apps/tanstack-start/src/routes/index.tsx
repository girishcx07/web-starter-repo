import { Suspense, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { CreatePostInput, Post, UpdatePostInput } from "@acme/api";
import {
  CreatePostSchema,
  PostIdSchema,
  POSTS_LIST_QUERY_KEY,
  UpdatePostSchema,
} from "@acme/api";
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

import { api } from "~/api";
import { AuthShowcase } from "~/component/auth-showcase";
import { SharedPackagesDemo } from "~/component/shared-packages-demo";

type ActionResult =
  | { ok: true; post?: Post; id?: Post["id"] }
  | { ok: false; message: string };

async function handlePostAction(request: Request) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "create") {
      const input = CreatePostSchema.parse({
        title: formData.get("title"),
        content: formData.get("content"),
      });
      const post = await api.posts.create(input);
      return Response.json({ ok: true, post } satisfies ActionResult);
    }

    if (intent === "update") {
      const input = UpdatePostSchema.parse({
        id: formData.get("id"),
        title: formData.get("title"),
        content: formData.get("content"),
      });
      const post = await api.posts.update(input);
      return Response.json({ ok: true, post } satisfies ActionResult);
    }

    if (intent === "delete") {
      const id = PostIdSchema.parse(formData.get("id"));
      await api.posts.delete(id);
      return Response.json({ ok: true, id } satisfies ActionResult);
    }
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: isUnauthorized(error)
          ? "You must be logged in"
          : "Request failed",
      } satisfies ActionResult,
      { status: 400 },
    );
  }

  return Response.json(
    { ok: false, message: "Unknown form intent" } satisfies ActionResult,
    { status: 400 },
  );
}

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    const { queryClient } = context;
    void queryClient.prefetchQuery({
      queryKey: POSTS_LIST_QUERY_KEY,
      queryFn: () => api.posts.getAll(),
    });
  },
  server: {
    handlers: {
      POST: ({ request }) => handlePostAction(request),
    },
  },
  component: RouteComponent,
});

function isUnauthorized(e: unknown) {
  return e instanceof Error && e.message === "UNAUTHORIZED";
}

function RouteComponent() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-2xl text-center">
          <p className="text-muted-foreground text-sm font-medium">
            TanStack Start SSR demo
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Open API posts
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            SSR prefetches JSONPlaceholder through the typed API client,
            Suspense hydrates TanStack Query, and client interactions submit to
            server handlers for mutations.
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <SharedPackagesDemo framework="tanstack-start" />
          <AuthShowcase />
        </div>

        <CreatePostForm />
        <div className="w-full max-w-4xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <PostList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function submitPostAction(body: Record<string, string | number>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    formData.set(key, String(value));
  }

  const response = await fetch("/", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as ActionResult;
  if (!response.ok || !result.ok) {
    throw new Error(result.ok ? "Request failed" : result.message);
  }
  return result;
}

function CreatePostForm() {
  const queryClient = useQueryClient();
  const createPost = useMutation({
    mutationFn: (input: CreatePostInput) =>
      submitPostAction({ ...input, intent: "create" }),
    onSuccess: (result) => {
      form.reset();
      toast.success("Post accepted by the demo API");
      if (result.post) {
        queryClient.setQueryData<Post[]>(POSTS_LIST_QUERY_KEY, (posts = []) => [
          result.post!,
          ...posts,
        ]);
      }
    },
    onError: (err) => {
      toast.error(
        isUnauthorized(err)
          ? "You must be logged in to post"
          : "Failed to create post",
      );
    },
  });

  const form = useForm({
    defaultValues: {
      content: "",
      title: "",
    },
    validators: {
      onSubmit: CreatePostSchema,
    },
    onSubmit: (data) => createPost.mutate(data.value),
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
      <Button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}

function PostList() {
  const { data: posts } = useSuspenseQuery({
    queryKey: POSTS_LIST_QUERY_KEY,
    queryFn: () => api.posts.getAll(),
  });

  if (posts.length === 0) {
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
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((p) => {
        return <PostCard key={p.id} post={p} />;
      })}
    </div>
  );
}

function PostCard(props: { post: Post }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(props.post.title);
  const [content, setContent] = useState(props.post.content);
  const deletePost = useMutation({
    mutationFn: (id: Post["id"]) => submitPostAction({ intent: "delete", id }),
    onSuccess: (result) => {
      toast.success("Delete accepted by the demo API");
      queryClient.setQueryData<Post[]>(POSTS_LIST_QUERY_KEY, (posts = []) =>
        posts.filter((post) => post.id !== result.id),
      );
    },
    onError: (err) => {
      toast.error(
        isUnauthorized(err)
          ? "You must be logged in to delete a post"
          : "Failed to delete post",
      );
    },
  });
  const updatePost = useMutation({
    mutationFn: (input: UpdatePostInput) =>
      submitPostAction({ ...input, intent: "update" }),
    onSuccess: (result) => {
      setIsEditing(false);
      toast.success("Update accepted by the demo API");
      if (result.post) {
        queryClient.setQueryData<Post[]>(POSTS_LIST_QUERY_KEY, (posts = []) =>
          posts.map((post) =>
            post.id === result.post!.id ? result.post! : post,
          ),
        );
      }
    },
    onError: (err) => {
      toast.error(
        isUnauthorized(err)
          ? "You must be logged in to update a post"
          : "Failed to update post",
      );
    },
  });

  const saveUpdate = () => {
    const next = UpdatePostSchema.parse({
      id: props.post.id,
      title,
      content,
    });
    updatePost.mutate(next);
  };

  return (
    <div className="bg-muted flex min-h-48 flex-col rounded-md border p-4">
      <div className="grow">
        <p className="text-muted-foreground text-xs font-medium">
          Post #{props.post.id}
        </p>
        {isEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <Input
              value={title}
              aria-label={`Title for post ${props.post.id}`}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              value={content}
              aria-label={`Body for post ${props.post.id}`}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
        ) : (
          <>
            <h2 className="text-primary mt-1 line-clamp-2 text-lg font-bold">
              {props.post.title}
            </h2>
            <p className="mt-3 line-clamp-4 text-sm">{props.post.content}</p>
          </>
        )}
      </div>
      <div className="mt-4 flex gap-3">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              className="text-primary h-8 cursor-pointer px-0 text-xs font-bold uppercase hover:bg-transparent hover:text-white"
              disabled={updatePost.isPending}
              onClick={saveUpdate}
            >
              {updatePost.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground h-8 cursor-pointer px-0 text-xs font-bold uppercase hover:bg-transparent"
              disabled={updatePost.isPending}
              onClick={() => {
                setTitle(props.post.title);
                setContent(props.post.content);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="text-primary h-8 cursor-pointer px-0 text-xs font-bold uppercase hover:bg-transparent hover:text-white"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-primary h-8 cursor-pointer px-0 text-xs font-bold uppercase hover:bg-transparent hover:text-white"
          disabled={deletePost.isPending}
          onClick={() => deletePost.mutate(props.post.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="bg-muted flex min-h-48 flex-row rounded-md border p-4">
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
