import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFavoritesStore } from "@/state/favorites-store";

const STORAGE_KEY = "@dust-off/favorites";
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("favorites-store", () => {
  beforeEach(async () => {
    useFavoritesStore.getState().clearFavorites();
    await AsyncStorage.clear();
  });

  describe("action semantics", () => {
    it("addFavorite adds an id", () => {
      useFavoritesStore.getState().addFavorite("a");
      expect(useFavoritesStore.getState().favorites).toEqual(new Set(["a"]));
    });

    it("addFavorite on an existing id is a no-op (same Set reference)", () => {
      useFavoritesStore.getState().addFavorite("a");
      const before = useFavoritesStore.getState().favorites;
      useFavoritesStore.getState().addFavorite("a");
      expect(useFavoritesStore.getState().favorites).toBe(before);
    });

    it("toggleFavorite adds when absent and removes when present", () => {
      useFavoritesStore.getState().toggleFavorite("a");
      expect(useFavoritesStore.getState().favorites.has("a")).toBe(true);
      useFavoritesStore.getState().toggleFavorite("a");
      expect(useFavoritesStore.getState().favorites.has("a")).toBe(false);
    });

    it("removeFavorites removes only present ids and is a no-op when none match", () => {
      useFavoritesStore.getState().addFavorites(["a", "b", "c"]);
      useFavoritesStore.getState().removeFavorites(["b", "z"]);
      expect(useFavoritesStore.getState().favorites).toEqual(
        new Set(["a", "c"]),
      );

      const before = useFavoritesStore.getState().favorites;
      useFavoritesStore.getState().removeFavorites(["not-there"]);
      expect(useFavoritesStore.getState().favorites).toBe(before);
    });
  });

  it("serializes to a sorted array on persist", async () => {
    useFavoritesStore.getState().addFavorites(["b", "a", "c"]);
    await flush();

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.ids).toEqual(["a", "b", "c"]);
  });

  it("rehydrates favorites from persisted ids", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { ids: ["x", "y"] }, version: 1 }),
    );

    await useFavoritesStore.persist.rehydrate();

    expect(useFavoritesStore.getState().favorites).toEqual(
      new Set(["x", "y"]),
    );
  });

  it("falls back to an empty Set when persisted shape is missing ids", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: {}, version: 1 }),
    );

    await useFavoritesStore.persist.rehydrate();

    expect(useFavoritesStore.getState().favorites).toEqual(new Set());
  });
});
