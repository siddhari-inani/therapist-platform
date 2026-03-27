import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;
      const patientId = session.metadata?.patient_id;

      if (paymentId) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "succeeded",
            stripe_payment_intent_id: session.payment_intent as string ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId);

        if (updateError) {
          console.error("Payment update error:", updateError);
        }
      }

      // Save Stripe customer id to profile for future payments (if session has customer)
      if (patientId && session.customer) {
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer.id;
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", patientId);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;
      if (paymentId) {
        await supabase
          .from("payments")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = paymentIntent.metadata?.payment_id;
      if (paymentId) {
        await supabase
          .from("payments")
          .update({
            status: "failed",
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId);
      }
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}
