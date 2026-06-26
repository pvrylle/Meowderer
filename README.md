# CatDex

A wholesome, mobile-first PWA for catching, collecting, and mapping the stray
cats around you. Photograph a cat, the app turns it into a transparent
collectible sticker on-device, and files it in your personal CatDex.

See [`PRD.md`](PRD.md) and [`TASKS.md`](TASKS.md) for the full product spec.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres + Storage, RLS everywhere)
- Serwist (PWA / service worker)
- Framer Motion, Zustand, Zod
- `@imgly/background-removal` (on-device sticker cutout)

## Getting started

```bash
npm install
npm run dev
```

The app is the repository root, so `npm run dev` works without `cd`-ing into a
subfolder. Open http://localhost:3000.

> Note: `npm run build` uses `--webpack` because Serwist does not yet support
> Turbopack. `npm run dev` uses Turbopack (the service worker is disabled in dev).

## Supabase setup (required for auth + saving cats)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, paste and run
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates the `profiles`, `captures`, `achievements`, and
   `user_achievements` tables (all with RLS), plus the `captures` (private) and
   `stickers` (public) storage buckets and their policies.
3. Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

   Find both under **Project Settings -> API**. The anon key is safe to expose
   in the browser; Row Level Security protects your data.
4. (Optional) Under **Authentication -> Providers**, enable any OAuth providers
   you want; email/password works out of the box.

## Project structure

```
src/
  app/            # routes (App Router)
  components/     # UI + feature components
  lib/
    supabase/     # @supabase/ssr clients (server, browser, middleware)
    capture/      # on-device sticker pipeline
  stores/         # Zustand stores
supabase/
  migrations/     # SQL schema + RLS + storage policies
```
