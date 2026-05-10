function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0x811c9dc5 | 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  }
  return h | 0;
}

function fisherYatesInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

export type ShuffleOptions<T> = {
  anchorIds?: ReadonlySet<string>;
  idOf?: (t: T) => string;
};

export function seededShuffle<T>(
  items: readonly T[],
  seed: number,
  opts?: ShuffleOptions<T>,
): T[] {
  const rand = mulberry32(seed);
  const anchorIds = opts?.anchorIds;
  if (!anchorIds || anchorIds.size === 0) {
    const out = items.slice();
    fisherYatesInPlace(out, rand);
    return out;
  }
  const idOf = opts?.idOf ?? ((t: T) => (t as { id: string }).id);
  const anchored: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (anchorIds.has(idOf(item))) anchored.push(item);
    else rest.push(item);
  }
  fisherYatesInPlace(rest, rand);
  return [...anchored, ...rest];
}

export function pickIndexFromSeed(
  scope: string,
  seed: number,
  length: number,
): number {
  if (length <= 0) return 0;
  const rand = mulberry32(seed ^ hashString(scope));
  return Math.floor(rand() * length);
}
