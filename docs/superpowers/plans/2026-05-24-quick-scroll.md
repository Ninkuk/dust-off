# Quick-Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right-edge draggable scrub bar with sort-mode-adaptive bubble label, and a single smart-direction jump FAB at bottom-trailing, to make long photo grids navigable. Coordinate with the existing `MorphingPill` so floating chrome never collides.

**Architecture:** New `<QuickScroll>` overlay component mounted inside `<GalleryGrid>`. Existing grid converts ref-based scroll tracking to a Reanimated shared value and adds an animated ref to the FlashList for UI-thread `scrollTo`. A tiny zustand store carries the `jumpVisible` boolean so `<MorphingPill>` can hide itself without prop drilling through two screen files.

**Tech Stack:** React Native (0.83.6) + Expo (~55.0.23), Expo Router, `@shopify/flash-list` v2, `react-native-reanimated` v4, `react-native-gesture-handler` v2.30, `zustand` v5, `lucide-react-native`. Editorial Ink tokens from `@/theme`.

**Spec reference:** `docs/superpowers/specs/2026-05-24-quick-scroll-design.md`

**Commit policy:** This project's user has a global "do not commit unless explicitly stated" rule. The commit steps below are written for completeness; **skip them unless explicitly told to commit**. The executor should still create logical commit checkpoints conceptually (e.g., complete-task boundaries) so that when commits are eventually authorized, the history can be reconstructed cleanly.

**Testing approach:** This project has no existing automated test files for components, so each task verifies through manual sim runs (`npm run ios` or `npm run android`). The seed scripts (`scripts/seed-ios-simulator.sh`, `scripts/seed-android-emulator.sh`) populate the device with enough photos to exercise long-list behavior.

---

## File Structure

**New files:**

| File | Responsibility |
|---|---|
| `src/components/quick-scroll.tsx` | Right-edge scrub bar + bottom-trailing jump FAB. Owns auto-hide, gesture handling, bubble rendering. Self-contained overlay. |
| `src/state/gallery-scroll-store.ts` | One-boolean zustand store (`jumpVisible`) bridging `<QuickScroll>` and `<MorphingPill>`. |

**Modified files:**

| File | Responsibility change |
|---|---|
| `src/components/gallery-grid.tsx` | Scroll tracking moves from `useRef` to `useSharedValue`. Adds `useAnimatedRef<FlashList>`. Switches to `useAnimatedScrollHandler`. Mounts `<QuickScroll>`. |
| `src/components/morphing-pill.tsx` | Reads `jumpVisible` from store; adds one hide branch when `jumpVisible && selectionCount === 0`. |
| `src/theme/motion.ts` | Adds `shellMotion.quickScrollIdle = 1500` if no equivalent exists. |

No changes to either screen file (`src/app/(tabs)/index.tsx`, `src/app/(tabs)/albums/[albumId].tsx`).

---

## Task 1: Add motion token + scaffold zustand store

**Files:**
- Modify: `src/theme/motion.ts`
- Create: `src/state/gallery-scroll-store.ts`

**Rationale:** Tiny prep work. Get the cross-cutting primitives in place before any UI code touches them.

- [ ] **Step 1: Read `src/theme/motion.ts` to see existing tokens and naming**

Run: open the file. Confirm there's a `shellMotion` object (or equivalent). If the structure differs, adapt the addition below to match.

- [ ] **Step 2: Add the `quickScrollIdle` token**

Add to whichever sub-object holds Shell-zone timing constants (likely `shellMotion`). If `shellMotion` exists as an object literal:

```typescript
export const shellMotion = {
  // ... existing tokens ...
  quickScrollIdle: 1500,
} as const;
```

If a similar token (~1500ms idle timeout for chrome) already exists, reuse it and skip this step — note the chosen token name to reference later in Tasks 5, 8.

- [ ] **Step 3: Create `src/state/gallery-scroll-store.ts`**

```typescript
import { create } from "zustand";

type GalleryScrollStore = {
  jumpVisible: boolean;
  setJumpVisible: (visible: boolean) => void;
};

export const useGalleryScrollStore = create<GalleryScrollStore>((set) => ({
  jumpVisible: false,
  setJumpVisible: (visible) => set({ jumpVisible: visible }),
}));
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to the new file or modified motion.ts. Pre-existing errors are fine.

- [ ] **Step 5: Commit (skip unless commits are authorized)**

```bash
git add src/state/gallery-scroll-store.ts src/theme/motion.ts
git commit -m "chore(state): add gallery-scroll store and quick-scroll idle token"
```

---

## Task 2: Convert `gallery-grid.tsx` scroll tracking to shared values + add animated ref

**Files:**
- Modify: `src/components/gallery-grid.tsx`

**Rationale:** Foundation for UI-thread scrub-bar tracking. Once `scrollY` is a shared value and FlashList has an animated ref, `<QuickScroll>` can drive it without any JS round-trip during scrubbing.

- [ ] **Step 1: Update imports**

Replace the current Reanimated import line with the expanded set. Find:

```typescript
import { runOnJS, useSharedValue, withTiming } from "react-native-reanimated";
```

Replace with:

```typescript
import {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
```

Also remove these now-unused React Native type imports (only if `handleScroll` is being removed too — see Step 4):

```typescript
type NativeScrollEvent,
type NativeSyntheticEvent,
```

Leave `RefreshControl` and `useWindowDimensions` imports intact.

- [ ] **Step 2: Replace the scroll-offset ref with a shared value and add the animated ref**

Find:

```typescript
const scrollOffsetYRef = useRef(0);
```

Replace with:

```typescript
const scrollY = useSharedValue(0);
const animatedRef = useAnimatedRef<FlashList<Asset>>();
```

(`useRef` may still be needed for `dragCapFiredRef` — leave that one untouched. If `useRef` is no longer used by anything else, remove it from the imports.)

- [ ] **Step 3: Update the `idAtPoint` function to read from the shared value**

Find:

```typescript
const absoluteY = y + scrollOffsetYRef.current;
```

Replace with:

```typescript
const absoluteY = y + scrollY.value;
```

(Reading `.value` of a shared value inside JS-thread code is safe and synchronous.)

- [ ] **Step 4: Replace the JS `handleScroll` with an animated handler**

Delete the entire `handleScroll` function:

```typescript
const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  scrollOffsetYRef.current = e.nativeEvent.contentOffset.y;
};
```

In its place (just below the other handlers — anywhere before the return), add:

```typescript
const animatedScrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
  },
});
```

- [ ] **Step 5: Update `handleRefresh` to read from the shared value**

Find:

```typescript
const top =
  cellSize > 0
    ? Math.max(0, Math.floor(scrollOffsetYRef.current / cellSize)) *
      numColumns
    : 0;
