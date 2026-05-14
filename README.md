# Web Monorepo

This repo is a web-only Turborepo workspace with three demo apps sharing the
same native-first architecture:

- `apps/nextjs`: Next.js App Router with RSC reads and server action mutations.
- `apps/tanstack-start`: TanStack Start with SSR query prefetch and client mutations.
- `apps/react-router`: React Router v7 with SSR loaders and route actions.

The apps use shared internal packages instead of full-stack framework coupling:

- `@acme/caller`: typed fetch caller with JSON defaults and explicit non-JSON modes.
- `@acme/api`: lightweight RPC-like API client, backed by `@acme/caller`.
- `@acme/auth`: native session helpers, React provider, server verification, and bearer-token support.
- `@acme/types`, `@acme/utils`, `@acme/ui`: shared types, utilities, and UI.
- `tooling/*`: shared ESLint, TypeScript, Tailwind, and Prettier config layers.

## Environment

Copy `.env.example` to `.env` and point the apps at your external backend:

```bash
cp .env.example .env
```

Required API URL variables:

- `API_URL`: server-side backend base URL.
- `VITE_PUBLIC_API_URL`: browser backend base URL for Vite-based apps.
- `NEXT_PUBLIC_API_URL`: browser backend base URL for Next.js.

Optional local auth demo variables:

- `AUTH_SECRET`
- `AUTH_DEMO_EMAIL`
- `AUTH_DEMO_PASSWORD`
- `AUTH_DEMO_NAME`

## Development

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

## Architecture Notes

The frontend apps are web-only and talk to a separate backend API through
`@acme/caller`. The caller defaults to JSON bodies and JSON responses, while
allowing explicit `responseType` overrides for text, blobs, array buffers,
form data, raw `Response`, and no-content responses.

`@acme/api` exposes typed methods such as `api.posts.getAll()` and
`api.posts.create()`. Feature routers validate inputs and outputs locally with
shared schemas and can be extended with small middleware functions for guards,
error wrapping, and response transforms.

`@acme/auth` provides `AuthProvider`, `useAuth()`, `getClientSession()`,
`getServerSession()`, `verifySession()`, and `requireAuth()`. Session cookies
and bearer tokens are both supported; backend services can verify bearer tokens
through the provided verifier hook.

Tooling stays centralized. App and package configs should extend the layers in
`tooling/*` and only add local framework-specific keys.
