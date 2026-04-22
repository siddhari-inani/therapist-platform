"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile, Appointment, MedicalRecord, RecoveryMilestone } from "@/types/database.types";
import { useDemoMode } from "@/contexts/demo-context";
import {
  DEMO_APPOINTMENTS,
  DEMO_EXERCISE_PLAN_ITEMS,
  DEMO_EXERCISE_PLANS,
  DEMO_EXERCISE_RECOMMENDATIONS,
  DEMO_EXERCISE_SESSIONS,
  DEMO_EXERCISE_TEMPLATES,
  DEMO_MEDICAL_RECORDS,
  DEMO_MILESTONES,
  DEMO_PATIENTS,
  DEMO_THERAPIST_ID,
  getDemoDashboardStats,
} from "@/lib/demo-data";

interface Message {
  sender: "user" | "assistant";
  text: string;
  isHTML?: boolean;
}

type PatientContext = {
  id: string;
  name: string;
};

type SummaryVerbosity = "summary" | "detailed";

interface PatientDetail {
  patient: Profile;
  appointments: Appointment[];
  records: MedicalRecord[];
  milestones: RecoveryMilestone[];
  exercisePlans: ExercisePlanLite[];
  exerciseItems: ExercisePlanItemLite[];
  exerciseRecommendations: ExerciseRecommendationLite[];
  exerciseSessions: ExerciseSessionLite[];
}

type ExercisePlanLite = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

type ExercisePlanItemLite = {
  id: string;
  exercise_plan_id: string;
  sequence_order: number;
  sets: number | null;
  reps: number | null;
  hold_seconds: number | null;
  frequency_per_week: number | null;
  days_of_week: string[] | null;
  notes: string | null;
  exercise_templates: { name: string } | null;
};

type ExerciseRecommendationLite = {
  id: string;
  exercise_plan_id: string | null;
  title: string;
  body: string | null;
  recommendation_type: string;
  status: string;
  created_at: string;
};

