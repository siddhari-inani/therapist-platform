import { NextRequest, NextResponse } from "next/server";
import { runAppointmentReminders } from "@/lib/reminders";

/**
 * Cron endpoint: runs appointment reminders (email + optional SMS).
 * Call this on a schedule (e.g. every hour) via Vercel Cron or an external cron service.
 * Protected by CRON_SECRET so only your cron job can trigger it.
 */
export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const headerSecret = request.headers.get("x-cron-secret") ?? bearer;
    if (headerSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { ok, results, error } = await runAppointmentReminders();
    if (!ok) {
      return NextResponse.json(
        { error: error ?? "Reminder job failed", results: [] },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      remindersSent: results.length,
      results,
    });
  } catch (err) {
    console.error("cron/reminders error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
        results: [],
      },
      { status: 500 }
    );
  }
}
