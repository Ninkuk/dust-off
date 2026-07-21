import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBulkDelete } from "@/actions/use-bulk-delete";
import { useBulkFavorite } from "@/actions/use-bulk-favorite";
import { useBulkShare } from "@/actions/use-bulk-share";
import { useReshuffleGallery } from "@/actions/use-reshuffle-gallery";
import { useStartSlideshow } from "@/actions/use-start-slideshow";
import { useStartSlideshowFromSelection } from "@/actions/use-start-slideshow-from-selection";
import { BottomChromeScrim } from "@/components/bottom-chrome-scrim";
import { EmptyState } from "@/components/empty-state";
import { GalleryGrid } from "@/components/gallery-grid";
import { MorphingPill } from "@/components/morphing-pill";
import { PartialAccessBanner } from "@/components/partial-access-banner";
import { SortStrip } from "@/components/sort-strip";
import { useFirstReveal } from "@/hooks/use-first-reveal";
import { useSelectionBackHandler } from "@/hooks/use-selection-back-handler";
import { isPermissionLimited } from "@/lib/permission";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { firstParam } from "@/lib/route-params";
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
import { type, useTheme } from "@/theme";

const SOURCE: AlbumOrAllSource = { kind: "all" };

export default function GalleryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sortMode = usePreferencesStore((s) => s.defaultSort);
  const seed = useGalleryStore((s) => s.seed);
  const anchorIds = useGalleryStore((s) => s.anchorIds);

  usePrefetchAllAssetPages(SOURCE);
  const query = useAssetsQuery(SOURCE);
  const permissionQuery = usePermissionQuery();
  const { isFirstReveal, markRevealComplete } = useFirstReveal();
  useSelectionBackHandler();

  const reshuffle = useReshuffleGallery();
  const bulkFavorite = useBulkFavorite();
  const bulkShare = useBulkShare();
  const bulkDelete = useBulkDelete();
  const startSlideshow = useStartSlideshow();
  const startFromSelection = useStartSlideshowFromSelection();
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
  const handleShareAll = () => bulkShare([...selectedIds]);
  const handleDeleteAll = () => bulkDelete([...selectedIds]);
  const handleShuffle = () =>
    startSlideshow({ source: "all", assets: allAssets });
  const handleSlideshowSelection = () => startFromSelection(allAssets);
  const handleOpenPhoto = useCallback((id: string) => {
    router.push({
      pathname: "/theater/[assetId]",
      params: { assetId: id, kind: "all", autoplay: "0" },
    });
  }, []);

  // Bridge for the /theater/empty "Use All Photos" CTA: ?startSlideshow=all
  // starts a one-shot All-Photos slideshow.
  const queryParams = useLocalSearchParams<{
    startSlideshow?: string | string[];
  }>();
  const queryParamHandledRef = useRef(false);
  useEffect(() => {
    if (queryParamHandledRef.current) return;
    const startKind = firstParam(queryParams.startSlideshow);
    if (startKind === "all" && allAssets.length > 0) {
      queryParamHandledRef.current = true;
      startSlideshow({ source: "all", assets: allAssets });
      router.setParams({ startSlideshow: undefined });
    }
  }, [queryParams.startSlideshow, allAssets, startSlideshow]);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface, paddingTop: insets.top + 16 },
      ]}
    >
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[type.display, styles.title, { color: theme.textPrimary }]}
        >
          {strings.tabs.gallery}
        </Text>
        <SortStrip
          count={sortedAssets.length}
          selectionCount={selectedIds.size}
          onCancel={cancelSelection}
          inline
        />
      </View>
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
      <BottomChromeScrim />
      <MorphingPill
        scope={{ kind: "all" }}
        onFavoriteAll={handleFavoriteAll}
        onShareAll={handleShareAll}
        onDeleteAll={handleDeleteAll}
        onShuffle={handleShuffle}
        onSlideshowSelection={handleSlideshowSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  title: {
    flex: 1,
  },
});
