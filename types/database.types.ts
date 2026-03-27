/**
 * Supabase database types for Practice Management Platform.
 * Matches schema: profiles, appointments.
 * Generate/refresh via: npx supabase gen types typescript --project-id <id> > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "admin" | "therapist" | "patient";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type TreatmentType =
  | "initial_evaluation"
  | "follow_up"
  | "manual_therapy"
  | "exercise_therapy"
  | "electrical_stimulation"
  | "other";

export type RecordStatus = "draft" | "finalized" | "amended";

export type MilestoneStatus = "completed" | "in_progress" | "future";

export type MilestoneCategory =
  | "surgery"
  | "rom_goal"
  | "strength_goal"
  | "functional_goal"
  | "discharge"
  | "initial_evaluation"
  | "other";

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "canceled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          license_number: string | null;
          specialties: string[];
          bio: string | null;
          timezone: string | null;
          language: string | null;
          date_of_birth: string | null;
          insurance_provider: string | null;
          insurance_id: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          stripe_account_id: string | null;
          stripe_customer_id: string | null;
        };
        Insert: {
          id: string;
          role: ProfileRole;
          full_name?: string | null;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          license_number?: string | null;
          specialties?: string[];
          bio?: string | null;
          timezone?: string | null;
          language?: string | null;
          date_of_birth?: string | null;
          insurance_provider?: string | null;
          insurance_id?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string | null;
          email?: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          license_number?: string | null;
          specialties?: string[];
          bio?: string | null;
          timezone?: string | null;
          language?: string | null;
          date_of_birth?: string | null;
          insurance_provider?: string | null;
          insurance_id?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
        };
      };
      appointments: {
        Row: {
          id: string;
          therapist_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          treatment_type: TreatmentType;
          title: string | null;
          notes: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          parent_appointment_id: string | null;
          reminder_email_sent_at: string | null;
          reminder_sms_sent_at: string | null;
          video_call_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          treatment_type?: TreatmentType;
          title?: string | null;
          notes?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          parent_appointment_id?: string | null;
          reminder_email_sent_at?: string | null;
          reminder_sms_sent_at?: string | null;
          video_call_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          therapist_id?: string;
          patient_id?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          treatment_type?: TreatmentType;
          title?: string | null;
          notes?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          parent_appointment_id?: string | null;
          reminder_email_sent_at?: string | null;
          reminder_sms_sent_at?: string | null;
          video_call_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          appointment_id: string | null;
          therapist_id: string;
          patient_id: string;
          amount_cents: number;
          currency: string;
          status: PaymentStatus;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_charge_id: string | null;
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          therapist_id: string;
          patient_id: string;
          amount_cents: number;
          currency?: string;
          status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_charge_id?: string | null;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string | null;
          therapist_id?: string;
          patient_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_charge_id?: string | null;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      medical_records: {
        Row: {
          id: string;
          appointment_id: string | null;
          therapist_id: string;
          patient_id: string;
          subjective: string | null;
          objective: string | null;
          assessment: string | null;
          plan: string | null;
          body_map_annotations: Json;
          status: RecordStatus;
          version: number;
          parent_record_id: string | null;
          finalized_at: string | null;
          finalized_by: string | null;
          therapist_signature: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          therapist_id: string;
          patient_id: string;
          subjective?: string | null;
          objective?: string | null;
          assessment?: string | null;
          plan?: string | null;
          body_map_annotations?: Json;
          status?: RecordStatus;
          version?: number;
          parent_record_id?: string | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          therapist_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string | null;
          therapist_id?: string;
          patient_id?: string;
          subjective?: string | null;
          objective?: string | null;
          assessment?: string | null;
          plan?: string | null;
          body_map_annotations?: Json;
          status?: RecordStatus;
          version?: number;
          parent_record_id?: string | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          therapist_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          patient_id: string | null;
          subject: string | null;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          patient_id?: string | null;
          subject?: string | null;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          patient_id?: string | null;
          subject?: string | null;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      recovery_milestones: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          title: string;
          description: string | null;
          status: MilestoneStatus;
          category: MilestoneCategory;
          target_date: string | null;
          completed_date: string | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          therapist_id: string;
          title: string;
          description?: string | null;
          status?: MilestoneStatus;
          category?: MilestoneCategory;
          target_date?: string | null;
          completed_date?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          therapist_id?: string;
          title?: string;
          description?: string | null;
          status?: MilestoneStatus;
          category?: MilestoneCategory;
          target_date?: string | null;
          completed_date?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      finalize_medical_record: {
        Args: {
          record_id: string;
        };
        Returns: string;
      };
      mark_message_read: {
        Args: {
          msg_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      treatment_type: TreatmentType;
      record_status: RecordStatus;
      milestone_status: MilestoneStatus;
      milestone_category: MilestoneCategory;
    };
  };
}

/** Profile row from `profiles` table. */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Profile insert payload. */
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

/** Profile update payload. */
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/** Appointment row from `appointments` table. */
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

/** Appointment insert payload. */
export type AppointmentInsert =
  Database["public"]["Tables"]["appointments"]["Insert"];

/** Appointment update payload. */
export type AppointmentUpdate =
  Database["public"]["Tables"]["appointments"]["Update"];

/** Medical record row from `medical_records` table. */
export type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"];

/** Medical record insert payload. */
export type MedicalRecordInsert =
  Database["public"]["Tables"]["medical_records"]["Insert"];

/** Medical record update payload. */
export type MedicalRecordUpdate =
  Database["public"]["Tables"]["medical_records"]["Update"];

/** Message row from `messages` table. */
export type Message = Database["public"]["Tables"]["messages"]["Row"];

/** Message insert payload. */
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

/** Message update payload. */
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

/** Recovery milestone row from `recovery_milestones` table. */
export type RecoveryMilestone = Database["public"]["Tables"]["recovery_milestones"]["Row"];

/** Recovery milestone insert payload. */
export type RecoveryMilestoneInsert =
  Database["public"]["Tables"]["recovery_milestones"]["Insert"];

/** Recovery milestone update payload. */
export type RecoveryMilestoneUpdate =
  Database["public"]["Tables"]["recovery_milestones"]["Update"];

/** Review row (reviews table; add to Database if you run migrations for reviews). */
export interface Review {
  id: string;
  therapist_id: string;
  patient_id: string;
  rating: number;
  reviewer_name: string | null;
  comment: string | null;
  created_at: string;
  updated_at?: string;
}

/** Review insert payload. */
export interface ReviewInsert {
  therapist_id: string;
  patient_id: string;
  rating: number;
  reviewer_name?: string | null;
  comment?: string | null;
}
