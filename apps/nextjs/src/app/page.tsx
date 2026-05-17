import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { POSTS_LIST_QUERY_KEY } from "@acme/api";

import { api } from "~/api";
import { createQueryClient } from "~/lib/query-client";
import { AuthShowcase } from "./_components/auth-showcase";
import {
  CreatePostForm,
  PostCardSkeleton,
  PostList,
} from "./_components/posts";
import { SharedPackagesDemo } from "./_components/shared-packages-demo";

async function PostsRsc() {
  const queryClient = createQueryClient();
  await queryClient.prefetchQuery({
    queryKey: POSTS_LIST_QUERY_KEY,
    queryFn: () => api.posts.getAll(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}

export default function HomePage() {
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
                Next.js App Router running on localhost:3000
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
          <SharedPackagesDemo framework="nextjs" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <AuthShowcase />
          <CreatePostForm />
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
          <Suspense
            fallback={
              <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <PostsRsc />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
