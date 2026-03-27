-- Recovery Milestones Table
-- Tracks patient recovery progress from initial evaluation to discharge

CREATE TYPE public.milestone_status AS ENUM (
  'completed',
  'in_progress',
  'future'
);

CREATE TYPE public.milestone_category AS ENUM (
  'surgery',
  'rom_goal',
  'strength_goal',
  'functional_goal',
  'discharge',
  'initial_evaluation',
  'other'
);

CREATE TABLE public.recovery_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.milestone_status NOT NULL DEFAULT 'future',
  category public.milestone_category NOT NULL DEFAULT 'other',
  target_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT milestones_completed_date_only_when_completed CHECK (
    (status = 'completed' AND completed_date IS NOT NULL) OR
    (status IN ('future', 'in_progress') AND completed_date IS NULL)
  )
);

CREATE INDEX idx_recovery_milestones_patient ON public.recovery_milestones(patient_id);
CREATE INDEX idx_recovery_milestones_therapist ON public.recovery_milestones(therapist_id);
CREATE INDEX idx_recovery_milestones_status ON public.recovery_milestones(status);
CREATE INDEX idx_recovery_milestones_target_date ON public.recovery_milestones(target_date);

CREATE TRIGGER recovery_milestones_updated_at
  BEFORE UPDATE ON public.recovery_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.recovery_milestones ENABLE ROW LEVEL SECURITY;

-- Therapists can manage milestones for their patients
CREATE POLICY "Therapists can manage patient milestones"
  ON public.recovery_milestones FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Patients can read their own milestones
CREATE POLICY "Patients can read their milestones"
  ON public.recovery_milestones FOR SELECT
  USING (patient_id = auth.uid());

-- Admins can manage all milestones
CREATE POLICY "Admins can manage all milestones"
  ON public.recovery_milestones FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
