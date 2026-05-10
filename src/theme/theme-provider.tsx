import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { darkShellTheme, lightTheme, type Theme } from "@/theme/palette";

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
  const override = useContext(ThemeContext);
  const scheme = useColorScheme();
  if (override) return override;
  return scheme === "dark" ? darkShellTheme : lightTheme;
}
