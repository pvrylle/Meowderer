---
inclusion: fileMatch
fileMatchPattern: "**/lib/supabase/**,**/supabase/**,**/*supabase*"
---

# Supabase Guidelines

## Client Setup

- **Server client** — use `createServerClient` from `@supabase/ssr` in Server Components and Server Actions
- **Browser client** — use `createBrowserClient` from `@supabase/ssr` in Client Components
- Client factories live in `src/lib/supabase/` — always import from there, never instantiate directly

## Row Level Security (RLS)

- Every table has RLS enabled — queries are automatically scoped to the authenticated user
- Never use the `service_role` key in client-accessible code
- When writing new queries, ensure the table's RLS policy covers the operation (SELECT, INSERT, UPDATE, DELETE)

## Auth

- Auth uses Supabase Auth with email/password + OAuth providers
- Session management via `@supabase/ssr` middleware pattern
- Demo mode uses a special demo user — check for it via the `is_demo` flag on profiles
- Auth callback route handles OAuth redirects at `(auth)/callback/`

## Database Conventions

- Use `gen_random_uuid()` for primary keys
- Timestamps use `timestamptz` with `default now()`
- Foreign keys reference `auth.users(id)` for user ownership
- Keep queries in `src/lib/*.ts` files marked with `"server-only"` import

## Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Username, avatar, streak, XP, level |
| `captures` | One row per photographed cat (photo URLs, geotag, coat, rarity) |
| `stray_cats` | Unique cat identities linked across captures |
| `missions` / `user_missions` | Quest definitions and user progress |
| `badges` / `user_badges` | Achievement tiers and unlocks |
| `community_posts` / `chat_messages` / `rescue_alerts` | Social features |

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — project URL (safe for client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (safe for client, RLS protects data)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to client

## Storage

- Original photos → Cloudinary (private/signed URLs), NOT Supabase Storage
- Sticker PNGs → Cloudinary (public delivery)
- Supabase Storage is not used in this project (Cloudinary's free tier is more generous)
