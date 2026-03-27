-- =============================================================================
-- ADD PATIENT: patient@example.com
-- =============================================================================
-- 
-- IMPORTANT: You MUST create the auth user first via Supabase Dashboard
-- Then run this script to create the patient profile.
--
-- Step 1: Create auth user in Dashboard:
--   - Go to Authentication → Users → Add user
--   - Email: patient@example.com
--   - Password: (choose a secure password)
--   - Auto Confirm User: ✅ (IMPORTANT!)
--   - User Metadata (optional): {"role": "patient", "full_name": "Example Patient"}
--
-- Step 2: Run this SQL script
-- =============================================================================

-- Create patient profile for patient@example.com
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  au.id,
  'patient',
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Example Patient')
FROM auth.users au
WHERE au.email = 'patient@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- =============================================================================
-- VERIFY: Check Patient Was Created
-- =============================================================================

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
WHERE au.email = 'patient@example.com';
