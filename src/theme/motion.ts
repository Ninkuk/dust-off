export const tap = { duration: 100 } as const;

export const shellMotion = {
  duration: { fast: 180, base: 220, slow: 250 },
  spring: { mass: 0.6, damping: 18, stiffness: 220 },
} as const;

export const theaterMotion = {
  duration: { fast: 400, crossfade: 500, slow: 600 },
  spring: { mass: 1.0, damping: 26, stiffness: 140 },
} as const;

export const transitions = {
  shellToTheaterFadeMs: 250,
  splashFadeOutMs: 400,
} as const;

/**
 * Reduce Motion values. Having no token here is why only `shuffle-pill`
 * honoured the setting — every other consumer had nothing to reach for and
 * quietly animated regardless.
 *
 * `instant` collapses a transition without changing its shape, so callers can
 * write `duration: reduceMotion ? reducedMotion.instant : theaterMotion.duration.fast`
 * rather than branching the whole animation. Indefinite loops should not be
 * shortened — they should not run at all.
 */
export const reducedMotion = {
  /** Effectively no animation; keeps completion callbacks firing. */
  instant: 0,
} as const;
