import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";
import { useTheme } from "@/theme";
import Feather from "@expo/vector-icons/Feather";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

// Bottom bar tracks the active shell theme (light/dark surface, theme-derived
// muted text, warm accent for selection). Feather (lucide's parent family,
// used because lucide ships SVG components rather than a `getImageSource`-
// compatible font that NativeTabs can rasterize) is outline-only, so
// selection is conveyed by color rather than fill. The design system tops
// out at fontWeight 400.
const LABEL_BASE = {
  fontSize: 10,
  fontWeight: "400",
  letterSpacing: 0.2,
} as const;

const TAB_ICONS = {
  index: "grid",
  albums: "layers",
  settings: "settings",
} as const;

export default function TabsLayout() {
  const theme = useTheme();
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const { data: permission } = usePermissionQuery();

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (!isPermissionCleared(permission)) return <Redirect href="/denied" />;

  // Selection signal is pure textPrimary contrast (black on light, near-
  // white on dark) — the warm accent is reserved for the shuffle button so
  // the bottom bar stays quiet identity-wise.
  const mutedText = theme.isDark
    ? "rgba(242,242,242,0.55)"
    : "rgba(0,0,0,0.55)";
  const rippleTint = theme.isDark
    ? "rgba(242,242,242,0.10)"
    : "rgba(0,0,0,0.08)";
  const indicatorTint = theme.isDark
    ? "rgba(242,242,242,0.16)"
    : "rgba(0,0,0,0.10)";

  return (
    <NativeTabs
      iconColor={{ default: mutedText, selected: theme.textPrimary }}
      labelStyle={{
        default: { ...LABEL_BASE, color: mutedText },
        selected: { ...LABEL_BASE, color: theme.textPrimary },
      }}
      backgroundColor={theme.surface}
      shadowColor="transparent"
      rippleColor={rippleTint}
      indicatorColor={indicatorTint}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          {strings.tabs.gallery}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon
              family={Feather}
              name={TAB_ICONS.index}
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="albums">
        <NativeTabs.Trigger.Label>
          {strings.tabs.albums}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon
              family={Feather}
              name={TAB_ICONS.albums}
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>
          {strings.tabs.settings}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon
              family={Feather}
              name={TAB_ICONS.settings}
            />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
