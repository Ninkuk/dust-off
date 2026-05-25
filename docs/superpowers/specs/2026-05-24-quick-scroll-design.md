# Quick-scroll for long photo grids — design

**Status:** approved, ready for implementation planning
**Date:** 2026-05-24
**Scope:** `src/components/gallery-grid.tsx` and its two call sites (`(tabs)/index.tsx` and `(tabs)/albums/[albumId].tsx`)

## Goal

Make long photo grids (hundreds–thousands of items) navigable without finger-flicking. Add a draggable scrub bar on the right edge and a smart-direction jump FAB at the bottom-trailing corner. Coordinate with the existing bottom `MorphingPill` so floating chrome never collides.

## Non-goals

- Date section headers in the grid. The data stays a flat `Asset[]`; the bubble derives its label from the asset under the thumb.
- Search, filter, or any non-scroll navigation. This spec is purely a quick-navigation layer over the existing list.
- Reworking selection mode or the `MorphingPill` morph states beyond adding one hide branch.

## Constraints

- The grid is a single `FlashList` (`@shopify/flash-list` v2). Cell size is uniform (`width / numColumns`), so scroll offset math is trivial.
- The displayed list order depends on `sortMode` from `usePreferencesStore`: one of `random`, `newest`, `oldest`, `name`. A date-bubble label is only honest in the chronological modes.
- Reanimated v4 and Gesture Handler v2.30 are available — UI-thread scroll tracking and worklet-side `scrollTo` are the performance baseline.
- Editorial Ink tokens (`ink.surface`, `ink.hairline`, `ink.textPrimary`, `ink.textMuted`, `ink.accent`) are deliberately fixed dark and do NOT route through `useTheme()`. All new floating chrome uses these directly, same as `InkPill`.
- User-global preference: do not commit changes without explicit instruction.

## Architecture

### New component: `src/components/quick-scroll.tsx`

A sibling overlay mounted inside `<GalleryGrid>`, absolutely positioned. Owns:

- Right-edge scrub track + thumb
- Drag bubble (`InkPill` size `chip`, label adapts to sort mode)
- Bottom-trailing single jump FAB with smart direction
- Auto-hide idle timer (1.5s)

Props:

```
type QuickScrollProps = {
  scrollY: SharedValue<number>;            // live UI-thread scroll offset
  contentHeight: SharedValue<number>;      // total list height
  viewportHeight: SharedValue<number>;     // list viewport height
  animatedRef: AnimatedRef<FlashList>;     // for worklet scrollTo and JS scrollToOffset
  assets: Asset[];                         // bubble lookup (chronological label)
  sortMode: "random" | "newest" | "oldest" | "name";
  selectionActive: boolean;                // suppresses jump FAB when true
};
```

The component is self-contained — it reads scroll state, writes the `jumpVisible` zustand store, and renders nothing when the list is too short.

### New store: `src/state/gallery-scroll-store.ts`

```
type GalleryScrollStore = {
  jumpVisible: boolean;
  setJumpVisible: (b: boolean) => void;
};
```

Written by `<QuickScroll>` on visibility transitions only. Read by `<MorphingPill>` to drive a hide branch. Reset on `<QuickScroll>` unmount.

### Modifications: `src/components/gallery-grid.tsx`

- Replace `scrollOffsetYRef` with `useSharedValue(0)`. The selection drag handlers (`idAtPoint`, `handleLongPressStart`, `handleExtend`) currently run on the JS thread inside `runOnJS(...)` callbacks from the gesture worklet — they switch from reading `scrollOffsetYRef.current` to reading `scrollY.value` (safe in JS context).
- Add `const animatedRef = useAnimatedRef<FlashList>()` and pass it to `<FlashList ref={animatedRef}>`.
- Replace JS `onScroll` with `useAnimatedScrollHandler({ onScroll: e => { scrollY.value = e.contentOffset.y } })`. No JS round-trip needed per scroll event; the selection code reads `scrollY.value` on demand inside its existing JS handlers.
- Capture content + viewport sizes via `onContentSizeChange` and `onLayout` into shared values.
- Subscribe to `useSelectionStore(s => s.selectedIds.size > 0)` and pass it as `selectionActive` to `<QuickScroll>`.
- Render `<QuickScroll />` as a sibling of `<FlashList>` inside the existing `<GestureDetector>`.

