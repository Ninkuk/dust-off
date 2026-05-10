# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Dust Off** — a randomized photo gallery and slideshow app for iOS and Android. The wedge is *serendipitous rediscovery* (random-by-default sort + a dedicated, gesture-first slideshow) for users with 5k–50k photos who never scroll back through their library.

`docs/PRD.md` is the source of truth for product scope, requirements (P0/P1/P2), and acceptance criteria. Read it before designing anything user-facing or making scope calls. The PRD locks decisions like default sort = random, default slideshow duration = 8s, fit-to-screen (never crop), shake-to-shuffle on at Medium, etc. — don't re-litigate these without checking it first.

## Commands

```bash
npm start            # expo start — Metro dev server (use this for JS-only changes)
npm run ios          # expo run:ios — full native build + launch dev client (slow; only when native config or deps change)
npm run android      # expo run:android — same, Android side
npm run web          # expo start --web (web is configured but phone is the primary target)
npm run lint         # expo lint (ESLint via Expo's preset)
npm run react-doctor # npx react-doctor@latest — React/Expo project health check
```

There is **no test runner configured**. Don't claim "tests pass" — there are none to run. If you add tests, document the runner here.

The dev client is set up: `expo-dev-client` is installed and `ios/`/`android/` are generated locally (gitignored). For JS-only work, `npm start` + the existing dev client is fastest. When you add or reconfigure a native dependency, regenerate with `npx expo prebuild --clean` and rebuild via `npm run ios` / `npm run android`.

## Architecture

### Stack
- **Expo SDK 55**, **Expo Router 55** (file-based routing, typed routes enabled via `experiments.typedRoutes`)
- **React 19.2** with **React Compiler** enabled (`experiments.reactCompiler`) — manual `useMemo`/`useCallback` are usually unnecessary; trust the compiler unless profiling proves otherwise
- **React Native 0.83.6** on the **New Architecture** (Fabric + TurboModules — required by SDK 55)
- **react-native-reanimated 4.x** + **react-native-worklets 0.7.4** + **react-native-gesture-handler 2.30** — the slideshow's tap/swipe/pinch/pan/shake interactions ride on these
- TypeScript **strict** mode

### Key dependencies
The runtime stack is locked — reach for these before introducing alternatives:
- **State**: `zustand` 5.x (with `persist` middleware) for app state; `@tanstack/react-query` for async/photo-library reads. Three-bucket split is documented in memory `project_dust_off_state_management.md` — read it before adding state.
- **Lists**: `@shopify/flash-list` 2.x for the gallery grid (50k-photo target).
- **Images**: `expo-image` for all rendering (caching, transitions); `@nandorojo/galeria` for the slideshow lightbox.
- **UI primitives**: `@gorhom/bottom-sheet` for sheets/modals; `expo-glass-effect` + `expo-blur` for the cinematic-minimalism design system; `lucide-react-native` for icons.
- **Native APIs**: `expo-media-library` (photos), `expo-haptics`, `expo-keep-awake` (slideshow), `expo-sensors` (shake-to-shuffle).

**MediaLibrary wrapper rule:** import as `import MediaLibrary from "@/lib/media-library"` — never directly from `expo-media-library`. The wrapper passes through in production but swaps `getAssetsAsync` / `getAlbumsAsync` for an in-memory synthetic library when `__DEV__ && process.env.EXPO_PUBLIC_MOCK_LIBRARY === "1"`. That indirection is what lets the D-2 perf rig (`docs/perf-rig.md`) run against a 50k mock library without touching consumers. Bypassing it forfeits the rig.

**Persisted-storage adapter:** both Zustand stores import from `src/lib/async-storage.ts`. That file is the **single MMKV swap-point** if AsyncStorage write amplification ever hurts (per state-memory re-eval trigger) — change there, not at each store.

### Routing & file layout
- App entry: `expo-router/entry` (set in `package.json` `main`)
- Routes live in **`src/app/`** (not the default `app/` — this project uses a `src/`-prefixed layout)
- Path aliases: `@/*` → `./src/*` and `@/assets/*` → `./assets/*`. Always import via aliases, not relative `../../` chains.
- `src/app/_layout.tsx` is the root `<Stack>`; nested layouts (tabs, modals) go in subdirectories

