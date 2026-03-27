# Fix: Invalid API Key Error

## The Problem
You're seeing "Invalid API key" which means your `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` is incorrect.

## Solution: Get the Correct Key

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://supabase.com/dashboard
2. Select your project (the one with URL: `yszgszqauciabwovfiwp.supabase.co`)

### Step 2: Get the Anon/Public Key
1. Click on **Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu
3. Under **Project API keys**, find the **anon** `public` key
4. **Copy the entire key** (it's a long JWT token starting with `eyJ...`)

### Step 3: Update .env.local
1. Open `.env.local` in your project root
2. Replace the `NEXT_PUBLIC_SUPABASE_ANON_KEY` value with the key you just copied
3. Make sure there are no quotes around the key
4. Save the file

### Step 4: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Important Notes

- ✅ Use the **anon** `public` key (safe for client-side)
- ❌ Do NOT use the `service_role` key (server-only, has admin access)
- ✅ The key should be a long JWT token (starts with `eyJ`)
- ✅ No quotes needed in `.env.local`

## Verify It Works

1. Visit `http://localhost:3000/login/debug`
2. You should see: **Database Connection: ✅ Connected**
3. Then try logging in at `/login`

## Example .env.local Format

```env
NEXT_PUBLIC_SUPABASE_URL=https://yszgszqauciabwovfiwp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzemdzenFhdWNpYWJ3b3ZmaXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDAzMDcsImV4cCI6MjA4NDYxNjMwN30.4TO22NgLfFB_czHUmTgdTg8FEnjBtkYswY1MxBWjICwr
```

Make sure there are **no spaces** and **no quotes** around the values!
