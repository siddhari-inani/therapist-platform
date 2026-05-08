-- PT-ready onboarding, scoped patient access, and curated exercise library foundation.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Therapist onboarding metadata.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Explicit therapist-patient ownership. Existing appointment relationships still grant access.
CREATE TABLE IF NOT EXISTS public.patient_therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_status TEXT NOT NULL DEFAULT 'active'
    CHECK (relationship_status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, therapist_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_therapists_patient ON public.patient_therapists(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_therapists_therapist ON public.patient_therapists(therapist_id);

ALTER TABLE public.patient_therapists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Therapists can read their patient relationships" ON public.patient_therapists;
CREATE POLICY "Therapists can read their patient relationships"
  ON public.patient_therapists FOR SELECT
  USING (therapist_id = auth.uid());

DROP POLICY IF EXISTS "Therapists can manage their patient relationships" ON public.patient_therapists;
CREATE POLICY "Therapists can manage their patient relationships"
  ON public.patient_therapists FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Replace broad patient profile access with scoped access.
DROP POLICY IF EXISTS "Therapists can read patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Therapists can update patient profiles" ON public.profiles;

CREATE POLICY "Therapists can read assigned patient profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_therapist(auth.uid())
    AND profiles.role = 'patient'
    AND (
      EXISTS (
        SELECT 1 FROM public.patient_therapists pt
        WHERE pt.patient_id = profiles.id
          AND pt.therapist_id = auth.uid()
          AND pt.relationship_status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = profiles.id
          AND a.therapist_id = auth.uid()
      )
    )
  );

CREATE POLICY "Therapists can update assigned patient profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.is_therapist(auth.uid())
    AND profiles.role = 'patient'
    AND (
      EXISTS (
        SELECT 1 FROM public.patient_therapists pt
        WHERE pt.patient_id = profiles.id
          AND pt.therapist_id = auth.uid()
          AND pt.relationship_status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = profiles.id
          AND a.therapist_id = auth.uid()
      )
    )
  )
  WITH CHECK (public.is_therapist(auth.uid()) AND profiles.role = 'patient');

