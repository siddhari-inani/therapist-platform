"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  TriangleAlert,
  Mail,
  Phone,
  Edit,
  User,
  Calendar as CalendarIcon,
  Stethoscope,
  MessageSquare,
  Video,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import {
  DEMO_PATIENTS,
  DEMO_APPOINTMENTS,
  DEMO_MEDICAL_RECORDS,
  DEMO_MILESTONES,
  DEMO_THERAPIST_ID,
  DEMO_EXERCISE_PLANS,
  DEMO_EXERCISE_PLAN_ITEMS,
  DEMO_EXERCISE_RECOMMENDATIONS,
  DEMO_EXERCISE_TEMPLATES,
  DEMO_EXERCISE_SESSIONS,
} from "@/lib/demo-data";
import type {
  Profile,
  Appointment,
  MedicalRecord,
  RecoveryMilestone,
} from "@/types/database.types";
import { RecoveryTimeline } from "@/components/patients/recovery-timeline";

type ExerciseTemplate = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  video_url: string | null;
  image_url?: string | null;
};

type ExercisePlan = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

type ExercisePlanItem = {
  id: string;
  exercise_plan_id?: string;
  sequence_order: number;
  exercise_template_id: string;
  sets: number | null;
  reps: number | null;
  hold_seconds: number | null;
  rest_seconds: number | null;
  frequency_per_week: number | null;
  days_of_week: string[] | null;
  notes: string | null;
  exercise_templates: { name: string } | null;
};

type ExerciseRecommendation = {
  id: string;
  exercise_plan_id?: string | null;
  title: string;
  body: string | null;
  recommendation_type: string;
  status: string;
  created_at: string;
};

type ExerciseVideoJob = {
  id: string;
  exercise_template_id: string;
  status: string;
  video_url: string | null;
  error_message: string | null;
  created_at: string;
};

