# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Dust Off** — a randomized photo gallery and slideshow app for iOS and Android. The wedge is *serendipitous rediscovery* (random-by-default sort + a dedicated, gesture-first slideshow) for users with 5k–50k photos who never scroll back through their library.

`docs/PRD.md` is the source of truth for product scope, requirements (P0/P1/P2), and acceptance criteria. Read it before designing anything user-facing or making scope calls. The PRD locks decisions like default sort = random, default slideshow duration = 8s, fit-to-screen (never crop), shake-to-shuffle on at Medium, etc. — don't re-litigate these without checking it first.

## Commands

```bash
npm start            # expo start — Metro dev server, then choose platform
npm run ios          # expo start --ios
npm run android      # expo start --android
npm run web          # expo start --web (web is configured but phone is the primary target)
npm run lint         # expo lint (ESLint via Expo's preset)
```

There is **no test runner configured**. Don't claim "tests pass" — there are none to run. If you add tests, document the runner here.

The repo currently has no native development build set up. Many P0 features (`expo-media-library`, `expo-keep-awake`, `expo-haptics`, custom shake detection) require a dev client, not Expo Go. When you add a native dependency, a fresh `npx expo prebuild` + dev-client rebuild is needed before it works on device.

## Architecture

### Stack
- **Expo SDK 55**, **Expo Router 55** (file-based routing, typed routes enabled via `experiments.typedRoutes`)
- **React 19.2** with **React Compiler** enabled (`experiments.reactCompiler`) — manual `useMemo`/`useCallback` are usually unnecessary; trust the compiler unless profiling proves otherwise
- **React Native 0.83.6** on the **New Architecture** (Fabric + TurboModules — required by SDK 55)
- **react-native-reanimated 4.x** + **react-native-worklets 0.7.4** + **react-native-gesture-handler 2.30** — the slideshow's tap/swipe/pinch/pan/shake interactions ride on these
- TypeScript **strict** mode

### Routing & file layout
- App entry: `expo-router/entry` (set in `package.json` `main`)
- Routes live in **`src/app/`** (not the default `app/` — this project uses a `src/`-prefixed layout)
- Path aliases: `@/*` → `./src/*` and `@/assets/*` → `./assets/*`. Always import via aliases, not relative `../../` chains.
- `src/app/_layout.tsx` is the root `<Stack>`; nested layouts (tabs, modals) go in subdirectories

### Continuous Native Generation (CNG)
- `/ios` and `/android` are **gitignored and not committed** — they are regenerated from `app.json`
- All native configuration (permissions, splash, icons, plugins, Info.plist entries) goes through `app.json` `plugins` — never edit generated native files by hand, the change will be wiped
- Adding a library that needs native config = add its config-plugin entry to `app.json`, then `npx expo prebuild --clean` and rebuild the dev client

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

This is a **freshly initialized project**. The original `create-expo-app` template files (themed components, tabs, hooks, the explore screen, etc.) have been deleted in working tree (visible in `git status`) but not yet committed. Only `src/app/_layout.tsx` (a bare `<Stack />`) and `src/app/index.tsx` (placeholder text) exist. Implementation against the PRD has not started.

Phasing per PRD §Timeline: Week 1 = scaffold + permission flow + gallery grid + Albums + AsyncStorage prefs + theming. Week 3 is when the slideshow engine lands.
