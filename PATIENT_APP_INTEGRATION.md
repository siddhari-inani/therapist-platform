# Patient App Integration Guide

This document outlines what you need to do to integrate a **patient-facing app** with your existing therapist platform. Your backend already has patient-related data (appointments, messages, milestones, form snapshots, payments); patients today are profile-only (no login). To give them a portal, you need identity, RLS updates, and a patient UI.

---

## 1. Patient identity and auth

Today, patients are created by therapists via `create_patient_profile` and have a **profile with a random UUID** but **no `auth.users` row**. RLS for appointments, form_snapshots, milestones, payments uses `patient_id = auth.uid()`, which assumes the logged-in user’s id is the patient’s profile id. So you must **link** each patient who gets portal access to an auth user.

### Option A (recommended): Same UUID when inviting

When a therapist invites a patient to the portal:

1. Create an auth user with **the same UUID as the existing patient profile** (Supabase Admin API allows setting `id`).
2. Set password or send a magic link to the patient’s email.
3. No schema change: `patient_id = auth.uid()` already works everywhere.

**Pros:** No migrations, no RLS changes.  
**Cons:** Invite must go through your backend (e.g. API route) using the **service role** or Admin API to create the user with a specific id.

### Option B: Link table or column

Add a link from profile to auth user:

- Add `profiles.auth_user_id UUID REFERENCES auth.users(id)` (nullable).
- When a patient signs up (e.g. magic link), create a normal auth user, then run an update:  
  `UPDATE profiles SET auth_user_id = auth.uid() WHERE email = ? AND role = 'patient'`.
- Add a helper, e.g. `get_patient_profile_id()` returning `(SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1)`.
- Change all “patient” RLS from `patient_id = auth.uid()` to `patient_id = public.get_patient_profile_id()`.

**Pros:** Supports “patient signs up with email” without therapist pre-creating auth.  
**Cons:** One migration + updating several RLS policies.

**Recommendation:** Start with **Option A** for a cleaner path; move to B if you need self-signup later.

---

## 2. Database and RLS changes

### 2.1 If using Option A (invite with same UUID)

- No new tables or columns.
- Ensure **messages** allow patients to read and mark as read (see below). Other tables already have “patient can read where patient_id = auth.uid()”.

### 2.2 Messages: patient read + mark read

Currently only therapists can read messages (`sender_id = auth.uid() OR recipient_id = auth.uid()`). Therapist→patient messages use `recipient_id = patient_id`. Add:

- **SELECT:** Patients can read messages where `recipient_id = auth.uid()` (and optionally `patient_id = auth.uid()` if you use it).
- **UPDATE:** Patients can update only `read_at` for messages where `recipient_id = auth.uid()`.

Add a migration, e.g.:

```sql
-- Patients can read messages sent to them
CREATE POLICY "Patients can read own messages"
  ON public.messages FOR SELECT
  USING (recipient_id = auth.uid());

-- Patients can mark messages they received as read
CREATE POLICY "Patients can mark own messages read"
  ON public.messages FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
```

(If you use a definer function for “mark as read”, extend it so that when the caller is a patient, it allows updating `read_at` where `recipient_id = auth.uid()`.)

### 2.3 Gamification and patients

`user_gamification` and `user_achievements` reference `auth.users(id)`. With Option A, once the patient has an auth user with the same id as their profile, they can have a row in `user_gamification` keyed by that id. So no schema change; just use the same APIs/UX for patients (e.g. award XP for completing exercises or viewing progress). If you use Option B, `get_patient_profile_id()` returns profile id, but gamification tables use `auth.users(id)` (user_id), so you’d use `auth.uid()` for gamification and keep it auth-user-based.

### 2.4 Profiles: patient “read own” and “update own”

- **SELECT:** There is already “Users can read own profile” with `auth.uid() = id`. With Option A, patient’s profile id = auth.uid(), so they can read their profile. With Option B, add a policy so a patient can read the single profile where `auth_user_id = auth.uid()`.
- **UPDATE:** “Users can update own profile” with `auth.uid() = id` works for Option A. For Option B, allow update where `auth_user_id = auth.uid()`.

---

## 3. App structure and routing

Two common approaches:

### 3.1 Single Next.js app, role-based routes

- **After login:** Resolve role from `profiles` (using `auth.uid()` or, in Option B, the profile linked to `auth.uid()`).
  - If **therapist** (or admin): redirect to `/dashboard`.
  - If **patient**: redirect to `/patient` (or `/portal`).
