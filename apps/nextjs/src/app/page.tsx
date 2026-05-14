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
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-2xl text-center">
          <p className="text-muted-foreground text-sm font-medium">
            Next.js App Router demo
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Open API posts
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            RSC fetches JSONPlaceholder through the typed API client, Suspense
            streams the hydrated list, and client interactions call server
            actions for mutations.
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <SharedPackagesDemo framework="nextjs" />
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
            <PostsRsc />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
