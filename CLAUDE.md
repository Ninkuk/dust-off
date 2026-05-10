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
- **Images**: `expo-image` for all rendering (caching, transitions). `@nandorojo/galeria` is installed but **not used** — Phase 5's DS-12 reconciliation rejected it (sealed lightbox forecloses the custom tap-zones, in-modal long-press menu, and chrome overlay slot DS-12 demands). Kept as a dependency for potential Phase 7+ "View on system Photos" affordance; zero runtime cost when unused.
- **UI primitives**: `@gorhom/bottom-sheet` for sheets/modals; `expo-glass-effect` + `expo-blur` for the cinematic-minimalism design system; `lucide-react-native` for icons.
- **Native APIs**: `expo-media-library` (photos), `expo-haptics`, `expo-keep-awake` (slideshow), `expo-sensors` (shake-to-shuffle).

### Routing & file layout
- App entry: `expo-router/entry` (set in `package.json` `main`)
- Routes live in **`src/app/`** (not the default `app/` — this project uses a `src/`-prefixed layout)
- Path aliases: `@/*` → `./src/*` and `@/assets/*` → `./assets/*`. Always import via aliases, not relative `../../` chains.
- `src/app/_layout.tsx` is the root `<Stack>`; nested layouts (tabs, modals) go in subdirectories
- Top-level route groups: `(onboarding)/`, `(tabs)/`, `theater/` (sibling, **not** nested in tabs), `denied.tsx`

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

## Conventions

These are project-wide rules. Follow them when adding new code; raise the question if a task seems to require breaking one.

