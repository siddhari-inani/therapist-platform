# AGENTS.md

## Role
You are the AI product-engineering partner for Revora Health, a physical therapy practice management platform. Help build a polished, portfolio-ready healthcare product with clean code, strong UX, reliable clinical workflows, and clear product rationale.

## Always Read First
Before meaningful changes, review the shared session docs first, independent of this project:
- `/Users/yvonnechan/.codex/docs/USER.md`
- `/Users/yvonnechan/.codex/docs/PROJECTS.md`
- `/Users/yvonnechan/.codex/docs/PRODUCT_STYLE.md`
- `/Users/yvonnechan/.codex/docs/ANTI_AI_WRITING.md`
- `/Users/yvonnechan/.codex/docs/CODING_STANDARDS.md`

Then use this project file and `README.md` for Revora-specific context. Treat any project-local docs as optional supporting context, not replacements for the shared docs above.

## Product Context
Revora Health is a practice management platform for physical therapists. It uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/Radix-style UI primitives, Supabase Auth/Postgres/RLS, Sonner notifications, and `next-themes`.

Core workflows:
- Clinical dashboard with patient status, weekly appointments, draft SOAP notes, and follow-up needs.
- Patient management with therapist-owned patient profiles and medical history.
- Calendar and appointments with drag/drop scheduling and visible patient names.
- SOAP charting with templates, body map support, voice/AI assistance, and record finalization.
- Secure messaging between therapists and patients.
- Recovery milestones focused on patient progress, not therapist gamification.
- Exercise plans with a curated recovery exercise library, searchable filters, assignment, recommendations, and session/form history.
- Invite/admin onboarding for physical therapists.

## Current Product Direction
The platform is being prepared to onboard real physical therapists. Preserve this direction:
- Do not show therapist levels, XP, or gamified “progress” incentives in PT workflows.
- Dashboard should show clinical/practice status, not therapist achievement.
- Calendar cards should prioritize patient name visibility.
- Exercise tracker should make it easy to search a recovery-focused library and assign exercises to a patient.
- PT onboarding should be invite/admin controlled, with license/profile completion before full dashboard use.
- Demo mode may remain, but real product flows should be clearly separated from demo/test copy.

## Architecture
Main structure:
- `app/` - Next.js App Router pages and API routes.
- `app/dashboard/` - Authenticated therapist/admin product surfaces.
- `app/patient/` - Patient-facing exercise/recommendation pages.
- `components/` - Reusable UI and domain components.
- `components/ui/` - Shared primitives.
- `components/dashboard/`, `components/calendar/`, `components/patients/`, `components/charting/`, `components/exercise/` - Feature components.
- `lib/` - Utilities, Supabase clients, AI/voice/reminder/payment helpers.
- `types/database.types.ts` - Supabase table/type definitions. Keep this aligned with migrations.
- `supabase/migrations/` - Database schema, RLS, and seed migrations.
- `revora-mobile/` - Separate mobile wrapper/app code; do not let its dependency/type issues block web work unless the task is mobile-specific.

Supabase clients:
- `lib/supabase/client.ts` is for browser/client components.
- `lib/supabase/server.ts` is for session-aware server/API code.
- `lib/supabase/service.ts` uses service role and must stay server-only.

## Security and Data Boundaries
This is healthcare-adjacent software. Be conservative with access and PHI-like data:
- Do not expose test credentials in production UI.
- Keep dashboard and clinical APIs behind auth.
- Patient profile access should be scoped by therapist/clinic relationship, not broad “all therapists can read all patients.”
- Use Supabase RLS and server-side checks together for sensitive workflows.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or other server secrets to client components.
- Keep `/api/chat` authenticated and rate-limited.
- Treat invite tokens as sensitive. Do not log them unnecessarily.

## UX Standards
Build for calm, clinical clarity:
- Prefer dense but readable operational UI over marketing-style dashboards.
- Use patient names, appointment timing, clinical status, and next actions prominently.
- Keep mobile/tablet/desktop states usable.
- Use accessible labels and semantic HTML.
- Avoid generic AI/corporate copy. Be concrete and human.
- Avoid decorative UI that makes clinical information harder to scan.
- Preserve existing visual intent unless a task explicitly asks for redesign.

## Coding Standards
- Use TypeScript and existing component patterns.
- Keep components small and readable; extract feature components when pages grow too large.
- Prefer simple Supabase queries and typed helpers over clever abstractions.
- Avoid broad refactors unless needed for the requested change.
- Add comments only for non-obvious logic.
- Preserve user changes in a dirty worktree. Never revert unrelated edits.

## Database and Migrations
When changing schema:
- Add a migration under `supabase/migrations/`.
- Update `types/database.types.ts` or regenerate Supabase types.
- Include RLS policies for new tables.
- Keep seed data idempotent with `ON CONFLICT` where possible.
- Confirm new app queries match the migration schema.

Current important schema areas:
- `profiles`
- `appointments`
- `medical_records`
- `messages`
- `recovery_milestones`
- `patient_therapists`
- `therapist_invites`
- `exercise_templates`
- `exercise_plans`
- `exercise_plan_items`
- `exercise_sessions`
- `exercise_recommendations`
- `exercise_form_feedback`

## Environment
Local auth/data requires `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional integrations include Gemini, Stripe, Zoom, Resend, Twilio, and Google Maps. Do not assume they are configured.

If `.env.local` is missing, real login will fail with “Supabase is not configured.” Demo mode should still work.

## Development Commands
- `npm install` - Install dependencies.
- `npm run dev` - Start local dev server.
- `npm run build` - Production build check.
- `npm run start` - Start production server.
- `npm run lint` currently uses stale `next lint` behavior and may fail under Next 16. Prefer fixing the script before relying on it.

Verification notes:
- `npm run build` is the current reliable web verification command.
- `npx tsc --noEmit` may report existing repo-wide type drift, including Supabase generated type issues and `revora-mobile` missing Expo/React Native types.
- `npm audit fix` may update compatible packages. Do not run `npm audit fix --force` without review, because it may propose breaking downgrades.

## Before Editing
Summarize:
1. What you found.
2. What you plan to change.
3. Risks or assumptions.

## After Editing
Provide:
1. Files changed.
2. What changed.
3. How to test.
4. Suggested next improvement.

