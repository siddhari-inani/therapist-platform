"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewList } from "@/components/reviews/review-list";
import { TherapistProfileForm } from "@/components/therapist/therapist-profile-form";
import { TherapistLocationMap } from "@/components/therapist/therapist-location-map";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_THERAPIST, DEMO_REVIEWS } from "@/lib/demo-data";
import type { Profile, Review } from "@/types/database.types";
import { Mail, Phone, FileText, Edit, Star, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const supabase = createClient();

  const { isDemo } = useDemoMode();

  const load = useCallback(async () => {
    if (isDemo) {
      setUserId(DEMO_THERAPIST.id);
      setProfile(DEMO_THERAPIST as Profile);
      setReviews([...DEMO_REVIEWS].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
    setUserId(user.id);

    const [profileRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("reviews").select("*").eq("therapist_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    setReviews((reviewsRes.data ?? []) as Review[]);
    setLoading(false);
  }, [supabase, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !userId) {
    return (
      <div className="p-6 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You must be logged in to view your profile.</p>
            <Link href="/login">
              <Button className="mt-4">Log in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Profile" }]} />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-muted-foreground text-lg">
          Your therapist profile and reviews
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lime-600 flex items-center justify-center text-white text-xl font-semibold">
                {(profile.full_name || profile.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {profile.full_name || "Therapist"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {profile.role === "therapist" ? "Physical Therapist" : profile.role}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.license_number && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>License: {profile.license_number}</span>
            </div>
          )}
          {profile.specialties && profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {profile.bio && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              {profile.bio}
            </p>
          )}
          
          {/* Location Information */}
          {((profile as any).address_line1 || (profile as any).latitude) && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Practice Location</span>
              </div>
              {(profile as any).address_line1 && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{(profile as any).address_line1}</p>
                  {(profile as any).address_line2 && (
                    <p>{(profile as any).address_line2}</p>
                  )}
                  <p>
                    {[
                      (profile as any).city,
                      (profile as any).state,
                      (profile as any).zip_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
              {(profile as any).latitude && (profile as any).longitude && (
                <div className="mt-3">
                  <TherapistLocationMap
                    latitude={(profile as any).latitude}
                    longitude={(profile as any).longitude}
                    address={
                      (profile as any).address_line1 ||
                      "Practice Location"
                    }
                  />
                </div>
              )}
            </div>
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
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                  : "—"}
              </span>
              <span className="text-muted-foreground text-sm">/ 5</span>
            </div>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => {
                const avgRating = reviews.length > 0
                  ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                  : 0;
                return (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-500"
                        : "text-slate-300"
                    }`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0 max-w-2xl">
        <CardHeader>
          <div>
            <CardTitle>Review history</CardTitle>
            <CardDescription>
              Patient reviews and testimonials on your profile
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ReviewList
            reviews={reviews}
            therapistId={profile.id}
            currentUserId={userId}
            onDeleted={load}
          />
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <TherapistProfileForm
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        profile={profile}
        onSuccess={() => {
          load();
        }}
      />
    </div>
  );
}
