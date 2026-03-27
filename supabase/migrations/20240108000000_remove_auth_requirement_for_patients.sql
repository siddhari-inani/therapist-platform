-- =============================================================================
-- Remove Auth User Requirement for Patients
-- =============================================================================
-- This migration allows patients to exist as profiles without requiring
-- an auth.users entry. Patients are just data records managed by therapists.
-- =============================================================================

-- =============================================================================
-- Step 1: Remove foreign key constraint from profiles.id
-- =============================================================================
-- Patients don't need auth.users entries, so we remove the FK constraint
-- Therapists and admins will still have their id match auth.users(id) manually
-- But patients will just have random UUIDs

-- Drop the foreign key constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Note: We keep the id as UUID PRIMARY KEY, but it no longer references auth.users
-- For therapists/admins: id should match auth.users(id) (enforced manually)
-- For patients: id is just a UUID (no auth.users entry needed)

-- =============================================================================
-- Step 2: Update the handle_new_user trigger to only create profiles for non-patients
-- =============================================================================
-- Or we can keep it as is, but patients won't go through auth signup

-- =============================================================================
-- Step 3: Update RLS policies to allow therapists to create patient profiles
-- =============================================================================
-- The existing policy "Therapists can create patient profiles" should work
-- But we need to make sure it doesn't require auth.uid() to match

-- =============================================================================
-- Step 4: Update create_patient_profile function to generate UUIDs
-- =============================================================================

-- Drop old versions of the function (with different signatures)
DROP FUNCTION IF EXISTS public.create_patient_profile(UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_patient_profile(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_patient_profile_by_email(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT);

-- New function that generates UUID for patient (no auth user needed)
CREATE OR REPLACE FUNCTION public.create_patient_profile(
  patient_email TEXT,
  patient_full_name TEXT DEFAULT NULL,
  patient_phone TEXT DEFAULT NULL,
  patient_dob DATE DEFAULT NULL,
  patient_insurance_provider TEXT DEFAULT NULL,
  patient_insurance_id TEXT DEFAULT NULL,
  patient_emergency_contact_name TEXT DEFAULT NULL,
  patient_emergency_contact_phone TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  therapist_profile public.profiles;
  new_patient_id UUID;
  new_patient_profile public.profiles;
BEGIN
  -- Verify the caller is a therapist
  SELECT * INTO therapist_profile
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'therapist';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only therapists can create patient profiles';
  END IF;
  
  -- Generate a new UUID for the patient (not linked to auth.users)
  new_patient_id := gen_random_uuid();
  
  -- Insert the patient profile
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
  VALUES (
    new_patient_id,
    'patient',
    patient_email,
    patient_full_name,
    patient_phone,
    patient_dob,
    patient_insurance_provider,
    patient_insurance_id,
    patient_emergency_contact_name,
    patient_emergency_contact_phone
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
    insurance_provider = COALESCE(EXCLUDED.insurance_provider, profiles.insurance_provider),
    insurance_id = COALESCE(EXCLUDED.insurance_id, profiles.insurance_id),
    emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, profiles.emergency_contact_name),
    emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, profiles.emergency_contact_phone),
    role = 'patient'
  RETURNING * INTO new_patient_profile;
  
  RETURN new_patient_profile;
END;
$$;

-- Simpler version by email (same logic)
CREATE OR REPLACE FUNCTION public.create_patient_profile_by_email(
  patient_email TEXT,
  patient_full_name TEXT DEFAULT NULL,
  patient_phone TEXT DEFAULT NULL,
  patient_dob DATE DEFAULT NULL,
  patient_insurance_provider TEXT DEFAULT NULL,
  patient_insurance_id TEXT DEFAULT NULL,
  patient_emergency_contact_name TEXT DEFAULT NULL,
  patient_emergency_contact_phone TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just call the main function
  RETURN public.create_patient_profile(
    patient_email,
    patient_full_name,
    patient_phone,
    patient_dob,
    patient_insurance_provider,
    patient_insurance_id,
    patient_emergency_contact_name,
    patient_emergency_contact_phone
  );
END;
$$;

-- =============================================================================
-- Step 5: Update RLS policy to allow inserting patients without auth check
-- =============================================================================
-- The existing policy should work, but let's make sure it doesn't check auth.uid() = id

-- Drop and recreate the insert policy
DROP POLICY IF EXISTS "Therapists can create patient profiles" ON public.profiles;

CREATE POLICY "Therapists can create patient profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    -- Must be a therapist
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'therapist'
    )
    -- Can only create patient profiles (not other therapists or admins)
    AND role = 'patient'
    -- Don't require id to match auth.uid() for patients
  );

-- =============================================================================
-- Step 6: Update the trigger to not auto-create profiles for patients
-- =============================================================================
-- The handle_new_user trigger is fine - it only runs on auth.users inserts
-- Patients won't have auth.users entries, so this won't affect them

-- =============================================================================
-- Step 7: Ensure email uniqueness still works
-- =============================================================================
-- The email unique constraint should still work fine

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Test that the function works
DO $$
BEGIN
  -- Verify function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'create_patient_profile'
  ) THEN
    RAISE EXCEPTION 'Function create_patient_profile was not created';
  END IF;
  
  -- Verify policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Therapists can create patient profiles'
  ) THEN
    RAISE EXCEPTION 'Policy "Therapists can create patient profiles" was not created';
  END IF;
END $$;
