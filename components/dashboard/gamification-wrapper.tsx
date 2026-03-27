"use client";

import { GamificationProvider } from "@/contexts/gamification-context";

export function GamificationWrapper({ children }: { children: React.ReactNode }) {
  return <GamificationProvider>{children}</GamificationProvider>;
}
