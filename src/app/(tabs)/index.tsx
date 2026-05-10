import { router } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useBulkDelete } from "@/actions/use-bulk-delete";
import { useBulkFavorite } from "@/actions/use-bulk-favorite";
import { useReshuffleGallery } from "@/actions/use-reshuffle-gallery";
import { useStartSlideshow } from "@/actions/use-start-slideshow";
import { EmptyState } from "@/components/empty-state";
import { GalleryGrid } from "@/components/gallery-grid";
import { MorphingPill } from "@/components/morphing-pill";
import { PartialAccessBanner } from "@/components/partial-access-banner";
import { SortStrip } from "@/components/sort-strip";
import { useFirstReveal } from "@/hooks/use-first-reveal";
import { isPermissionLimited } from "@/lib/permission";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { strings } from "@/lib/strings";
import {
  type AlbumOrAllSource,
  useAssetsQuery,
  usePrefetchAllAssetPages,
} from "@/queries/use-assets-query";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { useGalleryStore } from "@/state/gallery-store";
import { usePreferencesStore } from "@/state/preferences-store";
import { useSelectionStore } from "@/state/selection-store";
import { useTheme } from "@/theme";

const SOURCE: AlbumOrAllSource = { kind: "all" };

export default function GalleryScreen() {
  const theme = useTheme();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const seed = useGalleryStore((s) => s.seed);
  const anchorIds = useGalleryStore((s) => s.anchorIds);

  usePrefetchAllAssetPages(SOURCE);
  const query = useAssetsQuery(SOURCE);
  const permissionQuery = usePermissionQuery();
  const { isFirstReveal, markRevealComplete } = useFirstReveal();

  const reshuffle = useReshuffleGallery();
  const bulkFavorite = useBulkFavorite();
  const bulkDelete = useBulkDelete();
  const startSlideshow = useStartSlideshow();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const cancelSelection = useSelectionStore((s) => s.cancel);

  const allAssets = useMemo(
    () => query.data?.pages.flatMap((p) => p.assets) ?? [],
    [query.data],
  );

  const fullyLoaded = !query.hasNextPage;
  const sortedAssets = useMemo(() => {
    if (!fullyLoaded) return allAssets;
    switch (sortMode) {
      case "random":
        return seededShuffle(allAssets, seed, {
          anchorIds: anchorIds ?? undefined,
        });
      case "newest":
        return allAssets;
      case "oldest":
        return [...allAssets].reverse();
      case "name":
        return [...allAssets].sort((a, b) =>
          a.filename.localeCompare(b.filename),
        );
    }
  }, [allAssets, sortMode, seed, fullyLoaded, anchorIds]);

  const firstPageReady = query.data?.pages?.[0] != null;
  const limited = isPermissionLimited(permissionQuery.data);
  const sharedCount = query.data?.pages?.[0]?.totalCount ?? 0;

  useEffect(() => {
    if (firstPageReady) markRevealComplete();
  }, [firstPageReady, markRevealComplete]);

  const handleFavoriteAll = () => bulkFavorite([...selectedIds]);
  const handleDeleteAll = () => bulkDelete([...selectedIds]);
  const handleShuffle = () =>
    startSlideshow({ source: "all", assets: allAssets });
  const handleOpenPhoto = useCallback((id: string) => {
    router.push({
      pathname: "/theater/[assetId]",
      params: { assetId: id, kind: "all", autoplay: "0" },
    });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <SortStrip
        count={sortedAssets.length}
        selectionCount={selectedIds.size}
        onCancel={cancelSelection}
      />
      {limited ? (
        <PartialAccessBanner shared={sharedCount} total={sharedCount} />
      ) : null}
      {!firstPageReady ? null : sortedAssets.length === 0 ? (
        <EmptyState title={strings.emptyStates.nothingYet} />
      ) : (
        <GalleryGrid
          assets={sortedAssets}
          isFirstReveal={isFirstReveal}
          onPullToShuffle={reshuffle}
          onOpenPhoto={handleOpenPhoto}
        />
      )}
      <MorphingPill
        scope={{ kind: "all" }}
        onFavoriteAll={handleFavoriteAll}
        onDeleteAll={handleDeleteAll}
        onShuffle={handleShuffle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
