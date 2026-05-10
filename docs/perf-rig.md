# Perf rig (D-2)

Mock-library + measurement harness for derisking the 50k-photo perf budget. Phase 0 deliverable; re-run end of weeks 3 and 5 per `docs/PRD.md` D-2.

## Generate the mock library

```bash
node scripts/generate-mock-library.mjs            # 50,000 assets, seed 1
node scripts/generate-mock-library.mjs 10000      # smaller smoke run
node scripts/generate-mock-library.mjs 50000 42   # different seed
```

Output: `src/lib/__mocks__/assets-mock.json` (overwritten in place). At 50k the file is ~10 MB. The seed is deterministic — same args produce identical data.

## Run the app against the mock

The wrapper at `src/lib/media-library.ts` swaps `getAssetsAsync` and `getAlbumsAsync` for in-memory mock implementations when both conditions hold:

1. `__DEV__` is true (dev build only — production never sees the mock).
2. `EXPO_PUBLIC_MOCK_LIBRARY=1` is set.

```bash
EXPO_PUBLIC_MOCK_LIBRARY=1 npm start
EXPO_PUBLIC_MOCK_LIBRARY=1 npm run ios
EXPO_PUBLIC_MOCK_LIBRARY=1 npm run android
```

All consumers in `src/queries/*` and later phases must import from `@/lib/media-library` (not `expo-media-library` directly) for the swap to take effect.

## Measurement

### Cold start → first thumbnail (target ≤ 1500 ms per G-1)

`performance.now()` is captured at the top of `src/app/_layout.tsx`; the value is logged when the gallery renders its first thumbnail's `onLoad`. Phase 0 has no gallery — log a marker from the spike screen to prove the wiring before Phase 2 swaps in real data.

### Sustained fling fps (target ≥ 50 fps)

**Quick read:** Built-in **React Native Perf Monitor**.

- iOS dev build: shake device → "Show Perf Monitor". Reads JS thread + UI thread fps.
- Android dev build: same dev menu.

Fling 5× steady-state, eyeball the UI thread number once it settles.

**Rigorous read:** `useFrameRate()` from `src/hooks/use-frame-rate.ts` wraps `useFrameCallback` and emits a 1-second-windowed fps value. Mount it inside the gallery during a benchmark session; copy the readout into the baseline doc.

### Memory ceiling (target ≤ 400 MB on Android)

**Android:** Open Android Studio → Profiler → attach to the dev build process. Watch heap during a 3-minute fling session. Record peak.

**iOS:** Run via `npm run ios`, attach Xcode debugger; the Memory gauge in the debug navigator shows live + peak. (Allocations Instrument if you want a deeper trace.)

### What we skip

- **Flipper** — deprecated for the New Architecture.
- **Perfetto** — overkill for hobby scale.
- **`expo-device` runtime memory** — only exposes static device info, not heap usage.

## Where to record results

`docs/perf-baseline-phase0.md` — three numbers per device + the Galeria spike pass/fail. Re-run end of weeks 3 and 5 per D-2; capture into the same file under dated sections.