```

Replace `scrollOffsetYRef.current` with `scrollY.value`:

```typescript
const top =
  cellSize > 0
    ? Math.max(0, Math.floor(scrollY.value / cellSize)) * numColumns
    : 0;
```

- [ ] **Step 6: Wire the animated ref and animated scroll handler into `<FlashList>`**

Find the current `<FlashList>` JSX and update its props. The relevant lines:

```typescript
<FlashList
  data={assets}
  numColumns={numColumns}
  keyExtractor={(item) => item.id}
  onScroll={handleScroll}
  scrollEventThrottle={16}
```

Replace with:

```typescript
<FlashList
  ref={animatedRef}
  data={assets}
  numColumns={numColumns}
  keyExtractor={(item) => item.id}
  onScroll={animatedScrollHandler}
  scrollEventThrottle={16}
```

- [ ] **Step 7: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no new errors. If `useAnimatedRef<FlashList<Asset>>()` complains about the generic, fall back to `useAnimatedRef<FlashList<unknown>>()` and cast at use sites in later tasks. If `handleScroll`-related imports are now unused, remove them.

- [ ] **Step 8: Run the app and verify scrolling + selection still work**

Run: `npm run ios` (or `npm run android`)
Manual checks:
- Open the main gallery, scroll up and down. List scrolls smoothly.
- Long-press a tile, drag to extend selection across tiles. Selection respects scroll offset (i.e., dragging onto a tile that's halfway scrolled selects the correct tile).
- Pull-to-shuffle still works.

This is a zero-visual-change refactor; if anything looks different, something is wrong.

- [ ] **Step 9: Commit (skip unless commits are authorized)**

```bash
git add src/components/gallery-grid.tsx
git commit -m "refactor(gallery-grid): scroll tracking via shared value + animated ref"
```

---

## Task 3: Capture content height + viewport height as shared values

**Files:**
- Modify: `src/components/gallery-grid.tsx`

**Rationale:** `<QuickScroll>` needs to compute thumb position from `scrollY / (contentHeight - viewportHeight)`. Both must be reactive on the UI thread.

- [ ] **Step 1: Add two new shared values near the existing `scrollY` declaration**

Just below:

```typescript
const scrollY = useSharedValue(0);
const animatedRef = useAnimatedRef<FlashList<Asset>>();
```

Add:

```typescript
const contentHeight = useSharedValue(0);
const viewportHeight = useSharedValue(0);
```

- [ ] **Step 2: Add `onContentSizeChange` and `onLayout` to `<FlashList>`**

Add these two props to the `<FlashList>` JSX (anywhere among the other props is fine):

```typescript
onContentSizeChange={(_w, h) => {
  contentHeight.value = h;
}}
onLayout={(e) => {
  viewportHeight.value = e.nativeEvent.layout.height;
}}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors related to the new props.

- [ ] **Step 4: Quick smoke test**

Run: `npm run ios`
Manual: scroll the main gallery. Nothing visually changes (no new UI yet); just confirm nothing crashed.

- [ ] **Step 5: Commit (skip unless commits are authorized)**

```bash
git add src/components/gallery-grid.tsx
git commit -m "refactor(gallery-grid): track content + viewport size as shared values"
```

---

## Task 4: Scaffold `<QuickScroll>` component and mount it (renders nothing yet)

**Files:**
- Create: `src/components/quick-scroll.tsx`
- Modify: `src/components/gallery-grid.tsx`

**Rationale:** Get the component file + mount point in place. Renders `null` for now. Locks in the prop interface so subsequent tasks just flesh out behavior.

- [ ] **Step 1: Create `src/components/quick-scroll.tsx`**

```typescript
import type { FlashList } from "@shopify/flash-list";
import type { Asset } from "expo-media-library";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";

export type SortMode = "random" | "newest" | "oldest" | "name";

export type QuickScrollProps = {
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
  viewportHeight: SharedValue<number>;
  animatedRef: AnimatedRef<FlashList<Asset>>;
  assets: Asset[];
  sortMode: SortMode;
  selectionActive: boolean;
};

export function QuickScroll(_props: QuickScrollProps) {
  return null;
}
```

Notes:
- The `SortMode` type alias is local for now; if a global `SortMode` type already exists in `@/state/preferences-store`, import that instead and delete the local alias.

- [ ] **Step 2: Wire `<QuickScroll>` into `<GalleryGrid>`**

In `src/components/gallery-grid.tsx`:

Add the import near the other component imports:

```typescript
import { QuickScroll } from "./quick-scroll";
```

Add the imports for the selection store + preferences store at the top (next to the existing zustand-store imports):

```typescript
import { usePreferencesStore } from "@/state/preferences-store";
```

(`useSelectionStore` is already imported.)

