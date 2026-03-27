-- Add progress field to recovery_milestones table
-- Progress is a numeric value (0-100) representing percentage completion towards the milestone goal

ALTER TABLE public.recovery_milestones
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

COMMENT ON COLUMN public.recovery_milestones.progress IS 'Progress percentage (0-100) towards achieving this milestone goal';
