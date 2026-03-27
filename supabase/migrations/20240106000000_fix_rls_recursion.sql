-- Fix Infinite Recursion in RLS Policies
-- The admin policies were trying to read from profiles to check admin status,
-- which caused infinite recursion. This fixes it using a security definer function.

-- =============================================================================
-- Step 1: Drop the problematic policies
-- =============================================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

-- =============================================================================
-- Step 2: Create helper function to check if user is admin (bypasses RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- Step 3: Recreate admin policies using the helper function
-- =============================================================================

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Admins can manage all appointments
CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
