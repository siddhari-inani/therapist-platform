-- =============================================================================
-- Messaging: Therapist → Patient (not therapist-to-therapist)
-- =============================================================================
-- Allow therapists to send messages TO patients.
-- Patients don't have auth; messages are stored for when patient portal exists.
-- =============================================================================

-- Drop therapist-only recipient restriction
DROP POLICY IF EXISTS "Therapists can send messages" ON public.messages;

-- Therapists can send messages (to patients)
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

-- Remove "Therapists can read therapist profiles" (no longer needed for messaging)
DROP POLICY IF EXISTS "Therapists can read therapist profiles" ON public.profiles;

-- mark_message_read: only when recipient is current user (therapist).
-- Patient threads: therapist is always sender, so we never mark those as read from therapist side.
-- Keep RPC as-is for future patient portal.
