import { Linking } from "react-native";
import { Redirect } from "expo-router";
import { EmptyState } from "@/components/empty-state";
import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";

export default function DeniedScreen() {
  const { data: permission } = usePermissionQuery();
  if (isPermissionCleared(permission)) return <Redirect href="/" />;
  return (
    <EmptyState
      title={strings.permissionDenied.title}
      subtitle={strings.permissionDenied.subtitle}
      action={{
        label: strings.permissionDenied.openSettings,
        onPress: () => {
          Linking.openSettings().catch(() => {});
        },
      }}
    />
  );
}