- **Route layout:**
  - `/login` – shared; after success, redirect by role.
  - `/dashboard/*` – therapist (and admin) only; guard in layout and redirect patients to `/patient`.
  - `/patient/*` – patient-only; guard and redirect therapists to `/dashboard`.

Implement guards in:

- **Middleware** (recommended): In `middleware.ts` at project root, after confirming session, fetch role (e.g. from profile by `auth.uid()` or from a small API that uses the same logic) and redirect `/dashboard` → `/patient` for patients and `/patient` → `/dashboard` for therapists. Optionally redirect unauthenticated users from `/dashboard` and `/patient` to `/login`.
- **Layouts:** In `app/dashboard/layout.tsx` and `app/patient/layout.tsx`, verify role and redirect if wrong role (backup to middleware).

### 3.2 Separate patient app (e.g. different subdomain or repo)

- Second Next.js app that only knows about “patient” UX and calls the same Supabase project (same anon key, RLS enforces patient_id = auth.uid()).
- Login page only for patients (magic link or password); after login, all requests are as that user; RLS restricts data to that patient.
- No role check needed in app; only patients are given the link to this app.

---

## 4. Patient app features (what to build)

Align with what therapists already manage:

| Feature | Data / table | Patient UI |
|--------|---------------|------------|
| **Dashboard** | appointments, messages, milestones | Upcoming appointments, unread message count, next milestone or progress summary. |
| **Appointments** | `appointments` | List (and optionally request/cancel if you add that logic). |
| **Messages** | `messages` | Thread(s) with therapist (recipient_id = patient). Compose reply → insert with sender_id = auth.uid(), recipient_id = therapist_id. |
| **Progress / milestones** | `recovery_milestones` | Read-only list and status. |
| **Form snapshots** | `form_snapshots` | Read-only view of their stick-figure/form over time. |
| **Payments** | `payments` | List of charges/invoices; link to Stripe Customer Portal or checkout if you use it. |
| **Profile** | `profiles` | View and edit own contact info (phone, address, etc.). |
| **Gamification** | `user_gamification`, `user_achievements` | XP bar, level, badges (reuse or adapt existing components). |

Add **API routes** only where you need server-side behavior:

- **Invite patient (Option A):** e.g. `POST /api/patients/[id]/invite` – therapist-only; calls Supabase Admin API to create auth user with `id = patient.id`, then send email (magic link or set password).
- **Request/cancel appointment:** if you want to avoid direct DB writes from the client, implement small API routes that validate and then insert/update appointments with service role or RLS-compatible role.

Most of the patient app can be **client-only** with Supabase client + RLS.

---

## 5. Invite flow (Option A)

1. **Therapist:** “Invite to portal” on a patient row (patients list or patient detail).
2. **Backend:**  
   - Load patient by id; ensure `role = 'patient'` and email present.  
   - Call Supabase Admin API: create user with `id: patient.id`, `email: patient.email`, and either a generated temporary password or magic link.  
   - (Optional) Send email with “Set your password” or “Sign in with magic link” using your existing email/SMS lib.
3. **Patient:** Clicks link (or goes to login), signs in; app detects role and redirects to `/patient` (or patient-only app).

Use **Supabase Auth Admin API** (service role key) to create the user with a specific id; do not expose the service role key to the client.

---

## 6. Checklist summary

- [ ] **Auth strategy:** Choose Option A (invite with same UUID) or Option B (auth_user_id + helper).
- [ ] **Migration:** Add patient message policies (read + mark read). If Option B, add `auth_user_id` and `get_patient_profile_id()`, then update RLS for appointments, medical_records, form_snapshots, recovery_milestones, payments, profiles.
- [ ] **Routing:** Same app with `/patient` + role-based redirect after login, or separate patient app; add middleware/layout guards so dashboard is therapist-only and patient area is patient-only.
- [ ] **Login:** After sign-in, resolve role and redirect; patient login entry point (same `/login` or separate patient login page).
- [ ] **Invite API:** Therapist-only route that creates auth user (Option A: same id as profile) and sends email/link.
- [ ] **Patient pages:** Dashboard, Appointments, Messages, Progress, Form snapshots (read-only), Payments, Profile; optionally gamification.
- [ ] **Messaging:** Patient can reply (insert message with sender_id = auth.uid(), recipient_id = therapist); add RLS so therapists can read messages where recipient_id = therapist and sender_id = patient.

After this, the “whole thing” (therapist platform + data model) is integrated with a patient app: same Supabase project, same RLS, and a clear split between therapist dashboard and patient portal.
