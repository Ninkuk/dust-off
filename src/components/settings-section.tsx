import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { type, useTheme } from "@/theme";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.root}>
      <Text
        accessibilityRole="header"
        style={[
          type.overline,
          styles.header,
          { color: theme.textPrimary, opacity: 0.5 },
        ]}
      >
        {title}
      </Text>
      <View>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {row}
            {i < rows.length - 1 ? (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.textPrimary, opacity: 0.08 },
                ]}
              />
            ) : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 28,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 24,
  },
});
