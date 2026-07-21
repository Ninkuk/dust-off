import type { Asset, PagedInfo } from "expo-media-library";
import {
  applyOptimisticOmit,
  restoreCache,
  type AssetsCache,
} from "@/lib/delete-cache";
import { queryClient } from "@/lib/query-client";
import { assetsQueryKey } from "@/queries/use-assets-query";

const ALL_QUERY_KEY = assetsQueryKey({ kind: "all" });
const ALBUM_QUERY_KEY = assetsQueryKey({ kind: "album", albumId: "al1" });

const page = (ids: string[]): PagedInfo<Asset> => ({
  assets: ids.map((id) => ({ id }) as Asset),
  endCursor: ids[ids.length - 1] ?? "",
  hasNextPage: false,
  totalCount: ids.length,
});

const seedCache = (): AssetsCache => {
  const cache: AssetsCache = {
    pages: [page(["a", "b"]), page(["c", "d"])],
    pageParams: [undefined, "b"],
  };
  queryClient.setQueryData([...ALL_QUERY_KEY], cache);
  return cache;
};

const seedAlbumCache = (ids: string[]): AssetsCache => {
  const cache: AssetsCache = {
    pages: [page(ids)],
    pageParams: [undefined],
  };
  queryClient.setQueryData([...ALBUM_QUERY_KEY], cache);
  return cache;
};

describe("delete-cache", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("omits the given ids from the cached pages", () => {
    seedCache();
    applyOptimisticOmit(["b"]);

    const next = queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]);
    const allIds = next?.pages.flatMap((p) => p.assets.map((a) => a.id));
    expect(allIds).toEqual(["a", "c", "d"]);
  });

  it("preserves page identity for untouched pages", () => {
    const seeded = seedCache();
    const page1Before = seeded.pages[1];

    applyOptimisticOmit(["a"]);

    const next = queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]);
    expect(next?.pages[1]).toBe(page1Before);
    expect(next?.pages[0]).not.toBe(seeded.pages[0]);
  });

  it("round-trips a restored snapshot", () => {
    const seeded = seedCache();
    const snapshot = applyOptimisticOmit(["b"]);
    expect(snapshot).toEqual([[[...ALL_QUERY_KEY], seeded]]);

    // Restore onto an empty cache: TanStack Query's default structural
    // sharing (replaceEqualDeep) only preserves the incoming reference
    // verbatim when there is no previous data to diff against — restoring
    // directly over the just-mutated (omitted) cache would otherwise
    // rebuild new objects for the changed page, which is expected library
    // behavior, not a delete-cache bug.
    queryClient.clear();
    restoreCache(snapshot);

    const restored = queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]);
    expect(restored).toEqual(seeded);
    expect(restored).toBe(seeded);
  });

  it("returns an empty snapshot with no cache, and restoreCache([]) is a no-op", () => {
    expect(applyOptimisticOmit(["b"])).toEqual([]);
    expect(() => restoreCache([])).not.toThrow();
    expect(queryClient.getQueryData([...ALL_QUERY_KEY])).toBeUndefined();
  });

  it("omits the given ids from both the all cache and an album cache", () => {
    const seededAll = seedCache();
    const seededAlbum = seedAlbumCache(["b", "e"]);

    applyOptimisticOmit(["b"]);

    const nextAll = queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]);
    const nextAlbum = queryClient.getQueryData<AssetsCache>([
      ...ALBUM_QUERY_KEY,
    ]);
    expect(nextAll?.pages.flatMap((p) => p.assets.map((a) => a.id))).toEqual([
      "a",
      "c",
      "d",
    ]);
    expect(
      nextAlbum?.pages.flatMap((p) => p.assets.map((a) => a.id)),
    ).toEqual(["e"]);
    expect(nextAll).not.toBe(seededAll);
    expect(nextAlbum).not.toBe(seededAlbum);
  });

  it("restores both the all cache and an album cache from one snapshot", () => {
    const seededAll = seedCache();
    const seededAlbum = seedAlbumCache(["b", "e"]);

    const snapshot = applyOptimisticOmit(["b"]);
    expect(snapshot).toHaveLength(2);

    queryClient.clear();
    restoreCache(snapshot);

    expect(
      queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]),
    ).toEqual(seededAll);
    expect(
      queryClient.getQueryData<AssetsCache>([...ALBUM_QUERY_KEY]),
    ).toEqual(seededAlbum);
  });

  it("excludes an untouched cache from the snapshot and leaves its identity intact", () => {
    const seededAll = seedCache();
    const seededAlbum = seedAlbumCache(["e", "f"]); // no overlap with "b"

    const snapshot = applyOptimisticOmit(["b"]);

    const albumKeyTouched = snapshot.some(
      ([key]) => JSON.stringify(key) === JSON.stringify([...ALBUM_QUERY_KEY]),
    );
    expect(albumKeyTouched).toBe(false);
    expect(
      queryClient.getQueryData<AssetsCache>([...ALBUM_QUERY_KEY]),
    ).toBe(seededAlbum);
    expect(
      queryClient.getQueryData<AssetsCache>([...ALL_QUERY_KEY]),
    ).not.toBe(seededAll);
  });
});
