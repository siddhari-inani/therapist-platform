# Complete Supabase Setup Guide

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Account & Project

1. **Go to Supabase**: https://supabase.com
2. **Sign up / Sign in** (use GitHub, Google, or email)
3. **Create a new project**:
   - Click "New Project"
   - Organization: Select or create one
   - Name: `therapist-platform` (or any name)
   - Database Password: **Save this password!** (you'll need it)
   - Region: Choose closest to you
   - Pricing Plan: Free tier is fine
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

### Step 2: Get Your API Credentials

1. **In your Supabase project**, click **Settings** (gear icon) in left sidebar
2. Click **API** in the settings menu
3. **Copy these values**:
   - **Project URL**: `https://yszgszqauciabwovfiwp.supabase.co` (yours will be different)
   - **anon public key**: Long JWT token starting with `eyJ...`

### Step 3: Add Credentials to .env.local

1. **Create/Edit `.env.local`** in your project root (`/Users/siddharthinani/therapist-platform/`)
2. **Add these lines** (replace with YOUR values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

**Important:**
- ✅ No quotes around values
- ✅ No spaces around `=`
- ✅ Full key copied (it's a long JWT token)
- ✅ File is named `.env.local` (with the dot)

### Step 4: Run Database Migrations

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run the first migration**:
   - Open: `supabase/migrations/20240101000000_create_profiles_and_appointments.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Should see "Success. No rows returned"

3. **Run the second migration**:
   - Open: `supabase/migrations/20240102000000_create_medical_records.sql`
   - Copy and run in SQL Editor

### Step 5: Create a Therapist User

1. **Go to Authentication** → **Users** (left sidebar)
2. **Click "Add user"** → **"Create new user"**
3. **Fill in the form**:
   ```
   Email: therapist@example.com
   Password: Therapist123!
   Auto Confirm User: ✅ (CHECK THIS!)
   User Metadata (JSON):
   {
     "role": "therapist",
     "full_name": "Dr. Jane Smith"
   }
   ```
4. **Click "Create user"**

### Step 6: Verify Profile Was Created

Run this in **SQL Editor**:

```sql
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE email = 'therapist@example.com';
```

**If you see a row**: ✅ Profile created automatically!  
**If empty**: Run this to create it:

```sql
INSERT INTO public.profiles (id, role, email, full_name)
SELECT 
  id,
  'therapist',
  email,
  'Dr. Jane Smith'
FROM auth.users
WHERE email = 'therapist@example.com';
```

### Step 7: Create a Test Patient (Optional)

1. **Authentication** → **Users** → **"Add user"**
2. **Fill in**:
   ```
   Email: test.patient@example.com
   Password: TestPatient123!
   Auto Confirm User: ✅
   User Metadata:
   {
     "role": "patient",
     "full_name": "Test Patient"
   }
   ```
3. **Create user**

### Step 8: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 9: Test the Connection

1. **Visit**: `http://localhost:3000/login/debug`
2. **You should see**:
   - ✅ Supabase URL: Set
   - ✅ Supabase Key: Set
   - ✅ Database Connection: Connected
   - ✅ Auth Status: Working

### Step 10: Test Login

1. **Go to**: `http://localhost:3000/login`
2. **Enter**:
   - Email: `therapist@example.com`
   - Password: `Therapist123!`
3. **Click "Sign In"**
4. **You should be redirected to** `/dashboard`

## 📋 Quick Checklist

- [ ] Supabase project created
- [ ] API credentials copied
- [ ] `.env.local` file created with credentials
- [ ] Database migrations run (profiles, appointments, medical_records)
- [ ] Therapist user created in Authentication
- [ ] Profile exists for therapist user
- [ ] Dev server restarted
- [ ] Debug page shows "✅ Connected"
- [ ] Can login successfully

## 🔧 Troubleshooting

### "Invalid API key" Error
- ✅ Get the correct key from Settings → API → **anon public** key
- ✅ Make sure it's the full key (long JWT token)
- ✅ No quotes in `.env.local`
- ✅ Restart dev server after updating

### "Invalid login credentials"
- ✅ User exists in Authentication → Users
- ✅ Password is correct
- ✅ "Auto Confirm User" was checked
- ✅ Email is spelled correctly

### "You must be logged in"
- ✅ You're not logged in - go to `/login` first
- ✅ Check browser console for errors
- ✅ Verify `.env.local` has correct credentials

### Profile doesn't exist
- ✅ Run the SQL script in Step 6 to create it
- ✅ Or check if trigger `handle_new_user` is working

## 📁 Important Files

- `.env.local` - Your Supabase credentials (not in git)
- `supabase/migrations/` - Database schema files
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client

## 🎯 Test Credentials

After setup, you can login with:

**Therapist:**
- Email: `therapist@example.com`
- Password: `Therapist123!`

**Patient:**
- Email: `test.patient@example.com`
- Password: `TestPatient123!`

## 📚 Next Steps

Once setup is complete:
1. ✅ Login works
2. ✅ Can create appointments
3. ✅ Can create SOAP notes
4. ✅ Calendar displays appointments

---

**Need help?** Check:
- `/login/debug` - Connection status
- `/login/test` - Test login functionality
- Browser console (F12) - Error messages
- Supabase Dashboard → Logs - Server-side errors
