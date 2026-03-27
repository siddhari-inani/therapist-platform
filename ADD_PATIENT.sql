-- =============================================================================
-- ADD PATIENT - SQL Script
-- =============================================================================
-- 
-- IMPORTANT: You MUST create the auth user first via Supabase Dashboard
-- Then run this script to create the patient profile.
--
-- Step 1: Create auth user in Dashboard:
--   - Go to Authentication → Users → Add user
--   - Email: test.patient@example.com
--   - Password: TestPatient123!
--   - Auto Confirm User: ✅
--   - User Metadata: {"role": "patient", "full_name": "Test Patient"}
--
-- Step 2: Run this SQL script
-- =============================================================================

-- =============================================================================
-- OPTION 1: Create Profile for Specific Patient Email
-- =============================================================================

-- Replace 'test.patient@example.com' with the actual patient email
INSERT INTO public.profiles (id, role, email, full_name, phone, date_of_birth)
SELECT 
  au.id,
  'patient',
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Patient User'),
  NULL,
  NULL
FROM auth.users au
WHERE au.email = 'test.patient@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- =============================================================================
-- OPTION 2: Create Patient with Full Details
-- =============================================================================

-- After creating auth user, run this with actual values:
/*
INSERT INTO public.profiles (id, role, email, full_name, phone, date_of_birth, insurance_provider, insurance_id, emergency_contact_name, emergency_contact_phone)
SELECT 
  au.id,
  'patient',
  au.email,
  'John Doe',                    -- Patient name
  '+1-555-0100',                 -- Phone number
  '1990-01-15',                  -- Date of birth (YYYY-MM-DD)
  'Blue Cross Blue Shield',      -- Insurance provider
  'BC123456789',                 -- Insurance ID
  'Jane Doe',                    -- Emergency contact name
  '+1-555-0101'                  -- Emergency contact phone
FROM auth.users au
WHERE au.email = 'patient@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  insurance_provider = EXCLUDED.insurance_provider,
  insurance_id = EXCLUDED.insurance_id,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone;
*/

-- =============================================================================
-- OPTION 3: Create Multiple Test Patients
-- =============================================================================

-- Patient 1
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  'John Doe'
FROM auth.users
WHERE email = 'john.doe@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'patient';

-- Patient 2
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  'Jane Smith'
FROM auth.users
WHERE email = 'jane.smith@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'patient';

-- Patient 3
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  'Bob Johnson'
FROM auth.users
WHERE email = 'bob.johnson@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'patient';

-- =============================================================================
-- OPTION 4: Create Profile for Patient (If Auth User Already Exists)
-- =============================================================================

-- Use this if you already created the auth user and just need the profile
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users

/*
INSERT INTO public.profiles (id, role, email, full_name, phone)
VALUES (
  'USER_ID_HERE',              -- Get this from: SELECT id FROM auth.users WHERE email = 'patient@example.com';
  'patient',
  'patient@example.com',
  'Patient Name',
  '+1-555-0100'
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;
*/

-- =============================================================================
-- VERIFY: Check Patient Was Created
-- =============================================================================

-- Check if patient profile exists
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
WHERE au.email = 'test.patient@example.com';

-- List all patients
SELECT 
  id,
  email,
  full_name,
  phone,
  date_of_birth,
  insurance_provider,
  created_at
FROM public.profiles
WHERE role = 'patient'
ORDER BY created_at DESC;
