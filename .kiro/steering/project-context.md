---
inclusion: always
---

# CatDex — Project Context

## What is CatDex?

A mobile-first PWA where users photograph real stray cats. The app auto-removes backgrounds to create collectible stickers, pins catches on a world map, and files them in a personal CatDex. Think: iNaturalist × Pokémon GO × sticker book, but for stray cats.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript (strict) |
| PWA | Serwist (service worker generation + caching) |
| UI | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| State | Zustand (client) + Server Components (data) |
| Backend | Supabase (Auth + Postgres + RLS) |
| Media | Cloudinary (originals private/signed, stickers public) |
| ML (on-device) | @imgly/background-removal (WASM/WebGPU), Transformers.js, TF.js MobileNet |
| Map | MapLibre GL JS + OpenFreeMap tiles |
| Hosting | Vercel (free tier) |

## Key Architecture Decisions

- **ML runs on-device** — $0 compute, better privacy, works offline
- **Server Components for data** — no client-side fetch waterfalls
- **Phone Frame on desktop** — 420px mobile canvas, no separate desktop layout
- **Cloudinary over Supabase Storage** — better free tier for image transforms
- **MapLibre over Mapbox/Google** — free, no billing surprises

## Directory Structure

```
src/
├── app/
│   ├── (app)/       # Authenticated routes (layout with nav + phone frame)
│   ├── (auth)/      # Sign in / sign up / callback
│   ├── (catch)/     # Camera capture flow (full-screen, no nav)
│   └── api/         # Server endpoints
├── components/      # UI components organized by feature
├── lib/
│   ├── capture/     # ML pipeline modules
│   ├── supabase/    # Server + browser client factories
│   └── *.ts         # Domain logic modules
└── stores/          # Zustand store definitions
```

## Budget Constraints

This project runs on $0. Never suggest paid services. Always prefer:
- Free tiers (Supabase, Vercel, Cloudinary)
- Client-side processing over server compute
- Open-source libraries over proprietary ones

## References

- #[[file:ARCHITECTURE.md]] — detailed system diagram and layer breakdown
- #[[file:PRD.md]] — full product requirements
- #[[file:FEATURES.md]] — complete feature list
