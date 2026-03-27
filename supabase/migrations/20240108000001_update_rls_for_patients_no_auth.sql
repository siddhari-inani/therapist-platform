-- =============================================================================
-- Update RLS Policies for Patients Without Auth
-- =============================================================================
-- Ensure therapists can access patient data, appointments, and SOAP notes
-- even when patients don't have auth.users entries
-- =============================================================================

-- =============================================================================
-- Step 1: Update "Therapists can read patient profiles" policy
-- =============================================================================
-- The existing policy checks appointments, but we want therapists to see
-- all patients they can create appointments with (all patients)

DROP POLICY IF EXISTS "Therapists can read patient profiles" ON public.profiles;

-- Therapists can read all patient profiles (they manage them)
CREATE POLICY "Therapists can read patient profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Must be a therapist
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'therapist'
    )
    -- Can read patient profiles
    AND profiles.role = 'patient'
  );

-- =============================================================================
-- Step 2: Update appointments RLS for patients without auth
-- =============================================================================
-- Remove the "Patients can read their appointments" policy since patients
-- don't have auth accounts and can't log in

DROP POLICY IF EXISTS "Patients can read their appointments" ON public.appointments;

-- The existing policy "Therapists can manage their appointments" should work
-- It checks therapist_id = auth.uid(), which is fine
-- patient_id just needs to reference a profile (no auth check needed)

-- Verify the therapist policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'appointments'
    AND policyname = 'Therapists can manage their appointments'
  ) THEN
    RAISE EXCEPTION 'Policy "Therapists can manage their appointments" not found';
  END IF;
END $$;

-- =============================================================================
-- Step 3: Update medical_records RLS for patients without auth
-- =============================================================================
-- Remove the "Patients can read their records" policy since patients
-- don't have auth accounts and can't log in

DROP POLICY IF EXISTS "Patients can read their records" ON public.medical_records;

-- Verify therapist policy exists (should be "Therapists can manage their records")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'medical_records'
    AND policyname = 'Therapists can manage their records'
  ) THEN
    -- Create policy if it doesn't exist
    CREATE POLICY "Therapists can manage their records"
      ON public.medical_records FOR ALL
      USING (therapist_id = auth.uid())
      WITH CHECK (therapist_id = auth.uid());
  END IF;
END $$;

-- =============================================================================
-- Step 4: Ensure foreign keys work without auth.users
-- =============================================================================
-- Appointments.patient_id references profiles.id (not auth.users)
-- Medical_records.patient_id references profiles.id (not auth.users)
-- These should already work since we removed the FK from profiles.id

-- Verify appointments FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_patient_id_fkey'
    AND table_name = 'appointments'
  ) THEN
    -- Add FK if missing (should already exist)
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_patient_id_fkey
      FOREIGN KEY (patient_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Verify medical_records FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'medical_records_patient_id_fkey'
    AND table_name = 'medical_records'
  ) THEN
    -- Add FK if missing (should already exist)
    ALTER TABLE public.medical_records
      ADD CONSTRAINT medical_records_patient_id_fkey
      FOREIGN KEY (patient_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Test that policies are correct
DO $$
BEGIN
  -- Verify therapist can read patients policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Therapists can read patient profiles'
  ) THEN
    RAISE EXCEPTION 'Policy "Therapists can read patient profiles" was not created';
  END IF;
  
  RAISE NOTICE 'All RLS policies updated successfully';
END $$;
