"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { RecoveryMilestone } from "@/types/database.types";
import { AddMilestoneModal } from "./add-milestone-modal";

interface RecoveryTimelineProps {
  milestones: RecoveryMilestone[];
  patientId: string;
  onMilestoneAdded?: () => void;
}

const categoryLabels: Record<string, string> = {
  surgery: "Surgery",
  rom_goal: "ROM Goal",
  strength_goal: "Strength Goal",
  functional_goal: "Functional Goal",
  discharge: "Discharge",
  initial_evaluation: "Initial Evaluation",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  surgery: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
  rom_goal: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
  strength_goal: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700",
  functional_goal: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  discharge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
  initial_evaluation: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700",
  other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-700",
};

export function RecoveryTimeline({
  milestones,
  patientId,
  onMilestoneAdded,
}: RecoveryTimelineProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<RecoveryMilestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<RecoveryMilestone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  // Sort milestones by date (completed_date for completed, target_date for others, created_at as fallback)
  const sortedMilestones = [...milestones].sort((a, b) => {
    const dateA =
      a.completed_date || a.target_date || a.created_at
        ? new Date(a.completed_date || a.target_date || a.created_at || "").getTime()
        : 0;
    const dateB =
      b.completed_date || b.target_date || b.created_at
        ? new Date(b.completed_date || b.target_date || b.created_at || "").getTime()
        : 0;
    return dateA - dateB;
  });

  // Calculate progress
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const totalCount = milestones.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find current phase (first in_progress or first future)
  const currentPhaseIndex = sortedMilestones.findIndex(
    (m) => m.status === "in_progress" || m.status === "future"
  );
  const currentPhase =
    currentPhaseIndex >= 0 ? sortedMilestones[currentPhaseIndex] : sortedMilestones[sortedMilestones.length - 1];

  const handleMilestoneAdded = () => {
    setIsAddModalOpen(false);
    setEditingMilestone(null);
    onMilestoneAdded?.();
  };

  const handleEdit = (milestone: RecoveryMilestone) => {
    setEditingMilestone(milestone);
    setIsAddModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingMilestone) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("recovery_milestones")
        .delete()
        .eq("id", deletingMilestone.id);

      if (error) {
        console.error("Error deleting milestone:", error);
        alert("Failed to delete milestone. Please try again.");
        return;
      }

      setDeletingMilestone(null);
      onMilestoneAdded?.();
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recovery Timeline</CardTitle>
            <CardDescription>
              Track patient progress from initial evaluation to discharge
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-semibold">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>
              {completedCount} of {totalCount} milestones completed
            </span>
            {currentPhase && (
              <span className="font-medium text-foreground">
                Current Phase: {currentPhase.title}
              </span>
            )}
          </div>
        </div>

        {/* Timeline */}
        {sortedMilestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No milestones yet</p>
            <p className="text-sm">Add a milestone to start tracking recovery progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop: Horizontal Timeline */}
            <div className="hidden md:block">
              <div className="relative pb-8">
                {/* Timeline Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-slate-800" />
                <div
                  className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />

                {/* Milestones - grid so each block has equal width */}
                <div
                  className="relative grid w-full gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${sortedMilestones.length}, minmax(0, 1fr))`,
                  }}
                >
                  {sortedMilestones.map((milestone, index) => {
                    const isCompleted = milestone.status === "completed";
                    const isInProgress = milestone.status === "in_progress";
                    const isCurrent = index === currentPhaseIndex;

                    return (
                      <div
                        key={milestone.id}
                        className="flex flex-col items-center transition-all duration-300 ease-out min-w-0"
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${index * 50}ms both`,
                        }}
                      >
                        {/* Milestone Icon */}
                        <div className="relative z-10 mb-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                              isCompleted
                                ? "bg-green-500 border-green-600 text-white shadow-green-200/70"
                                : isInProgress
                                ? "bg-primary border-primary text-white shadow-primary/30 animate-pulse"
                                : "bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-300"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : isInProgress ? (
                              <Clock className="h-6 w-6" />
                            ) : (
                              <Circle className="h-6 w-6" />
                            )}
                          </div>
                          {isCurrent && (
                            <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-75" />
                          )}
                        </div>

                        {/* Milestone Content Card - fixed height so all blocks same size */}
                        <div className="w-full flex flex-col min-w-0">
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-[240px]">
                            <div
                              className={cn(
                                "inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 border w-fit mx-auto shrink-0",
                                categoryColors[milestone.category] || categoryColors.other
                              )}
                            >
                              {categoryLabels[milestone.category] || "Other"}
                            </div>
                            <h4
                              className={cn(
                                "font-semibold text-sm mb-1.5 text-center line-clamp-2 shrink-0",
                                isCurrent && "text-primary"
                              )}
                              title={milestone.title}
                            >
                              {milestone.title}
                            </h4>
                            {milestone.description ? (
                              <p
                                className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1 min-h-0"
                                title={milestone.description}
                              >
                                {milestone.description}
                              </p>
                            ) : (
                              <div className="flex-1 min-h-0" />
                            )}
                            {/* Progress Bar */}
                            {milestone.status !== "completed" && (
                              <div className="shrink-0 mb-2">
                                <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5 mb-1">
                                  <div
                                    className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, milestone.progress || 0))}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                  {milestone.progress || 0}%
                                </p>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground text-center shrink-0 mb-2">
                              {milestone.completed_date
                                ? new Date(milestone.completed_date).toLocaleDateString()
                                : milestone.target_date
                                ? `Target: ${new Date(milestone.target_date).toLocaleDateString()}`
                                : new Date(milestone.created_at).toLocaleDateString()}
                            </div>
                            {/* Action Buttons */}
                            <div className="flex gap-1 justify-center pt-2 border-t border-gray-100 dark:border-slate-800 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEdit(milestone)}
                                title="Edit milestone"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletingMilestone(milestone)}
                                title="Delete milestone"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet: Vertical Timeline */}
            <div className="md:hidden space-y-4">
              {sortedMilestones.map((milestone, index) => {
                const isCompleted = milestone.status === "completed";
                const isInProgress = milestone.status === "in_progress";
                const isCurrent = index === currentPhaseIndex;

                return (
                  <div
                    key={milestone.id}
                    className="relative flex gap-4 transition-all duration-300 ease-out"
                    style={{
                      animation: `fadeInLeft 0.3s ease-out ${index * 50}ms both`,
                    }}
                  >
                    {/* Timeline Line */}
                    {index < sortedMilestones.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-6 top-12 bottom-0 w-0.5 transition-colors duration-300",
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        )}
                      />
                    )}

                    {/* Milestone Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                          isCompleted
                            ? "bg-green-500 border-green-600 text-white shadow-green-200/70"
                            : isInProgress
                            ? "bg-primary border-primary text-white shadow-primary/30"
                            : "bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-300"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : isInProgress ? (
                          <Clock className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </div>
                      {isCurrent && (
                        <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-75" />
                      )}
                    </div>

                    {/* Milestone Content Card */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "inline-block px-2 py-0.5 rounded text-xs font-medium mb-1.5 border",
                                categoryColors[milestone.category] || categoryColors.other
                              )}
                            >
                              {categoryLabels[milestone.category] || "Other"}
                            </div>
                            <h4
                              className={cn(
                                "font-semibold text-sm mb-1.5",
                                isCurrent && "text-primary"
                              )}
                            >
                              {milestone.title}
                            </h4>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(milestone)}
                              title="Edit milestone"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletingMilestone(milestone)}
                              title="Delete milestone"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        {milestone.status !== "completed" && (
                          <div className="mb-2">
                            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5 mb-1">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${Math.max(0, Math.min(100, milestone.progress || 0))}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Progress: {milestone.progress || 0}%
                            </p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground pt-2 border-t border-gray-100 dark:border-slate-800">
                          {milestone.completed_date
                            ? `Completed: ${new Date(milestone.completed_date).toLocaleDateString()}`
                            : milestone.target_date
                            ? `Target: ${new Date(milestone.target_date).toLocaleDateString()}`
                            : `Created: ${new Date(milestone.created_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <AddMilestoneModal
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setEditingMilestone(null);
          }
        }}
        patientId={patientId}
        milestone={editingMilestone}
        onSuccess={handleMilestoneAdded}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMilestone}
        onOpenChange={(open) => {
          if (!open) setDeletingMilestone(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingMilestone?.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