- **File naming.** Hooks `use-X.ts`, actions `use-X.ts` (in `actions/` — they're hooks that return imperative callbacks), components kebab-case `.tsx` exporting PascalCase, queries `use-X-query.ts` (in `queries/`).
- **State buckets.** TanStack Query for async/photo-library reads; persisted Zustand (`preferences`, `favorites`) for cross-session prefs; transient Zustand (`gallery`, `selection`, `toast`, `slideshow`) for session-only state. The three-bucket split is non-negotiable — read memory `project_dust_off_state_management.md` before adding a new store.
- **MediaLibrary wrapper rule.** `import MediaLibrary from "@/lib/media-library"` — never directly from `expo-media-library`. The wrapper passes through in production but swaps `getAssetsAsync` / `getAlbumsAsync` for an in-memory synthetic library when `__DEV__ && process.env.EXPO_PUBLIC_MOCK_LIBRARY === "1"`. That indirection is what lets the D-2 perf rig (`docs/perf-rig.md`) run against a 50k mock library without touching consumers. Bypassing it forfeits the rig.
- **Persisted-storage adapter.** Both persisted Zustand stores import from `src/lib/async-storage.ts`. That file is the **single MMKV swap-point** if AsyncStorage write amplification ever hurts (per state-memory re-eval trigger) — change there, not at each store.
- **Strings.** All user-facing copy goes in `src/lib/strings.ts`, grouped by surface. Voice splits per DS-17: sparse-poetic for moments (`Saved.` `Gone.` `Reshuffled.`); neutral-utility for chrome (sort labels, sheet rows, banners).
- **Haptics.** Through `src/lib/haptics.ts` (`selectionTick` / `lightTap` / `mediumTap` / `heavyTap` / `successNotify`). The wrapper catches errors silently. Phase 8 will add a `usePreferencesStore.haptics` gate inside the wrapper — call sites won't change. (`button.tsx` still imports `expo-haptics` directly; conform new code.)
- **Sheets.** Reuse `<Sheet>` (themed `BottomSheetModal` wrapper) — don't import `@gorhom/bottom-sheet` directly. Rows inside sheets use `<SheetRow>` (`tone: 'default'|'destructive'`, supports `disabled`).
- **Routing pushes.** Use Expo Router's typed-routes object form: `router.push({ pathname: "/albums/[albumId]", params: { albumId } })`. Don't string-concatenate URLs.
- **Imports.** Always `@/*` aliases. No `../../` chains.
- **Trust the compiler.** React Compiler is enabled; don't sprinkle `useMemo`/`useCallback` defensively. Add only when profiling justifies.

## Architectural decisions worth remembering

These are the load-bearing patterns extracted from prior phase work. Use them when modifying related areas; flag if a new requirement seems to require breaking one.

### Routing topology
- **Theater is a sibling route group** (`src/app/theater/`), **not** nested in `(tabs)/`. That's why `<MorphingPill>` (mounted inside `(tabs)/index.tsx` and `(tabs)/albums/[albumId].tsx`, not at root) doesn't render in theater. The `'hidden'` branch of `usePillState()` is therefore unreachable — kept parked, not exercised. Don't try to "fix" it.
- Theater route URL: `/theater/{assetId}?kind=all|favorites|album&albumId=...&autoplay=0|1`. The `kind`/`albumId` pair drives the source-set; `autoplay` discriminates tap-photo (0) from pill-Shuffle (1) entry.
- Theater's `_layout.tsx` wraps a `<Stack>` with `animation: "fade"` + `contentStyle: { backgroundColor: "#000" }` — together with the root Stack's fade, that's DS-10's 250ms "lights dim" transition.
- Each layout self-guards via `<Redirect>` on `(hasSeenOnboarding, permission)`, so cold-start lands on the right surface regardless of arrival path. The splash gate (`use-splash-gate.ts`, SM-8) emits a staged `ready` signal: hide on hydrate alone for onboarding; hydrate + permission for denied; hydrate + permission + (first-page-resolved OR 1s backstop) for the gallery.

### State patterns
- **Selection store is transient** (no `persist`) so it survives Gallery↔Albums tab switches (SM-12) and resets on cold start. Bulk-action completion explicitly calls `cancel()`.
- **Slideshow store is route-scoped** via `createStore()` + `<SlideshowStoreProvider>` (mounted in `theater/_layout.tsx`) — there is no slideshow state outside theater. Provider tear-down imperatively calls `pause()` so no orphaned `setTimeout` leaks. If a future surface needs slideshow state from outside theater, lift the provider — don't fall back to a singleton.
- **Single shared anchor seed.** Both Gallery and Album-detail read `useGalleryStore.seed` + `anchorIds`. Pulling-to-shuffle in album-detail therefore reshuffles the main gallery too (intentional — same global seed).
- **Toast store is single-slot** with a shared timer ref; `show()` auto-commits any prior pending state per SM-11. `useToastAppStateCommit()` commits pending undos on `AppState→background`.
- **Generation counter pattern.** The slideshow store bumps a `generation: number` on every mutation. The progress bar listens to `(isPlaying, generation, slideDurationSec)` and re-runs its `withTiming` sweep — the bar never inspects timer internals. This decouples the JS `setTimeout` (drift-tolerant at second-scale) from the visual sweep (Reanimated). Resume-from-pause restarts the **full** duration (SM-10β) by construction.
- **Imperative reads of preferences mid-session.** Stores that need to react to settings without re-subscribing call `usePreferencesStore.getState()` at the moment of use (`scheduleNext`'s `slideDurationSec`, theater-viewer's `slideTransition`). A settings change picks up on the next event, not retroactively.

### Data layer (TanStack Query + MediaLibrary)
- **Single `'all'` cache, derived views.** `useAssetsQuery({ kind: 'all' })` is the canonical infinite query (5000 photos/page, `creationTime` sort). `useFavoritesAssetsQuery` shares the **same** queryKey and filters by `useFavoritesStore.favorites` — TanStack dedupes, so the gallery, splash gate, and Favorites view all consume one fetch. Album views pass `{ kind: 'album', albumId }` as a discriminant; `getAssetsAsync` filters natively.
- **Sort/shuffle are `useMemo` derivations**, never refetches. Sort flips never refetch. Shuffle/name-sort path is gated on `!query.hasNextPage` so already-painted tile positions don't visibly shift on each new page during cold-start paging.
- **Optimistic delete fans out via the `'all'` cache.** `queryClient.setQueryData(['assets', sourceSetKey({kind:'all'})], ...)` filtering deleted IDs out of every cached page — the Favorites view re-derives automatically. Snapshot is restored on cancel/throw (SM-13's accepted ≤500ms flicker).
- **Library-change subscription is foreground-only.** `MediaLibrary.addListener` debounced 500ms, subscribes on `AppState→active`, unsubscribes on `background`, invalidates `['assets']` with `refetchType: 'active'` — slideshow-immune by virtue of the unmounted query being inactive.
- **EXIF query is sheet-gated.** `<PhotoInfoSheet>` re-renders on every photo swipe; `useQuery({ enabled: isOpen })` avoids a `getAssetInfoAsync` call per nav.

### Shuffle / queue
- **Mulberry32 + Fisher-Yates** in `lib/seeded-shuffle.ts`. Same `seed` → same permutation, deterministic across processes.
- `seededShuffle<T>(items, seed, opts?: { anchorIds?: ReadonlySet<string>; idOf?: (t) => string })` — when `anchorIds` is provided, items partition into `anchored` (input order preserved) + `rest` (shuffled), result is `[...anchored, ...rest]`. SM-14a.
- `pickIndexFromSeed(scope, seed, length)` — FNV-1a string hash xor'd with seed → Mulberry32 → mod length. Stable per-session, reseeds on cold start. Used for album cover picks.
- `FAVORITES_ALBUM_ID = "@dust-off/favorites"` is the dynamic-route sentinel for the Favorites tile.
- **Slideshow exhaustion reshuffle uses a fresh `Date.now()` seed**, not `useGalleryStore.seed` — the gallery seed would re-emit the original order, defeating the no-repeats invariant (S-5/S-6).
- **`skipUnavailable(id)` filters from BOTH `queue` AND `unshuffledIds`.** Removing only from the queue would re-introduce the bad ID at the next exhaustion reshuffle and loop forever.

### Animation / gestures
- **Single shared `revealProgress` for the gallery grid.** `<GalleryGrid>` owns one Reanimated value; tiles consume via `useAnimatedStyle`. No per-tile clocks. Reveal-stagger primitives (`FADE_DURATION_MS`, `ROW_STAGGER_MS`, `MAX_STAGGERED_ROWS`) live in `gallery-tile.tsx` with `REVEAL_DURATION_MS` derived — invariant is structural.
- **First-reveal is mount-with-data**, not animation-end (`use-first-reveal.ts`). Frozen-at-mount snapshot via `useRef` so navigating mid-stagger doesn't replay.
- **Saved-state pinch/pan pattern.** Theater viewer snapshots `savedScale`/`savedTx`/`savedTy` on gesture begin and applies as `savedScale * e.scale` / `savedTx + e.translationX`. RNGH yields per-gesture deltas, not absolutes — the saved-state pattern makes consecutive pinches/pans accumulate. Spring-back below `ZOOM_THRESHOLD` resets all snapshots.
- **Gesture composition in theater.** Single `<GestureDetector>` composing `Simultaneous(pinch, pan, Exclusive(longPress, doubleTap, tap))`. `tap.requireExternalGestureToFail(doubleTap)` is what waits out the double-tap window. Pan branches in-body on `scale.value > 1.001` (zoomed = translate; unzoomed = pick dominant axis: horizontal nav at width/4 or vx 800; vertical-down dismiss at 120px or vy 900).
- **Asset-swap reset effect.** Theater watches `asset.id` and resets `scale`/`tx`/`ty`/`pageX`/`dismissY` plus saved-state values — without this, swiping next-photo would inherit prior pan/zoom state.
- **S-17 single effect.** Screen-level `useEffect` watching `(assets, currentIndex)`; if `currentIndex === -1` after cache invalidation or our own optimistic delete, advance to `assets[lastKnownIndexRef.current]` clamped, or pop on empty. One pathway covers menu-driven delete, external delete, and iCloud-miss skips.
- **Two-layer cross-fade in theater-viewer.** `slotA`/`slotB` `<Image>` layers ping-pong via `frontIsA` flag. On `asset.id` change, back layer paints with the incoming asset and fades in over `slideTransition === 'cross-fade'` ? 400ms : 0ms; `runOnJS(setFrontIsA)` flips ownership only after `withTiming` resolves.
- **Photo cache reuses gallery thumbnails.** Tap-to-theater feels instant because `expo-image` already has the URI memory-cached from the gallery — `cachePolicy="memory-disk"` + `recyclingKey={asset.id}` on both surfaces. Maintain this on any new photo-rendering surface.

### Platform / UI quirks
- **`LIMITED = "limited" as PermissionStatus`** in `lib/permission.ts` — workaround for `expo-modules-core`'s `PermissionStatus` enum lacking `LIMITED`, which iOS still returns at runtime.
- **Single-confirmation delete on iOS + Android ≥11.** App-level `Alert` is skipped whenever the OS will show its own dialog (iOS `deleteAssetsAsync` system dialog; Android ≥11 `MediaStore.createTrashRequest`). Only Android <11 shows app-level `Alert.alert`. The platform gate lives in `lib/delete-confirm.ts:confirmDeleteIfNeeded`. **This deviates from DS-35 as originally written** — see git log.
- **MorphingPill `+60pt` clearance.** Uses `useSafeAreaInsets().bottom + 60` because Expo Router's `unstable-native-tabs` doesn't expose tab-bar height. Tunable on dogfooding.
- **`BottomSheetModalProvider`** mounts between `SafeAreaProvider` and `<SplashGate>` so sheets can present from anywhere in the tabs.
- **`<RootBridges>`** consolidates the cross-cutting AppState reactors (`usePermissionAppStateRefetch` + `useLibraryChangeSubscription` + `useToastAppStateCommit`) as one bridge component sibling to providers. New AppState reactors should go through `useAppStateListener((next, prev) => ...)`, not `AppState.addEventListener` directly.
- **Smart-album noise.** iOS `getAlbumsAsync` includes Recents/Selfies/etc. Surfaced as-is; revisit if dogfooding finds the list cluttered.

## Recent build milestones

Use `git log` for the canonical record. This list is just so a fresh session knows the rough shape of work-to-date:

| Phase | Scope | Doc commit |
|---|---|---|
| 0 | `theme/`, persisted Zustand stores, `lib/` adapters, splash gate, perf rig | (initial setup, see `48a8728`) |
| 1 | Permission & onboarding flow | `9efd7fa` |
| 2 | Gallery walking skeleton (FlashList tapestry, infinite query, seeded shuffle) | `5a114a0` |
| 3 | Albums view & favorites (Favorites synthesized, derived from `'all'` cache) | `5af263a` |
| 4 | Selection mode & bulk actions (drag-extend, morphing pill, pull-to-shuffle) | `83ea29c` |
| 5 | Theater viewer — paused state (custom Reanimated swiper after Galeria reject) | `12c4a55` |
| 6 | Slideshow engine — autoplay, transitions, lifecycle | *(working tree, uncommitted)* |

**Phase 7 next per PRD §Timeline:** slideshow extras — source picker glass sheet (DS-27), shake-to-shuffle (S-13/S-14, `useShakeToShuffle` + 1.5s debounce), gesture-guide overlay on first slideshow (DS-19, gated by AsyncStorage `seenSlideshowGuide`), `Slideshow these N` actions-sheet row (`useStartSlideshowFromSelection`).

**D-2 perf measurements deferred** per project owner; rig is in place (see `docs/perf-rig.md`) for any future regression check.

## Current build context — Phase 6 (Slideshow engine, in working tree as of 2026-05-10)

Static checks (lint, tsc, iOS bundle export) clean; on-device walkthrough pending. The pill's Shuffle tap now starts a slideshow; tap-center in theater toggles play/pause; queue advances on the per-slide duration; cross-fade or hard-cut transitions per `slideTransition` preference; hairline progress bar at the top edge while playing; keep-awake while playing; pause on background with no auto-resume on return; silent skip on missing/failed assets; silent reshuffle at queue exhaustion.

Phase 6 added (key files):
- `state/slideshow-store.tsx` — route-scoped store, `scheduleNext()` is the centralized SM-10 timer
- `actions/use-start-slideshow.ts` — pill-Shuffle entry point (computes queue head against current seed, routes with `autoplay=1`)
- `hooks/use-app-state-listener.ts` — generic primitive; consolidates the three prior AppState consumers
- `hooks/use-app-state-pause.ts` — D-9 / SM-10γ landing (pause on `inactive`/`background`, never auto-resume)
- `hooks/use-keep-awake-while-playing.ts` — S-15, tag-scoped (`'dust-off.slideshow'`)
- `components/theater-progress-bar.tsx` — hairline 1px white bar, generation-driven re-sweep

**Anchor-vs-no-anchor entry contract** — tap-a-photo: anchor pins the tapped photo at queue head, autoplay off. Pill-Shuffle: no anchor, autoplay on. Both paths share the route shape `(assetId + kind + optional albumId + autoplay)`.

Deferred from Phase 6 (intentionally — flagged so they aren't lost):
- **Shake-to-shuffle (S-13/S-14)** → Phase 7. The slideshow store's exhaustion-reshuffle path is the action target.
- **Source picker glass sheet (DS-27)** → Phase 7. Currently the pill always shuffles its current scope (All / Favorites / [Album]).
- **Gesture-guide overlay on first slideshow (DS-19)** → Phase 7, gated by AsyncStorage `seenSlideshowGuide`.
- **`Slideshow these N` actions-sheet row** → Phase 7 with `useStartSlideshowFromSelection`.
- **Reduce Motion gating** on the cross-fade and 250ms lights-dim → Phase 8 with a broader `useReducedMotion()` hook.
- **Haptics preference-toggle** inside `lib/haptics.ts` (wrapper exists; preference-gating is what's missing) → Phase 8.
- **Pre-decode of next asset** before the cross-fade starts → polish post-dogfooding.
- **iCloud download spinner + 2s timeout (D-3)** → Phase 9. iOS Optimize Storage misses currently fall through to `onImageError → skipUnavailable` silently.
- **Focal-point pinch zoom**, **pan-bounds clamping when zoomed**, **DS-31 jumble-during-pull**, **DS-4 hide-on-scroll for the pill**, **bulk-unfavorite UI inside Favorites** — polish post-dogfooding (`useBulkUnfavorite` exists, no surface invokes it).
