import * as MediaLibrary from "expo-media-library";

const useMock =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_LIBRARY === "1";

type MockData = {
  assets: MediaLibrary.Asset[];
  albums: MediaLibrary.Album[];
};

function loadMockData(): MockData {
  // Lazy require keeps the (potentially large) JSON out of the production bundle.
  // Metro requires the path to exist at build time; a placeholder is committed.
  return require("./__mocks__/assets-mock.json") as MockData;
}

const mockGetAssetsAsync: typeof MediaLibrary.getAssetsAsync = async (
  options,
) => {
  const { assets } = loadMockData();
  const albumId =
    options?.album == null
      ? undefined
      : typeof options.album === "string"
        ? options.album
        : options.album.id;
  const pool = albumId
    ? assets.filter((a) => a.albumId === albumId)
    : assets;
  const first = options?.first ?? 20;
  const cursor = options?.after;
  const startIndex = (() => {
    if (cursor == null) return 0;
    const id = typeof cursor === "string" ? cursor : cursor.id;
    const idx = pool.findIndex((a) => a.id === id);
    return idx >= 0 ? idx + 1 : 0;
  })();
  const slice = pool.slice(startIndex, startIndex + first);
  const endIndex = startIndex + slice.length;
  return {
    assets: slice,
    endCursor: slice.length > 0 ? slice[slice.length - 1].id : "",
    hasNextPage: endIndex < pool.length,
    totalCount: pool.length,
  };
};

const mockGetAlbumsAsync: typeof MediaLibrary.getAlbumsAsync = async () => {
  return loadMockData().albums;
};

export default {
  ...MediaLibrary,
  ...(useMock
    ? {
        getAssetsAsync: mockGetAssetsAsync,
        getAlbumsAsync: mockGetAlbumsAsync,
      }
    : {}),
};