### Continuous Native Generation (CNG)
- `/ios` and `/android` are **gitignored and not committed** — they are regenerated from `app.json`
- All native configuration (permissions, splash, icons, plugins, Info.plist entries) goes through `app.json` `plugins` — never edit generated native files by hand, the change will be wiped
- Adding a library that needs native config = add its config-plugin entry to `app.json`, then `npx expo prebuild --clean` and rebuild the dev client
- **iOS deployment target is locked to 16.0** via `expo-build-properties` — don't bump without checking dependency compatibility
- `expo-media-library` plugin is configured with `preventAutomaticLimitedAccessAlert: true` and `isAccessMediaLocationEnabled: false` — these are privacy-posture choices (suppress system limited-access nags; don't read GPS EXIF), not defaults. Don't toggle without revisiting the PRD privacy section.
- Android `blockedPermissions` excludes `READ_MEDIA_AUDIO` — the privacy posture (photos only, no mic/audio) is enforced in config, not just docs

### Privacy posture is architectural, not optional
PRD requirements P-1 through P-5 are hard constraints, not preferences:
- **No network calls** during normal app usage (verified by airplane-mode test)
- **No telemetry, analytics, or crash reporting** SDKs in the binary (no Firebase, no Sentry, no PostHog, etc.)
- **No camera, microphone, location, contacts, or notification permissions** — only photo access
- All preferences in **AsyncStorage** (local only); photo metadata never leaves the device

When adding a dependency, check whether it phones home or registers a permission. If it does, it likely violates the privacy posture and needs to be replaced or wrapped.

### Performance constraints to design around
- Target library size: **up to 50,000 photos** on a mid-tier Android (e.g. Pixel 6a)
- Gallery must render the first screenful before all metadata is fetched (G-11) — paginate `expo-media-library` queries, don't await the full library
- Selection cap is **1,000 photos** (G-7) — enforce in selection state
- Shuffled-queue invariant: no repeats until queue exhausted; reshuffle silently at end (S-5); shuffle history is *not* persisted across sessions (S-6)
- A SQLite metadata index is explicitly **P2** — only add it if AsyncStorage + paginated MediaLibrary queries prove insufficient at 50k

## Current state of the codebase

**Phase 1 (Permission & onboarding flow) is complete.** Routing topology: `(onboarding)/onboarding.tsx` (swipeable three-card pager, theater-themed) → system permission dialog → `(tabs)/{index,albums,settings}.tsx` (Native Tabs scaffold) or `denied.tsx` on denial. Each layout self-guards via `<Redirect>` on `(hasSeenOnboarding, permission)`, so cold-start lands on the right surface regardless of arrival path. Splash gate (SM-8) emits a staged `ready` signal in `use-splash-gate.ts` — hide on hydrate alone for onboarding; hydrate + permission settled for denied; hydrate + permission + (first-page-resolved OR 1s backstop) for the gallery (extended in Phase 2).

Phase 1 added: `actions/use-onboarding-complete.ts` (SM-13 compound action), `lib/permission.ts` (`isPermissionCleared` / `isPermissionLimited` helpers — both go through a single typed `LIMITED = "limited" as PermissionStatus` constant that works around `expo-modules-core`'s `PermissionStatus` enum lacking `LIMITED`, which iOS still returns at runtime), `lib/strings.ts` (DS-17 strings module, populated for onboarding/denied/banner/empty-states/tabs), `hooks/use-permission-app-state-refetch.ts` (SM-7 refetch on background→active), `components/{button,empty-state,partial-access-banner}.tsx`.

**Phase 2 (Gallery walking skeleton) implementation landed 2026-05-09; on-device walkthrough pending.** Static checks (lint, tsc, iOS bundle export) clean. The post-permission gallery at `(tabs)/index.tsx` now renders real photos via `<SortStrip>` + optional `<PartialAccessBanner>` (mounted under `permission === 'limited'`) + `<GalleryGrid>` (FlashList with 1px-gutter "tapestry" rendering, square tiles, three grid sizes via `useGridColumns`).

Phase 2 added:
- **Data layer.** `queries/use-assets-query.ts` rewritten to `useInfiniteQuery` paginating `MediaLibrary.getAssetsAsync` (5000 photos/page, `creationTime` sort) with an `enabled` flag; sibling `usePrefetchAllAssetPages` auto-fetches every page in the background. The state-mem's "ID phase then metadata phase" projection collapses to one phase because `getAssetsAsync` already returns full per-asset metadata. Sort and shuffle are `useMemo` derivations against the flattened cache — sort flips never refetch. The shuffle/name-sort path is gated on `!query.hasNextPage` so already-painted tile positions don't visibly shift on each new page during cold-start paging.
- **State.** `state/gallery-store.ts` — transient (non-persisted) Zustand store holding the per-session `seed: number` initialised from `Date.now()` at module load. Phase 4 will add a `reshuffle()` action for pull-to-shuffle.
- **Lib.** `lib/seeded-shuffle.ts` — Mulberry32 PRNG + Fisher-Yates (`seededShuffle<T>(items, seed)`). Phase 4/5 (slideshow queue, S-5/S-6 invariants) reuse this.
- **Strings.** `gallery` group added to `lib/strings.ts` — `sortLabels`, `sortSheetTitle`, `formatCount(n)`, `sortStripA11y(label, n)`. Voice = neutral-utility per DS-17.
- **Hooks.** `hooks/use-grid-columns.ts` (gridSize × orientation → numColumns); `hooks/use-first-reveal.ts` (frozen-at-mount snapshot via `useRef`, flag flipped on mount-with-data, not animation-end, so navigating mid-stagger doesn't replay).
- **Components.** `components/{sheet,sort-sheet,sort-strip,gallery-tile,gallery-grid}.tsx`. `<Sheet>` is a thin themed `BottomSheetModal` wrapper (Phase 4+ reuses for selection actions, source picker, long-press menu). `<GalleryGrid>` owns a single shared Reanimated `revealProgress` value; tiles consume it via `useAnimatedStyle` (no per-tile clocks). The reveal-stagger timing primitives (`FADE_DURATION_MS`, `ROW_STAGGER_MS`, `MAX_STAGGERED_ROWS`) live in `gallery-tile.tsx` with `REVEAL_DURATION_MS` derived from them — invariant is structural.
- **Root layout.** `BottomSheetModalProvider` mounted between `SafeAreaProvider` and `<SplashGate>` so sheets can present from anywhere in the tabs.

Deferred from Phase 2 (intentionally — flagged so they aren't lost):
- Library-change subscription (state-mem decision 6) → Phase 4 alongside bulk-delete invalidation. Risk: external photo additions during a session don't appear until cold restart.
- `<PartialAccessBanner>`'s `total` prop under iOS limited access — system doesn't expose device-total; Phase 2 passes `shared` for both. Revisit when banner copy is finalised.
- 50k-mock perf measurements (D-2) — explicitly deferred per project owner; `docs/perf-rig.md` is in place for the end-of-build-cycle pass.
- FlashList `numColumns` flicker on grid-size change — accepted for Phase 2; revisit if it bothers in dogfooding.

Phase 0 deliverables (`theme/`, the persisted Zustand stores, `lib/` adapters, splash gate primitive, perf rig) remain available.

**D-1 resolved 2026-05-09: Galeria PASS** — `@nandorojo/galeria` stays for the Phase 5 photo viewer. DS-12 (unified-viewer-as-paused-theater) still needs to be reconciled with Galeria's lightbox model when Phase 5 plans; tracking note in `docs/perf-baseline-phase0.md`. **D-2 perf measurements deferred** per project owner; the rig is in place (see `docs/perf-rig.md`) for any future regression check.

Phasing per PRD §Timeline: Phase 3 = albums view + favorites. Use `git log` for the current commit boundary instead of relying on this paragraph.
