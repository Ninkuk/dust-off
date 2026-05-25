# TODO

## UI / Layout

- [x] **Safe-area support** — audit screens for proper `SafeAreaView` / `useSafeAreaInsets` usage so content (and especially Shell chrome) clears the notch, Dynamic Island, status bar, and home indicator on iOS + nav gestures on Android. Theater should remain edge-to-edge; Shell respects insets.
- [x] **Make "Shuffle All" button more prominent** — currently near-transparent, visually blending into the photo grid behind it. Bump contrast/elevation (solid surface, stronger weight, or floating chip treatment) so it reads as a primary action without breaking the cinematic-minimalism design language.
- [x] **Brand-driven bottom bar styling** — current bottom bar feels generic/system-default. Restyle to match the cinematic-minimalism design system: intentional surface treatment (material/blur/elevation), brand-correct typography + iconography, active/inactive states with proper weight, and consistent spacing tokens. Should feel like part of Dust Off, not a stock Expo Router tab bar.
- [x] **Show album name on album screen** — album view currently has no visible title/label, so users land in it without a clear sense of "which album am I in?". Surface the album name in the Shell chrome (near the back button, top-leading or centered per design), styled per the typography scale. Handle long names (truncate with ellipsis) and edge cases (system albums like Camera / Screenshots / WhatsApp / Saved / Selfies).
- [x] **In-app back button on album screen** — currently the album view has no visible back affordance; user must use the system/hardware back button (or Android gesture) to return to the album list. Add a back control in the Shell chrome (top-leading, brand-styled) so navigation is discoverable on both iOS and Android. Must work in tandem with the existing system back behavior, not replace it.
  - **Fix nav-stack when entering album via "Go to Folder" from a photo** — entering an album through a photo's "Go to Folder" action pushes the album on top of the gallery, so the system back button returns to the gallery (the photo's origin) rather than the album list. Result: user gets stranded in the wrong place and has no path back to the album list. Need a stack manipulation — e.g., `router.replace` to swap the gallery for the album-list root, then push the album, or use a custom `BackHandler` / `unstable_settings.initialRouteName` so back resolves to album list. Make sure iOS swipe-back and Android hardware/gesture back both land on album list, and the in-app back button (above) does the same.
- [x] **Quick-scroll for long photo grids** — long albums (hundreds–thousands of items) are tedious to navigate by finger-scroll alone. Add three coordinated affordances on the gallery / album grid:
  1. **Draggable scrub-bar (à la Apple Photos)** — a thin vertical indicator that appears on scroll and becomes grabbable for fast scrubbing through the full timeline. Show a date/section bubble next to the thumb while dragging so users know where they are.
  2. **Scroll-to-top button** — small floating action that appears after the user has scrolled past N viewport heights; tap returns to the top with a smooth animation (or instant for very long lists).
  3. **Scroll-to-bottom button** — symmetric jump-to-end affordance for getting to oldest items quickly.
     All three should auto-hide when idle, respect safe-area + bottom tab bar, and feel like part of the Shell chrome (Editorial Ink tokens, InkPill-style if appropriate). Consider performance: use the FlashList/FlatList `scrollToOffset` / `scrollToIndex` APIs and throttle the scrub indicator with Reanimated shared values to keep the JS thread free.
- [ ] **Reposition "Shuffle All" button — sits too high** — the button is anchored too far up the screen, away from the thumb arc. Move it down toward the natural thumb-reach zone, with proper bottom safe-area + tab-bar height offset, and a comfortable margin from grid content. Coordinate with the upcoming quick-scroll FABs (above) so the cluster of floating controls doesn't stack/overlap — pick a consistent vertical rhythm or group them.
  - **Bottom-edge blur / fade scrim** — once the button lives at the bottom, the photo grid behind it competes for attention and the button gets visually lost on bright/busy thumbnails. Add a blur (or gradient fade to surface) along the bottom edge of the scroll view so the button reads cleanly against a quieted backdrop. Use `expo-blur` `BlurView` (intensity tuned to design tokens) or a `LinearGradient` overlay from transparent → surface; either way it must sit _above_ the grid but _below_ the floating controls, span full width, height covers the FAB cluster + comfortable padding, and be ignored by touch (`pointerEvents="none"`) so taps still hit the grid. Should respect dark/light theme via the Editorial Ink tokens.

## Bugs

- [x] **No paused-state controls in slideshow** — pause itself works (advance timer halts), but the Theater shows no affordances while paused: no play/resume button, no scrubber, no next/prev, no exit/share/etc. Design + implement a paused-state control layer (overlay or chrome reveal) so users can resume, step, or act on the current photo. Should respect the two-zone design (chrome appears in Theater only on pause, fades on resume).
  - Must surface **all per-photo actions currently available via long-press in the grid**: at minimum **Favorite**, **Delete**, and **View info** (and any others wired into the long-press menu). Reuse the same action handlers / source-of-truth so behavior stays consistent between grid long-press and paused-slideshow controls.

## Release / Ops

- [ ] **Buy developer program memberships** — required before any store distribution.
  - **Apple Developer Program** — $99/yr, individual or organization (decide which; org needs DUNS + ~2 wk lead time). Needed for TestFlight, App Store, push certs, and EAS Submit to iOS. Set up at developer.apple.com → enroll. Capture team ID + Apple ID in EAS secrets / 1Password.
  - **Google Play Console** — $25 one-time, individual or organization. Needed for internal/closed/open testing tracks and Play Store releases via EAS Submit. Set up at play.google.com/console → create developer account. Capture package name decision + service-account JSON for EAS.
- [ ] **GitHub CI for PRs and main** — wire up GitHub Actions to enforce quality on every PR and main push.
  - Run `tsc --noEmit`, lint (`eslint` / project config), and unit tests on PRs.
  - Cache `node_modules` and Expo prebuild artifacts where applicable to keep runs fast.
  - Required status checks on `main` so red CI blocks merge.
  - Consider matrix (Node LTS, iOS/Android lanes) if/when relevant; start minimal.
- [ ] **Expo EAS distribution pipeline** — set up EAS Build + EAS Submit for both platforms so we can ship internal builds and store releases without Xcode/Android-Studio handholding.
  - `eas.json` profiles: `development` (dev client, ad-hoc), `preview` (internal-distribution APK + TestFlight), `production` (store-bound AAB + App Store).
  - Configure code signing: EAS-managed credentials for iOS (Apple cert + provisioning profile auto), Android keystore generated and stored in EAS.
  - Wire **EAS Submit** to push `production` builds to TestFlight (iOS) and Play Internal Testing (Android).
  - Trigger from CI on tagged releases (`v*`) — EAS workflow YAML in `.eas/workflows/` (see `expo-cicd-workflows` skill).
  - Environment variables: split per profile via EAS env vars; never bake secrets into the JS bundle.
  - Acceptance: a single command (or git tag push) produces a TestFlight + Play Internal build with the right version code/build number bumped automatically.
