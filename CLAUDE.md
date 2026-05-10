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

**Phase 3 (Albums view & favorites) implementation landed 2026-05-09; on-device walkthrough pending.** Static checks (lint, tsc, iOS bundle export) clean. The Albums tab now lives in a route-folder (`(tabs)/albums/{_layout,index,[albumId]}.tsx`) — a Stack inside the tab. Listing renders a synthesized **Favorites** entry pinned first followed by device albums alphabetical (DS-14). Tapping any tile drills into a per-album gallery that reuses Phase 2's `<GalleryGrid>` + `<SortStrip>`.

Phase 3 added:
- **Data layer.** `queries/use-albums-query.ts` (plain `useQuery`, libraries are <100 albums). `queries/use-album-cover-query.ts` (lazy per-tile `getAssetsAsync({ album, first: 30 })` + deterministic pick via `pickIndexFromSeed`, keyed on `(albumId, seed)` so cold-start reseeding invalidates last session's covers automatically; `gcTime: 5 min` bounds the cross-session cache). `queries/use-assets-query.ts` is now narrowed to a `AlbumOrAllSource` discriminant (`{ kind: "all" } | { kind: "album"; albumId }`); the album code path passes `album` through to `getAssetsAsync` natively. **Favorites is a sibling hook**, `useFavoritesAssetsQuery`, colocated in the same file: it `useInfiniteQuery`-subscribes to the same `'all'` queryKey (TanStack dedupes — single fetch shared with gallery + splash gate) and returns a flat `Asset[]` filtered by `useFavoritesStore.favorites`. There is no native MediaLibrary "favorites" surface and our store keys by asset ID, so favorites is necessarily a derived view of `'all'`. The split (vs a `kind: "favorites"` shim inside `useAssetsQuery`) is deliberate — it keeps RQ shapes honest, makes the cache subscription real instead of opaque, and removes a leaky `usePrefetchAllAssetPages` corner.
- **Lib.** `lib/seeded-shuffle.ts` gained `pickIndexFromSeed(scope, seed, length)` (FNV-1a string hash xor'd with seed → Mulberry32 → mod length). Same `(scope, seed, length)` is stable within a session and reseeds on cold start. `lib/source-set.ts` exports `FAVORITES_ALBUM_ID = "@dust-off/favorites"` as the dynamic-route sentinel for the Favorites tile. `lib/media-library.ts` mock now honours `options.album` by filtering on the `albumId` field already present in the mock JSON — preserves D-2 perf-rig parity.
- **Hooks.** `hooks/use-favorites-cover.ts` delegates to `useFavoritesAssetsQuery` and picks one match via `pickIndexFromSeed(FAVORITES_ALBUM_ID, seed, matches.length)`. Routing through the query hook (rather than an opaque `queryClient.getQueryData` read) makes the cover reactive to `'all'`-cache resolution after the Albums tab has already mounted.
- **Strings.** `albums` group added to `lib/strings.ts` — `favoritesTitle` and `tileA11y`. Counts use the existing `gallery.formatCount` (no separate albums copy — the formatter is voice-neutral).
- **Components.** `components/{album-tile,albums-grid}.tsx`. The tile is a discriminated union (`favorites` | `album`) — the empty-Favorites visual variant (Lucide `Heart` outline at 32pt centred on a faint surface tint, no thumbnail per DS-14) is a static branch, not a runtime `count === 0` check. Cover image rendering is shared via a small inner `<CoverPhoto asset={...}/>` so `transition`/`cachePolicy`/`recyclingKey`/`absoluteFill` invariants live in one place. Each tile owns its cover query subscription; FlashList recycling moves subscriptions with the viewport, and TanStack Query's cache makes scrollback free. No row-stagger reveal — DS-24's choreography stays reserved for the gallery's identity moment; Albums covers fade in via `expo-image`'s `transition` prop.
- **Routing.** `(tabs)/albums.tsx` leaf replaced by `(tabs)/albums/{_layout,index,[albumId]}.tsx`. Native Tabs already references `name="albums"` as a segment, so the swap is transparent. The drill-in route uses Expo Router typed-routes object form: `router.push({ pathname: "/albums/[albumId]", params: { albumId } })`. The drill-in screen calls **both** `useAssetsQuery` and `useFavoritesAssetsQuery` unconditionally (rules of hooks) with `{ enabled: !isFavorites }` and `{ enabled: isFavorites }` respectively; the active branch's data is consumed. `isFirstReveal={false}` is hard-coded — no per-album row-stagger. The Albums listing screen passes `allQuery.data?.pages?.[0]?.totalCount` to `<PartialAccessBanner>` (assets count, not album count — matches the banner copy "X of Y photos shared").

Deferred from Phase 3 (intentionally):
- Slideshow-from-album launch — Phase 6.
- Library-change subscription — still on the Phase 4 list with bulk-delete invalidation.
- Bulk favorite/unfavorite UX inside the Favorites album — Phase 4 selection.
- Smart-album filtering on iOS — `getAlbumsAsync` includes Recents/Selfies/etc. Surface as-is for now; revisit if dogfooding finds the list cluttered.
- Favorites cover may briefly show the empty heart variant on cold start while the `'all'` prefetch is in flight; soften with `expo-image` transition for now and gate on prefetch completion only if it bothers in dogfooding.

**Phase 4 (Selection mode & bulk actions) implementation landed 2026-05-09; on-device walkthrough pending.** Static checks (lint, tsc, iOS bundle export) clean. Long-press → drag-extend selection on the gallery + album-detail; bulk favorite/delete via the morphing pill's `Actions · N` glass sheet; pull-to-shuffle commits sort to Random with anchor preservation. The PRD's "Curation" user-story group is now executable end-to-end.

Phase 4 added:
- **State.** `state/{selection-store,toast-store}.ts`. Selection store is transient: a `Set<string>` of selected IDs plus `anchorId` / `preDragSelectedIds` snapshot for rubber-band drag-extend (Apple-Photos semantics — moving target back contracts the range automatically because each `extendTo` derives fresh from the pre-drag snapshot). Cap (1000) is enforced inside `enter`/`extendTo`/`toggle`; `capToastFiredThisDrag` is the one-shot per-drag flag. Toast store is single-slot with a shared timer ref; `show()` auto-commits prior pending state per SM-11. `state/gallery-store.ts` extended with `anchorIds: ReadonlySet<string> | null` + `reshuffle(anchorIds?)` action — anchors live alongside the seed and persist until the next reshuffle (one-shot per session).
- **Actions.** `actions/{use-bulk-favorite,use-bulk-delete,use-reshuffle-gallery}.ts`. Bulk favorite eager-applies via `useFavoritesStore` and shows `Saved. · Undo` for 3s; Undo removes the just-added IDs (snapshot at action time, not at undo time). Bulk delete: Android shows app-level `Alert.alert` with `getDeleteConfirm(count)`; iOS skips it and lets `MediaLibrary.deleteAssetsAsync` show the system dialog. Optimistic mutation goes through `queryClient.setQueryData(['assets', sourceSetKey({kind:'all'})], ...)` filtering deleted IDs out of every cached page; the snapshot is restored on cancel/throw (SM-13's accepted ≤500ms flicker on iOS dialog cancel). The Favorites view re-derives from the same `'all'` cache via `useFavoritesAssetsQuery`, so a single cache mutation fans out to both surfaces. Reshuffle commits sort to Random in `usePreferencesStore` then bumps the seed + stashes anchors; a `Reshuffled.` toast lasts 1.5s. `useBulkUnfavorite` is wired but currently has no UI surface (revisit with dogfooding).
- **Hooks.** `hooks/use-pill-state.ts` returns `'shuffle' | 'actions' | 'toast' | 'hidden'` derived from selection size + toast presence (no dedicated pill store per SM-7). `hooks/use-pill-context-label.ts` resolves the visible string per scope. `hooks/use-library-change-subscription.ts` is the SM-6 deferral landing — `MediaLibrary.addListener` debounced 500ms, foreground-only (subscribes on `AppState→active`, unsubscribes on `background`), invalidates `['assets']` with `refetchType: 'active'` (slideshow-immune by virtue of the unmounted query being inactive). `hooks/use-toast-app-state-commit.ts` commits any pending undo state on `AppState→background` per SM-11.
- **Lib.** `seededShuffle` widened to `seededShuffle<T>(items, seed, opts?: { anchorIds?: ReadonlySet<string>; idOf?: (t) => string })` (SM-14a). When `anchorIds` is provided, items partition into `anchored` (input order preserved) + `rest` (shuffled), and the result is `[...anchored, ...rest]`. `lib/delete-confirm.ts` exports `getDeletePlatform()` (iOS / android-new ≥30 / android-old) and `getDeleteConfirm(count, platform?)` returning the DS-35 platform-branched dialog copy.
- **Strings.** `lib/strings.ts` gained `selection`, `pill`, `actionsSheet`, `toast`, `deleteConfirm` groups. Voice splits per DS-17: sparse-poetic for toast (`Saved.` `Gone.` `Reshuffled.`), neutral-utility for actions sheet rows + selection chrome + delete confirmation copy.
- **Components.** `components/{morphing-pill,actions-sheet}.tsx` are new. `<MorphingPill>` is a `BlurView`-tinted bottom-floating pill positioned via `useSafeAreaInsets().bottom + 60` clearance over the native tab bar (no JS API to query NativeTabs height — tunable on dogfooding). It renders four mutually exclusive contents per `usePillState()`: Shuffle (Lucide `Sparkle` 2px stroke + context label, tap is **no-op until Phase 6**), Actions (`Actions · N` opens `<ActionsSheet>`), Toast (`Saved. · Undo` / `Gone.` / `Reshuffled.`), Hidden (returns `null` — reserved for theater). `<ActionsSheet>` reuses the existing `<Sheet>` and exposes `Favorite all` + `Delete all` only (`Slideshow these N` deferred to Phase 7). `<GalleryTile>` gained `selected` + `onPress` props — selected tiles render a 2px amber inset border + amber filled-circle `Check` badge (DS-18); non-selected unchanged (no dim — keeps the gallery photo-forward). `<SortStrip>` gained `selectionCount` + `onCancel` — when count > 0 it morphs to `<count> selected` on the left and `×` on the right (replaces the centered sort affordance per DS-18). `<GalleryGrid>` is the integration point: it owns the long-press → drag-extend gesture (`Gesture.Pan().activateAfterLongPress(300)` from `react-native-gesture-handler` 2.x); `onStart` commits the anchor + medium haptic, `onUpdate` extends via `idAtPoint(x, y)` hit-testing against `cellSize × numColumns + scrollOffsetY`, `onEnd` clears `dragActive`. Tap in selection mode toggles via `useSelectionStore.toggle(id)`. `RefreshControl` triggers `onPullToShuffle(anchorIds)` where anchorIds = the topmost rendered row of the visible grid (heavy haptic at refresh-fire).
- **Screens.** `(tabs)/{index,albums/[albumId]}.tsx` mount `<MorphingPill>`, pass selection chrome props to `<SortStrip>`, wire pull-to-shuffle and the bulk-action callbacks. Both screens read `useGalleryStore.anchorIds` and pass it through to `seededShuffle`. The album-detail screen looks up `albumTitle` from `useAlbumsQuery` for the pill's `Shuffle [Album]` label (Favorites uses `strings.albums.favoritesTitle`).
- **Root layout.** `RootBridges` consolidated: `usePermissionAppStateRefetch()` + `useLibraryChangeSubscription()` + `useToastAppStateCommit()` all mount via one bridge component sibling to the providers.

Architectural notes (worth knowing on read-back):
- **Selection persistence.** Selection store is transient (no `persist` middleware) so it survives Gallery↔Albums tab switches (SM-12) and resets on cold start. Bulk-action completion explicitly calls `cancel()`.
- **Single shared anchor seed.** Both Gallery and Album-detail read `useGalleryStore.seed` + `anchorIds`. Pulling-to-shuffle in album-detail therefore reshuffles the main gallery too (intentional — same global seed). Anchor IDs from album-detail's visible row may end up pinned at the top of the main gallery's view if user switches tabs without another reshuffle; cosmetic only, not broken.
- **NativeTabs height approximation.** `MorphingPill` uses a fixed `+60pt` clearance because Expo Router's `unstable-native-tabs` doesn't expose tab-bar height. Dial in during dogfooding if the float looks off on either platform.
- **Single-confirmation delete on iOS + Android ≥11.** App-level `Alert` is skipped whenever the OS will show its own trash/delete dialog (iOS `deleteAssetsAsync` system dialog; Android ≥11 `MediaStore.createTrashRequest`). Only Android <11 shows the app-level `Alert.alert` because there's no OS-level confirmation on that path. The platform gate lives in `lib/delete-confirm.ts:confirmDeleteIfNeeded` — both `useBulkDelete` and `useDeletePhoto` consume it. Cancel-restore flicker (SM-13's accepted <500ms) now applies to both iOS and Android ≥11. **This deviates from DS-35 as originally written** (which said Android always shows the app-level Alert) — see Phase 5 notes for rationale.
- **`Favorite all` from inside Favorites.** Currently a no-op (already favorited). Bulk-unfavorite UI deferred; the hook exists for when a Favorites-specific action sheet lands.

Deferred from Phase 4 (intentionally — flagged so they aren't lost):
- DS-31 jumble-during-pull animation on pull-to-shuffle → polish post-Phase-7. Phase 4 ships standard `RefreshControl` snap-and-release.
- DS-4 hide-on-scroll for the morphing pill → polish; the pill always renders for now.
- "Slideshow these N" actions-sheet row → Phase 7 with `useStartSlideshowFromSelection`.
- Long-press source picker on the pill (DS-5 override) → Phase 7.
- Bulk-unfavorite UI inside Favorites album → revisit with dogfooding (hook exists, no surface invokes it).

**Phase 5 (Photo viewer — theater, paused state) implementation landed 2026-05-10; on-device walkthrough pending.** Static checks (lint, tsc, iOS bundle export) clean. Tap any gallery thumbnail → 250ms fade-through-black → photo letterboxed in pure-#000 theater (paused; slideshow autoplay is Phase 6). All single-photo gestures: tap-zones (left/right nav, center reveals chrome — Phase 6 wires play/pause), horizontal swipe nav, swipe-down dismiss, pinch+pan when zoomed, double-tap favorite + 3s `Saved. · Undo` toast, long-press contextual menu (Favorite / Delete / Info / Go to Folder).

**DS-12 reconciliation outcome: Galeria rejected, custom Reanimated swiper shipped.** D-1's spike PASS at week 1 was a feasibility check only — it didn't (and couldn't) verify the bespoke gesture set DS-12 demands. Galeria's sealed native modal forecloses an overlay slot for `<TheaterChrome>` (DS-13), in-modal long-press (S-10), tap-zones (DS-12), double-tap-favorite without colliding with Galeria's built-in zoom (S-11), and any play/pause hook for Phase 6. So the entire viewer surface is custom Reanimated 4 + RNGH 2.30. `@nandorojo/galeria` stays installed at zero runtime cost.

Phase 5 added:
- **Routing.** Sibling `theater/` route group at `src/app/theater/{_layout,[assetId]}.tsx`. The layout wraps `<Stack screenOptions={{ animation: "fade", contentStyle: { backgroundColor: "#000" } }}>` in `<ThemeProvider value={theaterTheme}>`. Nested fade + the root Stack's `animation: "fade"` together implement DS-10's 250ms "lights dim". URL: `/theater/{assetId}?kind=all|favorites|album&albumId=...`. Gallery + album-detail screens push via `router.push({ pathname: "/theater/[assetId]", params })`. Go-to-Folder uses `router.replace({ pathname: "/albums/[albumId]" })` to swap theater for the album view in one step.
- **Viewer surface.** `components/theater-viewer.tsx` is the load-bearing piece — single `<GestureDetector>` composing `Simultaneous(pinch, pan, Exclusive(longPress, doubleTap, tap))`. Pan branches in its body on `scale.value > 1.001`: zoomed → translate the image; unzoomed → pick dominant axis on first update (horizontal = nav at width/4 or vx 800; vertical-down = dismiss at 120px or vy 900). `tap.requireExternalGestureToFail(doubleTap)` is what waits out the double-tap window. Pinch + pan use the saved-state pattern (`savedScale`, `savedTx`, `savedTy` snapshotted on gesture begin, applied via `savedScale * e.scale` / `savedTx + e.translationX`) so consecutive gestures accumulate instead of resetting to 1× — RNGH yields per-gesture deltas, not absolutes.
- **Theater chrome + toast.** `components/theater-chrome.tsx` renders DS-13's top safe-area strip (`source · 47 of 248 · ×`) with auto-hide after 2s of inactivity (220ms fade) via Reanimated `withTiming`; an imperative `reveal()` ref handle is bumped on tap-zone hits, and `isSheetOpen` pauses the timer while the long-press menu or info sheet is up. `components/theater-toast.tsx` mounts at the same `safeAreaInsets.top + 8` slot as the chrome (mutually exclusive — chrome returns null while toast is up). Both consume the shared `<ToastPill>` (`components/toast-pill.tsx`), extracted from the morphing pill's old inline `ToastContent` so the pill aesthetic lives in one place.
- **Long-press menu + info sheet.** `components/theater-long-press-menu.tsx` and `components/photo-info-sheet.tsx` are both `<Sheet>`-wrapped `forwardRef<BottomSheetModal>` components. Rows in both are the new `<SheetRow>` primitive (`components/sheet-row.tsx`, `tone: 'default'|'destructive'`, `disabled` for Go-to-Folder when `albumId == null`) — also adopted by `<ActionsSheet>` for consistency. `<PhotoInfoSheet>` fetches EXIF via `useQuery(['asset-info', id])` against `MediaLibrary.getAssetInfoAsync`, **gated on `enabled: isOpen`** so it doesn't fire on every photo swipe. DS-32's field order is locked; `<InfoRow>` returns `null` on falsy values per G-14.
- **Long-press anticipatory ring (DS-36).** `components/long-press-ring.tsx` is a Reanimated SVG `<Circle>` with `useAnimatedProps` driving `cx`/`cy`/`r`/`opacity` against three shared values owned by the screen. `withTiming(1, { duration: 400 })` kicks on touch-down; commit snaps `progress = 0` (menu takes the visual); cancel springs `progress = 0` over 150ms. The ring is mounted at the screen level so it overlays the viewer.
- **Single-asset actions.** `actions/use-favorite-photo.ts` (and sibling `useUnfavoritePhoto`) mirror the bulk-favorite shape with idempotent guards, heavy haptic, and a 3s undo toast. `actions/use-delete-photo.ts` mirrors bulk-delete with a single-id signature and an `onAdvance` callback fired only after `deleteAssetsAsync` resolves truthy (so cancel-restore flickers but the visible photo doesn't pre-advance). The shared cache helpers (`applyOptimisticOmit`, `restoreCache`, `ALL_QUERY_KEY`) are lifted to `lib/delete-cache.ts`; the platform-gated app-Alert is consolidated into `lib/delete-confirm.ts:confirmDeleteIfNeeded` so callers don't repeat the gate.
- **Gallery integration.** `components/gallery-tile.tsx` `onPress` now fires when not in selection mode, calling a new `onOpen?(id)` prop forwarded from `<GalleryGrid>`. Both gallery screens push the theater route. The selection long-press Pan and the tile tap coexist by timing — Pressable's tap-up completes before the 300ms `activateAfterLongPress` threshold.
- **Strings.** `theater` group added to `lib/strings.ts` — `sourceLabel`, `formatPosition`, `longPressMenu`, `infoFields`, A11y labels.
- **Helpers.** `lib/route-params.ts` (`firstParam` for `useLocalSearchParams` normalization, used in 2+ screens), `lib/source-set.ts` gained `ViewerSourceKind` + `parseViewerSourceKind` (theater opens only from `'all'`/`'favorites'`/`'album'` — `union`/`ids` aren't valid entry kinds), `queries/use-albums-query.ts` gained `useAlbumTitle(id)` for the 3-site `find(...).title` lookup.
- **Phase 4 deferrals that landed here.** DS-36 anticipatory long-press ring (above) and `useFavoritePhoto` (single-tile, used by theater double-tap and the long-press Favorite row).

Architectural notes (worth knowing on read-back):
- **Theater is a sibling route group, not nested in `(tabs)`.** That's why `<MorphingPill>` (mounted inside `(tabs)/index.tsx` and `(tabs)/albums/[albumId].tsx`, not at root) doesn't render in theater. The `'hidden'` branch of `usePillState()` is therefore unreachable — kept parked, not exercised. Don't try to "fix" it.
- **Photo cache reuses gallery thumbnails.** Tap-to-theater feels instant because `expo-image` already has the URI memory-cached from the gallery render — `cachePolicy="memory-disk"` + `recyclingKey={asset.id}` on both surfaces.
- **Saved-state pinch pattern.** `theater-viewer.tsx`'s pinch/pan-when-zoomed uses RNGH's standard "snapshot at gesture begin + delta during update" idiom. `e.scale` is per-gesture, not absolute — the saved-state pattern makes consecutive pinches/pans accumulate. Spring-back below `ZOOM_THRESHOLD` resets all snapshots so the next pinch starts fresh from 1×.
- **EXIF query gated on sheet-open.** `<PhotoInfoSheet>` re-renders on every photo swipe (parent re-renders); the `useQuery({ enabled: isOpen })` guard avoids a `getAssetInfoAsync` call per nav. `isOpen` is local to the sheet, driven by `<Sheet>`'s `onChange`.
- **Asset-swap reset effect.** `theater-viewer.tsx` resets `scale`/`tx`/`ty`/`pageX`/`dismissY` (and saved-state values) on `asset.id` change — without this, swiping next-photo would inherit the prior photo's pan/zoom state.
- **S-17 handling is one effect.** The screen runs `useEffect` watching `(assets, currentIndex)`; if `currentIndex === -1` after `useLibraryChangeSubscription` invalidates the cache (or after our own optimistic delete), it advances to `assets[lastKnownIndexRef.current]` clamped, or pops the route on empty. Single pathway covers menu-driven delete, external delete, and iCloud-miss skips.

Deferred from Phase 5 (intentionally — flagged so they aren't lost):
- Tap-center play/pause toggle → Phase 6 (currently a no-op stub that only reveals chrome).
- Pre-rendered N±1 cross-fade between photos → Phase 6. Phase 5 renders only the current page; horizontal-swipe-commit hops `currentId` (visible hard cut, accepted).
- Hairline 1px progress bar at the very top edge while playing (DS-13) → Phase 6 (paused-only Phase 5 doesn't render it).
- Reduce Motion gating on the 250ms "lights dim" fade → Phase 8 with the broader `useReducedMotion()` hook.
- Haptics-toggle wrapper on `expo-haptics` calls → Phase 8. Phase 5 calls `heavyTap()` directly per current convention.
- Focal-point pinch zoom (zoom into pinch center, not image center) → polish post-dogfooding. Currently zooms around the layout origin.
- Pan-bounds clamping when zoomed (don't let the user drag the image entirely off-screen) → polish post-dogfooding.
- "Slideshow this" / theater-launched slideshow → Phase 6.
- The dead `'hidden'` branch in `usePillState()` → leave parked; documents intent.

Phase 0 deliverables (`theme/`, the persisted Zustand stores, `lib/` adapters, splash gate primitive, perf rig) remain available.

**D-2 perf measurements deferred** per project owner; the rig is in place (see `docs/perf-rig.md`) for any future regression check.

Phasing per PRD §Timeline: Phase 6 = slideshow engine (autoplay, transitions, shake-to-shuffle, keep-awake). Use `git log` for the current commit boundary instead of relying on this paragraph.
