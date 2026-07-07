# Features

A complete breakdown of everything CatDex does.

---

## Core Loop: Spot → Snap → Sticker → Collect

### Camera Capture
- Native camera access via `getUserMedia` or file upload fallback
- Full-screen capture UI with real-time preview
- Works on mobile and desktop webcams

### On-Device Sticker Pipeline
- **Photo compression** — downsizes to 1280px, JPEG at 0.85 quality
- **Background removal** — `@imgly/background-removal` running WASM/WebGPU in the browser
- **High-res compositing** — inference runs at 1024px, result upscaled to original resolution
- **Alpha refinement** — edge cleanup for cleaner cutouts
- **Sticker outline** — canvas-based alpha dilation with white stroke and drop shadow
- **Final export** — compressed WebP sticker at 1024px max

### Coat Classification & Rarity
- Transformers.js + TensorFlow.js MobileNet classify coat type on-device
- Auto-assigns rarity tier: Common, Uncommon, Rare, Epic
- "Is this a cat?" guard rejects non-cat photos before processing

### Geotagging
- Optional GPS via the Geolocation API
- Reverse geocoding (city + country) for location metadata
- User can toggle GPS on/off per capture

---

## CatDex Collection

- Grid view of all captured stickers
- Filter by coat type, rarity, city, country
- Each entry shows: sticker, nickname, coat, rarity, location, date
- Detail page with full-size sticker, mini-map pin, and metadata
- Rename/nickname cats at any time

---

## World Map

- **MapLibre GL JS** with OpenFreeMap tiles (no billing)
- GeoJSON pins for every geotagged capture
- Cluster markers at low zoom, individual pins at high zoom
- Tap a pin to see the sticker popup with quick navigation to detail
- Stray cat layer showing community-reported sightings
- Layer toggle between personal catches and public/stray data
- Deep-link support (`?cat=id` or `?stray=id` to focus a specific pin)

---

## Stray Cat Identity

- AI-assisted identity linking connects multiple sightings of the same cat
- Dedicated stray profile page aggregating all captures of one cat
- Community name polls — vote on names for shared strays
- Sighting history with timestamps and locations

---

## Missions & Gamification

### Missions (Quests)
- Catalog of completeable objectives (e.g., "Catch 5 cats", "Visit 3 cities")
- Progress tracked automatically from capture metrics
- Claim XP rewards on completion

### Badges
- Tiered achievements (multiple levels per badge)
- Visual badge grid with progress indicators
- Categories: collection, exploration, community, rare finds

### XP & Leveling
- XP earned from missions, badges, and daily activity
- Level-up system with profile display
- Total XP and level visible on Missions page

### Streaks & Daily Goals
- Configurable daily capture goal
- Streak counter (consecutive days with at least one catch)
- Week calendar showing recent activity
- Visual progress bar on home screen

---

## Community

### Posts
- Share photos and updates with other users
- Like and comment interactions
- Content moderation with community guidelines gate

### Chat
- Channel-based real-time messaging
- Channels: General, Cat Care, Rescue, Shelters
- Per-channel message history

### Rescue Alerts
- Report cats in distress with location and photos
- Urgency levels and status tracking
- Alert resolution by community members
- Urgent alert count badge in navigation

### Safety
- Community guidelines acceptance required before posting
- Reporting and moderation tools
- Safety actions for inappropriate content

---

## PWA & Offline

- **Installable** — add to home screen on iOS/Android
- **App shell caching** — instant load even without network
- **ML model caching** — background removal and classification models cached after first download
- **Offline capture queue** — take photos offline, auto-sync when back online
- **Background sync** — pending uploads resume transparently
- **Service worker** generated at build time via Serwist

---

## User Experience

### Phone Frame (Desktop)
- Mobile-first 420px canvas
- Centered phone bezel on desktop with soft background
- Consistent experience across all screen sizes

### Design System
- Soft, rounded, pastel aesthetic
- Custom color palette: cream background, purple primary, green/orange accents
- Large border radii (16px cards, 28px buttons)
- Framer Motion animations for sticker reveals and transitions

### Navigation
- Bottom navigation bar (Home, CatDex, Catch, Map, Profile)
- Contextual back navigation within detail pages
- Loading skeletons for all async pages

---

## Account & Settings

- **Auth** — email/password + OAuth providers via Supabase
- **Cloud save** — collection syncs across devices
- **Demo mode** — try the app without signing up (pre-loaded sample data)
- **Terms consent** — modal for terms acceptance on first login
- **Settings page** — account management, preferences, data controls

---

## Privacy & Security

- Row Level Security on every Supabase table
- Original photos stored as private/authenticated assets
- GPS data private by default (user controls visibility)
- ML inference on-device means photos never leave the browser for processing
- No tracking, no ads, no monetization
