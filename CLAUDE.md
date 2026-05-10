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
- **iOS bulk-delete = single confirmation.** Skipping the app-level `Alert` on iOS means cancel-restore from the system dialog flicker is the *only* failure mode (SM-13's accepted <500ms). Android shows the app-level alert plus, on API ≥30, the system delete dialog — explicit user choice locked during planning.
- **`Favorite all` from inside Favorites.** Currently a no-op (already favorited). Bulk-unfavorite UI deferred; the hook exists for when a Favorites-specific action sheet lands.

Deferred from Phase 4 (intentionally — flagged so they aren't lost):
- DS-36 anticipatory long-press ring → Phase 5 alongside theater long-press menu (commit feedback in Phase 4 = haptic only, no scale animation since RNGH long-press composition swallowed the Pressable-driven scale).
- DS-31 jumble-during-pull animation on pull-to-shuffle → polish post-Phase-7. Phase 4 ships standard `RefreshControl` snap-and-release.
- DS-4 hide-on-scroll for the morphing pill → polish; the pill always renders for now.
- "Slideshow these N" actions-sheet row → Phase 7 with `useStartSlideshowFromSelection`.
- Long-press source picker on the pill (DS-5 override) → Phase 7.
- `useFavoritePhoto` (single-tile, double-tap) → Phase 5/6 with theater double-tap.
- Bulk-unfavorite UI inside Favorites album → revisit with dogfooding (hook exists, no surface invokes it).

Phase 0 deliverables (`theme/`, the persisted Zustand stores, `lib/` adapters, splash gate primitive, perf rig) remain available.

**D-1 resolved 2026-05-09: Galeria PASS** — `@nandorojo/galeria` stays for the Phase 5 photo viewer. DS-12 (unified-viewer-as-paused-theater) still needs to be reconciled with Galeria's lightbox model when Phase 5 plans; tracking note in `docs/perf-baseline-phase0.md`. **D-2 perf measurements deferred** per project owner; the rig is in place (see `docs/perf-rig.md`) for any future regression check.

Phasing per PRD §Timeline: Phase 5 = photo viewer (theater, paused). Use `git log` for the current commit boundary instead of relying on this paragraph.
