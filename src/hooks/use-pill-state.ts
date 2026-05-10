import { useSelectionStore } from "@/state/selection-store";
import { useToastStore } from "@/state/toast-store";

export type PillState = "shuffle" | "actions" | "toast" | "hidden";

export function usePillState(): PillState {
  const selectionCount = useSelectionStore((s) => s.selectedIds.size);
  const toast = useToastStore((s) => s.current);
  if (toast) return "toast";
  if (selectionCount > 0) return "actions";
  return "shuffle";
}
