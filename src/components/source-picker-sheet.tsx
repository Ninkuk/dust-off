import {
  type BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { strings } from "@/lib/strings";
import { seededShuffle } from "@/lib/seeded-shuffle";
import {
  readAllPhotosCount,
  resolveSourceSet,
} from "@/lib/source-resolver";
import type { PersistableSourceSet } from "@/lib/source-set";
import { useAlbumsQuery } from "@/queries/use-albums-query";
import { assetsInfiniteOptions } from "@/queries/use-assets-query";
import { useFavoritesStore } from "@/state/favorites-store";
import { useGalleryStore } from "@/state/gallery-store";
import { usePreferencesStore } from "@/state/preferences-store";
import { useSlideshowInputStore } from "@/state/slideshow-input-store";
import { type, useTheme } from "@/theme";
import { Sheet } from "./sheet";
import { SourcePickerRow } from "./source-picker-row";

type Draft = {
  allPhotos: boolean;
  favorites: boolean;
  albumIds: Set<string>;
};

export type SourcePickerHandle = {
  present: (opts?: { shuffleOnDismiss?: boolean }) => void;
  dismiss: () => void;
};

// Full-screen DS-27 source picker. Long-press on the morphing pill opens it
// with shuffleOnDismiss=true → dismiss saves draft to defaultSource AND starts
// a slideshow over the resolved union. Empty union → navigates to
// /theater/empty (D-7 fail-at-start). The picker itself never blocks dismiss.
//
// Owns its own navigation because the URL shape varies by source kind (only
// 'union' needs the bridge store; the rest fall through theater's normal
// query-backed resolution).
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const SourcePickerSheet = forwardRef<SourcePickerHandle, {}>(
  function SourcePickerSheet(_props, ref) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const albumsQuery = useAlbumsQuery();
  const persistedDefault = usePreferencesStore((s) => s.defaultSource);
  const setPreference = usePreferencesStore((s) => s.setPreference);

  const sheetRef = useRef<BottomSheetModal>(null);
  const pendingShuffleOnDismissRef = useRef(false);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  // Heal stale persisted unions: intersect persisted albumIds with currently
  // existing album IDs so a since-deleted album doesn't ghost in the picker.
  // Re-seed on every present() so kill-and-relaunch reflects what's persisted.
  const seedDraftFromPersisted = useCallback(() => {
    const validAlbumIds = new Set(
      (albumsQuery.data ?? []).map((a) => a.id),
    );
    setDraft(sourceSetToDraft(persistedDefault, validAlbumIds));
  }, [albumsQuery.data, persistedDefault]);

  useImperativeHandle(
    ref,
    () => ({
      present: (opts) => {
        pendingShuffleOnDismissRef.current = opts?.shuffleOnDismiss === true;
        seedDraftFromPersisted();
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [seedDraftFromPersisted],
  );

  const handleDismiss = useCallback(() => {
    const next = draftToSourceSet(draft);
    setPreference("defaultSource", next);
    if (!pendingShuffleOnDismissRef.current) return;
    pendingShuffleOnDismissRef.current = false;
    void resolveAndNavigate(next, queryClient);
  }, [draft, setPreference, queryClient]);

  const albums = albumsQuery.data ?? [];
  const allPhotosCount = readAllPhotosCount(queryClient);
  const favoritesCount = useFavoritesStore.getState().favorites.size;
  const seed = useGalleryStore.getState().seed;

  return (
    <Sheet
      ref={sheetRef}
      enableDynamicSizing={false}
      snapPoints={SNAP_POINTS}
      onDismiss={handleDismiss}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scroll}>
        <Text
          accessibilityRole="header"
          style={[type.display, styles.title, { color: theme.textPrimary }]}
        >
          {strings.theater.sourcePicker.title}
        </Text>
        <Text
          style={[
            type.caption,
            styles.helper,
            { color: theme.textPrimary, opacity: 0.6 },
          ]}
        >
          {strings.theater.sourcePicker.helper}
        </Text>

        <View style={styles.section}>
          <SourcePickerRow
            source={{ kind: "all-photos" }}
            label={strings.theater.sourcePicker.allPhotos}
            total={allPhotosCount}
            eligible={allPhotosCount}
            selected={draft.allPhotos}
            onToggle={() =>
              setDraft((d) => ({ ...d, allPhotos: !d.allPhotos }))
            }
          />
          <SourcePickerRow
            source={{ kind: "favorites" }}
            label={strings.theater.sourcePicker.favorites}
            total={favoritesCount}
            eligible={favoritesCount}
            selected={draft.favorites}
            onToggle={() =>
              setDraft((d) => ({ ...d, favorites: !d.favorites }))
            }
          />
        </View>

        <View style={styles.section}>
          {albums
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((album) => {
              const checked = draft.albumIds.has(album.id);
              return (
                <SourcePickerRow
                  key={album.id}
                  source={{
                    kind: "album",
                    albumId: album.id,
                    seed,
                  }}
                  label={album.title}
                  total={album.assetCount}
                  eligible={album.assetCount}
                  selected={checked}
                  onToggle={() => {
                    setDraft((d) => {
                      const nextIds = new Set(d.albumIds);
                      if (checked) nextIds.delete(album.id);
                      else {
                        nextIds.add(album.id);
                        // Warm cache so dismiss doesn't have to await the fetch.
                        void queryClient.prefetchInfiniteQuery(
                          assetsInfiniteOptions({
                            kind: "album",
                            albumId: album.id,
                          }),
                        );
                      }
                      return { ...d, albumIds: nextIds };
                    });
                  }}
                />
              );
            })}
        </View>
      </BottomSheetScrollView>
    </Sheet>
  );
});

const SNAP_POINTS = ["100%"];

const EMPTY_DRAFT: Draft = {
  allPhotos: false,
  favorites: false,
  albumIds: new Set(),
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  title: {
    marginBottom: 8,
  },
  helper: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
});

// --- helpers ---

function sourceSetToDraft(
  s: PersistableSourceSet,
  validAlbumIds: ReadonlySet<string>,
): Draft {
  switch (s.kind) {
    case "all":
      return { allPhotos: true, favorites: false, albumIds: new Set() };
    case "favorites":
      return { allPhotos: false, favorites: true, albumIds: new Set() };
    case "album":
      return {
        allPhotos: false,
        favorites: false,
        albumIds: validAlbumIds.has(s.albumId)
          ? new Set([s.albumId])
          : new Set(),
      };
    case "union":
      return {
        allPhotos: s.includeAll,
        favorites: s.includeFavorites,
        albumIds: new Set(s.albumIds.filter((id) => validAlbumIds.has(id))),
      };
  }
}

function draftToSourceSet(d: Draft): PersistableSourceSet {
  const albumCount = d.albumIds.size;
  // Collapse to the simplest equivalent SourceSet.
  if (d.allPhotos && !d.favorites && albumCount === 0) return { kind: "all" };
  if (!d.allPhotos && d.favorites && albumCount === 0)
    return { kind: "favorites" };
  if (!d.allPhotos && !d.favorites && albumCount === 1) {
    const [only] = [...d.albumIds];
    return { kind: "album", albumId: only };
  }
  return {
    kind: "union",
    albumIds: [...d.albumIds],
    includeAll: d.allPhotos,
    includeFavorites: d.favorites,
  };
}

async function resolveAndNavigate(
  source: PersistableSourceSet,
  queryClient: QueryClient,
) {
  const resolvedAssets = await resolveSourceSet(source, queryClient);

  if (resolvedAssets.length === 0) {
    router.push("/theater/empty");
    return;
  }

  const seed = useGalleryStore.getState().seed;
  const first = seededShuffle(resolvedAssets, seed)[0];
  if (!first) {
    router.push("/theater/empty");
    return;
  }

  // Only kind='union' needs the bridge — the others have query-backed
  // resolution paths in theater.
  if (source.kind === "union") {
    useSlideshowInputStore
      .getState()
      .setInput(resolvedAssets.map((a) => a.id));
  }

  router.push({
    pathname: "/theater/[assetId]",
    params: {
      assetId: first.id,
      kind: source.kind,
      ...(source.kind === "album" ? { albumId: source.albumId } : {}),
      autoplay: "1",
    },
  });
}
