# Payments (Stripe) setup

This project uses **Stripe** for accepting payments and **Stripe Connect** so therapists can receive payouts to their own accounts.

## 1. Stripe account and keys

1. Create a [Stripe account](https://dashboard.stripe.com/register) (or use an existing one).
2. In [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys), copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

3. Add to your `.env` (see `.env.example`):

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 2. Database migration

Run the payments migration so the `payments` table and Stripe fields on `profiles` exist:

```bash
npx supabase db push
```

Or run the migration file manually in the Supabase SQL editor:

- `supabase/migrations/20240112000000_add_payments_and_stripe.sql`

## 3. Webhook (required for recording payments)

Stripe sends events (e.g. payment succeeded) to your app. You need a webhook endpoint and secret.

### Option A: Local development with Stripe CLI

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in: `stripe login`
3. Forward events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the **webhook signing secret** (e.g. `whsec_...`) and add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Keep `stripe listen` running while testing payments locally.

### Option B: Production

1. In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks), click **Add endpoint**.
2. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
3. Events to send: at least:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** and set `STRIPE_WEBHOOK_SECRET` in your production environment.

## 4. Service role key (for webhooks)

The webhook handler updates the `payments` table without a user session. It uses Supabase with the **service role** key so it can bypass RLS.

1. In Supabase Dashboard → Project Settings → API, copy the **service_role** key (keep it secret).
2. Add to `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Never expose the service role key to the client or commit it to git.

## 5. Optional: Stripe Connect (therapist payouts)

If you want payments to go to each therapist’s Stripe account (instead of a single platform account):

1. In [Stripe Dashboard → Connect → Settings](https://dashboard.stripe.com/settings/connect), complete the Connect onboarding.
2. For **Express** accounts (used in this app), you don’t need `STRIPE_CONNECT_CLIENT_ID`; the app creates Express accounts via the API.
3. Therapists use **Dashboard → Payments → Connect with Stripe** to onboard; after that, payments can be created with their `stripe_account_id` so funds go to their account.

## 6. Create a payment (API)

To create a Stripe Checkout session (e.g. for a session fee):

**POST** `/api/stripe/create-checkout-session`

Body (JSON):

- `amountCents` (number, required) – amount in cents (e.g. `10000` = $100)
- `therapistId` (string, required)
- `patientId` (string, required)
- `appointmentId` (string, optional)
- `description` (string, optional)
- `successUrl`, `cancelUrl` (string, optional) – override redirect URLs

The response includes `url` (redirect the user to Stripe Checkout) and `sessionId`. After payment, Stripe sends `checkout.session.completed` to your webhook; the app marks the payment as succeeded and shows it on the Payments dashboard.

## 7. Install dependencies

If you haven’t already:

```bash
npm install
```

Stripe packages in use: `stripe` (server), `@stripe/stripe-js` (client, if you add hosted checkout UI later).

## Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes (if using client-side Stripe) | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (from CLI or Dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for webhook) | Supabase service role key |
| `STRIPE_CONNECT_CLIENT_ID` | No | Only for OAuth Connect; not used for Express |

After setting env vars and running the migration, therapists can connect Stripe from **Dashboard → Payments**, and you can create payments via the create-checkout-session API and see them in the Payments overview and recent list.
