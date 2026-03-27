import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  type GameAction,
  patientCountToLevel,
  ACHIEVEMENTS,
  getAchievementByKey,
} from "@/lib/gamification";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = (body.action as GameAction) ?? "patient_added";

    const patientCount = await getPatientCount(supabase, user.id);
    const recoveredCount = await getRecoveredCount(supabase, user.id);

    // Fetch existing achievements
    const { data: existingAchievements } = await supabase
      .from("user_achievements" as "user_achievements")
      .select("achievement_key")
      .eq("user_id", user.id);

    const unlockedKeys = new Set(
      (existingAchievements ?? []).map((a: { achievement_key: string }) => a.achievement_key)
    );
    const newAchievements: { key: string; name: string; description: string; icon: string }[] = [];

    // Check patient-count achievements (on patient_added)
    if (action === "patient_added") {
      for (const def of ACHIEVEMENTS) {
        if (def.patientThreshold != null && patientCount >= def.patientThreshold && !unlockedKeys.has(def.key)) {
          await supabase.from("user_achievements" as "user_achievements").insert({
            user_id: user.id,
            achievement_key: def.key,
          } as never);
          unlockedKeys.add(def.key);
          newAchievements.push({ key: def.key, name: def.name, description: def.description, icon: def.icon });
        }
      }
    }

    // Check recovery achievements (on milestone_completed or patient_added)
    if (action === "milestone_completed" || action === "patient_added") {
      for (const def of ACHIEVEMENTS) {
        if (def.recoveredThreshold != null && recoveredCount >= def.recoveredThreshold && !unlockedKeys.has(def.key)) {
          await supabase.from("user_achievements" as "user_achievements").insert({
            user_id: user.id,
            achievement_key: def.key,
          } as never);
          unlockedKeys.add(def.key);
          newAchievements.push({ key: def.key, name: def.name, description: def.description, icon: def.icon });
        }
      }
    }

    if (action !== "patient_added" && action !== "milestone_completed") {
      return NextResponse.json({
        xpAwarded: 0,
        patientCount,
        recoveredCount,
        level: patientCountToLevel(patientCount),
        streak: 0,
        newAchievements: [],
      });
    }

    return NextResponse.json({
      xpAwarded: 0,
      patientCount,
      recoveredCount,
      totalXp: patientCount,
      level: patientCountToLevel(patientCount),
      streak: 0,
      newAchievements,
    });
  } catch (err) {
    console.error("Gamification award error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

async function getPatientCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  therapistId: string
): Promise<number> {
  const { data } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("therapist_id", therapistId);
  return new Set((data ?? []).map((r: { patient_id: string }) => r.patient_id)).size;
}

async function getRecoveredCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  therapistId: string
): Promise<number> {
  const { data } = await supabase
    .from("recovery_milestones")
    .select("patient_id")
    .eq("therapist_id", therapistId)
    .eq("category", "discharge")
    .eq("status", "completed");
  return new Set((data ?? []).map((r: { patient_id: string }) => r.patient_id)).size;
}
