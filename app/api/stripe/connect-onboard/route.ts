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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, stripe_account_id, email")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "therapist") {
      return NextResponse.json(
        { error: "Only therapists can connect Stripe" },
        { status: 403 }
      );
    }

    let stripe;
    try {
      stripe = getStripe();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("STRIPE_SECRET_KEY") || !process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
          {
            error:
              "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local. See PAYMENTS_SETUP.md.",
          },
          { status: 503 }
        );
      }
      throw e;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin ||
      "http://localhost:3000";
    const returnUrl = `${baseUrl}/dashboard/payments?stripe_connect=return`;
    const refreshUrl = `${baseUrl}/dashboard/payments?stripe_connect=refresh`;

    if (profile.stripe_account_id) {
      const accountLink = await stripe.accounts.createLoginLink(
        profile.stripe_account_id
      );
      return NextResponse.json({ url: accountLink.url });
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: profile.email ?? undefined,
    });

    await supabase
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("connect-onboard error:", err);
    const message =
      err instanceof Error ? err.message : "Could not start Stripe connection.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

