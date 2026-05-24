import { Stack } from "expo-router";

// Materialize `index` (albums list) beneath `[albumId]` even when the album
// is reached via `router.replace` from theater's "Go to Folder". Without this,
// the albums Stack is empty under [albumId] and back falls through to the
// previous tab (the gallery the photo came from), stranding the user.
export const unstable_settings = {
  initialRouteName: "index",
};

export default function AlbumsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[albumId]" />
    </Stack>
  );
}