Inside the `GalleryGrid` function body, near the top alongside other hook calls, read the needed slices:

```typescript
const sortMode = usePreferencesStore((s) => s.defaultSort);
const selectionActive = useSelectionStore(
  (s) => s.selectedIds.size > 0,
);
```

- [ ] **Step 3: Mount `<QuickScroll>` as a sibling of `<FlashList>` inside `<GestureDetector>`**

Find the return statement:

```typescript
return (
  <GestureDetector gesture={pan}>
    <FlashList ... />
  </GestureDetector>
);
```

Wrap the contents in a `<View>` so two siblings can coexist, then add `<QuickScroll>`:

```typescript
return (
  <GestureDetector gesture={pan}>
    <View style={{ flex: 1 }}>
      <FlashList ... />
      <QuickScroll
        scrollY={scrollY}
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
        animatedRef={animatedRef}
        assets={assets}
        sortMode={sortMode}
        selectionActive={selectionActive}
      />
    </View>
  </GestureDetector>
);
```

Add `View` to the React Native imports at the top if it's not already there:

```typescript
import { /* existing */, View, /* existing */ } from "react-native";
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors. If `SortMode` doesn't match the preferences store's enum, harmonize the type now — import the real one.

- [ ] **Step 5: Quick smoke test**

Run: `npm run ios`
Manual: app launches, gallery shows, scrolls. No visual change — `<QuickScroll>` returns `null`.

- [ ] **Step 6: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx src/components/gallery-grid.tsx
git commit -m "feat(quick-scroll): scaffold component and mount inside gallery grid"
```

---

## Task 5: Implement the scrub track + thumb (visual only, follows scroll)

**Files:**
- Modify: `src/components/quick-scroll.tsx`

**Rationale:** Get the read-only scrub indicator working. No drag, no bubble, no FAB yet. Pure visual reflection of scroll position.

- [ ] **Step 1: Expand `src/components/quick-scroll.tsx` to render the track and thumb**

Replace the existing file contents entirely:

```typescript
import type { FlashList } from "@shopify/flash-list";
import type { Asset } from "expo-media-library";
import { StyleSheet, View } from "react-native";
import Animated, {
  type AnimatedRef,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ink } from "@/theme";

export type SortMode = "random" | "newest" | "oldest" | "name";

export type QuickScrollProps = {
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
  viewportHeight: SharedValue<number>;
  animatedRef: AnimatedRef<FlashList<Asset>>;
  assets: Asset[];
  sortMode: SortMode;
  selectionActive: boolean;
};

const TRACK_WIDTH = 3;
const TRACK_RIGHT_INSET = 8;
const THUMB_HEIGHT = 28;
const THUMB_WIDTH = 6;
const TRACK_TOP_INSET = 16;
const TRACK_BOTTOM_INSET = 16;

export function QuickScroll({
  scrollY,
  contentHeight,
  viewportHeight,
}: QuickScrollProps) {
  const insets = useSafeAreaInsets();

  // Track height — viewport minus our own internal insets. Updates with viewportHeight.
  const trackHeight = useDerivedValue(() => {
    const h = viewportHeight.value - TRACK_TOP_INSET - TRACK_BOTTOM_INSET;
    return h > 0 ? h : 0;
  });

  // Scrollable distance (0 when content fits in viewport).
  const scrollable = useDerivedValue(() => {
    return Math.max(0, contentHeight.value - viewportHeight.value);
  });

  // Thumb Y position within the track.
  const thumbStyle = useAnimatedStyle(() => {
    const trackUsable = Math.max(0, trackHeight.value - THUMB_HEIGHT);
    const ratio =
      scrollable.value > 0
        ? Math.min(1, Math.max(0, scrollY.value / scrollable.value))
        : 0;
    return {
      transform: [{ translateY: ratio * trackUsable }],
    };
  });

  // Don't render if list is too short to bother scrubbing.
  const visibilityStyle = useAnimatedStyle(() => {
    const tooShort = contentHeight.value < viewportHeight.value * 1.5;
    return { opacity: tooShort ? 0 : 1 };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: TRACK_TOP_INSET,
          bottom: TRACK_BOTTOM_INSET + insets.bottom,
          right: TRACK_RIGHT_INSET,
        },
        visibilityStyle,
      ]}
    >
      <View style={styles.track} />
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: THUMB_WIDTH + 8, // small extra hit area, no pointer events yet
    alignItems: "center",
  },
  track: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: TRACK_WIDTH,
    backgroundColor: ink.hairline,
    borderRadius: TRACK_WIDTH / 2,
  },
  thumb: {
    position: "absolute",
    top: 0,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_WIDTH / 2,
    backgroundColor: ink.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ink.hairline,
  },
});
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification on long list**

Run: `npm run ios`
Manual:
- Open an album with > 50 photos (or the main gallery).
- Scroll up/down. Confirm a thin track is visible on the right edge, with a small pill-shaped thumb that tracks scroll position smoothly. Position at top = thumb at top; bottom = thumb at bottom.

- [ ] **Step 4: Manual verification on short list**

Run: `npm run ios`
Manual:
- Open an album with < 10 photos. Confirm scrub bar is invisible (opacity 0 because list is too short).

- [ ] **Step 5: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx
git commit -m "feat(quick-scroll): render scrub track + scroll-following thumb"
```

---

## Task 6: Auto-hide idle timer for the scrub bar

**Files:**
- Modify: `src/components/quick-scroll.tsx`

**Rationale:** Scrub bar should only be visible when actively scrolling or for 1.5s after. Idle = hidden.

- [ ] **Step 1: Import the idle motion token and required animation helpers**

At the top of `src/components/quick-scroll.tsx`, expand the Reanimated import and theme import:

