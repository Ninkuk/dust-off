import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Redirect } from "expo-router";
import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";
import { usePreferencesStore } from "@/state/preferences-store";

export default function TabsLayout() {
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const { data: permission } = usePermissionQuery();

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (!isPermissionCleared(permission)) return <Redirect href="/denied" />;

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{strings.tabs.gallery}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" drawable="ic_menu_gallery" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="albums">
        <NativeTabs.Trigger.Label>{strings.tabs.albums}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.stack" drawable="ic_menu_archive" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{strings.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gear" drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
