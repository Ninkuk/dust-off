import { Fraunces_300Light } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";

// Editorial pairing: Fraunces (soft "old-style" serif, optical-sized) carries
// the large light-weight display headlines that match the theater/Showtime
// identity; Inter does the legibility-critical body, caption, and tabular
// timer work. The weight is baked into each named cut, so styles reference
// these family names directly rather than pairing a family with `fontWeight`.
export const fontFamilies = {
  display: "Fraunces_300Light",
  body: "Inter_400Regular",
  // Reserved for emphasis — section overlines and the primary CTA — so the
  // single heavier voice reads as deliberate rather than ad-hoc bolding.
  bodyStrong: "Inter_600SemiBold",
} as const;

// Blocks the splash gate until both cuts are rasterized so headlines never
// flash in the system fallback before swapping.
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Fraunces_300Light,
    Inter_400Regular,
    Inter_600SemiBold,
  });
  return loaded;
}
