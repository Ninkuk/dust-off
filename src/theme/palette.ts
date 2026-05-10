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
