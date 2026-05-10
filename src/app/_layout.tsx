import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashGate } from "@/components/splash-gate";
import { useLibraryChangeSubscription } from "@/hooks/use-library-change-subscription";
import { usePermissionAppStateRefetch } from "@/hooks/use-permission-app-state-refetch";
import { useToastAppStateCommit } from "@/hooks/use-toast-app-state-commit";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootBridges />
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <SplashGate>
              <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
            </SplashGate>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootBridges() {
  usePermissionAppStateRefetch();
  useLibraryChangeSubscription();
  useToastAppStateCommit();
  return null;
}
