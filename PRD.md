# CatDex — Product Requirements Document (PRD)

> **Status:** v1 (Concept Lock) · **Owner:** Solo dev (vibe-coder) · **Budget:** $0 — free / open-source only

---

## 1. One-liner

A wholesome, mobile-first **PWA** where you photograph real stray cats. The app auto-cuts each
photo into a collectible **sticker**, pins it on a world map, and files it in your personal
**CatDex** — collect across coats, cities, and countries.

Think: **iNaturalist × Pokémon GO × sticker book**, but for stray cats. No fighting. Just finding,
catching (photographing), and collecting.

---

## 2. Goals & Non-goals

### Goals
- Ship an installable, mobile-first PWA that feels great on phones and is usable on desktop
  (rendered inside a centered "big phone" frame).
- Make the core loop — **spot → snap → sticker → collect** — delightful and fast.
- Run on a strict **$0 / open-source** budget.
- Cloud-saved accounts so a user's CatDex follows them across devices.

### Non-goals (for v1)
- No combat / battles / leveling.
- No real-money purchases, ads, or monetization.
- No social graph (friends, trading, leaderboards) — deferred to a later phase.
- No native app store builds — PWA only.

---

## 3. Target user & platform

- **Primary:** mobile web (Android/iOS) via PWA, installed to home screen.
- **Secondary:** desktop browsers — app is locked to a mobile-width canvas inside a phone frame.
- **Audience:** casual players, cat lovers, people who walk around cities and notice strays.

---

## 4. Core gameplay loop

1. User is out and spots a real stray cat.
2. Opens CatDex → taps **Catch**.
3. Snaps a photo (or uploads one).
4. App removes the background **on-device** → produces a transparent **sticker PNG**.
5. App auto-classifies the coat → assigns **type + rarity**.
6. If GPS is ON, the catch is geotagged (map pin + reverse-geocoded city/country).
7. User names the cat (optional) → saves.
8. Sticker is added to the **CatDex**; stats/achievements update.

**Every photo = a new entry.** No duplicate detection. Re-catching the same alley cat is fine and
rewarded.

---

## 5. Confirmed product decisions

| Decision | Choice |
|---|---|
| Map | **Real GPS**, user-togglable on/off |
| Gameplay depth | **Collection-first** (no combat) |
| Collectibles | **Real user photos** turned into stickers |
| AI-generated art | **System/UI art only** (icons, onboarding, empty states, mascot) — not gameplay entries |
| Background removal | **On-device / in-browser** (free, private) |
| Rarity | **Auto-classified** from coat color/pattern |
| Duplicates | **Every photo = new entry** |
| Accounts | **Yes** — accounts + cloud save, single-player |
| Social | **Deferred** |

---

## 6. Tech stack (100% free / open-source)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript (strict)** | Matches house rules |
| PWA | **Serwist** | Installable, offline, caches ML models |
| UI | **Tailwind CSS + shadcn/ui** | Pastel/rounded design system |
| Animation | **Framer Motion** | Sticker-reveal "juice" |
| State | **Zustand** | Lightweight client state |
| Data fetching | **TanStack Query** (optional) | Cache + sync |
| Backend | **Supabase** (free tier) | Auth + Postgres + Storage + RLS |
| Background removal | **`@imgly/background-removal`** | WASM/WebGPU, commercial-friendly license |
| Classification | **Transformers.js (Xenova)** | Coat type + "is this a cat?" guard |
| Map | **MapLibre GL JS** + **OpenFreeMap** tiles | No Mapbox/Google billing |
| Geocoding | **Nominatim / Photon** (OSM) | Free; respect rate limits + attribution |
| Hosting | **Vercel** (free) | $0 deploys |
| AI art (UI only) | Any free image gen | Mascot, icons, illustrations |

**Hard budget rules**
- Use **MapLibre**, never Mapbox/Google Maps (they bill).
- Background removal + classification run **client-side** (no server compute bill, better privacy).

---

## 7. Design system

Extracted from the existing Figma wireframes in `public/onboarding/`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FDFAF4` | App canvas (cream) |
| `--primary` | `#9B7EDE` | Buttons, active states (purple) |
| `--primary-light` | `#D9CCF6` | Light purple accents |
| `--green` | `#8FD6A6` | Accent / success |
| `--orange` | `#F6A96B` | Accent / rare |
| `--muted` | `#A8A2B8` | Secondary text/icons |
| `--border` | `#EFE4CF` | Card/input borders |

- **Style:** soft, rounded, pastel, friendly.
- **Radii:** large (cards/inputs `~16px`, buttons/pills `~28px`).
- **Frame:** mobile-first 420px-wide canvas; on desktop, center it inside a phone bezel on a soft bg.
- **Typography:** clean, rounded sans (e.g., Nunito/Quicksand or similar free Google Font).

---

## 8. Screens

