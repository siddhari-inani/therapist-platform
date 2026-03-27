# Go Live: Deploy Revora Health to Production

This guide walks you through deploying the therapist platform so it’s live on the internet.

---

## 1. Pre-launch checklist

Before deploying, confirm:

- [ ] **Code is on Git** – All changes are committed and pushed (e.g. to GitHub).
- [ ] **Supabase project** – You have a Supabase project (use the same one for prod, or create a new one for production).
- [ ] **Migrations applied** – All files in `supabase/migrations/` have been run in your Supabase project (Dashboard → SQL Editor, or Supabase CLI).
- [ ] **Build works locally** – Run `npm run build` and fix any errors.

---

## 2. Supabase production setup

Your app talks to Supabase for auth and data. Configure it for your live URL.

### 2.1 Get your Supabase credentials

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Project Settings** (gear) → **API**.
3. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 Configure Auth redirect URLs

1. In Supabase: **Authentication** → **URL Configuration**.
2. Set **Site URL** to your production URL, e.g. `https://your-app.vercel.app` or `https://yourdomain.com`.
3. Under **Redirect URLs**, add:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/login`
   - If you use a custom domain: `https://yourdomain.com/**` and `https://yourdomain.com/login`

Without this, login/callback may fail in production.

### 2.3 (Optional) Separate production project

For a dedicated production database:

1. Create a new Supabase project for production.
2. Run all migrations from `supabase/migrations/` in that project (in order).
3. Use that project’s URL and anon key for production env vars.

---

## 3. Deploy to Vercel (recommended)

Vercel works well with Next.js and gives you HTTPS and a URL out of the box.

### 3.1 Push code to GitHub

```bash
git add .
git commit -m "Prepare for production"
git push origin main
```

(Use your real branch name if not `main`.)

### 3.2 Import project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New** → **Project**.
3. Import the repo that contains this app (e.g. `therapist-platform`).
4. **Framework Preset**: Vercel should detect Next.js. Leave **Root Directory** blank unless the app is in a subfolder.
5. Do **not** deploy yet – add env vars first.

### 3.3 Set environment variables

In the Vercel project:

1. Open your project → **Settings** → **Environment Variables**.
2. Add these for **Production** (and optionally Preview if you want):

| Name | Value | Notes |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Same place |

Optional (only if you use the feature):

| Name | Value | Notes |
|------|--------|------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Google Maps API key | For maps/location |
| `OPENAI_API_KEY` | Your OpenAI API key | For AI chat (server-only) |

3. Save. Trigger a new deploy (e.g. **Deployments** → **Redeploy** or push a new commit).

### 3.4 Deploy

- If you didn’t deploy in 3.2: **Deploy** from the import screen.
- If you already deployed: after saving env vars, use **Redeploy** so the build uses them.

When the build finishes, Vercel will show a URL like `https://therapist-platform-xxx.vercel.app`.

### 3.5 Point Supabase to the live URL

1. In Supabase: **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel URL (e.g. `https://therapist-platform-xxx.vercel.app`).
3. Add that base URL and `/login` to **Redirect URLs** as in section 2.2.

Then try logging in on the live site; it should redirect correctly.

---

## 4. Custom domain (optional)

1. In Vercel: **Settings** → **Domains**.
2. Add your domain (e.g. `app.revorahealth.com`) and follow Vercel’s DNS instructions.
3. In Supabase **URL Configuration**, set **Site URL** to `https://yourdomain.com` and add `https://yourdomain.com/**` and `https://yourdomain.com/login` to **Redirect URLs**.

---

## 5. Post-launch checks

- [ ] **Homepage** loads at your production URL.
- [ ] **Login** works (use a real or test therapist account).
- [ ] **Dashboard** loads after login.
- [ ] **Patients / Calendar / Charting** – open a few pages to confirm no errors.
- [ ] **Logout** works and redirects to login or home.

If login fails, double-check Supabase **Site URL** and **Redirect URLs** and that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in Vercel.

---

## 6. Other hosting options

The app is a standard Next.js app, so you can host it elsewhere:

- **Netlify** – Connect the repo, set build command `npm run build`, publish directory `.next` (or use Netlify’s Next.js runtime). Add the same env vars.
- **Railway / Render / Fly.io** – Use `npm run build` and `npm run start`; set the same env vars in their dashboards.
- **VPS (e.g. Ubuntu)** – Install Node, clone repo, `npm install`, `npm run build`, run with `npm run start` or a process manager (e.g. PM2), and put a reverse proxy (e.g. Nginx) in front with HTTPS (e.g. Let’s Encrypt).

In every case:

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. In Supabase, set **Site URL** and **Redirect URLs** to your production URL.

---

## 7. Quick reference: required env vars

| Variable | Required | Where used |
|----------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase client (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client (browser + server) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Maps/location features |
| `OPENAI_API_KEY` | No | AI chat API route (server-only) |

See `.env.example` in the project root for a template.
