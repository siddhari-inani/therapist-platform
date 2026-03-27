-- Adds async AI video generation jobs for exercise templates.

alter table public.exercise_templates
  add column if not exists video_url text;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'exercise_video_job_status' and n.nspname = 'public'
  ) then
    create type public.exercise_video_job_status as enum (
      'queued',
      'processing',
      'succeeded',
      'failed'
    );
  end if;
end $$;

create table if not exists public.exercise_video_jobs (
  id uuid primary key default gen_random_uuid(),
  exercise_template_id uuid not null references public.exercise_templates(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  status public.exercise_video_job_status not null default 'queued',
  prompt text,
  provider text,
  provider_job_id text,
  video_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_exercise_video_jobs_template
  on public.exercise_video_jobs(exercise_template_id);
create index if not exists idx_exercise_video_jobs_status
  on public.exercise_video_jobs(status);
create index if not exists idx_exercise_video_jobs_created
  on public.exercise_video_jobs(created_at desc);

alter table public.exercise_video_jobs enable row level security;

drop policy if exists "Therapists can manage exercise video jobs" on public.exercise_video_jobs;
create policy "Therapists can manage exercise video jobs"
  on public.exercise_video_jobs
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'therapist'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'therapist'
    )
  );

drop policy if exists "Admins can manage exercise video jobs" on public.exercise_video_jobs;
create policy "Admins can manage exercise video jobs"
  on public.exercise_video_jobs
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
