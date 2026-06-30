# Meowderer

A wholesome, mobile-first PWA for catching, collecting, and mapping the stray
cats around you. Photograph a cat, the app turns it into a transparent
collectible sticker on-device, and files it in your personal collection.

See [`PRD.md`](PRD.md) and [`TASKS.md`](TASKS.md) for the full product spec.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres, RLS everywhere)
- Cloudinary (cat photo + sticker hosting)
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
2. In the project's **SQL Editor**, paste and run these migrations in order:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — tables, RLS, storage
   - [`supabase/migrations/0002_achievements_seed.sql`](supabase/migrations/0002_achievements_seed.sql) — achievement catalog
3. Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

   Find both under **Project Settings -> API**. The anon key is safe to expose
   in the browser; Row Level Security protects your data.
4. (Optional) Under **Authentication -> Providers**, enable any OAuth providers
   you want; email/password works out of the box.

## Cloudinary setup (required for photo uploads)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the **Dashboard**, copy your **Cloud name**, **API Key**, and **API Secret**.
3. Add them to `.env.local`:

   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>
   CLOUDINARY_API_KEY=<api-key>
   CLOUDINARY_API_SECRET=<api-secret>
   ```

   Only the cloud name is public. The API key and secret stay server-side and
   are used by `/api/captures/upload` — never expose the secret in client code.

   Original photos upload as **authenticated** assets (private). Stickers are
   public delivery URLs used in Meowderer and the map.

## Deploy to Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js** (uses `npm run build`, which runs webpack for Serwist).
3. Set **Node.js 20** or newer in Project Settings → General.
4. Add every variable from [`.env.example`](.env.example) under Environment Variables.
5. In Supabase → **Authentication → URL Configuration**:
   - **Site URL:** `https://<your-vercel-domain>`
   - **Redirect URLs:** `https://<your-vercel-domain>/auth/callback`
6. Deploy. The service worker (`public/sw.js`) is generated at build time; do not commit it.

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
