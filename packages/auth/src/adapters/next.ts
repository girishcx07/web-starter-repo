import type { AuthHandlerConfig } from "../server/handlers";
import { createAuthHandlers } from "../server/handlers";

/** Next.js App Router: `export const { GET, POST } = createNextAuthHandlers(() => config)` */
export function createNextAuthHandlers(getConfig: () => AuthHandlerConfig) {
  const run = (req: Request) => createAuthHandlers(getConfig()).handle(req);
  return { GET: run, POST: run };
}
