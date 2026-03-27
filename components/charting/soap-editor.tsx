"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Save, Lock, AlertCircle, Edit, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyMap, type BodyMapAnnotation } from "./body-map";
import { SOAPAutosuggest } from "./soap-autosuggest";
import type { Appointment } from "@/types/database.types";

interface SOAPNote {
  id?: string;
  appointment_id?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  body_map_annotations: BodyMapAnnotation[];
  status: "draft" | "finalized" | "amended";
}

export type ApplySoapResult = "applied" | "skipped_finalized" | "skipped_read_only";

export type SOAPEditorApplySoapRef = {
  /** Merges SOAP fields into the note. Returns result so caller can show the right message. */
  applySoap: (partial: Partial<Pick<SOAPNote, "subjective" | "objective" | "assessment" | "plan">>) => ApplySoapResult;
};

interface SOAPEditorProps {
  appointment?: Appointment;
  initialNote?: SOAPNote;
  onSave?: (note: SOAPNote) => void;
  onFinalize?: (note: SOAPNote) => Promise<void>;
  onAmend?: (note: SOAPNote) => Promise<void>;
  readOnly?: boolean;
  parentRecordId?: string | null;
  version?: number;
}

const SOAPEditorInner = forwardRef<SOAPEditorApplySoapRef, SOAPEditorProps>(function SOAPEditorInner(
  {
    appointment,
    initialNote,
    onSave,
    onFinalize,
    onAmend,
    readOnly = false,
    parentRecordId,
    version,
  },
  ref
) {
  const normalizeAnnotations = (val: unknown): BodyMapAnnotation[] =>
    Array.isArray(val) ? val : [];

  const [note, setNote] = useState<SOAPNote>({
    subjective: initialNote?.subjective || "",
    objective: initialNote?.objective || "",
    assessment: initialNote?.assessment || "",
    plan: initialNote?.plan || "",
    body_map_annotations: normalizeAnnotations(initialNote?.body_map_annotations),
    status: initialNote?.status || "draft",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isAmending, setIsAmending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useImperativeHandle(ref, () => ({
    applySoap(partial) {
      if (readOnly) return "skipped_read_only";
      if (note.status === "finalized" && !isEditing) return "skipped_finalized";
      setNote((prev) => ({ ...prev, ...partial }));
      setHasUnsavedChanges(true);
      return "applied";
    },
  }), [readOnly, note.status, isEditing]);

  // Local storage key
  const storageKey = appointment
    ? `soap-draft-${appointment.id}`
    : initialNote?.id
    ? `soap-draft-${initialNote.id}`
    : "soap-draft-new";

  // Load draft from local storage on mount
  useEffect(() => {
    if (readOnly || (initialNote?.status === "finalized" && !isEditing)) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const draft = JSON.parse(saved);
        setNote((prev) => ({
          ...prev,
          ...draft,
          body_map_annotations: Array.isArray(draft.body_map_annotations) ? draft.body_map_annotations : prev.body_map_annotations,
          // Don't overwrite with old data if we have initialNote
          ...(initialNote && { status: prev.status }),
        }));
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  }, [storageKey, readOnly, initialNote, isEditing]);

  // Auto-save to local storage
  useEffect(() => {
    if (readOnly || (note.status === "finalized" && !isEditing) || !hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(note));
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    }, 1000); // Debounce: save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [note, storageKey, readOnly, hasUnsavedChanges, isEditing]);

  const handleFieldChange = (field: keyof SOAPNote, value: string) => {
    if (readOnly || (note.status === "finalized" && !isEditing)) return;
    setNote((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleBodyMapChange = (annotations: BodyMapAnnotation[]) => {
    if (readOnly || (note.status === "finalized" && !isEditing)) return;
    setNote((prev) => ({ ...prev, body_map_annotations: annotations }));
    setHasUnsavedChanges(true);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setNote((prev) => ({ ...prev, status: "amended" }));
  };

  const handleSave = async () => {
    if (readOnly || (note.status === "finalized" && !isEditing)) return;

    setIsSaving(true);
    try {
      // Clear local storage draft
      localStorage.removeItem(storageKey);

      if (onSave) {
        await onSave(note);
      }
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (readOnly || (note.status === "finalized" && !isEditing)) return;

    if (
      !note.subjective.trim() ||
      !note.objective.trim() ||
      !note.assessment.trim() ||
      !note.plan.trim()
    ) {
      alert("Please fill in all SOAP sections before finalizing.");
      return;
    }

    if (!confirm("Are you sure you want to finalize this note? It cannot be edited after finalization.")) {
      return;
    }

    setIsFinalizing(true);
    try {
      // Clear local storage draft
      localStorage.removeItem(storageKey);

      if (onFinalize) {
        await onFinalize({ ...note, status: "finalized" });
        setNote((prev) => ({ ...prev, status: "finalized" }));
        setIsEditing(false);
      }
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("Error finalizing note:", error);
      const errorMessage = error?.message || "An unexpected error occurred";
      alert(`Error finalizing note: ${errorMessage}\n\nPlease check the browser console for more details.`);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleAmend = async () => {
    if (readOnly || !isEditing) return;

    if (
      !note.subjective.trim() ||
      !note.objective.trim() ||
      !note.assessment.trim() ||
      !note.plan.trim()
    ) {
      alert("Please fill in all SOAP sections before saving the amendment.");
      return;
    }

    setIsAmending(true);
    try {
      // Clear local storage draft
      localStorage.removeItem(storageKey);

      if (onAmend) {
        await onAmend({ ...note, status: "amended" });
        setNote((prev) => ({ ...prev, status: "amended" }));
        setIsEditing(false);
      } else if (onSave) {
        // Fallback to regular save if onAmend not provided
        await onSave({ ...note, status: "amended" });
        setIsEditing(false);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving amendment:", error);
      alert("Error saving amendment. Please try again.");
    } finally {
      setIsAmending(false);
    }
  };

  const isFinalized = (note.status === "finalized" || readOnly) && !isEditing;

  return (
    <div className="space-y-6">
      {appointment && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              {new Date(appointment.start_time).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(appointment.start_time).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isFinalized && !isEditing && (
        <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-blue-900 font-medium">
              This note has been finalized. {version && version > 1 && `(Version ${version})`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit / Amend
          </Button>
        </div>
      )}

      {isEditing && note.status === "amended" && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <FileEdit className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-900 font-medium">
            You are editing an amended version of this note. Changes will create a new version.
          </span>
        </div>
      )}

      {hasUnsavedChanges && !isFinalized && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-900">
            You have unsaved changes. {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SOAP Note</CardTitle>
              <CardDescription>
                Document patient assessment and treatment plan
              </CardDescription>
            </div>
            {!isFinalized && (
              <div className="flex gap-2">
                {isEditing && note.status === "amended" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleAmend}
                      disabled={isAmending || !hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isAmending ? "Saving Amendment..." : "Save Amendment"}
                    </Button>
                    <Button
                      onClick={handleFinalize}
                      disabled={isFinalizing || hasUnsavedChanges}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isFinalizing ? "Finalizing..." : "Finalize Amendment"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      disabled={isSaving || !hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                      onClick={handleFinalize}
                      disabled={isFinalizing || hasUnsavedChanges}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isFinalizing ? "Finalizing..." : "Finalize"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subjective */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              S - Subjective <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Patient&apos;s description of symptoms, pain, and concerns. Type &quot;/&quot; or &quot;@&quot; for template suggestions.
            </p>
            <SOAPAutosuggest
              value={note.subjective}
              onChange={(value) => handleFieldChange("subjective", value)}
              section="subjective"
              placeholder="Patient reports... (Type '/' or '@' for templates)"
              disabled={isFinalized}
            />
          </div>

          {/* Objective */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              O - Objective <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Therapist&apos;s observations, measurements, and findings. Type &quot;/&quot; or &quot;@&quot; for template suggestions.
            </p>
            <SOAPAutosuggest
              value={note.objective}
              onChange={(value) => handleFieldChange("objective", value)}
              section="objective"
              placeholder="Clinical findings... (Type '/' or '@' for templates)"
              disabled={isFinalized}
            />
          </div>

          {/* Assessment */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              A - Assessment <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Clinical assessment, diagnosis, and progress evaluation. Type &quot;/&quot; or &quot;@&quot; for template suggestions.
            </p>
            <SOAPAutosuggest
              value={note.assessment}
              onChange={(value) => handleFieldChange("assessment", value)}
              section="assessment"
              placeholder="Clinical assessment... (Type '/' or '@' for templates)"
              disabled={isFinalized}
            />
          </div>

          {/* Plan */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              P - Plan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Treatment plan, goals, and next steps. Type &quot;/&quot; or &quot;@&quot; for template suggestions.
            </p>
            <SOAPAutosuggest
              value={note.plan}
              onChange={(value) => handleFieldChange("plan", value)}
              section="plan"
              placeholder="Treatment plan... (Type '/' or '@' for templates)"
              disabled={isFinalized}
            />
          </div>

          {/* Body Map */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Body Map - Pain Points
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Click on the body silhouette to mark areas of pain or concern
            </p>
            <BodyMap
              annotations={Array.isArray(note.body_map_annotations) ? note.body_map_annotations : []}
              onAnnotationAdd={(annotation) => {
                const list = Array.isArray(note.body_map_annotations) ? note.body_map_annotations : [];
                handleBodyMapChange([...list, annotation]);
              }}
              onAnnotationRemove={(id) => {
                const list = Array.isArray(note.body_map_annotations) ? note.body_map_annotations : [];
                handleBodyMapChange(list.filter((a) => a.id !== id));
              }}
              onAnnotationUpdate={(id, updates) => {
                const list = Array.isArray(note.body_map_annotations) ? note.body_map_annotations : [];
                handleBodyMapChange(list.map((a) => (a.id === id ? { ...a, ...updates } : a)));
              }}
              disabled={isFinalized}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export const SOAPEditor = SOAPEditorInner;