```typescript
import Animated, {
  type AnimatedRef,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ink, shellMotion } from "@/theme";
```

Also add `useEffect`, `useRef`:

```typescript
import { useEffect, useRef } from "react";
```

- [ ] **Step 2: Add an `activity` shared value driven by scroll changes**

Inside the `QuickScroll` function body, just below the existing `useDerivedValue` calls, add:

```typescript
const activity = useSharedValue(0); // 0 = idle, 1 = active
const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const scheduleHide = () => {
  if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  idleTimerRef.current = setTimeout(() => {
    activity.value = withTiming(0, { duration: 220 });
  }, shellMotion.quickScrollIdle);
};

useAnimatedReaction(
  () => scrollY.value,
  (current, previous) => {
    if (previous === null || current === previous) return;
    activity.value = withTiming(1, { duration: 120 });
    runOnJS(scheduleHide)();
  },
);

useEffect(() => {
  return () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };
}, []);
```

- [ ] **Step 3: Multiply `activity` into the visibility style**

Replace the existing `visibilityStyle`:

```typescript
const visibilityStyle = useAnimatedStyle(() => {
  const tooShort = contentHeight.value < viewportHeight.value * 1.5;
  return { opacity: tooShort ? 0 : 1 };
});
```

With:

```typescript
const visibilityStyle = useAnimatedStyle(() => {
  const tooShort = contentHeight.value < viewportHeight.value * 1.5;
  return { opacity: tooShort ? 0 : activity.value };
});
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification — idle hide**

Run: `npm run ios`
Manual:
- Open the main gallery.
- Scroll. Confirm scrub bar fades in (~120ms).
- Stop scrolling. Confirm scrub bar fades out after ~1.5s (~220ms fade).
- Scroll again. Re-appears.

- [ ] **Step 6: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx
git commit -m "feat(quick-scroll): auto-hide scrub bar after idle timeout"
```

---

## Task 7: Make the scrub thumb draggable (worklet-side scrollTo, no bubble yet)

**Files:**
- Modify: `src/components/quick-scroll.tsx`

**Rationale:** Wire up the gesture. Dragging the thumb scrolls the list via Reanimated's worklet `scrollTo`, with no JS round-trip. Bubble comes in Task 8.

- [ ] **Step 1: Expand imports for gesture handling**

At the top of `src/components/quick-scroll.tsx`, add:

```typescript
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scrollTo } from "react-native-reanimated";
```

(`scrollTo` is exported from the main `react-native-reanimated` entry; include it next to the other Reanimated imports if cleaner.)

Also import the haptics util:

```typescript
import { lightTap } from "@/lib/haptics";
```

If `lightTap` doesn't exist in `src/lib/haptics.ts`, add it now — open that file and add:

```typescript
export async function lightTap() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
```

(Pattern matches existing `mediumTap` / `heavyTap` in the same file.)

- [ ] **Step 2: Add a scrubbing shared value and gesture handler**

Inside the `QuickScroll` function body, near the other shared values:

```typescript
const isScrubbing = useSharedValue(false);
```

Then, near the existing `scheduleHide` function (above the JSX return), add the gesture:

```typescript
const scrubGesture = Gesture.Pan()
  .minDistance(0)
  .onBegin(() => {
    "worklet";
    isScrubbing.value = true;
    activity.value = withTiming(1, { duration: 80 });
    runOnJS(lightTap)();
  })
  .onUpdate((event) => {
    "worklet";
    const trackUsable = Math.max(0, trackHeight.value - THUMB_HEIGHT);
    if (trackUsable <= 0 || scrollable.value <= 0) return;
    // event.y is relative to the gesture target; clamp to track range.
    const localY = Math.min(trackUsable, Math.max(0, event.y - THUMB_HEIGHT / 2));
    const ratio = localY / trackUsable;
    const targetOffset = ratio * scrollable.value;
    scrollTo(animatedRef, 0, targetOffset, false);
  })
  .onFinalize(() => {
    "worklet";
    isScrubbing.value = false;
    runOnJS(scheduleHide)();
  });
```

- [ ] **Step 3: Wrap the thumb in a `<GestureDetector>` and widen its hit area**

Find the return JSX:

```typescript
return (
  <Animated.View
    pointerEvents="none"
    style={[...]}
  >
    <View style={styles.track} />
    <Animated.View style={[styles.thumb, thumbStyle]} />
  </Animated.View>
);
```

Replace with:

```typescript
return (
  <Animated.View
    pointerEvents="box-none"
    style={[
      styles.container,
      {
        top: TRACK_TOP_INSET,
        bottom: TRACK_BOTTOM_INSET + insets.bottom,
        right: TRACK_RIGHT_INSET,
      },
      visibilityStyle,
    ]}
  >
    <View pointerEvents="none" style={styles.track} />
    <GestureDetector gesture={scrubGesture}>
      <Animated.View style={[styles.thumbHitArea, thumbStyle]}>
        <View style={styles.thumb} />
      </Animated.View>
    </GestureDetector>
  </Animated.View>
);
```

- [ ] **Step 4: Update styles — add `thumbHitArea` and adjust `thumb` to be a child**

In the `styles` object, replace the `thumb` style and add `thumbHitArea`:

```typescript
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 28, // wider hit area
    alignItems: "center",
  },
  track: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: TRACK_WIDTH,
    backgroundColor: ink.hairline,
    borderRadius: TRACK_WIDTH / 2,
  },
  thumbHitArea: {
    position: "absolute",
    top: 0,
    width: 28,
    height: THUMB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_WIDTH / 2,
    backgroundColor: ink.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ink.hairline,
  },
});
```

(Container `pointerEvents="box-none"` lets the scrub-area pass touches through to the grid except where the thumb hit area catches them.)

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification — drag works**

