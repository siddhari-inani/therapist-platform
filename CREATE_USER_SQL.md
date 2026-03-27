# Creating Users via SQL in Supabase

## ⚠️ Important Note

**You CANNOT directly create auth users with passwords via SQL** because:
- Supabase uses bcrypt password hashing
- The `auth.users` table is managed by Supabase's auth system
- Passwords must be hashed using Supabase's auth functions

## ✅ Recommended Approach

### Option 1: Create via Dashboard (Easiest)
1. Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Fill in email, password, check "Auto Confirm User"
4. Add User Metadata: `{"role": "therapist", "full_name": "Dr. Jane Smith"}`

### Option 2: Create Profile for Existing User (SQL)
If you already created the auth user via Dashboard, create the profile with SQL:

```sql
-- Create profile for therapist
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'therapist',
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Dr. Jane Smith')
FROM auth.users
WHERE email = 'therapist@example.com'
ON CONFLICT (id) DO UPDATE
SET role = 'therapist';
```

## 🔧 Complete Setup Script

Run this to create profiles for ALL existing auth users:

```sql
-- Create profiles for all auth users that don't have one
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'role', 'patient') as role,
      COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, role, email, full_name)
    VALUES (
      user_record.id,
      user_record.role::text,
      user_record.email,
      user_record.full_name
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
```

## 📋 Step-by-Step: Create User via SQL

### Step 1: Create Auth User (Must use Dashboard or API)
You **must** create the auth user first via:
- Supabase Dashboard, OR
- Supabase Management API

### Step 2: Get the User ID
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'therapist@example.com';
```

### Step 3: Create the Profile
```sql
-- Replace USER_ID with the ID from Step 2
INSERT INTO public.profiles (id, role, email, full_name)
VALUES (
  'USER_ID',  -- From auth.users
  'therapist',
  'therapist@example.com',
  'Dr. Jane Smith'
)
ON CONFLICT (id) DO UPDATE
SET role = 'therapist';
```

## 🚀 Quick Test User Creation

### Complete Workflow:

1. **Create auth user in Dashboard:**
   - Email: `therapist@example.com`
   - Password: `Therapist123!`
   - Auto Confirm: ✅
   - Metadata: `{"role": "therapist", "full_name": "Dr. Jane Smith"}`

2. **Verify profile was created automatically:**
   ```sql
   SELECT * FROM public.profiles WHERE email = 'therapist@example.com';
   ```

3. **If profile is missing, create it:**
   ```sql
   INSERT INTO public.profiles (id, role, email, full_name)
   SELECT 
     id,
     'therapist',
     email,
     'Dr. Jane Smith'
   FROM auth.users
   WHERE email = 'therapist@example.com'
   ON CONFLICT (id) DO UPDATE SET role = 'therapist';
   ```

## 🔍 Verify Everything Works

```sql
-- Check user and profile
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email Not Confirmed'
    ELSE '✅ Ready to Login'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'therapist@example.com';
```

## 💡 Why You Can't Create Auth Users Directly in SQL

Supabase's `auth.users` table:
- Uses encrypted password storage (bcrypt)
- Requires proper password hashing
- Has triggers and constraints
- Is managed by Supabase's auth service

**Solution:** Always create auth users via:
- ✅ Supabase Dashboard
- ✅ Supabase Auth API
- ✅ Supabase Management API

Then use SQL to create/update the `profiles` table.
