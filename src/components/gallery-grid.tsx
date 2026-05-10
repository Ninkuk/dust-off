import { FlashList } from "@shopify/flash-list";
import type { Asset } from "expo-media-library";
import { useEffect } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useGridColumns } from "@/hooks/use-grid-columns";
import { GalleryTile, REVEAL_DURATION_MS } from "./gallery-tile";

export function GalleryGrid({
  assets,
  isFirstReveal,
}: {
  assets: Asset[];
  isFirstReveal: boolean;
}) {
  const numColumns = useGridColumns();
  const revealProgress = useSharedValue(
    isFirstReveal ? 0 : REVEAL_DURATION_MS,
  );

  useEffect(() => {
    if (isFirstReveal) {
      revealProgress.value = withTiming(REVEAL_DURATION_MS, {
        duration: REVEAL_DURATION_MS,
      });
    }
  }, [isFirstReveal, revealProgress]);

  return (
    <FlashList
      data={assets}
      numColumns={numColumns}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <GalleryTile
          asset={item}
          index={index}
          numColumns={numColumns}
          revealProgress={revealProgress}
        />
      )}
    />
  );
}
