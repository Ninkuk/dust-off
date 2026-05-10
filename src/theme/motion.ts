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
