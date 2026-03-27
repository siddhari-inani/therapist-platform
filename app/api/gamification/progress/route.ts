import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patientCountToLevel, patientProgressInLevel } from "@/lib/gamification";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count distinct patients (patients this therapist has appointments with)
    const { data: appointmentRows } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("therapist_id", user.id);

    const patientCount = new Set(
      (appointmentRows ?? []).map((r: { patient_id: string }) => r.patient_id)
    ).size;

    // Count patients with completed "discharge" milestone (fully recovered)
    const { data: dischargeMilestones } = await supabase
      .from("recovery_milestones")
      .select("patient_id")
      .eq("therapist_id", user.id)
      .eq("category", "discharge")
      .eq("status", "completed");

    const recoveredCount = new Set(
      (dischargeMilestones ?? []).map((r: { patient_id: string }) => r.patient_id)
    ).size;

    const level = patientCountToLevel(patientCount);
    const progressInLevel = patientProgressInLevel(patientCount);

    const { data: achievements } = await supabase
      .from("user_achievements" as "user_achievements")
      .select("achievement_key, unlocked_at")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false });

    return NextResponse.json({
      patientCount,
      recoveredCount,
      recoveryRate: patientCount > 0 ? Math.round((recoveredCount / patientCount) * 100) : 0,
      totalXp: patientCount,
      level,
      currentStreakDays: 0,
      lastActivityDate: null,
      progressInLevel,
      achievements: (achievements ?? []) as { achievement_key: string; unlocked_at: string }[],
    });
  } catch (err) {
    console.error("Gamification progress fetch error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
