# Agent notes

Internal workspace app on **TanStack Start + Supabase**, deployed to **Vercel**.

## Conventions

- Package manager: **npm**. Runtime: Node.js 20+.
- Path alias `@/` → `src/`.
- File-based routes in `src/routes`; authenticated routes live under
  `src/routes/_authenticated` (guarded in `_authenticated/route.tsx`).
- Supabase clients: `@/integrations/supabase/client` (browser, RLS) and
  `@/integrations/supabase/client.server` (service role, server-only — never
  import from route/client code).
- Server-function auth flows through the middleware in `src/start.ts`.

## Backend

- Schema and RLS are SQL migrations in `drizzle/migrations`; apply with
  `npx drizzle-kit migrate` against `DATABASE_URL`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client (no `VITE_` prefix).

## Do not

- Commit `.env` or any secret. Only `.env.example` is tracked.
