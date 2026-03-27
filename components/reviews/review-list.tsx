"use client";

import React from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/types/database.types";
import { cn } from "@/lib/utils";

interface ReviewListProps {
  reviews: Review[];
  therapistId: string;
  currentUserId: string;
  onDeleted?: () => void;
}

export function ReviewList({
  reviews,
  therapistId,
  currentUserId,
  onDeleted,
}: ReviewListProps) {
  const supabase = createClient();

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) onDeleted?.();
  };

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="flex gap-4 p-4 rounded-lg border bg-card"
        >
          <div className="flex shrink-0 gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i <= r.rating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                )}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {r.reviewer_name || "Anonymous"}
            </p>
            {r.comment && (
              <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
          {therapistId === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(r.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
