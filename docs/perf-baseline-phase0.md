# Phase 0 perf baseline

Captures the D-2 measurement gates and D-1 Galeria spike outcome required by the Phase 0 exit gate (PRD lines 504–508).

How to collect each number: see `docs/perf-rig.md`.

## D-1 Galeria spike outcome

- **Result:** PASS
- **Date:** 2026-05-09
- **Rationale:** User-confirmed pass. Hobby project — not gating Phase 0 on rigorous spike measurement at this stage; revisit if real-world use surfaces issues.

Consequence: keep `@nandorojo/galeria` for the photo viewer in Phase 5. **DS-12 reconciliation** (unified-viewer-as-paused-theater vs Galeria's lightbox model) becomes a Phase 5 design item — note it then.

## D-2 measurements — deferred

Per user direction (2026-05-09), Phase 0 ships without the perf rig run on devices. The rig itself is committed and operable (`scripts/generate-mock-library.mjs` + `src/lib/media-library.ts` swap + `docs/perf-rig.md` operator's manual), so any future cold-start or fling-fps regression can be measured by running the existing harness — no rebuild work needed.

Targets carried forward unchanged from PRD G-1 / D-2: cold start to first thumbnail ≤ 1500 ms, sustained fling fps ≥ 50, memory ceiling ≤ 400 MB on mid-tier Android.

| Metric                                | Pixel 6a (Android) | iPhone (model:    ) | Target (G-1)        |
| ------------------------------------- | ------------------ | ------------------- | ------------------- |
| Cold start → first thumbnail (ms)     | _deferred_         | _deferred_          | ≤ 1500              |
| Sustained fling fps (UI thread)       | _deferred_         | _deferred_          | ≥ 50                |
| Memory ceiling (MB) during 3-min fling| _deferred_         | _deferred_          | ≤ 400 (Android)     |

## Re-run cadence

Per D-2: capture again at the end of weeks 3 and 5. Add dated sections below as we go.

### Week 3 re-run (___)

Not yet captured.

### Week 5 re-run (___)

Not yet captured.
