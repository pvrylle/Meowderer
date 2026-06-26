# CatDex — Task Breakdown

> Companion to `PRD.md`. Checklists are ordered to build the app the cheapest, fastest way.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Foundation

**Goal:** an installable, themed PWA shell with working accounts.

### 0.1 Project setup
- [ ] Init Next.js 15 (App Router) + React 19 + TypeScript (strict).
- [ ] Add Tailwind CSS + shadcn/ui.
- [ ] Add Framer Motion + Zustand.
- [ ] Configure ESLint/Prettier; set `strict: true` in `tsconfig.json`.
- [ ] Set up `.env.local` (Supabase URL + anon key) and `.env.example` (no secrets committed).

### 0.2 Design system
- [ ] Add color tokens from PRD §7 to Tailwind theme (`--bg`, `--primary`, etc.).
- [ ] Pick + load a free rounded Google Font (e.g., Nunito/Quicksand).
- [ ] Build base components: Button, Input, Card, Pager dots, PhoneFrame (desktop bezel wrapper).
- [ ] Global layout that locks app to mobile-width canvas; phone frame on large screens.

### 0.3 PWA
- [ ] Add Serwist service worker + `manifest.json` (name, icons, theme color `#9B7EDE`).
- [ ] Generate app icons (AI-made mascot, multiple sizes) + splash.
- [ ] Verify "Add to Home Screen" + offline app shell.

### 0.4 Supabase + auth
- [ ] Create Supabase project; add `profiles` table + RLS.
- [ ] Wire `@supabase/ssr` client (server uses `getUser()`, never `getSession()`).
- [ ] Build **Auth screen** from `public/onboarding/Background.svg` (email/password + OAuth).
- [ ] Sign up / sign in / sign out flows; create `profiles` row on first login.
- [ ] Protected routes via layout/page `getUser()` (not middleware).

### 0.5 Onboarding
- [ ] Build 3-slide onboarding carousel from `Background-1/2/3.svg` (icon + pager + CTA).
- [ ] Persist "seen onboarding" flag; route new users → onboarding → auth → home.

**P0 done when:** user can install the PWA, complete onboarding, sign up/in, and land on Home.

---

## Phase 1 — Capture core (MVP)

**Goal:** the full spot → snap → sticker → collect loop.

### 1.1 Capture entry
- [ ] Home screen with prominent **Catch** button (FAB).
- [ ] Camera capture (`getUserMedia`) + fallback `<input type="file" capture>`.
- [ ] Photo preview with retake/confirm.

### 1.2 On-device sticker pipeline
- [ ] Integrate `@imgly/background-removal` (lazy-load model, cache via SW).
- [ ] "Developing…" loading state with progress.
- [ ] Canvas step: alpha dilation + white outline → sticker look.
- [ ] Compress output with `browser-image-compression` (cap resolution).
- [ ] Animated **sticker reveal** (Framer Motion).

### 1.3 Save flow
- [ ] Optional nickname input + (placeholder) coat/rarity fields.
- [ ] Upload original → `captures` bucket (private); sticker → `stickers` bucket.
- [ ] Insert `captures` row (with `user_id`, urls, `caught_at`).
- [ ] Optional GPS: read Geolocation when toggle is ON; store lat/lng.

### 1.4 CatDex + detail
- [ ] CatDex grid of stickers (newest first).
- [ ] Cat detail page: big sticker, metadata, rename.
- [ ] Empty state (AI mascot art) when no cats yet.

**P1 done when:** the MVP ship gate in PRD §15 is met.

---

## Phase 2 — Map & meta

**Goal:** location, classification, and collection meta-game.

### 2.1 Map
- [ ] MapLibre GL + OpenFreeMap tiles.
- [ ] Render catch pins from `captures` (where lat/lng present).
- [ ] Tap pin → cat detail; cluster pins when zoomed out.
- [ ] GPS toggle in UI + Settings.

### 2.2 Geocoding
- [ ] Reverse-geocode lat/lng → city/country (Nominatim/Photon).
- [ ] Debounce + cache results per coordinate; store on `captures`.

### 2.3 Classification & rarity
- [ ] Transformers.js coat classifier (lazy-load + cache).
- [ ] Map coat → rarity tier (PRD §9); store `coat_type` + `rarity`.
- [ ] Show rarity badge on stickers + filters in CatDex (coat/rarity/region).

### 2.4 Profile & achievements
- [ ] Profile stats: total cats · countries · cities · coat types.
- [ ] `achievements` catalog + `user_achievements`; unlock logic.
- [ ] Achievement toasts/celebration.

**P2 done when:** map shows catches, coats auto-classify with rarity, and profile stats/achievements work.

---

## Phase 3 — Polish

**Goal:** make it shine and resilient.

- [ ] "Is this a cat?" guard before processing (reject junk photos).
- [ ] AI-made UI art pass (mascot, illustrations, empty states, icons).
- [ ] Streaks / daily catch goal.
- [ ] "Share your sticker" card export (image) — with location rounding/privacy.
- [ ] Offline capture queue (save locally, sync when online).
- [ ] Storage usage meter in Settings; cleanup tools.
- [ ] Accessibility + performance pass (Lighthouse PWA score).

---

## Cross-cutting / always-on

- [ ] Keep all deps free + license-checked (no Mapbox/Google billing).
- [ ] RLS on every table; private bucket for originals; no secrets in client.
- [ ] Validate inputs (Zod) on any server action.
- [ ] Test on a real phone (camera + GPS + install) regularly.
