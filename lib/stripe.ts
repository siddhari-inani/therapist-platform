import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Returns the Stripe client. Throws if STRIPE_SECRET_KEY is not set.
 * Lazy-initialized so the app doesn't crash at import when the key is missing.
 */
export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env or .env.local.");
  }
  stripeInstance = new Stripe(secretKey, {
    typescript: true,
  });
  return stripeInstance;
}
