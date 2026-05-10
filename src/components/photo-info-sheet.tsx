import { type BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import type { Asset } from "expo-media-library";
import { forwardRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MediaLibrary from "@/lib/media-library";
import { strings } from "@/lib/strings";
import { useAlbumTitle } from "@/queries/use-albums-query";
import { tabularNums, type, useTheme } from "@/theme";
import { Sheet } from "./sheet";

type Props = {
  asset: Asset;
  onPresentChange: (open: boolean) => void;
};

export const PhotoInfoSheet = forwardRef<BottomSheetModal, Props>(
  function PhotoInfoSheet({ asset, onPresentChange }, ref) {
    const [isOpen, setOpen] = useState(false);
    const albumTitle = useAlbumTitle(asset.albumId ?? undefined);

    // EXIF reads are expensive at 50k. Defer until the sheet actually opens —
    // the parent re-renders this component on every photo swipe.
    const infoQuery = useQuery({
      queryKey: ["asset-info", asset.id] as const,
      queryFn: () => MediaLibrary.getAssetInfoAsync(asset.id),
      staleTime: Infinity,
      enabled: isOpen,
    });

    const exif = (infoQuery.data?.exif ?? null) as
      | Record<string, unknown>
      | null;

    return (
      <Sheet
        ref={ref}
        onChange={(index) => {
          const open = index >= 0;
          setOpen(open);
          onPresentChange(open);
        }}
      >
        <BottomSheetView style={styles.root}>
          <InfoRow label={strings.theater.infoFields.name} value={asset.filename} />
          <InfoRow
            label={strings.theater.infoFields.dateTaken}
            value={formatDate(asset.creationTime)}
          />
          <InfoRow label={strings.theater.infoFields.album} value={albumTitle} />
          <InfoRow
            label={strings.theater.infoFields.dimensions}
            value={`${asset.width} × ${asset.height}`}
          />
          <InfoRow
            label={strings.theater.infoFields.size}
            value={formatSize(exif?.FileSize)}
          />
          <View style={styles.gap} />
          <InfoRow
            label={strings.theater.infoFields.camera}
            value={formatCamera(exif?.Make, exif?.Model)}
          />
          <InfoRow
            label={strings.theater.infoFields.lens}
            value={asString(exif?.LensModel)}
          />
          <InfoRow
            label={strings.theater.infoFields.focal}
            value={formatFocal(exif?.FocalLength)}
          />
          <InfoRow
            label={strings.theater.infoFields.aperture}
            value={formatAperture(exif?.FNumber)}
          />
          <InfoRow
            label={strings.theater.infoFields.shutter}
            value={formatShutter(exif?.ExposureTime)}
          />
          <InfoRow
            label={strings.theater.infoFields.iso}
            value={asString(exif?.ISOSpeedRatings)}
          />
        </BottomSheetView>
      </Sheet>
    );
  },
);

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={styles.row}>
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
          { color: theme.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function asString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return undefined;
}

function formatDate(ms: number | undefined): string | undefined {
  if (!ms) return undefined;
  return new Date(ms).toLocaleString();
}

function formatCamera(make: unknown, model: unknown): string | undefined {
  const m = asString(make);
  const md = asString(model);
  if (m && md) return md.toLowerCase().startsWith(m.toLowerCase()) ? md : `${m} ${md}`;
  return md ?? m;
}

function formatFocal(v: unknown): string | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return `${Math.round(n)}mm`;
}

function formatAperture(v: unknown): string | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return `f/${n.toFixed(1).replace(/\.0$/, "")}`;
}

function formatShutter(v: unknown): string | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  if (n >= 1) return `${n.toFixed(1).replace(/\.0$/, "")}s`;
  const denom = Math.round(1 / n);
  return `1/${denom}s`;
}

function formatSize(v: unknown): string | undefined {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
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
  },
  value: {
    textAlign: "right",
  },
  gap: {
    height: 16,
  },
});
