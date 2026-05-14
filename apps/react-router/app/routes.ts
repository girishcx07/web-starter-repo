import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/auth/*", "routes/api/auth.$.ts"),
  route("api/posts", "routes/api/posts.ts"),
] satisfies RouteConfig;
