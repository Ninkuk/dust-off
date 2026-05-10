import { strings } from "@/lib/strings";
import { useSelectionStore } from "@/state/selection-store";

export type PillScope =
  | { kind: "all" }
  | { kind: "album"; title: string };

export function usePillContextLabel(scope: PillScope): string {
  const selectionCount = useSelectionStore((s) => s.selectedIds.size);
  if (selectionCount > 0) return strings.pill.actions(selectionCount);
  return scope.kind === "all"
    ? strings.pill.shuffleAll
    : strings.pill.shuffleAlbum(scope.title);
}
