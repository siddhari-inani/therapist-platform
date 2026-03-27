# Patients Without Authentication

## Overview

Patients in Revora Health are **data records only** - they don't need authentication accounts. This simplifies patient management for therapists.

## What Changed

### Before
- Patients required auth.users entries
- Therapists had to create auth users first, then profiles
- More complex setup process

### After
- Patients are just profile records in the database
- Therapists can create patients directly from the dashboard
- No auth user creation needed
- Simpler, faster patient onboarding

## How It Works

1. **Therapist logs in** (therapists still need auth accounts)
2. **Therapist creates patient** via the dashboard form
3. **System generates UUID** for the patient (not linked to auth.users)
4. **Patient profile created** with all information
5. **Patient can be scheduled** for appointments immediately

## Database Schema

- **profiles.id**: UUID (no longer references auth.users)
- **profiles.role**: 'patient', 'therapist', or 'admin'
- **Therapists/Admins**: Still link to auth.users (id matches auth.users.id)
- **Patients**: Just have UUIDs (no auth.users entry)

## Migration

Run the migration:
```sql
-- File: supabase/migrations/20240108000000_remove_auth_requirement_for_patients.sql
```

This migration:
1. Removes the FK constraint from profiles.id
2. Updates the create_patient_profile function to generate UUIDs
3. Updates RLS policies to allow patient creation

## Creating Patients

### Via Dashboard (Recommended)

1. Go to `/dashboard/patients`
2. Click "Add Patient"
3. Fill in patient information
4. Click "Create Patient Profile"
5. Done! No auth user needed.

### Via SQL (For Bulk Import)

```sql
-- As a therapist, you can create patients directly:
INSERT INTO public.profiles (
  id, role, email, full_name, phone, date_of_birth
)
VALUES (
  gen_random_uuid(),  -- Generate UUID
  'patient',
  'patient@example.com',
  'John Doe',
  '+1-555-0100',
  '1990-01-15'
);
```

Or use the function:
```sql
SELECT public.create_patient_profile(
  patient_email := 'patient@example.com',
  patient_full_name := 'John Doe',
  patient_phone := '+1-555-0100'
);
```

## Benefits

✅ **Simpler**: No need to create auth users first  
✅ **Faster**: One-step patient creation  
✅ **Secure**: Patients can't log in (data records only)  
✅ **Flexible**: Easy to import/manage patient data  
✅ **HIPAA-friendly**: Patient data is still protected by RLS

## Important Notes

- **Therapists/Admins**: Still need auth accounts (for login)
- **Patients**: Cannot log in (they're data records only)
- **Appointments**: Still work normally (linked by patient_id)
- **SOAP Notes**: Still work normally (linked by patient_id)
- **RLS Policies**: Still protect patient data (therapists can only see their patients)

## Troubleshooting

### Error: "Only therapists can create patient profiles"
- Make sure you're logged in as a therapist
- Check your profile has `role = 'therapist'`

### Error: "Foreign key constraint violation"
- Make sure you ran the migration
- The FK constraint should be removed

### Patients not showing up
- Check RLS policies are correct
- Verify therapist_id matches your auth.uid()
