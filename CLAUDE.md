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

**Phase 0 (Foundation & derisking spikes) is complete.** `src/` holds the locked architectural skeleton: `theme/` (DS-7/9/10 tokens + `<ThemeProvider>` override), `state/` (`usePreferencesStore` + `useFavoritesStore` with custom `Set ↔ sorted string[]` serialize per SM-4), `queries/` (TanStack Query stubs for assets + permission), `lib/` (`async-storage` adapter, `query-client`, `source-set`, `media-library` wrapper), `hooks/` (`use-splash-gate`, `use-frame-rate`), `components/splash-gate.tsx`. Root layout wraps the providers stack and gates render on persist hydration (SM-8). `src/app/index.tsx` is the Phase 0 hello-world theme-toggle demo; `src/app/spike-galeria.tsx` is the temporary D-1 spike route — both get replaced as Phase 1+ surfaces land.

**D-1 resolved 2026-05-09: Galeria PASS** — `@nandorojo/galeria` stays for the Phase 5 photo viewer. DS-12 (unified-viewer-as-paused-theater) still needs to be reconciled with Galeria's lightbox model when Phase 5 plans; tracking note in `docs/perf-baseline-phase0.md`. **D-2 perf measurements deferred** per project owner; the rig is in place (see `docs/perf-rig.md`) for any future regression check.

Phasing per PRD §Timeline: Phase 1 = onboarding + permission flow (PRD lines 510–529). Use `git log` for the current commit boundary instead of relying on this paragraph.
