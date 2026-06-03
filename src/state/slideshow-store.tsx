import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { type StoreApi, createStore, useStore } from "zustand";
import { seededShuffle } from "@/lib/seeded-shuffle";
import { usePreferencesStore } from "@/state/preferences-store";

export type SlideshowState = {
  // Source IDs (unshuffled) — kept so we can silently reshuffle on exhaustion (S-5).
  unshuffledIds: readonly string[];
  queue: readonly string[];
  index: number;
  isPlaying: boolean;
  // Bumped on every state mutation that the progress bar needs to react to.
  // Lets the bar restart its sweep without coupling to internal timer logic.
  generation: number;
};

export type SlideshowActions = {
  initialize: (params: {
    unshuffledIds: readonly string[];
    queue: readonly string[];
    startIndex: number;
    autoplay: boolean;
  }) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  // Removes a missing/failed asset from queue + unshuffled, then advances.
  // Removal (rather than just-advance) prevents a post-exhaustion reshuffle
  // from re-emitting the missing ID — that would loop forever.
  skipUnavailable: (id: string) => void;
  // Re-orders the queue with a fresh seed and resets to index 0. Works
  // whether playing or paused; never auto-resumes (D-9). Caller owns the
  // haptic.
  reshuffle: () => void;
};

export type SlideshowStore = SlideshowState & SlideshowActions;

const initialState: SlideshowState = {
  unshuffledIds: [],
  queue: [],
  index: 0,
  isPlaying: false,
  generation: 0,
};

function createSlideshowStore(): StoreApi<SlideshowStore> {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return createStore<SlideshowStore>()((set, get) => {
    const clearTimer = () => {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      const durationMs =
        usePreferencesStore.getState().slideDurationSec * 1000;
      timerId = setTimeout(() => {
        timerId = null;
        if (get().isPlaying) get().next();
      }, durationMs);
    };

    const reshuffleQueue = (): readonly string[] => {
      const ids = get().unshuffledIds;
      if (ids.length === 0) return ids;
      // Fresh seed at exhaustion — same `useGalleryStore.seed` would re-emit
      // the original order. S-5 wants a *new* shuffle; S-6 forbids persistence,
      // so a one-shot Date.now seed is correct.
      return seededShuffle([...ids], Date.now() | 0);
    };

    return {
      ...initialState,

      initialize: ({ unshuffledIds, queue, startIndex, autoplay }) => {
        clearTimer();
        const safeIndex =
          queue.length === 0
            ? 0
            : Math.max(0, Math.min(queue.length - 1, startIndex));
        set({
          unshuffledIds,
          queue,
          index: safeIndex,
          isPlaying: autoplay && queue.length > 0,
          generation: get().generation + 1,
        });
        if (autoplay && queue.length > 1) scheduleNext();
      },

      play: () => {
        if (get().isPlaying || get().queue.length === 0) return;
        set({ isPlaying: true, generation: get().generation + 1 });
        if (get().queue.length > 1) scheduleNext();
      },

      pause: () => {
        if (!get().isPlaying) {
          // Even if not playing, drop any orphaned timer (defensive).
          clearTimer();
          return;
        }
        clearTimer();
        set({ isPlaying: false, generation: get().generation + 1 });
      },

      togglePlayPause: () => {
        if (get().isPlaying) get().pause();
        else get().play();
      },

      next: () => {
        const { queue, index, isPlaying } = get();
        if (queue.length === 0) return;
        if (index >= queue.length - 1) {
          // S-5: silent reshuffle and continue.
          const newQueue = reshuffleQueue();
          set({
            queue: newQueue,
            index: 0,
            generation: get().generation + 1,
          });
        } else {
          set({ index: index + 1, generation: get().generation + 1 });
        }
        if (isPlaying && get().queue.length > 1) scheduleNext();
      },

      previous: () => {
        const { queue, index, isPlaying } = get();
        if (queue.length === 0 || index <= 0) return;
        set({ index: index - 1, generation: get().generation + 1 });
        if (isPlaying && get().queue.length > 1) scheduleNext();
      },

      reshuffle: () => {
        const { unshuffledIds, queue, isPlaying } = get();
        if (unshuffledIds.length === 0 || queue.length === 0) return;
        clearTimer();
        const newQueue = reshuffleQueue();
        set({
          queue: newQueue,
          index: 0,
          generation: get().generation + 1,
        });
        if (isPlaying && newQueue.length > 1) scheduleNext();
      },

      skipUnavailable: (id) => {
        const { queue, index, unshuffledIds, isPlaying } = get();
        if (queue.length === 0) return;
        const newQueue = queue.filter((qId) => qId !== id);
        const newUnshuffled = unshuffledIds.filter((uId) => uId !== id);
        if (newQueue.length === 0) {
          clearTimer();
          set({
            queue: [],
            unshuffledIds: [],
            index: 0,
            isPlaying: false,
            generation: get().generation + 1,
          });
          return;
        }
        // After filter, indices >= position-of-target shift down by 1. The
        // entry that was "after" target now occupies target's old index, so
        // keeping `index` unchanged shows what would have been next. If we
        // were at the original tail, that overshoots — wrap with reshuffle
        // so S-5 still holds.
        if (index >= newQueue.length) {
          const reshuffled = seededShuffle(
            [...newUnshuffled],
            Date.now() | 0,
          );
          set({
            queue: reshuffled,
            unshuffledIds: newUnshuffled,
            index: 0,
            generation: get().generation + 1,
          });
        } else {
          set({
            queue: newQueue,
            unshuffledIds: newUnshuffled,
            index,
            generation: get().generation + 1,
          });
        }
        if (isPlaying && get().queue.length > 1) scheduleNext();
      },
    };
  });
}

const SlideshowStoreContext = createContext<StoreApi<SlideshowStore> | null>(
  null,
);

export function SlideshowStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<SlideshowStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createSlideshowStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    return () => {
      // Provider tear-down: pause clears the timer so we don't leak a tick
      // into a dead closure after the route unmounts.
      store?.getState().pause();
    };
  }, []);

  return (
    <SlideshowStoreContext.Provider value={storeRef.current}>
      {children}
    </SlideshowStoreContext.Provider>
  );
}

export function useSlideshowStore<T>(selector: (s: SlideshowStore) => T): T {
  const store = useContext(SlideshowStoreContext);
  if (!store) {
    throw new Error(
      "useSlideshowStore must be used inside <SlideshowStoreProvider>",
    );
  }
  return useStore(store, selector);
}

export function useSlideshowStoreApi(): StoreApi<SlideshowStore> {
  const store = useContext(SlideshowStoreContext);
  if (!store) {
    throw new Error(
      "useSlideshowStoreApi must be used inside <SlideshowStoreProvider>",
    );
  }
  return store;
}
