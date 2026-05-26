# Dust Off

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

## Get started

```bash
npm install
npm start            # Metro dev server (use this for JS-only changes)
npm run ios          # full native build + launch dev client
npm run android      # same, Android side
npm run lint
```

The project uses a development client (`expo-dev-client`). For JS-only iteration, `npm start` on top of an already-installed dev client is fastest. After native dependency or `app.json` plugin changes, regenerate with `npx expo prebuild --clean` and rebuild.

There is no test runner configured.

## Privacy posture

Privacy is architectural, not optional.

- No network calls during normal usage (verified by airplane-mode test)
- No telemetry, analytics, or crash reporting SDKs in the binary
- No camera, microphone, location, contacts, or notification permissions — only photos
- All preferences stored locally; photo metadata never leaves the device

Adding a dependency that violates any of these requires replacing or wrapping it.

## Repository map

- `src/app/` — Expo Router routes (file-based, in a `src/`-prefixed layout)
- `src/theme/` — design tokens (palette, motion, typography, theme provider)
- `src/state/` — Zustand stores (preferences + favorites are persisted; gallery seed is transient)
- `src/queries/` — TanStack queries (assets via `useInfiniteQuery`, permission)
- `src/actions/` — compound cross-store actions (e.g. `useOnboardingComplete`)
- `src/hooks/` — React hooks (splash gate, grid columns, first-reveal, app-state refetch)
- `src/components/` — UI primitives (Button, EmptyState, GalleryGrid, SortStrip, Sheet, etc.)
- `src/lib/` — adapters and helpers (async-storage, media-library wrapper, seeded-shuffle, permission, source-set, strings)

Path aliases: `@/*` → `./src/*` and `@/assets/*` → `./assets/*`. Always import via aliases.

## Continuous Native Generation

`/ios` and `/android` are gitignored and regenerated from `app.json`. Never edit generated native files by hand — changes will be wiped. All native config (permissions, splash, icons, plugins) goes through `app.json` `plugins`.