### Modifications: `src/components/morphing-pill.tsx`

- Subscribe to `useGalleryScrollStore(s => s.jumpVisible)`.
- Add one hide branch: when `jumpVisible && selectionCount === 0`, render `null` (or fade through existing transition machinery — to be decided in implementation plan).

### Modifications: `src/theme/motion.ts`

- Add `shellMotion.quickScrollIdle = 1500` if no equivalent token exists.

No changes to either screen file (`(tabs)/index.tsx`, `(tabs)/albums/[albumId].tsx`). The store-based MorphingPill coordination keeps the screens untouched.

## Behavior

### Scrub bar

- **Resting:** invisible.
- **Visible:** after the first scroll event, fades back out after 1.5s of idle.
- **Track:** ~3pt wide hairline on the right edge, inset 8pt from edge, vertical extent equals list viewport minus top SortStrip and bottom MorphingPill safe areas.
- **Thumb:** 28pt tall, 6pt wide, fully rounded, `ink.surface` background with `ink.hairline` border. Position derives from `scrollY / (contentHeight - viewportHeight)` on the UI thread.
- **Hit-slop:** ~28pt wide, larger than the visible thumb, for thumb-friendly grabbing.
- **Drag bubble:** appears to the left of the thumb during active drag.
  - `InkPill` size `chip`, `tabularNums` typography, ~80pt min width.
  - `sortMode === "newest" | "oldest"` → `"May 2024"` style label from `Asset.creationTime` of the asset under the thumb.
  - `sortMode === "random" | "name"` → `"23%"` position label.
  - `Asset.creationTime` missing or `0` → fall back to percentage for that asset.
- **Animation:** bubble fades in on drag-start (~120ms), tracks thumb Y, fades out on drag-end (~180ms). Light haptic on drag-start.
- **Drag mechanics:** `Gesture.Pan()` on the thumb hit-slop area. `onUpdate` worklet computes target offset and calls Reanimated `scrollTo(animatedRef, 0, computedY, false)` directly — no JS round-trip.

### Jump FAB

- **Single circular FAB** at bottom-trailing corner. Size ~44pt diameter. `ink.surface` background, `ink.hairline` border. Lucide icon (`ArrowUp` / `ArrowDown`), `ink.textPrimary` color.
- **Smart direction:**
  - `scrollY > viewportHeight * 0.5` → icon `ArrowUp`, tap = `scrollToOffset({ offset: 0, animated: true })`.
  - `scrollY <= viewportHeight * 0.5` AND `contentHeight > viewportHeight * 3` → icon `ArrowDown`, tap = `scrollToOffset({ offset: contentHeight - viewportHeight, animated: true })`.
  - Otherwise → not rendered.
- **Visibility threshold:** first appears when `scrollY > viewportHeight * 2`. Stays visible while scrolling, hides after 1.5s of idle (shared timer with the scrub bar).
- **At-the-top trick:** after a successful scroll-to-top in a long list (`contentHeight > viewportHeight * 3`), the FAB stays visible for ~2.5s showing `ArrowDown`. This gives the "jump to bottom" affordance a discoverable window before fading.
- **Selection mode:** suppressed when `selectionCount > 0`. Scrub bar stays visible — still useful while selecting.
- **Haptics:** light tap on press. `mediumTap` from `lib/haptics.ts` is too heavy here; use `lightTap` (add if needed) or the existing `tap` token.

### Coordination with `MorphingPill`

- When `jumpVisible && selectionCount === 0` → `MorphingPill` returns `null` (or transitions out — implementation plan decides).
- When `selectionCount > 0` → `MorphingPill` morphs to selection-actions mode regardless of `jumpVisible`. Selection always wins.

### Hide rules summary

| State | Scrub bar | Jump FAB | MorphingPill |
|---|---|---|---|
| Idle at top | hidden | hidden | visible |
| Scrolling | visible | hidden until past 2vh | visible |
| Scrolled past 2vh | visible | visible (`ArrowUp`) | **hidden** |
| At top of long list, post-scroll-to-top | visible (idling) | visible (`ArrowDown`, ~2.5s) | hidden during the window |
| Selecting | visible | hidden | visible (morphed) |
| Short list (< 1.5vh) | never renders | never renders | visible |

## Performance

