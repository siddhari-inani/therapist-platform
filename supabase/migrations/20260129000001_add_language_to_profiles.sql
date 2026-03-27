-- Add language preference column to profiles table

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.language IS 'User language preference (ISO 639-1 code, e.g., en, es, fr)';
