import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CLAMSHELL_PLAN_ITEM,
  CLAMSHELL_TEMPLATE,
} from "@/lib/exercise/clamshell-quick-add";

type UserRole = "therapist" | "admin" | "patient";
type ExerciseTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  created_by?: string | null;
  video_url?: string | null;
};
type ExercisePlanRow = {
  id: string;
  title: string;
  description: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
};
type ExercisePlanItemRow = {
  id: string;
  exercise_plan_id?: string;
  sequence_order: number;
  exercise_template_id: string;
  sets: number | null;
  reps: number | null;
  hold_seconds?: number | null;
  rest_seconds?: number | null;
  frequency_per_week?: number | null;
  days_of_week?: string[] | null;
  notes: string | null;
};

async function userCanManagePatient(db: any, userId: string, role: UserRole, patientId: string) {
  if (role === "admin") return true;

  const { data: relationship } = await db
    .from("patient_therapists")
    .select("id")
    .eq("patient_id", patientId)
    .eq("therapist_id", userId)
    .eq("relationship_status", "active")
    .maybeSingle();

  if (relationship) return true;

  const { data: appointment } = await db
    .from("appointments")
    .select("id")
    .eq("patient_id", patientId)
    .eq("therapist_id", userId)
    .limit(1)
    .maybeSingle();

  return Boolean(appointment);
}

async function userCanReadPatient(authDb: any, patientId: string) {
  const { data } = await authDb
    .from("profiles")
    .select("id")
    .eq("id", patientId)
    .eq("role", "patient")
    .maybeSingle();

  return Boolean(data);
}

function normalizeTemplate(template: ExerciseTemplateRow) {
  return {
    ...CLAMSHELL_TEMPLATE,
    ...template,
    created_by: template.created_by ?? null,
    video_url: template.video_url ?? null,
  };
}

function normalizePlan(plan: ExercisePlanRow) {
  return {
    ...plan,
    start_date: plan.start_date ?? null,
    end_date: plan.end_date ?? null,
  };
}

function normalizePlanItem(item: ExercisePlanItemRow, planId: string, exerciseName = CLAMSHELL_TEMPLATE.name) {
  return {
    ...item,
    exercise_plan_id: item.exercise_plan_id ?? planId,
    hold_seconds: item.hold_seconds ?? null,
    rest_seconds: item.rest_seconds ?? null,
    frequency_per_week: item.frequency_per_week ?? null,
    days_of_week: item.days_of_week ?? null,
    exercise_templates: { name: exerciseName },
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const authDb = supabase as any;
  const {
    data: { user },
  } = await authDb.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId } = await request.json();
  if (!patientId || typeof patientId !== "string") {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  let db: any;
  try {
    db = createServiceClient() as any;
  } catch {
    return NextResponse.json(
      { error: "Exercise plan updates are not configured for this environment." },
      { status: 500 }
    );
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;
  if (role !== "therapist" && role !== "admin") {
    return NextResponse.json({ error: "Only therapists can update exercise plans." }, { status: 403 });
  }

  const { data: patient } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", patientId)
    .eq("role", "patient")
    .maybeSingle();

  if (!patient) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

  const allowed =
    (await userCanReadPatient(authDb, patientId)) ||
    (await userCanManagePatient(db, user.id, role, patientId));
  if (!allowed) return NextResponse.json({ error: "You do not have access to this patient." }, { status: 403 });

  const templateColumns = "id, name, description, created_by";
  const { data: existingTemplates } = await db
    .from("exercise_templates")
    .select(templateColumns)
    .ilike("name", "clamshell%")
    .order("name", { ascending: true })
    .limit(5);

  let clamshellTemplate =
    existingTemplates?.find(
      (template: { name: string }) => template.name.toLowerCase() === CLAMSHELL_TEMPLATE.name.toLowerCase()
    ) ||
    existingTemplates?.[0] ||
    null;

  if (!clamshellTemplate) {
    const { data: insertedTemplate, error: templateError } = await db
      .from("exercise_templates")
      .insert({
        name: CLAMSHELL_TEMPLATE.name,
        description: CLAMSHELL_TEMPLATE.description,
        created_by: user.id,
      })
      .select(templateColumns)
      .single();

    if (templateError) {
      return NextResponse.json({ error: templateError.message }, { status: 400 });
    }

    clamshellTemplate = insertedTemplate;
  }

  const planColumns = "id, title, description, is_active, created_at";
  const { data: activePlans } = await db
    .from("exercise_plans")
    .select(planColumns)
    .eq("patient_id", patientId)
    .eq("therapist_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  let targetPlan = activePlans?.[0] || null;
  if (!targetPlan) {
    const { data: insertedPlan, error: planError } = await db
      .from("exercise_plans")
      .insert({
        patient_id: patientId,
        therapist_id: user.id,
        title: "Hip Strength Plan",
        description: "Quick-start plan for hip control and knee alignment.",
        is_active: true,
      })
      .select(planColumns)
      .single();

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 400 });
    }

    targetPlan = insertedPlan;
  }

  const itemColumns = "id, sequence_order, exercise_template_id, sets, reps, notes";
  const { data: currentItems } = await db
    .from("exercise_plan_items")
    .select(itemColumns)
    .eq("exercise_plan_id", targetPlan.id)
    .order("sequence_order", { ascending: true });

  const planItems = currentItems || [];
  let clamshellItem =
    planItems.find((item: { exercise_template_id: string }) => item.exercise_template_id === clamshellTemplate.id) ||
    null;

  if (!clamshellItem) {
    const nextOrder =
      Math.max(0, ...planItems.map((item: { sequence_order: number | null }) => item.sequence_order || 0)) + 1;
    const { data: insertedItem, error: itemError } = await db
      .from("exercise_plan_items")
      .insert({
        exercise_plan_id: targetPlan.id,
        exercise_template_id: clamshellTemplate.id,
        sequence_order: nextOrder,
        sets: CLAMSHELL_PLAN_ITEM.sets,
        reps: CLAMSHELL_PLAN_ITEM.reps,
        notes: CLAMSHELL_PLAN_ITEM.notes,
      })
      .select(itemColumns)
      .single();

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 400 });
    }

    clamshellItem = insertedItem;
  }

  return NextResponse.json({
    plan: normalizePlan(targetPlan),
    template: normalizeTemplate(clamshellTemplate),
    item: normalizePlanItem(clamshellItem, targetPlan.id, clamshellTemplate.name),
  });
}
