import { createAuthHandlers } from "@acme/auth/server";

import { getAuthHandlerConfig } from "../../auth/server";

function handle(request: Request) {
  return createAuthHandlers(getAuthHandlerConfig()).handle(request);
}

export const loader = ({ request }: { request: Request }) => handle(request);
export const action = ({ request }: { request: Request }) => handle(request);
