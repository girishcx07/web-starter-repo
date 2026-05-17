import type { FormEvent } from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLoaderData } from "react-router";

import type { CreatePostInput, Post, UpdatePostInput } from "@acme/api";
import {
  CreatePostSchema,
  POSTS_LIST_QUERY_KEY,
  UpdatePostSchema,
} from "@acme/api";
import { useAuth } from "@acme/auth/react";
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

export async function loader({ request }: Route.LoaderArgs) {
  const [{ getServerSession }, { getAuthHandlerConfig }] = await Promise.all([
    import("@acme/auth/server"),
    import("../auth/server"),
  ]);
  const authConfig = getAuthHandlerConfig();
  return {
    posts: await api.posts.getAll(),
    session: await getServerSession(request.headers, {
      authSecret: authConfig.authSecret,
    }),
  };
}

type MutationResult =
  | { ok: true; post?: Post; id?: Post["id"] }
  | { ok: false; message: string };

async function submitPostAction(body: Record<string, string | number>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    formData.set(key, String(value));
  }

  const response = await fetch("/api/posts", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as MutationResult;
  if (!response.ok || !result.ok) {
    throw new Error(result.ok ? "Request failed" : result.message);
  }
  return result;
}

export default function Home() {
  const { posts, session } = useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="bg-card/85 flex flex-col gap-4 rounded-md border border-white/10 px-5 py-4 shadow-2xl shadow-black/25 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-background/80 text-accent grid size-10 place-items-center rounded-md border border-white/10 text-sm font-semibold">
              T3
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">
                ACME Web Boilerplate
              </p>
              <p className="text-muted-foreground text-xs">
                React Router SSR running on localhost:3002
              </p>
            </div>
          </div>
          <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
            <div className="bg-background/50 rounded-md border border-white/10 px-3 py-2">
              Next <span className="text-foreground">3000</span>
            </div>
            <div className="bg-background/50 rounded-md border border-white/10 px-3 py-2">
              TanStack <span className="text-foreground">3001</span>
            </div>
            <div className="bg-background/50 rounded-md border border-white/10 px-3 py-2">
              Router <span className="text-foreground">3002</span>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-card/80 rounded-md border border-white/10 p-6 shadow-xl shadow-black/20">
            <p className="text-accent text-xs font-semibold uppercase">
              Template standard
            </p>
            <h1 className="text-foreground mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
              A clean, auth-aware starter for every included web app.
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
              Shared packages, typed server boundaries, consistent session
              handling, and CRUD routes that are public for reads but locked for
              mutations.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Auth gated CRUD", "Shared UI system", "Typed API client"].map(
                (item) => (
                  <div
                    key={item}
                    className="bg-background/45 text-foreground rounded-md border border-white/10 p-3 text-sm font-medium"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
          <SharedPackagesDemo framework="react-router" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <AuthShowcase initialSession={session} />
          <CreatePostForm initialCanMutate={Boolean(session)} />
        </section>

        <section className="bg-card/70 rounded-md border border-white/10 p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-accent text-xs font-semibold uppercase">
                Demo API
              </p>
              <h2 className="text-foreground text-2xl font-semibold">
                Posts workspace
              </h2>
              <p className="text-muted-foreground text-sm">
                Browse public data, then sign in to mutate it through the auth
                flow.
              </p>
            </div>
            <p className="bg-background/45 text-muted-foreground rounded-md border border-white/10 px-3 py-2 text-xs">
              JSONPlaceholder-backed
            </p>
          </div>
          <PostList initialCanMutate={Boolean(session)} posts={posts} />
        </section>
      </div>
    </main>
  );
}

