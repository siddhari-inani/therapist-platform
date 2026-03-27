"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import type { GameAction } from "@/lib/gamification";
import { getAchievementByKey } from "@/lib/gamification";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_PROGRESS } from "@/lib/demo-data";

export interface ProgressState {
  patientCount: number;
  recoveredCount: number;
  recoveryRate: number; // 0–100, percent of patients fully recovered
  totalXp: number;
  level: number;
  currentStreakDays: number;
  lastActivityDate: string | null;
  progressInLevel: { current: number; required: number; percent: number };
  achievements: { achievement_key: string; unlocked_at: string }[];
}

interface GamificationContextValue {
  progress: ProgressState | null;
  loading: boolean;
  award: (action: GameAction, metadata?: Record<string, unknown>) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultProgress: ProgressState = {
  patientCount: 0,
  recoveredCount: 0,
  recoveryRate: 0,
  totalXp: 0,
  level: 1,
  currentStreakDays: 0,
  lastActivityDate: null,
  progressInLevel: { current: 0, required: 5, percent: 0 },
  achievements: [],
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemo } = useDemoMode();

  const refresh = useCallback(async () => {
    if (isDemo) {
      setProgress(DEMO_PROGRESS);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/gamification/progress");
      if (!res.ok) return;
      const data = await res.json();
      const patientCount = data.patientCount ?? data.totalXp ?? 0;
      setProgress({
        patientCount,
        recoveredCount: data.recoveredCount ?? 0,
        recoveryRate: data.recoveryRate ?? 0,
        totalXp: patientCount,
        level: data.level ?? 1,
        currentStreakDays: data.currentStreakDays ?? 0,
        lastActivityDate: data.lastActivityDate ?? null,
        progressInLevel: data.progressInLevel ?? defaultProgress.progressInLevel,
        achievements: data.achievements ?? [],
      });
    } catch {
      setProgress(defaultProgress);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const award = useCallback(
    async (action: GameAction, metadata?: Record<string, unknown>) => {
      if (isDemo) return;
      try {
        const res = await fetch("/api/gamification/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, metadata }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const newAchievements = data.newAchievements ?? [];

        if (newAchievements.length > 0) {
          for (const ach of newAchievements) {
            const def = getAchievementByKey(ach.key);
            toast.success(`Achievement: ${ach.name}`, {
              description: def?.description ?? ach.description,
            });
          }
        }

        await refresh();
      } catch {
        // Silent fail for gamification
      }
    },
    [refresh, isDemo]
  );

  const valueProgress = isDemo ? DEMO_PROGRESS : (progress ?? defaultProgress);

  return (
    <GamificationContext.Provider
      value={{
        progress: valueProgress,
        loading,
        award,
        refresh,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  return ctx;
}
