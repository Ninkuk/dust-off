import { Redirect, Stack } from "expo-router";
import { usePreferencesStore } from "@/state/preferences-store";
import { ThemeProvider, theaterTheme } from "@/theme";

export default function OnboardingLayout() {
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  if (hasSeenOnboarding) return <Redirect href="/" />;
  return (
    <ThemeProvider value={theaterTheme}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </ThemeProvider>
  );
}
