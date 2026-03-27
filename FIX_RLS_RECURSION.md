# Fix: Infinite Recursion in RLS Policies

## The Problem

The error "infinite recursion detected in policy for relation profiles" happens because the admin policies were trying to read from `profiles` to check if a user is an admin, but those policies are ON `profiles` itself, creating a circular dependency.

## The Solution

We use a **security definer function** that bypasses RLS to check admin status, breaking the recursion.

## Quick Fix

Run this SQL in Supabase SQL Editor:

```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

-- Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using the helper function
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
```

## What Changed

**Before (caused recursion):**
```sql
-- This tries to read profiles while protecting profiles = infinite loop
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
```

**After (no recursion):**
```sql
-- Helper function bypasses RLS, so no recursion
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));
```

## Verify It's Fixed

After running the fix, test with:

```sql
-- This should work without recursion errors
SELECT * FROM public.profiles WHERE role = 'admin';
```

## Files

- `supabase/migrations/20240106000000_fix_rls_recursion.sql` - Complete fix script
