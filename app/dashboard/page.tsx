"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users, FileText, Clock, ArrowRight, Trophy, Video } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useGamification } from "@/contexts/gamification-context";
import { useDemoMode } from "@/contexts/demo-context";
import {
  getDemoDashboardStats,
  getDemoUpcomingAppointments,
} from "@/lib/demo-data";
import type { Appointment, Profile } from "@/types/database.types";

type AppointmentWithPatient = Appointment & { patient_name?: string | null };

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekAppointments: 0,
    activePatients: 0,
    pendingNotes: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { progress } = useGamification();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    fetchDashboardData();
  }, [isDemo]);

  const fetchDashboardData = async () => {
    try {
      if (isDemo) {
        setStats(getDemoDashboardStats());
        setUpcomingAppointments(getDemoUpcomingAppointments());
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { count: todayCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .gte("start_time", startOfToday.toISOString())
        .lte("start_time", endOfToday.toISOString());

      const { count: weekCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .gte("start_time", startOfWeek.toISOString())
        .lte("start_time", endOfWeek.toISOString());

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: recentAppointments } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("therapist_id", user.id)
        .gte("start_time", ninetyDaysAgo.toISOString());

      const recent = (recentAppointments ?? []) as { patient_id: string }[];
      const uniquePatientIds = new Set(recent.map((apt) => apt.patient_id));

      const { count: pendingCount } = await supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .eq("status", "draft");

      const { data: upcoming } = await supabase
        .from("appointments")
        .select("*")
        .eq("therapist_id", user.id)
        .gte("start_time", new Date().toISOString())
        .eq("status", "scheduled")
        .order("start_time", { ascending: true })
        .limit(5);

      const appointments = (upcoming as Appointment[]) || [];
      const patientIds = Array.from(new Set(appointments.map((a) => a.patient_id)));

      let patientNames: Record<string, string | null> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds);
        if (profiles) {
          patientNames = Object.fromEntries(
            profiles.map((p: { id: string; full_name: string | null }) => [
              p.id,
              p.full_name ?? null,
            ])
          );
        }
      }

      setStats({
        todayAppointments: todayCount || 0,
        weekAppointments: weekCount || 0,
        activePatients: uniquePatientIds.size,
        pendingNotes: pendingCount || 0,
      });

      setUpcomingAppointments(
        appointments.map((a) => ({
          ...a,
          patient_name: patientNames[a.patient_id] ?? null,
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-3">
          <Breadcrumb items={[{ label: "Dashboard" }]} />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-2">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-16 mt-3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Appointments today",
      value: stats.todayAppointments,
      unit: "appointment",
      icon: Calendar,
      gradient: "from-primary to-lime-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-primary",
    },
    {
      label: "Appointments this week",
      value: stats.weekAppointments,
      unit: "appointment",
      icon: Clock,
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Active patients",
      value: stats.activePatients,
      unit: "patient",
      icon: Users,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Draft SOAP notes",
      value: stats.pendingNotes,
      unit: "note",
      icon: FileText,
      gradient: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-10">
      {/* Page header */}
      <header className="space-y-2">
        <Breadcrumb items={[{ label: "Dashboard" }]} />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl">
          Your practice at a glance: today&apos;s schedule, this week&apos;s appointments, and quick actions.
        </p>
      </header>

      {/* Your progress (gamification) */}
      {progress && (
        <Card className="border border-amber-200/80 dark:border-amber-800/80 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Your progress
                </CardTitle>
              </div>
              <Link href="/dashboard/progress">
                <Button variant="ghost" size="sm" className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                  View all
                </Button>
              </Link>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              Level {progress.level} · {progress.patientCount ?? progress.totalXp} patients
              {(progress.recoveredCount ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 ml-2 text-emerald-600 dark:text-emerald-400">
                  · {progress.recoveredCount} recovered
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, progress.progressInLevel.percent)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice overview stats */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Practice overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-shadow rounded-xl"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </span>
                  <div className={`${stat.iconBg} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.iconColor}`} aria-hidden />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {stat.value === 1 ? stat.unit : `${stat.unit}s`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main content: appointments + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next 5 appointments */}
        <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Next 5 appointments
                </CardTitle>
                <CardDescription className="mt-0.5 text-slate-500 dark:text-slate-400 text-sm">
                  Click an appointment to open charting or add notes
                </CardDescription>
              </div>
              <Link href="/dashboard/calendar">
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-sm rounded-lg">
                  View calendar
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Calendar className="h-7 w-7 text-slate-500 dark:text-slate-400" aria-hidden />
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  No upcoming appointments
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  Add an appointment from the calendar to see it here.
                </p>
                <Link href="/dashboard/calendar">
                  <Button size="sm" className="gap-2 rounded-lg">
                    <Calendar className="h-4 w-4" aria-hidden />
                    Go to calendar
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-2" role="list">
                {upcomingAppointments.map((apt) => {
                  const date = new Date(apt.start_time);
                  const timeStr = date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const dayStr = date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });
                  const patientLabel = apt.patient_name ?? "Patient";
                  const treatmentLabel = (apt.treatment_type ?? "visit")
                    .toString()
                    .replace(/_/g, " ");
                  return (
                    <li key={apt.id}>
                      <div className="group flex items-center gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                        <Link
                          href={`/dashboard/charting?appointment=${apt.id}`}
                          className="flex min-w-0 flex-1 items-center gap-4"
                        >
                          <div className="flex shrink-0 flex-col items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-center min-w-[4rem]">
                            <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {timeStr}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {dayStr}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {patientLabel}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                              {treatmentLabel}
                            </p>
                          </div>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary transition-colors"
                            aria-hidden
                          />
                        </Link>
                        {apt.video_call_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1.5"
                            onClick={() => window.open(apt.video_call_url!, "_blank", "noopener,noreferrer")}
                          >
                            <Video className="h-4 w-4" aria-hidden />
                            Video call
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Quick actions
            </CardTitle>
            <CardDescription className="mt-0.5 text-slate-500 dark:text-slate-400 text-sm">
              Shortcuts to common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <nav className="space-y-2" aria-label="Quick actions">
              <Link
                href="/dashboard/calendar"
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                <span className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 p-2.5">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-100 block text-sm">
                    Schedule appointment
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Open calendar to add or reschedule
                  </span>
                </div>
              </Link>
              <Link
                href="/dashboard/patients"
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                <span className="flex shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 p-2.5">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-100 block text-sm">
                    View patients
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Browse and manage patient roster
                  </span>
                </div>
              </Link>
              <Link
                href="/dashboard/charting"
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                <span className="flex shrink-0 items-center justify-center rounded-lg bg-violet-500/10 p-2.5">
                  <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-100 block text-sm">
                    Create SOAP note
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Start or continue a chart note
                  </span>
                </div>
              </Link>
            </nav>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
