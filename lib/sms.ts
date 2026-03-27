const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export function isSmsConfigured(): boolean {
  return Boolean(accountSid && authToken && fromNumber);
}

export type SendReminderSmsParams = {
  to: string;
  patientName: string;
  therapistName: string;
  startTime: Date;
  title?: string | null;
};

export async function sendAppointmentReminderSms(
  params: SendReminderSmsParams
): Promise<{ success: boolean; error?: string }> {
  if (!isSmsConfigured()) {
    return { success: false, error: "Twilio is not configured" };
  }

  const { to, patientName, therapistName, startTime, title } = params;
  const formattedDate = startTime.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startTime.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const body = [
    "Appointment reminder:",
    `${formattedDate} at ${formattedTime} with ${therapistName}.`,
    title ? `Subject: ${title}.` : "",
    "Contact your therapist to reschedule or cancel.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber!,
        Body: body,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.message ?? response.statusText ?? "Failed to send SMS";
      return { success: false, error: message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send SMS";
    return { success: false, error: message };
  }
}
