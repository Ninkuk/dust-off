import { useWindowDimensions } from "react-native";
import { usePreferencesStore } from "@/state/preferences-store";
import type { GridSize } from "@/state/preferences-store";

const PORTRAIT_COLUMNS: Record<GridSize, number> = {
  large: 2,
  comfortable: 3,
  compact: 4,
};

export function useGridColumns(): number {
  const gridSize = usePreferencesStore((s) => s.gridSize);
  const { width, height } = useWindowDimensions();
  const portraitCols = PORTRAIT_COLUMNS[gridSize];
  const isLandscape = width > height;
  return isLandscape ? portraitCols + 2 : portraitCols;
}
