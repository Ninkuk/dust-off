import {
  createSlideshowStore,
  type SlideshowStore,
} from "@/state/slideshow-store";
import type { StoreApi } from "zustand";

// The store is normally instantiated per-mount by SlideshowStoreProvider and
// consumed through Context hooks; createSlideshowStore() is exported for
// tests so we can drive a fresh, isolated instance directly via getState(),
// without rendering a component tree.

const ids = (n: number) => Array.from({ length: n }, (_, i) => `id-${i}`);

describe("slideshow-store", () => {
  let store: StoreApi<SlideshowStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    store = createSlideshowStore();
  });

  afterEach(() => {
    store.getState().pause();
    jest.useRealTimers();
  });

  it("never repeats the just-shown photo across a wrap-around reshuffle", () => {
    const initialIds = ids(5);
    store.getState().initialize({
      unshuffledIds: initialIds,
      queue: initialIds,
      startIndex: 4,
      autoplay: false,
    });

    for (let i = 0; i < 30; i++) {
      const { queue, index } = store.getState();
      const before = queue[index];
      store.getState().next();
      const after = store.getState();
      const afterId = after.queue[after.index];
      if (after.queue.length > 1) {
        expect(afterId).not.toBe(before);
      }
    }
  });

  it("alternates ids every call for a two-element queue", () => {
    const twoIds = ids(2);
    store.getState().initialize({
      unshuffledIds: twoIds,
      queue: twoIds,
      startIndex: 1,
      autoplay: false,
    });

    for (let i = 0; i < 20; i++) {
      const { queue, index } = store.getState();
      const before = queue[index];
      store.getState().next();
      const after = store.getState();
      expect(after.queue[after.index]).not.toBe(before);
    }
  });

  it("keeps playing and resets to index 0 when next() exhausts the queue", () => {
    const initialIds = ids(3);
    store.getState().initialize({
      unshuffledIds: initialIds,
      queue: initialIds,
      startIndex: 2,
      autoplay: true,
    });

    store.getState().next();

    expect(store.getState().isPlaying).toBe(true);
    expect(store.getState().index).toBe(0);
  });

  it("skipUnavailable at tail overshoot reshuffles without repeating the last-shown surviving photo", () => {
    const initialIds = ids(3);
    store.getState().initialize({
      unshuffledIds: initialIds,
      queue: initialIds,
      startIndex: 2,
      autoplay: false,
    });

    const { queue } = store.getState();
    const lastShown = queue[1];
    const toSkip = queue[2];

    store.getState().skipUnavailable(toSkip);

    const after = store.getState();
    expect(after.queue).not.toContain(toSkip);
    expect(after.queue).toHaveLength(2);
    expect(after.index).toBe(0);
    expect(after.queue[0]).not.toBe(lastShown);
  });

  it("skipUnavailable empties the queue and stops playback when it was the last id", () => {
    const initialIds = ids(1);
    store.getState().initialize({
      unshuffledIds: initialIds,
      queue: initialIds,
      startIndex: 0,
      autoplay: true,
    });

    store.getState().skipUnavailable(initialIds[0]);

    const after = store.getState();
    expect(after.queue).toHaveLength(0);
    expect(after.isPlaying).toBe(false);
  });
});
