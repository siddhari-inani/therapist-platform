# Troubleshooting Login Issues

## Common Login Problems & Solutions

### Problem 1: "Invalid email or password"

**Causes:**
- User doesn't exist in Supabase
- Wrong password
- Email has typos

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Check if your user exists
3. If not, create it (see below)
4. If it exists, verify the email is correct
5. You can reset the password in Supabase Dashboard

### Problem 2: "Email not confirmed"

**Causes:**
- User was created without "Auto Confirm User" checked

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click on your user
3. Check "Email Confirmed" status
4. If not confirmed, either:
   - Click "Send confirmation email" OR
   - Manually set `email_confirmed_at` in the database OR
   - Delete and recreate the user with "Auto Confirm User" checked

### Problem 3: Login succeeds but redirects back to login

**Causes:**
- Session not being saved properly
- Cookies not being set

**Solution:**
1. Check browser console for errors
2. Make sure you're not blocking cookies
3. Try in an incognito/private window
4. Clear browser cache and cookies

### Problem 4: "User not found" or profile doesn't exist

**Causes:**
- Profile wasn't created by the trigger
- User was created but profile insert failed

**Solution:**
1. Check if profile exists:
   ```sql
   SELECT * FROM public.profiles WHERE email = 'your@email.com';
   ```
2. If profile doesn't exist, create it manually:
   ```sql
   -- Get user ID from auth.users first
   SELECT id, email FROM auth.users WHERE email = 'your@email.com';
   
   -- Then create profile (replace USER_ID with actual ID)
   INSERT INTO public.profiles (id, role, email, full_name)
   VALUES (
     'USER_ID',
     'therapist',
     'your@email.com',
     'Your Name'
   );
   ```

## Step-by-Step: Create a Working User

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to Authentication → Users**
2. **Click "Add user" → "Create new user"**
3. **Fill in:**
   - Email: `therapist@example.com`
   - Password: `Therapist123!`
   - **Auto Confirm User**: ✅ **MUST CHECK THIS**
   - **User Metadata** (JSON):
     ```json
     {
       "role": "therapist",
       "full_name": "Dr. Jane Smith"
     }
     ```
4. **Click "Create user"**

### Method 2: Verify User Was Created Correctly

Run this in SQL Editor:

```sql
-- Check auth user
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'therapist@example.com';

-- Check profile
SELECT 
  id,
  email,
  role,
  full_name
FROM public.profiles
WHERE email = 'therapist@example.com';
```

Both queries should return a row. If profile is missing, create it (see Problem 4 above).

## Test Login Credentials

After creating the user, test with:
- **Email**: `therapist@example.com`
- **Password**: `Therapist123!` (or whatever you set)

## Debug Steps

1. **Check browser console** (F12 → Console tab)
   - Look for any errors during login
   - Check for network errors

2. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - See if login attempts are being received
   - Check for any errors

3. **Verify connection**
   - Visit `/login/debug`
   - Should show "✅ Connected"

4. **Test with SQL**
   ```sql
   -- Try to manually verify user can authenticate
   SELECT 
     au.id,
     au.email,
     au.email_confirmed_at,
     p.role,
     p.full_name
   FROM auth.users au
   LEFT JOIN public.profiles p ON au.id = p.id
   WHERE au.email = 'therapist@example.com';
   ```

## Quick Fix: Reset Everything

If nothing works, start fresh:

1. **Delete the user** in Supabase Dashboard → Authentication → Users
2. **Create a new user** with:
   - Auto Confirm: ✅
   - User Metadata: `{"role": "therapist", "full_name": "Dr. Jane Smith"}`
3. **Verify profile was created**
4. **Try logging in again**

## Still Not Working?

Share:
1. The exact error message you see
2. Browser console errors (F12 → Console)
3. What happens when you click "Sign In" (does it show an error? redirect? nothing?)
