import { Galeria } from "@nandorojo/galeria";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MediaLibrary from "@/lib/media-library";
import { useTheme } from "@/theme";

// Temporary D-1 spike route. Delete at end of Phase 0 once the Galeria pass/fail
// is recorded in docs/perf-baseline-phase0.md.
//
// Runs against the REAL device library, not the mock — Galeria needs decodable
// URIs. The 50k-mock-library at src/lib/__mocks__ is for D-2 enumeration perf,
// a separate concern.

const COLS = 5;
const TARGET_COUNT = 50;

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "ready"; uris: string[] };

export default function SpikeGaleria() {
  const theme = useTheme();
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState({ status: "loading" });
      try {
        const perm = await MediaLibrary.requestPermissionsAsync(false, [
          "photo",
        ]);
        if (cancelled) return;
        if (perm.status !== "granted" && perm.accessPrivileges !== "limited") {
          setState({ status: "denied" });
          return;
        }
        const page = await MediaLibrary.getAssetsAsync({
          first: TARGET_COUNT,
          mediaType: "photo",
          sortBy: "creationTime",
        });
        if (cancelled) return;
        setState({ status: "ready", uris: page.assets.map((a) => a.uri) });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const screen = Dimensions.get("window").width;
  const gap = 1;
  const cell = Math.floor((screen - gap * (COLS - 1)) / COLS);

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <Text style={[styles.header, { color: theme.textPrimary }]}>
        D-1 Galeria spike · {state.status === "ready" ? state.uris.length : 0} photos
      </Text>

      {state.status === "loading" && (
        <ActivityIndicator color={theme.accent} style={styles.center} />
      )}

      {state.status === "denied" && (
        <Text style={[styles.center, { color: theme.textPrimary }]}>
          Photo access denied. Grant in system settings, then relaunch.
        </Text>
      )}

      {state.status === "error" && (
        <Text style={[styles.center, { color: theme.textPrimary }]}>
          Error: {state.message}
        </Text>
      )}

      {state.status === "ready" && (
        <Galeria urls={state.uris} theme="dark">
          <ScrollView contentContainerStyle={styles.grid}>
            {state.uris.map((uri, i) => (
              <Galeria.Image key={uri} index={i}>
                <Pressable>
                  <Image
                    source={{ uri }}
                    style={{
                      width: cell,
                      height: cell,
                      marginRight: (i + 1) % COLS === 0 ? 0 : gap,
                      marginBottom: gap,
                    }}
                  />
                </Pressable>
              </Galeria.Image>
            ))}
          </ScrollView>
        </Galeria>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  center: { textAlign: "center", marginTop: 80 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
