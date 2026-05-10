import { Stack } from "expo-router";
import { SlideshowStoreProvider } from "@/state/slideshow-store";
import { ThemeProvider, theaterTheme } from "@/theme";

export default function TheaterLayout() {
  return (
    <ThemeProvider value={theaterTheme}>
      <SlideshowStoreProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "#000" },
          }}
        />
      </SlideshowStoreProvider>
    </ThemeProvider>
  );
}
