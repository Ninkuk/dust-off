import type { Asset, PagedInfo } from "expo-media-library";
import {
  ALL_QUERY_KEY,
  applyOptimisticOmit,
  restoreCache,
  type AssetsCache,
} from "@/lib/delete-cache";
import { queryClient } from "@/lib/query-client";

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
    expect(snapshot).toEqual(seeded);

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
    expect(restored).toBe(snapshot);
  });

  it("returns undefined with no cache, and restoreCache(undefined) is a no-op", () => {
    expect(applyOptimisticOmit(["b"])).toBeUndefined();
    expect(() => restoreCache(undefined)).not.toThrow();
    expect(queryClient.getQueryData([...ALL_QUERY_KEY])).toBeUndefined();
  });
});
