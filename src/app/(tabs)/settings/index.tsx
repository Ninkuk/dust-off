import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GridSizeSheet } from "@/components/grid-size-sheet";
import { SettingsRow } from "@/components/settings-row";
import { SettingsSection } from "@/components/settings-section";
import { SlideDurationSheet } from "@/components/slide-duration-sheet";
import { SlideTransitionSheet } from "@/components/slide-transition-sheet";
import { SortSheet } from "@/components/sort-sheet";
import { ThemeModeSheet } from "@/components/theme-mode-sheet";
import { strings } from "@/lib/strings";
import { usePreferencesStore } from "@/state/preferences-store";
import { useToastStore } from "@/state/toast-store";
import { type, useTheme } from "@/theme";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const themeSheetRef = useRef<BottomSheetModal>(null);
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const gridSheetRef = useRef<BottomSheetModal>(null);
  const durationSheetRef = useRef<BottomSheetModal>(null);
  const transitionSheetRef = useRef<BottomSheetModal>(null);

  const themeMode = usePreferencesStore((s) => s.themeMode);
  const defaultSort = usePreferencesStore((s) => s.defaultSort);
  const gridSize = usePreferencesStore((s) => s.gridSize);
  const slideDurationSec = usePreferencesStore((s) => s.slideDurationSec);
  const slideTransition = usePreferencesStore((s) => s.slideTransition);
  const includeICloud = usePreferencesStore((s) => s.includeICloud);
  const setPreference = usePreferencesStore((s) => s.setPreference);
  const resetFlags = usePreferencesStore((s) => s.resetFlags);

  const version = Constants.expoConfig?.version ?? "—";

  const replayOnboarding = () => {
    resetFlags();
    router.replace("/onboarding");
  };

  // Clears only the guide flag, so the next slideshow re-teaches the gestures
  // without sending the user back through onboarding and the permission cards.
  const replayGestureGuide = () => {
    setPreference("seenSlideshowGuide", false);
    useToastStore.getState().show({
      kind: "flash",
      message: strings.settings.gestureGuideReset,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          accessibilityRole="header"
          style={[type.display, styles.title, { color: theme.textPrimary }]}
        >
          {strings.settings.title}
        </Text>

        <SettingsSection title={strings.settings.sections.appearance}>
          <SettingsRow
            label={strings.settings.rows.theme}
            value={strings.settings.themeModeLabels[themeMode]}
            onPress={() => themeSheetRef.current?.present()}
          />
        </SettingsSection>

        <SettingsSection title={strings.settings.sections.library}>
          {Platform.OS !== "android" && (
            <SettingsRow
              label={strings.settings.rows.includeIcloud}
              rightSlot={
                <Switch
                  value={includeICloud}
                  onValueChange={(v) => setPreference("includeICloud", v)}
                  trackColor={{ true: theme.accent, false: undefined }}
                />
              }
            />
          )}
          <SettingsRow
            label={strings.settings.rows.defaultSort}
            value={strings.gallery.sortLabels[defaultSort]}
            onPress={() => sortSheetRef.current?.present()}
          />
          <SettingsRow
            label={strings.settings.rows.gridSize}
            value={strings.settings.gridSizeLabels[gridSize]}
            onPress={() => gridSheetRef.current?.present()}
          />
        </SettingsSection>

        <SettingsSection title={strings.settings.sections.slideshow}>
          <SettingsRow
            label={strings.settings.rows.duration}
            value={strings.settings.slideDurationLabel(slideDurationSec)}
            onPress={() => durationSheetRef.current?.present()}
          />
          <SettingsRow
            label={strings.settings.rows.transition}
            value={strings.settings.slideTransitionLabels[slideTransition]}
            onPress={() => transitionSheetRef.current?.present()}
          />
          <SettingsRow
            label={strings.settings.rows.slideshowGestures}
            onPress={replayGestureGuide}
          />
        </SettingsSection>

        <SettingsSection title={strings.settings.sections.about}>
          <SettingsRow label={strings.settings.rows.version} value={version} />
          <SettingsRow
            label={strings.settings.rows.replayOnboarding}
            onPress={replayOnboarding}
          />
          <SettingsRow
            label={strings.settings.rows.acknowledgements}
            onPress={() => router.push("/settings/acknowledgements")}
          />
        </SettingsSection>
      </ScrollView>

      <ThemeModeSheet ref={themeSheetRef} />
      <SortSheet ref={sortSheetRef} />
      <GridSizeSheet ref={gridSheetRef} />
      <SlideDurationSheet ref={durationSheetRef} />
      <SlideTransitionSheet ref={transitionSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  title: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
});
