# Editorial Ink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `expo-blur` surfaces (MorphingPill, ToastPill, gesture chips) and the NativeTabs `systemChromeMaterial` bar with a fixed dark "ink" chrome — confident weight, always-readable white-on-near-black text, no system-theme adaptation.

**Architecture:** Add a theme-independent `ink` token namespace, introduce a new `InkPill` primitive that owns the shared pill/chip geometry today duplicated across three call sites, then migrate each surface in isolation. NativeTabs goes from `systemChromeMaterialDark/Light` to a solid `#0A0A0A` bar with identical iOS/Android styling. Light/dark theming for the rest of the app (gallery, sheets, tab content) is untouched.

**Tech Stack:** React Native 0.83.6, Expo SDK 55, `expo-router` NativeTabs, TypeScript 5.9, npm.

**Spec:** [`docs/superpowers/specs/2026-05-23-strip-glass-style-design.md`](../specs/2026-05-23-strip-glass-style-design.md)

---

## Verification model

This project has no UI test runner (no jest, no vitest — confirmed via `package.json` devDependencies). Each code task verifies through:

- **`npx tsc --noEmit`** — TypeScript type-check; catches import/type errors
- **`npm run lint`** — runs `expo lint` (eslint)

A final manual dogfood task (Task 8) maps directly to the spec's "Testing / verification" section: 7 device checks across both system themes.

## Commit policy

Each task ends with a **suggested** commit command. Per project convention, **do not run `git commit` without explicit user confirmation per commit.** Treat each commit step as a pause point for sign-off, not an automatic action.

## Task ordering rationale

ToastPill (Task 3) is migrated **before** MorphingPill (Task 4) because Task 3 renames `chrome="bare"` → `wrapped={false}`, which requires updating the one call site in `morphing-pill.tsx:176` in the same commit. Doing it in this order keeps the project compiling between every task.

---

## Task 1: Add `ink` token namespace

**Files:**
- Modify: `src/theme/palette.ts`
- Modify: `src/theme/index.ts`

- [ ] **Step 1: Add the `ink` const to `palette.ts`**

Append at the end of `src/theme/palette.ts` (after the existing `theaterTheme` export):

```ts
// Editorial Ink — fixed dark chrome for floating UI (pill, toast, chip,
// tab bar). Deliberately not part of Theme: identity consistency means
// these values are the same regardless of system light/dark.
export const ink = {
  surface: "#111111",
  surfaceTabBar: "#0A0A0A",
  hairline: "rgba(255,255,255,0.08)",
  textPrimary: "#F2F2F2",
  textMuted: "rgba(242,242,242,0.55)",
  accent: "#F5C77E",
} as const;
```

- [ ] **Step 2: Re-export `ink` from the theme barrel**

In `src/theme/index.ts`, update the first line:

```ts
// Before
export { colors, darkShellTheme, lightTheme, theaterTheme } from "@/theme/palette";

// After
export { colors, darkShellTheme, ink, lightTheme, theaterTheme } from "@/theme/palette";
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors (pre-existing warnings in unrelated files are fine).

- [ ] **Step 5: Suggested commit (pause for user confirmation)**

```bash
git add src/theme/palette.ts src/theme/index.ts
git commit -m "feat(theme): add ink token namespace for editorial chrome"
```

---

## Task 2: Create `InkPill` primitive

**Files:**
- Create: `src/components/ink-pill.tsx`

- [ ] **Step 1: Write the primitive**

Create `src/components/ink-pill.tsx`:

```tsx
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { ink } from "@/theme";

type InkPillSize = "pill" | "chip";

export function InkPill({
  size = "pill",
  style,
  children,
}: {
  size?: InkPillSize;
  style?: ViewStyle;
  children: ReactNode;
}) {
  return <View style={[styles[size], style]}>{children}</View>;
}

const baseChrome = {
  backgroundColor: ink.surface,
  borderRadius: 999,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: ink.hairline,
  overflow: "hidden" as const,
};