| # | Screen | Source | Notes |
|---|---|---|---|
| 1 | Onboarding carousel (3 slides) | `Background-1/2/3.svg` | Icon + pager + CTA; colors green/purple/orange |
| 2 | Auth (sign in / sign up) | `Background.svg` | Email + password + social (Supabase) |
| 3 | Home / Map | new | MapLibre, catch pins, GPS toggle, **Catch** FAB |
| 4 | Capture flow | new | camera → preview → "developing…" → sticker reveal → name/tag → save |
| 5 | CatDex grid | new | Sticker grid; filters by coat / rarity / region |
| 6 | Cat detail | new | Sticker, mini-map, metadata, rename |
| 7 | Profile | new | Stats (total · countries · cities · coat types) + achievements |
| 8 | Settings | new | GPS toggle, account, storage usage |

---

## 9. Rarity model (v1 — tune later)

Coat detected on-device → mapped to a rarity tier:

| Tier | Example coats |
|---|---|
| Common | black, white, gray, gray tabby |
| Uncommon | orange/ginger, brown tabby, bicolor/tuxedo |
| Rare | calico, tortoiseshell, pointed (Siamese-like) |
| Epic | rare combos, or a **first catch in a new country/city** bonus |

Rarity influences CatDex badges and achievement progress. No power/stats since there's no combat.

---

## 10. Data model (Supabase / Postgres)

> All tables have **RLS enabled**; users can only read/write their own rows.

```sql
-- profiles
profiles (
  id uuid pk references auth.users,
  username text unique,
  avatar_url text,
  created_at timestamptz default now()
)

-- captures (one row per photographed cat)
captures (
  id uuid pk default gen_random_uuid(),
  user_id uuid references auth.users not null,
  photo_url text not null,        -- original (private bucket)
  sticker_url text not null,      -- transparent PNG (stickers bucket)
  lat double precision,           -- null if GPS off
  lng double precision,
  city text,
  country text,
  coat_type text,                 -- classifier output
  rarity text,                    -- common|uncommon|rare|epic
  nickname text,
  caught_at timestamptz default now()
)

-- achievements (static catalog) + user_achievements (unlocks)
achievements ( id text pk, title text, description text, icon text )
user_achievements ( user_id uuid, achievement_id text, unlocked_at timestamptz )
```

**Storage buckets**
- `captures` — original photos, **private** (RLS / signed URLs only).
- `stickers` — transparent PNGs, served via signed/public URL.

---

## 11. Capture → sticker pipeline (the heart of the app)

| Step | Tool | Output |
|---|---|---|
| Capture | `getUserMedia` / `<input type="file" capture>` | raw image |
| Guard (optional) | Transformers.js classifier | reject non-cat photos |
| Background removal | `@imgly/background-removal` | transparent PNG |
| Sticker outline | HTML Canvas (alpha dilation + white stroke) | sticker-style PNG |
| Compress | `browser-image-compression` | size-capped PNG/WebP |
| Coat classify | Transformers.js | coat type → rarity |
| Geotag (if ON) | Geolocation API + Nominatim/Photon | lat/lng + city/country |
| Persist | Supabase Storage + `captures` insert | saved entry |

All ML runs **client-side**; models lazy-load once and are cached by the service worker.

---

## 12. Non-functional requirements

- **Performance:** first meaningful paint fast; ML models lazy-loaded (not on first visit).
- **Offline:** app shell works offline; captures can be **queued** and synced when back online (P3).
- **Privacy/Security:**
  - No secrets in client code; Supabase keys via env (anon key public is fine; service key server-only).
  - RLS on every table; private bucket for originals.
  - Geotagged photos are sensitive → **private by default**; round/blur location before any sharing.
- **Accessibility:** sufficient contrast, large tap targets, labelled controls.
- **Budget:** stays within Supabase free tier (1GB storage) — compress + cap resolution; show usage.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Free storage (1GB) fills fast | Compress stickers, cap resolution, storage meter in Settings |
| ML model download size | Lazy-load + service-worker cache (one-time) |
| Geocoder rate limits (Nominatim 1 req/s) | Debounce + cache per coordinate |
| Geotag privacy | Private by default; location rounding before any future share |
| Background-removal accuracy on messy photos | Allow manual re-crop / retry; "is this a cat?" guard |
| No combat → shallow loop | Depth via geography, coat variety, achievements, streaks |

---

## 14. Roadmap (phased)

- **P0 — Foundation:** PWA shell + theme, Supabase auth, onboarding carousel, profile + cloud save.
- **P1 — Capture core (MVP):** camera/upload → on-device bg removal → sticker → save (+optional GPS)
  → CatDex grid + detail. *Shipping this = a real, playable game.*
- **P2 — Map & meta:** MapLibre catch-map, reverse-geocode city/country, coat auto-classify, rarity,
  achievements.
- **P3 — Polish:** AI-made UI art pass, streaks/daily, "share your sticker" card, offline capture
  queue, junk-photo guard.

See `TASKS.md` for the detailed task breakdown.

---

## 15. Definition of MVP (ship gate)

A user can:
1. Onboard + create an account (cloud save).
2. Take/upload a cat photo and get a clean **sticker** back, on-device.
3. Save it to their **CatDex** (with optional GPS location).
4. Browse their collection grid and open a cat's detail page.

Everything beyond that (map view, rarity, achievements, polish) is P2+.