Run: `npm run ios`
Manual:
- Open a long album (use seed scripts if needed).
- Scroll a bit so the scrub bar appears.
- Touch and drag the thumb up/down. List scrolls smoothly to follow. Light haptic at drag start.
- Release. Scrub bar stays visible briefly, then fades.
- Ensure dragging the thumb does NOT trigger long-press selection on photos behind it. (The `<GestureDetector>` should claim the gesture cleanly.)

- [ ] **Step 7: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx src/lib/haptics.ts
git commit -m "feat(quick-scroll): draggable thumb with worklet scrollTo"
```

---

## Task 8: Add the drag bubble with sort-mode-adaptive label

**Files:**
- Modify: `src/components/quick-scroll.tsx`

**Rationale:** The bubble is the payload — it's what makes the scrub bar useful. Label is "Mon YYYY" in chronological modes, percentage otherwise.

- [ ] **Step 1: Expand imports**

In `src/components/quick-scroll.tsx`:

```typescript
import { useMemo, useState } from "react";
```

(Add to the existing `react` import if already importing other hooks.)

Add typography import:

```typescript
import { tabularNums, type } from "@/theme";
```

Update the existing theme import if cleaner; the goal is `ink`, `shellMotion`, `tabularNums`, `type` all from `@/theme`.

Import `InkPill`:

```typescript
import { InkPill } from "./ink-pill";
```

- [ ] **Step 2: Add label bucketing logic**

Inside the `QuickScroll` function, after the existing derived values, add:

```typescript
// Bucket index for label updates. In chronological modes, bucket = asset index
// rounded so each unique (year, month) gets one bucket. In other modes, bucket
// = integer percent (0..100).
const labelBucket = useDerivedValue(() => {
  const total = assets.length;
  if (scrollable.value <= 0 || total === 0) return 0;
  const ratio = Math.min(1, Math.max(0, scrollY.value / scrollable.value));
  if (sortMode === "newest" || sortMode === "oldest") {
    // Asset index under thumb (each asset is its own potential bucket; we'll
    // dedupe to month-year in the JS callback below).
    return Math.min(total - 1, Math.floor(ratio * (total - 1)));
  }
  return Math.round(ratio * 100);
});

const [labelText, setLabelText] = useState("");

const formatLabel = (bucket: number): string => {
  if (sortMode === "newest" || sortMode === "oldest") {
    const asset = assets[bucket];
    if (!asset || !asset.creationTime) {
      const total = assets.length;
      const pct = total > 0 ? Math.round((bucket / Math.max(1, total - 1)) * 100) : 0;
      return `${pct}%`;
    }
    const d = new Date(asset.creationTime);
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  }
  return `${bucket}%`;
};

useAnimatedReaction(
  () => labelBucket.value,
  (current, previous) => {
    if (previous === null || current === previous) return;
    runOnJS(setLabelText)(formatLabel(current));
  },
);
```

Note: `formatLabel` is defined in the component body, so it captures the latest `sortMode` and `assets`. This is intentional — sort changes mid-scroll re-derive the label correctly.

- [ ] **Step 3: Render the bubble next to the thumb during scrubbing**

In the JSX return, modify the thumb gesture detector to also render the bubble. Replace:

```typescript
<GestureDetector gesture={scrubGesture}>
  <Animated.View style={[styles.thumbHitArea, thumbStyle]}>
    <View style={styles.thumb} />
  </Animated.View>
</GestureDetector>
```

With:

```typescript
<GestureDetector gesture={scrubGesture}>
  <Animated.View style={[styles.thumbHitArea, thumbStyle]}>
    <View style={styles.thumb} />
    <Animated.View
      pointerEvents="none"
      style={[styles.bubble, bubbleStyle]}
    >
      <InkPill size="chip">
        <Text style={[type.label, tabularNums, styles.bubbleText]}>
          {labelText}
        </Text>
      </InkPill>
    </Animated.View>
  </Animated.View>
</GestureDetector>
```

- [ ] **Step 4: Add `bubbleStyle` derived value and `Text` import**

Add to the React Native imports:

```typescript
import { StyleSheet, Text, View } from "react-native";
```

Add the bubble style derivation in the component body, near `thumbStyle`:

```typescript
const bubbleStyle = useAnimatedStyle(() => {
  return {
    opacity: withTiming(isScrubbing.value ? 1 : 0, {
      duration: isScrubbing.value ? 120 : 180,
    }),
  };
});
```

- [ ] **Step 5: Add bubble styles**

In the `styles` object, add:

```typescript
bubble: {
  position: "absolute",
  right: 28 + 8, // right of the hit area + small gap
  top: 0,
  // Vertically center the bubble against the thumb. The bubble is taller than
  // the thumb; nudge it up so its center aligns with the thumb's center.
  transform: [{ translateY: -6 }],
},
bubbleText: {
  color: ink.textPrimary,
},
```

(If `type.label` doesn't exist, use whichever small label style is closest; check `src/theme/typography.ts`. If neither `type.label` nor a similar token exists, inline the style with `fontSize: 12, fontWeight: "500"` and follow up with the user about adding a token.)

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors. If `type.label` doesn't exist, replace with a real token (read `src/theme/typography.ts` first).

- [ ] **Step 7: Manual verification — chronological label**

Run: `npm run ios`
Manual:
- Open Settings (or wherever sort mode is set) and choose `newest` sort.
- Open a long album.
- Drag the thumb. Bubble appears to the left of the thumb showing `"Mon YYYY"` (e.g., `"May 2024"`) that updates as you drag past month boundaries.
- Release. Bubble fades out (~180ms).

- [ ] **Step 8: Manual verification — percentage label**

Run: `npm run ios`
Manual:
- Switch sort to `random`.
- Open the main gallery.
- Drag the thumb. Bubble shows percentage (e.g., `"23%"`) that updates as you drag.

- [ ] **Step 9: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx
git commit -m "feat(quick-scroll): drag bubble with sort-mode-adaptive label"
```

