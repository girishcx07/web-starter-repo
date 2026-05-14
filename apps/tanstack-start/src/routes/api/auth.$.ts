import { createFileRoute } from "@tanstack/react-router";

import { createAuthHandlers } from "@acme/auth/server";

import { getAuthHandlerConfig } from "~/auth/server";

const handle = (request: Request) =>
  createAuthHandlers(getAuthHandlerConfig()).handle(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
