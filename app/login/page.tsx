"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        const errorMsg = "Supabase is not configured. Please check your .env.local file.";
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        console.error("Error code:", signInError.status);
        console.error("Full error:", JSON.stringify(signInError, null, 2));
        
        // Provide more helpful error messages
        let errorMsg = "";
        if (signInError.message.includes("Invalid login credentials") || signInError.status === 400) {
          errorMsg = "Invalid email or password. Please check your credentials and try again.";
        } else if (signInError.message.includes("Email not confirmed")) {
          errorMsg = "Email not confirmed. Please check your email for a confirmation link.";
        } else {
          errorMsg = signInError.message || "An error occurred during login.";
        }
        setError(errorMsg);
        toast.error("Login failed", {
          description: errorMsg,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("Login successful, user:", data.user.email);
        toast.success("Login successful", {
          description: `Welcome back, ${data.user.email}`,
        });
        
        // Verify session was created
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("Session created:", session.user.email);
          // Wait a moment for cookies to be set
          await new Promise((resolve) => setTimeout(resolve, 200));
          window.location.href = "/dashboard";
        } else {
          const errorMsg = "Login succeeded but session not created. Please try again.";
          setError(errorMsg);
          toast.error(errorMsg);
          setLoading(false);
        }
      } else {
        const errorMsg = "Login failed. No user data returned.";
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      const errorMsg = err.message || "An unexpected error occurred. Please try again.";
      setError(errorMsg);
      toast.error("Login error", {
        description: errorMsg,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-lime-50/40 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.05] bg-[size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 dark:bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/20 dark:bg-lime-500/10 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md animate-scale-in">
        <Card className="border border-white/40 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3 justify-center mb-2">
              <img src="/platform-logo.png" alt="Revora Health logo" className="h-8 w-8 object-contain" />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-lime-600 bg-clip-text text-transparent">
                Revora Health
              </CardTitle>
            </div>
            <CardDescription className="text-center text-base">
              Sign in to your practice management account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg text-sm text-destructive animate-fade-in-up">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 border-2 border-slate-200/80 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors rounded-xl bg-white/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base font-medium border-2 border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("revora_demo_mode", "true");
                    window.location.href = "/dashboard";
                  }
                }}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Try demo (no login)
              </Button>
            </form>
            
            <div className="pt-4 border-t border-white/40 dark:border-white/10">
              <div className="text-sm text-muted-foreground space-y-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Need test credentials?</p>
                <div className="text-xs space-y-2 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/40 dark:border-white/10 backdrop-blur-sm">
                  <p><strong className="text-slate-900 dark:text-slate-100">Step 1:</strong> Go to Supabase Dashboard → Authentication → Users</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Step 2:</strong> Click &quot;Add user&quot; → &quot;Create new user&quot;</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Step 3:</strong> Enter:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>Email: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-900 dark:text-slate-100 font-mono">therapist@example.com</code></li>
                    <li>Password: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-900 dark:text-slate-100 font-mono">Therapist123!</code></li>
                    <li>Auto Confirm: ✅</li>
                    <li>User Metadata: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-900 dark:text-slate-100 font-mono text-[10px]">{"{role: 'therapist', full_name: 'Dr. Jane Smith'}"}</code></li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                  <strong>Note:</strong> Make sure your <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">.env.local</code> file has your Supabase credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
