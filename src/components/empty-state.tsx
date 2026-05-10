import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { type, useTheme } from "@/theme";

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <Text
        accessibilityRole="header"
        style={[type.display, styles.title, { color: theme.textPrimary }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[type.body, styles.subtitle, { color: theme.textPrimary }]}
        >
          {subtitle}
        </Text>
      ) : null}
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    textAlign: "center",
    maxWidth: 360,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 16,
    opacity: 0.7,
    maxWidth: 360,
    lineHeight: 22,
  },
  action: {
    marginTop: 32,
  },
});