---

## Task 9: Jump FAB — render + smart direction + threshold visibility

**Files:**
- Modify: `src/components/quick-scroll.tsx`
- Modify: `src/state/gallery-scroll-store.ts` (if any helper export is needed — likely not)

**Rationale:** The second affordance. Single FAB at bottom-trailing, icon flips based on scroll position, only renders past 2vh.

- [ ] **Step 1: Expand imports**

Add to `src/components/quick-scroll.tsx`:

```typescript
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { Pressable } from "react-native";
import { useGalleryScrollStore } from "@/state/gallery-scroll-store";
```

- [ ] **Step 2: Add direction state + visibility tracking**

In the component body, near the other state declarations:

```typescript
const [fabDirection, setFabDirection] = useState<"up" | "down" | null>(null);
const setJumpVisible = useGalleryScrollStore((s) => s.setJumpVisible);

const fabDecision = useDerivedValue(() => {
  const tooShort = contentHeight.value < viewportHeight.value * 1.5;
  if (tooShort) return null as "up" | "down" | null;

  const vh = viewportHeight.value;
  if (vh <= 0) return null as "up" | "down" | null;

  if (scrollY.value > vh * 2) return "up" as const;

  // Near top: only show "down" if list is genuinely long (3+ viewports).
  if (scrollY.value <= vh * 0.5 && contentHeight.value > vh * 3) {
    // "down" only appears after the post-scroll-to-top trick in Task 11;
    // until then, near-top means no FAB.
    return null as "up" | "down" | null;
  }
  return null as "up" | "down" | null;
});

useAnimatedReaction(
  () => fabDecision.value,
  (current, previous) => {
    if (previous === current) return;
    runOnJS(setFabDirection)(current);
    runOnJS(setJumpVisible)(current !== null);
  },
);
```

- [ ] **Step 3: Reset the store on unmount**

Extend the existing cleanup `useEffect`:

```typescript
useEffect(() => {
  return () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setJumpVisible(false);
  };
}, [setJumpVisible]);
```

- [ ] **Step 4: Add FAB jump handlers (JS-thread)**

In the component body, above the JSX return:

```typescript
const handleJumpTop = () => {
  lightTap();
  // FlashList ref typing: `animatedRef.current` is the FlashList instance.
  animatedRef.current?.scrollToOffset({ offset: 0, animated: true });
};

const handleJumpBottom = () => {
  lightTap();
  const target = Math.max(0, contentHeight.value - viewportHeight.value);
  animatedRef.current?.scrollToOffset({ offset: target, animated: true });
};
```

(`AnimatedRef.current` is typed as the underlying view; if TypeScript complains, cast: `(animatedRef.current as FlashList<Asset> | null)?.scrollToOffset(...)`.)

- [ ] **Step 5: Render the FAB in the JSX**

At the bottom of the return JSX — but outside the scrub-bar `<Animated.View>` and outside the `<GestureDetector>` for the scrub gesture — render a separate absolute-positioned FAB. The cleanest structure: wrap the whole return in a `<>` fragment with two siblings (scrub overlay + FAB overlay).

Replace the existing return with:

```typescript
return (
  <>
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.scrubContainer,
        {
          top: TRACK_TOP_INSET,
          bottom: TRACK_BOTTOM_INSET + insets.bottom,
          right: TRACK_RIGHT_INSET,
        },
        visibilityStyle,
      ]}
    >
      <View pointerEvents="none" style={styles.track} />
      <GestureDetector gesture={scrubGesture}>
        <Animated.View style={[styles.thumbHitArea, thumbStyle]}>
          <View style={styles.thumb} />
          <Animated.View
            pointerEvents="none"
            style={[styles.bubble, bubbleStyle]}
          >
            <InkPill size="chip">
              <Text style={[type.label, tabularNums, styles.bubbleText]}>
                {labelText}
              </Text>
            </InkPill>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>

    {fabDirection !== null && !selectionActive && (
      <Pressable
        onPress={fabDirection === "up" ? handleJumpTop : handleJumpBottom}
        style={[
          styles.fab,
          { bottom: 16 + insets.bottom },
        ]}
        hitSlop={8}
      >
        {fabDirection === "up" ? (
          <ArrowUp size={20} color={ink.textPrimary} />
        ) : (
          <ArrowDown size={20} color={ink.textPrimary} />
        )}
      </Pressable>
    )}
  </>
);
```

Rename `styles.container` to `styles.scrubContainer` in the StyleSheet to match. Add `styles.fab`:

```typescript
const styles = StyleSheet.create({
  scrubContainer: {
    position: "absolute",
    width: 28,
    alignItems: "center",
  },
  // ... existing track, thumbHitArea, thumb, bubble, bubbleText ...
  fab: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ink.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ink.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors. Fix any FlashList ref typing issues by casting if needed.

- [ ] **Step 7: Manual verification — FAB appears + jumps**

Run: `npm run ios`
Manual:
- Open a long album (use seed scripts).
- Scroll down past two viewport heights (~roughly the second screenful of photos).
- Confirm a circular FAB with `↑` icon appears at bottom-trailing.
- Tap it. List smoothly scrolls back to the top.
- After arriving at top, FAB disappears (we'll add the "stays for 2.5s showing ↓" trick in Task 11).
- Light haptic on tap.

- [ ] **Step 8: Manual verification — FAB does not appear when not needed**

Run: `npm run ios`
Manual:
- Open a short album (< 1.5 viewports).
- Scroll however you can. FAB never appears.

- [ ] **Step 9: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx
git commit -m "feat(quick-scroll): jump FAB with smart direction and threshold"
```

