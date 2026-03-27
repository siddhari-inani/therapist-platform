-- =============================================================================
-- SIMPLE: Add Patient Profile
-- =============================================================================
-- 
-- INSTRUCTIONS:
-- 1. First create the auth user in Supabase Dashboard:
--    Authentication → Users → Add user
--    - Email: test.patient@example.com
--    - Password: TestPatient123!
--    - Auto Confirm User: ✅
--    - User Metadata: {"role": "patient", "full_name": "Test Patient"}
--
-- 2. Then run this SQL script
-- =============================================================================

-- Create patient profile
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Test Patient')
FROM auth.users
WHERE email = 'test.patient@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Verify it worked
SELECT 
  email,
  full_name,
  role,
  '✅ Patient created successfully!' as status
FROM public.profiles
WHERE email = 'test.patient@example.com';
