import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    const connected = Boolean(profile?.stripe_account_id);
    return NextResponse.json({
      connected,
      accountId: profile?.stripe_account_id ?? null,
    });
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
