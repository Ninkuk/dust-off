import {
  type BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { File } from "expo-file-system";
import type { Asset } from "expo-media-library";
import { ChevronDown } from "lucide-react-native";
import { forwardRef, type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import {
  formatAperture,
  formatCamera,
  formatColorProfile,
  formatDate,
  formatExposureBias,
  formatFlash,
  formatFocal,
  formatIso,
  formatMegapixels,
  formatOrientation,
  formatShutter,
  formatSize,
  formatSubtypes,
  formatWhiteBalance,
  normalizeExif,
} from "@/lib/exif";
import { toLatLng } from "@/lib/geo";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { useAlbumTitle } from "@/queries/use-albums-query";
import {
  reducedMotion,
  shellMotion,
  tabularNums,
  type,
  useTheme,
} from "@/theme";
import { LocationMap } from "./location-map";
import { Sheet } from "./sheet";

type Props = {
  asset: Asset;
  onPresentChange: (open: boolean) => void;
};

const fields = strings.theater.infoFields;

async function loadAssetInfo(assetId: string) {
  // shouldDownloadFromNetwork would let iOS pull an iCloud-offloaded original
  // over the network just to read its metadata — keep the airplane-mode
  // guarantee and read only what is on the device.
  const info = await MediaLibrary.getAssetInfoAsync(assetId, {
    shouldDownloadFromNetwork: false,
  });
  let fileSize: number | undefined;
  if (info.localUri?.startsWith("file:")) {
    try {
      fileSize = new File(info.localUri).size ?? undefined;
    } catch {
      // size is best-effort; the row hides itself
    }
  }
  return { info, fileSize };
}

export const PhotoInfoSheet = forwardRef<BottomSheetModal, Props>(
  function PhotoInfoSheet({ asset, onPresentChange }, ref) {
    const [isOpen, setOpen] = useState(false);
    const albumTitle = useAlbumTitle(asset.albumId ?? undefined);

    // EXIF reads are expensive at 50k. Defer until the sheet actually opens —
    // the parent re-renders this component on every photo swipe.
    const infoQuery = useQuery({
      queryKey: ["asset-info", asset.id] as const,
      queryFn: () => loadAssetInfo(asset.id),
      staleTime: Infinity,
      enabled: isOpen,
    });

    const info = infoQuery.data?.info;
    const exif = normalizeExif(
      (info?.exif ?? null) as Record<string, unknown> | null,
    );
    const location = toLatLng(info?.location);

    const dimensions = [
      `${asset.width} × ${asset.height}`,
      formatMegapixels(asset.width, asset.height),
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <Sheet
        ref={ref}
        onChange={(index) => {
          const open = index >= 0;
          setOpen(open);
          onPresentChange(open);
        }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.root}>
          <InfoRow label={fields.name} value={asset.filename} />
          <InfoRow
            label={fields.dateTaken}
            value={formatDate(asset.creationTime)}
          />
          <InfoRow label={fields.album} value={albumTitle} />
          <InfoRow label={fields.dimensions} value={dimensions} />
          <InfoRow
            label={fields.size}
            value={formatSize(infoQuery.data?.fileSize)}
          />
          <InfoRow
            label={fields.subtypes}
            value={formatSubtypes(asset.mediaSubtypes)}
          />
          {location ? (
            <LocationMap
              latitude={location.latitude}
              longitude={location.longitude}
            />
          ) : null}
          <MoreDetails>
            <InfoRow
              label={fields.camera}
              value={formatCamera(exif.Make, exif.Model)}
            />
            <InfoRow label={fields.lens} value={asLens(exif.LensModel)} />
            <InfoRow label={fields.focal} value={formatFocal(exif.FocalLength)} />
            <InfoRow
              label={fields.aperture}
              value={formatAperture(exif.FNumber)}
            />
            <InfoRow
              label={fields.shutter}
              value={formatShutter(exif.ExposureTime)}
            />
            <InfoRow label={fields.iso} value={formatIso(exif.ISOSpeedRatings)} />
            <InfoRow
              label={fields.exposureBias}
              value={formatExposureBias(exif.ExposureBiasValue)}
            />
            <InfoRow label={fields.flash} value={formatFlash(exif.Flash)} />
            <InfoRow
              label={fields.whiteBalance}
              value={formatWhiteBalance(exif.WhiteBalance)}
            />
            <InfoRow
              label={fields.orientation}
              value={formatOrientation(exif.Orientation ?? info?.orientation)}
            />
            <InfoRow
              label={fields.colorProfile}
              value={formatColorProfile(exif.ProfileName, exif.ColorSpace)}
            />
            <InfoRow
              label={fields.dateModified}
              value={formatDate(asset.modificationTime)}
            />
            <InfoRow
              label={fields.path}
              value={info?.localUri?.replace(/^file:\/\//, "")}
              multiline
            />
          </MoreDetails>
        </BottomSheetScrollView>
      </Sheet>
    );
  },
);

function MoreDetails({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const duration = reduceMotion
    ? reducedMotion.instant
    : shellMotion.duration.fast;

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(expanded ? "180deg" : "0deg", { duration }) }],
  }));

  return (
    <>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={({ pressed }) => [styles.moreHeader, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={fields.moreDetailsA11y}
        accessibilityState={{ expanded }}
      >
        <Text style={[type.body, { color: theme.textPrimary }]}>
          {fields.moreDetails}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} strokeWidth={1.5} color={theme.textPrimary} />
        </Animated.View>
      </Pressable>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(duration)}>
          {children}
        </Animated.View>
      ) : null}
    </>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string | undefined | null;
  multiline?: boolean;
}) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={[styles.row, multiline && styles.rowMultiline]}>
      <Text
        style={[
          type.caption,
          { color: theme.textPrimary, opacity: 0.6 },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          type.body,
          tabularNums,
          styles.value,
          multiline && styles.valueMultiline,
          { color: theme.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function asLens(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() || undefined : undefined;
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    minHeight: 36,
    justifyContent: "space-between",
    gap: 16,
  },
  rowMultiline: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0,
    paddingVertical: 6,
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
  valueMultiline: {
    textAlign: "left",
  },
  moreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    marginTop: 8,
  },
});
