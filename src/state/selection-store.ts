import { create } from "zustand";

export const SELECTION_CAP = 1000;

type SelectionState = {
  selectedIds: Set<string>;
  anchorId: string | null;
  anchorDidSelect: boolean;
  preDragSelectedIds: Set<string>;
  enter: (id: string, didSelect: boolean) => { capBlocked: boolean };
  extendTo: (
    id: string,
    orderedIds: readonly string[],
    idIndex: ReadonlyMap<string, number>,
  ) => { capHit: boolean };
  toggle: (id: string) => boolean;
  cancel: () => void;
};

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: new Set(),
  anchorId: null,
  anchorDidSelect: true,
  preDragSelectedIds: new Set(),

  enter: (id, didSelect) => {
    const current = get().selectedIds;
    const next = new Set(current);
    let capBlocked = false;
    if (didSelect) {
      if (!next.has(id)) {
        if (next.size >= SELECTION_CAP) capBlocked = true;
        else next.add(id);
      }
    } else {
      next.delete(id);
    }
    set({
      selectedIds: next,
      anchorId: id,
      anchorDidSelect: didSelect,
      preDragSelectedIds: new Set(next),
    });
    return { capBlocked };
  },

  extendTo: (id, orderedIds, idIndex) => {
    const { anchorId, anchorDidSelect, preDragSelectedIds } = get();
    if (!anchorId) return { capHit: false };
    const anchorIdx = idIndex.get(anchorId);
    const targetIdx = idIndex.get(id);
    if (anchorIdx === undefined || targetIdx === undefined) {
      return { capHit: false };
    }
    const lo = Math.min(anchorIdx, targetIdx);
    const hi = Math.max(anchorIdx, targetIdx);
    const next = new Set(preDragSelectedIds);
    let capHit = false;
    if (anchorDidSelect) {
      for (let i = lo; i <= hi; i++) {
        const tileId = orderedIds[i];
        if (next.has(tileId)) continue;
        if (next.size >= SELECTION_CAP) {
          capHit = true;
          break;
        }
        next.add(tileId);
      }
    } else {
      for (let i = lo; i <= hi; i++) next.delete(orderedIds[i]);
    }
    set({ selectedIds: next });
    return { capHit };
  },

  toggle: (id) => {
    const current = get().selectedIds;
    if (current.has(id)) {
      const next = new Set(current);
      next.delete(id);
      set({ selectedIds: next });
      return true;
    }
    if (current.size >= SELECTION_CAP) return false;
    const next = new Set(current);
    next.add(id);
    set({ selectedIds: next });
    return true;
  },

  cancel: () => {
    if (get().selectedIds.size === 0 && get().anchorId === null) return;
    set({
      selectedIds: new Set(),
      anchorId: null,
      preDragSelectedIds: new Set(),
    });
  },
}));
