-- Sample script to create a test patient
-- Run this AFTER you have created an auth user in Supabase Dashboard
-- Replace the values below with your actual auth user ID and patient details

-- Step 1: Create an auth user in Supabase Dashboard → Authentication → Users
-- Step 2: Copy the user ID from the auth.users table
-- Step 3: Run this SQL with the actual user ID

-- Example (replace with your actual auth user ID):
-- INSERT INTO public.profiles (id, role, email, full_name)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',  -- Replace with actual auth user ID
--   'patient',
--   'patient@example.com',
--   'John Doe'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- To find existing auth users:
-- SELECT id, email, raw_user_meta_data FROM auth.users;

-- To create a patient profile for an existing auth user:
-- UPDATE public.profiles
-- SET role = 'patient'
-- WHERE id = '<auth-user-id>';
