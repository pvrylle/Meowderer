# CatDex — Task Breakdown

> Companion to `PRD.md`. Checklists are ordered to build the app the cheapest, fastest way.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Foundation

**Goal:** an installable, themed PWA shell with working accounts.

### 0.1 Project setup
- [x] Init Next.js 15 (App Router) + React 19 + TypeScript (strict).
- [x] Add Tailwind CSS + shadcn/ui.
- [x] Add Framer Motion + Zustand.
- [x] Configure ESLint/Prettier; set `strict: true` in `tsconfig.json`.
- [x] Set up `.env.local` (Supabase URL + anon key) and `.env.example` (no secrets committed).

### 0.2 Design system
- [x] Add color tokens from PRD §7 to Tailwind theme (`--bg`, `--primary`, etc.).
- [x] Pick + load a free rounded Google Font (e.g., Nunito/Quicksand).
- [x] Build base components: Button, Input, Card, Pager dots, PhoneFrame (desktop bezel wrapper).
- [x] Global layout that locks app to mobile-width canvas; phone frame on large screens.

### 0.3 PWA
- [x] Add Serwist service worker + `manifest.json` (name, icons, theme color `#9B7EDE`).
- [x] Generate app icons (AI-made mascot, multiple sizes) + splash.
- [x] Verify "Add to Home Screen" + offline app shell.

### 0.4 Supabase + auth
- [x] Create Supabase project; add `profiles` table + RLS.
- [x] Wire `@supabase/ssr` client (server uses `getUser()`, never `getSession()`).
- [x] Build **Auth screen** from `public/onboarding/Background.svg` (email/password + OAuth).
- [x] Sign up / sign in / sign out flows; create `profiles` row on first login.
- [x] Protected routes via layout/page `getUser()` (not middleware).

### 0.5 Onboarding
- [x] Build 3-slide onboarding carousel from `Background-1/2/3.svg` (icon + pager + CTA).
- [x] Persist "seen onboarding" flag; route new users → onboarding → auth → home.

**P0 done when:** user can install the PWA, complete onboarding, sign up/in, and land on Home.

---

## Phase 1 — Capture core (MVP)

**Goal:** the full spot → snap → sticker → collect loop.

### 1.1 Capture entry
- [x] Home screen with prominent **Catch** button (FAB).
- [x] Camera capture (`getUserMedia`) + fallback `<input type="file" capture>`.
- [x] Photo preview with retake/confirm.

### 1.2 On-device sticker pipeline
- [x] Integrate `@imgly/background-removal` (lazy-load model, cache via SW).
- [x] "Developing…" loading state with progress.
- [x] Canvas step: alpha dilation + white outline → sticker look.
- [x] Compress output with `browser-image-compression` (cap resolution).
- [x] Animated **sticker reveal** (Framer Motion).

### 1.3 Save flow
- [x] Optional nickname input + (placeholder) coat/rarity fields.
- [x] Upload original → `captures` bucket (private); sticker → `stickers` bucket.
- [x] Insert `captures` row (with `user_id`, urls, `caught_at`).
- [x] Optional GPS: read Geolocation when toggle is ON; store lat/lng.

### 1.4 CatDex + detail
- [x] CatDex grid of stickers (newest first).
- [x] Cat detail page: big sticker, metadata, rename.
- [x] Empty state (mascot art) when no cats yet.

**P1 done when:** the MVP ship gate in PRD §15 is met.

---

## Phase 2 — Map & meta

**Goal:** location, classification, and collection meta-game.

### 2.1 Map
- [x] MapLibre GL + OpenFreeMap tiles.
- [x] Render catch pins from `captures` (where lat/lng present).
- [x] Tap pin → cat detail; cluster pins when zoomed out.
- [x] GPS toggle in UI + Settings.
- [x] Wireframe layer tabs: All · Cats · Shelters · Vets.
- [x] Overpass POI layers (shelters + vets).
- [x] User location dot (GeolocateControl).

