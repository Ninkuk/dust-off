# Strip the glass style — Editorial Ink

**Date:** 2026-05-23
**Status:** Design approved, awaiting implementation plan
**Scope:** Floating UI chrome (pill, toast, gesture chips, NativeTabs bar)

## Motivation

The app currently uses `expo-blur`'s `BlurView` on three JS-side surfaces (`MorphingPill`, `ToastPill`, gesture-guide chips) plus the OS-native `systemChromeMaterial` blur on the NativeTabs bar. Two problems drive this redesign:

1. **Brand mood mismatch.** Glass reads as "system OS chrome" and is everywhere across modern apps. Dust Off — a photo-management utility — should feel warmer, more tactile, more editorial.
2. **Readability.** Text-on-blur over busy photo thumbnails or the theater backdrop depends on what's behind it. Contrast is inconsistent.

The chosen direction is **Editorial Ink**: always-dark chrome (`#111`) with always-near-white text (`#F2F2F2`), regardless of system theme. The warm accent (`#F5C77E`) remains, but only on active states. The pill becomes a *caption strip* — confident weight, distinctive identity, maximum readability over any photo content.

Reference apps in the same family: Halide, Darkroom. They lean into a fixed dark chrome because photo apps have license to invert system conventions in service of the content.

## Architecture

### Foundation: ink tokens + a shared chrome primitive

The four glass surfaces today share more geometry than the codebase makes visible — `morphing-pill.tsx:189-195` and `toast-pill.tsx:65-72` duplicate the same `minHeight: 44 / paddingHorizontal: 20 / paddingVertical: 10 / borderRadius: 999 / overflow: "hidden"` style block. We turn that convention into a contract.

**New tokens** in `src/theme/palette.ts` (a new exported `ink` const, **deliberately not part of `Theme`** — Editorial Ink does not adapt to light/dark by design):

```ts
export const ink = {
  surface: "#111111",                   // pill / toast / chip fill
  surfaceTabBar: "#0A0A0A",             // tab bar fill (slightly deeper to anchor)
  hairline: "rgba(255,255,255,0.08)",   // 1px definition on pills/chips
  textPrimary: "#F2F2F2",               // always-readable white-ish
  textMuted: "rgba(242,242,242,0.55)",  // tab bar resting state
  accent: "#F5C77E",                    // unchanged; reused for active states
} as const;
```

Re-exported from `src/theme/index.ts` alongside `useTheme`, `type`, `tabularNums`.

**New primitive** `src/components/ink-pill.tsx`:

```ts
type InkPillSize = "pill" | "chip";

export function InkPill({
  size = "pill",
  children,
  style,
}: {
  size?: InkPillSize;
  children: ReactNode;
  style?: ViewStyle;
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

The `size` prop encodes the chip-vs-pill scale that was previously expressed as `intensity: 50` vs `intensity: 60` in the old BlurView call sites.

### Per-surface migration

#### 1. `MorphingPill` (`src/components/morphing-pill.tsx`)
- Remove `import { BlurView } from "expo-blur"`.
- Replace `<BlurView intensity={60} tint={...} style={styles.pill}>` with `<InkPill size="pill">`.
- Delete local `styles.pill` (owned by InkPill).
- Remove `theme.isDark` tint branching.
- `renderContent`'s `theme.textPrimary` references → `ink.textPrimary` (the pill is always ink, not themed).

#### 2. `ToastPill` (`src/components/toast-pill.tsx`)
- Same BlurView → InkPill swap.
- **Rename prop** `chrome: "blur" | "bare"` → `wrapped: boolean` (default `true`). Names describing the *relationship* (does the toast own its chrome, or is it nested inside someone else's?) travel better than names describing the *appearance*.
- Inside the row: `theme.textPrimary` → `ink.textPrimary`; `theme.accent` (for the Undo link) → `ink.accent` (same hex, but routed through the correct token namespace).
- Update the call site in `morphing-pill.tsx:176`: `chrome="bare"` → `wrapped={false}`.

#### 3. Gesture-guide chips (`src/components/gesture-guide-overlay.tsx`)
- The `Chip` sub-component at lines 164-177: `<BlurView intensity={50}>` → `<InkPill size="chip">`.
- Text color: `theme.textPrimary` → `ink.textPrimary`.
- The chip-vs-pill scale is now formalized instead of coded by varying blur intensity.

#### 4. NativeTabs bar (`src/app/(tabs)/_layout.tsx`)

Current (lines 33-52):
```ts
const blurEffect = theme.isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight";
backgroundColor={Platform.OS === "ios" ? "transparent" : theme.surface}
```

New:
```ts
// blurEffect removed entirely
backgroundColor={ink.surfaceTabBar}  // #0A0A0A on both platforms
iconColor={{ default: ink.textMuted, selected: ink.accent }}
labelStyle={{
  default: { ...LABEL_BASE, color: ink.textMuted },
  selected: { ...LABEL_BASE, color: ink.accent },
}}
// rippleColor / indicatorColor (warm overlays) stay as-is
```

The `Platform.OS === "ios" ? "transparent" : theme.surface` branch disappears — same value both platforms. Simpler.

**Known limitation.** `expo-router/unstable-native-tabs` exposes `blurEffect`, `backgroundColor`, `shadowColor`, and icon/label styling but no `borderTopWidth` / top-hairline prop. iOS typically draws a thin separator automatically when the bar isn't translucent (standard `UITabBar` behavior); Android typically does not. We accept the platform-default separator rather than fighting the API. If the Android bar reads as "floating unanchored" against dark gallery content during dogfooding, the follow-up is a `View` hairline overlay sitting above the bar — **not in v1.**

## Data flow

No state or data-flow changes. The MorphingPill ↔ ToastPill chrome-ownership relationship (encoded today as the `chrome` prop) is preserved verbatim, just renamed for clarity.

## Cleanup

After all four surfaces migrate:

- **Remove `expo-blur`** from `package.json` (line 28: `"expo-blur": "~55.0.14"`). Confirmed via grep that no other code imports it. Regenerate `package-lock.json` via `npm install` (repo uses npm). No `expo prebuild --clean` required — `expo-blur` is a JS-side wrapper and ships no native modules that need re-linking on removal.

- **Comment updates:**
  - `morphing-pill.tsx:18-20` — keep the clearance comment, add a line noting the tab bar is now solid (clearance is purely geometric, not blur-composition).
  - `(tabs)/_layout.tsx:11-16` — replace the "Cinematic bottom-bar treatment: translucent system material on iOS, brand surface on Android" comment with a one-liner naming the Editorial Ink identity.
  - `toast-pill.tsx:15-17` — delete the `// "blur" wraps in BlurView...` comment; the renamed prop is self-documenting.

