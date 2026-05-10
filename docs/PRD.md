# Dust Off — Product Requirements Document

**Working name:** Dust Off
**One-liner:** A randomized gallery and slideshow app that dusts off the photos you forgot you had.
**Author:** Ninad
**Date:** 2026-05-09
**Status:** v2 — design system + state architecture locked, ready for build

---

## Problem statement

Most people have thousands of photos sitting on their phones — birthdays, trips, idle moments — that they will never voluntarily scroll back to find. Native Photos apps are organized for retrieval (search, recent, by date) but offer almost nothing for serendipitous rediscovery. The cost of doing nothing is that personal libraries quietly become digital landfills: years of meaningful moments locked behind a chronological wall the user never breaks through.

Dust Off exists for the nostalgic photo hoarder — the person with a 5,000-to-50,000-photo library who would love to revisit it but never does. The wedge is twofold: a truly random browsing model and a dedicated, gesture-first slideshow experience. Everything is local, offline, and private; the photos and the app stay on the device.

---

## Goals

This is a hobby project. Success is qualitative, judged by personal use and (if shared) friend feedback — not by install volume, store ratings, or revenue. Success means:

1. **The wedge resonates.** Personal use (and any friends invited to try it) regularly surfaces "I forgot I had this photo" moments — at least weekly.
2. **Slideshow becomes a habit.** Daily or near-daily personal use of the slideshow without forcing it. If shared, friends report opening it unprompted.
3. **The randomization feels right.** The shuffle feels fair and surprising — not repetitive, not skewed to one era, not jarring.
4. **The app earns trust on privacy.** Privacy-by-design holds up in practice: airplane-mode test passes, no permissions beyond photos, no SDKs in the binary.

---

## Non-goals

The following are deliberately out of scope for v1, with rationale:

1. **Cloud sync, accounts, or backend services.** Violates the offline-first ethos and adds substantial complexity for a build expected in 6–8 weeks.
2. **Background music or audio in the slideshow.** Adds audio-focus, copyright, and permission complexity. Park as P2.
3. **Video playback in the slideshow.** Different rendering path, autoplay behavior, audio policy. Slideshow is photos-only in v1.
4. **AI features** (auto-curation, face grouping, smart albums, captioning). Off-strategy in a privacy-first app and out of scope for the first release.
5. **Tablet-optimized layouts.** Tablets must run, but layouts are designed for phone portrait/landscape only.
6. **"Recently Added" sort.** Best-effort metadata across iOS/Android creates inconsistent behavior. Cut to keep sort options trustworthy.
7. **Editing photos.** Not a photo editor.
8. **Sharing photos out** (system share sheet, AirDrop, social posts). Possible fast follow but not v1.
9. **Localization beyond English.** Strings will be designed for swap-in but only English ships.
10. **Telemetry, analytics, crash reporting.** Privacy-by-default. We will gather signal from store metrics and direct beta feedback only.

---

## Target user

**Primary persona — the Nostalgic Hoarder.** Has 5k–50k photos accumulated over years. Knows there are gems in there but never goes looking because chronological scrolling is exhausting. Has a complicated relationship with their library: sentimental attachment, mild guilt about not curating, occasional joy when a Memories notification surfaces something. They want a low-effort way to feel that joy more often.

**Secondary** — the privacy-minded user who avoids cloud-tied photo apps but still wants something more than the system Photos app for casual browsing.

---

## User stories

### First-time user

- As a new user, I want to understand what the app does before granting photo access, so I can decide whether to trust it.
- As a new user, I want a fast path from install to seeing my first photo, so I don't lose interest.
- As a new user, I want the slideshow to "just work" the first time without me configuring sources, so the wedge is felt immediately.

### Daily browsing

- As a returning user, I want my gallery to feel different every time I open it (random sort by default), so revisiting feels exploratory rather than repetitive.
- As a returning user, I want the app to remember my sort and grid-size preferences, so I don't have to re-set them each launch.
- As a returning user, I want to tap any photo and start a slideshow from that moment, so I can drift into a session without ceremony.

### Slideshow session

- As a user starting a slideshow, I want it to autoplay without a "Play" button, so I can put the phone down and watch.
- As a user during a slideshow, I want to tap once to pause and tap again to resume, with no chrome cluttering the photo, so the experience stays cinematic.
- As a user mid-session, I want to shake the phone to reshuffle, so I can break out of a stretch of uninteresting photos without going to a menu.
- As a user pausing on a photo, I want to pinch-zoom and pan, double-tap to favorite, or long-press for actions (favorite / delete / info / go to folder), so I can act on what I'm seeing.
- As a user who feels strongly about a photo I just saw, I want to swipe back to the previous photo, so I don't lose it.
- As a user who deletes by accident, I want an undo toast, so a slip doesn't cost me a memory.

### Curation

- As a user, I want to favorite photos as I encounter them in the slideshow or grid, so I can build a "best of" without dedicated effort.
- As a user, I want to long-press in the grid to enter selection mode, drag-select a range, and bulk-delete or bulk-favorite, so I can tidy quickly when the mood strikes.
- As a user, I want to start a slideshow from any folder, album, my favorites, or a specific selection, so the slideshow respects what I'm currently exploring.

### Source control

- As a user, I want to choose which folders/albums feed my slideshow and have that choice remembered, so my main slideshow shows the photos I actually care about.
- As a user, I want to know how many photos each folder has before I include it, so I can make informed source choices.

### Accessibility & control

- As a low-motion user, I want gesture-only controls to be replaceable with visible buttons, so I can navigate without learning hidden gestures.
- As a user sensitive to motion, I want shake-to-shuffle and Ken Burns-style transitions disabled when iOS/Android Reduce Motion is on, so the app respects my system setting.
- As a screen-reader user, I want every interactive element to have an accessible label, so I can use the app meaningfully.

### Edge cases

- As a user whose photo gets deleted by another app while I'm viewing it, I want the slideshow to skip to the next photo gracefully, so the app doesn't crash.
- As a user with iCloud-only photos, I want to choose whether they're included (and have them fetched on demand if so), so I'm not surprised by either skipped photos or unexpected downloads.
- As a user with videos in my library, I want to choose whether they appear in the gallery — but never in the slideshow — so the slideshow stays photos-only.

---

## Requirements

### Must-have (P0) — the wedge cannot ship without these

#### Gallery

| #    | Requirement                                                                                                   | Acceptance criteria                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-1  | Virtualized scrollable photo grid backed by `expo-media-library` and `expo-image`                             | Given a library of up to 50k assets, when I open the gallery, then thumbnails appear within 1.5s of permission grant and scrolling stays at ≥ 50fps on a mid-tier device                                                                    |
| G-2  | Default sort is **random**                                                                                    | Given I open the gallery for the first time, then photos appear in a randomized order (not chronological)                                                                                                                                   |
| G-3  | Sort options: newest, oldest, name, **random**                                                                | Given I tap the sort menu, then I see four options and the active one is checked. Note: "size" sort cut per D-12 — `expo-media-library` doesn't expose file size in `Asset` and per-asset `getAssetInfoAsync` is prohibitively slow at 50k. |
| G-4  | Persisted sort and grid-size preferences via AsyncStorage                                                     | Given I change sort or grid size and relaunch, then the app opens with my last selection                                                                                                                                                    |
| G-5  | Tap a photo to open the photo viewer                                                                          | Given a photo in the grid, when I tap it, then the viewer opens with that photo, scroll position preserved on dismiss                                                                                                                       |
| G-6  | Long-press to enter selection mode; drag-to-extend selection                                                  | Given I long-press a thumbnail, then a checkmark appears and the toolbar switches to selection mode; dragging across thumbnails toggles their selection                                                                                     |
| G-7  | Selection cap of 1,000 photos with a clear message at the limit                                               | Given I have 1,000 selected and try to add another, then a toast appears and the new selection is blocked                                                                                                                                   |
| G-8  | Bulk favorite and bulk delete from selection mode (with confirmation for delete)                              | Given I have N photos selected and tap delete, then I see a confirmation showing the count and a clear destructive button                                                                                                                   |
| G-9  | Albums view listing device folders/albums + Favorites                                                         | Given I open the Albums tab, then I see all device albums plus a built-in Favorites album with photo counts                                                                                                                                 |
| G-10 | Favorites stored locally per stable asset ID, undoable                                                        | Given I favorite a photo, then it appears in Favorites within 1s and an undo toast is offered                                                                                                                                               |
| G-11 | Gallery loads progressively and never blocks on full-library metadata                                         | Given a 50k library, then the first screenful renders before all metadata is fetched and the app remains interactive                                                                                                                        |
| G-12 | Adjustable grid size: compact / **comfortable** (default) / large                                             | Given I switch grid size, then thumbnails resize without a re-fetch and the choice persists                                                                                                                                                 |
| G-13 | Default lands on Gallery tab post-permission                                                                  | Given I grant permission, then the app shows the gallery grid (not slideshow, not albums)                                                                                                                                                   |
| G-14 | Photo info sheet showing filename, date taken/added, folder, size, dimensions, camera metadata when available | Given I open info on a photo, then all available fields display; missing fields are hidden, not blank-labeled                                                                                                                               |
| G-15 | Light/dark mode follows system                                                                                | Given system is in dark mode, then the app renders in dark mode without restart                                                                                                                                                             |