### 2.2 Geocoding
- [x] Reverse-geocode lat/lng → city/country (Nominatim/Photon).
- [x] Debounce + cache results per coordinate; store on `captures`.

### 2.3 Classification & rarity
- [x] Transformers.js coat classifier (lazy-load + cache).
- [x] Map coat → rarity tier (PRD §9); store `coat_type` + `rarity`.
- [x] Show rarity badge on stickers + filters in CatDex (coat/rarity/region).

### 2.4 Profile & achievements
- [x] Profile stats: total cats · countries · cities · coat types.
- [x] `achievements` catalog + `user_achievements`; unlock logic.
- [x] Achievement toasts/celebration.

**P2 done when:** map shows catches, coats auto-classify with rarity, and profile stats/achievements work.

---

## Wireframe gap — CatDex UI (Phase 2 extension)

- [x] Collection progress header (X/Y coats, progress bar).
- [x] Status filter tabs: All · Photographed · Geotagged · Rare+.
- [x] Rich grid cards: personality title + charm rating.
- [x] Legendary styling for epic tier.
- [x] "Keep exploring" / "Not discovered" placeholder slots.

---

## Wireframe gap — Missions & Badges (Phase 3)

- [x] Supabase migration: `missions`, `user_missions`, `badges`, `user_badges`, profile XP/level.
- [x] `/missions` route with Missions | Badges tabs.
- [x] Quest cards with progress bars, XP pills, Claim Reward.
- [x] Leveled badges grid with progress bars.
- [x] Mission progress synced after each capture save.

---

## Wireframe gap — Community (Phase 4)

- [x] Supabase migration: `posts`, `post_likes`, `post_comments`, `rescue_alerts`, `chat_messages`.
- [x] `/community` route with Feed | Chat tabs.
- [x] Rescue Alerts + Shelters summary cards.
- [x] Create posts, like posts, send chat messages.

---

## Community Depth (Phase 5)

- [x] Photo posts + `post-images` storage bucket.
- [x] Comment threads (bottom sheet).
- [x] Live chat via Supabase Realtime + unread badges.
- [x] Rescue alerts create/list + live shelter count.
- [x] Avatars on feed/chat + upload in Settings.

---

## Phase 6 — Retention & ship readiness

- [x] Offline capture queue sync (drain on reconnect + Settings “Sync now”).
- [x] Streaks + daily catch goal on Home.
- [x] Community missions: visit shelter, verify rescue report.
- [x] CatDex Helped / Rescued filter tabs.
- [x] `/maps` → `/map` redirect in dev proxy.
- [x] Accessibility pass (comments sheet, nav tap targets).
- [ ] Lighthouse PWA score audit (run locally before release).
- [ ] Test on a real phone (camera + GPS + install + offline sync) regularly.

**Real-device QA checklist (before release):**
- [ ] Install PWA to home screen (iOS + Android).
- [ ] Catch flow: camera, bg removal, save with GPS on/off.
- [ ] Offline catch → airplane mode save → reconnect → auto-sync.
- [ ] Map: Shelters layer + shelter check-in toast within 200 m.
- [ ] Community: post photo, comment, live chat, resolve alert.
- [ ] Missions: claim reward after shelter visit / verify rescue.

---

## Phase 3 — Polish

**Goal:** make it shine and resilient.

- [x] "Is this a cat?" guard before processing (reject junk photos).
- [x] AI-made UI art pass (mascot via `icon.svg` in empty states).
- [x] Streaks / daily catch goal.
- [x] "Share your sticker" card export (image) — with location rounding/privacy.
- [x] Offline capture queue (IndexedDB; saves when offline).
- [x] Offline queue sync when back online.
- [x] Storage usage meter in Settings; cleanup tools (estimate).
- [ ] Accessibility + performance pass (Lighthouse PWA score).

---

## Cross-cutting / always-on

- [x] Keep all deps free + license-checked (no Mapbox/Google billing).
- [x] RLS on every table; private bucket for originals; no secrets in client.
- [x] Validate inputs (Zod) on any server action.
- [ ] Test on a real phone (camera + GPS + install) regularly.