type ExerciseSessionLite = {
  id: string;
  exercise_plan_id: string | null;
  exercise_template_id: string | null;
  started_at: string;
  average_pain_score: number | null;
  average_effort: number | null;
  total_sets_completed: number | null;
  total_reps_completed: number | null;
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastPatientContext, setLastPatientContext] = useState<PatientContext | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addWelcomeMessage();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addWelcomeMessage = () => {
    const welcome: Message = {
      sender: "assistant",
      text: `Hi! I'm Clara, your AI assistant for Revora Health. What can I help you with today?`,
    };
    setMessages([welcome]);
  };

  const addMessage = (sender: "user" | "assistant", text: string, isHTML = false) => {
    setMessages((prev) => [...prev, { sender, text, isHTML }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message immediately
    addMessage("user", userMessage);
    
    // Get current messages state for conversation history (including the one we just added)
    const currentMessagesState = [...messages, { sender: "user" as const, text: userMessage }];
    
    setIsTyping(true);
    try {
      const response = await processMessage(userMessage);
      addMessage("assistant", response.text, response.isHTML);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      addMessage("assistant", "Sorry, I encountered an error. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const processMessage = async (message: string): Promise<{ text: string; isHTML?: boolean }> => {
    const lowerMessage = message.toLowerCase();

    // Get current user (or use demo therapist identity)
    let effectiveUserId = DEMO_THERAPIST_ID;
    if (!isDemo) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {
          text: "Please log in to use the AI assistant.",
        };
      }
      effectiveUserId = user.id;
    }

    if (!effectiveUserId) {
      return {
        text: "Please log in to use the AI assistant.",
      };
    }

    // Intent detection (specific intents first)
    if (
      matchesIntent(lowerMessage, ["stats", "statistics", "dashboard", "overview"]) &&
      (lowerMessage.includes("dashboard") || lowerMessage.includes("practice") || lowerMessage.includes("statistic"))
    ) {
      return await handleStats();
    }
    if (
      matchesIntent(lowerMessage, [
        "summarize",
        "summary",
        "status",
        "overview",
        "details",
        "full details",
        "how is",
        "progress",
        "how's",
        "how are they",
      ])
    ) {
      return await handlePatientSummary(message, effectiveUserId);
    } else if (matchesIntent(lowerMessage, ["milestone", "milestones"])) {
      return await handleMilestones(message, effectiveUserId);
    } else if (
      matchesIntent(lowerMessage, ["soap", "soap note", "soap notes", "notes", "charting"]) &&
      (lowerMessage.includes("summarize") || lowerMessage.includes("summary") || lowerMessage.includes("for"))
    ) {
      return await handleSOAPSummary(message, effectiveUserId);
    } else if (matchesIntent(lowerMessage, ["patient", "patients", "show patients", "list patients"])) {
      return await handlePatients(effectiveUserId);
    } else if (
      matchesIntent(lowerMessage, [
        "appointment",
        "appointments",
        "schedule",
        "calendar",
        "today",
        "upcoming",
      ])
    ) {
      return await handleAppointments(message);
    } else if (matchesIntent(lowerMessage, ["navigate", "go to", "open", "show", "take me"])) {
      return handleNavigation(message);
    } else if (matchesIntent(lowerMessage, ["soap", "note", "charting", "create note"])) {
      return handleCharting();
    } else if (matchesIntent(lowerMessage, ["message", "messages", "chat"])) {
      return handleMessages();
    } else if (matchesIntent(lowerMessage, ["help", "what can you", "how do i"])) {
      return handleHelp();
    } else if (matchesIntent(lowerMessage, ["stats", "statistics", "dashboard", "overview"])) {
      return await handleStats();
    } else {
      return await handleGeneral(message);
    }
  };

  const matchesIntent = (message: string, keywords: string[]): boolean => {
    return keywords.some((keyword) => message.includes(keyword));
  };

  const isLikelyContextFollowUp = (message: string): boolean => {
    const lower = message.toLowerCase();
    return (
      /\b(they|them|their|that patient|this patient|same patient|him|her|his)\b/.test(lower) ||
      /^(and|also|what about|how about|now|next)\b/.test(lower)
    );
  };

  const inferSummaryVerbosity = (message: string): SummaryVerbosity => {
    const lower = message.toLowerCase();
    const wantsDetailed =
      /\b(full details?|all details?|everything|deep dive|complete details?|entire history|all info)\b/.test(
        lower
      ) ||
      (lower.includes("details") && !lower.includes("summar"));
    return wantsDetailed ? "detailed" : "summary";
  };

  /** Extract patient name/query from phrases like "summarize John", "how is Sarah doing?", "milestones for John", "John's summary", "SOAP notes for John" */
  const extractPatientQuery = (message: string): string | null => {
    const m = message.trim();
    const patterns = [
      /([a-zA-Z\s]+?)'s\s+(?:summary|status|overview|progress|milestones?|soap|notes?)/i,
      /(?:summarize|summary|status|overview|progress|milestones?|soap|notes?)\s+(?:of|for)?\s*([^.?!]+)/i,
      /(?:details?|full details?)\s+(?:of|for)?\s*([^.?!]+)/i,
      /how(?:'s|\s+is)\s+([^.?!]+?)(?:\s+doing)?[.?!]?$/i,
      /(?:patient|pt)\s+([a-zA-Z\s]+?)(?:\s+summary|\s+status|'s)?[.?!]?$/i,
      /(?:soap|notes?|charting).*?(?:for|of|about)\s+([^.?!]+)/i,
    ];
    for (const re of patterns) {
      const match = m.match(re);
      if (match && match[1]) {
        const q = match[1].trim();
        // Filter out common words that aren't names
        if (q.length >= 2 && !/^(all|everyone|everybody|the|patient|patients)$/i.test(q)) {
          // Remove trailing words like "notes", "summary", etc.
          const cleaned = q.replace(/\s+(?:notes?|summary|status|soap|charting)$/i, "").trim();
          if (cleaned.length >= 2) return cleaned;
        }
      }
    }
    return null;
  };

  const findPatientByQuery = async (query: string): Promise<Profile | null> => {
    if (isDemo) {
      const q = query.toLowerCase();
      const match = DEMO_PATIENTS.find(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          (p.full_name && q.split(/\s+/).every((part) => p.full_name!.toLowerCase().includes(part)))
      );
      return match || null;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "patient")
      .order("full_name", { ascending: true });
    const list = (data || []) as Profile[];
    const q = query.toLowerCase();
    const match = list.find(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        (p.full_name && q.split(/\s+/).every((part) => p.full_name!.toLowerCase().includes(part)))
    );
    return match || null;
  };

  const findPatientById = async (patientId: string): Promise<Profile | null> => {
    if (isDemo) {
      return DEMO_PATIENTS.find((p) => p.id === patientId) || null;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", patientId)
      .eq("role", "patient")
      .single();
    if (error || !data) return null;
    return data as Profile;
  };

  const resolvePatientFromMessage = async (
    message: string
  ): Promise<{ patient: Profile | null; usedContext: boolean; explicitQuery: string | null }> => {
    const explicitQuery = extractPatientQuery(message);
    if (explicitQuery) {
      const patient = await findPatientByQuery(explicitQuery);
      return { patient, usedContext: false, explicitQuery };
    }

    if (lastPatientContext && isLikelyContextFollowUp(message)) {
      const patient = await findPatientById(lastPatientContext.id);
      if (patient) {
        return { patient, usedContext: true, explicitQuery: null };
      }
    }

    return { patient: null, usedContext: false, explicitQuery: null };
  };

  const fetchPatientDetail = async (
    patientId: string,
    therapistId: string
  ): Promise<PatientDetail | null> => {
    if (isDemo) {
      const patientData = DEMO_PATIENTS.find((p) => p.id === patientId) || null;
      if (!patientData) return null;

      const demoAppointments = DEMO_APPOINTMENTS.filter(
        (a) => a.patient_id === patientId && a.therapist_id === therapistId
      ) as Appointment[];
      const demoRecords = DEMO_MEDICAL_RECORDS.filter(
        (r) => r.patient_id === patientId && r.therapist_id === therapistId
      ) as MedicalRecord[];
      const demoMilestones = DEMO_MILESTONES.filter(
        (m) => m.patient_id === patientId && m.therapist_id === therapistId
      ) as RecoveryMilestone[];

      const exercisePlans = DEMO_EXERCISE_PLANS.filter(
        (p) => p.patient_id === patientId && p.therapist_id === therapistId
      )
        .map((p) => ({ ...p }))
        .sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1)) as ExercisePlanLite[];
      const planIds = exercisePlans.map((p) => p.id);

      const exerciseItems = DEMO_EXERCISE_PLAN_ITEMS.filter((i) => planIds.includes(i.exercise_plan_id)).map(
        (item) => ({
          ...item,
          exercise_templates: {
            name:
              DEMO_EXERCISE_TEMPLATES.find((t) => t.id === item.exercise_template_id)?.name || "Exercise",
          },
        })
      ) as ExercisePlanItemLite[];

      const exerciseRecommendations = DEMO_EXERCISE_RECOMMENDATIONS.filter(
        (r) => r.patient_id === patientId && r.therapist_id === therapistId
      )
        .map((r) => ({ ...r }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as ExerciseRecommendationLite[];

      const itemTemplateIdByItemId = new Map(exerciseItems.map((i) => [i.id, i.exercise_template_id]));
      const exerciseSessions = DEMO_EXERCISE_SESSIONS.filter(
        (s) => s.patient_id === patientId && (!!s.exercise_plan_id ? planIds.includes(s.exercise_plan_id) : true)
      )
        .map((s) => ({
          ...s,
          exercise_template_id:
            itemTemplateIdByItemId.get(s.exercise_plan_item_id ?? "") ?? null,
        }))
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()) as ExerciseSessionLite[];

      return {
        patient: patientData,
        appointments: demoAppointments,
        records: demoRecords,
        milestones: demoMilestones,
        exercisePlans,
        exerciseItems,
        exerciseRecommendations,
        exerciseSessions,
      };
    }

    const { data: patientData, error: patientError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", patientId)
      .eq("role", "patient")
      .single();

    if (patientError || !patientData) return null;

    const [aptRes, recRes, milRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("start_time", { ascending: false })
        .limit(20),
      supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("recovery_milestones")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: true }),
    ]);

    // Exercise tables are not fully typed in generated DB types yet.
    const sbAny = supabase as any;
    const { data: planRows } = await sbAny
      .from("exercise_plans")
      .select("id, title, description, start_date, end_date, is_active, created_at")
      .eq("patient_id", patientId)
      .eq("therapist_id", therapistId)
      .order("created_at", { ascending: false })
      .limit(6);

    const exercisePlans = ((planRows || []) as ExercisePlanLite[]).sort((a, b) =>
      a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1
    );
    const planIds = exercisePlans.map((p) => p.id);

    let exerciseItems: ExercisePlanItemLite[] = [];
    let exerciseRecommendations: ExerciseRecommendationLite[] = [];
    let exerciseSessions: ExerciseSessionLite[] = [];

    if (planIds.length > 0) {
      const [itemsRes, recsRes, sessionsRes] = await Promise.all([
        sbAny
          .from("exercise_plan_items")
          .select(
            "id, exercise_plan_id, sequence_order, sets, reps, hold_seconds, frequency_per_week, days_of_week, notes, exercise_templates(name)"
          )
          .in("exercise_plan_id", planIds)
          .order("sequence_order", { ascending: true }),
        sbAny
          .from("exercise_recommendations")
          .select("id, exercise_plan_id, title, body, recommendation_type, status, created_at")
          .eq("patient_id", patientId)
          .in("exercise_plan_id", planIds)
          .order("created_at", { ascending: false })
          .limit(20),
        sbAny
          .from("exercise_sessions")
          .select(
            "id, exercise_plan_id, exercise_template_id, started_at, average_pain_score, average_effort, total_sets_completed, total_reps_completed"
          )
          .eq("patient_id", patientId)
          .in("exercise_plan_id", planIds)
          .order("started_at", { ascending: false })
          .limit(20),
      ]);

      exerciseItems = (itemsRes.data || []) as ExercisePlanItemLite[];
      exerciseRecommendations = (recsRes.data || []) as ExerciseRecommendationLite[];
      exerciseSessions = (sessionsRes.data || []) as ExerciseSessionLite[];
    }

    return {
      patient: patientData as Profile,
      appointments: (aptRes.data || []) as Appointment[],
      records: (recRes.data || []) as MedicalRecord[],
      milestones: (milRes.data || []) as RecoveryMilestone[],
      exercisePlans,
      exerciseItems,
      exerciseRecommendations,
      exerciseSessions,
    };
  };

  const formatPatientSummary = (d: PatientDetail, verbosity: SummaryVerbosity = "summary"): string => {
    const {
      patient,
      appointments,
      records,
      milestones,
      exercisePlans,
      exerciseItems,
      exerciseRecommendations,
      exerciseSessions,
    } = d;
    const name = patient.full_name || patient.email || "Patient";
    const upcoming = appointments.filter((a) => new Date(a.start_time) >= new Date());
    const completed = milestones.filter((m) => m.status === "completed").length;
    const totalM = milestones.length;
    const pct = totalM > 0 ? Math.round((completed / totalM) * 100) : 0;
    const currentPhase = milestones.find((m) => m.status === "in_progress" || m.status === "future");
    const draftNotes = records.filter((r) => r.status === "draft").length;
    const lastApt = appointments[0];
    const lastRecord = records[0];
    const activePlan = exercisePlans.find((p) => p.is_active) || exercisePlans[0];
    const itemsForActivePlan = activePlan
      ? exerciseItems.filter((i) => i.exercise_plan_id === activePlan.id)
      : [];
    const sessionsForActivePlan = activePlan
      ? exerciseSessions.filter((s) => s.exercise_plan_id === activePlan.id)
      : [];
    const openExerciseRecs = exerciseRecommendations.filter(
      (r) => !["resolved", "closed", "done"].includes((r.status || "").toLowerCase())
    ).length;
    const avgPain =
      exerciseSessions.length > 0
        ? (
            exerciseSessions.reduce((acc, s) => acc + (s.average_pain_score ?? 0), 0) /
            exerciseSessions.length
          ).toFixed(1)
        : null;
    const avgEffort =
      exerciseSessions.length > 0
        ? (
            exerciseSessions.reduce((acc, s) => acc + (s.average_effort ?? 0), 0) /
            exerciseSessions.length
          ).toFixed(1)
        : null;

    let s = `<strong>${name}</strong>\n\n`;
    s += `• <strong>Status:</strong> ${upcoming.length} upcoming appointment${upcoming.length !== 1 ? "s" : ""}, ${records.length} SOAP note${records.length !== 1 ? "s" : ""}${draftNotes ? ` (${draftNotes} draft)` : ""}\n`;
    if (lastApt) {
      s += `• <strong>Last appointment:</strong> ${new Date(lastApt.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} — ${lastApt.title || lastApt.treatment_type}\n`;
    }
    s += `• <strong>Milestones:</strong> ${completed}/${totalM} completed (${pct}%)`;
    if (currentPhase) s += ` • Current: ${currentPhase.title}`;
    s += `\n`;
    if (milestones.length > 0) {
      s += `\n<strong>Recovery timeline:</strong>\n`;
      milestones.slice(0, 8).forEach((m) => {
        const icon = m.status === "completed" ? "✓" : m.status === "in_progress" ? "◐" : "○";
        const date = m.completed_date
          ? new Date(m.completed_date).toLocaleDateString()
          : m.target_date
          ? `Target ${new Date(m.target_date).toLocaleDateString()}`
          : "";
        s += `  ${icon} ${m.title}${m.progress != null && m.status !== "completed" ? ` (${m.progress}%)` : ""} ${date}\n`;
      });
      if (milestones.length > 8) s += `  … and ${milestones.length - 8} more\n`;
    }
    if (lastRecord?.assessment) {
      s += `\n<strong>Latest assessment:</strong> ${lastRecord.assessment.substring(0, 150)}${lastRecord.assessment.length > 150 ? "…" : ""}\n`;
    }

    if (verbosity === "summary") {
      if (lastRecord?.assessment) {
        s += `• <strong>Latest clinical assessment:</strong> ${lastRecord.assessment.substring(0, 140)}${
          lastRecord.assessment.length > 140 ? "…" : ""
        }\n`;
      }
      if (lastRecord?.plan) {
        s += `• <strong>Current plan:</strong> ${lastRecord.plan.substring(0, 140)}${
          lastRecord.plan.length > 140 ? "…" : ""
        }\n`;
      }
      s += `• <strong>Exercise:</strong> ${
        activePlan ? `${activePlan.title} (${itemsForActivePlan.length} exercises)` : "No active plan"
      } • ${exerciseSessions.length} recent sessions • ${openExerciseRecs} open recs\n`;
      if (sessionsForActivePlan.length > 0) {
        const latestSession = sessionsForActivePlan[0];
        s += `• <strong>Latest session:</strong> ${new Date(latestSession.started_at).toLocaleDateString()} • pain ${
          latestSession.average_pain_score ?? "-"
        } • effort ${latestSession.average_effort ?? "-"}\n`;
      }
      s += `\nAsk "full details for ${name}" if you want complete SOAP + exercise breakdown.`;
      return s;
    }

    if (records.length > 0) {
      s += `\n<strong>Recent SOAP details:</strong>\n`;
      records.slice(0, 3).forEach((r) => {
        const date = new Date(r.created_at || r.updated_at || Date.now()).toLocaleDateString();
        s += `• ${date} (${r.status || "unknown"})\n`;
        if (r.subjective) s += `  S: ${r.subjective.substring(0, 120)}${r.subjective.length > 120 ? "…" : ""}\n`;
        if (r.objective) s += `  O: ${r.objective.substring(0, 120)}${r.objective.length > 120 ? "…" : ""}\n`;
        if (r.assessment) s += `  A: ${r.assessment.substring(0, 120)}${r.assessment.length > 120 ? "…" : ""}\n`;
        if (r.plan) s += `  P: ${r.plan.substring(0, 120)}${r.plan.length > 120 ? "…" : ""}\n`;
      });
    }

    s += `\n<strong>Exercise program:</strong>\n`;
    s += `• <strong>Plans:</strong> ${exercisePlans.length} total${
      activePlan ? ` • Active: ${activePlan.title}` : " • No active plan"
    }\n`;
    s += `• <strong>Plan items:</strong> ${exerciseItems.length}${
      activePlan ? ` (${itemsForActivePlan.length} in active plan)` : ""
    }\n`;
    s += `• <strong>Exercise sessions:</strong> ${exerciseSessions.length}${
      avgPain !== null ? ` • Avg pain ${avgPain}` : ""
    }${avgEffort !== null ? ` • Avg effort ${avgEffort}` : ""}\n`;
    s += `• <strong>Recommendations:</strong> ${exerciseRecommendations.length} total • ${openExerciseRecs} open\n`;

    if (itemsForActivePlan.length > 0) {
      s += `\n<strong>Active plan exercises:</strong>\n`;
      itemsForActivePlan.slice(0, 8).forEach((item) => {
        const dosage =
          item.sets && item.reps
            ? `${item.sets}x${item.reps}`
            : item.hold_seconds
            ? `${item.hold_seconds}s hold`
            : "dosage not set";
        s += `• #${item.sequence_order} ${item.exercise_templates?.name || "Exercise"} — ${dosage}${
          item.frequency_per_week ? ` • ${item.frequency_per_week}x/week` : ""
        }\n`;
      });
      if (itemsForActivePlan.length > 8) s += `  … and ${itemsForActivePlan.length - 8} more\n`;
    }

    if (sessionsForActivePlan.length > 0) {
      s += `\n<strong>Latest exercise sessions:</strong>\n`;
      sessionsForActivePlan.slice(0, 5).forEach((session) => {
        const date = new Date(session.started_at).toLocaleDateString();
        s += `• ${date} — pain ${session.average_pain_score ?? "-"}, effort ${session.average_effort ?? "-"}, sets ${session.total_sets_completed ?? "-"}, reps ${session.total_reps_completed ?? "-"}\n`;
      });
    }

    if (exerciseRecommendations.length > 0) {
      s += `\n<strong>Recent exercise recommendations:</strong>\n`;
      exerciseRecommendations.slice(0, 5).forEach((rec) => {
        s += `• ${rec.title} (${rec.status})${rec.body ? ` — ${rec.body.substring(0, 90)}${rec.body.length > 90 ? "…" : ""}` : ""}\n`;
      });
    }

    return s;
  };

  const handlePatients = async (userId: string) => {
    if (isDemo) {
      router.push("/dashboard/patients");
      const names = DEMO_PATIENTS.slice(0, 15).map((p) => p.full_name || p.email);
      const more = DEMO_PATIENTS.length > 15 ? ` … and ${DEMO_PATIENTS.length - 15} more` : "";
      return {
        text: `You have <strong>${DEMO_PATIENTS.length} patient${DEMO_PATIENTS.length !== 1 ? "s" : ""}</strong>: ${names.join(", ")}${more}. Taking you to the patients page.`,
        isHTML: true,
      };
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "patient")
      .order("full_name", { ascending: true });
    const list = (data || []) as Pick<Profile, "id" | "full_name" | "email">[];
    router.push("/dashboard/patients");
    if (list.length === 0) {
      return { text: "You have no patients yet. Taking you to the patients page to add one." };
    }
    const names = list.slice(0, 15).map((p) => p.full_name || p.email);
    const more = list.length > 15 ? ` … and ${list.length - 15} more` : "";
    return {
      text: `You have <strong>${list.length} patient${list.length !== 1 ? "s" : ""}</strong>: ${names.join(", ")}${more}. Taking you to the patients page.`,
      isHTML: true,
    };
  };

  const handlePatientSummary = async (
    message: string,
    userId: string
  ): Promise<{ text: string; isHTML?: boolean }> => {
    const verbosity = inferSummaryVerbosity(message);
    const { patient, usedContext } = await resolvePatientFromMessage(message);
    if (!patient) {
      const m = message.trim().toLowerCase();
      if (/^(overview|stats|statistics|dashboard)(\s+overview)?$/.test(m)) {
        return await handleStats();
      }
      return {
        text: lastPatientContext
          ? `Who would you like a summary for? You can say "summarize ${lastPatientContext.name}" or use a follow-up like "how are they doing?"`
          : "Who would you like a summary for? Try: \"Summarize [patient name]\" or \"How is [patient name] doing?\"",
      };
    }
    const detail = await fetchPatientDetail(patient.id, userId);
    if (!detail) {
      return { text: "I couldn't load this patient's data. Please try again." };
    }
    setLastPatientContext({
      id: patient.id,
      name: patient.full_name || patient.email || "Patient",
    });
    const summary = formatPatientSummary(detail, verbosity);
    router.push(`/dashboard/patients/${patient.id}`);
    return {
      text:
        (usedContext
          ? `<em>Using previous patient context: ${
              patient.full_name || patient.email || "Patient"
            }</em>\n\n`
          : "") +
        summary +
        `\n<a href="/dashboard/patients/${patient.id}" class="text-primary underline hover:opacity-80">View full profile →</a>`,
      isHTML: true,
    };
  };

  const handleMilestones = async (
    message: string,
    userId: string
  ): Promise<{ text: string; isHTML?: boolean }> => {
    const { patient, usedContext } = await resolvePatientFromMessage(message);
    if (!patient) {
      return {
        text: lastPatientContext
          ? `Which patient's milestones? You can say "milestones for ${lastPatientContext.name}" or "show their milestones".`
          : "Which patient's milestones? Try: \"Milestones for [patient name]\" or \"Summarize [patient name]\" for full status.",
      };
    }
    const detail = await fetchPatientDetail(patient.id, userId);
    if (!detail) {
      return { text: "I couldn't load this patient's data. Please try again." };
    }
    setLastPatientContext({
      id: patient.id,
      name: patient.full_name || patient.email || "Patient",
    });
    const { milestones } = detail;
    const name = patient.full_name || patient.email;
    if (milestones.length === 0) {
      router.push(`/dashboard/patients/${patient.id}`);
      return {
        text: `${name} has no recovery milestones yet. You can add them on their <a href="/dashboard/patients/${patient.id}" class="text-primary underline hover:opacity-80">profile</a>.`,
        isHTML: true,
      };
    }
    const completed = milestones.filter((m) => m.status === "completed").length;
    const pct = Math.round((completed / milestones.length) * 100);
    let s = `<strong>${name} — Recovery milestones</strong> (${completed}/${milestones.length} completed, ${pct}%)\n\n`;
    milestones.forEach((m) => {
      const icon = m.status === "completed" ? "✓" : m.status === "in_progress" ? "◐" : "○";
      const date = m.completed_date
        ? new Date(m.completed_date).toLocaleDateString()
        : m.target_date
        ? `Target: ${new Date(m.target_date).toLocaleDateString()}`
        : "";
      s += `• ${icon} <strong>${m.title}</strong>${m.description ? ` — ${m.description}` : ""}${m.status !== "completed" && m.progress != null ? ` (${m.progress}%)` : ""} ${date}\n`;
    });
    router.push(`/dashboard/patients/${patient.id}`);
    return {
      text:
        (usedContext
          ? `<em>Using previous patient context: ${
              patient.full_name || patient.email || "Patient"
            }</em>\n\n`
          : "") +
        s +
        `\n<a href="/dashboard/patients/${patient.id}" class="text-primary underline hover:opacity-80">View timeline →</a>`,
      isHTML: true,
    };
  };

  const formatSOAPSummary = (records: MedicalRecord[], patientName: string): string => {
    if (records.length === 0) {
      return `${patientName} has no SOAP notes yet.`;
    }

    const finalized = records.filter((r) => r.status === "finalized");
    const drafts = records.filter((r) => r.status === "draft");
    const latest = records[0];

    let s = `<strong>${patientName} — SOAP Notes Summary</strong>\n\n`;
    s += `• <strong>Total notes:</strong> ${records.length} (${finalized.length} finalized, ${drafts.length} draft${drafts.length !== 1 ? "s" : ""})\n\n`;

    if (latest) {
      const date = new Date(latest.created_at || latest.updated_at || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      s += `<strong>Latest Note</strong> (${date}):\n`;
      
      if (latest.subjective) {
        s += `\n<strong>S - Subjective:</strong>\n${latest.subjective.substring(0, 200)}${latest.subjective.length > 200 ? "…" : ""}\n`;
      }
      if (latest.objective) {
        s += `\n<strong>O - Objective:</strong>\n${latest.objective.substring(0, 200)}${latest.objective.length > 200 ? "…" : ""}\n`;
      }
      if (latest.assessment) {
        s += `\n<strong>A - Assessment:</strong>\n${latest.assessment.substring(0, 200)}${latest.assessment.length > 200 ? "…" : ""}\n`;
      }
      if (latest.plan) {
        s += `\n<strong>P - Plan:</strong>\n${latest.plan.substring(0, 200)}${latest.plan.length > 200 ? "…" : ""}\n`;
      }
    }

    if (records.length > 1) {
      s += `\n<strong>Recent Notes Timeline:</strong>\n`;
      records.slice(0, 5).forEach((r, idx) => {
        const date = new Date(r.created_at || r.updated_at || Date.now()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const status = r.status === "finalized" ? "✓" : r.status === "draft" ? "📝" : "✏️";
        s += `  ${status} ${date} — ${r.assessment ? r.assessment.substring(0, 60) + (r.assessment.length > 60 ? "…" : "") : "No assessment"}\n`;
      });
      if (records.length > 5) {
        s += `  … and ${records.length - 5} more\n`;
      }
    }

    return s;
  };

  const handleSOAPSummary = async (
    message: string,
    userId: string
  ): Promise<{ text: string; isHTML?: boolean }> => {
    const { patient, usedContext } = await resolvePatientFromMessage(message);
    if (!patient) {
      return {
        text: lastPatientContext
          ? `Which patient's SOAP notes? You can say "SOAP notes for ${lastPatientContext.name}" or "show their SOAP notes".`
          : "Which patient's SOAP notes? Try: \"Summarize SOAP notes for [patient name]\" or \"SOAP notes for [patient name]\"",
      };
    }

    const detail = await fetchPatientDetail(patient.id, userId);
    if (!detail) {
      return { text: "I couldn't load this patient's data. Please try again." };
    }

    setLastPatientContext({
      id: patient.id,
      name: patient.full_name || patient.email || "Patient",
    });
    const summary = formatSOAPSummary(detail.records, patient.full_name || patient.email || "Patient");
    router.push(`/dashboard/patients/${patient.id}`);
    return {
      text:
        (usedContext
          ? `<em>Using previous patient context: ${
              patient.full_name || patient.email || "Patient"
            }</em>\n\n`
          : "") +
        summary +
        `\n\n<a href="/dashboard/patients/${patient.id}" class="text-primary underline hover:opacity-80">View all notes →</a>`,
      isHTML: true,
    };
  };

  const handleAppointments = async (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("schedule") || lowerMessage.includes("create") || lowerMessage.includes("new")) {
      router.push("/dashboard/calendar");
      return {
        text: "Opening calendar to schedule a new appointment...",
      };
    } else {
      router.push("/dashboard/calendar");
      return {
        text: "Taking you to the calendar to view your appointments...",
      };
    }
  };

  const handleNavigation = (message: string): { text: string; isHTML?: boolean } => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("patient")) {
      router.push("/dashboard/patients");
      return { text: "Taking you to the patients page..." };
    } else if (lowerMessage.includes("calendar") || lowerMessage.includes("appointment")) {
      router.push("/dashboard/calendar");
      return { text: "Taking you to the calendar..." };
    } else if (lowerMessage.includes("charting") || lowerMessage.includes("soap")) {
      router.push("/dashboard/charting");
      return { text: "Taking you to charting..." };
    } else if (lowerMessage.includes("message")) {
      router.push("/dashboard/messages");
      return { text: "Taking you to messages..." };
    } else if (lowerMessage.includes("profile") || lowerMessage.includes("settings")) {
      router.push("/dashboard/profile");
      return { text: "Taking you to your profile..." };
    } else if (lowerMessage.includes("dashboard") || lowerMessage.includes("home")) {
      router.push("/dashboard");
      return { text: "Taking you to the dashboard..." };
    } else {
      return {
        text: "I can take you to: Patients, Calendar, Charting, Messages, Profile, or Dashboard. Where would you like to go?",
      };
    }
  };

  const handleCharting = (): { text: string; isHTML?: boolean } => {
    router.push("/dashboard/charting");
    return {
      text: "Opening charting to create a SOAP note...",
    };
  };

  const handleMessages = (): { text: string; isHTML?: boolean } => {
    router.push("/dashboard/messages");
    return {
      text: "Taking you to messages...",
    };
  };

  const handleHelp = (): { text: string; isHTML?: boolean } => {
    return {
      text: `I'm Clara, and I can help you with:

• <strong>Patients:</strong> "Show me my patients" or "List patients"
• <strong>Patient summary:</strong> "Summarize [name]", "How is [name] doing?", "Full details for [name]"
• <strong>SOAP notes:</strong> "SOAP notes for [name]", "Summarize SOAP notes for [name]"
• <strong>Exercise details:</strong> Included in patient summaries (plans, sessions, recommendations)
• <strong>Milestones:</strong> "Milestones for [name]" — recovery timeline and progress
• <strong>Appointments:</strong> "What appointments do I have today?" or "Schedule appointment"
• <strong>Navigation:</strong> "Go to calendar" or "Take me to patients"
• <strong>Charting:</strong> "Create SOAP note" or "Open charting"
• <strong>Messages:</strong> "Show messages" or "Go to messages"
• <strong>Stats:</strong> "Show dashboard stats" or "What's my overview?"

Just ask me naturally and I'll help!`,
      isHTML: true,
    };
  };

  const handleStats = async (): Promise<{ text: string; isHTML?: boolean }> => {
    try {
      if (isDemo) {
        const stats = getDemoDashboardStats();
        return {
          text: `Here's your practice overview:
• <strong>Today's Appointments:</strong> ${stats.todayAppointments}
• <strong>Active Patients:</strong> ${stats.activePatients}
• <strong>Pending Notes:</strong> ${stats.pendingNotes} draft SOAP notes

Would you like a full summary for a patient? Try "Full details for Surya".`,
          isHTML: true,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { text: "Please log in to view stats." };
      }

      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const endOfToday = new Date(now.setHours(23, 59, 59, 999));

      // Fetch today's appointments
      const { count: todayCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .gte("start_time", startOfToday.toISOString())
        .lte("start_time", endOfToday.toISOString());

      // Fetch active patients
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: recentAppointments } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("therapist_id", user.id)
        .gte("start_time", ninetyDaysAgo.toISOString());

      const uniquePatientIds = new Set((recentAppointments || []).map((apt) => apt.patient_id));

      // Fetch pending notes
      const { count: pendingCount } = await supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .eq("status", "draft");

      return {
        text: `Here's your practice overview:
• <strong>Today's Appointments:</strong> ${todayCount || 0}
• <strong>Active Patients:</strong> ${uniquePatientIds.size} (seen in last 90 days)
• <strong>Pending Notes:</strong> ${pendingCount || 0} draft SOAP notes

Would you like to see more details?`,
        isHTML: true,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return {
        text: "I couldn't fetch your stats right now. Please try again later.",
      };
    }
  };

  const handleGeneral = async (
    message: string
  ): Promise<{ text: string; isHTML?: boolean }> => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      return {
        text:
          "Hello! I'm Clara. You can ask me about your patients, appointments, SOAP notes, or any general physical therapy questions.",
      };
    } else if (lowerMessage.includes("thank")) {
      return {
        text: "You're welcome! Is there anything else I can help you with?",
      };
    }

    // Fallback: ask Gemini PT chat API for an educational answer
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { sender: "user", text: message }],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.message) {
        return {
          text:
            data?.error ||
            "I couldn't get an AI answer right now. Please try again or check your GEMINI_API_KEY.",
        };
      }
      return {
        text: data.message,
      };
    } catch (error) {
      console.error("Clara PT chat error:", error);
      return {
        text:
          "I couldn't reach the AI service. Check your internet connection or GEMINI_API_KEY, then try again.",
      };
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Open Clara"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Chat Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-7rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-primary to-lime-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Clara
                </h3>
                <p className="text-sm text-blue-100 mt-0.5">I can help you navigate and manage your practice</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {msg.isHTML ? (
                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text }} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
                {msg.sender === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything... (e.g., 'Show me my patients')"
                className="flex-1"
                disabled={isTyping}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
