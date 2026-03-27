# Recovery Milestones Troubleshooting Guide

If you're getting an error when trying to add milestones, follow these steps:

## Step 1: Run Database Migrations

The `recovery_milestones` table needs to be created first. Run these migrations in order in your Supabase SQL Editor:

1. **First migration**: `supabase/migrations/20240110000000_create_recovery_milestones.sql`
   - Creates the table, types, and RLS policies

2. **Second migration**: `supabase/migrations/20240110000001_add_progress_to_milestones.sql`
   - Adds the progress field

### How to Run Migrations in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Click **Run** to execute
5. Verify the table was created (see Step 2)

## Step 2: Verify Table Exists

Run the diagnostic script `CHECK_MILESTONES_SETUP.sql` in your Supabase SQL Editor to verify:
- Table exists
- Types are created
- RLS policies are set up
- Table structure is correct

## Step 3: Check Browser Console

When you try to add a milestone, check the browser console (F12 → Console tab) for detailed error messages. The error will show:
- Error code (e.g., `42P01` = table doesn't exist)
- Error message
- Full error details

## Common Errors and Solutions

### Error: "relation 'recovery_milestones' does not exist" (Code: 42P01)
**Solution**: Run the database migrations (Step 1)

### Error: "permission denied" (Code: 42501)
**Solution**: 
- Make sure you're logged in as a therapist
- Verify the RLS policy allows your user to insert milestones
- Check that `therapist_id` matches your `auth.uid()`

### Error: "invalid input value for enum" (Code: 22P02)
**Solution**: The enum types weren't created. Re-run the first migration.

### Error: "new row violates check constraint"
**Solution**: 
- If status is "completed", you must provide a `completed_date`
- Progress must be between 0 and 100

## Step 4: Test the Setup

After running migrations, try adding a milestone again. The improved error handling will now show:
- Specific error messages
- What to check
- Links to relevant documentation

## Quick Fix Script

If you want to quickly check if everything is set up, run this in Supabase SQL Editor:

```sql
-- Quick check
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recovery_milestones') 
        THEN '✓ Table exists'
        ELSE '✗ Table missing - Run migration 20240110000000_create_recovery_milestones.sql'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') 
        THEN '✓ Types exist'
        ELSE '✗ Types missing - Run migration 20240110000000_create_recovery_milestones.sql'
    END as types_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recovery_milestones' AND column_name = 'progress') 
        THEN '✓ Progress column exists'
        ELSE '✗ Progress column missing - Run migration 20240110000001_add_progress_to_milestones.sql'
    END as progress_status;
```

## Still Having Issues?

1. Check the browser console for the full error message
2. Verify you're logged in as a therapist (not a patient)
3. Make sure the patient exists in the `profiles` table
4. Check that your user ID matches the therapist_id you're trying to use
