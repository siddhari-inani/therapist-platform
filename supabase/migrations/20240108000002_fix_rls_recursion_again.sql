-- =============================================================================
-- Fix Infinite Recursion in RLS Policies (Again)
-- =============================================================================
-- The therapist policies are trying to read from profiles to check therapist status,
-- which causes infinite recursion. This fixes it using SECURITY DEFINER functions.
-- =============================================================================

-- =============================================================================
-- Step 1: Create helper function to check if user is therapist (bypasses RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_therapist(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id AND role = 'therapist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- Step 2: Drop problematic policies
-- =============================================================================

DROP POLICY IF EXISTS "Therapists can read patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Therapists can create patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Therapists can update patient profiles" ON public.profiles;

-- =============================================================================
-- Step 3: Recreate policies using the helper function
-- =============================================================================

-- Therapists can read all patient profiles
CREATE POLICY "Therapists can read patient profiles"
  ON public.profiles FOR SELECT
  USING (public.is_therapist(auth.uid()) AND profiles.role = 'patient');

-- Therapists can create patient profiles
CREATE POLICY "Therapists can create patient profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.is_therapist(auth.uid()) AND role = 'patient'
  );

-- Therapists can update patient profiles
CREATE POLICY "Therapists can update patient profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.is_therapist(auth.uid()) AND profiles.role = 'patient'
  )
  WITH CHECK (
    public.is_therapist(auth.uid()) AND profiles.role = 'patient'
  );

-- =============================================================================
-- Step 4: Verify policies are created
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Therapists can read patient profiles'
  ) THEN
    RAISE EXCEPTION 'Policy "Therapists can read patient profiles" was not created';
  END IF;
  
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
  
  RAISE NOTICE 'All RLS policies updated successfully - recursion fixed!';
END $$;
