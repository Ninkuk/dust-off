import { Stack } from "expo-router";
import { ThemeProvider, theaterTheme } from "@/theme";

export default function TheaterLayout() {
  return (
    <ThemeProvider value={theaterTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#000" },
        }}
      />
    </ThemeProvider>
  );
}
