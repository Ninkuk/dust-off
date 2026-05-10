import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import type { Asset } from "expo-media-library";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useDeletePhoto } from "@/actions/use-delete-photo";
import {
  useFavoritePhoto,
  useUnfavoritePhoto,
} from "@/actions/use-favorite-photo";
import { LongPressRing } from "@/components/long-press-ring";
import { PhotoInfoSheet } from "@/components/photo-info-sheet";
import {
  TheaterChrome,
  type TheaterChromeHandle,
} from "@/components/theater-chrome";
import { TheaterLongPressMenu } from "@/components/theater-long-press-menu";
import { TheaterProgressBar } from "@/components/theater-progress-bar";
import { TheaterToast } from "@/components/theater-toast";
import { TheaterViewer } from "@/components/theater-viewer";
import { useAppStatePause } from "@/hooks/use-app-state-pause";
import { useKeepAwakeWhilePlaying } from "@/hooks/use-keep-awake-while-playing";
import { firstParam } from "@/lib/route-params";
import { seededShuffle } from "@/lib/seeded-shuffle";
import {
  type ViewerSourceKind,
  parseViewerSourceKind,
} from "@/lib/source-set";
import { strings } from "@/lib/strings";
import { useAlbumTitle } from "@/queries/use-albums-query";
import {
  useAssetsQuery,
  useFavoritesAssetsQuery,
} from "@/queries/use-assets-query";
import { useFavoritesStore } from "@/state/favorites-store";
import { useGalleryStore } from "@/state/gallery-store";
import { useSlideshowStore } from "@/state/slideshow-store";

const RING_DURATION_MS = 400;
const RING_CANCEL_MS = 150;

