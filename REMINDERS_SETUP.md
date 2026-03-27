# Appointment reminders setup

The platform sends appointment reminders by **email** (and optionally **SMS**) to patients before their scheduled appointments. A cron job runs periodically and sends reminders for appointments falling within the configured window (e.g. 24 hours before).

## 1. Email (Resend)

Reminders are sent via [Resend](https://resend.com).

1. Sign up at [resend.com](https://resend.com) and get an API key from **API Keys**.
2. Add to `.env` or `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```

3. **From address** (optional):
   - Resend’s free tier lets you send from `onboarding@resend.dev` to your own email for testing.
   - For production, verify a domain in Resend and set:

```env
REMINDER_FROM_EMAIL=reminders@yourdomain.com
```

If you don’t set `REMINDER_FROM_EMAIL`, the app uses `onboarding@resend.dev` (Resend’s default test sender).

## 2. Reminder window

Reminders are sent when an appointment’s start time falls within a 1‑hour window before the “reminder time”:

- **REMINDER_HOURS_BEFORE** (optional, default `24`): “Remind X hours before appointment.”
- The cron runs every hour and sends reminders for appointments that start between `(now + X - 1) hours` and `(now + X) hours`.

Example: `REMINDER_HOURS_BEFORE=24` and cron at 10:00 → reminders for appointments starting between 09:00 and 10:00 **tomorrow**.

## 3. Cron (scheduling)

The job is implemented as an API route: **GET or POST** `/api/cron/reminders`.

### Option A: Vercel Cron (recommended on Vercel)

A `vercel.json` cron is already configured to call this route **every hour**:

```json
"crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }]
```

On Vercel, deploy the app and the cron will run automatically. (Cron jobs require a Vercel Pro plan or higher.)

### Option B: External cron

Use any cron service (e.g. [cron-job.org](https://cron-job.org), GitHub Actions, or a server cron) to call your app every hour:

```bash
# Example: every hour
curl -X GET "https://your-domain.com/api/cron/reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Set **CRON_SECRET** in your environment and pass it as:

- `Authorization: Bearer <CRON_SECRET>`, or  
- `x-cron-secret: <CRON_SECRET>`

If `CRON_SECRET` is set, the route rejects requests that don’t send one of these. If `CRON_SECRET` is not set, the route runs without auth (useful for local testing).

### Option C: Local / manual testing

Run the job once without a scheduler:

```bash
# Without auth (if CRON_SECRET is not set)
curl http://localhost:3000/api/cron/reminders

# With auth
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/reminders
```

## 4. SMS (optional, Twilio)

To also send **SMS** reminders:

1. Create a [Twilio](https://www.twilio.com) account and get:
   - Account SID  
   - Auth Token  
   - A Twilio phone number (e.g. +1…)
2. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

3. Ensure **patients** have a **phone** set in their profile (the reminder is sent to that number).

If Twilio env vars are not set, only email reminders are sent.

## 5. Environment summary

| Variable                  | Required | Description                                      |
|---------------------------|----------|--------------------------------------------------|
| `RESEND_API_KEY`          | Yes*     | Resend API key for email reminders               |
| `REMINDER_FROM_EMAIL`     | No       | Sender address (default: `onboarding@resend.dev`)|
| `REMINDER_HOURS_BEFORE`   | No       | Hours before appointment (default: 24)           |
| `CRON_SECRET`             | No**     | Secret to protect `/api/cron/reminders`           |
| `TWILIO_ACCOUNT_SID`      | No       | For SMS reminders                                |
| `TWILIO_AUTH_TOKEN`       | No       | For SMS reminders                                |
| `TWILIO_PHONE_NUMBER`     | No       | From number for SMS                              |

\* Required for email reminders. If missing, the job still runs but no email is sent.  
\** Required if you want to lock the cron route; recommended in production when using an external cron.

## 6. Behaviour

- **Eligible appointments**: Status `scheduled` or `confirmed`, start time in the reminder window, and `reminder_email_sent_at` is still `null` (so we send at most one email reminder per appointment).
- **Recipients**: Patient’s **email** (required for email), patient’s **phone** (optional, only if SMS is configured).
- After sending, the app sets `reminder_email_sent_at` and/or `reminder_sms_sent_at` on the appointment so the same reminder is not sent again.

## 7. Dependencies

Resend is used for email. Install if needed:

```bash
npm install
```

SMS uses Twilio’s REST API over `fetch`; no Twilio npm package is required.