#### Slideshow

| #    | Requirement                                                                                                                    | Acceptance criteria                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| S-1  | Slideshow autoplays on entry; no "Play" button required                                                                        | Given I start a slideshow, then the first photo displays and advances automatically                                                              |
| S-2  | Default per-slide duration: **8 seconds**, presets selectable (3 / 5 / 8 / 10 / 15s)                                           | Given I open slideshow settings, then I see 5 preset chips and 8s is selected by default                                                         |
| S-3  | Default transition: **cross-fade**; user can choose between cross-fade and hard cut                                            | Given I switch transitions, then the change applies on the next slide                                                                            |
| S-4  | Photos display fit-to-screen (letterbox) — never cropped                                                                       | Given a portrait photo on a portrait phone or a landscape photo on a portrait phone, then the full image is visible with black bars where needed |
| S-5  | Random order uses a full shuffled queue with no repeats until exhausted                                                        | Given a source set of N photos, then no photo repeats within the first N slides; on exhaustion, the queue silently reshuffles and continues      |
| S-6  | Shuffle history is **not** persisted across sessions                                                                           | Given I exit and reopen the slideshow, then a fresh shuffle is generated                                                                         |
| S-7  | Tap right side or swipe left → next; tap left side or swipe right → previous; tap center → pause/resume                        | All four gestures work in the live slideshow; gestures are debounced to avoid double-fire                                                        |
| S-8  | Auto-hiding chrome: controls fade after 2s of inactivity                                                                       | Given I tap to reveal controls and then don't interact for 2s, then chrome fades back to a clean photo view                                      |
| S-9  | Pinch-to-zoom and pan when paused                                                                                              | Given a paused photo, when I pinch, then the photo zooms with the gesture; release retains the zoom level until the next slide                   |
| S-10 | Long-press menu when paused: Favorite / Delete / View Info / Go to Folder                                                      | Given a long-press, then a contextual menu shows these four actions                                                                              |
| S-11 | Double-tap to favorite, with distinct haptic + undo toast                                                                      | Given a double-tap, then the photo is favorited and a toast shows for ≥ 3s with Undo                                                             |
| S-12 | Delete is available **only** from the pause menu, with confirmation                                                            | Given I tap delete, then a confirmation appears and the photo is removed only after I confirm; the platform delete dialog (iOS) is honored       |
| S-13 | Shake-to-shuffle: default **on** at Medium sensitivity, only active in slideshow                                               | Given the slideshow is on screen and I shake the phone, then the queue reshuffles within 500ms with stronger haptic feedback                     |
| S-14 | Shake events are debounced to prevent rapid reshuffles                                                                         | Given I shake repeatedly, then only one reshuffle fires per ~1.5s window                                                                         |
| S-15 | Screen kept awake during active slideshow only                                                                                 | Given the slideshow is running, then `expo-keep-awake` is engaged; on exit, background, or stop, it disengages                                   |
| S-16 | Slideshow source: defaults to "All Photos" on first run; user can pick multiple folders/albums; Favorites is a built-in source | Given I open source settings, then I see All Photos, Favorites, and device albums with photo counts; multi-select persists                       |
| S-17 | If the current photo is unavailable (deleted/moved/cloud fetch fails), advance to next eligible photo without crashing         | Given an unavailable asset, then it is silently skipped and the next available photo loads                                                       |
| S-18 | Videos are excluded from the slideshow regardless of gallery video setting                                                     | Given my library contains videos, then they never appear during a slideshow                                                                      |

#### Onboarding & permissions

| #   | Requirement                                                                               | Acceptance criteria                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O-1 | Two-card intro on first launch (wedge + privacy promise) before any permission prompt     | Given a fresh install, then I see two intro cards I can swipe through, ending in a Continue button                                                                  |
| O-2 | Pre-prompt education card before the system permission dialog                             | Given I tap Continue, then a card explains why photo access is needed before the system prompt appears                                                              |
| O-3 | Limited photo access (iOS) is supported, with a way to update selection                   | Given I grant limited access, then the app works with the selected subset and offers a "Manage selected photos" entry in settings                                   |
| O-4 | Denied permission state has a clear recovery path                                         | Given I deny permission, then I see a screen explaining the consequences and a button that opens system settings                                                    |
| O-5 | Animated gesture-guide overlay on first slideshow, dismissible, re-openable from settings | Given my first ever slideshow, then a translucent overlay demonstrates tap-zones, swipe, pause, and shake; it dismisses on first interaction or via a Got it button |

#### Settings & accessibility

| #   | Requirement                                                                                                 | Acceptance criteria                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Settings screen with sections: Slideshow, Gallery, Gestures, Accessibility, Privacy, About                  | Given I open settings, then I see these sections collapsed/grouped sensibly                                                                                                                                                                                                                                                                                                                                                         |
| A-2 | Visible-button mode toggle (default off); when on, exposes Next / Previous / Pause / Favorite / Info / Exit | Given I turn it on, then visible buttons appear in the slideshow and replace gesture-only navigation                                                                                                                                                                                                                                                                                                                                |
| A-3 | Reduce Motion: auto-detected from OS by default; manual override available                                  | Given system Reduce Motion is on, then Ken Burns/slide transitions and shake are disabled by default                                                                                                                                                                                                                                                                                                                                |
| A-4 | Per-gesture toggles (shake, double-tap favorite, drag-to-select, etc.)                                      | Given I disable a gesture, then it stops responding everywhere it was active                                                                                                                                                                                                                                                                                                                                                        |
| A-5 | Shake sensitivity: Low / Medium (default) / High / Off                                                      | Given I change sensitivity, then the threshold updates within the current slideshow                                                                                                                                                                                                                                                                                                                                                 |
| A-6 | Haptics toggle (default on); haptics never the sole feedback channel                                        | Given I disable haptics, then all haptic calls are no-ops; visual/text feedback still appears                                                                                                                                                                                                                                                                                                                                       |
| A-7 | All interactive controls have accessible labels for VoiceOver/TalkBack                                      | Audited via system screen reader; no unlabeled tappable elements                                                                                                                                                                                                                                                                                                                                                                    |
| A-8 | Touch targets ≥ 44×44pt on iOS, ≥ 48×48dp on Android                                                        | Verified with platform inspector tools                                                                                                                                                                                                                                                                                                                                                                                              |
| A-9 | Undo toast on after favorite (default on); deletes use OS recovery channel (no in-app Undo)                 | Given a favorite, then a toast appears for ≥ 3s with an Undo action that fully restores prior state. Given a delete, then a brief `Gone.` toast appears with no Undo button; recovery is via system Recently Deleted (iOS, 30 days) or Trash (Android). Per D-12: in-app delete-undo cut because iOS `deleteAssetsAsync` is one-way and soft-delete-with-deferred-commit produces broken UX (system dialog appearing seconds late). |

#### Privacy & technical posture

| #   | Requirement                                                                      | Acceptance criteria                                                   |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P-1 | No network calls during normal app usage                                         | Verified by airplane-mode test: full app flow works offline           |
| P-2 | No telemetry, analytics, or crash reporting in v1                                | No SDKs from Firebase/Sentry/etc. shipped in the binary               |
| P-3 | No camera, microphone, location, contacts, or notification permissions requested | Verified in iOS Info.plist and Android manifest                       |
| P-4 | All preferences stored locally (AsyncStorage)                                    | Verified by clearing app data and confirming all preferences are gone |
| P-5 | Photo metadata is never persisted off-device                                     | No photo or metadata leaves the device under any circumstance         |

### Should-have (P1) — fast follows post-launch

| #    | Requirement                                                                                   | Notes                                                                 |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P1-1 | Ken Burns and slide-horizontal transitions                                                    | Foundation built in v1; ship after first round of beta feedback       |
| P1-2 | Configurable slide duration via slider (2–30s), beyond the 5 presets                          | Power-user request; presets cover most cases                          |
| P1-3 | Live Photo motion playback on long-press when paused                                          | v1 ships still-only; motion adds delight if reliable across platforms |
| P1-4 | Per-gallery slideshow start (start a randomized slideshow from any folder/album with one tap) | Implied by source selection but worth a dedicated entry point         |
| P1-5 | "Random photo" CTA on home/gallery (one-tap path to a single random photo, no slideshow)      | Lightweight surface-area for the wedge                                |
| P1-6 | iOS Photos.app-style "Years / Months" overview view                                           | Discovery aid for very large libraries                                |
| P1-7 | Share sheet (system share to message/email/etc.) from photo viewer                            | Non-trivial because it touches privacy posture; design carefully      |

### Future considerations (P2) — design now to enable later, do not build

| #    | Requirement                                     | Why we hold                                                                                                   |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| P2-1 | Ambient audio or background music in slideshow  | Audio focus, copyright, permission complexity                                                                 |
| P2-2 | Video playback in slideshow                     | Different rendering path, autoplay semantics, audio handling                                                  |
| P2-3 | Localization beyond English                     | Worthwhile but post product-market fit                                                                        |
| P2-4 | Tablet-optimized layouts                        | Phone-first is enough for v1 audience                                                                         |
| P2-5 | Lock screen / always-on display integration     | Platform APIs limited and divergent                                                                           |
| P2-6 | Apple TV / cast-to-TV slideshow                 | Compelling but a new platform                                                                                 |
| P2-7 | Local on-device clustering ("photos like this") | ML on-device is heavy; explore once audience justifies it                                                     |
| P2-8 | Local SQLite metadata index                     | Add if and only if perf testing at 50k+ proves AsyncStorage + paginated MediaLibrary queries insufficient     |
| P2-9 | iCloud-only asset prefetching strategy          | If included by user, currently fetched on demand; could add background prefetch with battery-aware throttling |

