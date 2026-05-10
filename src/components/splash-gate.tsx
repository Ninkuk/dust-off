import { useEffect, type ReactNode } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useSplashGate } from "@/hooks/use-splash-gate";

export function SplashGate({ children }: { children: ReactNode }) {
  const { hydrated } = useSplashGate();

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;
  return <>{children}</>;
}
