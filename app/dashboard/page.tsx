"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  Dumbbell,
  FileText,
  Users,
  Video,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import {
  DEMO_APPOINTMENTS,
  DEMO_EXERCISE_PLANS,
  DEMO_EXERCISE_RECOMMENDATIONS,
  DEMO_EXERCISE_SESSIONS,
  DEMO_MEDICAL_RECORDS,
  DEMO_PATIENTS,
  DEMO_THERAPIST_ID,
} from "@/lib/demo-data";
import type { Appointment, MedicalRecord } from "@/types/database.types";

type AppointmentWithPatient = Appointment & { patient_name?: string | null };

type PatientStatus = {
  patientId: string;
  patientName: string;
  summary: string;
  detail: string;
  priority: "high" | "medium" | "low";
};

type DashboardStats = {
  todayAppointments: number;
  weekAppointments: number;
  draftNotes: number;
  patientsNeedingAttention: number;
};

const priorityStyles: Record<PatientStatus["priority"], string> = {
  high: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
  medium:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
};

function getWeekRange() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { now, startOfToday, endOfToday, startOfWeek, endOfWeek };
}

function formatTreatmentType(value: string | null | undefined) {
  return (value || "visit").replace(/_/g, " ");
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    draftNotes: 0,
    patientsNeedingAttention: 0,
  });
  const [weeklyAppointments, setWeeklyAppointments] = useState<AppointmentWithPatient[]>([]);
  const [patientStatuses, setPatientStatuses] = useState<PatientStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    fetchDashboardData();
  }, [isDemo]);

  const statCards = useMemo(
    () => [
      {
        label: "Appointments today",
        value: stats.todayAppointments,
        helper: "Scheduled for today",
        icon: Calendar,
        iconBg: "bg-blue-100 dark:bg-blue-900/20",
        iconColor: "text-primary",
      },
      {
        label: "Appointments this week",
        value: stats.weekAppointments,
        helper: "Sunday through Saturday",
        icon: Clock,
        iconBg: "bg-violet-100 dark:bg-violet-900/20",
        iconColor: "text-violet-600 dark:text-violet-400",
      },
      {
        label: "Draft SOAP notes",
        value: stats.draftNotes,
        helper: "Ready to finish",
        icon: FileText,
        iconBg: "bg-orange-100 dark:bg-orange-900/20",
        iconColor: "text-orange-600 dark:text-orange-400",
      },
      {
        label: "Needs attention",
        value: stats.patientsNeedingAttention,
        helper: "Patients with open follow-up",
        icon: AlertTriangle,
        iconBg: "bg-red-100 dark:bg-red-900/20",
        iconColor: "text-red-600 dark:text-red-400",
      },
    ],
    [stats]
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { now, startOfToday, endOfToday, startOfWeek, endOfWeek } = getWeekRange();

      if (isDemo) {
        const patientNames = Object.fromEntries(
          DEMO_PATIENTS.map((patient) => [patient.id, patient.full_name ?? patient.email])
        );
        const weekAppointments = DEMO_APPOINTMENTS.filter((appointment) => {
          const start = new Date(appointment.start_time);
          return (
            appointment.therapist_id === DEMO_THERAPIST_ID &&
            start >= startOfWeek &&
            start <= endOfWeek &&
            appointment.status === "scheduled"
          );
        }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        const todayAppointments = weekAppointments.filter((appointment) => {
          const start = new Date(appointment.start_time);
          return start >= startOfToday && start <= endOfToday;
        }).length;

        const draftNotes = DEMO_MEDICAL_RECORDS.filter(
          (record) => record.therapist_id === DEMO_THERAPIST_ID && record.status === "draft"
        );
        const openRecommendations = DEMO_EXERCISE_RECOMMENDATIONS.filter(
          (rec) => rec.therapist_id === DEMO_THERAPIST_ID && rec.status === "open"
        );
        const statuses = buildDemoPatientStatuses(draftNotes as MedicalRecord[], openRecommendations);

        setStats({
          todayAppointments,
          weekAppointments: weekAppointments.length,
          draftNotes: draftNotes.length,
          patientsNeedingAttention: statuses.length,
        });
        setWeeklyAppointments(
          weekAppointments.slice(0, 8).map((appointment) => ({
            ...appointment,
            patient_name: patientNames[appointment.patient_id] ?? null,
          }))
        );
        setPatientStatuses(statuses);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [
        todayRes,
        weekRes,
        weeklyAppointmentsRes,
        draftNotesRes,
        activePlansRes,
        openRecsRes,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", user.id)
          .gte("start_time", startOfToday.toISOString())
          .lte("start_time", endOfToday.toISOString()),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", user.id)
          .gte("start_time", startOfWeek.toISOString())
          .lte("start_time", endOfWeek.toISOString()),
        supabase
          .from("appointments")
          .select("*")
          .eq("therapist_id", user.id)
          .gte("start_time", now.toISOString())
          .lte("start_time", endOfWeek.toISOString())
          .order("start_time", { ascending: true })
          .limit(8),
        supabase
          .from("medical_records")
          .select("id, patient_id, created_at, status")
          .eq("therapist_id", user.id)
          .eq("status", "draft"),
        (supabase as any)
          .from("exercise_plans")
          .select("id, patient_id, title, created_at")
          .eq("therapist_id", user.id)
          .eq("is_active", true),
        (supabase as any)
          .from("exercise_recommendations")
          .select("id, patient_id, exercise_plan_id, title, status, created_at")
          .eq("therapist_id", user.id)
          .eq("status", "open"),
      ]);

      const appointments = ((weeklyAppointmentsRes.data ?? []) as Appointment[]) || [];
      const draftNotes = ((draftNotesRes.data ?? []) as Pick<MedicalRecord, "id" | "patient_id" | "created_at" | "status">[]) || [];
      const activePlans = ((activePlansRes.data ?? []) as Array<{ id: string; patient_id: string; title: string }>) || [];
      const openRecommendations =
        ((openRecsRes.data ?? []) as Array<{ id: string; patient_id: string; title: string; created_at: string }>) || [];
      const patientIds = Array.from(
        new Set([
          ...appointments.map((appointment) => appointment.patient_id),
          ...draftNotes.map((record) => record.patient_id),
          ...activePlans.map((plan) => plan.patient_id),
          ...openRecommendations.map((rec) => rec.patient_id),
        ])
      );

      let patientNames: Record<string, string | null> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", patientIds);
        patientNames = Object.fromEntries(
          (profiles ?? []).map((profile: { id: string; full_name: string | null; email: string }) => [
            profile.id,
            profile.full_name || profile.email || null,
          ])
        );
      }

      const planIds = activePlans.map((plan) => plan.id);
      let recentSessions: Array<{ patient_id: string; exercise_plan_id: string; started_at: string }> = [];
      if (planIds.length > 0) {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const { data: sessions } = await (supabase as any)
          .from("exercise_sessions")
          .select("patient_id, exercise_plan_id, started_at")
          .in("exercise_plan_id", planIds)
          .gte("started_at", sevenDaysAgo.toISOString());
        recentSessions = (sessions ?? []) as typeof recentSessions;
      }

      const statuses = buildPatientStatuses({
        patientNames,
        draftNotes,
        activePlans,
        recentSessions,
        openRecommendations,
      });

      setStats({
        todayAppointments: todayRes.count || 0,
        weekAppointments: weekRes.count || 0,
        draftNotes: draftNotes.length,
        patientsNeedingAttention: statuses.length,
      });
      setWeeklyAppointments(
        appointments.map((appointment) => ({
          ...appointment,
          patient_name: patientNames[appointment.patient_id] ?? null,
        }))
      );
      setPatientStatuses(statuses);
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8">
      <header className="space-y-2">
        <Breadcrumb items={[{ label: "Dashboard" }]} />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Clinical Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl">
          A focused view of this week&apos;s schedule, open notes, and patients who need follow-up.
        </p>
      </header>

      <section aria-label="Clinical overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="font-medium">{stat.label}</CardDescription>
                <div className={`${stat.iconBg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} aria-hidden />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Upcoming this week</CardTitle>
                <CardDescription>Patient names, appointment types, and video links at a glance</CardDescription>
              </div>
              <Link href="/dashboard/calendar">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                  Calendar
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {weeklyAppointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No more appointments this week"
                description="Use the calendar to schedule the next patient visit."
                href="/dashboard/calendar"
                action="Open calendar"
              />
            ) : (
              <ul className="space-y-2" role="list">
                {weeklyAppointments.map((appointment) => {
                  const start = new Date(appointment.start_time);
                  return (
                    <li key={appointment.id}>
                      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <Link href="/dashboard/calendar" className="min-w-0 flex flex-1 items-center gap-4">
                          <div className="flex shrink-0 flex-col items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-center min-w-[4.5rem]">
                            <span className="text-sm font-semibold tabular-nums">
                              {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {appointment.patient_name || "Patient"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                              {formatTreatmentType(appointment.treatment_type)}
                              {appointment.title ? ` · ${appointment.title}` : ""}
                            </p>
                          </div>
                        </Link>
                        {appointment.video_call_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1.5 rounded-lg"
                            onClick={() => window.open(appointment.video_call_url!, "_blank", "noopener,noreferrer")}
                          >
                            <Video className="h-4 w-4" aria-hidden />
                            Video
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

        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/80 dark:border-slate-800/80">
            <CardTitle className="text-base font-semibold">Patient status</CardTitle>
            <CardDescription>Open follow-ups based on notes and home exercise activity</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {patientStatuses.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="No urgent follow-up"
                description="Patients with draft notes, open recommendations, or inactive exercise plans will appear here."
                href="/dashboard/patients"
                action="View patients"
              />
            ) : (
              <ul className="space-y-3" role="list">
                {patientStatuses.map((status) => (
                  <li key={`${status.patientId}-${status.summary}`}>
                    <Link
                      href={`/dashboard/patients/${status.patientId}`}
                      className="block rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                            {status.patientName}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{status.summary}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{status.detail}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${priorityStyles[status.priority]}`}>
                          {status.priority}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
          <CardDescription>Common tasks for patient care</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickAction href="/dashboard/calendar" icon={Calendar} title="Schedule visit" detail="Create or adjust appointments" />
            <QuickAction href="/dashboard/patients" icon={Users} title="Open roster" detail="Review patient status" />
            <QuickAction href="/dashboard/charting" icon={FileText} title="Finish notes" detail="Complete draft SOAP notes" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function buildPatientStatuses({
  patientNames,
  draftNotes,
  activePlans,
  recentSessions,
  openRecommendations,
}: {
  patientNames: Record<string, string | null>;
  draftNotes: Array<{ patient_id: string }>;
  activePlans: Array<{ id: string; patient_id: string; title: string }>;
  recentSessions: Array<{ patient_id: string; exercise_plan_id: string; started_at: string }>;
  openRecommendations: Array<{ patient_id: string; title: string; created_at: string }>;
}): PatientStatus[] {
  const statuses = new Map<string, PatientStatus>();

  draftNotes.forEach((note) => {
    statuses.set(note.patient_id, {
      patientId: note.patient_id,
      patientName: patientNames[note.patient_id] || "Patient",
      summary: "Draft SOAP note waiting",
      detail: "Finish documentation while the visit context is fresh.",
      priority: "high",
    });
  });

  openRecommendations.forEach((rec) => {
    if (statuses.has(rec.patient_id)) return;
    statuses.set(rec.patient_id, {
      patientId: rec.patient_id,
      patientName: patientNames[rec.patient_id] || "Patient",
      summary: rec.title || "Open exercise recommendation",
      detail: "Review whether the recommendation should be resolved or updated.",
      priority: "medium",
    });
  });

  activePlans.forEach((plan) => {
    if (statuses.has(plan.patient_id)) return;
    const hasRecentSession = recentSessions.some((session) => session.exercise_plan_id === plan.id);
    if (!hasRecentSession) {
      statuses.set(plan.patient_id, {
        patientId: plan.patient_id,
        patientName: patientNames[plan.patient_id] || "Patient",
        summary: "No logged exercise sessions this week",
        detail: plan.title,
        priority: "medium",
      });
    }
  });

  return Array.from(statuses.values()).slice(0, 6);
}

function buildDemoPatientStatuses(
  draftNotes: MedicalRecord[],
  openRecommendations: ReadonlyArray<{ patient_id: string; title: string; status: string }>
) {
  const patientNames = Object.fromEntries(
    DEMO_PATIENTS.map((patient) => [patient.id, patient.full_name ?? patient.email])
  );
  const activePlans = DEMO_EXERCISE_PLANS.map((plan) => ({
    id: plan.id,
    patient_id: plan.patient_id,
    title: plan.title,
  }));
  const recentSessions = DEMO_EXERCISE_SESSIONS.map((session) => ({
    patient_id: session.patient_id,
    exercise_plan_id: session.exercise_plan_id,
    started_at: session.started_at,
  }));
  return buildPatientStatuses({
    patientNames,
    draftNotes,
    activePlans,
    recentSessions,
    openRecommendations: openRecommendations.map((rec) => ({
      patient_id: rec.patient_id,
      title: rec.title,
      created_at: new Date().toISOString(),
    })),
  });
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/30 p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
        <Icon className="h-5 w-5 text-slate-500" aria-hidden />
      </div>
      <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{description}</p>
      <Link href={href}>
        <Button size="sm" variant="outline" className="rounded-lg">
          {action}
        </Button>
      </Link>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: typeof Calendar;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
    >
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{title}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{detail}</span>
      </span>
    </Link>
  );
}
