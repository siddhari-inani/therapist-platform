-- =============================================================================
-- Allow Therapists to Create Patient Profiles
-- =============================================================================
-- This migration enables therapists to create patient profiles directly
-- from their dashboard, allowing them to add multiple patients.
-- =============================================================================

-- =============================================================================
-- 1. Add RLS Policy: Therapists can insert patient profiles
-- =============================================================================
-- Allow therapists to create patient profiles (but only with role='patient')
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
  );

-- =============================================================================
-- 2. Add RLS Policy: Therapists can update patient profiles they created
-- =============================================================================
-- Allow therapists to update patient profiles (for managing patient info)
CREATE POLICY "Therapists can update patient profiles"
  ON public.profiles FOR UPDATE
  USING (
    -- Must be a therapist
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'therapist'
    )
    -- Can only update patient profiles
    AND profiles.role = 'patient'
  )
  WITH CHECK (
    -- Must be a therapist
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'therapist'
    )
    -- Can only update patient profiles (cannot change role to non-patient)
    AND profiles.role = 'patient'
  );

-- =============================================================================
-- 3. Helper Function: Create Patient Profile (for therapists)
-- =============================================================================
-- This function allows therapists to create patient profiles.
-- Note: The auth user must already exist in auth.users
-- The therapist should first create the auth user via Supabase Dashboard or API,
-- then call this function to create the profile.
CREATE OR REPLACE FUNCTION public.create_patient_profile(
  patient_user_id UUID,
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
  new_patient_profile public.profiles;
BEGIN
  -- Verify the caller is a therapist
  SELECT * INTO therapist_profile
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'therapist';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only therapists can create patient profiles';
  END IF;
  
  -- Verify the auth user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = patient_user_id) THEN
    RAISE EXCEPTION 'Auth user with id % does not exist. Please create the user in Supabase Dashboard first.', patient_user_id;
  END IF;
  
  -- Verify the email matches (if provided)
  IF patient_email IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = patient_user_id AND email = patient_email) THEN
      RAISE EXCEPTION 'Email % does not match the auth user with id %', patient_email, patient_user_id;
    END IF;
  END IF;
  
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
    patient_user_id,
    'patient',
    COALESCE(patient_email, (SELECT email FROM auth.users WHERE id = patient_user_id)),
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
    role = 'patient'  -- Ensure role is always 'patient'
  RETURNING * INTO new_patient_profile;
  
  RETURN new_patient_profile;
END;
$$;

-- =============================================================================
-- 4. Helper Function: Create Patient Profile by Email (simpler version)
-- =============================================================================
-- This function looks up the auth user by email and creates the profile
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
DECLARE
  patient_user_id UUID;
BEGIN
  -- Verify the caller is a therapist
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'therapist'
  ) THEN
    RAISE EXCEPTION 'Only therapists can create patient profiles';
  END IF;
  
  -- Find the auth user by email
  SELECT id INTO patient_user_id
  FROM auth.users
  WHERE email = patient_email;
  
  IF patient_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user with email % does not exist. Please create the user in Supabase Dashboard first.', patient_email;
  END IF;
  
  -- Call the main function
  RETURN public.create_patient_profile(
    patient_user_id,
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
-- 5. Grant execute permissions
-- =============================================================================
-- Allow authenticated users (therapists) to execute these functions
GRANT EXECUTE ON FUNCTION public.create_patient_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_patient_profile_by_email TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Test that policies are in place
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Therapists can create patient profiles'
  ) THEN
    RAISE EXCEPTION 'Policy "Therapists can create patient profiles" was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Therapists can update patient profiles'
  ) THEN
    RAISE EXCEPTION 'Policy "Therapists can update patient profiles" was not created';
  END IF;
END $$;
