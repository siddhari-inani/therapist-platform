"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ReviewInsert } from "@/types/database.types";
import { Loader2, Star } from "lucide-react";

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  therapistId: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  open,
  onOpenChange,
  therapistId,
  onSuccess,
}: ReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<Profile | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setReviewerName("");
      setRating(5);
      setComment("");
      setError(null);
      loadCurrentPatient();
    }
  }, [open]);

  const loadCurrentPatient = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", user.id)
        .single();
      
      if (data) {
        const profile = data as Profile;
        if (profile.role === "patient") {
          setPatientId(profile.id);
          setPatientProfile(profile);
          setReviewerName(profile.full_name || profile.email || "");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      setError("You must be logged in as a patient to add a review.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const insert: ReviewInsert = {
        therapist_id: therapistId,
        patient_id: patientId,
        reviewer_name: reviewerName.trim() || patientProfile?.full_name || patientProfile?.email || null,
        rating,
        comment: comment.trim() || null,
      };
      const { error: err } = await supabase.from("reviews").insert(insert);
      if (err) throw err;
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
          <DialogDescription>
            Share your experience with this therapist
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 rounded-md border bg-muted animate-pulse" />
              <div className="h-10 rounded-md border bg-muted animate-pulse" />
            </div>
          ) : !patientId ? (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              You must be logged in as a patient to add a review.
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Your name</label>
                <Input
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. John D."
                />
              </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className="p-1 rounded hover:bg-muted"
                >
                  <Star
                    className={`h-8 w-8 ${
                      r <= rating
                        ? "fill-amber-400 text-amber-500"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your review</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
            />
          </div>
            </>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
