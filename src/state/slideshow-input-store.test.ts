import type { Asset } from "expo-media-library";
import { useSlideshowInputStore } from "@/state/slideshow-input-store";

const makeAsset = (id: string): Asset =>
  ({ id, uri: `file:///${id}.jpg` }) as Asset;

describe("slideshow-input-store", () => {
  beforeEach(() => {
    useSlideshowInputStore.setState({
      pendingIds: null,
      pendingAssets: null,
    });
  });

  describe("ids channel", () => {
    it("setInput then takeInput returns the ids, then drains to null", () => {
      useSlideshowInputStore.getState().setInput(["a", "b"]);
      expect(useSlideshowInputStore.getState().takeInput()).toEqual([
        "a",
        "b",
      ]);
      expect(useSlideshowInputStore.getState().takeInput()).toBeNull();
    });
  });

  describe("assets channel", () => {
    it("setAssets then takeAssets returns the same array reference, then drains to null", () => {
      const assets = [makeAsset("1"), makeAsset("2")];
      useSlideshowInputStore.getState().setAssets(assets);
      expect(useSlideshowInputStore.getState().takeAssets()).toBe(assets);
      expect(useSlideshowInputStore.getState().takeAssets()).toBeNull();
    });
  });

  describe("channel independence", () => {
    it("setting assets does not disturb pending ids", () => {
      useSlideshowInputStore.getState().setInput(["a"]);
      useSlideshowInputStore.getState().setAssets([makeAsset("1")]);
      expect(useSlideshowInputStore.getState().pendingIds).toEqual(["a"]);
      expect(useSlideshowInputStore.getState().takeInput()).toEqual(["a"]);
    });

    it("setting ids does not disturb pending assets", () => {
      const assets = [makeAsset("1")];
      useSlideshowInputStore.getState().setAssets(assets);
      useSlideshowInputStore.getState().setInput(["a"]);
      expect(useSlideshowInputStore.getState().pendingAssets).toBe(assets);
      expect(useSlideshowInputStore.getState().takeAssets()).toBe(assets);
    });

    it("draining one channel does not clear the other", () => {
      useSlideshowInputStore.getState().setInput(["a"]);
      useSlideshowInputStore.getState().setAssets([makeAsset("1")]);
      useSlideshowInputStore.getState().takeInput();
      expect(useSlideshowInputStore.getState().pendingAssets).not.toBeNull();
    });
  });
});
