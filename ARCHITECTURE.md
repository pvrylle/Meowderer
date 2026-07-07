# Architecture

High-level overview of how CatDex is structured and how the pieces fit together.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (PWA)                         │
│                                                             │
│  ┌───────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ React UI  │  │ Zustand      │  │ On-Device ML        │  │
│  │ (App      │  │ Stores       │  │                     │  │
│  │  Router)  │  │              │  │ • bg-removal (WASM) │  │
│  │           │  │ • capture    │  │ • Transformers.js   │  │
│  │           │  │ • map        │  │ • TF.js MobileNet   │  │
│  │           │  │ • offline    │  │                     │  │
│  └─────┬─────┘  └──────┬───────┘  └──────────┬──────────┘  │
│        │               │                      │             │
│  ┌─────┴───────────────┴──────────────────────┴──────────┐  │
│  │              Service Worker (Serwist)                   │  │
│  │  • App shell caching  • ML model caching               │  │
│  │  • Offline queue      • Background sync                │  │
│  └────────────────────────────┬───────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Next.js Server      │
                    │   (Vercel Edge/Node)  │
                    │                       │
                    │  • API Routes         │
                    │  • Server Components  │
                    │  • HF Model Proxy     │
                    └───┬───────────┬───────┘
                        │           │
           ┌────────────┘           └────────────┐
           ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│     Supabase        │              │    Cloudinary        │
│                     │              │                      │
│  • Auth (email +    │              │  • Original photos   │
│    OAuth)           │              │    (private/signed)  │
│  • Postgres (RLS)   │              │  • Sticker PNGs      │
│  • Realtime         │              │    (public delivery) │
│                     │              │                      │
└─────────────────────┘              └─────────────────────┘
```

---

## Layers

### 1. Presentation (React + Next.js App Router)

- **Server Components** render pages with data pre-fetched from Supabase
- **Client Components** handle interactivity (camera, map, animations)
- **Phone Frame** wrapper constrains the UI to 420px on desktop
- **Bottom Nav** provides the primary navigation (Home, CatDex, Catch, Map, Profile)

### 2. Client State (Zustand)

Lightweight stores for ephemeral UI state:
- `capture-store` — pipeline progress, preview state
- `map-store` — viewport, selected pin
- `offline-store` — queued captures waiting for connectivity

### 3. Data Access (Server-only)

All database reads go through `src/lib/` modules marked with `"server-only"`:
- `captures.ts` — CRUD for cat captures
- `missions.ts` — mission/badge progress and XP calculations
- `community.ts` — posts, chat, rescue alerts
- `stray-cats.ts` — stray identity linking and public map data
- `auth.ts` — session management, demo mode detection

### 4. API Routes

Minimal server endpoints for operations that need secrets:
- `POST /api/captures/upload` — signs and uploads photos to Cloudinary
- `POST /api/community/upload` — community image uploads
- `GET /api/ml/hf/[...path]` — proxies Hugging Face model files with auth token

### 5. On-Device ML Pipeline

The core differentiator. Runs entirely in the browser:

```
Camera/Upload
     │
     ▼
Compress (browser-image-compression)
     │
     ▼
Background Removal (@imgly/background-removal, WASM/WebGPU)
     │
     ▼
High-Res Composite (alpha mask upscaled to original)
     │
     ▼
Alpha Refinement (edge cleanup)
     │
     ▼
Sticker Outline (canvas dilation + white stroke + shadow)
     │
     ▼
Final Compress (WebP output)
     │
     ▼
Coat Classification (Transformers.js / MobileNet)
     │
     ▼
Geotag (Geolocation API + reverse geocoding)
     │
     ▼
Upload & Persist
```

Models lazy-load on first use and are cached by the service worker.

### 6. PWA / Service Worker (Serwist)

- Generated at build time (`src/app/sw.ts` → `public/sw.js`)
- Caches the app shell for offline access
- Caches ML model weights after first download
- Queues captures made offline for later sync

### 7. Database (Supabase Postgres)

Row Level Security on every table. Key tables:
- `profiles` — username, avatar, streak, XP, level
- `captures` — one row per photographed cat (photo URLs, geotag, coat, rarity)
- `stray_cats` — unique cat identities linked across captures
- `missions` / `user_missions` — quest definitions and progress
- `badges` / `user_badges` — achievement tiers
- `community_posts` / `chat_messages` / `rescue_alerts` — social features

### 8. Media Storage (Cloudinary)

- Original photos → authenticated (private, signed URLs)
- Sticker PNGs → public delivery for fast rendering in the collection grid and map

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| ML on-device, not server | $0 compute cost, better privacy, works offline |
| Cloudinary over Supabase Storage | Free tier is more generous for transforms; signed URLs for originals |
| Server Components for data | No client-side fetch waterfalls; pages render with data ready |
| Phone Frame on desktop | Consistent mobile-first experience; avoids building two layouts |
| MapLibre over Mapbox/Google | Free, no billing surprises, OSM tiles |
| Serwist over next-pwa | Actively maintained, better Next.js App Router support |
| Zustand over Context | Simpler API, no provider nesting, works outside React tree |

---

## Directory Map

```
src/
├── app/
│   ├── (app)/          # Authenticated app routes (layout with nav + phone frame)
│   │   ├── home/       # Dashboard: collection preview, streaks, daily goal
│   │   ├── catdex/     # Full collection grid with filters
│   │   ├── cat/[id]/   # Cat detail (sticker, map pin, metadata, name polls)
│   │   ├── stray/[id]/ # Stray cat identity page (linked captures)
│   │   ├── map/        # MapLibre world map with GeoJSON pins
│   │   ├── community/  # Posts, chat, rescue alerts
│   │   ├── missions/   # Quests, badges, XP tracker
│   │   ├── profile/    # Stats, achievements overview
│   │   ├── settings/   # Account, preferences, storage usage
│   │   └── help/       # FAQ and support
│   ├── (auth)/         # Sign in / sign up / callback
│   ├── (catch)/        # Camera capture flow (full-screen, no nav)
│   └── api/            # Server endpoints
├── components/
│   ├── capture/        # Camera UI, pipeline progress, sticker reveal
│   ├── community/      # Posts, chat, alerts components
│   ├── home/           # Home page sections (streaks, paws-in-area)
│   ├── map/            # MapLibre wrapper, markers, popups
│   ├── missions/       # Mission cards, badge grid, XP bar
│   ├── pwa/            # Install prompt, offline indicators
│   └── ui/             # shadcn/ui primitives + custom components
├── lib/
│   ├── capture/        # ML pipeline modules (bg-removal, outline, etc.)
│   ├── supabase/       # Server + browser client factories
│   └── *.ts            # Domain logic (missions, community, auth, map, etc.)
└── stores/             # Zustand store definitions
```
