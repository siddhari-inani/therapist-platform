-- Medical Records (SOAP Notes) for HIPAA-compliant charting
-- Supports drafts, version control, and body map annotations

CREATE TYPE public.record_status AS ENUM (
  'draft',
  'finalized',
  'amended'
);

CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- SOAP Note fields
  subjective TEXT,  -- Patient's description of symptoms
  objective TEXT,    -- Therapist's observations, measurements
  assessment TEXT,  -- Clinical assessment and diagnosis
  plan TEXT,        -- Treatment plan and goals
  
  -- Body Map: JSON array of pain points
  -- Format: [{"x": 0.5, "y": 0.3, "side": "front", "intensity": 7, "note": "Sharp pain"}]
  body_map_annotations JSONB DEFAULT '[]'::jsonb,
  
  -- Version control
  status public.record_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  parent_record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  
  -- Audit fields
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.profiles(id),
  therapist_signature TEXT,  -- Encrypted/hashed signature
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT medical_records_therapist_patient CHECK (therapist_id != patient_id)
);

CREATE INDEX idx_medical_records_appointment ON public.medical_records(appointment_id);
CREATE INDEX idx_medical_records_therapist ON public.medical_records(therapist_id);
CREATE INDEX idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_status ON public.medical_records(status);
CREATE INDEX idx_medical_records_parent ON public.medical_records(parent_record_id);

CREATE TRIGGER medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Therapists can manage their own records
CREATE POLICY "Therapists can manage their records"
  ON public.medical_records FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Patients can read their own records (read-only)
CREATE POLICY "Patients can read their records"
  ON public.medical_records FOR SELECT
  USING (patient_id = auth.uid());

-- Admins can manage all records
CREATE POLICY "Admins can manage all records"
  ON public.medical_records FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Function to finalize a record (creates a new version if amending)
CREATE OR REPLACE FUNCTION public.finalize_medical_record(record_id UUID)
RETURNS UUID AS $$
DECLARE
  new_version_id UUID;
  current_status public.record_status;
  current_version INTEGER;
BEGIN
  -- Get current record status
  SELECT status, version INTO current_status, current_version
  FROM public.medical_records
  WHERE id = record_id;
  
  -- If already finalized, create an amendment (new version)
  IF current_status = 'finalized' THEN
    INSERT INTO public.medical_records (
      appointment_id,
      therapist_id,
      patient_id,
      subjective,
      objective,
      assessment,
      plan,
      body_map_annotations,
      status,
      version,
      parent_record_id
    )
    SELECT 
      appointment_id,
      therapist_id,
      patient_id,
      subjective,
      objective,
      assessment,
      plan,
      body_map_annotations,
      'finalized',
      current_version + 1,
      record_id
    FROM public.medical_records
    WHERE id = record_id
    RETURNING id INTO new_version_id;
    
    -- Update old record to 'amended'
    UPDATE public.medical_records
    SET status = 'amended'
    WHERE id = record_id;
    
    RETURN new_version_id;
  ELSE
    -- Finalize the draft
    UPDATE public.medical_records
    SET 
      status = 'finalized',
      finalized_at = NOW(),
      finalized_by = auth.uid(),
      therapist_signature = encode(digest(auth.uid()::text || NOW()::text, 'sha256'), 'hex')
    WHERE id = record_id;
    
    RETURN record_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