---

## Task 10: `MorphingPill` hides when jump FAB is visible

**Files:**
- Modify: `src/components/morphing-pill.tsx`

**Rationale:** Close the coordination loop. When the jump FAB is up, the bottom Shuffle All MorphingPill should disappear, per the design's mutual-exclusivity model.

- [ ] **Step 1: Read `src/components/morphing-pill.tsx`**

Familiarize yourself with the morph branches. The component has a few rendering modes (resting Shuffle All, selection morph, etc.). The hide branch belongs at the top: if `jumpVisible && !selectionActive`, return `null` (or a transition out) before any other branch decides what to render.

- [ ] **Step 2: Import the store**

Add to the imports:

```typescript
import { useGalleryScrollStore } from "@/state/gallery-scroll-store";
```

- [ ] **Step 3: Subscribe to `jumpVisible` and short-circuit when selection is empty**

Near the top of the component function, add:

```typescript
const jumpVisible = useGalleryScrollStore((s) => s.jumpVisible);
```

Then, find the appropriate gate. The MorphingPill receives `selectionCount` as a prop (per the call sites in `(tabs)/index.tsx`). Insert:

```typescript
if (jumpVisible && selectionCount === 0) return null;
```

Place this BEFORE the existing morph-state computation but AFTER any hooks (hooks must run unconditionally). If the file structures hooks first then renders, this is straightforward — just add the early return below the hook calls.

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification — pill hides when scrolled deep**

Run: `npm run ios`
Manual:
- Open the main gallery (which has Shuffle All in the MorphingPill at bottom).
- Scroll down past 2 viewports. MorphingPill / Shuffle All disappears; jump FAB ↑ visible.
- Tap the FAB to return to top. As scroll reaches near-top, FAB hides and MorphingPill reappears.
- In selection mode (long-press a tile, drag to select more): MorphingPill stays visible regardless of scroll depth; jump FAB is hidden.

- [ ] **Step 6: Commit (skip unless commits are authorized)**

```bash
git add src/components/morphing-pill.tsx
git commit -m "feat(morphing-pill): hide when quick-scroll jump FAB is visible"
```

---

## Task 11: The "at-the-top trick" — FAB stays 2.5s showing ↓ after scroll-to-top

**Files:**
- Modify: `src/components/quick-scroll.tsx`

**Rationale:** Discoverability for scroll-to-bottom. When the user invokes scroll-to-top in a long list, the FAB stays visible for ~2.5s with the icon flipped to ↓ — a discoverable window to invoke the opposite action.

- [ ] **Step 1: Add a "post-jump-top" timer state**

In `src/components/quick-scroll.tsx`, in the component body:

```typescript
const [postTopWindow, setPostTopWindow] = useState(false);
const postTopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const openPostTopWindow = () => {
  if (postTopTimerRef.current) clearTimeout(postTopTimerRef.current);
  setPostTopWindow(true);
  postTopTimerRef.current = setTimeout(() => {
    setPostTopWindow(false);
  }, 2500);
};

useEffect(() => {
  return () => {
    if (postTopTimerRef.current) clearTimeout(postTopTimerRef.current);
  };
}, []);
```

- [ ] **Step 2: Open the window when handleJumpTop fires (long-list only)**

Update `handleJumpTop`:

```typescript
const handleJumpTop = () => {
  lightTap();
  animatedRef.current?.scrollToOffset({ offset: 0, animated: true });
  // If the list is long enough that jumping to bottom is meaningful, give
  // the user a discoverable window to do so.
  if (contentHeight.value > viewportHeight.value * 3) {
    openPostTopWindow();
  }
};
```

- [ ] **Step 3: Close the window when the user starts scrolling away from the top**

In the `useAnimatedReaction` watching `scrollY`, extend the JS side to close the window if the user scrolls past a small threshold:

```typescript
const maybeCloseWindow = () => {
  if (postTopWindow && scrollY.value > 100) {
    if (postTopTimerRef.current) clearTimeout(postTopTimerRef.current);
    setPostTopWindow(false);
  }
};
```

Add a `runOnJS(maybeCloseWindow)()` inside the scroll reaction's JS path. The existing scroll reaction currently looks like:

```typescript
useAnimatedReaction(
  () => scrollY.value,
  (current, previous) => {
    if (previous === null || current === previous) return;
    activity.value = withTiming(1, { duration: 120 });
    runOnJS(scheduleHide)();
  },
);
```

Extend to:

```typescript
useAnimatedReaction(
  () => scrollY.value,
  (current, previous) => {
    if (previous === null || current === previous) return;
    activity.value = withTiming(1, { duration: 120 });
    runOnJS(scheduleHide)();
    runOnJS(maybeCloseWindow)();
  },
);
```

- [ ] **Step 4: Update `fabDecision` to factor in `postTopWindow`**

`fabDecision` is a worklet — it can't read JS `useState` directly. Mirror `postTopWindow` into a shared value:

```typescript
const postTopShared = useSharedValue(false);

useEffect(() => {
  postTopShared.value = postTopWindow;
}, [postTopWindow, postTopShared]);
```

Then update `fabDecision`:

```typescript
const fabDecision = useDerivedValue(() => {
  const tooShort = contentHeight.value < viewportHeight.value * 1.5;
  if (tooShort) return null as "up" | "down" | null;

  const vh = viewportHeight.value;
  if (vh <= 0) return null as "up" | "down" | null;

  if (scrollY.value > vh * 2) return "up" as const;

  // Near top with the post-top window open → show "down" for jump-to-bottom.
  if (
    scrollY.value <= vh * 0.5 &&
    contentHeight.value > vh * 3 &&
    postTopShared.value
  ) {
    return "down" as const;
  }
  return null as "up" | "down" | null;
});
```

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification — at-the-top trick**

