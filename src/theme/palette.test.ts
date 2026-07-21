import { darkShellTheme, lightTheme, theaterTheme, type Theme } from "@/theme/palette";

// WCAG 2.1 relative luminance / contrast ratio.
function channel(value: number) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const themes: [string, Theme][] = [
  ["light", lightTheme],
  ["darkShell", darkShellTheme],
  ["theater", theaterTheme],
];

describe("contrast helper", () => {
  it("matches known WCAG reference values", () => {
    expect(contrast("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
    expect(contrast("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("onAccent", () => {
  // Regression guard: light mode previously drew #FFFFFF on #F5C77E (1.57:1)
  // because content colour followed `surface`. Content on the warm gold must
  // stay dark in every theme.
  it.each(themes)("passes WCAG AA on accent in %s theme", (_name, theme) => {
    expect(contrast(theme.onAccent, theme.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("is identical across themes so it cannot follow appearance", () => {
    const values = new Set(themes.map(([, theme]) => theme.onAccent));
    expect(values.size).toBe(1);
  });

  it("would have failed with the previous surface-derived value", () => {
    expect(contrast(lightTheme.surface, lightTheme.accent)).toBeLessThan(3);
  });
});
