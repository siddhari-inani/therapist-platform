-- Create Test Users via SQL
-- WARNING: This creates users directly in auth.users table
-- For production, use Supabase Auth API or Dashboard instead

-- =============================================================================
-- METHOD 1: Create User with Hashed Password (Recommended)
-- =============================================================================

-- Step 1: Create the auth user
-- Note: You need to hash the password first. Use Supabase's auth.uid() or create via Dashboard
-- For SQL, we'll use a placeholder that you'll need to update

-- First, let's create a function to help create users (if you have admin access)
-- This is a simplified version - Supabase handles password hashing internally

-- =============================================================================
-- METHOD 2: Create User via Supabase Auth (Easier - Use This)
-- =============================================================================

-- Actually, you CAN'T directly insert into auth.users with a plain password
-- Supabase uses bcrypt hashing which requires their auth system
-- 
-- BETTER APPROACH: Use Supabase's built-in function or create via Dashboard

-- =============================================================================
-- METHOD 3: Create Profile for Existing Auth User (Use This)
-- =============================================================================

-- If you already created the auth user via Dashboard, just create the profile:

-- Example: Create profile for therapist
-- Replace 'USER_ID_FROM_AUTH' with actual user ID from auth.users
/*
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'therapist',
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Dr. Jane Smith')
FROM auth.users
WHERE email = 'therapist@example.com'
ON CONFLICT (id) DO UPDATE
SET role = 'therapist';
*/

-- =============================================================================
-- METHOD 4: Complete User Creation Script (Manual Process)
-- =============================================================================

-- Since we can't hash passwords in SQL directly, here's the workflow:

-- 1. Create auth user via Dashboard OR use Supabase Management API
-- 2. Then run this to create/update the profile:

/*
-- For Therapist
INSERT INTO public.profiles (id, role, email, full_name, phone)
SELECT 
  id,
  'therapist',
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Therapist User'),
  NULL
FROM auth.users
WHERE email = 'therapist@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'therapist',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- For Patient
INSERT INTO public.profiles (id, role, email, full_name, phone)
SELECT 
  id,
  'patient',
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Patient User'),
  NULL
FROM auth.users
WHERE email = 'test.patient@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
*/

-- =============================================================================
-- QUICK SETUP: Check and Create Missing Profiles
-- =============================================================================

-- This script checks for auth users without profiles and creates them

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Create profiles for all auth users that don't have one
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'role', 'patient') as role,
      COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, role, email, full_name)
    VALUES (
      user_record.id,
      user_record.role::text,
      user_record.email,
      user_record.full_name
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for user: % (%)', user_record.email, user_record.role;
  END LOOP;
END $$;

-- Verify all users have profiles
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Profile Exists'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
