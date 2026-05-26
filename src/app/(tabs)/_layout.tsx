import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";
import { ink, useTheme } from "@/theme";
import Feather from "@expo/vector-icons/Feather";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

// Editorial Ink bottom bar: solid #0A0A0A on both platforms, warm-accent
// tint for selection. Feather (lucide's parent family, used because lucide
// ships SVG components rather than a `getImageSource`-compatible font that
// NativeTabs can rasterize) is outline-only, so selection is conveyed by
// color rather than fill. The design system tops out at fontWeight 400.
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

  const warmSoft = "rgba(245,199,126,0.16)";
  const warmIndicator = "rgba(245,199,126,0.20)";

  return (
    <NativeTabs
      iconColor={{ default: ink.textMuted, selected: ink.accent }}
      labelStyle={{
        default: { ...LABEL_BASE, color: ink.textMuted },
        selected: { ...LABEL_BASE, color: ink.accent },
      }}
      backgroundColor={theme.surface}
      shadowColor="transparent"
      rippleColor={warmSoft}
      indicatorColor={warmIndicator}
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
