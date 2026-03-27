-- =============================================================================
-- QUICK USER SETUP SCRIPT
-- =============================================================================
-- 
-- IMPORTANT: You MUST create the auth user first via Dashboard, then run this
-- to create/update the profile.
--
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create user with email/password, check "Auto Confirm User"
-- 3. Run this script to create the profile
-- =============================================================================

-- =============================================================================
-- OPTION 1: Create Profile for Specific User
-- =============================================================================

-- Replace 'therapist@example.com' with your actual email
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'role', 'therapist')::text,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Dr. Jane Smith')
FROM auth.users
WHERE email = 'therapist@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = COALESCE(EXCLUDED.role, profiles.role),
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- =============================================================================
-- OPTION 2: Create Profiles for ALL Users Missing Profiles
-- =============================================================================

-- This will create profiles for any auth users that don't have one
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'role', 'patient')::text,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- OPTION 3: Create Test Users (After Creating Auth Users in Dashboard)
-- =============================================================================

-- Therapist
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'therapist',
  email,
  'Dr. Jane Smith'
FROM auth.users
WHERE email = 'therapist@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'therapist';

-- Patient
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  'Test Patient'
FROM auth.users
WHERE email = 'test.patient@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'patient';

-- =============================================================================
-- VERIFY: Check All Users and Their Profiles
-- =============================================================================

SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile - Run script above'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email Not Confirmed'
    ELSE '✅ Ready to Login'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
