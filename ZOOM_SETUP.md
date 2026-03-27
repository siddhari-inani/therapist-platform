# Zoom integration setup

The platform can create Zoom meetings directly when you schedule an appointment. The "Create Zoom meeting" button in the appointment form calls the Zoom API and fills in the video call link for you.

## 1. Create a Zoom Server-to-Server OAuth app

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/).
2. Sign in and click **Develop** → **Build App**.
3. Choose **Server-to-Server OAuth** and create the app.
4. Fill in app name and other required fields.
5. In **Scopes**, add:
   - `meeting:write` – create meetings
   - `user:read` – list users (so we can pick the meeting host)
6. Activate the app and copy the **Account ID**, **Client ID**, and **Client Secret** from the app credentials page.

## 2. Add credentials to `.env.local`

```env
ZOOM_ACCOUNT_ID=your-account-id
ZOOM_CLIENT_ID=your-client-id
ZOOM_CLIENT_SECRET=your-client-secret
```

Optional: if your Zoom account has multiple users and you want meetings created by a specific user, set:

```env
ZOOM_USER_ID=your-zoom-user-id-or-email
```

If `ZOOM_USER_ID` is not set, the app uses the first active user in the account.

## 3. Use it in the app

1. Open **Calendar** and create a new appointment (or use an existing flow that uses the appointment form).
2. Set **Start time** and **End time**.
3. Click **Create Zoom meeting**. A new scheduled Zoom meeting is created and the **Video call link** field is filled with the join URL.
4. Save the appointment. You and the patient can join the video call from the dashboard, patient appointments, or charting page.

Meetings are created with:
- Start time and duration matching the appointment
- Join before host enabled
- Waiting room off (you can change this in Zoom settings if needed)
