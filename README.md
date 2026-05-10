# Dust Off

A randomized photo gallery and slideshow for iOS and Android. Surfaces the photos you forgot you had — local-only, no cloud, no telemetry.

## What this is

Most people have thousands of photos sitting on their phone they never scroll back through. Dust Off's wedge is _serendipitous rediscovery_: random-by-default sort plus a dedicated, gesture-first slideshow tuned for libraries of 5k–50k photos.

This is a hobby project, not a launch. The product spec — including locked design system and state-architecture decisions — lives in [`docs/PRD.md`](docs/PRD.md).

## Stack

- Expo SDK 55 + Expo Router 55 (typed routes, file-based routing)
- React 19.2 with React Compiler enabled — manual `useMemo` / `useCallback` are usually unnecessary
- React Native 0.83 on the New Architecture (Fabric + TurboModules)
- TypeScript strict mode
- State: TanStack Query (server-ish) + Zustand `persist` (preferences, favorites) + plain Zustand (transient)
- Lists: `@shopify/flash-list`; Images: `expo-image`; Slideshow lightbox: `@nandorojo/galeria`
- Animations: `react-native-reanimated` 4.x + `react-native-gesture-handler`

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

Privacy is architectural, not optional. Per PRD requirements P-1 through P-5:

- No network calls during normal usage (verified by airplane-mode test)
- No telemetry, analytics, or crash reporting SDKs in the binary
- No camera, microphone, location, contacts, or notification permissions — only photos
- All preferences stored locally; photo metadata never leaves the device

Adding a dependency that violates any of these requires replacing or wrapping it.

## Build status

Phase 1 (permission + onboarding flow) is complete. Phase 2 (gallery walking skeleton — paginated MediaLibrary fetch, FlashList grid, sort sheet, persisted preferences, first-reveal stagger) and Phase 3 (Albums view + favorites — Albums route folder with drill-in, synthesized Favorites pinned first, per-session random covers) implementations are landed; on-device walkthroughs pending. Phase progression and exit gates live in [`docs/PRD.md`](docs/PRD.md); `CLAUDE.md` carries the running architectural picture.

## Repository map

- `src/app/` — Expo Router routes (file-based, in a `src/`-prefixed layout)
- `src/theme/` — design tokens (palette, motion, typography, theme provider)
- `src/state/` — Zustand stores (preferences + favorites are persisted; gallery seed is transient)
- `src/queries/` — TanStack queries (assets via `useInfiniteQuery`, permission)
- `src/actions/` — compound cross-store actions (e.g. `useOnboardingComplete`)
- `src/hooks/` — React hooks (splash gate, grid columns, first-reveal, app-state refetch)
- `src/components/` — UI primitives (Button, EmptyState, GalleryGrid, SortStrip, Sheet, etc.)
- `src/lib/` — adapters and helpers (async-storage, media-library wrapper, seeded-shuffle, permission, source-set, strings)
- `docs/PRD.md` — product requirements + locked design and state decisions (source of truth)
- `docs/perf-rig.md`, `docs/perf-baseline-phase0.md` — perf measurement infrastructure (rig in place, runs deferred)
- `CLAUDE.md` — guidance for AI-assisted development on this codebase

Path aliases: `@/*` → `./src/*` and `@/assets/*` → `./assets/*`. Always import via aliases.

## Continuous Native Generation

`/ios` and `/android` are gitignored and regenerated from `app.json`. Never edit generated native files by hand — changes will be wiped. All native config (permissions, splash, icons, plugins) goes through `app.json` `plugins`.
