import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SlideshowStoreProvider } from "@/state/slideshow-store";
import { ThemeProvider, theaterTheme } from "@/theme";

export default function TheaterLayout() {
  return (
    <ThemeProvider value={theaterTheme}>
      <StatusBar style="light" />
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
