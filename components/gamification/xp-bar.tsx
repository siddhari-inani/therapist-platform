"use client";

import { useGamification } from "@/contexts/gamification-context";
import { cn } from "@/lib/utils";

export function XpBar({ compact = true, className }: { compact?: boolean; className?: string }) {
  const { progress, loading } = useGamification();

  if (loading || !progress) return null;

  const { level, progressInLevel, patientCount } = progress;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Level {level}
        </span>
        {!compact && (
          <span className="text-xs text-slate-500 dark:text-slate-500">
            {patientCount ?? 0} patients
          </span>
        )}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
          style={{ width: `${Math.min(100, progressInLevel.percent)}%` }}
        />
      </div>
    </div>
  );
}
