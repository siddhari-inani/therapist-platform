import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.REMINDER_FROM_EMAIL ?? "onboarding@resend.dev";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

export type SendReminderEmailParams = {
  to: string;
  patientName: string;
  therapistName: string;
  startTime: Date;
  title?: string | null;
};

export async function sendAppointmentReminderEmail(
  params: SendReminderEmailParams
): Promise<{ success: boolean; error?: string }> {
  const client = getResend();
  if (!client) {
    return { success: false, error: "RESEND_API_KEY is not set" };
  }

  const { to, patientName, therapistName, startTime, title } = params;
  const formattedDate = startTime.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startTime.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = `Reminder: Your appointment${title ? ` – ${title}` : ""} is coming up`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.25rem; color: #0f172a;">Appointment reminder</h1>
  <p>Hi${patientName ? ` ${patientName}` : ""},</p>
  <p>This is a reminder that you have an upcoming appointment:</p>
  <ul style="list-style: none; padding: 0;">
    <li><strong>When:</strong> ${formattedDate} at ${formattedTime}</li>
    <li><strong>With:</strong> ${therapistName}</li>
    ${title ? `<li><strong>Subject:</strong> ${title}</li>` : ""}
  </ul>
  <p>If you need to reschedule or cancel, please contact your therapist.</p>
  <p style="color: #64748b; font-size: 0.875rem; margin-top: 32px;">This is an automated reminder from your therapy practice.</p>
</body>
</html>
  `.trim();

  try {
    const { error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { success: false, error: message };
  }
}
