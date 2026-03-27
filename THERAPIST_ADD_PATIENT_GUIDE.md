# How Therapists Can Add Patients

This guide explains how therapists can now add multiple patients directly from their dashboard.

## Overview

Therapists can now:
- ✅ Create patient profiles directly (after auth user is created)
- ✅ Update patient information
- ✅ Manage multiple patients from their dashboard

## Step-by-Step Process

### Step 1: Create Auth User in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** or **"Invite user"**
3. Fill in:
   - **Email**: `patient@example.com`
   - **Password**: (choose a secure password)
   - **Auto Confirm User**: ✅ (IMPORTANT - check this box)
   - **User Metadata** (optional):
     ```json
     {
       "role": "patient",
       "full_name": "John Doe"
     }
     ```
4. Click **"Create user"**

### Step 2: Create Patient Profile

You have **three options** to create the patient profile:

#### Option A: Using the Helper Function (Recommended)

Run this SQL in Supabase SQL Editor (while logged in as a therapist):

```sql
SELECT public.create_patient_profile_by_email(
  patient_email := 'patient@example.com',
  patient_full_name := 'John Doe',
  patient_phone := '+1-555-0100',
  patient_dob := '1990-01-15',
  patient_insurance_provider := 'Blue Cross Blue Shield',
  patient_insurance_id := 'BC123456789',
  patient_emergency_contact_name := 'Jane Doe',
  patient_emergency_contact_phone := '+1-555-0101'
);
```

#### Option B: Direct INSERT (Simplest)

If you're logged in as a therapist, you can insert directly:

```sql
INSERT INTO public.profiles (
  id, role, email, full_name, phone, date_of_birth,
  insurance_provider, insurance_id,
  emergency_contact_name, emergency_contact_phone
)
SELECT 
  au.id, 'patient', au.email, 'John Doe', '+1-555-0100', '1990-01-15',
  'Blue Cross Blue Shield', 'BC123456789',
  'Jane Doe', '+1-555-0101'
FROM auth.users au
WHERE au.email = 'patient@example.com'
ON CONFLICT (id) DO UPDATE
SET
  role = 'patient',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  phone = COALESCE(EXCLUDED.phone, profiles.phone),
  date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
  insurance_provider = COALESCE(EXCLUDED.insurance_provider, profiles.insurance_provider),
  insurance_id = COALESCE(EXCLUDED.insurance_id, profiles.insurance_id),
  emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, profiles.emergency_contact_name),
  emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, profiles.emergency_contact_phone);
```

#### Option C: Using User ID

If you know the auth user ID:

```sql
SELECT public.create_patient_profile(
  patient_user_id := 'USER_ID_HERE',  -- Get from: SELECT id FROM auth.users WHERE email = 'patient@example.com';
  patient_email := 'patient@example.com',
  patient_full_name := 'John Doe',
  patient_phone := '+1-555-0100'
  -- ... other fields
);
```

## What Changed?

### New RLS Policies

1. **"Therapists can create patient profiles"**
   - Allows therapists to INSERT patient profiles
   - Only allows creating profiles with `role = 'patient'`

2. **"Therapists can update patient profiles"**
   - Allows therapists to UPDATE patient profiles
   - Prevents changing role from 'patient' to something else

### New Functions

1. **`create_patient_profile(user_id, ...)`**
   - Creates a patient profile for a given auth user ID
   - Validates that caller is a therapist
   - Validates that auth user exists

2. **`create_patient_profile_by_email(email, ...)`**
   - Simpler version that looks up user by email
   - Same validations as above

## Verification

After creating a patient, verify it worked:

```sql
SELECT 
  p.email,
  p.full_name,
  p.role,
  '✅ Patient created successfully!' as status
FROM public.profiles p
WHERE p.email = 'patient@example.com';
```

## Important Notes

1. **Auth User Must Exist First**: Always create the auth user in Supabase Dashboard before creating the profile
2. **Therapist Login Required**: You must be logged in as a therapist to create patients
3. **Role Restriction**: Therapists can only create/update patient profiles (not other therapists or admins)
4. **Email Matching**: The email in the profile must match the auth user's email

## Troubleshooting

### Error: "Only therapists can create patient profiles"
- Make sure you're logged in as a therapist
- Verify your profile has `role = 'therapist'`

### Error: "Auth user with email ... does not exist"
- Create the auth user in Supabase Dashboard first
- Make sure the email matches exactly

### Error: "Email ... does not match the auth user"
- The email you provide must match the auth user's email
- Check: `SELECT email FROM auth.users WHERE id = 'USER_ID';`

## Next Steps

After creating patients, therapists can:
- View them in `/dashboard/patients`
- Schedule appointments in `/dashboard/calendar`
- Create SOAP notes in `/dashboard/charting`
- Update patient information in `/dashboard/patients/[id]/edit`
