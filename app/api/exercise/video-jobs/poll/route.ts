import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const pollerSecret = process.env.EXERCISE_VIDEO_POLLER_SECRET;
  if (!pollerSecret) {
    return NextResponse.json({ error: "Poller secret not configured" }, { status: 500 });
  }
  const providedSecret = request.headers.get("x-video-poller-secret");
  if (!providedSecret || providedSecret !== pollerSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const db = supabase as any;

  // Poller finalization: if a job is already marked succeeded with a URL,
  // ensure the corresponding template has the same persisted video_url.
  const { data: succeededJobs, error } = await db
    .from("exercise_video_jobs")
    .select("id, exercise_template_id, status, video_url")
    .eq("status", "succeeded")
    .not("video_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let updatedTemplates = 0;
  for (const job of succeededJobs ?? []) {
    const { error: templateUpdateError } = await db
      .from("exercise_templates")
      .update({ video_url: job.video_url })
      .eq("id", job.exercise_template_id);
    if (!templateUpdateError) updatedTemplates += 1;
  }

  return NextResponse.json({
    checkedJobs: succeededJobs?.length ?? 0,
    updatedTemplates,
  });
}
