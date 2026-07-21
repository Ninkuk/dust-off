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
  danger: "#FF453A",
} as const;

export type Zone = "shell" | "theater";

export type Theme = {
  surface: string;
  textPrimary: string;
  accent: string;
  // Content drawn on top of `accent`. The warm gold is a light surface in every
  // appearance mode, so this stays dark in all themes — it must not follow
  // `surface`, which is what made light mode render white-on-gold at 1.57:1.
  onAccent: string;
  danger: string;
  isDark: boolean;
  zone: Zone;
};

export const lightTheme: Theme = {
  surface: colors.surface.shellLight,
  textPrimary: colors.text.onLight,
  accent: colors.accent.warm,
  onAccent: colors.text.onLight,
  danger: colors.danger,
  isDark: false,
  zone: "shell",
};

export const darkShellTheme: Theme = {
  surface: colors.surface.shellDark,
  textPrimary: colors.text.onDark,
  accent: colors.accent.warm,
  onAccent: colors.text.onLight,
  danger: colors.danger,
  isDark: true,
  zone: "shell",
};

export const theaterTheme: Theme = {
  surface: colors.surface.theater,
  textPrimary: colors.text.onDark,
  accent: colors.accent.warm,
  onAccent: colors.text.onLight,
  danger: colors.danger,
  isDark: true,
  zone: "theater",
};

// Editorial Ink — fixed dark chrome for floating UI (pill, toast, chip).
// Deliberately not part of Theme: identity consistency means these values
// are the same regardless of system light/dark.
export const ink = {
  surface: "#111111",
  hairline: "rgba(255,255,255,0.08)",
  textPrimary: "#F2F2F2",
  textMuted: "rgba(242,242,242,0.55)",
  accent: "#F5C77E",
  danger: "#FF453A",
} as const;
