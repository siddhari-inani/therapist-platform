-- Payments and Stripe integration for therapist platform
-- Run after profiles and appointments exist.

-- Stripe fields on profiles (therapists: Connect account; patients: customer id)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON public.profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Payments: one record per payment (session fee, etc.)
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'canceled'
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status public.payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_charge_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_no_self_payment CHECK (therapist_id != patient_id)
);

CREATE INDEX idx_payments_therapist ON public.payments(therapist_id);
CREATE INDEX idx_payments_patient ON public.payments(patient_id);
CREATE INDEX idx_payments_appointment ON public.payments(appointment_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE UNIQUE INDEX idx_payments_stripe_session ON public.payments(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Therapists see payments for their appointments; patients see their own payments; admins see all
CREATE POLICY "Therapists can manage their payments"
  ON public.payments FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Patients can read their payments"
  ON public.payments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Service role / webhook can insert/update via service key; app uses anon + RLS for user flows
-- (Stripe webhook will use Supabase service role or a dedicated API route with server-side Stripe SDK)
