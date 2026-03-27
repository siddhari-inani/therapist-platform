# Setting Up Patient Creation for Therapists

This guide explains how to enable therapists to create patient profiles directly from the dashboard.

## Overview

Therapists can now create patient profiles in two ways:

1. **Full Creation (Recommended)**: Creates both auth user and profile automatically
2. **Profile Only**: Creates profile only (auth user must exist first)

## Setup Options

### Option 1: Full Automatic Creation (Best Experience)

This allows therapists to create both the auth user and profile with a single click.

#### Step 1: Get Service Role Key

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Find **"service_role"** key (NOT the anon key)
3. Copy this key

#### Step 2: Add to Environment Variables

Add to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **IMPORTANT**: Never expose this key in client-side code! It's only used in the API route.

#### Step 3: Restart Your Dev Server

```bash
npm run dev
```

### Option 2: Profile Only (Manual Auth User Creation)

If you don't want to use the service role key, therapists can:

1. Create the auth user in Supabase Dashboard first
2. Then use the form to create the profile

## How It Works

### With Service Role Key (Option 1)

1. Therapist fills out the patient form
2. Clicks "Create Patient Profile"
3. System automatically:
   - Creates auth user (if doesn't exist)
   - Creates patient profile
   - Links them together

### Without Service Role Key (Option 2)

1. Therapist creates auth user in Supabase Dashboard:
   - Go to Authentication → Users → Add user
   - Enter email and password
   - Check "Auto Confirm User" ✅
2. Therapist fills out the patient form (leave password empty)
3. Clicks "Create Patient Profile"
4. System creates the profile only

## Security Notes

- **Service Role Key**: Has admin privileges. Keep it secret!
- **RLS Policies**: Still apply - therapists can only create patient profiles
- **API Route**: The `/api/patients/create` route should be protected in production

## Testing

1. Log in as a therapist
2. Go to `/dashboard/patients`
3. Click "Add Patient"
4. Fill out the form
5. Click "Create Patient Profile"

## Troubleshooting

### Error: "Server configuration error"
- Service role key is missing from `.env.local`
- Add `SUPABASE_SERVICE_ROLE_KEY=...` to your `.env.local`

### Error: "Auth user with email ... does not exist"
- Auth user must be created first (if not using service role)
- Or provide password in form to create new user

### Error: "Only therapists can create patient profiles"
- Make sure you're logged in as a therapist
- Check your profile has `role = 'therapist'`

## Production Considerations

1. **Protect API Route**: Add authentication middleware to `/api/patients/create`
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Input Validation**: Already implemented, but review for your use case
4. **Audit Logging**: Consider logging all patient creations

## Files Created

- `components/patients/patient-form.tsx` - Patient creation form
- `app/api/patients/create/route.ts` - API route for creating patients
- `supabase/migrations/20240107000000_allow_therapists_create_patients.sql` - RLS policies
