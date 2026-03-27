"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_EXERCISE_PLANS, DEMO_EXERCISE_PLAN_ITEMS, DEMO_EXERCISE_TEMPLATES, DEMO_PATIENT_IDS } from "@/lib/demo-data";

type ExercisePlan = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
};

type ExerciseItem = {
  id: string;
  sequence_order: number;
  sets: number | null;
  reps: number | null;
  hold_seconds: number | null;
  frequency_per_week: number | null;
  days_of_week: string[] | null;
  notes: string | null;
  exercise_templates: {
    name: string;
  } | null;
};

export default function PatientExercisePage() {
  const supabase = createClient();
  const { isDemo } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [items, setItems] = useState<ExerciseItem[]>([]);

  useEffect(() => {
    fetchExercisePlan();
  }, [isDemo]);

  const fetchExercisePlan = async () => {
    try {
      if (isDemo) {
        const demoPatientId = DEMO_PATIENT_IDS[0];
        const demoPlan = DEMO_EXERCISE_PLANS.find((p) => p.patient_id === demoPatientId) as
          | ExercisePlan
          | undefined;
        setPlan(demoPlan ?? null);
        if (demoPlan) {
          const demoItems = DEMO_EXERCISE_PLAN_ITEMS.filter(
            (i) => i.exercise_plan_id === demoPlan.id
          ).map((item) => ({
            id: item.id,
            sequence_order: item.sequence_order,
            sets: item.sets,
            reps: item.reps,
            hold_seconds: item.hold_seconds,
            frequency_per_week: item.frequency_per_week,
            days_of_week: item.days_of_week as string[] | null,
            notes: item.notes,
            exercise_templates: {
              name:
                DEMO_EXERCISE_TEMPLATES.find((t) => t.id === item.exercise_template_id)?.name ??
                "Exercise",
            },
          }));
          setItems(demoItems);
        } else {
          setItems([]);
        }
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: plans } = await supabase
        .from("exercise_plans")
        .select("*")
        .eq("patient_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      const activePlan = (plans?.[0] as ExercisePlan) ?? null;
      setPlan(activePlan);

      if (activePlan) {
        const { data: planItems } = await supabase
          .from("exercise_plan_items")
          .select(
            "id, sequence_order, sets, reps, hold_seconds, frequency_per_week, days_of_week, notes, exercise_templates(name)"
          )
          .eq("exercise_plan_id", activePlan.id)
          .order("sequence_order", { ascending: true });

        setItems((planItems as ExerciseItem[]) ?? []);
      }
    } catch (error) {
      console.error("Error loading exercise plan", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Breadcrumb items={[{ label: "Patient", href: "/patient" }, { label: "Exercise" }]} />
      <Card>
        <CardHeader>
          <CardTitle>Your Exercise Plan</CardTitle>
          <CardDescription>
            See the exercises your therapist has assigned and how often to complete them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-muted-foreground text-sm">Loading exercise plan...</div>}
          {!loading && !plan && (
            <div className="text-muted-foreground text-sm">
              You don&apos;t have an active exercise plan yet. Your therapist can create one for you.
            </div>
          )}
          {!loading && plan && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{plan.title}</h2>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                )}
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 bg-muted/40 flex flex-col gap-1"
                  >
                    <div className="font-medium">
                      {item.exercise_templates?.name ?? "Exercise"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.sets && item.reps
                        ? `${item.sets} sets x ${item.reps} reps`
                        : item.hold_seconds
                        ? `Hold for ${item.hold_seconds} seconds`
                        : null}
                    </div>
                    {item.frequency_per_week && (
                      <div className="text-xs text-muted-foreground">
                        {item.frequency_per_week}x per week
                      </div>
                    )}
                    {item.days_of_week && item.days_of_week.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Days: {item.days_of_week.join(", ")}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Notes: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Your plan doesn&apos;t have any exercises yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

