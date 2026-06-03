import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { darkShellTheme, lightTheme, type Theme } from "@/theme/palette";
import { usePreferencesStore } from "@/state/preferences-store";

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  value,
  children,
}: {
  value: Theme;
  children: ReactNode;
}) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  // Hooks must run unconditionally, so read everything before the early return.
  const override = useContext(ThemeContext);
  const scheme = useColorScheme();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  // Forced zones (e.g. theater) ignore the user's appearance preference.
  if (override) return override;
  const resolvedDark =
    themeMode === "auto" ? scheme === "dark" : themeMode === "dark";
  return resolvedDark ? darkShellTheme : lightTheme;
}