function CreatePostForm(props: { initialCanMutate?: boolean }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const canMutate = Boolean(session) || Boolean(props.initialCanMutate);
  const createPost = useMutation({
    mutationFn: (input: CreatePostInput) =>
      submitPostAction({ ...input, intent: "create" }),
    onSuccess: (result) => {
      form.reset();
      toast.success("Post accepted by the demo API");
      const createdPost = result.post;
      if (createdPost) {
        queryClient.setQueryData<Post[]>(POSTS_LIST_QUERY_KEY, (posts = []) => [
          createdPost,
          ...posts,
        ]);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Request failed");
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

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canMutate) {
      toast.error("Sign in through the auth flow to create posts");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const next = CreatePostSchema.parse({
      content: formData.get("content"),
      title: formData.get("title"),
    });
    createPost.mutate(next);
  };

  return (
    <form
      action="/api/posts"
      className="bg-card/80 w-full rounded-md border border-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur"
      method="post"
      onSubmit={submitCreate}
    >
      <input type="hidden" name="intent" value="create" />
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-primary text-xs font-semibold uppercase">
          Auth-gated CRUD
        </p>
        <h2 className="text-foreground text-xl font-semibold">Create a post</h2>
        <p className="text-muted-foreground text-sm">
          Mutations are available only after the shared auth session is active.
        </p>
      </div>
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
      <Button type="submit" disabled={!canMutate || createPost.isPending}>
        {!canMutate
          ? "Sign in to create"
          : createPost.isPending
            ? "Creating..."
            : "Create"}
      </Button>
    </form>
  );
}

function PostList(props: { initialCanMutate?: boolean; posts: Post[] }) {
  const { data: posts } = useQuery({
    queryKey: POSTS_LIST_QUERY_KEY,
    queryFn: () => api.posts.getAll(),
    initialData: props.posts,
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
      {posts.map((post) => (
        <PostCard
          initialCanMutate={Boolean(props.initialCanMutate)}
          key={post.id}
          post={post}
        />
      ))}
    </div>
  );
}

function PostCard(props: { initialCanMutate?: boolean; post: Post }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const canMutate = Boolean(session) || Boolean(props.initialCanMutate);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(props.post.title);
  const [content, setContent] = useState(props.post.content);
  const deletePost = useMutation({
    mutationFn: () => submitPostAction({ intent: "delete", id: props.post.id }),
    onSuccess: (result) => {
      toast.success("Delete accepted by the demo API");
      queryClient.setQueryData<Post[]>(POSTS_LIST_QUERY_KEY, (posts = []) =>
        posts.filter((post) => post.id !== result.id),
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Request failed");
    },
  });
  const updatePost = useMutation({
    mutationFn: (input: UpdatePostInput) =>
      submitPostAction({ ...input, intent: "update" }),
    onSuccess: (result) => {
      setIsEditing(false);
      toast.success("Update accepted by the demo API");
      const updatedPost = result.post;
      if (updatedPost) {
        queryClient.setQueryData<Post[]>(POSTS_LIST_QUERY_KEY, (posts = []) =>
          posts.map((post) =>
            post.id === updatedPost.id ? updatedPost : post,
          ),
        );
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Request failed");
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
    <div className="bg-card/80 flex min-h-48 flex-col rounded-md border border-white/10 p-4 shadow-lg shadow-black/10">
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
            <h2 className="text-foreground mt-1 line-clamp-2 text-lg font-bold">
              {props.post.title}
            </h2>
            <p className="mt-3 line-clamp-4 text-sm">{props.post.content}</p>
          </>
        )}
      </div>
      <div className="mt-4 flex gap-3">
        {!canMutate ? (
          <p className="text-muted-foreground text-xs font-medium">
            Sign in to edit or delete
          </p>
        ) : isEditing ? (
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
        {canMutate ? (
          <Button
            variant="ghost"
            className="text-primary h-8 cursor-pointer px-0 text-xs font-bold uppercase hover:bg-transparent hover:text-white"
            disabled={deletePost.isPending}
            onClick={() => deletePost.mutate()}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="bg-card/70 flex min-h-48 flex-row rounded-md border border-white/10 p-4">
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