type FormHistoryPoint = {
  id: string;
  sessionAt: string;
  exerciseName: string;
  formScore: number | null;
  pain: number | null;
  effort: number | null;
  flags: string[];
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [milestones, setMilestones] = useState<RecoveryMilestone[]>([]);
  const [demoExercisePlan, setDemoExercisePlan] = useState<any | null>(null);
  const [demoExerciseItems, setDemoExerciseItems] = useState<any[]>([]);
  const [demoRecommendations, setDemoRecommendations] = useState<any[]>([]);
  const [exerciseSummary, setExerciseSummary] = useState<{
    planTitle: string;
    sessionsThisWeek: number;
    lastSessionAt: string | null;
    openRecommendations: number;
  } | null>(null);
  const [quickRecTitle, setQuickRecTitle] = useState("");
  const [quickRecBody, setQuickRecBody] = useState("");
  const [savingQuickRec, setSavingQuickRec] = useState(false);
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [exercisePlanItems, setExercisePlanItems] = useState<ExercisePlanItem[]>([]);
  const [exerciseRecommendations, setExerciseRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [templateVideoJobs, setTemplateVideoJobs] = useState<Record<string, ExerciseVideoJob>>({});
  const [formHistoryPoints, setFormHistoryPoints] = useState<FormHistoryPoint[]>([]);
  const [demoPlannerItems, setDemoPlannerItems] = useState<ExercisePlanItem[]>([]);
  const [demoPlannerRecommendations, setDemoPlannerRecommendations] = useState<
    ExerciseRecommendation[]
  >([]);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [queueingVideoForTemplateId, setQueueingVideoForTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newItemTemplateId, setNewItemTemplateId] = useState("");
  const [newItemSets, setNewItemSets] = useState("");
  const [newItemReps, setNewItemReps] = useState("");
  const [newItemHoldSeconds, setNewItemHoldSeconds] = useState("");
  const [newItemFrequency, setNewItemFrequency] = useState("");
  const [newItemDays, setNewItemDays] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newTrackerRecTitle, setNewTrackerRecTitle] = useState("");
  const [newTrackerRecBody, setNewTrackerRecBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "records" | "exercise"
  >("overview");
  const supabase = createClient();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId, isDemo]);

  useEffect(() => {
    if (!isDemo && activeTab === "exercise" && patientId) {
      fetchExercisePlannerData();
    }
  }, [activeTab, patientId, isDemo]);

  const fetchPatientData = async () => {
    try {
      if (isDemo) {
        const demoPatient = DEMO_PATIENTS.find((p) => p.id === patientId);
        if (!demoPatient) {
          setLoading(false);
          return;
        }
        setPatient(demoPatient as Profile);
        setAppointments(DEMO_APPOINTMENTS.filter((a) => a.patient_id === patientId && a.therapist_id === DEMO_THERAPIST_ID).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).slice(0, 20));
        setRecords(DEMO_MEDICAL_RECORDS.filter((r) => r.patient_id === patientId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20));
        setMilestones(DEMO_MILESTONES.filter((m) => m.patient_id === patientId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as RecoveryMilestone[]);
        const plan = DEMO_EXERCISE_PLANS.find((p) => p.patient_id === patientId) || null;
        setDemoExercisePlan(plan || null);
        if (plan) {
          const items = DEMO_EXERCISE_PLAN_ITEMS.filter((i) => i.exercise_plan_id === plan.id)
            .map((item) => ({
              ...item,
              template:
                DEMO_EXERCISE_TEMPLATES.find((t) => t.id === item.exercise_template_id) || null,
              sessions: DEMO_EXERCISE_SESSIONS.filter(
                (s) => s.exercise_plan_item_id === item.id && s.patient_id === patientId
              ).sort(
                (a, b) =>
                  new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
              ),
            }))
            .sort((a, b) => a.sequence_order - b.sequence_order);
          setDemoExerciseItems(items);
          setDemoRecommendations(
            DEMO_EXERCISE_RECOMMENDATIONS.filter((r) => r.patient_id === patientId).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } else {
          setDemoExerciseItems([]);
          setDemoRecommendations([]);
        }

        // Demo planner state (mirrors production planner UX, but in-memory)
        const plannerTemplates: ExerciseTemplate[] = DEMO_EXERCISE_TEMPLATES.map((t) => ({
          id: t.id,
          name: t.name,
          description: null,
          created_by: DEMO_THERAPIST_ID,
          video_url: null,
          image_url: t.image_url ?? null,
        }));
        const plannerPlans: ExercisePlan[] = DEMO_EXERCISE_PLANS.filter(
          (p) => p.patient_id === patientId
        ).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description ?? null,
          start_date: p.start_date ?? null,
          end_date: p.end_date ?? null,
          is_active: p.is_active,
          created_at: p.created_at,
        }));
        const plannerItems: ExercisePlanItem[] = DEMO_EXERCISE_PLAN_ITEMS.filter((i) =>
          plannerPlans.some((p) => p.id === i.exercise_plan_id)
        ).map((i) => ({
          id: i.id,
          exercise_plan_id: i.exercise_plan_id,
          sequence_order: i.sequence_order,
          exercise_template_id: i.exercise_template_id,
          sets: i.sets ?? null,
          reps: i.reps ?? null,
          hold_seconds: i.hold_seconds ?? null,
          rest_seconds: i.rest_seconds ?? null,
          frequency_per_week: i.frequency_per_week ?? null,
          days_of_week: i.days_of_week ? [...i.days_of_week] : null,
          notes: i.notes ?? null,
          exercise_templates: {
            name:
              DEMO_EXERCISE_TEMPLATES.find((t) => t.id === i.exercise_template_id)?.name ||
              "Exercise",
          },
        }));
        const plannerRecs: ExerciseRecommendation[] = DEMO_EXERCISE_RECOMMENDATIONS.filter(
          (r) => r.patient_id === patientId
        ).map((r) => ({
          id: r.id,
          exercise_plan_id: r.exercise_plan_id ?? null,
          title: r.title,
          body: r.body ?? null,
          recommendation_type: r.recommendation_type,
          status: r.status,
          created_at: r.created_at,
        }));
        setExerciseTemplates(plannerTemplates);
        setExercisePlans(plannerPlans);
        setDemoPlannerItems(plannerItems);
        setDemoPlannerRecommendations(plannerRecs);
        const preferredPlanId =
          plannerPlans.find((p) => p.is_active)?.id || plannerPlans[0]?.id || null;
        setSelectedPlanId(preferredPlanId);
        setTemplateVideoJobs({});

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

      // Fetch patient profile
      const { data: patientData, error: patientError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .eq("role", "patient")
        .maybeSingle();

      if (patientError) {
        // Avoid hard-failing the page for transient/permissions lookup errors.
        console.warn("Unable to load patient profile:", patientError.message);
        setLoading(false);
        return;
      }
      if (!patientData) {
        setLoading(false);
        return;
      }

      setPatient(patientData as Profile);

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", user.id)
        .order("start_time", { ascending: false })
        .limit(20);

      if (!appointmentsError) {
        setAppointments(appointmentsData as Appointment[] || []);
      }

      // Fetch medical records
      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!recordsError) {
        setRecords(recordsData as MedicalRecord[] || []);
      }

      // Fetch recovery milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("recovery_milestones")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: true });

      if (!milestonesError) {
        setMilestones(milestonesData as RecoveryMilestone[] || []);
      }

      // Fetch exercise summary for overview
      const { data: plans } = await supabase
        .from("exercise_plans")
        .select("id, title")
        .eq("patient_id", patientId)
        .eq("therapist_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (plans && plans.length > 0) {
        const plan = plans[0] as { id: string; title: string };
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: sessionsThisWeek } = await supabase
          .from("exercise_sessions")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patientId)
          .eq("exercise_plan_id", plan.id)
          .gte("started_at", oneWeekAgo.toISOString());

        const { data: lastSession } = await supabase
          .from("exercise_sessions")
          .select("started_at")
          .eq("patient_id", patientId)
          .eq("exercise_plan_id", plan.id)
          .order("started_at", { ascending: false })
          .limit(1);

        const { count: openRecs } = await supabase
          .from("exercise_recommendations")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patientId)
          .eq("exercise_plan_id", plan.id)
          .eq("status", "open");

        setExerciseSummary({
          planTitle: plan.title,
          sessionsThisWeek: sessionsThisWeek || 0,
          lastSessionAt: lastSession && lastSession.length > 0 ? (lastSession[0] as any).started_at : null,
          openRecommendations: openRecs || 0,
        });
      } else {
        setExerciseSummary(null);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddRecommendation = async () => {
    if (!quickRecTitle.trim() || savingQuickRec || !patient) return;
    if (isDemo) {
      const activePlanId = exercisePlans.find((p) => p.is_active)?.id || selectedPlanId || null;
      const newRec: ExerciseRecommendation = {
        id: `demo-quick-rec-${Date.now()}`,
        exercise_plan_id: activePlanId,
        title: quickRecTitle.trim(),
        body: quickRecBody.trim() || null,
        recommendation_type: "other",
        status: "open",
        created_at: new Date().toISOString(),
      };
      setDemoPlannerRecommendations((prev) => [newRec, ...prev]);
      setQuickRecTitle("");
      setQuickRecBody("");
      setSavingQuickRec(false);
      return;
    }
    setSavingQuickRec(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSavingQuickRec(false);
        return;
      }

      // Find active plan again (lightweight, ensures we attach correctly)
      const { data: plans } = await supabase
        .from("exercise_plans")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("therapist_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      const planId = plans && plans.length > 0 ? (plans[0] as any).id : null;

      const { data, error } = await supabase
        .from("exercise_recommendations")
        .insert({
          patient_id: patient.id,
          therapist_id: user.id,
          exercise_plan_id: planId,
          recommendation_type: "other",
          status: "open",
          title: quickRecTitle.trim(),
          body: quickRecBody.trim() || null,
          is_patient_visible: true,
          created_by_system: false,
        })
        .select("id")
        .single();

      if (!error && data) {
        setQuickRecTitle("");
        setQuickRecBody("");
        // Refresh summary counts
        await fetchPatientData();
      }
    } catch (err) {
      console.error("Error adding exercise recommendation:", err);
    } finally {
      setSavingQuickRec(false);
    }
  };

  const fetchExercisePlannerData = async () => {
    setExerciseLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: templates } = await supabase
        .from("exercise_templates")
        .select("id, name, description, created_by, video_url")
        .order("name", { ascending: true });
      const templateRows = (templates as ExerciseTemplate[]) || [];
      setExerciseTemplates(templateRows);

      if (templateRows.length > 0) {
        const templateIds = templateRows.map((t) => t.id);
        const { data: jobs } = await supabase
          .from("exercise_video_jobs")
          .select("id, exercise_template_id, status, video_url, error_message, created_at")
          .in("exercise_template_id", templateIds)
          .order("created_at", { ascending: false });
        const latestByTemplate: Record<string, ExerciseVideoJob> = {};
        (jobs as ExerciseVideoJob[] | null)?.forEach((job) => {
          if (!latestByTemplate[job.exercise_template_id]) {
            latestByTemplate[job.exercise_template_id] = job;
          }
        });
        setTemplateVideoJobs(latestByTemplate);
      } else {
        setTemplateVideoJobs({});
      }

      const { data: plans } = await supabase
        .from("exercise_plans")
        .select("id, title, description, start_date, end_date, is_active, created_at")
        .eq("patient_id", patientId)
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: false });

      const planRows = (plans as ExercisePlan[]) || [];
      setExercisePlans(planRows);
      const activeOrFirstPlanId =
        selectedPlanId && planRows.some((p) => p.id === selectedPlanId)
          ? selectedPlanId
          : planRows.find((p) => p.is_active)?.id || planRows[0]?.id || null;
      setSelectedPlanId(activeOrFirstPlanId);

      if (activeOrFirstPlanId) {
        await fetchPlanItems(activeOrFirstPlanId);
        await fetchPlanRecommendations(activeOrFirstPlanId);
        await fetchFormHistory(activeOrFirstPlanId);
      } else {
        setExercisePlanItems([]);
        setExerciseRecommendations([]);
        setFormHistoryPoints([]);
      }
    } catch (error) {
      console.error("Error loading exercise planner data:", error);
    } finally {
      setExerciseLoading(false);
    }
  };

  const fetchPlanItems = async (planId: string) => {
    const { data } = await supabase
      .from("exercise_plan_items")
      .select(
        "id, sequence_order, exercise_template_id, sets, reps, hold_seconds, rest_seconds, frequency_per_week, days_of_week, notes, exercise_templates(name)"
      )
      .eq("exercise_plan_id", planId)
      .order("sequence_order", { ascending: true });
    setExercisePlanItems((data as ExercisePlanItem[]) || []);
  };

  const fetchPlanRecommendations = async (planId: string) => {
    const { data } = await supabase
      .from("exercise_recommendations")
      .select("id, title, body, recommendation_type, status, created_at")
      .eq("patient_id", patientId)
      .eq("exercise_plan_id", planId)
      .order("created_at", { ascending: false });
    setExerciseRecommendations((data as ExerciseRecommendation[]) || []);
  };

  const fetchFormHistory = async (planId: string) => {
    const { data: sessions } = await supabase
      .from("exercise_sessions")
      .select(
        "id, started_at, average_pain_score, average_effort, exercise_plan_item_id, exercise_template_id"
      )
      .eq("patient_id", patientId)
      .eq("exercise_plan_id", planId)
      .order("started_at", { ascending: false })
      .limit(12);

    const sessionRows = (sessions as any[]) || [];
    if (sessionRows.length === 0) {
      setFormHistoryPoints([]);
      return;
    }

    const sessionIds = sessionRows.map((s) => s.id);
    const { data: feedbackRows } = await supabase
      .from("exercise_form_feedback")
      .select("exercise_session_id, form_score, flags")
      .in("exercise_session_id", sessionIds);

    const feedbackBySession = new Map<string, { form_score: number | null; flags: string[] | null }>();
    (feedbackRows as any[] | null)?.forEach((row) => {
      feedbackBySession.set(row.exercise_session_id, {
        form_score: row.form_score ?? null,
        flags: row.flags ?? null,
      });
    });

    const nameByTemplate = new Map<string, string>();
    exerciseTemplates.forEach((t) => nameByTemplate.set(t.id, t.name));

    const history: FormHistoryPoint[] = sessionRows.map((session) => {
      const feedback = feedbackBySession.get(session.id);
      const inferredFormScore =
        feedback?.form_score ??
        Math.max(
          50,
          Math.min(
            98,
            92 - (session.average_pain_score ?? 0) * 8 - Math.max((session.average_effort ?? 5) - 6, 0) * 4
          )
        );
      return {
        id: session.id,
        sessionAt: session.started_at,
        exerciseName: nameByTemplate.get(session.exercise_template_id) || "Exercise",
        formScore: inferredFormScore,
        pain: session.average_pain_score ?? null,
        effort: session.average_effort ?? null,
        flags: Array.isArray(feedback?.flags) ? feedback!.flags! : [],
      };
    });

    setFormHistoryPoints(history);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    if (isDemo) {
      const newTemplate: ExerciseTemplate = {
        id: `demo-template-${Date.now()}`,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        created_by: DEMO_THERAPIST_ID,
        video_url: null,
      };
      setExerciseTemplates((prev) => [...prev, newTemplate].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTemplateName("");
      setNewTemplateDescription("");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("exercise_templates").insert({
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        created_by: user.id,
      });
      if (!error) {
        setNewTemplateName("");
        setNewTemplateDescription("");
        await fetchExercisePlannerData();
      }
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) return;
    if (isDemo) {
      const nowIso = new Date().toISOString();
      const newPlan: ExercisePlan = {
        id: `demo-plan-${Date.now()}`,
        title: newPlanTitle.trim(),
        description: newPlanDescription.trim() || null,
        start_date: nowIso.slice(0, 10),
        end_date: null,
        is_active: true,
        created_at: nowIso,
      };
      setExercisePlans((prev) =>
        [newPlan, ...prev.map((p) => ({ ...p, is_active: false }))].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setSelectedPlanId(newPlan.id);
      setNewPlanTitle("");
      setNewPlanDescription("");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("exercise_plans").insert({
        patient_id: patientId,
        therapist_id: user.id,
        title: newPlanTitle.trim(),
        description: newPlanDescription.trim() || null,
        is_active: true,
      });
      if (!error) {
        setNewPlanTitle("");
        setNewPlanDescription("");
        await fetchExercisePlannerData();
      }
    } catch (error) {
      console.error("Error creating plan:", error);
    }
  };

  const handleSetPlanActive = async (planId: string) => {
    if (isDemo) {
      setExercisePlans((prev) => prev.map((p) => ({ ...p, is_active: p.id === planId })));
      setSelectedPlanId(planId);
      return;
    }
    try {
      await supabase
        .from("exercise_plans")
        .update({ is_active: false })
        .eq("patient_id", patientId);
      await supabase
        .from("exercise_plans")
        .update({ is_active: true })
        .eq("id", planId);
      setSelectedPlanId(planId);
      await fetchExercisePlannerData();
    } catch (error) {
      console.error("Error setting active plan:", error);
    }
  };

  const handleAddPlanItem = async () => {
    if (!selectedPlanId || !newItemTemplateId) return;
    if (isDemo) {
      const selectedItems = demoPlannerItems.filter((i) => i.exercise_plan_id === selectedPlanId);
      const nextOrder = (selectedItems[selectedItems.length - 1]?.sequence_order || 0) + 1;
      const days = newItemDays
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      const templateName =
        exerciseTemplates.find((t) => t.id === newItemTemplateId)?.name || "Exercise";
      const newItem: ExercisePlanItem = {
        id: `demo-item-${Date.now()}`,
        exercise_plan_id: selectedPlanId,
        sequence_order: nextOrder,
        exercise_template_id: newItemTemplateId,
        sets: newItemSets ? Number(newItemSets) : null,
        reps: newItemReps ? Number(newItemReps) : null,
        hold_seconds: newItemHoldSeconds ? Number(newItemHoldSeconds) : null,
        rest_seconds: null,
        frequency_per_week: newItemFrequency ? Number(newItemFrequency) : null,
        days_of_week: days.length ? days : null,
        notes: newItemNotes.trim() || null,
        exercise_templates: { name: templateName },
      };
      setDemoPlannerItems((prev) => [...prev, newItem]);
      setNewItemTemplateId("");
      setNewItemSets("");
      setNewItemReps("");
      setNewItemHoldSeconds("");
      setNewItemFrequency("");
      setNewItemDays("");
      setNewItemNotes("");
      return;
    }
    try {
      const nextOrder = (exercisePlanItems[exercisePlanItems.length - 1]?.sequence_order || 0) + 1;
      const days = newItemDays
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      const { error } = await supabase.from("exercise_plan_items").insert({
        exercise_plan_id: selectedPlanId,
        exercise_template_id: newItemTemplateId,
        sequence_order: nextOrder,
        sets: newItemSets ? Number(newItemSets) : null,
        reps: newItemReps ? Number(newItemReps) : null,
        hold_seconds: newItemHoldSeconds ? Number(newItemHoldSeconds) : null,
        frequency_per_week: newItemFrequency ? Number(newItemFrequency) : null,
        days_of_week: days.length ? days : null,
        notes: newItemNotes.trim() || null,
      });
      if (!error) {
        setNewItemTemplateId("");
        setNewItemSets("");
        setNewItemReps("");
        setNewItemHoldSeconds("");
        setNewItemFrequency("");
        setNewItemDays("");
        setNewItemNotes("");
        await fetchPlanItems(selectedPlanId);
      }
    } catch (error) {
      console.error("Error adding plan item:", error);
    }
  };

  const handleDeletePlanItem = async (itemId: string) => {
    if (!selectedPlanId) return;
    if (isDemo) {
      setDemoPlannerItems((prev) => {
        const remaining = prev.filter((i) => i.id !== itemId);
        const selectedItems = remaining
          .filter((i) => i.exercise_plan_id === selectedPlanId)
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map((item, index) => ({ ...item, sequence_order: index + 1 }));
        const otherItems = remaining.filter((i) => i.exercise_plan_id !== selectedPlanId);
        return [...otherItems, ...selectedItems];
      });
      return;
    }
    await supabase.from("exercise_plan_items").delete().eq("id", itemId);
    await fetchPlanItems(selectedPlanId);
  };

  const handleMovePlanItem = async (itemId: string, direction: "up" | "down") => {
    if (!selectedPlanId) return;
    if (isDemo) {
      const selectedItems = demoPlannerItems
        .filter((i) => i.exercise_plan_id === selectedPlanId)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      const currentIndex = selectedItems.findIndex((i) => i.id === itemId);
      if (currentIndex === -1) return;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= selectedItems.length) return;
      const reordered = [...selectedItems];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];
      const renumbered = reordered.map((item, index) => ({ ...item, sequence_order: index + 1 }));
      setDemoPlannerItems((prev) => {
        const others = prev.filter((i) => i.exercise_plan_id !== selectedPlanId);
        return [...others, ...renumbered];
      });
      return;
    }
    const currentIndex = exercisePlanItems.findIndex((i) => i.id === itemId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= exercisePlanItems.length) return;
    const current = exercisePlanItems[currentIndex];
    const target = exercisePlanItems[targetIndex];
    await supabase
      .from("exercise_plan_items")
      .update({ sequence_order: target.sequence_order })
      .eq("id", current.id);
    await supabase
      .from("exercise_plan_items")
      .update({ sequence_order: current.sequence_order })
      .eq("id", target.id);
    await fetchPlanItems(selectedPlanId);
  };

  const handleAddTrackerRecommendation = async () => {
    if (!selectedPlanId || !newTrackerRecTitle.trim()) return;
    if (isDemo) {
      const newRec: ExerciseRecommendation = {
        id: `demo-rec-${Date.now()}`,
        exercise_plan_id: selectedPlanId,
        title: newTrackerRecTitle.trim(),
        body: newTrackerRecBody.trim() || null,
        recommendation_type: "other",
        status: "open",
        created_at: new Date().toISOString(),
      };
      setDemoPlannerRecommendations((prev) =>
        [newRec, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setNewTrackerRecTitle("");
      setNewTrackerRecBody("");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("exercise_recommendations").insert({
        patient_id: patientId,
        therapist_id: user.id,
        exercise_plan_id: selectedPlanId,
        recommendation_type: "other",
        status: "open",
        title: newTrackerRecTitle.trim(),
        body: newTrackerRecBody.trim() || null,
        is_patient_visible: true,
        created_by_system: false,
      });
      if (!error) {
        setNewTrackerRecTitle("");
        setNewTrackerRecBody("");
        await fetchPlanRecommendations(selectedPlanId);
      }
    } catch (error) {
      console.error("Error adding recommendation:", error);
    }
  };

  const handleQueueTemplateVideo = async (template: ExerciseTemplate) => {
    setQueueingVideoForTemplateId(template.id);
    if (isDemo) {
      try {
        const nowIso = new Date().toISOString();
        const demoUrl = `https://demo.revora.ai/videos/${template.id}.mp4`;
        setTemplateVideoJobs((prev) => ({
          ...prev,
          [template.id]: {
            id: `demo-job-${Date.now()}`,
            exercise_template_id: template.id,
            status: "succeeded",
            video_url: demoUrl,
            error_message: null,
            created_at: nowIso,
          },
        }));
        setExerciseTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? { ...t, video_url: demoUrl } : t))
        );
      } finally {
        setQueueingVideoForTemplateId(null);
      }
      return;
    }
    try {
      const prompt = `Create a clean exercise demo video for physical therapy.\nExercise: ${
        template.name
      }\nDescription: ${
        template.description ?? "No extra notes provided."
      }\nShow slow, controlled movement and neutral camera angle.`;
      const response = await fetch("/api/exercise/video-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_template_id: template.id, prompt }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to queue video job");
      }
      await fetchExercisePlannerData();
    } catch (error) {
      console.error("Error queueing video job:", error);
    } finally {
      setQueueingVideoForTemplateId(null);
    }
  };

  const planItemsForView = isDemo
    ? demoPlannerItems
        .filter((item) => item.exercise_plan_id === selectedPlanId)
        .sort((a, b) => a.sequence_order - b.sequence_order)
    : exercisePlanItems;
  const recommendationsForView = isDemo
    ? demoPlannerRecommendations
        .filter((rec) => rec.exercise_plan_id === selectedPlanId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : exerciseRecommendations;
  const demoFormHistory: FormHistoryPoint[] = isDemo
    ? DEMO_EXERCISE_SESSIONS.filter(
        (session) =>
          session.patient_id === patientId &&
          session.exercise_plan_id === (selectedPlanId || demoExercisePlan?.id)
      )
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, 12)
        .map((session) => {
          const templateId =
            DEMO_EXERCISE_PLAN_ITEMS.find((item) => item.id === session.exercise_plan_item_id)
              ?.exercise_template_id || "";
          const exerciseName =
            DEMO_EXERCISE_TEMPLATES.find((t) => t.id === templateId)?.name || "Exercise";
          const lowerNotes = (session.notes || "").toLowerCase();
          const flags: string[] = [];
          if (lowerNotes.includes("knee")) flags.push("knee valgus risk");
          if ((session.average_effort ?? 0) >= 7) flags.push("fatigue compensation");
          if ((session.average_pain_score ?? 0) >= 3) flags.push("pain-guarding");
          const inferredFormScore = Math.max(
            55,
            Math.min(
              97,
              92 -
                (session.average_pain_score ?? 0) * 8 -
                Math.max((session.average_effort ?? 5) - 6, 0) * 4
            )
          );
          return {
            id: session.id,
            sessionAt: session.started_at,
            exerciseName,
            formScore: inferredFormScore,
            pain: session.average_pain_score ?? null,
            effort: session.average_effort ?? null,
            flags,
          };
        })
    : [];
  const formHistoryForView = isDemo ? demoFormHistory : formHistoryPoints;
  const openRecommendationsForView = recommendationsForView.filter((rec) => rec.status === "open").length;
  const latestFormScore = formHistoryForView[0]?.formScore ?? null;
  const oldestFormScore =
    formHistoryForView.length > 1 ? formHistoryForView[formHistoryForView.length - 1]?.formScore : null;
  const formTrendDelta =
    latestFormScore !== null && oldestFormScore !== null ? latestFormScore - oldestFormScore : null;
  const beforeFigureScore = oldestFormScore ?? latestFormScore;
  const afterFigureScore = latestFormScore;
  const avgFormScore =
    formHistoryForView.length > 0
      ? Math.round(
          formHistoryForView.reduce((sum, point) => sum + (point.formScore ?? 0), 0) /
            formHistoryForView.length
        )
      : null;
  const flaggedSessionCount = formHistoryForView.filter((point) => point.flags.length > 0).length;
  const beforeTrunkLean = beforeFigureScore !== null ? Math.max(0, 18 - beforeFigureScore / 6) : null;
  const afterTrunkLean = afterFigureScore !== null ? Math.max(0, 18 - afterFigureScore / 6) : null;
  const beforeKneeValgus = beforeFigureScore !== null ? Math.max(0, 12 - beforeFigureScore / 8) : null;
  const afterKneeValgus = afterFigureScore !== null ? Math.max(0, 12 - afterFigureScore / 8) : null;
  const formQualityLabel =
    avgFormScore === null ? "No data" : avgFormScore >= 80 ? "Strong control" : avgFormScore >= 65 ? "Needs cueing" : "High correction need";
  const trendLabel =
    formTrendDelta === null ? "Trend unavailable" : formTrendDelta >= 0 ? "Improving form trend" : "Regressing form trend";

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading patient...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Patient not found</h3>
            <p className="text-muted-foreground mb-4">
              This patient doesn&apos;t exist or you don&apos;t have access.
            </p>
            <Link href="/dashboard/patients">
              <Button variant="outline">Back to Patients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.start_time) >= new Date()
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.start_time) < new Date()
  );

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <Breadcrumb
          items={[
            { label: "Patients", href: "/dashboard/patients" },
            { label: patient.full_name || patient.email || "Patient" },
          ]}
        />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {patient.full_name || patient.email}
            </h1>
            <p className="text-muted-foreground text-lg mt-1">Patient Profile</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/messages?patient=${patient.id}`}>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </Link>
            <Link href={`/dashboard/calendar?patient=${patient.id}`}>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </Link>
            <Link href={`/dashboard/patients/${patient.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex gap-1 rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-1 shadow-sm shadow-slate-200/60 dark:shadow-black/30">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className={`h-9 px-4 text-sm font-medium rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-primary/90 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/70 hover:shadow-sm dark:hover:bg-slate-800/70"
            }`}
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("appointments")}
            className={`h-9 px-4 text-sm font-medium rounded-xl transition-all ${
              activeTab === "appointments"
                ? "bg-primary/90 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/70 hover:shadow-sm dark:hover:bg-slate-800/70"
            }`}
          >
            Appointments ({appointments.length})
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("records")}
            className={`h-9 px-4 text-sm font-medium rounded-xl transition-all ${
              activeTab === "records"
                ? "bg-primary/90 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/70 hover:shadow-sm dark:hover:bg-slate-800/70"
            }`}
          >
            Medical Records ({records.length})
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("exercise")}
            className={`h-9 px-4 text-sm font-medium rounded-xl transition-all ${
              activeTab === "exercise"
                ? "bg-primary/90 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/70 hover:shadow-sm dark:hover:bg-slate-800/70"
            }`}
          >
            Exercise tracker
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Exercise Insights */}
          <Card className="overflow-hidden border border-amber-300/80 dark:border-amber-700/70 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30 shadow-md">
            <CardHeader className="pb-1">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 p-1.5">
                  <TriangleAlert className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-amber-900 dark:text-amber-100 text-base">
                    Exercise Insight
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">
                    Quick clinical signal and suggested plan update.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0 pb-3">
              {isDemo ? (
                <>
                  {demoExercisePlan ? (
                    <>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Active plan
                        </p>
                        <p className="text-sm font-semibold">
                          {demoExercisePlan.title}
                        </p>
                      </div>
                      {demoExerciseItems.length > 0 ? (
                        <>
                          <div className="rounded-md border-l-4 border-amber-500 border border-amber-200/80 dark:border-amber-700 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 space-y-1">
                            <p className="font-semibold text-amber-900 dark:text-amber-200">
                              Surya showed repeated knee valgus this week during squats.
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              Clinical pattern is consistent with <span className="font-medium">hip abductor weakness</span> (positive
                              Trendelenburg).
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              Suggested: add <span className="font-medium">side-lying clamshells</span> (2-3 sets, 12-15 reps, 3-4x/week).
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-2 border-slate-200 dark:border-slate-600 hover:bg-primary/10 hover:border-primary font-semibold gap-1.5"
                              onClick={() => {
                                setQuickRecTitle("Quick add: Clamshells");
                                setQuickRecBody(
                                  "Surya struggled with knee valgus during squats this week. Add side-lying clamshells (2–3 sets of 12–15 reps, 3–4x/week) to target hip abductors and improve control."
                                );
                              }}
                            >
                              Quick add: Clamshells
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-2 border-slate-200 dark:border-slate-600 hover:bg-primary/10 hover:border-primary font-semibold gap-1.5"
                              asChild
                            >
                              <Link href={`/dashboard/messages?patient=${patient.id}`}>
                                <MessageSquare className="h-3 w-3" />
                                <span>Send Surya a message</span>
                              </Link>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This demo patient has a structured exercise plan. Switch out of demo mode
                          to see live tracking from the patient app.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This demo patient doesn&apos;t have an exercise plan yet.
                    </p>
                  )}
                </>
              ) : exerciseSummary ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Active plan
                      </p>
                      <p className="text-sm font-semibold">{exerciseSummary.planTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Sessions this week
                      </p>
                      <p className="text-sm font-semibold">
                        {exerciseSummary.sessionsThisWeek}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Last session
                      </p>
                      <p className="text-sm font-semibold">
                        {exerciseSummary.lastSessionAt
                          ? new Date(exerciseSummary.lastSessionAt).toLocaleDateString()
                          : "No sessions yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Open exercise recommendations:{" "}
                      <span className="font-semibold">
                        {exerciseSummary.openRecommendations}
                      </span>
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active exercise plan yet. Create a plan in the Exercise tab to start tracking
                  adherence and form.
                </p>
              )}

              {/* Quick add recommendation */}
              {!isDemo && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Quick exercise recommendation
                  </p>
                  {exerciseSummary && (
                    <button
                      type="button"
                      className="text-xs text-primary underline underline-offset-2"
                      onClick={() => {
                        const title = "Adjust exercise plan based on tracking";
                        const body = `Over the last week this patient completed ${exerciseSummary.sessionsThisWeek} session${
                          exerciseSummary.sessionsThisWeek === 1 ? "" : "s"
                        } on the active plan "${exerciseSummary.planTitle}". Consider either progressing load (if pain ≤3/10) or maintaining current dosage for another week before progressing.`;
                        setQuickRecTitle(title);
                        setQuickRecBody(body);
                      }}
                    >
                      Use suggested recommendation based on tracking
                    </button>
                  )}
                  <input
                    type="text"
                    value={quickRecTitle}
                    onChange={(e) => setQuickRecTitle(e.target.value)}
                    placeholder="Short headline (e.g. 'Slow down your squats')"
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  />
                  <textarea
                    value={quickRecBody}
                    onChange={(e) => setQuickRecBody(e.target.value)}
                    placeholder="Optional details you want the patient to see about this change in their plan..."
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[60px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleQuickAddRecommendation}
                      disabled={savingQuickRec || !quickRecTitle.trim()}
                    >
                      {savingQuickRec ? "Saving..." : "Add Recommendation"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recovery Timeline */}
          <RecoveryTimeline
            milestones={milestones}
            patientId={patientId}
            onMilestoneAdded={fetchPatientData}
          />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Patient Info */}
            <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-base">{patient.full_name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{patient.email}</p>
                </div>
              </div>
              {patient.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{patient.phone}</p>
                  </div>
                </div>
              )}
              {patient.date_of_birth && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date of Birth
                  </label>
                  <p className="text-base">
                    {new Date(patient.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {patient.insurance_provider && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Insurance Provider
                  </label>
                  <p className="text-base">{patient.insurance_provider}</p>
                  {patient.insurance_id && (
                    <p className="text-sm text-muted-foreground">
                      ID: {patient.insurance_id}
                    </p>
                  )}
                </div>
              )}
              {patient.emergency_contact_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Emergency Contact
                  </label>
                  <p className="text-base">{patient.emergency_contact_name}</p>
                  {patient.emergency_contact_phone && (
                    <p className="text-sm text-muted-foreground">
                      {patient.emergency_contact_phone}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Appointments</span>
                <span className="text-2xl font-bold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upcoming</span>
                <span className="text-2xl font-bold text-primary">
                  {upcomingAppointments.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Medical Records</span>
                <span className="text-2xl font-bold text-green-600">{records.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patient Since</span>
                <span className="text-base">
                  {new Date(patient.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          </div>

          {/* Recent Appointments */}
          {appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointments.slice(0, 5).map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/dashboard/charting?appointment=${apt.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <div className="font-medium">
                          {new Date(apt.start_time).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(apt.start_time).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          - {apt.title || apt.treatment_type}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            apt.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "appointments" && (
        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>
              {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No appointments yet</p>
                <Link href={`/dashboard/calendar?patient=${patient.id}`}>
                  <Button className="mt-4">Schedule First Appointment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Link
                      href={`/dashboard/charting?appointment=${apt.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium mb-1">
                            {new Date(apt.start_time).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {new Date(apt.start_time).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(apt.end_time).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="capitalize">
                              {(apt.treatment_type ?? "visit").toString().replace("_", " ")}
                            </span>
                            {apt.title && <span>• {apt.title}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              apt.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : apt.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : apt.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>
                      </div>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "records" && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Records</CardTitle>
            <CardDescription>
              {records.length} SOAP note{records.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No medical records yet</p>
                <Link href={`/dashboard/charting?patient=${patient.id}`}>
                  <Button>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Create First SOAP Note
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <Link
                    key={record.id}
                    href={`/dashboard/charting?record=${record.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium mb-1">
                          {record.appointment_id
                            ? "Appointment Record"
                            : "Standalone Note"}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {new Date(record.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {record.finalized_at && (
                            <span className="ml-2 text-green-600">
                              • Finalized{" "}
                              {new Date(record.finalized_at).toLocaleDateString()}
                            </span>
                          )}
                          {record.status === "amended" && (
                            <span className="ml-2 text-orange-600">
                              • Amended (Version {record.version || 1})
                            </span>
                          )}
                        </div>
                        {record.assessment && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            Assessment: {record.assessment.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            record.status === "finalized"
                              ? "bg-green-100 text-green-800"
                              : record.status === "amended"
                              ? "bg-orange-100 text-orange-800"
                              : record.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {record.status}
                        </span>
                        {record.version && record.version > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            v{record.version}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "exercise" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Exercise Tracker</CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {planItemsForView.length} exercises
                  </span>
                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {openRecommendationsForView} open recs
                  </span>
                </div>
              </div>
              <CardDescription>
                View and manage this patient&apos;s exercise plan and recent exercise activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                  {exerciseLoading && (
                    <div className="text-sm text-muted-foreground">
                      Loading exercise templates and plans...
                    </div>
                  )}

                  {isDemo && (
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <div className="text-sm font-semibold">Current Demo Exercise Snapshot</div>
                      {!demoExercisePlan && (
                        <div className="text-sm text-muted-foreground">
                          This demo patient doesn&apos;t have an exercise plan yet.
                        </div>
                      )}
                      {demoExercisePlan && (
                        <>
                          <div>
                            <h2 className="text-base font-semibold">{demoExercisePlan.title}</h2>
                            {demoExercisePlan.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {demoExercisePlan.description}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {demoExerciseItems.map((item) => (
                              <div
                                key={item.id}
                                className="border rounded-lg p-3 bg-background/70 flex flex-col gap-2"
                              >
                                <div className="font-medium">{item.template?.name ?? "Exercise"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.sets && item.reps
                                    ? `${item.sets} sets x ${item.reps} reps`
                                    : item.hold_seconds
                                    ? `Hold for ${item.hold_seconds} seconds`
                                    : "Dosage not set"}
                                </div>
                                {item.sessions && item.sessions.length > 0 && (
                                  <div className="mt-1 border-t pt-2 space-y-1.5">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                      Sessions for this exercise
                                    </div>
                                    {item.sessions.map((s: any) => (
                                      <div
                                        key={s.id}
                                        className="text-xs flex justify-between gap-3 rounded-md bg-white/60 dark:bg-slate-900/60 px-2 py-1.5 border border-slate-200/70 dark:border-slate-800/70"
                                      >
                                        <div className="space-y-0.5">
                                          <span className="font-semibold text-foreground">
                                            {new Date(s.started_at).toLocaleDateString()}
                                          </span>
                                          <span className="block text-[11px] text-muted-foreground">
                                            {s.total_sets_completed} sets
                                            {s.total_reps_completed
                                              ? ` / ${s.total_reps_completed} reps`
                                              : ""}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground text-right">
                                          <div>
                                            Pain{" "}
                                            <span className="font-semibold">
                                              {s.average_pain_score ?? "-"}
                                            </span>
                                          </div>
                                          <div>
                                            Effort{" "}
                                            <span className="font-semibold">
                                              {s.average_effort ?? "-"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="text-sm font-semibold">Create Exercise Template</div>
                      <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Template name (e.g. Clamshell)"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                      <textarea
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[72px]"
                        placeholder="Description, cues, and common faults"
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                      />
                      <Button size="sm" onClick={handleCreateTemplate} disabled={!newTemplateName.trim()}>
                        Save template
                      </Button>
                      <div className="pt-2 space-y-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Existing templates
                        </div>
                        {exerciseTemplates.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            No templates yet.
                          </div>
                        )}
                        {exerciseTemplates.map((template) => {
                          const job = templateVideoJobs[template.id];
                          const resolvedVideoUrl = job?.video_url ?? template.video_url;
                          return (
                            <div
                              key={template.id}
                              className="rounded-md border bg-background p-2 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{template.name}</div>
                                  <div className="text-xs text-muted-foreground capitalize">
                                    Video status: {job?.status ?? (resolvedVideoUrl ? "ready" : "not generated")}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {resolvedVideoUrl && (
                                  <a
                                    href={resolvedVideoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs underline text-muted-foreground hover:text-foreground"
                                  >
                                    View video
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQueueTemplateVideo(template)}
                                  disabled={queueingVideoForTemplateId === template.id}
                                >
                                  {queueingVideoForTemplateId === template.id
                                    ? "Queueing..."
                                    : resolvedVideoUrl
                                    ? "Regenerate AI video"
                                    : "Generate AI video"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="text-sm font-semibold">Create Patient Plan</div>
                      <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Plan title (e.g. Week 3 Strength Progression)"
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                      />
                      <textarea
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[72px]"
                        placeholder="Plan focus and progression notes"
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                      />
                      <Button size="sm" onClick={handleCreatePlan} disabled={!newPlanTitle.trim()}>
                        Save plan
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-3 bg-background/60">
                    <div className="text-sm font-semibold">Plan Workspace</div>
                    <div className="flex flex-wrap gap-2">
                      {exercisePlans.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No plan yet for this patient. Create one to start building exercises.
                        </div>
                      )}
                      {exercisePlans.map((plan) => (
                        <Button
                          key={plan.id}
                          size="sm"
                          variant={selectedPlanId === plan.id ? "default" : "outline"}
                          onClick={async () => {
                            setSelectedPlanId(plan.id);
                            if (!isDemo) {
                              await fetchPlanItems(plan.id);
                              await fetchPlanRecommendations(plan.id);
                              await fetchFormHistory(plan.id);
                            }
                          }}
                        >
                          {plan.title}
                          {plan.is_active ? " (Active)" : ""}
                        </Button>
                      ))}
                    </div>

                    {selectedPlanId && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleSetPlanActive(selectedPlanId)}>
                          Set selected as active
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedPlanId && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-3 xl:col-span-1">
                          <div className="text-sm font-semibold">Add Exercise To Selected Plan</div>
                        <select
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          value={newItemTemplateId}
                          onChange={(e) => setNewItemTemplateId(e.target.value)}
                        >
                          <option value="">Choose exercise template</option>
                          {exerciseTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <input
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="Sets"
                            value={newItemSets}
                            onChange={(e) => setNewItemSets(e.target.value)}
                          />
                          <input
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="Reps"
                            value={newItemReps}
                            onChange={(e) => setNewItemReps(e.target.value)}
                          />
                          <input
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="Hold (sec)"
                            value={newItemHoldSeconds}
                            onChange={(e) => setNewItemHoldSeconds(e.target.value)}
                          />
                          <input
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="Frequency / week"
                            value={newItemFrequency}
                            onChange={(e) => setNewItemFrequency(e.target.value)}
                          />
                        </div>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          placeholder="Days (comma-separated, e.g. mon,wed,fri)"
                          value={newItemDays}
                          onChange={(e) => setNewItemDays(e.target.value)}
                        />
                        <textarea
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[64px]"
                          placeholder="Exercise notes"
                          value={newItemNotes}
                          onChange={(e) => setNewItemNotes(e.target.value)}
                        />
                        <Button size="sm" onClick={handleAddPlanItem} disabled={!newItemTemplateId}>
                          Add item
                        </Button>
                        </div>

                        <div className="space-y-2 xl:col-span-2">
                          <div className="text-sm font-semibold">Current Plan Items</div>
                          {planItemsForView.length === 0 && (
                            <div className="text-sm text-muted-foreground rounded-lg border p-4 bg-muted/20">
                              No items in this plan yet.
                            </div>
                          )}
                          {planItemsForView.map((item, index) => (
                            <div
                              key={item.id}
                              className="border rounded-lg p-3 bg-muted/40 flex flex-col gap-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium">
                                    #{item.sequence_order} {item.exercise_templates?.name ?? "Exercise"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.sets ? `${item.sets} sets` : "-"} |{" "}
                                    {item.reps ? `${item.reps} reps` : "-"} |{" "}
                                    {item.hold_seconds ? `${item.hold_seconds}s hold` : "-"} |{" "}
                                    {item.frequency_per_week ? `${item.frequency_per_week}x/week` : "-"}
                                  </div>
                                  {item.days_of_week && item.days_of_week.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      Days: {item.days_of_week.join(", ")}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMovePlanItem(item.id, "up")}
                                    disabled={index === 0}
                                  >
                                    Up
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMovePlanItem(item.id, "down")}
                                    disabled={index === planItemsForView.length - 1}
                                  >
                                    Down
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeletePlanItem(item.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900/85 dark:to-slate-950/70 p-4 md:p-5 space-y-4 shadow-sm ring-1 ring-white/40 dark:ring-white/5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                            Form Correction History
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Longitudinal view of form quality, pain, and correction flags.
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {formQualityLabel}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-1 rounded-full ${
                                formTrendDelta === null
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  : formTrendDelta >= 0
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                            >
                              {trendLabel}
                            </span>
                          </div>
                        </div>
                        {formTrendDelta !== null && (
                          <div
                            className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                              formTrendDelta >= 0
                                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                            }`}
                          >
                            {formTrendDelta >= 0 ? "+" : ""}
                            {formTrendDelta.toFixed(0)} pts
                          </div>
                        )}
                      </div>

                    {formHistoryForView.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="rounded-lg border bg-background/85 px-3 py-2.5">
                          <div className="text-[10px] uppercase text-muted-foreground">Sessions</div>
                          <div className="text-sm font-semibold">{formHistoryForView.length}</div>
                        </div>
                        <div className="rounded-lg border bg-background/85 px-3 py-2.5">
                          <div className="text-[10px] uppercase text-muted-foreground">Avg score</div>
                          <div className="text-sm font-semibold">{avgFormScore ?? "N/A"}</div>
                        </div>
                        <div className="rounded-lg border bg-background/85 px-3 py-2.5">
                          <div className="text-[10px] uppercase text-muted-foreground">Flags hit</div>
                          <div className="text-sm font-semibold">{flaggedSessionCount}</div>
                        </div>
                        <div className="rounded-lg border bg-background/85 px-3 py-2.5">
                          <div className="text-[10px] uppercase text-muted-foreground">Trend</div>
                          <div
                            className={`text-sm font-semibold ${
                              formTrendDelta !== null && formTrendDelta >= 0
                                ? "text-green-600 dark:text-green-300"
                                : "text-red-600 dark:text-red-300"
                            }`}
                          >
                            {formTrendDelta !== null
                              ? `${formTrendDelta >= 0 ? "+" : ""}${formTrendDelta.toFixed(0)}`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    {formHistoryForView.length === 0 && (
                      <div className="text-sm text-muted-foreground rounded-xl border border-dashed p-4 bg-background/50">
                        No form history yet. Session feedback will appear here after exercise logs.
                      </div>
                    )}

                    {formHistoryForView.length > 0 && (
                      <div className="space-y-3">
                        <div className="rounded-xl border bg-background/90 p-3 md:p-4">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">
                            Visual Form Progress
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            {[
                              { label: "Earlier", score: beforeFigureScore },
                              { label: "Latest", score: afterFigureScore },
                            ].map(({ label, score }) => {
                              const safeScore = Math.max(0, Math.min(100, score ?? 0));
                              const trunkLean = Math.max(0, 18 - safeScore / 6);
                              const kneeValgus = Math.max(0, 12 - safeScore / 8);
                              const strokeColor =
                                safeScore >= 80 ? "#22c55e" : safeScore >= 65 ? "#f59e0b" : "#ef4444";
                              return (
                                <div
                                  key={label}
                                  className="rounded-md border bg-muted/20 p-2 flex flex-col items-center"
                                >
                                  <div className="text-[11px] font-medium mb-1">{label}</div>
                                  <svg
                                    viewBox="0 0 100 120"
                                    className="h-24 w-20"
                                    role="img"
                                    aria-label={`${label} form stick figure`}
                                  >
                                    <defs>
                                      <marker
                                        id={`${label}-arrowhead`}
                                        markerWidth="6"
                                        markerHeight="6"
                                        refX="5"
                                        refY="3"
                                        orient="auto"
                                      >
                                        <path d="M0,0 L6,3 L0,6 Z" fill={strokeColor} />
                                      </marker>
                                    </defs>
                                    <circle cx="50" cy="16" r="8" fill="none" stroke={strokeColor} strokeWidth="3" />
                                    <line
                                      x1="50"
                                      y1="24"
                                      x2={50 - trunkLean}
                                      y2="58"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1={50 - trunkLean}
                                      y1="34"
                                      x2={34 - trunkLean / 2}
                                      y2="48"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1={50 - trunkLean}
                                      y1="34"
                                      x2={66 - trunkLean / 2}
                                      y2="48"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1={50 - trunkLean}
                                      y1="58"
                                      x2={42 + kneeValgus / 2}
                                      y2="84"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1={50 - trunkLean}
                                      y1="58"
                                      x2={58 - kneeValgus / 2}
                                      y2="84"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1={42 + kneeValgus / 2}
                                      y1="84"
                                      x2={38 + kneeValgus}
                                      y2="108"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1={58 - kneeValgus / 2}
                                      y1="84"
                                      x2={62 - kneeValgus}
                                      y2="108"
                                      stroke={strokeColor}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                    {/* trunk direction arrow */}
                                    <line
                                      x1="66"
                                      y1="28"
                                      x2={66 - trunkLean * 1.2}
                                      y2="48"
                                      stroke={strokeColor}
                                      strokeWidth="2"
                                      markerEnd={`url(#${label}-arrowhead)`}
                                      opacity="0.9"
                                    />
                                    {/* knee alignment arrows */}
                                    <line
                                      x1="30"
                                      y1="82"
                                      x2={30 + kneeValgus * 1.2}
                                      y2="94"
                                      stroke={strokeColor}
                                      strokeWidth="2"
                                      markerEnd={`url(#${label}-arrowhead)`}
                                      opacity="0.9"
                                    />
                                    <line
                                      x1="70"
                                      y1="82"
                                      x2={70 - kneeValgus * 1.2}
                                      y2="94"
                                      stroke={strokeColor}
                                      strokeWidth="2"
                                      markerEnd={`url(#${label}-arrowhead)`}
                                      opacity="0.9"
                                    />
                                  </svg>
                                  <div className="text-[11px] text-muted-foreground">
                                    Score: {score ?? "N/A"}
                                  </div>
                                  <div className="mt-1 text-[10px] text-muted-foreground text-center">
                                    Trunk lean: {trunkLean.toFixed(1)} deg
                                  </div>
                                  <div className="text-[10px] text-muted-foreground text-center">
                                    Knee collapse: {kneeValgus.toFixed(1)} deg
                                  </div>
                                  <div className="mt-1 text-[10px] text-muted-foreground text-center leading-snug">
                                    {safeScore >= 80
                                      ? "Arrow joints show stable trunk and improved knee tracking."
                                      : safeScore >= 65
                                      ? "Arrow joints show mild compensation; monitor trunk and knee drift."
                                      : "Arrow joints show notable compensation needing correction cues."}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-2">
                              <div className="font-medium text-foreground">Difference</div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Form score</span>
                                <span
                                  className={`font-medium ${
                                    formTrendDelta !== null && formTrendDelta >= 0
                                      ? "text-green-600 dark:text-green-300"
                                      : "text-red-600 dark:text-red-300"
                                  }`}
                                >
                                  {formTrendDelta !== null
                                    ? `${formTrendDelta >= 0 ? "+" : ""}${formTrendDelta.toFixed(0)}`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Trunk lean</span>
                                <span
                                  className={`font-medium ${
                                    beforeTrunkLean !== null &&
                                    afterTrunkLean !== null &&
                                    afterTrunkLean <= beforeTrunkLean
                                      ? "text-green-600 dark:text-green-300"
                                      : "text-red-600 dark:text-red-300"
                                  }`}
                                >
                                  {beforeTrunkLean !== null && afterTrunkLean !== null
                                    ? `${afterTrunkLean <= beforeTrunkLean ? "-" : "+"}${Math.abs(
                                        afterTrunkLean - beforeTrunkLean
                                      ).toFixed(1)} deg`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Knee collapse</span>
                                <span
                                  className={`font-medium ${
                                    beforeKneeValgus !== null &&
                                    afterKneeValgus !== null &&
                                    afterKneeValgus <= beforeKneeValgus
                                      ? "text-green-600 dark:text-green-300"
                                      : "text-red-600 dark:text-red-300"
                                  }`}
                                >
                                  {beforeKneeValgus !== null && afterKneeValgus !== null
                                    ? `${afterKneeValgus <= beforeKneeValgus ? "-" : "+"}${Math.abs(
                                        afterKneeValgus - beforeKneeValgus
                                      ).toFixed(1)} deg`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="pt-1 border-t text-[10px] text-muted-foreground">
                                Negative lean/collapse delta means improved control.
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Joint arrows compare where posture is shifting: trunk arrow highlights forward lean,
                                knee arrows highlight inward collapse compensation.
                              </div>
                            </div>
                            <div className="rounded-lg border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                              <div className="font-medium text-foreground mb-1">How to read</div>
                              <div>Greener, straighter posture = better form control.</div>
                              <div className="mt-1">Leaning trunk / knee collapse is visualized as lower quality.</div>
                              <div className="mt-1">Arrow direction shows where compensation is moving frame-to-frame.</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        {formHistoryForView.map((point) => {
                          const safeScore = Math.max(0, Math.min(100, point.formScore ?? 0));
                          const scoreColor =
                            safeScore >= 80
                              ? "bg-green-500"
                              : safeScore >= 65
                              ? "bg-amber-500"
                              : "bg-red-500";
                          return (
                            <div
                              key={point.id}
                              className="rounded-lg border bg-background/90 p-3 space-y-1.5 relative overflow-hidden hover:border-primary/40 transition-colors"
                            >
                              <div className={`absolute left-0 top-0 h-full w-1.5 ${scoreColor}`} />
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-medium pl-2">
                                  {new Date(point.sessionAt).toLocaleDateString()} - {point.exerciseName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Pain {point.pain ?? "-"} | Effort {point.effort ?? "-"}
                                </div>
                              </div>
                              <div className="h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden ml-2">
                                <div
                                  className={`h-full ${scoreColor}`}
                                  style={{ width: `${Math.max(6, safeScore)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2 pl-2">
                                <div className="text-[11px] text-muted-foreground">
                                  Form score: {point.formScore ?? "N/A"}
                                </div>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {point.flags.length === 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                                      no correction flags
                                    </span>
                                  )}
                                  {point.flags.map((flag) => (
                                    <span
                                      key={`${point.id}-${flag}`}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                                    >
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exercise Recommendations</CardTitle>
              <CardDescription>
                See and manage exercise-related recommendations tied to this plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {!selectedPlanId && (
                    <div className="text-sm text-muted-foreground">
                      Select a plan in Exercise Tracker to manage recommendations.
                    </div>
                  )}

                  {selectedPlanId && (
                    <>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-3 xl:col-span-1">
                        <div className="text-sm font-semibold">
                          Add Recommendation To Selected Plan
                        </div>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          placeholder="Recommendation title"
                          value={newTrackerRecTitle}
                          onChange={(e) => setNewTrackerRecTitle(e.target.value)}
                        />
                        <textarea
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[72px]"
                          placeholder="What should change and why"
                          value={newTrackerRecBody}
                          onChange={(e) => setNewTrackerRecBody(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddTrackerRecommendation}
                          disabled={!newTrackerRecTitle.trim()}
                        >
                          Save recommendation
                        </Button>
                        </div>

                        <div className="space-y-2 xl:col-span-2">
                          <div className="text-sm font-semibold">Recommendation History</div>
                          {recommendationsForView.length === 0 && (
                            <div className="text-sm text-muted-foreground rounded-lg border p-4 bg-muted/20">
                              No recommendations yet for this selected plan.
                            </div>
                          )}
                          {recommendationsForView.map((rec) => (
                            <div
                              key={rec.id}
                              className="border rounded-lg p-3 bg-muted/40 flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-center">
                                <div className="font-medium">{rec.title}</div>
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                  {rec.recommendation_type}
                                </span>
                              </div>
                              {rec.body && (
                                <div className="text-sm text-muted-foreground whitespace-pre-line">
                                  {rec.body}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground flex justify-between mt-1">
                                <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                                <span className="capitalize">{rec.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
