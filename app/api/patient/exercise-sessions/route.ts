import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { exercise_plan_id, exercise_plan_item_id, exercise_template_id, started_at, completed_at, total_sets_completed, total_reps_completed, average_pain_score, average_effort, notes, form_feedback } =
    body;

  const { data: session, error } = await db
    .from("exercise_sessions")
    .insert({
      patient_id: user.id,
      exercise_plan_id,
      exercise_plan_item_id,
      exercise_template_id,
      started_at,
      completed_at,
      total_sets_completed,
      total_reps_completed,
      average_pain_score,
      average_effort,
      notes,
    })
    .select("*")
    .single();

  if (error || !session) {
    return NextResponse.json({ error: error?.message ?? "Failed to create session" }, { status: 400 });
  }

  if (form_feedback) {
    await db.from("exercise_form_feedback").insert({
      exercise_session_id: session.id,
      patient_id: user.id,
      raw_metrics: form_feedback.raw_metrics ?? null,
      form_score: form_feedback.form_score ?? null,
      flags: form_feedback.flags ?? null,
      comments: form_feedback.comments ?? null,
    });
  }

  return NextResponse.json({ session }, { status: 201 });
}

