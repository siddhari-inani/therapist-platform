-- =============================================================================
-- CREATE MESSAGES TABLE - Run this in Supabase SQL Editor
-- =============================================================================
-- Use this if you get "Could not find the table 'public.messages' in the schema cache".
-- Run the entire script in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- =============================================================================

-- 1. Ensure helper functions exist (required for RLS)
CREATE OR REPLACE FUNCTION public.is_therapist(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'therapist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Create messages table (skip if already exists)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_no_self_send CHECK (sender_id != recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON public.messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (avoid duplicates)
DROP POLICY IF EXISTS "Therapists can read own messages" ON public.messages;
DROP POLICY IF EXISTS "Therapists can send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages read" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

-- 5. Create policies
CREATE POLICY "Therapists can read own messages"
  ON public.messages FOR SELECT
  USING (
    public.is_therapist(auth.uid())
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

CREATE POLICY "Therapists can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    public.is_therapist(auth.uid())
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = recipient_id AND p.role = 'patient'
    )
  );

CREATE POLICY "Recipients can mark messages read"
  ON public.messages FOR UPDATE
  USING (
    public.is_therapist(auth.uid())
    AND recipient_id = auth.uid()
  )
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all messages"
  ON public.messages FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. mark_message_read function
CREATE OR REPLACE FUNCTION public.mark_message_read(msg_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = COALESCE(read_at, NOW())
  WHERE id = msg_id
    AND recipient_id = auth.uid()
    AND public.is_therapist(auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_message_read TO authenticated;

-- Done. You can verify with: SELECT * FROM public.messages LIMIT 1;
