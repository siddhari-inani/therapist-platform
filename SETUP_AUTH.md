# Authentication Setup Guide

## Quick Setup: Create a Therapist Account

### Step 1: Create Therapist User in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `therapist@example.com` (or your email)
   - **Password**: `Therapist123!` (or any secure password)
   - **Auto Confirm User**: ✅ (check this)
   - **User Metadata** (JSON):
     ```json
     {
       "role": "therapist",
       "full_name": "Dr. Jane Smith"
     }
     ```
4. Click **"Create user"**

### Step 2: Verify Profile Was Created

Run this in **SQL Editor**:

```sql
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'therapist@example.com';
```

If you see the profile, you're good! ✅

### Step 3: Login to the App

1. Go to `http://localhost:3000/login`
2. Enter:
   - Email: `therapist@example.com`
   - Password: `Therapist123!`
3. Click "Sign In"
4. You'll be redirected to `/dashboard`

## Create a Test Patient

### Step 1: Create Patient Auth User

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `test.patient@example.com`
   - **Password**: `TestPatient123!`
   - **Auto Confirm User**: ✅
   - **User Metadata** (JSON):
     ```json
     {
       "role": "patient",
       "full_name": "Test Patient"
     }
     ```
4. Click **"Create user"**

### Step 2: Verify Patient Profile

```sql
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE role = 'patient';
```

## Test Credentials Summary

### Therapist Account
- **Email**: `therapist@example.com`
- **Password**: `Therapist123!`
- **Role**: `therapist`

### Patient Account
- **Email**: `test.patient@example.com`
- **Password**: `TestPatient123!`
- **Role**: `patient`

## Troubleshooting

### "You must be logged in" Error

1. Make sure you're logged in at `/login`
2. Check browser console for auth errors
3. Verify your Supabase environment variables are set in `.env.local`

### Profile Not Created Automatically

If the `handle_new_user` trigger didn't create the profile, run:

```sql
-- Replace USER_ID with the actual auth user ID
INSERT INTO public.profiles (id, role, email, full_name)
VALUES (
  'USER_ID',
  'therapist',  -- or 'patient'
  'therapist@example.com',
  'Dr. Jane Smith'
)
ON CONFLICT (id) DO UPDATE
SET role = 'therapist';
```

### Check Current User

Run this in SQL Editor to see all users:

```sql
SELECT 
  au.id,
  au.email,
  p.role,
  p.full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
```
