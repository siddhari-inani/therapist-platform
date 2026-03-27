import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      appointmentId,
      amountCents,
      therapistId,
      patientId,
      description,
      successUrl,
      cancelUrl,
    } = body as {
      appointmentId?: string;
      amountCents: number;
      therapistId: string;
      patientId: string;
      description?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (
      typeof amountCents !== "number" ||
      amountCents < 100 ||
      !therapistId ||
      !patientId
    ) {
      return NextResponse.json(
        { error: "Invalid amount, therapist, or patient" },
        { status: 400 }
      );
    }

    // Patient paying for their session: current user must be the patient (or therapist creating link)
    const isPatient = user.id === patientId;
    const isTherapist = user.id === therapistId;
    if (!isPatient && !isTherapist) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (request.nextUrl.origin || "http://localhost:3000");
    const success = successUrl ?? `${baseUrl}/dashboard/payments?success=true`;
    const cancel = cancelUrl ?? `${baseUrl}/dashboard/payments?canceled=true`;

    // Get or create Stripe customer for patient (optional; Checkout can create guest)
    let customerId: string | undefined;
    const { data: patientProfile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", patientId)
      .single();

    if (patientProfile?.stripe_customer_id) {
      customerId = patientProfile.stripe_customer_id;
    }

    // Get therapist's Stripe Connect account if using Connect (optional for now we use platform account)
    const { data: therapistProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", therapistId)
      .single();

    const stripeAccountId = therapistProfile?.stripe_account_id ?? undefined;

    // Create a pending payment record so we can match it in the webhook
    const { data: paymentRow, error: insertError } = await supabase
      .from("payments")
      .insert({
        appointment_id: appointmentId ?? null,
        therapist_id: therapistId,
        patient_id: patientId,
        amount_cents: amountCents,
        currency: "usd",
        status: "pending",
        description: description ?? null,
        metadata: {},
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Payment insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amountCents,
              product_data: {
                name: description ?? "Therapy session",
                description: description ?? undefined,
              },
            },
            quantity: 1,
          },
        ],
        success_url: success,
        cancel_url: cancel,
        ...(customerId && { customer: customerId }),
        ...(!customerId && patientProfile?.email && { customer_email: patientProfile.email }),
        metadata: {
          therapist_id: therapistId,
          patient_id: patientId,
          payment_id: paymentRow.id,
          ...(appointmentId && { appointment_id: appointmentId }),
        },
        payment_intent_data: {
          metadata: {
            payment_id: paymentRow.id,
            therapist_id: therapistId,
            patient_id: patientId,
            ...(appointmentId && { appointment_id: appointmentId }),
          },
        },
      },
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    // Store checkout session id on payment so webhook can find it (update by id)
    await supabase
      .from("payments")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      paymentId: paymentRow.id,
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
