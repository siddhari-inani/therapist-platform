"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/contexts/gamification-context";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_PROGRESS } from "@/lib/demo-data";
import { ACHIEVEMENTS } from "@/lib/gamification";
import { Trophy, Star, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressPage() {
  const { progress, loading, refresh } = useGamification();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    if (!isDemo) refresh();
  }, [refresh, isDemo]);

  const displayProgress = isDemo ? DEMO_PROGRESS : progress;

  if (loading && !isDemo) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const p = displayProgress ?? {
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

  const unlockedSet = new Set(p.achievements.map((a) => a.achievement_key));

  return (
    <div className="p-6 md:p-8 space-y-8">
      <header className="space-y-2">
        <Breadcrumb items={[{ label: "Progress" }]} />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Your progress
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl">
          Level up as you add more patients. Unlock achievements at 1, 5, 10, 25, 50, and 100 patients.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              Patients & Level
            </CardTitle>
            <CardDescription>Your practice grows with each patient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                {p.patientCount ?? p.totalXp}
              </span>
              <span className="text-slate-500 dark:text-slate-400">patients · Level {p.level}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                <span>{p.progressInLevel.current} / {p.progressInLevel.required} patients to next level</span>
                <span>{Math.round(p.progressInLevel.percent)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, p.progressInLevel.percent)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-emerald-500" />
              Impact · Patients recovered
            </CardTitle>
            <CardDescription>Track your impact through full recoveries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                {p.recoveredCount ?? 0}
              </span>
              <span className="text-slate-500 dark:text-slate-400">patients fully recovered</span>
            </div>
            {(p.patientCount ?? 0) > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {p.recoveredCount ?? 0} of {p.patientCount ?? 0} patients
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mark discharge milestones as completed to count recoveries.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Achievements
          </CardTitle>
          <CardDescription>
            {p.achievements.length} of {ACHIEVEMENTS.length} unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedSet.has(ach.key);
              const unlockedAt = p.achievements.find((a) => a.achievement_key === ach.key)?.unlocked_at;
              return (
                <div
                  key={ach.key}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
                    unlocked
                      ? "border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20"
                      : "border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 opacity-75"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>{ach.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{ach.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{ach.description}</p>
                    {unlockedAt && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Unlocked {new Date(unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
