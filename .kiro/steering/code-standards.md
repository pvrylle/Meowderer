---
inclusion: always
---

# Code Standards & Conventions

## TypeScript

- Strict mode enabled — no `any` types unless absolutely unavoidable (mark with `// eslint-disable-next-line` and explain why)
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use Zod for runtime validation of external data (API responses, form inputs, URL params)
- Explicit return types on exported functions

## React & Next.js

- **Server Components by default** — only add `"use client"` when the component needs interactivity, browser APIs, or hooks
- Data fetching happens in Server Components or Server Actions — never in client components via `useEffect`
- Use Next.js App Router conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Route groups `(app)`, `(auth)`, `(catch)` organize layouts without affecting URLs
- Server Actions for mutations (form submissions, data writes)

## Component Patterns

- shadcn/ui as the base component library — don't reinvent primitives
- Framer Motion for animations (sticker reveals, transitions)
- Lucide React for icons
- Components organized by feature in `src/components/<feature>/`
- Shared UI primitives in `src/components/ui/`

## Styling

- Tailwind CSS 4 — utility-first, no custom CSS unless absolutely necessary
- Design tokens: cream background (`#FDFAF4`), purple primary (`#9B7EDE`), green accent (`#8FD6A6`), orange accent (`#F6A96B`)
- Large radii: cards/inputs ~16px, buttons/pills ~28px
- Mobile-first: design for 420px width, phone frame wraps on desktop

## State Management

- **Zustand** for client-side ephemeral state (capture pipeline, map viewport, offline queue)
- **Server state** via Server Components — no client-side data fetching libraries needed for reads
- Keep stores minimal — don't duplicate server state in Zustand

## Data Access

- All database queries live in `src/lib/` modules marked with `"server-only"`
- Never import Supabase server client in client components
- Always use RLS — queries scoped to authenticated user
- Cloudinary uploads go through API routes (secrets stay server-side)

## File Naming

- `kebab-case` for all files and folders
- React components: `kebab-case.tsx` (e.g., `cat-profile-tabs.tsx`)
- Utilities/lib: `kebab-case.ts`
- Server Actions: `actions.ts` co-located with the page that uses them

## Error Handling

- Use `error.tsx` boundaries for page-level errors
- `sonner` for toast notifications on user actions
- Graceful degradation when ML models fail to load (show retry, don't crash)
- Offline-first: queue operations when no network, sync later

## Performance

- Lazy-load ML models (not on first page visit)
- Use `loading.tsx` skeletons for async pages
- Compress images before upload (browser-image-compression)
- Service worker caches app shell + ML model weights