## Scope guardrails (explicit non-changes)

To prevent drift during implementation:

- **Sheets** — `ActionsSheet`, `sort-sheet`, `photo-info-sheet`, `source-picker-sheet` are opaque shell surfaces, not glass. Untouched.
- **Theater chrome** — `theater-chrome.tsx`, `theater-pause-controls.tsx`, `theater-progress-bar.tsx`, `theater-long-press-menu.tsx`, `theater-toast.tsx` render on the always-dark theater background and don't use `BlurView`. Untouched.
- **Gesture-guide backdrop** — only the `Chip` sub-component uses BlurView; the surrounding dim-overlay system stays as-is.
- **The themed `Theme` type** — we *add* an `ink` sibling export, we do not change `Theme`'s shape. Light/dark theming for the rest of the app (gallery surfaces, sheets, tab content) is untouched.

## Testing / verification

No test infrastructure exists for this surface. Manual dogfood pass on a physical device for **both system themes**:

1. **Home (`(tabs)/index.tsx`)** — pill in resting "shuffle" state over a busy gallery. Verify white-on-ink readability across mixed-brightness photos.
2. **Home with selection** — long-press a tile, confirm pill morphs to "actions" state, count is readable.
3. **Album (`[albumId].tsx`)** — same checks, plus the back-button underlay still feels right against the new tab bar.
4. **Toast trigger** — favorite or delete an item, confirm toast pill renders inline with proper geometry (chrome ownership intact via `wrapped` prop).
5. **Theater toast** — open theater, trigger a toast, confirm standalone `ToastPill` renders with its own InkPill chrome.
6. **Gesture-guide overlay** — trigger first-run overlay, confirm both chips render at the smaller `size="chip"` scale.
7. **Tab bar both platforms** — iOS shows its automatic top hairline; Android may not. Note any floating/unanchored impressions.

**Contrast self-check:** `#F2F2F2` on `#111111` is ~17.4:1 (WCAG AAA). Warm accent `#F5C77E` on `#111111` is ~10.2:1 (AAA for normal text).

## Risk register

**The always-ink decision means the pill no longer adapts to the light system theme** — it's dark on a white gallery. We accept this as a feature (identity consistency). If dogfooding in light mode reveals it reads as "intrusive" rather than "deliberate," the escape hatch is making `ink.surface` and `ink.surfaceTabBar` follow the theme (still solid, still hairline-bounded, just inverted). One token change, not a re-architecture. Worth knowing it exists; not worth pre-building.

## File-by-file change inventory

| File | Change |
|---|---|
| `src/theme/palette.ts` | Add `ink` const export |
| `src/theme/index.ts` | Re-export `ink` |
| `src/components/ink-pill.tsx` | **New** primitive |
| `src/components/morphing-pill.tsx` | BlurView → InkPill; drop local pill styles; update text colors to `ink.*`; update ToastPill call site to `wrapped={false}` |
| `src/components/toast-pill.tsx` | BlurView → InkPill; rename prop `chrome` → `wrapped`; update text colors to `ink.*` |
| `src/components/gesture-guide-overlay.tsx` | BlurView → InkPill (`size="chip"`); update text color to `ink.*` |
| `src/app/(tabs)/_layout.tsx` | Drop `blurEffect`; set solid `backgroundColor: ink.surfaceTabBar`; route tab text/icon colors through `ink.*`; refresh leading comment |
| `package.json` | Remove `"expo-blur": "~55.0.14"` |
| `package-lock.json` | Regenerate via `npm install` |
