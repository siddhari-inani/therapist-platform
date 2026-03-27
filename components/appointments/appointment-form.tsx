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
import { createClient } from "@/lib/supabase/client";
import { DEMO_PATIENTS } from "@/lib/demo-data";
import type { Profile, TreatmentType } from "@/types/database.types";

interface AppointmentFormData {
  patient_id: string;
  start_time: string;
  end_time: string;
  treatment_type: TreatmentType;
  title: string;
  notes: string;
  is_recurring: boolean;
  video_call_url: string;
}

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
  isDemo?: boolean;
}

export function AppointmentForm({
  open,
  onOpenChange,
  initialDate,
  onSuccess,
  isDemo,
}: AppointmentFormProps) {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [loadingZoom, setLoadingZoom] = useState(false);
  const [zoomError, setZoomError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: "",
    start_time: initialDate
      ? new Date(
          initialDate.getFullYear(),
          initialDate.getMonth(),
          initialDate.getDate(),
          9,
          0
        ).toISOString().slice(0, 16)
      : "",
    end_time: initialDate
      ? new Date(
          initialDate.getFullYear(),
          initialDate.getMonth(),
          initialDate.getDate(),
          10,
          0
        ).toISOString().slice(0, 16)
      : "",
    treatment_type: "follow_up",
    title: "",
    notes: "",
    is_recurring: false,
    video_call_url: "",
  });
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadPatients();
      if (initialDate) {
        const start = new Date(
          initialDate.getFullYear(),
          initialDate.getMonth(),
          initialDate.getDate(),
          9,
          0
        );
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        setFormData((prev) => ({
          ...prev,
          start_time: start.toISOString().slice(0, 16),
          end_time: end.toISOString().slice(0, 16),
        }));
      }
    }
  }, [open, initialDate]);

  const loadPatients = async () => {
    setLoadingPatients(true);
    setPatientsError(null);
    try {
      if (isDemo) {
        setPatients([...DEMO_PATIENTS].sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? "")) as Profile[]);
        setLoadingPatients(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPatientsError("You must be logged in");
        setLoadingPatients(false);
        return;
      }

      // Fetch all patients
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "patient")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error loading patients:", error);
        setPatientsError("Error loading patients: " + error.message);
      } else {
        setPatients(data || []);
        if (!data || data.length === 0) {
          setPatientsError("No patients found. Create a patient profile first.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setPatientsError("Error loading patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isDemo) {
        onOpenChange(false);
        onSuccess?.();
        setFormData({
          patient_id: "",
          start_time: "",
          end_time: "",
          treatment_type: "follow_up",
          title: "",
          notes: "",
          is_recurring: false,
          video_call_url: "",
        });
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create appointments");
        return;
      }

      if (!formData.patient_id) {
        alert("Please select a patient");
        setLoading(false);
        return;
      }

      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);

      if (endTime <= startTime) {
        alert("End time must be after start time");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("appointments").insert({
        therapist_id: user.id,
        patient_id: formData.patient_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        treatment_type: formData.treatment_type,
        title: formData.title || null,
        notes: formData.notes || null,
        is_recurring: formData.is_recurring,
        video_call_url: formData.video_call_url?.trim() || null,
        status: "scheduled",
      });

      if (error) {
        console.error("Error creating appointment:", error);
        alert("Error creating appointment: " + error.message);
      } else {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
        // Reset form
        setFormData({
          patient_id: "",
          start_time: "",
          end_time: "",
          treatment_type: "follow_up",
          title: "",
          notes: "",
          is_recurring: false,
          video_call_url: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment with a patient
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Patient <span className="text-red-500">*</span>
            </label>
            {loadingPatients ? (
              <div className="w-full p-2 border rounded-md bg-muted text-muted-foreground text-sm">
                Loading patients...
              </div>
            ) : patientsError ? (
              <div className="space-y-2">
                <div className="w-full p-3 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-900">
                  {patientsError}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">No patients found.</p>
                  <p className="mt-2">
                    Go to the Patients page and click &quot;Add Patient&quot; to create a new patient profile.
                  </p>
                </div>
              </div>
            ) : (
              <select
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name || patient.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Treatment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.treatment_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  treatment_type: e.target.value as TreatmentType,
                })
              }
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="initial_evaluation">Initial Evaluation</option>
              <option value="follow_up">Follow Up</option>
              <option value="manual_therapy">Manual Therapy</option>
              <option value="exercise_therapy">Exercise Therapy</option>
              <option value="electrical_stimulation">Electrical Stimulation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Optional appointment title"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Optional notes"
              className="w-full p-2 border rounded-md min-h-[80px] resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Video call link</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <input
                type="url"
                value={formData.video_call_url}
                onChange={(e) => {
                  setFormData({ ...formData, video_call_url: e.target.value });
                  setZoomError(null);
                }}
                placeholder="https://zoom.us/j/... or create a Zoom meeting below"
                className="w-full flex-1 p-2 border rounded-md"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={loadingZoom || !formData.start_time || !formData.end_time}
                onClick={async () => {
                  setZoomError(null);
                  const start = new Date(formData.start_time);
                  const end = new Date(formData.end_time);
                  if (end <= start) {
                    setZoomError("End time must be after start time");
                    return;
                  }
                  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                  if (durationMinutes < 5) {
                    setZoomError("Duration must be at least 5 minutes");
                    return;
                  }
                  setLoadingZoom(true);
                  try {
                    const res = await fetch("/api/zoom/create-meeting", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        start_time: start.toISOString(),
                        duration_minutes: durationMinutes,
                        topic: formData.title?.trim() || "Therapy session",
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setZoomError(data.error || "Failed to create Zoom meeting");
                      return;
                    }
                    setFormData((prev) => ({ ...prev, video_call_url: data.join_url }));
                  } catch (e) {
                    setZoomError(e instanceof Error ? e.message : "Failed to create Zoom meeting");
                  } finally {
                    setLoadingZoom(false);
                  }
                }}
              >
                {loadingZoom ? "Creating…" : "Create Zoom meeting"}
              </Button>
            </div>
            {zoomError && (
              <p className="text-xs text-destructive mt-1">{zoomError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Optional. Create a Zoom meeting for this time or paste any meeting link (Google Meet, Whereby, etc.).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.is_recurring}
              onChange={(e) =>
                setFormData({ ...formData, is_recurring: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label htmlFor="recurring" className="text-sm">
              Recurring appointment
            </label>
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
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
