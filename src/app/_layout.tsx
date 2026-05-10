import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashGate } from "@/components/splash-gate";
import { usePermissionAppStateRefetch } from "@/hooks/use-permission-app-state-refetch";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PermissionAppStateBridge />
        <SafeAreaProvider>
          <SplashGate>
            <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
          </SplashGate>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function PermissionAppStateBridge() {
  usePermissionAppStateRefetch();
  return null;
}
