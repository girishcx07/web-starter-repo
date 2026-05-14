import { createNextAuthHandlers } from "@acme/auth";

import { getAuthHandlerConfig } from "~/auth/server";

export const { GET, POST } = createNextAuthHandlers(() =>
  getAuthHandlerConfig(),
);
