-- =============================================================================
-- ADD PATIENT AS THERAPIST - SQL Script
-- =============================================================================
-- 
-- This script shows how therapists can add patients using the new functions.
-- 
-- IMPORTANT: The auth user must be created FIRST in Supabase Dashboard:
--   1. Go to Authentication → Users → Add user
--   2. Create the user with email and password
--   3. Auto Confirm User: ✅
--   4. Then run one of the options below
-- =============================================================================

-- =============================================================================
-- OPTION 1: Using create_patient_profile_by_email (EASIEST)
-- =============================================================================
-- Just provide the email and patient details. The function will find the auth user.

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

-- =============================================================================
-- OPTION 2: Using create_patient_profile (with user ID)
-- =============================================================================
-- If you know the auth user ID, you can use this function directly.

-- First, get the user ID:
-- SELECT id FROM auth.users WHERE email = 'patient@example.com';

-- Then create the profile:
/*
SELECT public.create_patient_profile(
  patient_user_id := 'USER_ID_HERE',  -- Replace with actual UUID
  patient_email := 'patient@example.com',
  patient_full_name := 'John Doe',
  patient_phone := '+1-555-0100',
  patient_dob := '1990-01-15',
  patient_insurance_provider := 'Blue Cross Blue Shield',
  patient_insurance_id := 'BC123456789',
  patient_emergency_contact_name := 'Jane Doe',
  patient_emergency_contact_phone := '+1-555-0101'
);
*/

-- =============================================================================
-- OPTION 3: Direct INSERT (if you're logged in as a therapist)
-- =============================================================================
-- You can also insert directly if you're logged in as a therapist.
-- The RLS policy will automatically allow it.

/*
INSERT INTO public.profiles (
  id,
  role,
  email,
  full_name,
  phone,
  date_of_birth,
  insurance_provider,
  insurance_id,
  emergency_contact_name,
  emergency_contact_phone
)
SELECT 
  au.id,
  'patient',
  au.email,
  'John Doe',
  '+1-555-0100',
  '1990-01-15',
  'Blue Cross Blue Shield',
  'BC123456789',
  'Jane Doe',
  '+1-555-0101'
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
*/

-- =============================================================================
-- VERIFY: Check Patient Was Created
-- =============================================================================

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.phone,
  p.date_of_birth,
  p.insurance_provider,
  au.email_confirmed_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ Profile Missing'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email Not Confirmed'
    ELSE '✅ Patient Ready'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'patient@example.com';
