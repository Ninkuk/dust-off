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
import { TheaterToast } from "@/components/theater-toast";
import { TheaterViewer } from "@/components/theater-viewer";
import { firstParam } from "@/lib/route-params";
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

const RING_DURATION_MS = 400;
const RING_CANCEL_MS = 150;

export default function TheaterScreen() {
  const params = useLocalSearchParams<{
    assetId: string | string[];
    kind?: string | string[];
    albumId?: string | string[];
  }>();
  const initialAssetId = firstParam(params.assetId) ?? "";
  const kind: ViewerSourceKind = parseViewerSourceKind(firstParam(params.kind));
  const albumId = firstParam(params.albumId);

  const [currentId, setCurrentId] = useState(initialAssetId);

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

  // Branch by kind so background prefetch into inactive queries doesn't
  // re-flatten the active 50k array on every page tick.
  const assets: Asset[] = useMemo(() => {
    if (kind === "favorites") return favoritesQuery.data;
    if (kind === "album")
      return albumQuery.data?.pages.flatMap((p) => p.assets) ?? [];
    return allQuery.data?.pages.flatMap((p) => p.assets) ?? [];
  }, [
    kind,
    allQuery.data,
    albumQuery.data,
    favoritesQuery.data,
  ]);

  // Memoized id → index lookup so swipe-driven setCurrentId doesn't scan 50k.
  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < assets.length; i++) m.set(assets[i].id, i);
    return m;
  }, [assets]);
  const currentIndex = indexById.get(currentId) ?? -1;
  const lastKnownIndexRef = useRef(0);

  // S-17: when the current asset disappears (menu delete, library-change
  // listener, external delete), silently advance to the closest neighbor.
  useEffect(() => {
    if (assets.length === 0) {
      const stillLoading =
        (kind === "all" && allQuery.isLoading) ||
        (kind === "album" && albumQuery.isLoading) ||
        (kind === "favorites" && favoritesQuery.isLoading);
      if (!stillLoading) router.back();
      return;
    }
    if (currentIndex === -1) {
      const next =
        assets[Math.min(lastKnownIndexRef.current, assets.length - 1)];
      if (next) setCurrentId(next.id);
      else router.back();
    } else {
      lastKnownIndexRef.current = currentIndex;
    }
  }, [
    assets,
    currentIndex,
    kind,
    allQuery.isLoading,
    albumQuery.isLoading,
    favoritesQuery.isLoading,
  ]);

  const current = currentIndex >= 0 ? assets[currentIndex] : undefined;
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

  const chromeRef = useRef<TheaterChromeHandle>(null);
  const menuRef = useRef<BottomSheetModal>(null);
  const infoRef = useRef<BottomSheetModal>(null);

  const ringX = useSharedValue(0);
  const ringY = useSharedValue(0);
  const ringProgress = useSharedValue(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  if (!current) return null;

  const advance = (delta: 1 | -1) => {
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0) return;
    if (nextIndex >= assets.length) {
      router.back();
      return;
    }
    lastKnownIndexRef.current = nextIndex;
    setCurrentId(assets[nextIndex].id);
  };

  const dismiss = () => router.back();

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

  return (
    <View style={styles.root}>
      <TheaterViewer
        asset={current}
        onPrev={() => advance(-1)}
        onNext={() => advance(1)}
        onDismiss={dismiss}
        onTapCenter={() => chromeRef.current?.reveal()}
        onTapEdgeRevealsChrome={() => chromeRef.current?.reveal()}
        onLongPressBegin={handleLongPressBegin}
        onLongPressCommit={handleLongPressCommit}
        onLongPressCancel={handleLongPressCancel}
        onDoubleTap={() => favoritePhoto(current.id)}
      />
      <LongPressRing x={ringX} y={ringY} progress={ringProgress} />
      <TheaterChrome
        ref={chromeRef}
        source={sourceLabel}
        position={strings.theater.formatPosition(currentIndex, assets.length)}
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
          deletePhoto(current.id, () => advance(1)),
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
