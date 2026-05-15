// Synthetic sentinel — not a real OS album. Drives drill-in branching.
export const FAVORITES_ALBUM_ID = "@dust-off/favorites";

export type SourceSet =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "album"; albumId: string }
  | {
      kind: "union";
      albumIds: string[];
      includeAll: boolean;
      includeFavorites: boolean;
    }
  | { kind: "ids"; ids: readonly string[] };

export type PersistableSourceSet = Exclude<SourceSet, { kind: "ids" }>;

// Theater entry kinds:
//   all/favorites/album → existing query-backed sources
//   union               → multi-source union from the source picker (DS-27)
//   selection           → ad-hoc IDs from gallery selection mode (SM-13)
// Both new kinds resolve via in-memory filter against the cached `'all'`
// query — they don't fetch their own pages.
export type ViewerSourceKind =
  | "all"
  | "favorites"
  | "album"
  | "union"
  | "selection";

export function parseViewerSourceKind(v: string | undefined): ViewerSourceKind {
  return v === "favorites" ||
    v === "album" ||
    v === "union" ||
    v === "selection"
    ? v
    : "all";
}

export type SourceSetKey =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "album"; albumId: string }
  | {
      kind: "union";
      albumIds: readonly string[];
      includeAll: boolean;
      includeFavorites: boolean;
    };

export function sourceSetKey(s: SourceSet): SourceSetKey {
  switch (s.kind) {
    case "all":
    case "favorites":
    case "album":
      return s;
    case "union":
      return {
        kind: "union",
        albumIds: [...s.albumIds].sort(),
        includeAll: s.includeAll,
        includeFavorites: s.includeFavorites,
      };
    case "ids":
      throw new Error(
        "SourceSet 'ids' is not a query key — handle in-memo against the cached 'all' query.",
      );
  }
}