export default function TheaterScreen() {
  const params = useLocalSearchParams<{
    assetId: string | string[];
    kind?: string | string[];
    albumId?: string | string[];
    autoplay?: string | string[];
  }>();
  const initialAssetId = firstParam(params.assetId) ?? "";
  const kind: ViewerSourceKind = parseViewerSourceKind(firstParam(params.kind));
  const albumId = firstParam(params.albumId);
  const wantAutoplay = firstParam(params.autoplay) === "1";

  // Rules of Hooks: queries called unconditionally; gated via `enabled`.
  const allQuery = useAssetsQuery(
    { kind: "all" },
    { enabled: kind === "all" || kind === "favorites" },
  );
  const albumQuery = useAssetsQuery(
    kind === "album" && albumId
      ? { kind: "album", albumId }
      : { kind: "album", albumId: "" },
    { enabled: kind === "album" && !!albumId },
  );
  const favoritesQuery = useFavoritesAssetsQuery({
    enabled: kind === "favorites",
  });

  const assets: Asset[] = useMemo(() => {
    if (kind === "favorites") return favoritesQuery.data;
    if (kind === "album")
      return albumQuery.data?.pages.flatMap((p) => p.assets) ?? [];
    return allQuery.data?.pages.flatMap((p) => p.assets) ?? [];
  }, [kind, allQuery.data, albumQuery.data, favoritesQuery.data]);

  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < assets.length; i++) m.set(assets[i].id, i);
    return m;
  }, [assets]);

  // Slideshow store drives the visible asset. Falls back to the route's
  // initialAssetId until the store is initialized below.
  const queue = useSlideshowStore((s) => s.queue);
  const queueIndex = useSlideshowStore((s) => s.index);
  const initialize = useSlideshowStore((s) => s.initialize);
  const togglePlayPause = useSlideshowStore((s) => s.togglePlayPause);
  const pauseSlideshow = useSlideshowStore((s) => s.pause);
  const nextSlide = useSlideshowStore((s) => s.next);
  const prevSlide = useSlideshowStore((s) => s.previous);
  const skipUnavailable = useSlideshowStore((s) => s.skipUnavailable);

  const queueId = queue[queueIndex];
  const currentId = queueId ?? initialAssetId;
  const currentIndex = indexById.get(currentId) ?? -1;
  const current = currentIndex >= 0 ? assets[currentIndex] : undefined;

  // One-shot init: build the queue once assets land. Tap-photo entry pins the
  // tapped asset as the queue head via anchorIds; pill-Shuffle entry uses no
  // anchor (queue head = shuffled[0]).
  useEffect(() => {
    if (queue.length > 0) return;
    if (assets.length === 0) return;
    const seed = useGalleryStore.getState().seed;
    const shuffled = seededShuffle(
      assets,
      seed,
      wantAutoplay ? undefined : { anchorIds: new Set([initialAssetId]) },
    );
    const ids = shuffled.map((a) => a.id);
    const startIndex = Math.max(0, ids.indexOf(initialAssetId));
    initialize({
      unshuffledIds: assets.map((a) => a.id),
      queue: ids,
      startIndex,
      autoplay: wantAutoplay,
    });
  }, [assets, queue.length, initialize, wantAutoplay, initialAssetId]);

  // S-17: when the visible asset disappears from the cache (optimistic delete
  // or external delete via library-change listener), drop it from the queue
  // and advance. Render-failure pathway is handled by TheaterViewer's
  // onError → onImageError prop directly.
  useEffect(() => {
    if (assets.length === 0) {
      const stillLoading =
        (kind === "all" && allQuery.isLoading) ||
        (kind === "album" && albumQuery.isLoading) ||
        (kind === "favorites" && favoritesQuery.isLoading);
      if (!stillLoading && queue.length === 0) router.back();
      return;
    }
    if (queue.length === 0) return;
    if (queueId && !indexById.has(queueId)) {
      skipUnavailable(queueId);
    }
  }, [
    assets.length,
    queue.length,
    queueId,
    indexById,
    kind,
    allQuery.isLoading,
    albumQuery.isLoading,
    favoritesQuery.isLoading,
    skipUnavailable,
  ]);

  const isFavorited = useFavoritesStore((s) =>
    current ? s.favorites.has(current.id) : false,
  );

  const albumTitle = useAlbumTitle(kind === "album" ? albumId : undefined);
  const sourceLabel =
    kind === "all"
      ? strings.theater.sourceLabel.all
      : kind === "favorites"
        ? strings.theater.sourceLabel.favorites
        : (albumTitle ?? "");

  const favoritePhoto = useFavoritePhoto();
  const unfavoritePhoto = useUnfavoritePhoto();
  const deletePhoto = useDeletePhoto();

  // Coordinator hooks: keep-awake while playing + AppState-pause on background.
  useKeepAwakeWhilePlaying();
  useAppStatePause();

  const chromeRef = useRef<TheaterChromeHandle>(null);
  const menuRef = useRef<BottomSheetModal>(null);
  const infoRef = useRef<BottomSheetModal>(null);

  const ringX = useSharedValue(0);
  const ringY = useSharedValue(0);
  const ringProgress = useSharedValue(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  if (!current) return null;

  const dismiss = () => router.back();

  const handleTapCenter = () => {
    togglePlayPause();
    chromeRef.current?.reveal();
  };

  const handleLongPressBegin = (x: number, y: number) => {
    ringX.value = x;
    ringY.value = y;
    ringProgress.value = withTiming(1, { duration: RING_DURATION_MS });
  };
  const handleLongPressCommit = () => {
    ringProgress.value = 0;
    menuRef.current?.present();
  };
  const handleLongPressCancel = () => {
    ringProgress.value = withTiming(0, { duration: RING_CANCEL_MS });
  };

  const wrapDismissMenu = (action: () => void) => () => {
    menuRef.current?.dismiss();
    action();
  };

  const handleGoToFolder = () => {
    if (!current.albumId) return;
    router.replace({
      pathname: "/albums/[albumId]",
      params: { albumId: current.albumId },
    });
  };

  // Position label uses queue index for the slideshow's view of "where we are."
  // Falls back to cache index when the queue isn't initialized yet (very brief).
  const displayPosition =
    queue.length > 0
      ? strings.theater.formatPosition(queueIndex, queue.length)
      : strings.theater.formatPosition(currentIndex, assets.length);

  return (
    <View style={styles.root}>
      <TheaterViewer
        asset={current}
        onPrev={prevSlide}
        onNext={nextSlide}
        onDismiss={dismiss}
        onTapCenter={handleTapCenter}
        onTapEdgeRevealsChrome={() => chromeRef.current?.reveal()}
        onLongPressBegin={handleLongPressBegin}
        onLongPressCommit={handleLongPressCommit}
        onLongPressCancel={handleLongPressCancel}
        onDoubleTap={() => favoritePhoto(current.id)}
        onImageError={() => skipUnavailable(current.id)}
        onPinchStart={pauseSlideshow}
      />
      <TheaterProgressBar />
      <LongPressRing x={ringX} y={ringY} progress={ringProgress} />
      <TheaterChrome
        ref={chromeRef}
        source={sourceLabel}
        position={displayPosition}
        onClose={dismiss}
        isSheetOpen={menuOpen || infoOpen}
      />
      <TheaterToast />
      <TheaterLongPressMenu
        ref={menuRef}
        isFavorited={isFavorited}
        hasAlbum={!!current.albumId}
        onFavorite={wrapDismissMenu(() => favoritePhoto(current.id))}
        onUnfavorite={wrapDismissMenu(() => unfavoritePhoto(current.id))}
        onDelete={wrapDismissMenu(() =>
          deletePhoto(current.id, () => skipUnavailable(current.id)),
        )}
        onShowInfo={wrapDismissMenu(() => infoRef.current?.present())}
        onGoToFolder={wrapDismissMenu(handleGoToFolder)}
        onPresentChange={setMenuOpen}
      />
      <PhotoInfoSheet
        ref={infoRef}
        asset={current}
        onPresentChange={setInfoOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
});
