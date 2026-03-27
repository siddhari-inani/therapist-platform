"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Video } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SOAPEditor, type SOAPEditorApplySoapRef } from "@/components/charting/soap-editor";
import { VoiceNoteAssistant, type ApplySoapResult } from "@/components/charting/voice-note-assistant";
import { createClient } from "@/lib/supabase/client";
import { useGamification } from "@/contexts/gamification-context";
import { useDemoMode } from "@/contexts/demo-context";
import {
  DEMO_APPOINTMENTS,
  DEMO_PATIENTS,
  DEMO_MEDICAL_RECORDS,
  DEMO_THERAPIST_ID,
} from "@/lib/demo-data";
import type { Appointment, MedicalRecord, MedicalRecordInsert, MedicalRecordUpdate, Profile } from "@/types/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ChartingPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const recordId = searchParams.get("record");
  const patientId = searchParams.get("patient");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [patient, setPatient] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const soapEditorRef = useRef<SOAPEditorApplySoapRef | null>(null);
  const supabase = createClient();
  const { award } = useGamification();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    async function loadData() {
      try {
        if (isDemo) {
          if (recordId) {
            const rec = DEMO_MEDICAL_RECORDS.find((r) => r.id === recordId && r.therapist_id === DEMO_THERAPIST_ID);
            if (rec) {
              setRecord(rec);
              const p = DEMO_PATIENTS.find((x) => x.id === rec.patient_id);
              if (p) setPatient(p as Profile);
              if (rec.appointment_id) {
                const apt = DEMO_APPOINTMENTS.find((a) => a.id === rec.appointment_id);
                if (apt) setAppointment(apt);
              }
            }
          } else if (appointmentId) {
            const apt = DEMO_APPOINTMENTS.find((a) => a.id === appointmentId && a.therapist_id === DEMO_THERAPIST_ID);
            if (apt) {
              setAppointment(apt);
              const p = DEMO_PATIENTS.find((x) => x.id === apt.patient_id);
              if (p) setPatient(p as Profile);
              const rec = DEMO_MEDICAL_RECORDS.find((r) => r.appointment_id === apt.id);
              if (rec) setRecord(rec);
            }
          } else if (patientId) {
            const p = DEMO_PATIENTS.find((x) => x.id === patientId);
            if (p) setPatient(p as Profile);
            const rec = DEMO_MEDICAL_RECORDS.find((r) => r.patient_id === patientId);
            if (rec) setRecord(rec);
          }
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No user found");
          setLoading(false);
          return;
        }

        // Load appointment if provided
        if (appointmentId) {
          const { data: aptData, error: aptError } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .eq("therapist_id", user.id)
            .single();

          if (!aptError && aptData) {
            setAppointment(aptData as Appointment);
          }
        }

        // Load patient if provided
        if (patientId) {
          const { data: patientData, error: patientError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", patientId)
            .eq("role", "patient")
            .single();

          if (!patientError && patientData) {
            setPatient(patientData as Profile);
          }
        }

        // Load existing record if provided
        if (recordId) {
          const { data: recordData, error: recordError } = await supabase
            .from("medical_records")
            .select("*")
            .eq("id", recordId)
            .eq("therapist_id", user.id)
            .single();

          if (!recordError && recordData) {
            const rec = recordData as MedicalRecord;
            setRecord(rec);
            // Also load the patient if not already loaded
            if (rec.patient_id && !patient) {
              const { data: patientData, error: patientError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", rec.patient_id)
                .eq("role", "patient")
                .single();

              if (!patientError && patientData) {
                setPatient(patientData as Profile);
              }
            }
          }
        } else if (appointmentId) {
          // Try to find existing draft for this appointment
          const { data: draftData } = await supabase
            .from("medical_records")
            .select("*")
            .eq("appointment_id", appointmentId)
            .eq("therapist_id", user.id)
            .eq("status", "draft")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (draftData) {
            setRecord(draftData as MedicalRecord);
          }
        } else if (patientId) {
          // Try to find existing draft for this patient (standalone note)
          const { data: draftData } = await supabase
            .from("medical_records")
            .select("*")
            .eq("patient_id", patientId)
            .eq("therapist_id", user.id)
            .is("appointment_id", null)
            .eq("status", "draft")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (draftData) {
            setRecord(draftData as MedicalRecord);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [appointmentId, recordId, patientId, supabase, isDemo]);

  const handleSave = async (note: any) => {
    if (isDemo) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get patient ID from multiple sources (record, appointment, patient state, or URL param)
      const targetPatientId = record?.patient_id || appointment?.patient_id || patient?.id || patientId;
      
      if (!targetPatientId) {
        console.error("Patient ID sources:", {
          recordPatientId: record?.patient_id,
          appointmentPatientId: appointment?.patient_id,
          patientId: patient?.id,
          urlPatientId: patientId,
          record,
          appointment,
          patient,
        });
        throw new Error("No patient specified. Please ensure you're creating a note for a specific patient or appointment.");
      }

      const recordData: MedicalRecordUpdate & Record<string, unknown> = {
        appointment_id: appointment?.id || null,
        therapist_id: user.id,
        patient_id: targetPatientId,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        body_map_annotations: note.body_map_annotations,
        status: note.status || "draft",
      };

      // If this is an amendment, set parent_record_id and increment version
      if (note.status === "amended" && record?.id && record.status === "finalized") {
        recordData.parent_record_id = record.id;
        recordData.version = (record.version || 1) + 1;
      }

      if (record?.id && record.status !== "finalized") {
        // Update existing draft/amended record
        const { error } = await supabase
          .from("medical_records")
          .update(recordData as never)
          .eq("id", record.id);

        if (error) throw error;
      } else if (note.status === "amended" && record?.id && record.status === "finalized") {
        // Create new amended version
        const { data, error } = await supabase
          .from("medical_records")
          .insert(recordData as never)
          .select()
          .single();

        if (error) throw error;
        if (data) setRecord(data as MedicalRecord);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("medical_records")
          .insert(recordData as never)
          .select()
          .single();

        if (error) throw error;
        if (data) setRecord(data as MedicalRecord);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  };

  const handleAmend = async (note: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (!record?.id) {
        throw new Error("No record to amend");
      }

      // Get patient ID from multiple sources (record should have it)
      const targetPatientId = record?.patient_id || appointment?.patient_id || patient?.id || patientId;
      
      if (!targetPatientId) {
        console.error("Patient ID sources for amendment:", {
          recordPatientId: record?.patient_id,
          appointmentPatientId: appointment?.patient_id,
          patientId: patient?.id,
          urlPatientId: patientId,
        });
        throw new Error("No patient specified. Cannot create amendment without a patient.");
      }

      // Create new amended version
      const amendPayload = {
        appointment_id: appointment?.id || null,
        therapist_id: user.id,
        patient_id: targetPatientId,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        body_map_annotations: note.body_map_annotations,
        status: "amended",
        parent_record_id: record.id,
        version: (record.version || 1) + 1,
      };
      const { data, error } = await supabase
        .from("medical_records")
        .insert(amendPayload as never)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const rec = data as MedicalRecord;
        setRecord(rec);
        window.history.replaceState({}, "", `/dashboard/charting?record=${rec.id}`);
      }
    } catch (error) {
      console.error("Error creating amendment:", error);
      throw error;
    }
  };

  const handleFinalize = async (note: any) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be logged in to finalize notes");
      }

      // Get patient ID from multiple sources (record, appointment, patient state, or URL param)
      const targetPatientId = record?.patient_id || appointment?.patient_id || patient?.id || patientId;
      
      if (!targetPatientId) {
        console.error("Patient ID sources:", {
          recordPatientId: record?.patient_id,
          appointmentPatientId: appointment?.patient_id,
          patientId: patient?.id,
          urlPatientId: patientId,
          record,
          appointment,
          patient,
        });
        throw new Error("No patient specified. Please ensure you're creating a note for a specific patient or appointment.");
      }

      // Validate required fields
      if (!note.subjective?.trim() || !note.objective?.trim() || !note.assessment?.trim() || !note.plan?.trim()) {
        throw new Error("All SOAP sections must be filled before finalizing");
      }

      // If no record exists, create a new one and finalize it
      if (!record?.id) {
        const recordData: MedicalRecordInsert = {
          appointment_id: appointment?.id || null,
          therapist_id: user.id,
          patient_id: targetPatientId,
          subjective: note.subjective,
          objective: note.objective,
          assessment: note.assessment,
          plan: note.plan,
          body_map_annotations: (note.body_map_annotations || []) as MedicalRecord["body_map_annotations"],
          status: "finalized",
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        };

        const { data: newRecord, error: createError } = await supabase
          .from("medical_records")
          .insert(recordData as never)
          .select()
          .single();

        if (createError) {
          console.error("Error creating finalized record:", createError);
          throw new Error(`Failed to create record: ${createError.message || createError.details || "Unknown error"}`);
        }

        if (newRecord) {
          const created = newRecord as MedicalRecord;
          setRecord(created);
          window.history.replaceState({}, "", `/dashboard/charting?record=${created.id}`);
          award?.("soap_finalized");
        }
        return;
      }

      // If record is already finalized, create an amended version
      if (record.status === "finalized") {
        const recordData: MedicalRecordInsert = {
          appointment_id: appointment?.id || null,
          therapist_id: user.id,
          patient_id: targetPatientId,
          subjective: note.subjective,
          objective: note.objective,
          assessment: note.assessment,
          plan: note.plan,
          body_map_annotations: (note.body_map_annotations || []) as MedicalRecord["body_map_annotations"],
          status: "finalized",
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
          parent_record_id: record.id,
          version: (record.version || 1) + 1,
        };

        const { data: newRecord, error: createError } = await supabase
          .from("medical_records")
          .insert(recordData as never)
          .select()
          .single();

        if (createError) {
          console.error("Error creating amended record:", createError);
          throw new Error(`Failed to create amendment: ${createError.message || createError.details || "Unknown error"}`);
        }

        if (newRecord) {
          const created = newRecord as MedicalRecord;
          setRecord(created);
          window.history.replaceState({}, "", `/dashboard/charting?record=${created.id}`);
          award?.("soap_finalized");
        }
        return;
      }

      // Update existing draft/amended record and finalize it
      const updateData: MedicalRecordUpdate = {
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        body_map_annotations: (note.body_map_annotations || []) as MedicalRecord["body_map_annotations"],
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: user.id,
      };

      const { error: updateError } = await supabase
        .from("medical_records")
        .update(updateData as never)
        .eq("id", record.id);

      if (updateError) {
        console.error("Error updating record:", updateError);
        throw new Error(`Failed to finalize record: ${updateError.message || updateError.details || "Unknown error"}`);
      }

      // Reload the record to get updated data
      const { data: updatedRecord, error: reloadError } = await supabase
        .from("medical_records")
        .select("*")
        .eq("id", record.id)
        .single();

      if (reloadError) {
        console.error("Error reloading record:", reloadError);
        throw new Error(`Failed to reload record: ${reloadError.message || reloadError.details || "Unknown error"}`);
      }

      if (updatedRecord) {
        setRecord(updatedRecord as MedicalRecord);
        award?.("soap_finalized");
      }
    } catch (error: any) {
      console.error("Error finalizing note:", error);
      const errorMessage = error?.message || "An unexpected error occurred while finalizing the note";
      alert(`Error: ${errorMessage}\n\nPlease check:\n1. All SOAP sections are filled\n2. You have permission to finalize notes\n3. The database connection is working\n\nCheck the browser console for more details.`);
      throw error;
    }
  };


  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading charting...</div>
        </div>
      </div>
    );
  }

  if (!appointment && !record && !patient) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-6 space-y-2">
          <Breadcrumb items={[{ label: "Charting" }]} />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Charting
          </h1>
        </div>
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Charting</CardTitle>
            <CardDescription>Create or edit SOAP notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Select an appointment from the calendar, choose a patient, or open an existing record.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => (window.location.href = "/dashboard/calendar")}>
                Go to Calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard/patients")}
              >
                Select Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Breadcrumb items={[{ label: "Charting" }]} />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Charting
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Document patient assessment and treatment</p>
        </div>
        {appointment?.video_call_url && (
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() => window.open(appointment.video_call_url!, "_blank", "noopener,noreferrer")}
          >
            <Video className="h-4 w-4" aria-hidden />
            Join video call
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="min-w-0">
          <SOAPEditor
            ref={soapEditorRef}
            appointment={appointment || undefined}
            initialNote={record ? {
              id: record.id,
              appointment_id: record.appointment_id || undefined,
              subjective: record.subjective || "",
              objective: record.objective || "",
              assessment: record.assessment || "",
              plan: record.plan || "",
              body_map_annotations: Array.isArray(record.body_map_annotations) ? record.body_map_annotations : [],
              status: record.status as "draft" | "finalized" | "amended",
            } : undefined}
            onSave={handleSave}
            onFinalize={handleFinalize}
            onAmend={handleAmend}
            readOnly={false}
            parentRecordId={record?.parent_record_id || null}
            version={record?.version || 1}
          />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <VoiceNoteAssistant
            onApplySoap={(soap): ApplySoapResult => {
              if (!soapEditorRef.current) return "unavailable";
              return soapEditorRef.current.applySoap(soap);
            }}
            applyDisabled={record?.status === "finalized"}
          />
        </div>
      </div>
    </div>
  );
}