---

## Success metrics

This is a hobby project with no telemetry, analytics, or formal beta program. Signal comes from:

1. **Personal dogfooding (primary).** Ninad uses Dust Off as the primary photo-browsing app and keeps a weekly journal of what's working, what's annoying, and what surfaced unexpectedly.
2. **Direct friend feedback (optional).** If shared via TestFlight or sideload, conversational feedback from a small circle. No surveys, no scheduled interviews, no tagged review-mining.
3. **Stability under personal use.** No crash reporting in-binary (per P-2), but personal-use crashes are caught and fixed before they reproduce.

No quantitative targets — no install, retention, rating, or session-frequency goals. The bar is "I enjoy using it, friends who try it enjoy using it, and I'd notice if it broke."

---

## Decisions

The items originally tracked here as open questions have been resolved during planning. Decision log:

| #    | Topic                                                                         | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1  | Galeria reliability on Android at 50k libraries (was OQ-1)                    | **Spike Galeria in week 1**, not week 3, with a 50k mock library on a real Pixel 6a. Use Galeria for the gallery's tap-to-view photo viewer if the spike passes; otherwise fall back to a custom `expo-image` + Reanimated swiper. The slideshow engine is **always** custom — Galeria isn't a fit for shake-to-shuffle, custom transitions, or pause-mode pinch regardless. **Spike result 2026-05-09: PASS — see `docs/perf-baseline-phase0.md`. Phase 5 outcome 2026-05-10: viewer flipped to custom anyway** because DS-12 reconciliation revealed Galeria's sealed lightbox can't host the bespoke gesture set DS-12 demands (no overlay slot for `<TheaterChrome>`, `onLongPress` only fires on the inline trigger before the modal opens so S-10 is unimplementable, modal eats taps so DS-12 tap-zones can't bind, double-tap collides with Galeria's built-in zoom defeating S-11). Phase 6 forces custom regardless — slideshow autoplay, cross-fades, hairline progress, and shake-to-shuffle have no Galeria seat. Galeria stays installed at zero runtime cost; potential Phase 7+ "View on system Photos" affordance.|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D-2  | Cold-start and scroll fps on a mid-tier Android with 50k photos (was OQ-2)    | **Establish a perf rig in week 1**, not week 6. Mock-library generator + scroll harness on a real Pixel 6a (and an older iPhone). Three measurement gates: cold start to first thumbnail (≤1.5s per G-1), sustained fling fps (≥50fps per G-1), and memory ceiling (≤400MB on Android). Run the rig at end of weeks 1, 3, and 5. If pagination + `expo-image` caching prove insufficient by week 5, jump straight to the SQLite index from P2-8 — do not try to bridge with AsyncStorage.                                                                                                                                                                                                                        |
| D-3  | iCloud Photos behavior on iOS with Optimize Storage (was OQ-3)                | **iCloud-include toggle defaults OFF.** Toggle copy is explicit about cellular cost. When on, slideshow prefetches N+2 ahead with a ~2s per-slot timeout; on miss, fall through to S-17 (silent skip). Viewer shows a spinner during a download. Toggle is hidden on Android (concept doesn't apply to `MediaStore`).                                                                                                                                                                                                                                                                                                                                                                                            |
| D-4  | Android 14+ partial photo access vs iOS Limited (was OQ-4)                    | **Shared onboarding concept, platform-branched recovery UI.** iOS uses an in-app "Manage selected photos" entry that calls `presentPermissionsPickerAsync()`. Android uses an "Update photo access" entry that opens system settings via `Linking.openSettings()` with a one-line hint about why. While on partial access, gallery shows a persistent "X of Y photos shared with Dust Off · [Update]" banner.                                                                                                                                                                                                                                                                                                    |
| D-5  | App name "Dust Off" availability (was OQ-5)                                   | **Five-minute App Store + Play Store search this week.** This is a hobby project — skip the trademark/domain depth. If the name is taken in the developer-account region, rebrand to anything reasonable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-6  | "Recently Added" sort detection (was OQ-6)                                    | **Cut.** Inconsistent metadata across iOS/Android. Already removed from the sort options in §Requirements.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| D-7  | Empty-state UX when a selected source set has zero eligible photos (was OQ-7) | **Fail at slideshow start, not at source-picker save.** Two CTAs: `Adjust sources` and `Use All Photos`. Source picker shows post-filter eligible counts inline next to each album (e.g., `Wedding · 247 · 12 eligible`) so the user can choose well in the first place.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| D-8  | Gesture guide overlay re-trigger after a major version (was OQ-8)             | **Skip the machinery.** Commit to stable gestures post-launch instead of building a version-keyed re-show.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| D-9  | Phone call mid-slideshow behavior (was OQ-9)                                  | **Generalize, don't special-case.** Subscribe to React Native's `AppState`. On `inactive` or `background` while a slideshow is running, pause and disengage `expo-keep-awake`. On return to `active`, stay on the current photo — never auto-resume. One rule covers calls, notifications, swipe-up-to-home, screen lock, and Control Center.                                                                                                                                                                                                                                                                                                                                                                    |
| D-10 | Visual + interaction design architecture                                      | **Design system v1 locked** during /grill-me on 2026-05-09. 36 decisions covering aesthetic, IA, type, color, motion, surface treatments, identity, and micro-interactions. Cinematic minimalism + two-zone (shell/theater) thesis. See §Design system below for the full decision log.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| D-11 | State management + data flow architecture                                     | **State architecture v1 locked** during /grill-me on 2026-05-09. 14 decisions covering store partitioning, persistence layout, query shape, slideshow session lifecycle, undo/toast, selection, and cross-store actions. Three-bucket split (TanStack Query + Zustand persist + transient) thesis. See §State management & data flow below for the full decision log.                                                                                                                                                                                                                                                                                                                                            |
| D-12 | PRD deviations surfaced during architectural grilling                         | Two requirements were revised during the state-management grill (sibling of D-11). **G-3 size sort cut** because `expo-media-library` doesn't expose file size on `Asset` and per-asset `getAssetInfoAsync` is ~4 minutes at 50k photos (same pattern as D-6's "Recently Added" cut). **A-9 in-app delete-undo cut** because iOS `deleteAssetsAsync` is a one-way operation with no programmatic restore; soft-delete-with-deferred-commit produces broken UX (system dialog firing seconds after the user has moved on). System Recently Deleted (iOS, 30 days) and Trash (Android) are strictly better recovery channels than a 3s in-app window. **Favorite-undo retained** with full eager-apply + 3s toast. |

OQ-10 (Pro tier pricing and feature split) is dropped — this is a hobby project, with no monetization track planned.

---

## Design system

**Locked v1 on 2026-05-09 via /grill-me on app design.** This section captures 36 architectural design decisions covering aesthetic, IA, type, color, motion, surface treatments, identity, and micro-interactions. These are the source of truth for any UI/UX work. The PRD's user stories and §Requirements describe what the app does; this section describes what it looks like and how it feels.

**Why these are locked:** Most decisions have non-obvious rationale tied to the cinematic-minimalism thesis (photos lead, chrome melts away) and the two-zone split that recurs through the system (shell = utility/snappy/themed/neutral vs theater = identity/slow/dark/poetic). Capturing them prevents future work from drifting back to default Expo template patterns or re-deciding what's already settled.

**How to apply:** Before designing or implementing any new screen, modal, or component, check this list. If a decision below covers it, follow that decision. If a decision conflicts with a build-time constraint (e.g., perf), flag it before deviating.

### The thesis: cinematic minimalism + two-zone

Every "two-mode" decision draws the same boundary:

| Zone                                                                        | Mode     | Theme                       | Motion                     | Voice           |
| --------------------------------------------------------------------------- | -------- | --------------------------- | -------------------------- | --------------- |
| **Shell** (Gallery / Albums / Settings)                                     | Utility  | Follows system (light/dark) | Snappy 180–250ms           | Neutral-utility |
| **Theater** (photo viewer + slideshow + onboarding + empty states + splash) | Identity | Always near-black           | Slow 400–600ms cross-fades | Sparse-poetic   |

The shuffle pill (always-glass, always-bottom) is the universal action surface that bridges both zones.

### Foundational (DS-1 through DS-10)

