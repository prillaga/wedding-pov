# Wedding POV — Flutter Mobile App (Planned)

The responsive Next.js web app serves as the mobile PWA today. This directory is reserved for the native Flutter iOS/Android client specified in the product roadmap.

## Shared Backend

Both web and Flutter clients will connect to:

- **Firebase Firestore** — events, guests, upload metadata
- **Firebase Storage** — photo and video files
- **Firebase Auth** (optional) — admin/couple login

Configure the same Firebase project as the web app (see `../.env.example`).

## Planned Flutter Features

- QR code event join
- In-app camera with filters
- Guest photo limit enforcement
- Real-time gallery sync
- Offline capture queue

## Getting Started (when scaffolded)

```bash
flutter create wedding_pov
cd wedding_pov
flutter pub add firebase_core cloud_firestore firebase_storage camera image_picker qr_code_scanner
flutter run
```

Until the Flutter app is scaffolded, guests can use the web PWA on their phones — add to home screen for a native-like experience.
