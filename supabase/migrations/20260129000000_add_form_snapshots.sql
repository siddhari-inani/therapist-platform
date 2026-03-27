-- Form snapshots for visual \"form over time\" stick figures

CREATE TYPE public.form_pattern AS ENUM (
  'squat',
  'shoulder',
  'knee',
  'gait'
);

CREATE TABLE public.form_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,

  pattern public.form_pattern NOT NULL,
  label TEXT,
  joints JSONB NOT NULL, -- matches stick-form-timeline joints shape

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_snapshots_therapist ON public.form_snapshots(therapist_id);
CREATE INDEX idx_form_snapshots_patient ON public.form_snapshots(patient_id);
CREATE INDEX idx_form_snapshots_record ON public.form_snapshots(medical_record_id);
CREATE INDEX idx_form_snapshots_pattern ON public.form_snapshots(pattern);

ALTER TABLE public.form_snapshots ENABLE ROW LEVEL SECURITY;

-- Therapists can manage their own snapshots
CREATE POLICY "Therapists can manage form snapshots"
  ON public.form_snapshots FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Patients can read their own snapshots
CREATE POLICY "Patients can read form snapshots"
  ON public.form_snapshots FOR SELECT
  USING (patient_id = auth.uid());

-- Admins can manage all snapshots
CREATE POLICY "Admins can manage all form snapshots"
  ON public.form_snapshots FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

