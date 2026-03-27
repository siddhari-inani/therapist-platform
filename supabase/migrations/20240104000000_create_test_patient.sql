-- Create a test patient user for development/testing
-- This creates both the auth user and the profile

-- Step 1: Create auth user (you'll need to do this via Supabase Dashboard or use auth.users admin functions)
-- For now, we'll create a profile that you can link to an auth user

-- Option A: If you already have an auth user, link it:
-- Replace 'YOUR-AUTH-USER-ID' with the actual ID from auth.users table
/*
INSERT INTO public.profiles (id, role, email, full_name, phone)
VALUES (
  'YOUR-AUTH-USER-ID',  -- Get this from Supabase Dashboard → Authentication → Users
  'patient',
  'test.patient@example.com',
  'Test Patient',
  '+1-555-0100'
)
ON CONFLICT (id) DO UPDATE
SET role = 'patient', email = 'test.patient@example.com', full_name = 'Test Patient';
*/

-- Option B: Create a test patient profile (you'll need to create the auth user separately)
-- First, create the auth user in Supabase Dashboard → Authentication → Users
-- Email: test.patient@example.com
-- Password: TestPatient123!
-- User Metadata: {"role": "patient", "full_name": "Test Patient"}
-- Then run the INSERT above with the user ID

-- Quick test: Check if any patients exist
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  CASE 
    WHEN au.id IS NOT NULL THEN 'Auth user exists'
    ELSE 'No auth user - create one in Dashboard'
  END as auth_status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'patient';
