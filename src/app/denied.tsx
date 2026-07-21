import { Linking, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { isPermissionCleared } from "@/lib/permission";
import { strings } from "@/lib/strings";
import { usePermissionQuery } from "@/queries/use-permission-query";

export default function DeniedScreen() {
  const { data: permission } = usePermissionQuery();
  const insets = useSafeAreaInsets();
  if (isPermissionCleared(permission?.status)) return <Redirect href="/" />;
  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
