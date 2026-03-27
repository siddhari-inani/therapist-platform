-- =============================================================================
-- Messaging Portal: Secure therapist-to-therapist messaging
-- =============================================================================
-- HIPAA-aware: messages stored server-side, RLS enforced.
-- Optional patient_id links a thread to a patient for context.
-- =============================================================================

CREATE TABLE public.messages (
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

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_patient ON public.messages(patient_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Therapists can read messages they sent or received (use helper to avoid recursion)
CREATE POLICY "Therapists can read own messages"
  ON public.messages FOR SELECT
  USING (
    public.is_therapist(auth.uid())
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

-- Therapists can insert messages they send
CREATE POLICY "Therapists can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    public.is_therapist(auth.uid())
    AND sender_id = auth.uid()
    AND public.is_therapist(recipient_id)
  );

-- Recipients can update read_at (mark as read)
CREATE POLICY "Recipients can mark messages read"
  ON public.messages FOR UPDATE
  USING (
    public.is_therapist(auth.uid())
    AND recipient_id = auth.uid()
  )
  WITH CHECK (
    recipient_id = auth.uid()
  );

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
  ON public.messages FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================================================
-- Therapists can read other therapists' profiles (for messaging recipient list)
-- =============================================================================
CREATE POLICY "Therapists can read therapist profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_therapist(auth.uid())
    AND profiles.role = 'therapist'
    AND profiles.id != auth.uid()
  );

-- =============================================================================
-- Mark message as read (safe update: only sets read_at)
-- =============================================================================
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
