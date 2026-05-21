import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Handles Supabase Auth email-confirmation and OAuth callbacks. The link
// Supabase sends after sign-up lands here with `?code=...`; we exchange the
// code for a session, set the session cookies, then redirect into the app.
//
// `next` allows the caller (e.g. the /signup page) to suggest a follow-up
// route. Defaults to /dashboard, which AuthGate will push to /dashboard/profile
// if onboarding isn't complete.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const next = url.searchParams.get("next") ?? "/onboarding";

  if (errorParam) {
    const failure = new URL("/login", url.origin);
    failure.searchParams.set("error", errorParam);
    return NextResponse.redirect(failure);
  }

  if (!code) {
    const failure = new URL("/login", url.origin);
    failure.searchParams.set("error", "Missing confirmation code.");
    return NextResponse.redirect(failure);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failure = new URL("/login", url.origin);
    failure.searchParams.set(
      "error",
      error.message || "We couldn't confirm that link. Try signing in or request a new confirmation email."
    );
    return NextResponse.redirect(failure);
  }

  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
