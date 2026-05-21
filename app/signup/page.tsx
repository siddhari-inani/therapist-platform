"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        const message = "Supabase is not configured. Please check your .env.local file.";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/dashboard/profile`
          : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            role: "therapist",
            full_name: trimmedName,
          },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        const message = signUpError.message || "Unable to create account.";
        setError(message);
        toast.error("Signup failed", { description: message });
        setLoading(false);
        return;
      }

      // Supabase returns a user with `identities: []` when the email is
      // already registered (and "Confirm email" is on) so the existing user
      // is not leaked. Surface a friendly error for that case.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const message =
          "That email is already registered. Try signing in instead, or use a different email.";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      setSent(true);
      toast.success("Almost there", {
        description: "Check your email to confirm your account.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong creating your account.";
      setError(message);
      toast.error("Signup error", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-lime-50/40 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.05] bg-[size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 dark:bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/20 dark:bg-lime-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-scale-in">
        <Card className="border border-white/40 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3 justify-center mb-2">
              <img
                src="/platform-logo.png"
                alt="Revora Health logo"
                className="h-8 w-8 object-contain"
              />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-lime-600 bg-clip-text text-transparent">
                Revora Health
              </CardTitle>
            </div>
            <CardDescription className="text-center text-base">
              {sent
                ? "We sent you a confirmation email."
                : "Create your physical therapist account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sent ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">Confirm your email to finish</p>
                    <p>
                      We sent a link to <span className="font-medium">{email}</span>. Click it to
                      activate your account, then sign in.
                    </p>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
                      Don&apos;t see it? Check your spam folder.
                    </p>
                  </div>
                </div>
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full h-11 text-base font-medium">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSignup} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg text-sm text-destructive animate-fade-in-up">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="full_name"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Full Name
                    </label>
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Jane Doe, PT, DPT"
                      autoComplete="name"
                      disabled={loading}
                      className="h-11 border-2 border-slate-200/80 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors rounded-xl bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Work Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@clinic.com"
                      autoComplete="email"
                      disabled={loading}
                      className="h-11 border-2 border-slate-200/80 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors rounded-xl bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 border-2 border-slate-200/80 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors rounded-xl bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirm_password"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Confirm Password
                    </label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 border-2 border-slate-200/80 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors rounded-xl bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Creating account...
                      </span>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  After confirming your email you&apos;ll be asked for your license number and a
                  few practice details before you can see patient data.
                </p>

                <div className="pt-4 border-t border-white/40 dark:border-white/10 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Already have an account? Sign in
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