Run: `npm run ios`
Manual:
- Open a long album (>3 viewports).
- Scroll down past 2vh. FAB ↑ appears.
- Tap FAB. List scrolls to top. FAB STAYS visible for ~2.5s, icon flipped to ↓.
- Tap ↓ within the window. List scrolls to the bottom.
- Repeat scroll-to-top. This time DON'T tap. After 2.5s, FAB fades away. MorphingPill reappears.
- Repeat scroll-to-top, then immediately scroll down (manually). Confirm post-top window closes (FAB transitions from ↓ to ↑ when past 2vh again, or simply disappears in between).

- [ ] **Step 7: Manual verification — short list edge case**

Run: `npm run ios`
Manual:
- Open an album of ~2 viewports (long enough for FAB to appear but NOT >3 viewports).
- Scroll down, tap FAB ↑ to return to top.
- Post-top window should NOT open (list isn't long enough to make scroll-to-bottom worthwhile). FAB hides cleanly.

- [ ] **Step 8: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx
git commit -m "feat(quick-scroll): post-scroll-to-top window for jump-to-bottom"
```

---

## Task 12: Final polish + manual sweep

**Files:**
- Modify: `src/components/quick-scroll.tsx` (only if polish lands during sweep)
- Modify: `src/components/morphing-pill.tsx` (only if polish lands during sweep)

**Rationale:** Cross-check every scenario from the spec's Hide Rules table, the Edge Cases section, and the Testing section. Fix anything that doesn't match.

- [ ] **Step 1: Run through the Hide Rules table**

For each row, manually verify on the iOS sim:

| State | Scrub bar | Jump FAB | MorphingPill | Verified? |
|---|---|---|---|---|
| Idle at top | hidden | hidden | visible | [ ] |
| Scrolling | visible | hidden until past 2vh | visible | [ ] |
| Scrolled past 2vh | visible | visible (↑) | hidden | [ ] |
| At top of long list, post-scroll-to-top | visible (idling) | visible (↓, ~2.5s) | hidden during window | [ ] |
| Selecting | visible | hidden | visible (morphed) | [ ] |
| Short list (< 1.5vh) | never renders | never renders | visible | [ ] |

If any cell deviates, fix in this task before continuing.

- [ ] **Step 2: Sort mode sweep**

For each sort mode, open a long album/gallery and drag the scrub thumb. Confirm bubble label:

- `newest` → "Mon YYYY" (matches asset under thumb)
- `oldest` → "Mon YYYY"
- `random` (main gallery) → "X%"
- `name` → "X%"

- [ ] **Step 3: Theme sweep**

Toggle system dark/light. Editorial Ink chrome (scrub bar, thumb, bubble, FAB) should look identical regardless. (Ink tokens are intentionally fixed.)

- [ ] **Step 4: Both screens**

Verify the feature works identically on:
- Main gallery (`(tabs)/index.tsx`)
- Album view (`(tabs)/albums/[albumId].tsx`)

- [ ] **Step 5: Pull-to-shuffle interaction**

Pull-to-refresh in the main gallery. Confirm:
- Thumb doesn't render above the track (clamped).
- Bubble doesn't appear from the pull motion alone (only on actual thumb drag).

- [ ] **Step 6: Android pass**

Run: `npm run android`
Manual: repeat the Hide Rules table sweep on Android. Watch especially for gesture-handling differences (Pan gesture conflicts with FlashList scroll on Android were historically more sensitive).

- [ ] **Step 7: Address any leftover open implementation decisions from the spec**

The spec lists three open decisions:
- (a) MorphingPill hides via `return null` vs. transition machinery — chosen: `return null` (Task 10). If a smoother fade is needed, wrap the MorphingPill's existing render in a `Reanimated.View` with `entering`/`exiting` layout animations. Decide based on how the visual transition feels in Step 1's sweep.
- (b) `lightTap` exists / token works — verified in Task 7. No further action.
- (c) Easing curves — defaults used. If any transition feels off (most likely the FAB enter/exit), wrap the FAB render in a `Reanimated.View` with `entering={FadeIn.duration(120)}` and `exiting={FadeOut.duration(180)}` from `react-native-reanimated`.

- [ ] **Step 8: TypeScript final check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 9: Lint final check**

Run: `npm run lint`
Expected: clean (or no new warnings introduced by the new files).

- [ ] **Step 10: Update `TODO.md`**

In `TODO.md`, mark the Quick-scroll item complete:

```markdown
- [x] **Quick-scroll for long photo grids** — ...
```

- [ ] **Step 11: Commit (skip unless commits are authorized)**

```bash
git add src/components/quick-scroll.tsx src/components/morphing-pill.tsx TODO.md
git commit -m "feat(quick-scroll): polish pass and TODO checkoff"
```

---

## Self-Review Notes (already applied)

- **Spec coverage:** Tasks 1 (motion token, store), 2-3 (grid scroll → shared values + sizes), 4 (component scaffold), 5 (scrub visual), 6 (auto-hide), 7 (drag), 8 (bubble), 9 (FAB), 10 (pill coordination), 11 (at-the-top trick), 12 (polish + edge cases). Every section of the spec maps to at least one task.
- **No placeholders:** every step has actual code or a concrete manual check.
- **Type consistency:** `SortMode` is defined once in Task 4 and reused; `QuickScrollProps` is the single source of truth. `setJumpVisible` / `jumpVisible` names match between Tasks 1, 9, 10.
- **Commit gate:** all commit steps are marked "skip unless commits are authorized" per the project's user-global no-commit rule.
- **Test infra:** none added; all verification is sim-based, matching project convention.
