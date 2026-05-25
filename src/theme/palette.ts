export const colors = {
  surface: {
    theater: "#000000",
    shellDark: "#0A0A0A",
    shellLight: "#FFFFFF",
  },
  text: {
    onDark: "#F2F2F2",
    onLight: "#000000",
  },
  accent: {
    warm: "#F5C77E",
  },
} as const;

export type Zone = "shell" | "theater";

export type Theme = {
  surface: string;
  textPrimary: string;
  accent: string;
  isDark: boolean;
  zone: Zone;
};

export const lightTheme: Theme = {
  surface: colors.surface.shellLight,
  textPrimary: colors.text.onLight,
  accent: colors.accent.warm,
  isDark: false,
  zone: "shell",
};

export const darkShellTheme: Theme = {
  surface: colors.surface.shellDark,
  textPrimary: colors.text.onDark,
  accent: colors.accent.warm,
  isDark: true,
  zone: "shell",
};

export const theaterTheme: Theme = {
  surface: colors.surface.theater,
  textPrimary: colors.text.onDark,
  accent: colors.accent.warm,
  isDark: true,
  zone: "theater",
};

// Editorial Ink — fixed dark chrome for floating UI (pill, toast, chip,
// tab bar). Deliberately not part of Theme: identity consistency means
// these values are the same regardless of system light/dark.
export const ink = {
  surface: "#111111",
  surfaceTabBar: "#0A0A0A",
  hairline: "rgba(255,255,255,0.08)",
  textPrimary: "#F2F2F2",
  textMuted: "rgba(242,242,242,0.55)",
  accent: "#F5C77E",
} as const;
