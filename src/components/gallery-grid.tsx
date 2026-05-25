import { FlashList } from "@shopify/flash-list";
import type { Asset } from "expo-media-library";
import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, useWindowDimensions, View } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useGridColumns } from "@/hooks/use-grid-columns";
import { heavyTap, mediumTap } from "@/lib/haptics";
import { strings } from "@/lib/strings";
import { useSelectionStore } from "@/state/selection-store";
import { useToastStore } from "@/state/toast-store";
import { GalleryTile, REVEAL_DURATION_MS } from "./gallery-tile";

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList,
) as unknown as typeof FlashList;

export function GalleryGrid({
  assets,
  isFirstReveal,
  onPullToShuffle,
  onOpenPhoto,
}: {
  assets: Asset[];
  isFirstReveal: boolean;
  onPullToShuffle?: (anchorIds: string[]) => void;
  onOpenPhoto?: (id: string) => void;
}) {
  const numColumns = useGridColumns();
  const { width } = useWindowDimensions();
  const cellSize = width / numColumns;
  const revealProgress = useSharedValue(
    isFirstReveal ? 0 : REVEAL_DURATION_MS,
  );
  const scrollY = useSharedValue(0);
  const dragCapFiredRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const ordered = useMemo(() => {
    const ids = assets.map((a) => a.id);
    const index = new Map<string, number>();
    for (let i = 0; i < ids.length; i++) index.set(ids[i], i);
    return { ids, index };
  }, [assets]);

  useEffect(() => {
    if (isFirstReveal) {
      revealProgress.value = withTiming(REVEAL_DURATION_MS, {
        duration: REVEAL_DURATION_MS,
      });
    }
  }, [isFirstReveal, revealProgress]);

  const idAtPoint = (x: number, y: number): string | null => {
    if (cellSize <= 0) return null;
    const col = Math.floor(x / cellSize);
    if (col < 0 || col >= numColumns) return null;
    const absoluteY = y + scrollY.value;
    if (absoluteY < 0) return null;
    const row = Math.floor(absoluteY / cellSize);
    const idx = row * numColumns + col;
    if (idx < 0 || idx >= assets.length) return null;
    return assets[idx].id;
  };

  const fireDragCapToast = () => {
    if (dragCapFiredRef.current) return;
    dragCapFiredRef.current = true;
    useToastStore.getState().show({
      kind: "flash",
      message: strings.selection.capToast,
    });
  };

  const handleLongPressStart = (x: number, y: number) => {
    dragCapFiredRef.current = false;
    const id = idAtPoint(x, y);
    if (!id) return;
    const isAlreadySelected = useSelectionStore
      .getState()
      .selectedIds.has(id);
    mediumTap();
    const result = useSelectionStore.getState().enter(id, !isAlreadySelected);
    if (result.capBlocked) fireDragCapToast();
  };

  const handleExtend = (x: number, y: number) => {
    const id = idAtPoint(x, y);
    if (!id) return;
    const result = useSelectionStore
      .getState()
      .extendTo(id, ordered.ids, ordered.index);
    if (result.capHit) fireDragCapToast();
  };

  const handleRefresh = () => {
    if (!onPullToShuffle) return;
    heavyTap();
    setRefreshing(true);
    const top =
      cellSize > 0
        ? Math.max(0, Math.floor(scrollY.value / cellSize)) * numColumns
        : 0;
    const anchorIds: string[] = [];
    for (let i = 0; i < numColumns; i++) {
      const idx = top + i;
      if (idx < ordered.ids.length) anchorIds.push(ordered.ids[idx]);
    }
    onPullToShuffle(anchorIds);
    requestAnimationFrame(() => setRefreshing(false));
  };

  const animatedScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const pan = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart((event) => {
      runOnJS(handleLongPressStart)(event.x, event.y);
    })
    .onUpdate((event) => {
      runOnJS(handleExtend)(event.x, event.y);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }}>
        <AnimatedFlashList
          data={assets}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          onScroll={animatedScrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            onPullToShuffle ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            ) : undefined
          }
          renderItem={({ item, index }) => (
            <GalleryTile
              asset={item}
              index={index}
              numColumns={numColumns}
              revealProgress={revealProgress}
              onOpen={onOpenPhoto}
            />
          )}
        />
      </View>
    </GestureDetector>
  );
}
