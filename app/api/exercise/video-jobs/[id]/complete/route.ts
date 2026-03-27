import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const webhookSecret = process.env.EXERCISE_VIDEO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }
  const providedSecret = request.headers.get("x-video-webhook-secret");
  if (!providedSecret || providedSecret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const status = body?.status as "succeeded" | "failed" | undefined;
  const videoUrl = (body?.video_url as string | undefined)?.trim() || null;
  const providerJobId = (body?.provider_job_id as string | undefined)?.trim() || null;
  const errorMessage = (body?.error_message as string | undefined)?.trim() || null;

  if (!status || (status === "succeeded" && !videoUrl)) {
    return NextResponse.json(
      { error: "status is required; succeeded status requires video_url" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const db = supabase as any;

  const { data: updatedJob, error: updateError } = await db
    .from("exercise_video_jobs")
    .update({
      status,
      video_url: videoUrl,
      provider_job_id: providerJobId,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, exercise_template_id, status, video_url")
    .single();

  if (updateError || !updatedJob) {
    return NextResponse.json({ error: updateError?.message ?? "Job update failed" }, { status: 400 });
  }

  if (status === "succeeded" && videoUrl) {
    await db
      .from("exercise_templates")
      .update({ video_url: videoUrl })
      .eq("id", updatedJob.exercise_template_id);
  }

  return NextResponse.json({ job: updatedJob });
}
