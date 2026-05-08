import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body?.token ?? "").trim();
  const password = String(body?.password ?? "");
  const fullName = String(body?.full_name ?? "").trim();
  const licenseNumber = String(body?.license_number ?? "").trim();
  const specialties = Array.isArray(body?.specialties)
    ? body.specialties.map((value: unknown) => String(value).trim()).filter(Boolean)
    : String(body?.specialties ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
  const timezone = String(body?.timezone ?? "America/New_York").trim();

  if (!token || !password || !fullName || !licenseNumber) {
    return NextResponse.json(
      { error: "Invite token, password, full name, and license number are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const db = supabase as any;

  const { data: invite, error: inviteError } = await db
    .from("therapist_invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    await db.from("therapist_invites").update({ status: "expired" }).eq("id", invite.id);
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: {
      role: invite.role,
      full_name: fullName,
    },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Unable to create account" }, { status: 400 });
  }

  const { error: profileError } = await db.from("profiles").upsert({
    id: created.user.id,
    email: invite.email,
    role: invite.role,
    full_name: fullName,
    license_number: licenseNumber,
    specialties,
    timezone,
    onboarding_completed_at: new Date().toISOString(),
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await db
    .from("therapist_invites")
    .update({
      status: "accepted",
      accepted_by: created.user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true, email: invite.email });
}
