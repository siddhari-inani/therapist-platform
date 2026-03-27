-- Check if recovery_milestones table exists and verify setup
-- Run this in your Supabase SQL editor to diagnose issues

-- 1. Check if table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'recovery_milestones' 
    AND table_schema = 'public';

-- 2. Check if types exist
SELECT 
    typname as type_name
FROM pg_type 
WHERE typname IN ('milestone_status', 'milestone_category');

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'recovery_milestones';

-- 4. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recovery_milestones' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test insert (will fail if RLS blocks it, but shows structure is correct)
-- Uncomment to test:
-- INSERT INTO public.recovery_milestones (
--     patient_id,
--     therapist_id,
--     title,
--     status,
--     category,
--     progress
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with actual patient_id
--     '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with actual therapist_id (auth.uid())
--     'Test Milestone',
--     'future',
--     'other',
--     0
-- );
