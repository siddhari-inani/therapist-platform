"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/contexts/gamification-context";
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
import type {
  MilestoneCategory,
  MilestoneStatus,
  RecoveryMilestone,
} from "@/types/database.types";
import { useEffect } from "react";

interface AddMilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  milestone?: RecoveryMilestone | null;
  onSuccess?: () => void;
}

const categoryOptions: { value: MilestoneCategory; label: string }[] = [
  { value: "initial_evaluation", label: "Initial Evaluation" },
  { value: "surgery", label: "Surgery" },
  { value: "rom_goal", label: "ROM Goal" },
  { value: "strength_goal", label: "Strength Goal" },
  { value: "functional_goal", label: "Functional Goal" },
  { value: "discharge", label: "Discharge" },
  { value: "other", label: "Other" },
];

const statusOptions: { value: MilestoneStatus; label: string }[] = [
  { value: "future", label: "Future" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function AddMilestoneModal({
  open,
  onOpenChange,
  patientId,
  milestone,
  onSuccess,
}: AddMilestoneModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as MilestoneCategory,
    status: "future" as MilestoneStatus,
    targetDate: "",
    completedDate: "",
    progress: 0,
  });

  const supabase = createClient();
  const { award } = useGamification();
  const isEditMode = !!milestone;

  // Populate form when editing
  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title,
        description: milestone.description || "",
        category: milestone.category,
        status: milestone.status,
        targetDate: milestone.target_date
          ? new Date(milestone.target_date).toISOString().split("T")[0]
          : "",
        completedDate: milestone.completed_date
          ? new Date(milestone.completed_date).toISOString().split("T")[0]
          : "",
        progress: milestone.progress || 0,
      });
    } else {
      // Reset form when adding new
      setFormData({
        title: "",
        description: "",
        category: "other",
        status: "future",
        targetDate: "",
        completedDate: "",
        progress: 0,
      });
    }
  }, [milestone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Auth error:", authError);
        alert("You must be logged in to add milestones. Please refresh the page and try again.");
        setLoading(false);
        return;
      }

      // Ensure completed_date is set when status is completed (required by DB constraint)
      const completedDate =
        formData.status === "completed"
          ? formData.completedDate || new Date().toISOString().split("T")[0]
          : null;

      const milestoneData: any = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        category: formData.category,
        status: formData.status,
        target_date: formData.targetDate || null,
        completed_date: completedDate,
        progress: Math.max(0, Math.min(100, Number(formData.progress) || 0)),
      };

      console.log("Submitting milestone:", {
        isEditMode,
        milestoneData,
        patientId,
        therapistId: user.id,
      });

      let error;
      let result;
      if (isEditMode && milestone) {
        // Update existing milestone
        result = await supabase
          .from("recovery_milestones")
          .update(milestoneData)
          .eq("id", milestone.id);
        error = result.error;
      } else {
        // Insert new milestone
        result = await supabase.from("recovery_milestones").insert({
          ...milestoneData,
          patient_id: patientId,
          therapist_id: user.id,
        });
        error = result.error;
      }

      if (error) {
        console.error(`Error ${isEditMode ? "updating" : "adding"} milestone:`, {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          milestoneData,
        });

        let errorMessage = "Unknown error occurred";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        }

        // More specific error messages
        if (error.code === "42P01") {
          errorMessage = "The recovery_milestones table does not exist. Please run the database migration first.";
        } else if (error.code === "42501") {
          errorMessage = "Permission denied. You may not have permission to create milestones for this patient.";
        } else if (error.code === "23505") {
          errorMessage = "A milestone with this information already exists.";
        } else if (error.code === "23514") {
          errorMessage = "Invalid data: The milestone status and dates don't match. Completed milestones must have a completed date.";
        }

        alert(
          `Failed to ${isEditMode ? "update" : "add"} milestone\n\nError: ${errorMessage}\n\nPlease check:\n1. The database migration has been run (20240110000000_create_recovery_milestones.sql)\n2. You have permission to create milestones\n3. All required fields are filled correctly\n\nCheck the browser console for more details.`
        );
        setLoading(false);
        return;
      }

      console.log("Milestone saved successfully:", result.data);

      // If this was a completed discharge milestone, trigger recovery achievement check
      if (formData.category === "discharge" && formData.status === "completed") {
        award?.("milestone_completed");
      }

      // Reset form only if not editing
      if (!isEditMode) {
        setFormData({
          title: "",
          description: "",
          category: "other",
          status: "future",
          targetDate: "",
          completedDate: "",
          progress: 0,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Unexpected error:", error);
      alert(
        `An unexpected error occurred: ${error?.message || "Unknown error"}\n\nPlease check the browser console for details.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "progress" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isEditMode) {
      // Reset form when closing add modal
      setFormData({
        title: "",
        description: "",
        category: "other",
        status: "future",
        targetDate: "",
        completedDate: "",
        progress: 0,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Recovery Milestone" : "Add Recovery Milestone"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update milestone details and progress"
                : "Track a new milestone in the patient's recovery journey"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Achieve 90° knee flexion"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional details about this milestone..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="targetDate" className="text-sm font-medium">
                  Target Date
                </label>
                <Input
                  id="targetDate"
                  name="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={handleChange}
                />
              </div>

              {formData.status === "completed" && (
                <div className="grid gap-2">
                  <label htmlFor="completedDate" className="text-sm font-medium">
                    Completed Date
                  </label>
                  <Input
                    id="completedDate"
                    name="completedDate"
                    type="date"
                    value={formData.completedDate}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="progress" className="text-sm font-medium">
                Progress (%)
              </label>
              <div className="space-y-2">
                <Input
                  id="progress"
                  name="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleChange}
                  placeholder="0-100"
                />
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, Number(formData.progress)))}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Current progress: {Math.max(0, Math.min(100, Number(formData.progress)))}%
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Adding..."
                : isEditMode
                ? "Update Milestone"
                : "Add Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
