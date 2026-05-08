import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function getCurrentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function GET() {
  const { user, profile } = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServiceClient();
  const { data, error } = await (supabase as any)
    .from("therapist_invites")
    .select("id, email, role, status, token, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ invites: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile?.role !== "admin") return NextResponse.json({ error: "Only admins can invite therapists" }, { status: 403 });

  const body = await request.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = body?.role === "admin" ? "admin" : "therapist";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const supabase = createServiceClient();
  const { data, error } = await (supabase as any)
    .from("therapist_invites")
    .insert({
      email,
      role,
      token,
      status: "pending",
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, email, role, status, token, expires_at, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ invite: data }, { status: 201 });
}
