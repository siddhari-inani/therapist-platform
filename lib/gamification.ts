/**
 * Gamification: Patient-focused progress for the therapist platform.
 * Progress is driven by number of patients (distinct patients with appointments).
 */

export type GameAction =
  | "patient_added"
  | "milestone_completed"  // triggers recovery achievement check
  | "appointment_created"
  | "soap_finalized"
  | "daily_login";

/** Patients required per level. Level 1 = 0–4, Level 2 = 5–9, etc. */
export const PATIENTS_PER_LEVEL = 5;

export function patientCountToLevel(patientCount: number): number {
  if (patientCount <= 0) return 1;
  return Math.floor(patientCount / PATIENTS_PER_LEVEL) + 1;
}

export function patientProgressInLevel(
  patientCount: number
): { current: number; required: number; percent: number } {
  const level = patientCountToLevel(patientCount);
  const patientsInLevel = patientCount % PATIENTS_PER_LEVEL; // 0–4 within current level
  const required = PATIENTS_PER_LEVEL;
  const percent = required <= 0 ? 100 : Math.min(100, (patientsInLevel / required) * 100);
  return {
    current: patientsInLevel,
    required,
    percent,
  };
}

/** @deprecated Use patientCountToLevel. Kept for API compatibility. */
export function xpToLevel(totalXp: number): number {
  return patientCountToLevel(totalXp);
}

/** @deprecated Use patientProgressInLevel. Kept for API compatibility. */
export function xpProgressInLevel(totalXp: number) {
  return patientProgressInLevel(totalXp);
}

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  patientThreshold?: number;
  recoveredThreshold?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_patient", name: "First Patient", description: "Add your first patient", icon: "👤", patientThreshold: 1 },
  { key: "patients_5", name: "Getting Started", description: "Add 5 patients", icon: "👥", patientThreshold: 5 },
  { key: "patients_10", name: "Growing Practice", description: "Add 10 patients", icon: "🏥", patientThreshold: 10 },
  { key: "patients_25", name: "Full Roster", description: "Add 25 patients", icon: "🌟", patientThreshold: 25 },
  { key: "patients_50", name: "Expanding Practice", description: "Add 50 patients", icon: "🏆", patientThreshold: 50 },
  { key: "patients_100", name: "Century Club", description: "Add 100 patients", icon: "💯", patientThreshold: 100 },
  { key: "first_recovery", name: "First Recovery", description: "First patient fully recovered & discharged", icon: "🎉", recoveredThreshold: 1 },
  { key: "recovered_5", name: "Making an Impact", description: "5 patients fully recovered", icon: "💪", recoveredThreshold: 5 },
  { key: "recovered_10", name: "Healing Hands", description: "10 patients fully recovered", icon: "🩺", recoveredThreshold: 10 },
  { key: "recovered_25", name: "Transformation Leader", description: "25 patients fully recovered", icon: "✨", recoveredThreshold: 25 },
  { key: "recovered_50", name: "Life Changer", description: "50 patients fully recovered", icon: "🌟", recoveredThreshold: 50 },
];

export function getAchievementByKey(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

export interface UserProgress {
  patient_count: number;
  level: number;
}

export interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
}
