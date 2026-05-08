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
          onboarding_completed_at: string | null;
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
          onboarding_completed_at?: string | null;
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
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      patient_therapists: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          relationship_status: "active" | "inactive";
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          therapist_id: string;
          relationship_status?: "active" | "inactive";
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          therapist_id?: string;
          relationship_status?: "active" | "inactive";
          created_at?: string;
        };
        Relationships: [];
      };
      therapist_invites: {
        Row: {
          id: string;
          email: string;
          role: "therapist" | "admin";
          token: string;
          status: "pending" | "accepted" | "expired" | "revoked";
          invited_by: string | null;
          accepted_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: "therapist" | "admin";
          token: string;
          status?: "pending" | "accepted" | "expired" | "revoked";
          invited_by?: string | null;
          accepted_by?: string | null;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "therapist" | "admin";
          token?: string;
          status?: "pending" | "accepted" | "expired" | "revoked";
          invited_by?: string | null;
          accepted_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exercise_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          body_region: string | null;
          recovery_phase: string | null;
          goal: string | null;
          equipment: string | null;
          difficulty: string | null;
          precautions: string | null;
          image_url: string | null;
          video_url: string | null;
          created_by: string | null;
          is_curated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          body_region?: string | null;
          recovery_phase?: string | null;
          goal?: string | null;
          equipment?: string | null;
          difficulty?: string | null;
          precautions?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          created_by?: string | null;
          is_curated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          body_region?: string | null;
          recovery_phase?: string | null;
          goal?: string | null;
          equipment?: string | null;
          difficulty?: string | null;
          precautions?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          created_by?: string | null;
          is_curated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_plans: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          title: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          therapist_id: string;
          title: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          therapist_id?: string;
          title?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_plan_items: {
        Row: {
          id: string;
          exercise_plan_id: string;
          exercise_template_id: string;
          sequence_order: number;
          sets: number | null;
          reps: number | null;
          hold_seconds: number | null;
          rest_seconds: number | null;
          frequency_per_week: number | null;
          days_of_week: string[] | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exercise_plan_id: string;
          exercise_template_id: string;
          sequence_order?: number;
          sets?: number | null;
          reps?: number | null;
          hold_seconds?: number | null;
          rest_seconds?: number | null;
          frequency_per_week?: number | null;
          days_of_week?: string[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exercise_plan_id?: string;
          exercise_template_id?: string;
          sequence_order?: number;
          sets?: number | null;
          reps?: number | null;
          hold_seconds?: number | null;
          rest_seconds?: number | null;
          frequency_per_week?: number | null;
          days_of_week?: string[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_sessions: {
        Row: {
          id: string;
          patient_id: string;
          exercise_plan_id: string | null;
          exercise_plan_item_id: string | null;
          exercise_template_id: string | null;
          started_at: string;
          completed_at: string | null;
          total_sets_completed: number | null;
          total_reps_completed: number | null;
          average_pain_score: number | null;
          average_effort: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          exercise_plan_id?: string | null;
          exercise_plan_item_id?: string | null;
          exercise_template_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          total_sets_completed?: number | null;
          total_reps_completed?: number | null;
          average_pain_score?: number | null;
          average_effort?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          exercise_plan_id?: string | null;
          exercise_plan_item_id?: string | null;
          exercise_template_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          total_sets_completed?: number | null;
          total_reps_completed?: number | null;
          average_pain_score?: number | null;
          average_effort?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exercise_recommendations: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          exercise_plan_id: string | null;
          exercise_plan_item_id: string | null;
          recommendation_type: string;
          status: string;
          title: string;
          body: string | null;
          is_patient_visible: boolean;
          created_by_system: boolean;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          therapist_id: string;
          exercise_plan_id?: string | null;
          exercise_plan_item_id?: string | null;
          recommendation_type?: string;
          status?: string;
          title: string;
          body?: string | null;
          is_patient_visible?: boolean;
          created_by_system?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          therapist_id?: string;
          exercise_plan_id?: string | null;
          exercise_plan_item_id?: string | null;
          recommendation_type?: string;
          status?: string;
          title?: string;
          body?: string | null;
          is_patient_visible?: boolean;
          created_by_system?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      exercise_form_feedback: {
        Row: {
          id: string;
          exercise_session_id: string;
          patient_id: string;
          raw_metrics: Json | null;
          form_score: number | null;
          flags: string[] | null;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_session_id: string;
          patient_id: string;
          raw_metrics?: Json | null;
          form_score?: number | null;
          flags?: string[] | null;
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_session_id?: string;
          patient_id?: string;
          raw_metrics?: Json | null;
          form_score?: number | null;
          flags?: string[] | null;
          comments?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
      create_patient_profile_by_email: {
        Args: {
          patient_email: string;
          patient_full_name?: string | null;
          patient_phone?: string | null;
          patient_dob?: string | null;
          patient_insurance_provider?: string | null;
          patient_insurance_id?: string | null;
          patient_emergency_contact_name?: string | null;
          patient_emergency_contact_phone?: string | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
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

/** Exercise template row from `exercise_templates` table. */
export type ExerciseTemplate = Database["public"]["Tables"]["exercise_templates"]["Row"];

/** Exercise plan row from `exercise_plans` table. */
export type ExercisePlan = Database["public"]["Tables"]["exercise_plans"]["Row"];

/** Exercise plan item row from `exercise_plan_items` table. */
export type ExercisePlanItem = Database["public"]["Tables"]["exercise_plan_items"]["Row"];

/** Exercise session row from `exercise_sessions` table. */
export type ExerciseSession = Database["public"]["Tables"]["exercise_sessions"]["Row"];

/** Exercise recommendation row from `exercise_recommendations` table. */
export type ExerciseRecommendation =
  Database["public"]["Tables"]["exercise_recommendations"]["Row"];

/** Therapist invite row from `therapist_invites` table. */
export type TherapistInvite = Database["public"]["Tables"]["therapist_invites"]["Row"];

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
