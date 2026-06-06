# Wedding POV

**See the Wedding Through Every Guest's Eyes.**

A premium wedding photo-sharing platform where guests capture memories from their perspective. Every upload is tagged as a POV contributor and feeds a live gallery and cinematic slideshow.

## Run Locally

```bash
cd wedding-pov
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Flow

| Step | URL |
|------|-----|
| App home | `/` |
| Couple homepage (QR destination) | `/wedding/prillaga-wedding-2026` |
| Guest join | `/join/prillaga-wedding-2026` |
| Event hub | `/event/prillaga-wedding-2026` |
| Camera (continuous mode) | `/event/prillaga-wedding-2026/camera` |
| Fullscreen slideshow | `/event/prillaga-wedding-2026/slideshow` |
| TV / projector display | `/event/prillaga-wedding-2026/display` |
| Admin dashboard | `/dashboard/prillaga-wedding-2026` |

1. Tap demo event **prillaga-wedding-2026**
2. View couple hero → **Join Event**
3. Enter your name → appears as **John Doe's POV**
4. Camera shows **John Doe's POV — 7 / 10 Photos Uploaded** with continuous capture after upload
5. Gallery groups by guest: **Jane Smith's POV — 10 / 10 Photos**
6. Fullscreen slideshow presentation (tap to start, tap for controls)
7. Reception TV display mode — no app chrome, auto-hiding controls
8. Admin dashboard: limits, theme, camera settings, analytics, moderation

### Standalone HTML demo (no npm)

Double-click **`WeddingPOV.html`** in Safari or Chrome for the full guest flow including camera, gallery, and fullscreen slideshow.

---

## Features

### Guest
- QR code / event code access (no account)
- In-app camera with filters (Original, Sketch, B&W, Vintage, Warm Wedding Tone, Film)
- Photo & video capture with preview, retake, and delete before upload
- **Continuous camera mode** — stay on camera after upload (photobooth-style)
- Upload quota indicator: **John Doe's POV — 7 / 10 Photos Uploaded**
- Photo limit reached screen with gallery & slideshow links
- POV gallery sorted by guest, timeline, section, or newest
- **Fullscreen slideshow presentation** with tap-to-show controls
- Reception TV display mode (landscape, large contributor names)

### Photo Limits (Admin)
- Per guest total, per hour, or per event section
- Limits: 1, 5, 10, 15, 20, 25, 50, 100, Unlimited
- On limit: block uploads, mark as extra, or allow unlimited

### Admin Dashboard
- **Analytics** — guests, photos, avg per guest, storage, top contributors
- **Event Settings** — bride/groom, date, venue, hashtag, welcome message
- **Photo Limits** — type, max count, limit behavior
- **Theme Builder** — 6 presets, custom colors, typography, background upload
- **Slideshow** — 5 styles, intro/outro text, music toggles
- **Moderation** — approve/reject/remove, auto-approve, disable uploads
- **AI Highlights** — 1-min, 3-min, full recap

### Couple Homepage
- Hero with couple names, date, venue, hashtag
- Custom background photo with overlay modes
- Join Event CTA

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web + Mobile PWA | Next.js 15, TypeScript, Tailwind, Framer Motion |
| Data (demo) | localStorage |
| Cloud (production) | Firebase Firestore + Storage |
| Native mobile (planned) | Flutter iOS/Android |

Copy `.env.example` to `.env.local` and add Firebase credentials for cloud sync.

---

## Production Deployment

### GitHub

```bash
git init
git add .
git commit -m "Initial Wedding POV release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wedding-pov.git
git push -u origin main
```

### Vercel (Next.js app)

1. Import the GitHub repo on [vercel.com](https://vercel.com)
2. Set root directory to `wedding-pov` if deploying from a monorepo
3. Deploy — no env vars required for the localStorage demo

### Firebase (production backend)

1. Configure Firebase project (Firestore, Storage, Hosting rules)
2. Set `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel
3. Uncomment Firestore code in `src/lib/firebase.ts`
4. Replace localStorage calls in `src/lib/store.ts` with Firestore listeners
5. Upload photos to Firebase Storage instead of base64
6. Build Flutter app sharing the same Firebase backend (see `mobile/README.md`)

---

## Slideshow Styles

- **Fade** — classic crossfade
- **Zoom** — Ken Burns zoom
- **Cinematic Pan** — horizontal pan with scale
- **Film Strip** — sprocket-hole frame
- **Polaroid Drop** — polaroid-style drop animation

---

## Theme Presets

White & Gold · Champagne · Rose Gold · Sage Green · Royal Blue · Black & Gold

Typography: Elegant Script · Luxury Serif · Modern Sans · Minimalist