1. **Aesthetic:** Cinematic minimalism — photos lead, chrome melts away. Reverent, theater-like.
2. **Theme split:** Theater always-dark (overrides system); shell follows system theme. PRD G-15 still holds for the shell.
3. **IA:** 3 tabs (Gallery / Albums / Settings) using **Native Tabs** (Expo Router). Slideshow is _not_ a tab — it's a session.
4. **Shuffle pill:** Floating glass pill above the tab bar, auto-hides on scroll.
5. **Pill behavior:** Context-aware label & action — `Shuffle All` in Gallery, `Shuffle [Album Name]` in album detail, `Actions · N` in selection mode, `Gone.` or `Saved. · Undo` as toast. Long-press opens source picker (override).
6. **Typography:** System sans (SF Pro / Roboto) for all text + tabular monospace for **all numerals** (counts, positions, durations, file sizes). On iOS use `fontVariant: ['tabular-nums']` (free, no custom font). Display tier reserved for hero/threshold moments only.
7. **Color:** 5 tokens. `surface.theater = #000`, `surface.shell.dark = #0A0A0A`, `surface.shell.light = #FFFFFF`, `text.primary` (off-white in dark, black in light), `accent.warm = #F5C77E` (amber). Amber used **only** for: favorited heart fill, active-session indicator on shuffle pill, onboarding accents, destructive-confirm Delete row text. Never for nav, never for default buttons, never for links.
8. **Iconography:** Lucide (`lucide-react-native`) — single library, both platforms. Locked stroke width = 1.5px globally; 2px reserved exclusively for the shuffle pill icon as a subtle hero-affordance signal.
9. **Theming primitive:** Plain `StyleSheet.create()` + a typed tokens module at `src/theme/`. No NativeWind, no Restyle, no Tamagui. Hook: `useTheme()` returns palette resolved from `useColorScheme()`. Theater override is one `<ThemeProvider value={darkTheme}>` wrap on the slideshow route.
10. **Motion:** Two-zone preset module at `src/theme/motion.ts`. Shell uses snappy springs/durations (180–250ms). Theater uses slow cross-fades (400–600ms), soft springs only (no overshoot). Tap feedback always 80–120ms regardless of zone. Custom 250ms "lights dim" fade-through-black for shell→theater transitions.

### Surfaces (DS-11 through DS-20)

1. **Gallery grid:** Hairline tapestry — 1px gutters (shell-bg color showing through, **not** borders), square crops, no section headers. Top safe-area strip with mono numerical photo count + sort affordance. Grid sizes (G-12): comfortable = 3 cols portrait (default), compact = 4, large = 2; landscape +2 cols each. Gutter stays 1px regardless of mode.
2. **Photo viewer = theater (paused):** Single unified mode. Tap photo → 250ms fade-through-black → photo opens letterboxed in pure-#000 theater, paused. Gestures: tap-center toggles play/pause; horizontal swipe / tap-edges = prev/next; swipe-down = dismiss; pinch+pan when paused; long-press = contextual menu; double-tap = favorite. The PRD's "viewer" and "slideshow" reduce to one screen with a play/pause state — clarifies G-5/S-1/user-story tension.
3. **Theater chrome:** Single top safe-area strip on tap-reveal (source · `47 of 248` · `×`); auto-hides after 2s (S-8). **Always-visible 1px hairline progress bar** at very top edge while playing (disappears when paused). Exit: top-strip `×` button **and** swipe-down (redundant for accessibility + speed).
4. **Albums view:** 2-col grid, square covers, name + mono count below. **Cover photo = random photo from album, resampled per app-cold-start session** (uses same per-session seed as slideshow shuffle). Favorites pinned first, then alphabetical. Empty Favorites card shows inline empty state (heart outline) — no separate empty screen for in-grid cases.
5. **Settings architecture:** iOS-style hierarchical. Top-level Settings tab = list of 6 section rows (Slideshow / Gallery / Gestures / Accessibility / Privacy / About) each with a chevron and a **subtitle showing current configuration** (e.g., `Slideshow · 8s · Cross-fade`, `Privacy · No data leaves your device`). Tap → push to sub-page. Each sub-page is a focused list of `<SettingRow>` instances. Privacy sub-page is prose, not rows.
6. **Onboarding:** Pure typography on near-black (no images). 3 cards total, identical visual language: Card 1 `Photos you forgot you had.` → Card 2 `Stays on your phone.` → Pre-prompt card `To shuffle your photos, the app needs access to them.` + `Continue` → system permission dialog. Display-tier type (~36-44pt body, weight 300/400, generous leading). Negative space is the design.
7. **Voice (two lanes):** Sparse-poetic for hero/threshold (onboarding, empty states, post-action toasts, transition titles, gesture-guide, Privacy prose) — examples: `Gone.` `Saved.` `Reshuffled.` `Nothing yet.` Neutral-utility for chrome/utility (settings labels, sort menu, button labels, error messages with technical content) — examples: `Slide duration` `Cross-fade` `Hard cut`. All strings live in `src/lib/strings.ts` grouped by context.
8. **Selection mode:** Existing chrome morphs — top strip count → `3 selected`, sort → `Cancel (×)`. Shuffle pill → `Actions · 3` opening a glass sheet with `Favorite all` / `Delete all` / `Slideshow these N`. Selected thumbs gain 2px amber border + small amber filled-circle check (bottom-right). **Non-selected thumbs unchanged** (no dim — keeps gallery photo-forward). Drag-extend (G-6) toggles selection in long-press direction.
9. **Gesture-guide overlay (O-5):** Single animated translucent overlay on first slideshow only (gated by AsyncStorage `seenSlideshowGuide` flag). All gestures shown simultaneously: 3 pulsing dots in left/center/right thirds with `‹` `‖` `›`, ghost-finger swipe loop (~2s), `⚡ Shake` chip top-center, `♥♥ Double-tap to favorite` chip bottom-center. Translucent dark scrim (~70% over photo). Scrim fades in 400ms after slideshow start. Dismisses on first tap or `Got it` button. Re-openable from `Settings → Gestures → Show gesture guide on next slideshow`.
10. **Empty/error states:** Pure typography on near-black, vertically-centered single-line poetic copy + optional CTA button. No icons. Display-tier type. Same canvas as onboarding. Examples: `No photos to dust off.` + `Open Settings` (denied), `Nothing yet.` (empty Favorites), `Nothing to shuffle.` + `Adjust sources` / `Use All Photos` (D-7). One `<EmptyState>` component covers all full-screen cases.

### Identity & micro-interactions (DS-21 through DS-25)

1. **App icon + splash:** Single small warm amber spark (radial gradient `#F5C77E` core → transparent edge with smaller core dot) on near-black canvas. Same canvas as theater + onboarding + empty states. Splash = static spark-on-black PNG via `app.json` `splash` config; manually `SplashScreen.preventAutoHideAsync()` at app start, `SplashScreen.hideAsync()` only after gallery first thumbnails decoded — fade-out from splash → gallery is the reveal moment.
2. **Sheets / menus (hybrid):** Custom glass-blur sheets (rounded top corners ~16px, glass tint, sparse rows) for normal menus — long-press menu, source picker, sort menu, selection actions. Use `@gorhom/bottom-sheet`. **Native platform Alert / ActionSheet for destructive confirmations** (delete, etc.) — borrows platform trust signal. Two patterns invoked in mutually exclusive contexts.
3. **Tab bar:** Native Tabs with glass blur (iOS 26 Liquid Glass), Lucide icons + Caption-tier labels (10pt, weight 400), no badges. Glass-on-glass (tab bar + shuffle pill) must share blur intensity to look right.
4. **First post-permission gallery reveal:** Sequential row-by-row thumbnail fade-in (~40ms stagger between rows, ~200ms fade per row, ~600ms total). One-time only — gated by AsyncStorage `hasSeenFirstReveal` flag. Doubles as perceptual cover for image decode time. Animation fires only after `gallery.isReady`.
5. **Toast / undo (G-10, S-11, A-9):** Shuffle pill morphs into the toast for ~3s (favorites) or ~2s (non-undo flashes), then morphs back. `Saved. · Undo` for favorites; `Gone.` (no undo, per D-12) for deletes; `Reshuffled.` for pull-to-shuffle. No new chrome surface. The pill is now a 4-state element — Shuffle / Actions / Toast / Hidden. In theater (where pill is hidden), an inline pill-aesthetic toast renders at the same mount point as the theater chrome strip.

### Reusable primitives implied

The 25 architectural decisions reduce to ~10 reusable React Native primitives:

- `<MorphingPill>` — Shuffle / Actions / Toast / Hidden states; ~80 lines
- `<Sheet>` — glass bottom sheet wrapper around `@gorhom/bottom-sheet`
- `<EmptyState>` — `{ title, action?: { label, onPress } }`
- `<SettingRow>` — `{ type: 'toggle' | 'select' | 'navigate' | 'destructive', ... }`
- `<GalleryGrid>` — FlashList with 1px-gutter rendering
- `<TheaterChrome>` — top strip + hairline progress
- `<OnboardingCard>` — Display-tier text on near-black
- `<AlbumCover>` — square thumb + name + mono count, random per session
- `<TabBar>` — Native Tabs config wrapper
- `<RevealOverlay>` — first-launch row-by-row reveal

### Hidden constraints overriding the voice rule

Some surfaces have legal/store-review constraints that override the sparse-poetic voice rule (DS-17). When a screen describes a permission, data use, or destructive action in detail, **explicit explanatory copy is mandatory** even though it dilutes the cinematic identity.

**Why:** App Store (strict) and Play Store (less strict) reviewers reject apps for ambiguous permission copy. They require:

1. Clear statement of _what_ permission is needed
2. Clear statement of _why_ it's needed
3. Clear statement of _what happens to the data_ (especially for photo/contact/location access)

**How to apply:** On these screens, use the hybrid pattern — sparse-poetic title carries identity, explanatory subtitle satisfies review, CTA stays terse:

