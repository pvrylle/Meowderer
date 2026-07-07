---
inclusion: fileMatch
fileMatchPattern: "**/sw.ts,**/sw.js,**/serwist*,**/manifest.json,**/*offline*,**/*service-worker*"
---

# PWA & Service Worker Guidelines

## Setup

- **Serwist** (`@serwist/next`) generates the service worker at build time
- Source: `src/app/sw.ts` → Output: `public/sw.js`
- Manifest: `public/manifest.json`

## Caching Strategy

| Resource | Strategy | Notes |
|----------|----------|-------|
| App shell (HTML, JS, CSS) | Precache (build-time) | Instant offline load |
| ML model weights | Runtime cache (CacheFirst) | One-time download, persist forever |
| API responses | NetworkFirst | Fresh data when online, stale when offline |
| Images (stickers) | CacheFirst | Already optimized, no need to re-fetch |
| Map tiles | CacheFirst with expiry | Cache recent areas for offline viewing |

## Offline Capabilities

- App shell works fully offline after first visit
- Captures made offline are queued in IndexedDB via the Zustand `offline-store`
- Background sync uploads queued captures when connectivity returns
- Show clear offline indicators in the UI (use `src/components/pwa/`)

## Configuration

- Serwist config lives in `next.config.ts` (the `withSerwist` wrapper)
- Don't commit the generated `public/sw.js` — it's in `.gitignore`
- `public/sw.js.map` is also gitignored

## Install Prompt

- Custom install prompt component in `src/components/pwa/`
- Detect `beforeinstallprompt` event and show native-feeling install UI
- Show different prompts for iOS (Add to Home Screen instructions) vs Android (native prompt)

## Best Practices

- Never cache secrets or auth tokens in the service worker
- Version the cache names to bust stale caches on deploy
- Test offline behavior by disabling network in DevTools
- ML model cache should survive app updates (separate cache name from app shell)