const styles = StyleSheet.create({
  pill: {
    ...baseChrome,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chip: {
    ...baseChrome,
    minHeight: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Suggested commit (pause for user confirmation)**

```bash
git add src/components/ink-pill.tsx
git commit -m "feat(ui): add InkPill primitive for floating chrome"
```

---

## Task 3: Migrate `ToastPill` and update its call site in `MorphingPill`

**Files:**
- Modify: `src/components/toast-pill.tsx`
- Modify: `src/components/morphing-pill.tsx` (one call-site change at line 176)

- [ ] **Step 1: Rewrite `src/components/toast-pill.tsx`**

Replace the entire file contents with:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionTick } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { type Toast, useToastStore } from "@/state/toast-store";
import { ink, type } from "@/theme";
import { InkPill } from "./ink-pill";

export function ToastPill({
  toast,
  wrapped = true,
}: {
  toast: Toast;
  // `wrapped` controls chrome ownership: when true, ToastPill renders its
  // own InkPill chrome (standalone use, e.g. theater). When false, the
  // parent already provides chrome (e.g. nested inside MorphingPill).
  wrapped?: boolean;
}) {
  const undo = useToastStore((s) => s.undo);
  const message = toast.kind === "flash" ? toast.message : strings.toast.saved;
  const showUndo = toast.kind !== "flash";

  const handleUndo = () => {
    selectionTick();
    undo();
  };

  const row = (
    <View style={styles.row}>
      <Text style={[type.body, { color: ink.textPrimary }]}>{message}</Text>
      {showUndo ? (
        <>
          <Text style={[type.body, styles.dot, { color: ink.textPrimary }]}>
            {" · "}
          </Text>
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel={strings.toast.undo}
            hitSlop={8}
          >
            <Text style={[type.body, { color: ink.accent }]}>
              {strings.toast.undo}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );

  if (!wrapped) return row;

  return <InkPill size="pill">{row}</InkPill>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  dot: {
    opacity: 0.6,
  },
});
```

> **Note on row styles:** The original `styles.pill` block (minHeight, padding, radius) is owned by InkPill now and removed. The `row` and `dot` styles are preserved verbatim, including `row.minHeight: 24` (defensive height for short/empty messages).

- [ ] **Step 2: Update the call site in `morphing-pill.tsx`**

Find this line (currently at `src/components/morphing-pill.tsx:176`):

```tsx
return <ToastPill toast={toast} chrome="bare" />;
```

Change to:

```tsx
return <ToastPill toast={toast} wrapped={false} />;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. The rename closes both ends of the contract in this single commit.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 5: Suggested commit (pause for user confirmation)**

```bash
git add src/components/toast-pill.tsx src/components/morphing-pill.tsx
git commit -m "refactor(toast): migrate ToastPill to InkPill; rename chrome→wrapped"
```

---

## Task 4: Migrate `MorphingPill`

**Files:**
- Modify: `src/components/morphing-pill.tsx`

- [ ] **Step 1: Update imports**

At the top of `src/components/morphing-pill.tsx`, remove the BlurView import and add the InkPill + ink imports. Also remove `useTheme` since it's no longer needed (verify after the full edit). The import block should end up like:

```tsx
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Sparkle } from "lucide-react-native";
import { type ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type PillScope,
  usePillContextLabel,
} from "@/hooks/use-pill-context-label";
import { type PillState, usePillState } from "@/hooks/use-pill-state";
import { heavyTap, selectionTick } from "@/lib/haptics";
import { type Toast, useToastStore } from "@/state/toast-store";
import { ink, tabularNums, type } from "@/theme";
import { ActionsSheet } from "./actions-sheet";
import { InkPill } from "./ink-pill";
import { ToastPill } from "./toast-pill";
```

(Removed: `BlurView` from `expo-blur`, `useTheme` from `@/theme`. Added: `InkPill`, `ink`.)

- [ ] **Step 2: Remove the `useTheme()` call from `MorphingPill`**

Inside the `MorphingPill` function body, delete this line:

```tsx
const theme = useTheme();
```

- [ ] **Step 3: Replace the BlurView wrapper with InkPill**

In the JSX return, replace the BlurView wrapper. Before:

```tsx
<BlurView
  intensity={60}
  tint={theme.isDark ? "dark" : "light"}
  style={styles.pill}
>
  {renderContent({
    state,
    label,
    theme,
    toast,
    onShuffle: handleShufflePress,
    onShuffleLongPress: handleShuffleLongPress,
    onActions: handleActionsPress,
  })}
</BlurView>
```

After:

```tsx
<InkPill size="pill">
  {renderContent({
    state,
    label,
    toast,
    onShuffle: handleShufflePress,
    onShuffleLongPress: handleShuffleLongPress,
    onActions: handleActionsPress,
  })}
</InkPill>
```

(The `theme` prop drops out of the renderContent call.)

- [ ] **Step 4: Update the `renderContent` function**

Update both the signature and the body. Before:

```tsx
function renderContent({
  state,
  label,
  theme,
  toast,
  onShuffle,
  onShuffleLongPress,
  onActions,
}: {
  state: PillState;
  label: string;
  theme: ReturnType<typeof useTheme>;
  toast: Toast | null;
  onShuffle: () => void;
  onShuffleLongPress: (() => void) | undefined;
  onActions: () => void;
}): ReactNode {
  switch (state) {
    case "shuffle":
      return (
        <Pressable
          onPress={onShuffle}
          onLongPress={onShuffleLongPress}
          delayLongPress={450}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Sparkle
            size={16}
            strokeWidth={2}
            color={theme.textPrimary}
            style={styles.icon}
          />
          <Text style={[type.body, { color: theme.textPrimary }]}>
            {label}
          </Text>
        </Pressable>
      );
    case "actions":
      return (
        <Pressable
          onPress={onActions}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={[type.body, tabularNums, { color: theme.textPrimary }]}
          >
            {label}
          </Text>
        </Pressable>
      );
    case "toast":
      if (!toast) return null;
      return <ToastPill toast={toast} wrapped={false} />;
    case "hidden":
      return null;
  }
}
```

After:

```tsx
function renderContent({
  state,
  label,
  toast,
  onShuffle,
  onShuffleLongPress,
  onActions,
}: {
  state: PillState;
  label: string;
  toast: Toast | null;
  onShuffle: () => void;
  onShuffleLongPress: (() => void) | undefined;
  onActions: () => void;
}): ReactNode {
  switch (state) {
    case "shuffle":
      return (
        <Pressable
          onPress={onShuffle}
          onLongPress={onShuffleLongPress}
          delayLongPress={450}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Sparkle
            size={16}
            strokeWidth={2}
            color={ink.textPrimary}
            style={styles.icon}
          />
          <Text style={[type.body, { color: ink.textPrimary }]}>
            {label}
          </Text>
        </Pressable>
      );
    case "actions":
      return (
        <Pressable
          onPress={onActions}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={[type.body, tabularNums, { color: ink.textPrimary }]}
          >
            {label}
          </Text>
        </Pressable>
      );
    case "toast":
      if (!toast) return null;
      return <ToastPill toast={toast} wrapped={false} />;
    case "hidden":
      return null;
  }
}
```

(Changes: removed `theme` param + its type from the signature, replaced all four `theme.textPrimary` references with `ink.textPrimary`.)

- [ ] **Step 5: Remove the obsolete `styles.pill` block**

In the `StyleSheet.create({...})` block at the bottom of the file, delete the `pill` entry. Before:

```tsx
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  icon: {
    marginRight: 8,
  },
});
```

After:

```tsx
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  icon: {
    marginRight: 8,
  },
});
```

- [ ] **Step 6: Update the `TAB_BAR_CLEARANCE` comment**

The comment at the top of the file (currently lines 18-21) mentions clearing a translucent bar. Update to reflect the solid ink bar:

Before:
```tsx
// NativeTabs doesn't expose a tab-bar height to JS, so we approximate. The
// pill clears typical iOS (~49pt + home indicator) and Android (~56dp + nav)
// tab bars; dial in during dogfooding if it floats too high or low.
const TAB_BAR_CLEARANCE = 60;
```

After:
```tsx
// NativeTabs doesn't expose a tab-bar height to JS, so we approximate.
// Clearance is purely geometric now (the bar is solid ink, no blur stack
// to preserve). Dial in during dogfooding if the pill floats too high
// or low above typical iOS/Android tab bars.
const TAB_BAR_CLEARANCE = 60;
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 9: Suggested commit (pause for user confirmation)**

```bash
git add src/components/morphing-pill.tsx
git commit -m "refactor(pill): migrate MorphingPill to InkPill chrome"
```

---

## Task 5: Migrate gesture-guide chips

**Files:**
- Modify: `src/components/gesture-guide-overlay.tsx`

- [ ] **Step 1: Update imports**

At the top of `src/components/gesture-guide-overlay.tsx`, remove `BlurView` and add `ink` + `InkPill`. The relevant import lines change:

Before:
```tsx
import { BlurView } from "expo-blur";
// ...
import { type, useTheme } from "@/theme";
import { Button } from "./button";
```

After:
```tsx
// (BlurView import removed entirely)
// ...
import { ink, type, useTheme } from "@/theme";
import { Button } from "./button";
import { InkPill } from "./ink-pill";
```

(`useTheme` is preserved because the main `GestureGuideOverlay` component still uses `theme.textPrimary` for the dots and ghost-finger on the dim scrim. That's a separate visual context — scrim, not chrome — and is intentionally out of this refactor's scope.)

- [ ] **Step 2: Rewrite the `Chip` sub-component**

Find the `Chip` function (currently lines 164-177). Before:

```tsx
function Chip({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <BlurView
      intensity={50}
      tint={theme.isDark ? "dark" : "light"}
      style={styles.chip}
    >
      <Text style={[type.caption, styles.chipText, { color: theme.textPrimary }]}>
        {label}
      </Text>
    </BlurView>
  );
}
```

After:

```tsx
function Chip({ label }: { label: string }) {
  return (
    <InkPill size="chip">
      <Text style={[type.caption, styles.chipText, { color: ink.textPrimary }]}>
        {label}
      </Text>
    </InkPill>
  );
}
```

(The `useTheme` call inside `Chip` is removed; the chip's own `styles.chip` is removed in the next step since InkPill owns the geometry.)

- [ ] **Step 3: Remove the obsolete `styles.chip` block**

In the `StyleSheet.create({...})` at the bottom of the file, delete the `chip` entry:

Before:
```tsx
chip: {
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 999,
  overflow: "hidden",
},
chipText: {
  fontSize: 13,
},
```

After:
```tsx
chipText: {
  fontSize: 13,
},
```

(Only `chip` is removed. `chipText` is preserved because it sets the font size on the inner `<Text>`, which InkPill doesn't own.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 6: Suggested commit (pause for user confirmation)**

```bash
git add src/components/gesture-guide-overlay.tsx
git commit -m "refactor(gesture-guide): migrate chips to InkPill"
```

---

## Task 6: Migrate the NativeTabs bar to ink

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update imports and replace bar styling**

At the top of `src/app/(tabs)/_layout.tsx`, the `Platform` import becomes unused (because the iOS/Android background branch goes away). Remove it. Add `ink`. The import block becomes:

Before:
```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";
import { useTheme } from "@/theme";
```

After:
```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";
import { ink } from "@/theme";
```

(`Platform` removed because the platform branch is gone; `useTheme` removed because the bar no longer adapts to the system theme. `ink` added.)

- [ ] **Step 2: Replace the leading comment**

Before:
```tsx
// Cinematic bottom-bar treatment: translucent system material on iOS, brand
// surface on Android. Active state reads via warm-accent tint alone — the
// design system tops out at fontWeight 400, and Feather (the parent family
// lucide forked from, used here because lucide ships SVG components rather
// than a `getImageSource`-compatible font that NativeTabs can rasterize) is
// outline-only, so selection is conveyed by color rather than fill.
```

After:
```tsx
// Editorial Ink bottom bar: solid #0A0A0A on both platforms, warm-accent
// tint for selection. Feather (lucide's parent family, used because lucide
// ships SVG components rather than a `getImageSource`-compatible font that
// NativeTabs can rasterize) is outline-only, so selection is conveyed by
// color rather than fill. The design system tops out at fontWeight 400.
```

- [ ] **Step 3: Replace the body of `TabsLayout`**

Find the section inside `TabsLayout` after the redirect guards (lines ~28-52 in the original). Before:

```tsx
export default function TabsLayout() {
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const { data: permission } = usePermissionQuery();
  const theme = useTheme();

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (!isPermissionCleared(permission)) return <Redirect href="/denied" />;

  const resting = theme.isDark ? "rgba(242,242,242,0.55)" : "rgba(0,0,0,0.55)";
  const selected = theme.accent;
  const blurEffect = theme.isDark
    ? "systemChromeMaterialDark"
    : "systemChromeMaterialLight";
  const warmSoft = "rgba(245,199,126,0.16)";
  const warmIndicator = "rgba(245,199,126,0.20)";

  return (
    <NativeTabs
      iconColor={{ default: resting, selected }}
      labelStyle={{
        default: { ...LABEL_BASE, color: resting },
        selected: { ...LABEL_BASE, color: selected },
      }}
      blurEffect={blurEffect}
      backgroundColor={Platform.OS === "ios" ? "transparent" : theme.surface}
      shadowColor="transparent"
      rippleColor={warmSoft}
      indicatorColor={warmIndicator}
      labelVisibilityMode="labeled"
    >
```

After:

```tsx
export default function TabsLayout() {
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const { data: permission } = usePermissionQuery();

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (!isPermissionCleared(permission)) return <Redirect href="/denied" />;

  const warmSoft = "rgba(245,199,126,0.16)";
  const warmIndicator = "rgba(245,199,126,0.20)";

  return (
    <NativeTabs
      iconColor={{ default: ink.textMuted, selected: ink.accent }}
      labelStyle={{
        default: { ...LABEL_BASE, color: ink.textMuted },
        selected: { ...LABEL_BASE, color: ink.accent },
      }}
      backgroundColor={ink.surfaceTabBar}
      shadowColor="transparent"
      rippleColor={warmSoft}
      indicatorColor={warmIndicator}
      labelVisibilityMode="labeled"
    >
```

(Changes: removed `useTheme` call, `resting`/`selected`/`blurEffect` locals; removed `blurEffect` prop; replaced `backgroundColor`'s platform-branch with solid `ink.surfaceTabBar`; routed icon/label colors through `ink.*`.)

The `<NativeTabs.Trigger>` children below are unchanged.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 6: Suggested commit (pause for user confirmation)**

```bash
git add src/app/\(tabs\)/_layout.tsx
git commit -m "refactor(nav): swap NativeTabs system material for solid ink"
```

---

## Task 7: Remove `expo-blur` dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (regenerated)

- [ ] **Step 1: Verify no remaining imports**

Run from project root:

```bash
grep -rn "expo-blur" src
```

Expected: no output. If anything appears, return to the relevant task above and complete the migration before continuing.

- [ ] **Step 2: Remove `expo-blur` from `package.json`**

In `package.json`, delete the line:

```json
"expo-blur": "~55.0.14",
```

(It's currently on line 28 of `package.json`, inside the `"dependencies"` object. Delete the entire line including the trailing comma — or if it ends up being the last entry, fix the trailing comma on the previous line.)

- [ ] **Step 3: Regenerate the lockfile**

Run: `npm install`
Expected: completes successfully; `package-lock.json` is updated; no native rebuild required (`expo-blur` is a JS-side wrapper and ships no native modules that need re-linking on removal).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If TypeScript complains about a missing `expo-blur` type import anywhere, that's a missed migration — return to the task that should have removed it.)

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 6: Suggested commit (pause for user confirmation)**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): remove expo-blur after editorial ink migration"
```

---

## Task 8: Manual dogfood verification

**No code changes.** This task maps to the spec's "Testing / verification" section. The previous tasks proved the code type-checks and lints — this task proves it *looks right* on a real device.

- [ ] **Step 1: Start the dev build**

Run: `npm run start` (or `npm run ios` / `npm run android` if a fresh build is needed)
Expected: bundler starts; the app launches on simulator or physical device.

- [ ] **Step 2: Test each system theme**

For **both** Light and Dark system appearance (toggle via OS settings — Settings → Display & Brightness on iOS, Settings → Display on Android), run through the checks below. The pill should look identical in both — that's the point of "always ink."

- [ ] **Step 3: Home — shuffle pill over the gallery**

Navigate to the Gallery tab. Confirm:
- Pill renders as a solid dark caption strip above the tab bar.
- White-on-ink text is readable across mixed-brightness photo thumbnails.
- The hairline (very subtle white-on-dark border) gives the pill definition without looking heavy.
- Long-press still triggers the alt shuffle action.

- [ ] **Step 4: Home — selection state**

Long-press a photo to enter selection. Confirm:
- The pill morphs to show the selection count.
- Count is readable. No visual glitch during morph (the chrome shouldn't flicker — same dimensions before/after).

- [ ] **Step 5: Album back-button + bar interplay**

Open any album. Confirm:
- Album back-button underlay still feels visually correct against the new solid tab bar.
- Pill scope changes to "Shuffle {album}" with the album title.

- [ ] **Step 6: Toast trigger inline**

Favorite or delete one or more items. Confirm:
- Toast renders inside the pill's chrome (the pill morphs to toast state; no new chrome appears, no double-blur, no doubled padding).
- "Undo" link is visible in warm accent.
- Toast dismisses after its timeout and the pill returns to shuffle/actions state.

- [ ] **Step 7: Theater standalone toast**

Open Theater (tap a photo into full-screen). Trigger a toast (e.g. favorite via gesture). Confirm:
- A standalone ToastPill renders with its **own** InkPill chrome (since `wrapped` defaults to true).
- Geometry matches the inline toast on Home — same pill shape, same hairline.

- [ ] **Step 8: Gesture-guide chips**

Trigger the first-run gesture guide overlay (or reset onboarding if needed). Confirm:
- Top chip ("⚡ Shake") and bottom chip ("♥♥ Double-tap to favorite") render at the smaller `size="chip"` scale.
- Both chips read clearly against the 70% dim scrim.

- [ ] **Step 9: Tab bar both platforms**

Confirm:
- iOS: the bar shows its automatic top hairline (standard UITabBar behavior).
- Android: the bar may not show a top hairline. Note whether it reads as "floating unanchored" against dark gallery content. If yes, file a follow-up — **not** in this PR.

- [ ] **Step 10: Done**

If all 7 functional checks (Steps 3-9) pass in both system themes, the migration is complete.

If any check fails in a way that suggests the spec's design assumptions are wrong (e.g. light-theme pill genuinely reads as "intrusive notification" rather than "deliberate caption strip"), refer to the spec's "Risk register" — the escape hatch is making `ink.surface` and `ink.surfaceTabBar` follow the theme. That's one token change, not a re-architecture.

---

## Plan complete

After Task 8, the work is fully verified. Final state:
- 1 new file (`src/components/ink-pill.tsx`)
- 1 new token namespace (`ink` in `palette.ts`, re-exported from `index.ts`)
- 4 surfaces migrated (MorphingPill, ToastPill, gesture chips, NativeTabs bar)
- 1 dependency removed (`expo-blur`)
- 6 suggested commits (one per task that touches code)
