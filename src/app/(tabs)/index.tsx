import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { GalleryGrid } from "@/components/gallery-grid";
import { PartialAccessBanner } from "@/components/partial-access-banner";
import { SortStrip } from "@/components/sort-strip";
import { useFirstReveal } from "@/hooks/use-first-reveal";
import { isPermissionLimited } from "@/lib/permission";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { strings } from "@/lib/strings";
import {
  useAssetsQuery,
  usePrefetchAllAssetPages,
  type AlbumOrAllSource,
} from "@/queries/use-assets-query";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { useGalleryStore } from "@/state/gallery-store";
import { usePreferencesStore } from "@/state/preferences-store";
import { useTheme } from "@/theme";

const SOURCE: AlbumOrAllSource = { kind: "all" };

export default function GalleryScreen() {
  const theme = useTheme();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const seed = useGalleryStore((s) => s.seed);

  usePrefetchAllAssetPages(SOURCE);
  const query = useAssetsQuery(SOURCE);
  const permissionQuery = usePermissionQuery();
  const { isFirstReveal, markRevealComplete } = useFirstReveal();

  const allAssets = useMemo(
    () => query.data?.pages.flatMap((p) => p.assets) ?? [],
    [query.data],
  );

  // Avoid re-sorting on every page boundary during the cold-start auto-fetch:
  // shuffle and name-sort would shift already-painted positions on each new
  // page. While paging in, render in MediaLibrary's natural (newest-first) order;
  // apply the user's sort once the full library is in cache.
  const fullyLoaded = !query.hasNextPage;
  const sortedAssets = useMemo(() => {
    if (!fullyLoaded) return allAssets;
    switch (sortMode) {
      case "random":
        return seededShuffle(allAssets, seed);
      case "newest":
        return allAssets;
      case "oldest":
        return [...allAssets].reverse();
      case "name":
        return [...allAssets].sort((a, b) =>
          a.filename.localeCompare(b.filename),
        );
    }
  }, [allAssets, sortMode, seed, fullyLoaded]);

  const firstPageReady = query.data?.pages?.[0] != null;
  const limited = isPermissionLimited(permissionQuery.data);
  const sharedCount = query.data?.pages?.[0]?.totalCount ?? 0;

  useEffect(() => {
    if (firstPageReady) markRevealComplete();
  }, [firstPageReady, markRevealComplete]);

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <SortStrip count={sortedAssets.length} />
      {limited ? (
        <PartialAccessBanner shared={sharedCount} total={sharedCount} />
      ) : null}
      {!firstPageReady ? null : sortedAssets.length === 0 ? (
        <EmptyState title={strings.emptyStates.nothingYet} />
      ) : (
        <GalleryGrid assets={sortedAssets} isFirstReveal={isFirstReveal} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
