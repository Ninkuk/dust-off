import { type TextStyle } from "react-native";
import { fontFamilies } from "@/theme/fonts";

// Inter's digits are near-uniform width already; the tabular-nums feature locks
// them perfectly so the slideshow timer never reflows as numerals change. The
// family is inherited from whatever text style this is spread alongside (always
// Inter via `type.body`/`type.caption`), so no fontFamily override is needed.
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

// Weights live in the font cut itself (Fraunces_300Light, Inter_400Regular),
// so no fontWeight here — declaring one would invite synthetic faux-weights on
// Android where family + weight resolution is unreliable.
export const type = {
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  // SemiBold all-caps section label; the wider tracking keeps the heavier
  // weight legible at 10px and reads as an intentional overline.
  overline: {
    fontFamily: fontFamilies.bodyStrong,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  body: { fontFamily: fontFamilies.body, fontSize: 16 },
  // Same size as body, heavier voice — reserved for the primary CTA.
  bodyStrong: { fontFamily: fontFamilies.bodyStrong, fontSize: 16 },
  display: {
    fontFamily: fontFamilies.display,
    fontSize: 38,
    letterSpacing: -0.5,
    lineHeight: 48,
  },
} as const satisfies Record<string, TextStyle>;
