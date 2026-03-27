# Practice Management Platform — Setup & Schema

HIPAA-aware practice management for physical therapists: Next.js (App Router), Tailwind, Shadcn UI, Supabase.

## Quick Start

```bash
npm install
npm run dev
```

**Environment variables** — create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```  

## Supabase Schema & Migrations

### Run migrations

1. Create a [Supabase](https://supabase.com) project.
2. In **SQL Editor**, run the contents of:
   - `supabase/migrations/20240101000000_create_profiles_and_appointments.sql`
3. Or use Supabase CLI: `supabase db push` (with project linked).

### Tables

| Table | Purpose |
|-------|---------|
| **profiles** | User profiles linked to `auth.users`. Roles: `admin`, `therapist`, `patient`. Includes therapist fields (license, specialties) and patient fields (DOB, insurance). |
| **appointments** | Appointments between therapist and patient. Supports recurrence, treatment type (for color-coding), reminders. |

### Row Level Security (RLS)

- **Profiles**: Users read/update own; therapists read their patients; admins read/update all. Insert allowed only for own profile (`id = auth.uid()`).
- **Appointments**: Therapists full CRUD on their appointments; patients read-only on their appointments; admins full CRUD on all.

### Signup trigger

`handle_new_user` creates a `profiles` row when a new `auth.users` record is inserted. Set `role` via `user_meta_data.role` (`admin` \| `therapist` \| `patient`); defaults to `patient`.

## TypeScript types

- **Location**: `types/database.types.ts`
- **Exports**: `Profile`, `ProfileInsert`, `ProfileUpdate`, `Appointment`, `AppointmentInsert`, `AppointmentUpdate`, `ProfileRole`, `AppointmentStatus`, `TreatmentType`, and full `Database` type for Supabase client.

Regenerate from your project:

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

## Project structure

```
├── app/                 # Next.js App Router
├── components/          # UI (Shadcn, etc.)
├── lib/
│   ├── supabase/        # Browser & server Supabase clients
│   └── utils.ts         # cn(), etc.
├── types/
│   └── database.types.ts
├── supabase/
│   └── migrations/      # SQL schema
└── PRACTICE_MANAGEMENT.md
```

## Staged rollout

1. **Step 1** ✅ — Supabase schema + TypeScript types (profiles, appointments).  
2. **Step 2** — Therapist Dashboard (Shadcn sidebar, calendar view).  
3. **Step 3** — SOAP note editor (drafts, Finalize).
