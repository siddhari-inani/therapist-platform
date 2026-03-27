"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type ExerciseRecommendation = {
  id: string;
  title: string;
  body: string | null;
  recommendation_type: string;
  status: string;
  created_at: string;
};

export default function PatientRecommendationsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("exercise_recommendations")
        .select("id, title, body, recommendation_type, status, created_at")
        .eq("patient_id", user.id)
        .eq("is_patient_visible", true)
        .order("created_at", { ascending: false });

      setRecommendations((data as ExerciseRecommendation[]) ?? []);
    } catch (error) {
      console.error("Error loading recommendations", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Breadcrumb items={[{ label: "Patient", href: "/patient" }, { label: "Recommendations" }]} />
      <Card>
        <CardHeader>
          <CardTitle>Exercise Recommendations</CardTitle>
          <CardDescription>
            Personalized guidance from your therapist based on your exercise history and form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-muted-foreground text-sm">Loading recommendations...</div>}
          {!loading && recommendations.length === 0 && (
            <div className="text-muted-foreground text-sm">
              You don&apos;t have any exercise recommendations yet.
            </div>
          )}
          {!loading && recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="border rounded-lg p-3 bg-muted/40 flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{rec.title}</div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rec.recommendation_type}
                    </span>
                  </div>
                  {rec.body && (
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {rec.body}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground flex justify-between mt-1">
                    <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                    <span className="capitalize">{rec.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

