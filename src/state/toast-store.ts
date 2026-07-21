import { create } from "zustand";

export type Toast =
  | { kind: "undo-favorite"; ids: readonly string[] }
  | { kind: "undo-unfavorite"; ids: readonly string[] }
  | { kind: "flash"; message: string };

export const TOAST_UNDO_MS = 3000;
export const TOAST_FLASH_MS = 1500;
// Deletes get a longer read than an ordinary flash: the message names where
// the photos went, and 1.5s was less time than the reversible favourite action
// was given to offer an Undo.
export const DELETE_TOAST_MS = 6000;

type Internal = {
  toast: Toast;
  onCommit?: () => void;
  onUndo?: () => void;
};

// Module-scope refs — not reactive state, so they don't belong on the store.
let pending: Internal | null = null;
let timerId: ReturnType<typeof setTimeout> | null = null;

function defaultDuration(toast: Toast): number {
  return toast.kind === "flash" ? TOAST_FLASH_MS : TOAST_UNDO_MS;
}

function clearTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

type ToastState = {
  current: Toast | null;
  show: (
    toast: Toast,
    opts?: {
      onCommit?: () => void;
      onUndo?: () => void;
      durationMs?: number;
    },
  ) => void;
  commitNow: () => void;
  undo: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  current: null,

  show: (toast, opts) => {
    clearTimer();
    pending?.onCommit?.();
    const internal: Internal = {
      toast,
      onCommit: opts?.onCommit,
      onUndo: opts?.onUndo,
    };
    pending = internal;
    timerId = setTimeout(() => {
      if (pending !== internal) return;
      internal.onCommit?.();
      pending = null;
      timerId = null;
      set({ current: null });
    }, opts?.durationMs ?? defaultDuration(toast));
    set({ current: toast });
  },

  commitNow: () => {
    clearTimer();
    pending?.onCommit?.();
    pending = null;
    set({ current: null });
  },

  undo: () => {
    clearTimer();
    pending?.onUndo?.();
    pending = null;
    set({ current: null });
  },
}));
