"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LoginTestPage() {
  const [email, setEmail] = useState("therapist@example.com");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const testLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log("Testing login with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          status: error.status,
          fullError: error,
        });
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        setResult({
          success: true,
          user: data.user,
          session: session,
          message: "Login successful!",
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
        fullError: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    setLoading(true);
    setResult(null);

    try {
      // This will fail if RLS blocks it, but that's okay - we're just testing
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      setResult({
        success: true,
        profileExists: !!data,
        profile: data,
        error: error?.message,
      });
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Login Test & Debug</CardTitle>
          <CardDescription>Test your login credentials and debug issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="therapist@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter password"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testLogin} disabled={loading || !email || !password}>
                {loading ? "Testing..." : "Test Login"}
              </Button>
              <Button onClick={checkUser} variant="outline" disabled={loading || !email}>
                Check User Exists
              </Button>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <h3 className="font-semibold mb-2">
                {result.success ? "✅ Success" : "❌ Error"}
              </h3>
              <pre className="text-xs overflow-auto bg-background p-2 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Troubleshooting Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Make sure user exists in Supabase Dashboard → Authentication → Users</li>
              <li>Verify &quot;Auto Confirm User&quot; was checked when creating the user</li>
              <li>Check that the password matches what you set in Supabase</li>
              <li>Verify profile exists: Run SQL: <code className="bg-muted px-1 rounded">SELECT * FROM profiles WHERE email = &apos;{email}&apos;;</code></li>
              <li>Check browser console (F12) for detailed error messages</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
