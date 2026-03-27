-- Add optional video call URL to appointments (Zoom, Google Meet, Whereby, etc.)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS video_call_url TEXT;

COMMENT ON COLUMN public.appointments.video_call_url IS 'Optional meeting link for video calls (Zoom, Google Meet, Whereby, etc.)';
