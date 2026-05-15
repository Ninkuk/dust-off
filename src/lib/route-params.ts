// useLocalSearchParams returns string | string[] | undefined per param. We
// always want the first match — repeated keys aren't a thing the app emits.
export function firstParam(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseBoolParam(v: string | string[] | undefined): boolean {
  return firstParam(v) === "1";
}

export function parseCsvParam(v: string | string[] | undefined): string[] {
  const raw = firstParam(v);
  if (!raw) return [];
  return raw.split(",").filter((s) => s.length > 0);
}

export type UnionRouteParams = {
  albumIds: string[];
  includeAll: boolean;
  includeFavorites: boolean;
};

// Encodes a `kind: 'union'` SourceSet into URL params for the theater route.
// Inverse: parseUnionParams.
export function encodeUnionParams(u: UnionRouteParams): {
  albumIds: string;
  includeAll: string;
  includeFavorites: string;
} {
  return {
    albumIds: u.albumIds.join(","),
    includeAll: u.includeAll ? "1" : "0",
    includeFavorites: u.includeFavorites ? "1" : "0",
  };
}

export function parseUnionParams(params: {
  albumIds?: string | string[];
  includeAll?: string | string[];
  includeFavorites?: string | string[];
}): UnionRouteParams {
  return {
    albumIds: parseCsvParam(params.albumIds),
    includeAll: parseBoolParam(params.includeAll),
    includeFavorites: parseBoolParam(params.includeFavorites),
  };
}
