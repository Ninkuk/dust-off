# Dust Off

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-555)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-55-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-enabled-success)](https://reactnative.dev/architecture/landing-page)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

A randomized photo gallery and slideshow for iOS and Android. Surfaces the photos you forgot you had — local-only, no cloud, no telemetry.

## What this is

Most people have thousands of photos sitting on their phone they never scroll back through. Dust Off's wedge is _serendipitous rediscovery_: random-by-default sort plus a dedicated, gesture-first slideshow tuned for libraries of 5k–50k photos.

## Stack

- Expo SDK 55 + Expo Router 55 (typed routes, file-based routing)
- React 19.2 with React Compiler enabled — manual `useMemo` / `useCallback` are usually unnecessary
- React Native 0.83 on the New Architecture (Fabric + TurboModules)
- TypeScript strict mode
- State: TanStack Query (server-ish) + Zustand `persist` (preferences, favorites) + plain Zustand (transient)
- Lists: `@shopify/flash-list`; Images: `expo-image`
- Animations + gestures: `react-native-reanimated` 4.x + `react-native-gesture-handler` 2.30 (powers the custom theater viewer's tap-zones, pinch-pan, swipe-down dismiss, long-press menu)
- Sheets: `@gorhom/bottom-sheet` (sort, grid size, slide duration/transition, theme, photo info)
- The shuffle pill's flowing gold ring is drawn with `@shopify/react-native-skia` + `react-native-animated-glow`
- Sharing: `react-native-share` + `expo-sharing`, always routed through the OS share sheet

## Get started

```bash
npm install
npm start            # Metro dev server (use this for JS-only changes)
npm run ios          # full native build + launch dev client
npm run android      # same, Android side
npm run lint
```

The project uses a development client (`expo-dev-client`). For JS-only iteration, `npm start` on top of an already-installed dev client is fastest. After native dependency or `app.json` plugin changes, regenerate with `npx expo prebuild --clean` and rebuild.

A fresh simulator/emulator has no photos, so the app shows the empty state. Seed it first:

```bash
npm run seed:ios       # push fixture images into the booted iOS simulator
npm run seed:android   # push fixture images into the running Android emulator
npm run fixtures:fetch # download the fixture image set (run once before seeding)
```

Other scripts: `npm run android:release` (release-variant build on a device), `npm run web`, `npm run start:tunnel`, `npm run stop` (kill Metro on :8081), `npm run react-doctor`.

There is no test runner configured.

## Privacy posture

Privacy is architectural, not optional.

- No network calls during normal usage (verified by airplane-mode test)
- No telemetry, analytics, or crash reporting SDKs in the binary
- No camera, microphone, device-location, contacts, or notification permissions. Only the OS photo-library permission — plus `ACCESS_MEDIA_LOCATION` on Android, so the photo-info sheet can read a shot's embedded GPS/EXIF. That metadata is read on-device and never transmitted.
- All preferences stored locally; photo metadata never leaves the device
- Sharing is user-initiated and handed off to the OS share sheet — the app itself uploads nothing

Adding a dependency that violates any of these requires replacing or wrapping it. To report a privacy or security concern, see [`SECURITY.md`](./SECURITY.md).

## Repository map

- `src/app/` — Expo Router routes (file-based, `src/`-prefixed): `(tabs)/` gallery + albums + settings, `(onboarding)/`, and the `theater/` slideshow stack
- `src/theme/` — design tokens (palette, motion, typography, theme provider)
- `src/state/` — Zustand stores (preferences + favorites are persisted; gallery seed, selection, slideshow, toasts are transient)
- `src/queries/` — TanStack queries (assets via `useInfiniteQuery`, albums, album covers, permission)
- `src/actions/` — compound cross-store actions (onboarding, reshuffle, favorite/delete/share, single + bulk, start slideshow)
- `src/hooks/` — React hooks (splash gate, grid columns, first-reveal, app-state refetch)
- `src/components/` — UI (Button, EmptyState, GalleryGrid, SortStrip, ShufflePill, Sheet, the theater chrome/controls/menu, etc.)
- `src/lib/` — adapters and helpers (async-storage, media-library wrapper, seeded-shuffle, permission, source-set/resolver, share + delete caches, strings)

Path aliases: `@/*` → `./src/*` and `@/assets/*` → `./assets/*`. Always import via aliases.

## Continuous Native Generation

`/ios` and `/android` are gitignored and regenerated from `app.json`. Never edit generated native files by hand — changes will be wiped. All native config (permissions, splash, icons, plugins) goes through `app.json` `plugins`.

## Builds

Distribution builds are configured in `eas.json`. The `production` Android profile emits an app-bundle and the `submit` config targets the Play Store `internal` track as a draft. The Play service-account key (`*service-account*.json`) is gitignored and never committed.

## License

MIT — see [`LICENSE`](./LICENSE).
