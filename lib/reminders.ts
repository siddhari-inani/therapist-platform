import { createServiceClient } from "@/lib/supabase/service";
import { sendAppointmentReminderEmail } from "@/lib/email";
import { sendAppointmentReminderSms, isSmsConfigured } from "@/lib/sms";

const REMINDER_HOURS_BEFORE = Math.max(
  1,
  Math.min(168, Number(process.env.REMINDER_HOURS_BEFORE) || 24)
);

type AppointmentRow = {
  id: string;
  start_time: string;
  title: string | null;
  therapist_id: string;
  patient_id: string;
  reminder_email_sent_at: string | null;
  reminder_sms_sent_at: string | null;
};

type ProfileRow = {
  full_name: string | null;
  email: string;
  phone: string | null;
};

export type ReminderResult = {
  appointmentId: string;
  emailSent: boolean;
  emailError?: string;
  smsSent: boolean;
  smsError?: string;
};

export async function runAppointmentReminders(): Promise<{
  ok: boolean;
  results: ReminderResult[];
  error?: string;
}> {
  const supabase = createServiceClient();
  const now = new Date();
  const windowStart = new Date(now.getTime());
  windowStart.setHours(windowStart.getHours() + REMINDER_HOURS_BEFORE - 1);
  const windowEnd = new Date(now.getTime());
  windowEnd.setHours(windowEnd.getHours() + REMINDER_HOURS_BEFORE);

  const windowStartIso = windowStart.toISOString();
  const windowEndIso = windowEnd.toISOString();

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, start_time, title, therapist_id, patient_id, reminder_email_sent_at, reminder_sms_sent_at")
    .in("status", ["scheduled", "confirmed"])
    .gte("start_time", windowStartIso)
    .lt("start_time", windowEndIso)
    .is("reminder_email_sent_at", null)
    .order("start_time", { ascending: true });

  if (appointmentsError) {
    return {
      ok: false,
      results: [],
      error: appointmentsError.message,
    };
  }

  const list = (appointments ?? []) as AppointmentRow[];
  const results: ReminderResult[] = [];

  for (const apt of list) {
    const result: ReminderResult = {
      appointmentId: apt.id,
      emailSent: false,
      smsSent: false,
    };

    const startTime = new Date(apt.start_time);

    const { data: patient } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", apt.patient_id)
      .single();

    const { data: therapist } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", apt.therapist_id)
      .single();

    const patientProfile = patient as ProfileRow | null;
    const therapistName = (therapist as { full_name: string | null } | null)?.full_name ?? "Your therapist";

    let emailSent = false;
    let smsSent = false;

    if (patientProfile?.email) {
      const emailResult = await sendAppointmentReminderEmail({
        to: patientProfile.email,
        patientName: patientProfile.full_name ?? undefined,
        therapistName,
        startTime,
        title: apt.title,
      });
      result.emailSent = emailResult.success;
      result.emailError = emailResult.error;
      emailSent = emailResult.success;
    } else {
      result.emailError = "Patient has no email";
    }

    if (isSmsConfigured() && patientProfile?.phone) {
      const smsResult = await sendAppointmentReminderSms({
        to: patientProfile.phone,
        patientName: patientProfile.full_name ?? undefined,
        therapistName,
        startTime,
        title: apt.title,
      });
      result.smsSent = smsResult.success;
      result.smsError = smsResult.error;
      smsSent = smsResult.success;
    }

    if (emailSent || smsSent) {
      await supabase
        .from("appointments")
        .update({
          ...(emailSent && { reminder_email_sent_at: new Date().toISOString() }),
          ...(smsSent && { reminder_sms_sent_at: new Date().toISOString() }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", apt.id);
    }
    results.push(result);
  }

  return { ok: true, results };
}
