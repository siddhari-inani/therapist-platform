"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Review } from "@/types/database.types";
import { Mail, Phone, FileText, Star, Plus, ArrowLeft } from "lucide-react";

export default function TherapistViewPage() {
  const params = useParams();
  const router = useRouter();
  const therapistId = params.id as string;
  const [therapist, setTherapist] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    // Get current user's role
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (currentUserProfile) {
      setCurrentUserRole(currentUserProfile.role);
    }

    const [therapistRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", therapistId).eq("role", "therapist").single(),
      supabase.from("reviews").select("*").eq("therapist_id", therapistId).order("created_at", { ascending: false }),
    ]);

    if (therapistRes.data) setTherapist(therapistRes.data as Profile);
    setReviews((reviewsRes.data ?? []) as Review[]);
    setLoading(false);
  }, [supabase, therapistId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="p-6 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Therapist not found.</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const hasUserReviewed = currentUserId && reviews.some(r => r.patient_id === currentUserId);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Therapist Profile" }
        ]} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {therapist.full_name || "Therapist Profile"}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Physical Therapist
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lime-600 flex items-center justify-center text-white text-xl font-semibold">
                  {(therapist.full_name || therapist.email || "T")[0].toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {therapist.full_name || "Therapist"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Physical Therapist
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{therapist.email}</span>
            </div>
            {therapist.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{therapist.phone}</span>
              </div>
            )}
            {therapist.license_number && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>License: {therapist.license_number}</span>
              </div>
            )}
            {therapist.specialties && therapist.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {therapist.specialties.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {therapist.bio && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                {therapist.bio}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              Reviews
            </CardTitle>
            <CardDescription>
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
              </span>
              <span className="text-muted-foreground text-sm">/ 5</span>
            </div>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-500"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            {currentUserRole === "patient" && !hasUserReviewed && (
              <Button
                onClick={() => setReviewFormOpen(true)}
                className="w-full mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0 max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>
                What patients are saying about this therapist
              </CardDescription>
            </div>
            {currentUserRole === "patient" && !hasUserReviewed && (
              <Button onClick={() => setReviewFormOpen(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ReviewList
            reviews={reviews}
            therapistId={therapist.id}
            currentUserId={currentUserId || ""}
            onDeleted={load}
          />
        </CardContent>
      </Card>

      {currentUserRole === "patient" && (
        <ReviewForm
          open={reviewFormOpen}
          onOpenChange={setReviewFormOpen}
          therapistId={therapist.id}
          onSuccess={load}
        />
      )}
    </div>
  );
}
