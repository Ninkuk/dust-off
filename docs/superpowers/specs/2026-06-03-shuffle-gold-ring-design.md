# Shuffle button — animated gold gradient ring + larger size

**Date:** 2026-06-03
**Status:** Design — awaiting review
**Scope:** Single component enhancement (the shuffle pill in the bottom dock)

## Goal

Promote the shuffle pill to an unmistakable primary action by (1) wrapping it in
a slowly-rotating gold gradient border with a travelling highlight, and
(2) making it moderately larger. The pill *body* keeps the theme-aware chrome we
just shipped (black on light, near-white on dark, matching the bottom tab); the
gold ring is the one fixed-identity flourish layered on top.

## Decisions (confirmed)

- **Animation:** slow continuous rotation, ~5s per revolution (gentle "breathing
  glow," not a spinner). Pauses to a static ring when the OS *Reduce Motion*
  setting is on.
- **Size:** moderately larger — `minHeight` 44 → ~54, more horizontal padding,
  icon 16 → 18. Still a pill; leads the dock without overpowering the tab bar.
- **Gradient:** gold base with a single bright (near-white) highlight that
  travels around the ring — reads as a gold rim catching light.
- **Theme behavior:** the gold ring is **identity-fixed** (same `#F5C77E`-family
  gold in light and dark), consistent with the existing "Editorial Ink — fixed
  regardless of system light/dark" rule. Only the pill body flips with the theme.

## Why this works in both modes

- **Light:** black pill on white background → gold-on-black, the most dramatic case.
- **Dark:** near-white pill on near-black background → gold ring crisp against the
  dark *outer* background; slightly softer where it meets the near-white pill, but
  the travelling glint keeps it legible (reads as a white button with a gold rim).
- If dark mode ever feels weak by eye, an optional faint outer glow can equalize —
  not shipped initially; judged live.

## Architecture

Extract the shuffle pill into its own well-bounded component so `morphing-pill.tsx`
stays a thin dispatcher and the ring/rotation logic is isolated and testable.

**New component:** `src/components/shuffle-pill.tsx` — `ShufflePill`
- Props: `label: string`, `onPress`, `onLongPress?`, `bodyColor` (theme.textPrimary),
  `contentColor` (theme.surface). (Colors passed in so the component stays
  theme-agnostic, mirroring how `morphing-pill` already resolves theme tokens.)
- Owns: the gradient ring, the rotation animation, the sizing, and the existing
  `Pressable` + `Dices` icon + label.

**The ring technique** (no new dependencies — uses `expo-linear-gradient` +
`react-native-reanimated`, both already installed; `expo-linear-gradient` is
linear-only and there is no `masked-view`, so we avoid both):

1. **Ring container** — rounded (`borderRadius: 999`), `overflow: "hidden"`,
   `padding: RING_WIDTH` (~2pt). This padding gap is what becomes the visible ring.
2. **Rotating gradient layer** — an absolutely-positioned `LinearGradient` behind
   the body, sized to a **square of side = container diagonal** (measured via
   `onLayout`) and centered, so it fully covers the rounded shape at every rotation
   angle. A Reanimated `useSharedValue` drives `rotate` 0°→360° via
   `withRepeat(withTiming(360, { duration: 5000, easing: linear }), -1)`.
   Gradient stops (diagonal): `#8A6D3B → #F5C77E → #FFF4D6 (glint) → #F5C77E → #8A6D3B`.
3. **Body** — a solid view (`backgroundColor: bodyColor`, `borderRadius: 999`)
   filling the padded area, covering the center of the gradient so only the
   `RING_WIDTH` ring shows. Holds the `Pressable`, `Dices` (size 18,
   `color: contentColor`) and the label (`type.body`, `color: contentColor`).

**Reduce Motion:** read `useReducedMotion()` (reanimated). When true, skip the
repeat animation and render the gradient static (still a gold ring, just not
rotating).

**Integration:** in `morphing-pill.tsx`, the `case "shuffle"` block replaces its
inline `InkPill` + `Pressable` with `<ShufflePill ... />`, keeping the existing
`Animated.View` `popIn/popOut` entrance and the haptics wiring in `MorphingPill`.
`InkPill` is no longer used for the shuffle case but remains for the other pills.

## Sizing details

| Token | Before | After |
|-------|--------|-------|
| body `minHeight` | 44 | 54 |
| body `paddingHorizontal` | 20 | 24 |
| body `paddingVertical` | 10 | 14 |
| `Dices` size | 16 | 18 |
| icon→label gap | 8 | 8 (unchanged) |
| `RING_WIDTH` | — | 2 |

Label typography stays `type.body` (design system tops out at weight 400).

## Error / edge handling

- **Pre-measure render:** before `onLayout` reports a size, render the body with a
  static ring (no rotation / gradient sized to a sensible default) to avoid a flash
  of an oversized gradient. Once measured, the rotation engages.
- **Unmount:** the pill unmounts when the pill state leaves `"shuffle"`, so the
  infinite animation is naturally torn down; no manual cancel needed.
- **Long label:** diagonal-sized gradient covers arbitrary widths, so long
  localized labels still get a full ring.

## Testing

- **Visual / manual:** verify ring rotation + glint in light and dark; verify
  static ring with Reduce Motion on; verify long-press (shuffle-all) still fires;
  verify entrance `popIn` still plays.
- **Static checks:** `npx tsc --noEmit` and `npx expo lint` clean.
- No unit-test harness exists for these presentational components in the repo; the
  component is kept small and prop-driven so behavior is obvious by inspection.

## Out of scope

- Changing other pills (actions row, toast).
- Making the gold theme-aware.
- Outer glow / shadow (held as a fallback only).
