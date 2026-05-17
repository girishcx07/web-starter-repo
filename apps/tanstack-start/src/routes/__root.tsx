/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import type * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AuthProvider } from "@acme/auth/react";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import appCss from "~/styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-screen bg-[radial-gradient(circle_at_20%_0%,oklch(0.34_0.025_248/.24),transparent_30rem),radial-gradient(circle_at_80%_10%,oklch(0.30_0.045_162/.16),transparent_26rem),linear-gradient(135deg,oklch(0.10_0.012_248),oklch(0.16_0.012_248)_48%,oklch(0.09_0.01_248))] font-sans antialiased">
        <ThemeProvider>
          {children}
          <div className="absolute right-4 bottom-12">
            <ThemeToggle />
          </div>
          <Toaster />
          <TanStackRouterDevtools position="bottom-right" />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