- **UI-thread scroll tracking:** `useAnimatedScrollHandler` writes `scrollY` directly on the UI thread. Thumb position and FAB opacity are UI-thread `useAnimatedStyle` reads — no JS hops during scroll or scrub.
- **UI-thread scrubbing:** `Gesture.Pan().onUpdate(...)` worklet calls Reanimated's `scrollTo(animatedRef, 0, y, false)` to drive the FlashList without crossing to JS. `animated: false` because the gesture is itself continuous motion.
- **Bubble label updates:** the label string IS a JS value, so it crosses threads. Bucketed via `useDerivedValue`:
  - Date mode: bucket by month boundary (so the label only updates when the month under the thumb changes).
  - Percentage mode: bucket by 1% steps.
  - Typical scrub touches 20–50 buckets, each triggering one `runOnJS` setState call — well under JS budget.
- **Jump FAB icon swap:** `useDerivedValue` watches direction threshold crossings only and `runOnJS(setDirection)` on transitions. Opacity is UI-thread.
- **`jumpVisible` zustand write:** `runOnJS(setJumpVisible)` on visibility transitions only (not per scroll event).
- **Auto-hide timer:** JS `setTimeout`. Cancelled on scroll burst start via a single `runOnJS(resetIdleTimer)` call. Cheap.

## Edge cases

- **Short list** (`contentHeight < viewportHeight * 1.5`): `<QuickScroll>` early-returns `null`. Nothing mounts. `MorphingPill` stays visible.
- **`contentHeight` not yet known** (initial render before `onContentSizeChange`): shared value starts at 0 → `<QuickScroll>` returns `null` until first layout writes a real value.
- **Sort changes mid-session** (`random` → `newest` etc.): `sortMode` prop is reactive; bubble label source switches immediately. Thumb position is purely positional and remains correct.
- **`Asset.creationTime === 0` or missing:** fall back to percentage label for that asset only. No crash.
- **First reveal** (`isFirstReveal` true on the main gallery): `<QuickScroll>` does not render until first user scroll, so it doesn't compete with the tile-reveal animation.
- **Theater open:** `<QuickScroll>` lives in the gallery layer, unmounted while Theater is up. No conflict.
- **Pull-to-shuffle:** `scrollY` briefly goes negative during pull-to-refresh. Thumb position must be clamped to `[0, trackHeight]`.
- **Selection mode entering while jump FAB is visible:** FAB fades out, `MorphingPill` morphs in (selection wins). Visibility-state transitions must handle the simultaneous flip without flicker.

## Testing

Manual only (project has no existing test files for components, so this matches convention):

- **Long album, chronological sort:** seed iOS sim with ~1000 photos via `scripts/seed-ios-simulator.sh`. Confirm scrub feels 60fps on a real device or fast sim, bubble shows correct "Mon YYYY", jump FAB `ArrowUp` appears past 2vh, `ArrowUp` → `ArrowDown` trick fires at top of long list.
- **Long album, random sort** (the main gallery): scrub bubble shows percentage, not date.
- **Short list** (~10-item album): no scrub bar, no FAB, MorphingPill always visible.
- **Selection mode:** enter selection → jump FAB hides, MorphingPill stays in morphed state. Scrub bar still works.
- **Pull-to-shuffle:** thumb does not overshoot during pull. Bubble does not appear from the pull motion alone.
- **iOS + Android:** both platforms (seed scripts exist for both).
- **Light + dark theme:** Editorial Ink chrome looks identical regardless. SortStrip + MorphingPill alignment unchanged.

## Files affected

```
new   src/components/quick-scroll.tsx              ~200 lines
new   src/state/gallery-scroll-store.ts            ~10 lines
edit  src/components/gallery-grid.tsx              shared-value scroll + animated ref + mount QuickScroll
edit  src/components/morphing-pill.tsx             read jumpVisible; hide branch
edit  src/theme/motion.ts                          add quickScrollIdle: 1500 if missing
```

No changes to either screen file.

## Open implementation decisions

These intentionally defer to the implementation plan, not this spec:

- Whether `MorphingPill` hides via `return null` or via its existing transition machinery (visual call — best decided when looking at the morph code).
- Whether `lib/haptics.ts` needs a new `lightTap` export, or the existing `tap` token is sufficient for the FAB.
- Exact `Easing` curves for the FAB enter/exit and bubble fade — pick from `theme/motion.ts` tokens during implementation, or add new tokens if none fit.
