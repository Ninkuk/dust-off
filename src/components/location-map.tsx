import * as Linking from "expo-linking";
import { ExternalLink } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { formatCoordinates, mapsUrl, projectEquirectangular } from "@/lib/geo";
import { strings } from "@/lib/strings";
import { WORLD_MAP_PATH, WORLD_MAP_VIEWBOX } from "@/lib/world-map";
import { tabularNums, type, useTheme } from "@/theme";

type Props = {
  latitude: number;
  longitude: number;
};

// Offline mini map: a bundled world outline with the photo's location pinned.
// Deliberately not a tile map — tile requests would send the photo's GPS point
// to a map provider and break the app's airplane-mode privacy guarantee.
// Tapping hands the coordinate off to the OS Maps app, like the share sheet.
export function LocationMap({ latitude, longitude }: Props) {
  const theme = useTheme();
  const { x, y } = projectEquirectangular(latitude, longitude);

  return (
    <Pressable
      onPress={() =>
        Linking.openURL(
          mapsUrl(latitude, longitude, Platform.OS === "ios" ? "ios" : "android"),
        )
      }
      accessibilityRole="button"
      accessibilityLabel={strings.theater.infoFields.openInMapsA11y}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.mapWrap}>
        <View
          style={[styles.ocean, { backgroundColor: theme.textPrimary }]}
        />
        <Svg viewBox={WORLD_MAP_VIEWBOX} width="100%" height="100%">
          <Path
            d={WORLD_MAP_PATH}
            fill={theme.textPrimary}
            fillOpacity={0.32}
            fillRule="evenodd"
          />
          <Circle
            cx={x * 360}
            cy={y * 180}
            r={7}
            fill={theme.accent}
            fillOpacity={0.28}
          />
          <Circle cx={x * 360} cy={y * 180} r={2.5} fill={theme.accent} />
        </Svg>
      </View>
      <View style={styles.footer}>
        <Text
          style={[
            type.caption,
            tabularNums,
            { color: theme.textPrimary, opacity: 0.6 },
          ]}
        >
          {formatCoordinates(latitude, longitude)}
        </Text>
        <View style={styles.footerIcon}>
          <ExternalLink size={14} strokeWidth={1.5} color={theme.textPrimary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  mapWrap: {
    aspectRatio: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  ocean: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  footerIcon: {
    opacity: 0.5,
  },
});
