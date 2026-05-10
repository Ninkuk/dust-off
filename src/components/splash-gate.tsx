import { useEffect, type ReactNode } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useSplashGate } from "@/hooks/use-splash-gate";

export function SplashGate({ children }: { children: ReactNode }) {
  const { ready } = useSplashGate();

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return <>{children}</>;
}