- Permission denied screen: `No photos to dust off.` + `Dust Off needs photo access to display and shuffle your library. Nothing leaves your device.` + `[ Open Settings ]`
- Pre-prompt education card (O-2): same pattern
- Privacy sub-page in Settings: prose carries the full data-handling explanation
- Limited-access banner (D-4): one line, but explicit (`X of Y photos shared with Dust Off · Update`)

Applies to: permission rationale, privacy sub-page, destructive confirmations (delete copy must be explicit about permanence), and any system-permission-adjacent flows. Does NOT apply to: gallery, theater, settings rows, empty states for non-permission cases (`Nothing yet.` is fine for empty Favorites).

### Leaf-level decisions (DS-26 through DS-36)

These were originally listed as build-time leaves but were resolved during the same /grill-me session. They sit downstream of the 25 architectural decisions but are firm enough to lock.

1. **Tab labels:** `Gallery` / `Albums` / `Settings` (matches PRD terminology; "Gallery" carries faint art-museum register that quietly differentiates from generic "Photos" apps).
2. **Source picker (S-16, D-7):** Full-screen glass sheet, sparse-poetic title (`Where to shuffle from?`). Rows = small thumbnail (reuses per-session Album cover) + name + mono counts (raw + eligible if different) + checkbox right. `All Photos` and `Favorites` pinned at top, custom albums alphabetical below. Auto-save on dismiss (no `Done` button). Helper: `formatCount(total, eligible)` returns `"247"` or `"247 · 12 eligible"`.
3. **Permission denied screen (O-4):** Hybrid pattern — sparse-poetic title + explanatory subtitle + CTA. Copy: `No photos to dust off.` / `Dust Off needs photo access to display and shuffle your library. Nothing leaves your device.` / `[ Open Settings ]`. Subtitle is required for App Store compliance (see "Hidden constraints" subsection).
4. **Photo info sheet (G-14):** Single flat list of label-value rows in glass sheet. Field labels in caption-tier (left), values in body-tier with mono numerals (right) — right-aligned column reads like a film camera's data display. Field order: Name, Date taken, Album, Dimensions, Size, [blank row], Camera, Lens, Focal, Aperture, Shutter, ISO. Camera section separated from file fields by a blank row (no headers — visual grouping only). `<InfoRow label value />` returns `null` when value is falsy → handles G-14's "missing fields hidden" rule in ~5 lines.
5. **Shuffle pill icon glyph:** Lucide `Sparkle` (single 4-pointed) at 2px stroke (the hero exception from DS-8). Identical shape to the app icon's amber spark — same glyph as app icon ↔ universal action button. Tinted warm-amber when active session running, white otherwise. In selection-mode pill state (`Actions · N`), icon swaps to `MoreHorizontal` or omits.
6. **Pull-down gesture in gallery:** Triggers reshuffle AND switches sort to `Random` (commits to random regardless of current sort). Photos visibly jumble during pull-progress, settle into new order on release with strong haptic at snap point. After commit: brief `Reshuffled.` toast (~1.5s) in pill toast slot. If user is at non-zero scroll offset, keep their visible row at the top of the new shuffle (no scroll-to-top jump).
7. **Sort menu trigger placement:** Top safe-area strip is a single combined string `Random · 12,847` (sort name + middot + mono count). Tap anywhere on the string opens the sort sheet. Press feedback: 80ms opacity dip (`opacity: 0.6`) on whole string. When sort changes (via menu or pull), animate the sort word swap; count stays put.
8. **Visible-button mode layout (A-2):** Two strips when enabled. Top strip extended: `source · position · ⓘ ×` (Info icon added next to Exit; auto-hides like default mode). Bottom strip persistent: `◀ ⏯ ▶ ♡` — 4 evenly-spaced buttons in glass-blur strip (~80pt tap targets), `⏯` swaps between `▶` and `⏸` to reflect actual play state. Persistent bottom strip IS the indicator that visible-button mode is on (no separate badge needed).
9. **iCloud-included toggle (D-3):** Single toggle row in `Settings → Slideshow`. Title: `Include iCloud photos`. Subtitle: `Downloads on demand · cellular data may apply`. Single-line `Platform.OS === 'ios' && <SettingRow ... />` — row simply doesn't render on Android. In-viewer download spinner = thin amber-tinted pulsing ring, ~24pt, ~2s loop, no "Loading…" text.
10. **Destructive confirmation copy (S-12, G-8):** Native platform Alert (per DS-22). Neutral-utility voice (system dialogs reject poetic copy). Title: `Delete photo?` (single) or `Delete N photos?` (bulk). Body: platform-branched — iOS `This photo will be moved to your Recently Deleted album.`, Android 11+ `This photo will be moved to Trash.`, older Android `This photo will be deleted from your library.` Destructive button = `Delete N` with explicit count interpolated (re-confirms count at moment of action). Helper: `getDeleteConfirm(count, platform)` → `{ title, body, destructive }`. **Implementation deviation locked 2026-05-10:** the app-level `Alert.alert` only fires on **Android <11**; iOS and Android ≥11 skip it because `MediaLibrary.deleteAssetsAsync` triggers an OS-level confirmation dialog on those platforms (iOS Recently Deleted prompt; Android `MediaStore.createTrashRequest`). Showing the app Alert on top would double-confirm. The platform gate lives in `lib/delete-confirm.ts:confirmDeleteIfNeeded`. The OS-dialog cancel-restore flicker (SM-13's accepted <500ms) now applies to iOS *and* Android ≥11. The body copy above remains the source of truth for the Android <11 app-Alert. **Favorites/unfavorites do NOT confirm** — undo toast is the recovery (per A-9). **Deletes do NOT show an in-app undo toast post-confirm** — system Recently Deleted/Trash is the recovery (per D-12); only a brief `Gone.` flash.
11. **Long-press haptic + visual feedback (G-6, S-10, A-6):** Anticipatory expanding amber ring from touch point during hold. Implementation: `<LongPressRing x y progress />` where `progress` is a Reanimated shared value 0→1 over `delayLongPress` duration (default ~400ms); SVG circle with `r = interpolate(progress, [0,1], [0, 24])`, `opacity = interpolate(progress, [0, 0.8, 1], [0.4, 0.7, 0])`. On commit: medium haptic + thumbnail scales to ~96% + amber border flashes (~200ms). On early release: ring radius animates back to 0 over 150ms (cancel feedback). Same component used in gallery (selection commit) and slideshow (contextual menu).

### Design system re-evaluation triggers

- **Perf checkpoint at end of week 1** (per D-2): if cinematic motion lags on Pixel 6a, motion presets need re-grilling.
- **First friend-feedback round** (post-week 8): if friends find the gestural language opaque, gesture-guide overlay or visible-button mode defaults may need revisiting.
- **Galeria spike outcome at end of week 1** (per D-1): if Galeria fails, the photo-viewer = theater design (DS-12) needs reconfirmation against the custom Reanimated viewer's capabilities.

---

## State management & data flow

**Locked v1 on 2026-05-09 via /grill-me on state management and data flow.** This section captures 14 architectural decisions covering store partitioning, persistence layout, query shape, slideshow session lifecycle, undo/toast, selection, and cross-store actions. These are the source of truth for state architecture. Sibling to §Design system above.

**Why these are locked:** Most decisions encode non-obvious trade-offs (e.g., how MediaLibrary's lack of `random` sort + lack of `size` field shape the entire query architecture, or why iOS's one-way `deleteAssetsAsync` forces D-12's deviation on delete-undo). Capturing them prevents future work from re-discovering pitfalls or drifting back to default Expo template patterns.

**How to apply:** Before introducing any new store, query, or cross-cutting action, check this list. If a decision below covers it, follow that decision.

### The thesis: three-bucket split + derived UI

State is partitioned by **what kind of state it is**, not by feature:

| Bucket                                                       | Mechanism                        | What lives here                                   |
| ------------------------------------------------------------ | -------------------------------- | ------------------------------------------------- |
| **Server-state-ish** (async I/O, paginated, invalidate-able) | TanStack Query                   | MediaLibrary asset queries, albums, permission    |
| **Persisted client state**                                   | Zustand `persist` (AsyncStorage) | Preferences, first-launch flags, favorites        |
| **Transient client state**                                   | Plain Zustand stores             | Selection, toast, gallery seed, slideshow session |

UI elements that look like state (the shuffle pill's 4-state morph) are **derived selectors** over upstream stores, not their own stores.

### Foundational architecture (SM-1 through SM-6)

1. **Three-bucket split.** TanStack Query for MediaLibrary + permission; Zustand+`persist` for preferences/flags/favorites; plain Zustand for transient cross-screen state. Theme stays plain Context per DS-9.
2. **All-IDs shuffle for random sort.** `getAssetsAsync` has no `random` sortBy, so random sort = fetch every asset ID upfront via paginated `getAssetsAsync` (~3–5s background work on cold start), build a shuffled `string[]` in memory, paginate metadata by ID-slice on scroll. First screenful renders from the first ID page (~80ms) before full ID list arrives (G-11). The shuffled ID array is shared substrate for gallery random sort (G-2) and slideshow queue (S-5). SQLite mirror (P2-8) stays an escape valve, gated on D-2's perf rig.
3. **Independent slideshow queues with one primitive.** `startSlideshow({ sourceSet, startAtId? })` is the only entry point. Every launch path (tap-photo, pill `Shuffle All`, pill `Shuffle [Album]`, selection `Slideshow these N`) uses it. Slideshow route creates+disposes its own queue per session — naturally satisfies S-6 (no cross-session persistence). Gallery has its own shuffle seed in `useGalleryStore` (lives across tab switches but not cold starts).
4. **Two persisted Zustand stores.** `usePreferencesStore` (prefs + first-launch flags) and `useFavoritesStore` (`Set<string>` in memory, sorted `string[]` on disk via custom serialize/deserialize). AsyncStorage honors P-4 literally; swap to MMKV later is a 5-line `storage` adapter change if D-2's perf rig demands. Favorites isolated to avoid write-amplification on prefs every favorite-toggle.
5. **Source-keyed query with sort+shuffle as `select` derivations.** `useAssetsQuery(sourceSet)` is the canonical query; switching sort = instant (re-derives from cache); switching shuffle seed = instant. Newest/oldest server-sorted via `sortBy: 'creationTime'`; name client-sorted via `localeCompare`; random client-shuffled with seed. Per D-12: "size" sort cut.
6. **Blunt debounced library-change invalidation.** `MediaLibrary.addListener` debounced 500ms calls `queryClient.invalidateQueries({ queryKey: ['assets'], refetchType: 'active' })`. **Slideshow-immune** (active session ignores invalidations; relies on per-slide S-17 skip). **Favorites tolerate-and-filter** (no proactive Set pruning; unknown IDs skipped at render). **Foreground-only listening** (sub on AppState→active, unsub on background). Surgical iOS patches deferred — cross-platform divergence not worth it for hobby scale.

### Stores & hydration (SM-7 through SM-9)

1. **Four transient stores; pill is a derived selector.** `useSelectionStore`, `useToastStore`, `useGalleryStore`, `useSlideshowStore` (route-scoped via `createStore()` + `<SlideshowStoreProvider>` wrapping the theater route group). Permission lives in TanStack Query (`['permission']`, refetch on AppState→active). The shuffle pill's 4-state morph (Shuffle / Actions / Toast / Hidden) is a `usePillState()` selector reading selection + toast + route — **no dedicated pill store**.
2. **Block-render on persist hydration; staged splash dismissal per branch.** `<SplashGate>` at root renders `null` until both persisted stores hydrate. Then branches:
   - Onboarding (`!hasSeenOnboarding`) → splash hides on persist hydration only.
   - Denied (`permission !== 'granted'`) → splash hides on hydration + permission.
   - Gallery → splash hides on hydration + permission + first-page resolved + first-thumbnail `onLoad` OR 1s backstop.

   Eager prefetch `useAssetsQuery({ kind: 'all' })` as soon as permission is `granted` (hides bridge round-trip behind splash). Splash fade duration 400ms.

3. **`SourceSet` is a flat 5-variant discriminated union.**

   ```ts
   type SourceSet =
     | { kind: "all" }
     | { kind: "favorites" }
     | { kind: "album"; albumId: string }
     | {
         kind: "union";
         albumIds: string[];
         includeAll: boolean;
         includeFavorites: boolean;
       }
     | { kind: "ids"; ids: readonly string[] }; // selection escape hatch
   ```

   `'ids'` is **never** a TanStack Query key — handled in-memo against the cached `'all'` query. `'union'` normalizes `albumIds` lexicographically before keying. Persisted preference type excludes `'ids'`: `Exclude<SourceSet, { kind: 'ids' }>`.

### Slideshow & interactions (SM-10 through SM-12)

1. **Slideshow timer in store actions; centralized `_scheduleNext()`.** JS `setTimeout` (drift-free at second-scale is a non-goal). Every index-mutating action (`play`, `pause`, `next`, `previous`, `reshuffle`, `skipUnavailable`) clears+reschedules through one internal method. Coordinator hooks live in slideshow root: `useKeepAwakeWhilePlaying`, `useAppStatePause` (D-9), `useShakeToShuffle` (S-13/S-14, sensitivity-gated, debounced 1.5s), `useAssetLoadFailureSkip` (S-17). Sub-decisions:
   - **(α) Shake keeps current photo, shuffles future queue.** New shuffle from same source-set; current photo continues; index continues into the new queue. More cinematic than reset-to-0.
   - **(β) Resume from pause restarts full duration.** Tap-to-pause then tap-to-resume = fresh ~8s, not "0.5s left."
   - **(γ) AppState→active stays paused.** Verbatim D-9; user must explicitly tap to resume.
2. **Single-slot `useToastStore`; no in-app delete-undo on either platform.** Discriminated union of `'undo-favorite' | 'undo-unfavorite' | 'flash'`. Single slot, replace-on-new (commits prior). Single shared timer. Commit-on-AppState-background (clear pending state when app backgrounds). Favorites get eager-apply + 3s undo toast. **Deletes show `Gone.` flash without undo** per D-12 — system Recently Deleted (iOS, 30 days) and Trash (Android) are the recovery channels.
3. **Selection: range-extend drag-select; 1000 cap with one-shot toast.** Apple-Photos-style range from anchor; reverse drag contracts. `useSelectionStore.toggle()` returning `false` at cap fires `'Limit reached: 1,000 photos.'` flash once per drag. Selection persists across Gallery↔Albums tab switches. Cleared on: × button, bulk-action completion, cold start. **Preserved through slideshow-from-selection** — returning from theater, selection is still active (curation is a multi-step intent).

### Cross-store mechanics (SM-13 through SM-14)

1. **Compound actions as custom hooks in `src/actions/`.** Multi-store mutations (pull-to-shuffle, single/bulk favorite, bulk delete, slideshow-from-selection, onboarding-complete) live as `useReshuffleGallery()`, `useFavoritePhoto()`, `useBulkDelete()`, etc. Each returns a stable callback. **Optimistic delete** via `queryClient.setQueryData` (filters deleted IDs out of `['assets', ...]` cache before `deleteAssetsAsync`); library-change listener (SM-6) reconciles. Cancel-restore flicker on iOS dialog cancel is acceptable feedback (self-corrects in <500ms).
2. **Three leaf decisions for completeness:**
   - **Pull-to-shuffle anchor as a shuffle parameter.** `seededShuffle(assets, seed, { anchorIds })` returns `[...orderedAnchors, ...shuffled(rest)]`. Anchor logic lives inside the shuffle, not as post-process. DS-31's "keep visible row at top" works via this parameter.
   - **`useReducedMotion()` hook** resolves OS (`AccessibilityInfo`) + `usePreferencesStore.reduceMotionOverride: 'auto' | 'on' | 'off'`. No new store. All animation/shake call sites read from it.
   - **Scroll position preservation = no state.** Expo Router native stack suspends the previous route; FlashList's internal scroll preserves automatically. **Explicit non-decision** — do not add a `useGalleryStore.scrollOffset` slice.

### Implied directory structure

```
src/
  state/
    preferences-store.ts          # Zustand + persist (prefs + flags)
    favorites-store.ts            # Zustand + persist (Set<string>)
    selection-store.ts            # Zustand transient
    toast-store.ts                # Zustand transient (undo + flash union)
    gallery-store.ts              # Zustand transient (seed + anchor candidates)
    slideshow-store.ts            # Factory: createStore() + Provider + hooks
  queries/
    use-permission-query.ts       # TanStack Query
    use-assets-query.ts           # TanStack Query (sourceSet → Asset[], with select derivations)
    use-albums-query.ts           # TanStack Query
  actions/
    use-reshuffle-gallery.ts      # pull-to-shuffle compound
    use-favorite-photo.ts         # single favorite + undo toast
    use-bulk-favorite.ts
    use-bulk-delete.ts            # optimistic + system dialog
    use-start-slideshow-from-selection.ts
    use-onboarding-complete.ts    # request perm + flag + navigate
  hooks/
    use-pill-state.ts             # derived: PillState from selection/toast/route
    use-pill-context-label.ts     # 'Shuffle All' / 'Shuffle [Album]' / etc.
    use-reduced-motion.ts         # OS + override resolution
    use-splash-gate.ts            # readiness state machine
    use-keep-awake-while-playing.ts
    use-app-state-pause.ts
    use-shake-to-shuffle.ts
    use-asset-load-failure-skip.ts
  lib/
    query-client.ts               # QueryClient + Provider config
    media-library-subscription.ts # debounced invalidator (SM-6)
    seeded-shuffle.ts             # Fisher-Yates + anchor support
    source-set.ts                 # SourceSet type + normalization helpers
```

### State architecture re-evaluation triggers

- **Perf checkpoint at end of week 1** (per D-2): if cold-start ID-fetch (SM-2) exceeds budget on Pixel 6a at 50k, escalate to SQLite mirror (P2-8) instead of incrementing AsyncStorage.
- **Favorite-toggle UX**: if AsyncStorage write of large favorites set causes perceptible jank during week 4 dogfooding, swap `useFavoritesStore` storage to MMKV (5-line change).
- **Library-change patching**: if Android testing reveals frequent gallery thrash from blunt invalidation, consider iOS-surgical patches as an upgrade path (SM-6 alternative).
- **Selection persistence through slideshow** (SM-12): if friend feedback shows "the selection sticking around feels weird," flip to clear-on-launch.

---

## Build phases

**Build model:** AI-assisted implementation in dependency-ordered phases, not calendar weeks. Each phase has explicit entry preconditions (**Builds on**), concrete **Deliverables**, and an **Exit gate** that must verify before moving to the next phase. Phases are designed to be **resumable from a clean context** — re-entering a phase should require only this section plus the referenced decisions in §Decisions, §Design system, and §State management. Public release is an optional Phase 11; everything through Phase 10 is the personally-usable build.

**Order is not flexible.** The dependency graph is real: state primitives gate every UI surface; permission gates the gallery; the gallery gates the viewer; the viewer gates the slideshow. Out-of-order work risks rework when a later phase changes foundations.

**Time per phase is unspecified.** A phase is done when its exit gate verifies, not when an arbitrary calendar marker arrives. Some phases (0, 6, 8) will be substantially larger than others (3, 7).

### Phase 0 — Foundation & derisking spikes

**Goal:** Stand up the project skeleton and resolve the two known unknowns (Galeria viability, 50k perf) before committing to surface work.

**Builds on:** Nothing. Entry point.

**Deliverables:**

- Theme tokens module (`src/theme/`) with palette, motion presets (DS-9, DS-10), `useTheme()`, `<ThemeProvider>` for theater override
- Root `<Stack>` layout with `<SplashGate>` + persisted-store hydration block (SM-8)
- Persisted store skeletons: `usePreferencesStore`, `useFavoritesStore` (SM-4)
- TanStack Query client + `useAssetsQuery` source-keyed query shape (SM-5) — implementation can stub empty results
- Spark icon + splash configured via `app.json` (DS-21)
- **Galeria spike** on Pixel 6a with a 50k mock library — pass/fail recorded as a commit note + an inline annotation against D-1
- **Perf rig** in repo: mock-library generator, cold-start measurement, scroll fps harness (D-2)
- Phase-0 perf baseline captured (cold start to first thumbnail, sustained fling fps, memory ceiling)

**Exit gate:**

- Galeria decision committed (use, or fall back to Reanimated viewer in Phase 5)
- Perf baseline numbers recorded in repo
- Theme + persisted stores importable; splash → hello-world screen runs on real device

### Phase 1 — Permission & onboarding flow

**Status: Complete 2026-05-09.** Verified end-to-end on device against all six exit-gate scenarios. See `git log --grep='Phase 1'` for the commit boundary.

**Goal:** Get from cold install to a granted (or gracefully denied) MediaLibrary permission.

**Builds on:** Phase 0.

**Deliverables:**

- Three-card onboarding flow (DS-16): wedge → privacy → pre-prompt → system dialog
- Permission TanStack Query (`['permission']`, refetch on AppState→active per SM-7)
- Permission denied screen with "Open Settings" deep link (O-4, DS-28)
- Limited-access (iOS) "Manage selected photos" entry + Android "Update photo access" entry (D-4)
- Persistent partial-access banner shell (D-4) — runtime-tested in Phase 9
- `hasSeenOnboarding` flag wired into `<SplashGate>` branching (SM-8)

**Exit gate:**

- Fresh install: 3-card flow → system prompt → land on placeholder gallery (or denied screen)
- Denied → recovery screen → settings deep link works on both iOS and Android
- Relaunch after grant skips onboarding

### Phase 2 — Gallery walking skeleton

**Status: Implementation landed 2026-05-09.** Static checks clean (`npm run lint`, `npx tsc --noEmit`, iOS bundle export). On-device walkthrough and the perf targets in the exit gate below are pending per the project owner's perf-deferral standing instruction. See `git log --grep='Phase 2'` for the commit boundary once committed.

**Goal:** Real photos rendering at target performance, with sort and grid controls persisting.

**Builds on:** Phase 1.

**Deliverables:**

- All-IDs shuffle implementation (SM-2): `useInfiniteQuery` paginating `getAssetsAsync` (5000 assets/page) plus a sibling `usePrefetchAllAssetPages` hook driving auto-fetch via `useEffect`. Sort and shuffle are `useMemo` derivations against the flattened cache — sort changes never refetch. `getAssetsAsync` already returns full per-asset metadata, so the SM-2 projected ID-then-metadata two-phase shape collapses to a single paginated read; the G-11 invariant (first screenful before full pagination) holds because the first page resolves and renders while remaining pages stream in. Sort/shuffle gated on `!hasNextPage` so already-painted tile positions don't shift on each new page during the cold-start paging loop.
- FlashList grid with 1px gutters (DS-11), three grid sizes (G-12)
- Top safe-area strip with combined sort+count string (DS-32)
- Sort sheet: newest / oldest / name / random (G-3, "size" cut per D-12)
- Sort + grid size persisted to `usePreferencesStore` (G-4)
- First-reveal row-by-row stagger (DS-24), gated by `hasSeenFirstReveal`. Single shared Reanimated `revealProgress` value drives per-tile `useAnimatedStyle` interpolation (no per-tile clocks); flag flips on mount-with-data so navigation away mid-stagger doesn't replay it next time.

**Exit gate:**

- 50k mock library on Pixel 6a: cold start to first thumbnail ≤ 1.5s, sustained fling ≥ 50fps, memory ≤ 400MB
- Sort change is instant (cache derivation, no refetch)
- Sort + grid size persist across relaunch
- Real-device run on personal phone with real library — no crashes

### Phase 3 — Albums view & favorites

**Status: Implementation landed 2026-05-09.** Static checks clean (`npm run lint`, `npx tsc --noEmit`, iOS bundle export). On-device walkthrough is pending. Scope was extended (with user approval during planning) beyond the deliverables below to include drill-in: tapping any tile pushes a per-album gallery view that reuses Phase 2's `<GalleryGrid>` against `SourceSet { kind: "album", albumId }` (or `{ kind: "favorites" }` for the synthesized Favorites tile). See `git log --grep='Phase 3'` for the commit boundary once committed.

**Goal:** Albums tab and Favorites as a first-class source.

**Builds on:** Phase 2.

**Deliverables:**

- Albums view: 2-col, square covers, mono counts (DS-14)
- Per-session random album covers using the same shuffle seed as gallery (DS-14)
- `useFavoritesStore` fully wired (Set in memory, sorted array on disk per SM-4)
- Built-in Favorites album in Albums view, pinned first
- Empty Favorites inline state (DS-14)
- `<EmptyState>` primitive (DS-20)

**Exit gate:**

- Albums tab lists all device albums + Favorites with accurate counts
- Cold start reseeds covers; tab switch does not
- Favorites set survives relaunch and process kill

### Phase 4 — Selection mode & bulk actions

**Status: Implementation landed 2026-05-09.** Static checks clean (`npm run lint`, `npx tsc --noEmit`, iOS bundle export). On-device walkthrough is pending. Scope locked during planning: pull-to-shuffle uses standard `RefreshControl` semantics (DS-31's jumble-during-pull deferred as polish); actions sheet shows `Favorite all` + `Delete all` only (`Slideshow these N` lands in Phase 7 with `useStartSlideshowFromSelection`); bulk-delete app-level `Alert.alert` runs on Android only (iOS relies on the `deleteAssetsAsync` system dialog, accepting SM-13's restore-flicker on cancel as the sole failure mode); the morphing pill's Shuffle-state tap is a no-op until Phase 6 wires it to `startSlideshow`. The previously-deferred SM-6 library-change subscription also landed here alongside bulk-delete invalidation.

**Goal:** Multi-select curation flow with cap, bulk actions, and pull-to-shuffle.

**Builds on:** Phase 3.

**Deliverables:**

- `useSelectionStore` with range-extend drag (SM-12)
- 1000-cap with one-shot toast per drag (G-7)
- Shuffle pill morph to `Actions · N` (DS-18)
- `<MorphingPill>` 4-state component (DS-25)
- Bulk favorite + bulk delete with native platform Alert confirmation (DS-22, DS-35)
- Optimistic delete via `queryClient.setQueryData` (SM-13)
- Pull-to-shuffle with anchor preservation (DS-31, SM-14)
- Single-slot `useToastStore` wired to morphing pill (SM-11)

**Exit gate:**

- Long-press → drag-extend toggles selection range; reverse drag contracts
- Cap toast fires once per drag, not per attempted addition
- Bulk delete dialog interpolates count; cancel-restore flicker self-corrects in <500ms
- Pull-to-shuffle preserves visible row, fires `Reshuffled.` toast

### Phase 5 — Photo viewer (theater, paused state)

**Status: Implementation landed 2026-05-10.** Static checks clean (`npm run lint`, `npx tsc --noEmit`, iOS bundle export). On-device walkthrough is pending. **D-1 reconciliation flipped the viewer choice from Galeria to a custom Reanimated 4 + RNGH 2.30 swiper** — the spike PASS at week 1 was a feasibility check that didn't (and couldn't) verify DS-12's bespoke gesture set. Galeria's sealed lightbox forecloses the in-modal long-press menu (S-10), tap-zones (DS-12), `<TheaterChrome>` overlay slot (DS-13), and a play/pause hook for Phase 6. Phase 6's slideshow engine forces a custom viewer regardless, so building custom in Phase 5 lets Phase 6 extend the same surface. `@nandorojo/galeria` stays installed at zero runtime cost. Also landed here: DS-36 anticipatory long-press ring (deferred from Phase 4) and `useFavoritePhoto` (consumed by theater double-tap and the long-press Favorite row). See `git log --grep='Phase 5'` for the commit boundary once committed.

**Goal:** Tap-to-view photo lands in theater, paused, with all single-photo gestures.

**Builds on:** Phase 2 (Phase 4 not strictly required).

**Deliverables:**

- Theater route group with always-dark `<ThemeProvider>` (DS-2)
- 250ms fade-through-black transition from gallery (DS-10, DS-12)
- Viewer implementation: Galeria or custom Reanimated swiper (per Phase 0 spike outcome, D-1)
- Tap-edges + horizontal swipe nav, swipe-down dismiss
- Pinch-zoom + pan when paused (S-9)
- Double-tap to favorite with undo toast (S-11, DS-25)
- Long-press contextual menu: Favorite / Delete / Info / Go to Folder (S-10)
- `<TheaterChrome>` top strip with auto-hide (DS-13)
- Long-press anticipatory ring (DS-36)

**Exit gate:**

- Tap any gallery thumbnail → smooth fade-through-black → photo letterboxed in theater
- All viewer gestures responsive on iOS and Android
- Dismiss returns to exact gallery scroll position
- Asset deleted while open advances to next without crash (S-17)

### Phase 6 — Slideshow engine

**Goal:** Autoplay queue with full timing and lifecycle behavior.

**Builds on:** Phase 5.

**Deliverables:**

- `useSlideshowStore` factory + `<SlideshowStoreProvider>` (SM-7, SM-10)
- Centralized `_scheduleNext()` timer in store actions (SM-10)
- Cross-fade and hard cut transitions (S-3)
- Duration presets 3 / 5 / 8 / 10 / 15s with default 8 (S-2)
- Hairline progress bar visible only while playing (DS-13)
- `useKeepAwakeWhilePlaying`, `useAppStatePause` (D-9, SM-10γ)
- `useAssetLoadFailureSkip` (S-17)
- Shuffle-queue management with no-repeats-until-exhausted invariant (S-5, S-6)
- Resume-from-pause restarts full duration (SM-10β)

**Exit gate:**

- Tap photo → autoplay at 8s/slide → tap-pause → tap-resume → fresh duration
- Phone call mid-slideshow → pause → return-to-active stays paused (D-9)
- External delete of current asset → slideshow skips silently
- Queue exhaustion → silent reshuffle, no visible glitch
- All four directional gestures (tap-zones + swipes) work, debounced

### Phase 7 — Slideshow extras

**Goal:** Source control, shake-to-shuffle, and the gesture-guide overlay.

**Builds on:** Phase 6.

**Deliverables:**

- Full-screen source picker glass sheet (DS-27)
- `SourceSet` discriminated union plumbed through queries (SM-9)
- `useShakeToShuffle` hook with sensitivity gating + 1.5s debounce (S-13, S-14, SM-10α)
- Gesture-guide overlay on first slideshow (DS-19), gated by `seenSlideshowGuide`
- `useStartSlideshowFromSelection` action (SM-13)
- Empty source-set UX with two CTAs (D-7)

**Exit gate:**

- Shake reshuffles within 500ms; rapid shakes debounce to one reshuffle per 1.5s window
- Source picker multi-select persists; eligible counts visible inline (D-7)
- Gesture guide shows on first slideshow only; dismisses on first interaction or "Got it"
- Slideshow from selection works; selection persists when returning to gallery (SM-12)

### Phase 8 — Settings & accessibility

**Goal:** All preferences exposed; accessibility audit complete.

**Builds on:** Phase 7.

**Deliverables:**

- Hierarchical settings: Slideshow / Gallery / Gestures / Accessibility / Privacy / About (DS-15)
- Section subtitles showing current configuration (DS-15)
- `<SettingRow>` primitive for all row types (toggle / select / navigate / destructive)
- Visible-button mode in slideshow (DS-33)
- `useReducedMotion()` hook wired to all motion + shake call sites (SM-14)
- Per-gesture toggles, haptics toggle, shake sensitivity (A-4, A-5, A-6)
- iCloud-include toggle, iOS-only (D-3, DS-34)
- Photo info sheet fully wired (G-14, DS-29)
- Privacy sub-page prose (DS-15, hidden-constraints subsection)
- VoiceOver / TalkBack label audit (A-7)
- Touch target audit ≥ 44pt iOS / 48dp Android (A-8)

**Exit gate:**

- Every setting reads from and writes to `usePreferencesStore`
- System Reduce Motion ON → shake disabled, transitions snap, Ken Burns off
- Visible-button mode replaces gestures with persistent button strip
- Screen-reader run-through reaches every interactive element with a meaningful label

### Phase 9 — Edge cases & resilience

**Goal:** Survive the messy real world.

**Builds on:** Phase 8.

**Deliverables:**

- Video toggle (gallery on/off, slideshow always excludes — S-18)
- iCloud asset prefetch + 2s timeout (D-3)
- MediaLibrary change listener with debounced invalidation (SM-6) — slideshow-immune, foreground-only
- Limited-access banner runtime-tested with reduced photo selection (D-4)
- Optimistic delete reconciliation under listener invalidation
- Empty source-set start-time UX (D-7)

**Exit gate:**

- Airplane mode, full session: every flow works (P-1)
- External photo deletion mid-gallery → grid updates within ~500ms debounce
- iCloud-on with cellular mocked off → slow photo skips after timeout (S-17 fallthrough)
- Phase-9 perf re-run: numbers within 10% of Phase-0 baseline

### Phase 10 — Personal dogfooding

**Goal:** Confirm the wedge resonates in real use.

**Builds on:** Phase 9.

**Deliverables:**

- Dev client or TestFlight build installed on personal device
- Used as primary photo browser for a sustained period
- Bugs surfaced during dogfooding fixed in-place; new features deferred to a future v1.x

**Exit gate:**

- At least one "I forgot I had this photo" moment per week (success goal #1)
- Slideshow opened unprompted on multiple days (success goal #2)
- No reproducible crash open

### Optional Phase 11 — Public release

**Goal:** Ship to App Store and Play Store. Not a current commitment.

**Builds on:** Phase 10.

**Deliverables:**

- App Store Connect + Google Play Console setup
- Signing certificates, EAS submit configuration
- Store assets: screenshots, listing copy, privacy descriptions
- Reviewer-facing notes on data handling (no data leaves device)

**Exit gate:**

- Both stores accept the build through review
- TestFlight / Play internal testing invites collected (if shared with friends)

### Hard dependencies

- **Galeria viability** is resolved in Phase 0 via the spike on Pixel 6a with a 50k mock library (D-1). If the spike fails, the fallback custom viewer (Reanimated + Gesture Handler + `expo-image`) is built in Phase 5 — adds scope to that phase but does not block earlier ones.
- **EAS Build account** and signing certificates set up before Phase 10.
- **Real-device perf testing** requires access to at least one mid-tier Android (e.g., Pixel 6a or equivalent) and one older iPhone (e.g., iPhone 12 or 13). Required for Phase 0 baseline and Phase 9 re-test.

### Risks

- Galeria requires native build + iOS 16+ + New Architecture — non-trivial setup, no Expo Go.
- 50k-library performance on Android is the biggest unknown; mitigation is paginated `getAssetsAsync`, virtualized grid, and aggressive thumbnail caching via `expo-image`. SQLite indexing is a P2 escape valve, gated on Phase 0 + Phase 9 perf gates.
- Limited photo access UX diverges across iOS / Android versions — needs platform-specific copy and tested flows (Phase 1 + Phase 9).
- Bulk delete UX differs (system confirmation on iOS vs. Android) — design needs to handle both (Phase 4).

---

## Appendix — answers locked during interview

**Strategy.** Audience: nostalgic photo hoarders (primary user is Ninad — hobby project). Wedge: randomized rediscovery + dedicated slideshow. Platforms: iOS + Android in parallel. Form factors: phone portrait + landscape only. Monetization: none planned. Build model: AI-assisted, phase-gated to a personally-usable build (Phase 10); public release optional (Phase 11). Localization: English only.

**Slideshow.** Autoplay on. Default duration 8s with presets 3/5/8/10/15. Default transition cross-fade; v1 ships cross-fade + hard cut. Aspect: fit (letterbox). Random algorithm: full shuffled queue, no repeats until exhausted. Recency: not persisted across sessions. End of queue: silent reshuffle. Music: out of scope. Chrome: auto-hide after 2s.

**Gallery.** Default landing: gallery grid. Default sort: random. Persist: sort + grid size. Default grid: comfortable (3 cols). Videos: user toggle (default off in slideshow always). Live Photos: still only. iCloud assets: user toggle. Recently Added: cut. Library scale target: 50k. Selection cap: 1,000. Shake default: on, Medium. First-run source: auto All Photos.

**Polish.** Onboarding: 2-card intro + permission + gallery; gesture guide animated overlay on first slideshow. Permission: pre-prompt then system. Theme: follow system. Accessibility defaults: haptics on, visible-button off, reduce-motion auto from OS, undo-toast on. Telemetry: none. Beta: optional TestFlight if shared with friends. Success bar: qualitative. Signals: personal dogfooding + friend feedback (if shared).

**Name.** Working name: **Dust Off** — pending availability check on App Store, Play Store, and domain.
