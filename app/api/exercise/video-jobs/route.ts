import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function ensureTherapist(supabase: any, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "therapist" || data?.role === "admin";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await ensureTherapist(supabase, user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const templateId = request.nextUrl.searchParams.get("templateId");
  let query = db
    .from("exercise_video_jobs")
    .select("id, exercise_template_id, status, video_url, error_message, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (templateId) {
    query = query.eq("exercise_template_id", templateId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await ensureTherapist(supabase, user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const exerciseTemplateId = body?.exercise_template_id as string | undefined;
  const prompt = (body?.prompt as string | undefined)?.trim() || null;
  if (!exerciseTemplateId) {
    return NextResponse.json({ error: "exercise_template_id is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("exercise_video_jobs")
    .insert({
      exercise_template_id: exerciseTemplateId,
      requested_by: user.id,
      status: "queued",
      prompt,
      provider: "pending_provider",
    })
    .select("id, exercise_template_id, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ job: data }, { status: 201 });
}