-- Update patient creation RPC to attach the patient to the creating therapist.
CREATE OR REPLACE FUNCTION public.create_patient_profile(
  patient_email TEXT,
  patient_full_name TEXT DEFAULT NULL,
  patient_phone TEXT DEFAULT NULL,
  patient_dob DATE DEFAULT NULL,
  patient_insurance_provider TEXT DEFAULT NULL,
  patient_insurance_id TEXT DEFAULT NULL,
  patient_emergency_contact_name TEXT DEFAULT NULL,
  patient_emergency_contact_phone TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  therapist_profile public.profiles;
  new_patient_id UUID;
  new_patient_profile public.profiles;
BEGIN
  SELECT * INTO therapist_profile
  FROM public.profiles
  WHERE id = auth.uid() AND role = 'therapist';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only therapists can create patient profiles';
  END IF;

  new_patient_id := uuid_generate_v4();

  INSERT INTO public.profiles (
    id,
    role,
    email,
    full_name,
    phone,
    date_of_birth,
    insurance_provider,
    insurance_id,
    emergency_contact_name,
    emergency_contact_phone
  )
  VALUES (
    new_patient_id,
    'patient',
    patient_email,
    patient_full_name,
    patient_phone,
    patient_dob,
    patient_insurance_provider,
    patient_insurance_id,
    patient_emergency_contact_name,
    patient_emergency_contact_phone
  )
  RETURNING * INTO new_patient_profile;

  INSERT INTO public.patient_therapists (patient_id, therapist_id)
  VALUES (new_patient_profile.id, auth.uid())
  ON CONFLICT (patient_id, therapist_id)
  DO UPDATE SET relationship_status = 'active';

  RETURN new_patient_profile;
END;
$$;

-- Therapist invite table. API routes use service role; RLS still prevents client leakage.
CREATE TABLE IF NOT EXISTS public.therapist_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'therapist' CHECK (role IN ('therapist', 'admin')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapist_invites_email ON public.therapist_invites(email);
CREATE INDEX IF NOT EXISTS idx_therapist_invites_status ON public.therapist_invites(status);
CREATE INDEX IF NOT EXISTS idx_therapist_invites_token ON public.therapist_invites(token);

ALTER TABLE public.therapist_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage therapist invites" ON public.therapist_invites;
CREATE POLICY "Admins can manage therapist invites"
  ON public.therapist_invites FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Exercise library and assignment tables.
CREATE TABLE IF NOT EXISTS public.exercise_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  body_region TEXT,
  recovery_phase TEXT,
  goal TEXT,
  equipment TEXT,
  difficulty TEXT,
  precautions TEXT,
  image_url TEXT,
  video_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_curated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_exercise_templates_name ON public.exercise_templates(name);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_body_region ON public.exercise_templates(body_region);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_goal ON public.exercise_templates(goal);

CREATE TABLE IF NOT EXISTS public.exercise_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_plans_patient ON public.exercise_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_plans_therapist ON public.exercise_plans(therapist_id);

CREATE TABLE IF NOT EXISTS public.exercise_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_plan_id UUID NOT NULL REFERENCES public.exercise_plans(id) ON DELETE CASCADE,
  exercise_template_id UUID NOT NULL REFERENCES public.exercise_templates(id) ON DELETE RESTRICT,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  sets INTEGER,
  reps INTEGER,
  hold_seconds INTEGER,
  rest_seconds INTEGER,
  frequency_per_week INTEGER,
  days_of_week TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_plan_items_plan ON public.exercise_plan_items(exercise_plan_id);

CREATE TABLE IF NOT EXISTS public.exercise_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_plan_id UUID REFERENCES public.exercise_plans(id) ON DELETE SET NULL,
  exercise_plan_item_id UUID REFERENCES public.exercise_plan_items(id) ON DELETE SET NULL,
  exercise_template_id UUID REFERENCES public.exercise_templates(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_sets_completed INTEGER,
  total_reps_completed INTEGER,
  average_pain_score INTEGER,
  average_effort INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_patient ON public.exercise_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_plan ON public.exercise_sessions(exercise_plan_id);

CREATE TABLE IF NOT EXISTS public.exercise_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_plan_id UUID REFERENCES public.exercise_plans(id) ON DELETE SET NULL,
  exercise_plan_item_id UUID REFERENCES public.exercise_plan_items(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  title TEXT NOT NULL,
  body TEXT,
  is_patient_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_patient ON public.exercise_recommendations(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_plan ON public.exercise_recommendations(exercise_plan_id);

CREATE TABLE IF NOT EXISTS public.exercise_form_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_session_id UUID NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raw_metrics JSONB,
  form_score INTEGER,
  flags TEXT[],
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_form_feedback_session ON public.exercise_form_feedback(exercise_session_id);

ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_form_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Therapists can read exercise templates" ON public.exercise_templates;
CREATE POLICY "Therapists can read exercise templates"
  ON public.exercise_templates FOR SELECT
  USING (public.is_therapist(auth.uid()) OR is_curated OR created_by = auth.uid());

DROP POLICY IF EXISTS "Therapists can create exercise templates" ON public.exercise_templates;
CREATE POLICY "Therapists can create exercise templates"
  ON public.exercise_templates FOR INSERT
  WITH CHECK (public.is_therapist(auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Therapists can manage own exercise templates" ON public.exercise_templates;
CREATE POLICY "Therapists can manage own exercise templates"
  ON public.exercise_templates FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Therapists can manage exercise plans" ON public.exercise_plans;
CREATE POLICY "Therapists can manage exercise plans"
  ON public.exercise_plans FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

DROP POLICY IF EXISTS "Patients can read own exercise plans" ON public.exercise_plans;
CREATE POLICY "Patients can read own exercise plans"
  ON public.exercise_plans FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Therapists can manage exercise plan items" ON public.exercise_plan_items;
CREATE POLICY "Therapists can manage exercise plan items"
  ON public.exercise_plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = exercise_plan_items.exercise_plan_id
        AND p.therapist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = exercise_plan_items.exercise_plan_id
        AND p.therapist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can read own exercise plan items" ON public.exercise_plan_items;
CREATE POLICY "Patients can read own exercise plan items"
  ON public.exercise_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = exercise_plan_items.exercise_plan_id
        AND p.patient_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Patients can create own exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Patients can create own exercise sessions"
  ON public.exercise_sessions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "Patients can read own exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Patients can read own exercise sessions"
  ON public.exercise_sessions FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Therapists can read patient exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Therapists can read patient exercise sessions"
  ON public.exercise_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_plans p
      WHERE p.id = exercise_sessions.exercise_plan_id
        AND p.therapist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Therapists can manage exercise recommendations" ON public.exercise_recommendations;
CREATE POLICY "Therapists can manage exercise recommendations"
  ON public.exercise_recommendations FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

DROP POLICY IF EXISTS "Patients can read visible exercise recommendations" ON public.exercise_recommendations;
CREATE POLICY "Patients can read visible exercise recommendations"
  ON public.exercise_recommendations FOR SELECT
  USING (patient_id = auth.uid() AND is_patient_visible);

DROP POLICY IF EXISTS "Patients can create own exercise feedback" ON public.exercise_form_feedback;
CREATE POLICY "Patients can create own exercise feedback"
  ON public.exercise_form_feedback FOR INSERT
  WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "Therapists can read patient exercise feedback" ON public.exercise_form_feedback;
CREATE POLICY "Therapists can read patient exercise feedback"
  ON public.exercise_form_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.exercise_sessions s
      JOIN public.exercise_plans p ON p.id = s.exercise_plan_id
      WHERE s.id = exercise_form_feedback.exercise_session_id
        AND p.therapist_id = auth.uid()
    )
  );

INSERT INTO public.exercise_templates (
  id, name, description, body_region, recovery_phase, goal, equipment, difficulty, precautions, is_curated
)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Heel Slides', 'Supine knee flexion and extension for early post-op mobility.', 'Knee', 'Early mobility', 'Range of motion', 'None', 'Beginner', 'Stay within surgeon or therapist range limits.', TRUE),
  ('11111111-1111-4111-8111-111111111102', 'Quad Sets', 'Isometric quadriceps activation with the knee supported in extension.', 'Knee', 'Early activation', 'Strength', 'Towel roll', 'Beginner', 'Avoid breath holding.', TRUE),
  ('11111111-1111-4111-8111-111111111103', 'Straight Leg Raise', 'Controlled hip flexion while maintaining terminal knee extension.', 'Knee', 'Strength', 'Strength', 'None', 'Beginner', 'Stop if extensor lag appears.', TRUE),
  ('11111111-1111-4111-8111-111111111104', 'Clamshell', 'Side-lying hip external rotation for glute med activation.', 'Hip', 'Motor control', 'Hip stability', 'Mini band optional', 'Beginner', 'Keep pelvis stacked and avoid rolling back.', TRUE),
  ('11111111-1111-4111-8111-111111111105', 'Single-Leg Bridge', 'Posterior chain strengthening with pelvic control emphasis.', 'Hip', 'Strength', 'Strength', 'None', 'Intermediate', 'Avoid lumbar extension or hamstring cramping.', TRUE),
  ('11111111-1111-4111-8111-111111111106', 'Scapular Retraction', 'Seated or standing scapular setting for postural control.', 'Shoulder', 'Early activation', 'Posture', 'None', 'Beginner', 'Avoid shrugging shoulders.', TRUE),
  ('11111111-1111-4111-8111-111111111107', 'Shoulder External Rotation Isometric', 'Gentle rotator cuff activation at neutral.', 'Shoulder', 'Early activation', 'Rotator cuff control', 'Wall or towel', 'Beginner', 'Use light pressure and stay pain-free.', TRUE),
  ('11111111-1111-4111-8111-111111111108', 'Wall Slides', 'Assisted shoulder flexion with scapular upward rotation.', 'Shoulder', 'Mobility', 'Range of motion', 'Wall', 'Beginner', 'Stop before painful pinching.', TRUE),
  ('11111111-1111-4111-8111-111111111109', 'Dead Bug', 'Supine core control with alternating arm and leg movement.', 'Lumbar spine', 'Motor control', 'Core stability', 'None', 'Intermediate', 'Maintain neutral spine and steady breathing.', TRUE),
  ('11111111-1111-4111-8111-111111111110', 'Bird Dog', 'Quadruped trunk stability with alternating limb reach.', 'Lumbar spine', 'Motor control', 'Core stability', 'None', 'Intermediate', 'Avoid trunk rotation.', TRUE),
  ('11111111-1111-4111-8111-111111111111', 'Sit-to-Stand', 'Functional lower-extremity strengthening from a chair.', 'Functional', 'Strength', 'Functional strength', 'Chair', 'Beginner', 'Keep knees tracking over toes.', TRUE),
  ('11111111-1111-4111-8111-111111111112', 'Tandem Balance', 'Static balance training with narrow base of support.', 'Balance', 'Balance', 'Fall prevention', 'Counter support', 'Beginner', 'Use support as needed for safety.', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  body_region = EXCLUDED.body_region,
  recovery_phase = EXCLUDED.recovery_phase,
  goal = EXCLUDED.goal,
  equipment = EXCLUDED.equipment,
  difficulty = EXCLUDED.difficulty,
  precautions = EXCLUDED.precautions,
  is_curated = TRUE;
