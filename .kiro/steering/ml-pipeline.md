---
inclusion: fileMatch
fileMatchPattern: "**/lib/capture/**,**/capture/**,**/*background-removal*,**/*transformers*,**/*mobilenet*"
---

# ML Pipeline Guidelines

## Architecture

All ML inference runs **on-device in the browser**. No server-side ML compute. This is a hard requirement for the $0 budget and user privacy.

## Pipeline Steps

```
Camera/Upload
  → Compress (browser-image-compression, 1280px, JPEG 0.85)
  → Background Removal (@imgly/background-removal, WASM/WebGPU)
  → High-Res Composite (inference at 1024px, upscale mask to original)
  → Alpha Refinement (edge cleanup)
  → Sticker Outline (canvas dilation + white stroke + drop shadow)
  → Final Export (WebP, 1024px max)
  → Coat Classification (Transformers.js / MobileNet)
  → Geotag (optional, Geolocation API + reverse geocoding)
  → Upload & Persist
```

## Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| `@imgly/background-removal` | Remove photo backgrounds | WASM/WebGPU, runs in worker |
| `@huggingface/transformers` | Coat type classification | Transformers.js v4 |
| `@tensorflow/tfjs` + `@tensorflow-models/mobilenet` | Fallback classifier | "Is this a cat?" guard |
| `browser-image-compression` | Pre-process compression | Before ML inference |

## Performance Rules

- **Lazy-load all models** — never load on first page visit, only when capture starts
- **Cache models** via the service worker (Serwist) — one-time download
- **Run inference at reduced resolution** (1024px) then upscale results
- **Show progress UI** during pipeline — use the Zustand `capture-store` for state
- **Graceful fallback** — if WebGPU unavailable, fall back to WASM; if that fails, show retry

## Error Handling

- Wrap all ML operations in try/catch
- Non-cat photos should be caught by the classifier guard early
- If background removal fails, allow the user to retry or skip (save original)
- Never crash the app if a model fails to load — degrade gracefully

## State Management

- Pipeline progress tracked in `src/stores/capture-store.ts` (Zustand)
- States: idle → compressing → removing-bg → compositing → outlining → classifying → uploading → done
- Each state transition updates the progress UI in the capture flow

## File Organization

- Pipeline modules live in `src/lib/capture/`
- Each step is its own module (e.g., `background-removal.ts`, `sticker-outline.ts`, `classify.ts`)
- The orchestrator (`pipeline.ts` or similar) chains steps and reports progress
