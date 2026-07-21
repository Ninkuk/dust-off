# CLAUDE.md

Agent guide for this repo. See `README.md` for full narrative docs.

## Verify

Run before considering any change done:

```bash
npm run lint        # expo lint
npm run typecheck   # tsc --noEmit
npm test --if-present  # no test script yet — no-op until one lands
```

## Never

- Hand-edit `ios/` or `android/` — both are gitignored and regenerated via
  Continuous Native Generation (CNG). All native config (permissions,
  splash, icons, plugins) goes through `app.json`. See README
  §"Continuous Native Generation".
- Use relative imports across `src/`. Always import via aliases:
  `@/*` → `./src/*`, `@/assets/*` → `./assets/*`.
- Add manual `useMemo`/`useCallback` reflexively — React Compiler is
  enabled (React 19.2) and handles most memoization already.
- Add a dependency that makes network calls or adds telemetry/analytics/
  crash reporting. Privacy is architectural here — see README §"Privacy
  posture" before adding any new dep.

## Architecture map

See README §"Repository map" for the full breakdown. Summary:

- `src/app/` — Expo Router routes (`(tabs)/`, `(onboarding)/`, `theater/`)
- `src/theme/` — design tokens (palette, motion, typography)
- `src/state/` — Zustand stores (see State taxonomy below)
- `src/queries/` — TanStack Query hooks (assets, albums, permission)
- `src/actions/` — compound cross-store actions
- `src/hooks/` — React hooks
- `src/components/` — UI components
- `src/lib/` — adapters/helpers (storage, media-library, share, strings)

## State taxonomy

- **Persisted** (Zustand + async-storage): `preferences`, `favorites`
- **Transient** (Zustand, in-memory only): gallery seed, selection,
  slideshow, toasts

## Workflow

- `npm start` for JS-only iteration against an already-installed dev
  client (`expo-dev-client`).
- After native dependency or `app.json` plugin changes: `npx expo
  prebuild --clean`, then rebuild (`npm run ios` / `npm run android`).
- Seeding a fresh simulator/emulator: `npm run fixtures:fetch` once, then
  `npm run seed:ios` / `npm run seed:android`.

## Stack invariants

Expo SDK 55 + Expo Router, React 19.2 (Compiler on), RN 0.83 New
Architecture, TypeScript strict.
