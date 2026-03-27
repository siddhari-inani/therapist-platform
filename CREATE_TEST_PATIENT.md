# How to Create a Test Patient

## Quick Method (Recommended)

### Step 1: Create Auth User in Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Fill in:
   - **Email**: `test.patient@example.com`
   - **Password**: `TestPatient123!` (or any secure password)
   - **Auto Confirm User**: ✅ (check this)
   - **User Metadata** (JSON):
     ```json
     {
       "role": "patient",
       "full_name": "Test Patient"
     }
     ```
5. Click **"Create user"**

### Step 2: Verify Profile Was Created

The `handle_new_user` trigger should automatically create a profile. Check by running this in **SQL Editor**:

```sql
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'test.patient@example.com';
```

If the profile exists, you're done! ✅

### Step 3: If Profile Wasn't Created Automatically

If the trigger didn't work, manually create the profile:

1. Copy the **User ID** from the user you just created (in Authentication → Users)
2. Go to **SQL Editor**
3. Run this (replace `YOUR-USER-ID` with the actual ID):

```sql
INSERT INTO public.profiles (id, role, email, full_name, phone)
VALUES (
  'YOUR-USER-ID',  -- Paste the user ID here
  'patient',
  'test.patient@example.com',
  'Test Patient',
  '+1-555-0100'
)
ON CONFLICT (id) DO UPDATE
SET role = 'patient';
```

## Alternative: Create Multiple Test Patients

Run this in SQL Editor (after creating auth users):

```sql
-- Test Patient 1
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  'John Doe'
FROM auth.users
WHERE email = 'john.doe@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'patient';

-- Test Patient 2
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'patient',
  email,
  'Jane Smith'
FROM auth.users
WHERE email = 'jane.smith@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'patient';
```

## Verify It Works

1. Go to your app: `/dashboard/calendar`
2. Click **"Add"** button on any date
3. You should see "Test Patient" in the patient dropdown

## Test Patient Credentials

- **Email**: `test.patient@example.com`
- **Password**: `TestPatient123!` (or whatever you set)
- **Role**: `patient`
- **Name**: `Test Patient`

---

**Note**: The patient won't be able to log into the therapist dashboard (they're a patient, not a therapist). They would use a patient portal (which we haven't built yet).
