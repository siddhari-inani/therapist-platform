-- Quick Test Patient Creation
-- Run this AFTER creating the auth user in Supabase Dashboard

-- Step 1: Create auth user in Dashboard:
--   - Go to Authentication → Users → Add user
--   - Email: test.patient@example.com
--   - Password: TestPatient123!
--   - User Metadata: {"role": "patient", "full_name": "Test Patient"}
--   - Auto Confirm: ✅

-- Step 2: Run this SQL (it will find the user and create/update the profile)
INSERT INTO public.profiles (id, role, email, full_name, phone)
SELECT 
  id,
  'patient',
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Test Patient'),
  '+1-555-0100'
FROM auth.users
WHERE email = 'test.patient@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'patient',
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, 'Test Patient');

-- Verify it worked:
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  '✅ Patient created successfully!' as status
FROM public.profiles p
WHERE p.email = 'test.patient@example.com';
