import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";
import { useTheme } from "@/theme";

// Cinematic bottom-bar treatment: translucent system material on iOS, brand
// surface on Android. Active state reads via warm-accent tint alone — the
// design system tops out at fontWeight 400, and Feather (the parent family
// lucide forked from, used here because lucide ships SVG components rather
// than a `getImageSource`-compatible font that NativeTabs can rasterize) is
// outline-only, so selection is conveyed by color rather than fill.
const LABEL_BASE = { fontSize: 10, fontWeight: "400", letterSpacing: 0.2 } as const;

const TAB_ICONS = {
  index: "grid",
  albums: "layers",
  settings: "settings",
} as const;

export default function TabsLayout() {
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const { data: permission } = usePermissionQuery();
  const theme = useTheme();

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (!isPermissionCleared(permission)) return <Redirect href="/denied" />;

  const resting = theme.isDark ? "rgba(242,242,242,0.55)" : "rgba(0,0,0,0.55)";
  const selected = theme.accent;
  const blurEffect = theme.isDark
    ? "systemChromeMaterialDark"
    : "systemChromeMaterialLight";
  const warmSoft = "rgba(245,199,126,0.16)";
  const warmIndicator = "rgba(245,199,126,0.20)";

  return (
    <NativeTabs
      iconColor={{ default: resting, selected }}
      labelStyle={{
        default: { ...LABEL_BASE, color: resting },
        selected: { ...LABEL_BASE, color: selected },
      }}
      blurEffect={blurEffect}
      backgroundColor={Platform.OS === "ios" ? "transparent" : theme.surface}
      shadowColor="transparent"
      rippleColor={warmSoft}
      indicatorColor={warmIndicator}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{strings.tabs.gallery}</NativeTabs.Trigger.Label>
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
        <NativeTabs.Trigger.Label>{strings.tabs.albums}</NativeTabs.Trigger.Label>
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
        <NativeTabs.Trigger.Label>{strings.tabs.settings}</NativeTabs.Trigger.Label>
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
